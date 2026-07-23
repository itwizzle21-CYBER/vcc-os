import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const cloudAuthOptions = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
} as const;

const browserStorage = typeof window === "undefined" ? undefined : window.localStorage;

export const cloudConfigured = Boolean(url && key);
export const supabase = cloudConfigured ? createClient(url!, key!, {
  auth: {
    ...cloudAuthOptions,
    ...(browserStorage ? { storage: browserStorage } : {}),
  },
}) : null;
