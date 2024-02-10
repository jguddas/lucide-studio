import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export const POST = auth(async function POST(req) {
  if (!req.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const icon = await req.json();
  const user = JSON.parse(req.auth.user?.image || "");

  const metadata = JSON.stringify(
    {
      $schema: "../icon.schema.json",
      contributors: icon.contributors,
      tags: icon.tags,
      categories: icon.categories,
    },
    null,
    2,
  );

  const branch = `studio/${icon.name}`;

  const octokit = new Octokit({ auth: user.access_token });

  async function getFile(path: string, branch: string) {
    const { data } = await octokit
      .request(`GET /repos/${user.login}/lucide/contents/${path}`, {
        ref: branch,
      })
      .catch(() => ({ data: {} }));

    return data;
  }

  async function createOrUpdateIcon(path: string, content: string) {
    const { sha, content: existingContent } = await getFile(path, branch);

    if (sha && existingContent.trim() === content.trim()) return;

    await octokit.request(`PUT /repos/${user.login}/lucide/contents/${path}`, {
      message: sha ? `Updated ${path}` : `Added ${path}`,
      content: Buffer.from(content.trim() + "\n").toString("base64"),
      branch,
      sha,
    });
  }

  try {
    const {
      data: { sha: mainSha },
    } = await octokit
      .request(`GET /repos/${user.login}/lucide/commits/main`)
      .catch((err) => {
        if (err.status === 404)
          throw new Error(
            `Could not find your fork of lucide! https://github.com/lucide-icons/lucide/fork`,
          );
        throw err;
      });

    await octokit
      .request(`POST /repos/${user.login}/lucide/git/refs`, {
        ref: `refs/heads/${branch}`,
        sha: mainSha,
      })
      .catch((err) => {
        if (err.status !== 422) throw err;
      });

    await createOrUpdateIcon(`icons/${icon.name}.svg`, icon.value);
    await createOrUpdateIcon(`icons/${icon.name}.json`, metadata);

    const isNewIcon = !(await getFile(`icons/${icon.name}.svg`, "main"));

    const pullRequestExisting = await octokit.request(
      `GET /repos/lucide-icons/lucide/pulls`,
      { head: `${user.login}:${branch}`, base: "main" },
    );

    const pullRequestCreationUrl = new URL(
      `https://github.com/lucide-icons/lucide/compare/main...${user.login}:lucide:${branch}`,
    );

    pullRequestCreationUrl.searchParams.append("quick_pull", "1");

    pullRequestCreationUrl.searchParams.append(
      "title",
      `${isNewIcon ? "Add" : "Update"} \`${icon.name}\` icon`,
    );

    return NextResponse.json({
      isNewIcon,
      pullRequestExistingUrl: pullRequestExisting.data.find(
        (val: any) => val?.state === "open",
      )?.html_url,
      pullRequestCreationUrl: pullRequestCreationUrl.toString(),
    });
  } catch (error) {
    return new NextResponse((error as Error).message || "Unknown Error", {
      status: 500,
    });
  }
});
