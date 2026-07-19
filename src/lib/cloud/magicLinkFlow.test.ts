import { describe, expect, it } from "vitest";
import { isMagicLinkConfirmation, magicLinkRedirectUrl, magicLinkRetrySeconds } from "./magicLinkFlow";

describe("magic link flow", () => {
  it("builds a production-safe confirmation return URL", () => {
    expect(magicLinkRedirectUrl("https://vcc-os.vercel.app", "/vitascan"))
      .toBe("https://vcc-os.vercel.app/vitascan?auth=confirmed&close=1");
  });

  it("reads the exact Supabase retry delay", () => {
    expect(magicLinkRetrySeconds("For security purposes, you can only request this after 34 seconds."))
      .toBe(34);
    expect(magicLinkRetrySeconds("email rate limit exceeded")).toBe(60);
    expect(magicLinkRetrySeconds("Invalid email")).toBe(0);
  });

  it("only recognizes the intended confirmation callback", () => {
    expect(isMagicLinkConfirmation("?auth=confirmed&close=1")).toBe(true);
    expect(isMagicLinkConfirmation("?auth=confirmed")).toBe(false);
  });
});
