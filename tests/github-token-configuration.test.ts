import { describe, expect, it } from "vitest";

const token = process.env.GITHUB_TOKEN;
const itWithGitHubToken = token ? it : it.skip;

describe("GitHub同期認証", () => {
  itWithGitHubToken("forcusflow-lab/focus-flowへの読み取り権限を持つ", async () => {
    const response = await fetch("https://api.github.com/repos/forcusflow-lab/focus-flow", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    expect(response.status).toBe(200);
    const repository = await response.json() as { full_name?: string };
    expect(repository.full_name).toBe("forcusflow-lab/focus-flow");
  });
});
