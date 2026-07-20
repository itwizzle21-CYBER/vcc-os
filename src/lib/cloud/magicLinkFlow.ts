export const MAGIC_LINK_COOLDOWN_SECONDS = 60;
export const LOGIN_CODE_MAX_LENGTH = 8;

export function magicLinkRedirectUrl(origin: string, returnPath: string): string {
  const url = new URL(returnPath, origin);
  url.searchParams.set("auth", "confirmed");
  url.searchParams.set("close", "1");
  return url.toString();
}

export function magicLinkRetrySeconds(message: string): number {
  const explicitWait = message.match(/after\s+(\d+)\s+seconds?/i);
  if (explicitWait) return Number(explicitWait[1]);
  return /rate limit|too many requests/i.test(message) ? MAGIC_LINK_COOLDOWN_SECONDS : 0;
}

export function isMagicLinkConfirmation(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get("auth") === "confirmed" && params.get("close") === "1";
}

export function gmailInboxUrl(email: string, userAgent: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const webUrl = `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(normalizedEmail)}`;
  if (!/android/i.test(userAgent)) return webUrl;

  const intentPath = `mail.google.com/mail/u/?authuser=${encodeURIComponent(normalizedEmail)}`;
  return `intent://${intentPath}#Intent;scheme=https;package=com.google.android.gm;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
}

export function prefersGmailApp(userAgent: string): boolean {
  return /android|iphone|ipad|ipod/i.test(userAgent);
}

export function usesAndroidGmailIntent(userAgent: string): boolean {
  return /android/i.test(userAgent);
}

export function gmailActionLabel(userAgent: string): string {
  if (/android/i.test(userAgent)) return "Open official Gmail app";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "Open Gmail for this account";
  return "Open this Gmail inbox";
}

export function shouldAutoCloseConfirmation(hasOpener: boolean, isStandaloneApp: boolean): boolean {
  return hasOpener && !isStandaloneApp;
}

export function normalizeLoginCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, LOGIN_CODE_MAX_LENGTH);
}

export function isCompleteLoginCode(value: string): boolean {
  return /^(?:\d{6}|\d{8})$/.test(value);
}
