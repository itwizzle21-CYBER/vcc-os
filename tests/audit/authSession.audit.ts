import { expect, it } from "vitest";
import { withSyntheticAuth } from "../fixtures/authSession";

it("S2: opening an uninitiated token URL does not adopt or persist another account", async () => {
  await withSyntheticAuth({}, async (client, state) => {
    const result = await client.auth.getSession();
    expect(result.error).toBeNull();
    // The URL and fake server contain invented credentials only. Assert presence
    // rather than printing any session/token fields in failure logs.
    expect({ hasSession: result.data.session !== null, persistedSessions: state.stored.size,
      authRequests: state.requests.length }).toEqual({ hasSession: false, persistedSessions: 0, authRequests: 0 });
    expect(state.events.includes("SIGNED_IN")).toBe(false);
  });
});
