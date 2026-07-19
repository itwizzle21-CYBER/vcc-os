import { describe, expect, it } from "vitest";
import { gmailActionLabel, gmailInboxUrl, isMagicLinkConfirmation, magicLinkRedirectUrl, magicLinkRetrySeconds, prefersGmailApp, shouldAutoCloseConfirmation } from "./magicLinkFlow";

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

  it("pins Gmail web to the requested account", () => {
    expect(gmailInboxUrl("CTRL.Zelli.8@gmail.com ", "Mozilla/5.0 (iPhone)"))
      .toBe("https://mail.google.com/mail/u/?authuser=ctrl.zelli.8%40gmail.com");
  });

  it("opens the official Gmail Android package with an account-safe fallback", () => {
    const url = gmailInboxUrl("ctrl.zelli.8@gmail.com", "Mozilla/5.0 (Linux; Android 15)");
    expect(url).toContain("package=com.google.android.gm");
    expect(url).toContain("authuser=ctrl.zelli.8%40gmail.com");
    expect(url).toContain("browser_fallback_url=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F%3Fauthuser%3Dctrl.zelli.8%2540gmail.com");
  });

  it("labels mobile devices for the Gmail app handoff", () => {
    expect(prefersGmailApp("Mozilla/5.0 (iPhone)")).toBe(true);
    expect(prefersGmailApp("Mozilla/5.0 (Linux; Android 15)")).toBe(true);
    expect(prefersGmailApp("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
    expect(gmailActionLabel("Mozilla/5.0 (Linux; Android 15)")).toBe("Open official Gmail app");
    expect(gmailActionLabel("Mozilla/5.0 (iPhone)")).toBe("Open Gmail for this account");
    expect(gmailActionLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("Open this Gmail inbox");
  });

  it("only auto-closes a real browser popup", () => {
    expect(shouldAutoCloseConfirmation(true, false)).toBe(true);
    expect(shouldAutoCloseConfirmation(false, false)).toBe(false);
    expect(shouldAutoCloseConfirmation(true, true)).toBe(false);
  });
});
