export const MAGIC_LINK_COOLDOWN_SECONDS = 60;

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
