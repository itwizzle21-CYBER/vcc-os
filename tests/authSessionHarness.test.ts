import { expect, it } from "vitest";
import { syntheticUserId, withSyntheticAuth } from "./fixtures/authSession";

it("keeps an empty browser signed out without auth requests", async () => {
  await withSyntheticAuth({ urlTokens: false }, async (client, state) => {
    expect((await client.auth.getSession()).data.session).toBeNull();
    expect(state.requests).toEqual([]);
    expect(state.stored.size).toBe(0);
  });
});

it("ignores supplied URL tokens when callback detection is disabled", async () => {
  await withSyntheticAuth({ detectSessionInUrl: false }, async (client, state) => {
    expect((await client.auth.getSession()).data.session).toBeNull();
    expect(state.requests).toEqual([]);
    expect(state.stored.size).toBe(0);
  });
});

it("still allows explicit code verification with callback detection disabled", async () => {
  await withSyntheticAuth({ detectSessionInUrl: false, urlTokens: false }, async (client, state) => {
    const result = await client.auth.verifyOtp({ email: "synthetic@example.invalid", token: "123456", type: "email" });
    expect(result.error).toBeNull();
    expect(result.data.session?.user.id).toBe(syntheticUserId);
    expect(state.requests).toEqual(["POST /auth/v1/verify"]);
    expect(state.stored.has("vcc-synthetic-auth")).toBe(true);
  });
});
