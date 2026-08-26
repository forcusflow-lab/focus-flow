import { describe, expect, it } from "vitest";

describe("Expoアクセストークン", () => {
  it("Expo GraphQL APIで有効な認証として検証できる", async () => {
    const token = process.env.EXPO_TOKEN;

    expect(token).toBeTruthy();

    const response = await fetch("https://api.expo.dev/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "query { me { id } }" }),
    });

    expect(response.ok).toBe(true);

    const body = (await response.json()) as {
      data?: { me?: { id?: string } };
      errors?: Array<{ message?: string }>;
    };

    expect(body.errors).toBeUndefined();
    expect(body.data?.me?.id).toBeTruthy();
  }, 20_000);
});
