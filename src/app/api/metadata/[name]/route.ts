import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export const GET = auth(async function GET(req) {
  if (!req.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const iconName = new URL(req.url).toString().split("/").at(-1);

  const user = JSON.parse(req.auth.user?.image || "");
  const octokit = new Octokit({ auth: user.access_token });

  const forkExists = await octokit
    .request(`GET /repos/${user.login}/lucide`)
    .catch(() => null);

  if (!forkExists) {
    return NextResponse.json({ forkExists: false });
  }

  try {
    const { data } = await octokit.request(
      `GET /repos/${user.login}/lucide/contents/icons/${iconName}.json`,
      { ref: `studio/${iconName}` },
    );
    return NextResponse.json(
      JSON.parse(Buffer.from(data.content, "base64").toString("utf-8")),
    );
  } catch (error) {}

  const { data } = await octokit.request(
    `GET /repos/${user.login}/lucide/contents/icons/${iconName}.json`,
  );

  return NextResponse.json(
    JSON.parse(Buffer.from(data.content, "base64").toString("utf-8")),
  );
});
