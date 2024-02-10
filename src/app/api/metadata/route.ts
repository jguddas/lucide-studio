import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export const GET = auth(async function GET(req) {
  if (!req.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const iconName = req.params.name;
  const user = JSON.parse(req.auth.user?.image || "");
  const octokit = new Octokit({ auth: user.access_token });

  // get file from github
  const { data } = await octokit.repos.getContent({
    owner: "lucide-icon",
    repo: "lucide",
    path: "icons",
  });
});
