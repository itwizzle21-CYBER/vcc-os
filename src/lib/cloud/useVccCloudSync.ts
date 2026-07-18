import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import type { AppData } from "../types/app";
import { cloudConfigured, supabase } from "./client";

export type CloudSyncStatus = "offline" | "signed_out" | "connecting" | "synced" | "saving" | "error";
export type VccCloudSync = {
  configured: boolean;
  status: CloudSyncStatus;
  email: string;
  message: string;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

function deviceId() {
  const key = "vcc-os:device-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}

function isSharedAccount(session: Session | null): session is Session {
  return Boolean(session && !session.user.is_anonymous);
}

function isAppData(value: unknown): value is AppData {
  const candidate = value as Partial<AppData> | null;
  return Boolean(candidate && typeof candidate === "object" && candidate.sections && candidate.settings && candidate.paycheckPlanner);
}

export function useVccCloudSync(data: AppData, applyRemoteData: (data: AppData) => void): VccCloudSync {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<CloudSyncStatus>(cloudConfigured ? "connecting" : "offline");
  const [message, setMessage] = useState("");
  const dataRef = useRef(data);
  const lastSynced = useRef("");
  const ready = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentDevice = useRef(typeof window === "undefined" ? "server" : deviceId());
  dataRef.current = data;

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    client.auth.getSession().then(({ data: result }) => setSession(result.session));
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    if (!isSharedAccount(session)) {
      ready.current = false;
      setStatus("signed_out");
      return;
    }

    let cancelled = false;
    setStatus("connecting");
    setMessage("Connecting this device to your VCC account...");

    async function connect() {
      const userId = session!.user.id;
      const { data: remote, error } = await supabase!.from("vcc_app_state").select("data,device_id,revision").eq("user_id", userId).maybeSingle();
      if (cancelled) return;
      if (error) { setStatus("error"); setMessage(error.message); return; }

      if (remote && isAppData(remote.data)) {
        const serialized = JSON.stringify(remote.data);
        lastSynced.current = serialized;
        applyRemoteData(remote.data);
      } else {
        const serialized = JSON.stringify(dataRef.current);
        const { error: createError } = await supabase!.from("vcc_app_state").upsert({
          user_id: userId, data: dataRef.current, device_id: currentDevice.current,
          revision: Date.now(), updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (createError) { setStatus("error"); setMessage(createError.message); return; }
        lastSynced.current = serialized;
      }

      ready.current = true;
      setStatus("synced");
      setMessage("All VCC data is synced across signed-in devices.");

      channelRef.current = supabase!.channel(`vcc-state-${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "vcc_app_state", filter: `user_id=eq.${userId}` }, (payload) => {
          const row = payload.new as { data?: unknown; device_id?: string };
          if (row.device_id === currentDevice.current || !isAppData(row.data)) return;
          const serialized = JSON.stringify(row.data);
          if (serialized === lastSynced.current) return;
          lastSynced.current = serialized;
          applyRemoteData(row.data);
          setStatus("synced");
          setMessage("Updated from another VCC device.");
        }).subscribe();
    }

    connect();
    return () => {
      cancelled = true;
      ready.current = false;
      if (channelRef.current) client.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [session, applyRemoteData]);

  useEffect(() => {
    if (!supabase || !ready.current || !isSharedAccount(session)) return;
    const client = supabase;
    const serialized = JSON.stringify(data);
    if (serialized === lastSynced.current) return;
    setStatus("saving");
    const timer = window.setTimeout(async () => {
      const { error } = await client.from("vcc_app_state").upsert({
        user_id: session.user.id, data, device_id: currentDevice.current,
        revision: Date.now(), updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) { setStatus("error"); setMessage(error.message); return; }
      lastSynced.current = serialized;
      setStatus("synced");
      setMessage("Saved everywhere.");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [data, session]);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Cloud sync is not configured.");
    setStatus("connecting");
    const returnPath = window.location.pathname.startsWith("/vitascan") ? "/vitascan" : "/settings";
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}${returnPath}` } });
    if (error) { setStatus("error"); setMessage(error.message); throw error; }
    setStatus("signed_out");
    setMessage("Check your email and open the secure sign-in link on this device.");
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    lastSynced.current = "";
    setStatus("signed_out");
    setMessage("Signed out. This device will keep its local copy.");
  }, []);

  return { configured: cloudConfigured, status, email: isSharedAccount(session) ? session.user.email || "VCC account" : "", message, sendMagicLink, signOut };
}
