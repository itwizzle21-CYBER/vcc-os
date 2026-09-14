import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { vi } from "vitest";

const origin = "https://vcc-auth-test.invalid";
export const syntheticUserId = "00000000-0000-4000-8000-000000000001";
const user = {
  id: syntheticUserId, aud: "authenticated", role: "authenticated", is_anonymous: false,
  email: "synthetic@example.invalid", app_metadata: {}, user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const session = () => ({
  access_token: "synthetic-access-token", refresh_token: "synthetic-refresh-token",
  token_type: "bearer", expires_in: 3600, expires_at: Math.round(Date.now() / 1000) + 3600, user,
});

export async function withSyntheticAuth(
  options: { urlTokens?: boolean; detectSessionInUrl?: boolean },
  check: (client: SupabaseClient, state: { requests: string[]; events: string[]; stored: Map<string, string> }) => Promise<void>,
) {
  const stored = new Map<string, string>();
  const storage = {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
    removeItem: (key: string) => { stored.delete(key); },
  };
  const location = new URL("https://vcc-browser-test.invalid/settings");
  if (options.urlTokens !== false) location.hash = new URLSearchParams({
    access_token: "synthetic-access-token", refresh_token: "synthetic-refresh-token",
    token_type: "bearer", expires_in: "3600",
  }).toString();
  const requests: string[] = [];
  const events: string[] = [];
  const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.origin !== origin) throw new Error("The auth harness refuses non-synthetic requests.");
    const method = init?.method ?? "GET";
    requests.push(`${method} ${url.pathname}`);
    if (method === "GET" && url.pathname === "/auth/v1/user") return Response.json(user);
    if (method === "POST" && url.pathname === "/auth/v1/verify") return Response.json(session());
    throw new Error("Unexpected synthetic auth request.");
  });

  vi.stubGlobal("window", { location, localStorage: storage, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal("document", { visibilityState: "hidden" });
  vi.stubGlobal("navigator", {});
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("BroadcastChannel", undefined);
  vi.stubGlobal("fetch", fakeFetch);
  // Import actual VCC options while ensuring its configured singleton stays off.
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
  vi.resetModules();
  let client: SupabaseClient | undefined;
  let unsubscribe = () => {};
  try {
    const { cloudAuthOptions } = await import("../../src/lib/cloud/client");
    client = createClient(origin, "synthetic-publishable-key", {
      auth: { ...cloudAuthOptions, storage, storageKey: "vcc-synthetic-auth",
        detectSessionInUrl: options.detectSessionInUrl ?? cloudAuthOptions.detectSessionInUrl },
      global: { fetch: fakeFetch },
    });
    const listener = client.auth.onAuthStateChange((event) => { events.push(event); });
    unsubscribe = () => listener.data.subscription.unsubscribe();
    await check(client, { requests, events, stored });
  } finally {
    unsubscribe();
    await client?.auth.stopAutoRefresh();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  }
}
