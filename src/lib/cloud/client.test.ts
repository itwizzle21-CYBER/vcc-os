import { describe, expect, it } from "vitest";
import { cloudAuthOptions } from "./client";

describe("Supabase browser session configuration", () => {
  it("keeps and refreshes the signed-in session across mobile app restarts", () => {
    expect(cloudAuthOptions).toEqual({
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    });
  });
});
