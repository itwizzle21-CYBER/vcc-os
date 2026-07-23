import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import type { AppData } from "../types/app";
import { mergeVitaReceipts, type VitaReceiptRecord } from "../vitascan/receiptSync";
import { cloudConfigured, supabase } from "./client";
import { appDataEqual, mergeAppData } from "./syncMerge";

export type CloudSyncStatus = "offline" | "signed_out" | "connecting" | "synced" | "saving" | "error";
export type VccCloudSync = {
  configured: boolean;
  status: CloudSyncStatus;
  email: string;
  message: string;
  sendLoginCode: (email: string) => Promise<void>;
  verifyLoginCode: (email: string, token: string) => Promise<void>;
  restoreFromCloud: () => Promise<void>;
  signOut: () => Promise<void>;
};

type CloudStateRow = {
  data: unknown;
  device_id: string;
  revision: number;
};

type SyncBase = {
  data: AppData;
  revision: number;
};

function deviceId() {
  const key = "vcc-os:device-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}

function isSharedAccount(session: Session | null | undefined): session is Session {
  return Boolean(session && !session.user.is_anonymous);
}

function isAppData(value: unknown): value is AppData {
  const candidate = value as Partial<AppData> | null;
  return Boolean(candidate && typeof candidate === "object" && candidate.sections && candidate.settings && candidate.paycheckPlanner);
}

function syncBaseKey(userId: string): string {
  return `vcc-os:sync-base:${userId}`;
}

function readSyncBase(userId: string): SyncBase | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(syncBaseKey(userId)) || "null") as Partial<SyncBase> | null;
    return parsed && typeof parsed.revision === "number" && isAppData(parsed.data) ? parsed as SyncBase : null;
  } catch {
    return null;
  }
}

function writeSyncBase(userId: string, base: SyncBase): void {
  window.localStorage.setItem(syncBaseKey(userId), JSON.stringify(base));
}

export function useVccCloudSync(data: AppData, applyRemoteData: (data: AppData) => void): VccCloudSync {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [status, setStatus] = useState<CloudSyncStatus>(cloudConfigured ? "connecting" : "offline");
  const [message, setMessage] = useState("");
  const dataRef = useRef(data);
  const lastSynced = useRef("");
  const baseRef = useRef<SyncBase | null>(null);
  const ready = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const receiptRowsRef = useRef<VitaReceiptRecord[]>([]);
  const currentDevice = useRef(typeof window === "undefined" ? "server" : deviceId());
  dataRef.current = data;

  const rememberBase = useCallback((userId: string, base: SyncBase) => {
    baseRef.current = base;
    writeSyncBase(userId, base);
  }, []);

  const saveState = useCallback(async (userId: string, requestedData: AppData) => {
    if (!supabase) return;
    let localData = requestedData;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let base = baseRef.current;
      if (!base) {
        const { data: latest, error: latestError } = await supabase.from("vcc_app_state")
          .select("data,device_id,revision")
          .eq("user_id", userId)
          .maybeSingle();
        if (latestError || !latest || !isAppData(latest.data)) {
          setStatus("error");
          setMessage(latestError?.message || "Could not verify the current cloud copy.");
          return;
        }
        base = { data: latest.data, revision: Number(latest.revision) };
        rememberBase(userId, base);
      }

      const nextRevision = base.revision + 1;
      const { data: updated, error } = await supabase.from("vcc_app_state")
        .update({
          data: localData,
          device_id: currentDevice.current,
          revision: nextRevision,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("revision", base.revision)
        .select("data,device_id,revision")
        .maybeSingle();

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      if (updated && isAppData(updated.data)) {
        const savedBase = { data: updated.data, revision: Number(updated.revision) };
        rememberBase(userId, savedBase);
        lastSynced.current = JSON.stringify(updated.data);
        setStatus("synced");
        setMessage("Saved on desktop and mobile.");
        return;
      }

      const { data: latest, error: latestError } = await supabase.from("vcc_app_state")
        .select("data,device_id,revision")
        .eq("user_id", userId)
        .maybeSingle();
      if (latestError || !latest || !isAppData(latest.data)) {
        setStatus("error");
        setMessage(latestError?.message || "Could not reconcile device changes.");
        return;
      }

      const remoteData = mergeVitaReceipts(latest.data, receiptRowsRef.current);
      localData = mergeAppData(base.data, localData, remoteData);
      const remoteBase = { data: remoteData, revision: Number(latest.revision) };
      rememberBase(userId, remoteBase);
      lastSynced.current = JSON.stringify(remoteData);
      dataRef.current = localData;
      applyRemoteData(localData);

      if (appDataEqual(localData, remoteData)) {
        setStatus("synced");
        setMessage("Changes from both devices are combined.");
        return;
      }
    }

    setStatus("error");
    setMessage("Two devices changed the same data repeatedly. Reopen VCC to reconcile safely.");
  }, [applyRemoteData, rememberBase]);

  const restoreFromCloud = useCallback(async () => {
    if (!supabase || !isSharedAccount(session)) throw new Error("Sign in before restoring this device.");
    setStatus("connecting");
    setMessage("Restoring the protected VCC cloud copy...");
    const userId = session.user.id;
    const [stateResult, receiptResult] = await Promise.all([
      supabase.from("vcc_app_state").select("data,device_id,revision").eq("user_id", userId).maybeSingle(),
      supabase.from("vita_receipts").select("transaction_id,merchant,amount,occurred_on,direction,account_name,category,reference_code").eq("user_id", userId),
    ]);
    const error = stateResult.error || receiptResult.error;
    if (error || !stateResult.data || !isAppData(stateResult.data.data)) {
      const failure = new Error(error?.message || "No protected VCC cloud copy was found.");
      setStatus("error");
      setMessage(failure.message);
      throw failure;
    }

    receiptRowsRef.current = (receiptResult.data || []) as VitaReceiptRecord[];
    const restored = mergeVitaReceipts(stateResult.data.data, receiptRowsRef.current);
    const base = { data: restored, revision: Number(stateResult.data.revision) };
    rememberBase(userId, base);
    lastSynced.current = JSON.stringify(restored);
    dataRef.current = restored;
    applyRemoteData(restored);
    ready.current = true;
    setStatus("synced");
    setMessage("Protected desktop data restored on this device.");
  }, [applyRemoteData, rememberBase, session]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    client.auth.getSession()
      .then(({ data: result }) => setSession(result.session))
      .catch(() => setSession(null));
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    if (session === undefined) return;
    if (!isSharedAccount(session)) {
      ready.current = false;
      baseRef.current = null;
      setStatus("signed_out");
      return;
    }

    let cancelled = false;
    setStatus("connecting");
    setMessage("Loading the protected VCC cloud copy...");

    async function connect() {
      const userId = session!.user.id;
      const [stateResult, receiptResult] = await Promise.all([
        supabase!.from("vcc_app_state").select("data,device_id,revision").eq("user_id", userId).maybeSingle(),
        supabase!.from("vita_receipts").select("transaction_id,merchant,amount,occurred_on,direction,account_name,category,reference_code").eq("user_id", userId),
      ]);
      if (cancelled) return;
      if (stateResult.error || receiptResult.error) {
        const error = stateResult.error || receiptResult.error;
        setStatus("error");
        setMessage(error?.message || "Could not load shared VCC data.");
        return;
      }

      const remote = stateResult.data as CloudStateRow | null;
      receiptRowsRef.current = (receiptResult.data || []) as VitaReceiptRecord[];
      const hasRemoteState = isAppData(remote?.data);

      if (!hasRemoteState || !remote) {
        const initialData = mergeVitaReceipts(dataRef.current, receiptRowsRef.current);
        const { data: created, error: createError } = await supabase!.from("vcc_app_state").upsert({
          user_id: userId,
          data: initialData,
          device_id: currentDevice.current,
          revision: 1,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" }).select("data,device_id,revision").single();
        if (createError || !created || !isAppData(created.data)) {
          setStatus("error");
          setMessage(createError?.message || "Could not create the shared VCC copy.");
          return;
        }
        const base = { data: created.data, revision: Number(created.revision) };
        rememberBase(userId, base);
        lastSynced.current = JSON.stringify(created.data);
        dataRef.current = created.data;
        applyRemoteData(created.data);
      } else {
        const remoteData = mergeVitaReceipts(remote.data as AppData, receiptRowsRef.current);
        const storedBase = readSyncBase(userId);
        const localChangedOffline = storedBase && !appDataEqual(dataRef.current, storedBase.data);
        const currentData = dataRef.current;
        const sharedData = localChangedOffline
          ? mergeAppData(storedBase.data, dataRef.current, remoteData)
          : remoteData;
        const remoteBase = { data: remoteData, revision: Number(remote.revision) };
        rememberBase(userId, remoteBase);
        lastSynced.current = JSON.stringify(remoteData);
        dataRef.current = sharedData;
        if (!appDataEqual(currentData, sharedData)) applyRemoteData(sharedData);

        ready.current = true;
        if (!appDataEqual(sharedData, remoteData)) {
          setStatus("saving");
          await saveState(userId, sharedData);
        }
      }

      if (cancelled) return;
      ready.current = true;
      setStatus("synced");
      setMessage("Desktop and mobile are synchronized both ways.");

      channelRef.current = supabase!.channel(`vcc-state-${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "vcc_app_state", filter: `user_id=eq.${userId}` }, (payload) => {
          const row = payload.new as CloudStateRow;
          if (row.device_id === currentDevice.current || !isAppData(row.data)) return;
          const remoteData = mergeVitaReceipts(row.data, receiptRowsRef.current);
          const knownBase = baseRef.current;
          if (knownBase && Number(row.revision) <= knownBase.revision) return;
          const nextData = knownBase
            ? mergeAppData(knownBase.data, dataRef.current, remoteData)
            : remoteData;
          const previousData = dataRef.current;
          const remoteBase = { data: remoteData, revision: Number(row.revision) };
          rememberBase(userId, remoteBase);
          lastSynced.current = JSON.stringify(remoteData);
          dataRef.current = nextData;
          if (!appDataEqual(previousData, nextData)) applyRemoteData(nextData);

          if (!appDataEqual(nextData, remoteData)) {
            setStatus("saving");
            void saveState(userId, nextData);
          } else {
            setStatus("synced");
            setMessage("Updated from another VCC device.");
          }
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "vita_receipts", filter: `user_id=eq.${userId}` }, (payload) => {
          const receipt = payload.new as VitaReceiptRecord;
          receiptRowsRef.current = [
            ...receiptRowsRef.current.filter((row) => row.transaction_id !== receipt.transaction_id),
            receipt,
          ];
          const nextData = mergeVitaReceipts(dataRef.current, [receipt]);
          if (nextData === dataRef.current) return;
          dataRef.current = nextData;
          applyRemoteData(nextData);
          setStatus("synced");
          setMessage("A VitaScan receipt arrived from another device.");
        })
        .subscribe((channelStatus) => {
          if (channelStatus === "CHANNEL_ERROR" || channelStatus === "TIMED_OUT") {
            setStatus("error");
            setMessage("Live updates paused. Reopen VCC to reconnect safely.");
          }
        });
    }

    void connect();
    return () => {
      cancelled = true;
      ready.current = false;
      if (channelRef.current) client.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [applyRemoteData, rememberBase, saveState, session]);

  useEffect(() => {
    if (!ready.current || !isSharedAccount(session)) return;
    const serialized = JSON.stringify(data);
    if (serialized === lastSynced.current) return;
    setStatus("saving");
    const timer = window.setTimeout(() => void saveState(session.user.id, data), 700);
    return () => window.clearTimeout(timer);
  }, [data, saveState, session]);

  const sendLoginCode = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Cloud sync is not configured.");
    setStatus("connecting");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) { setStatus("error"); setMessage(error.message); throw error; }
    setStatus("signed_out");
    setMessage("Check Gmail for your VitaScan sign-in code and enter the complete code on this device.");
  }, []);

  const verifyLoginCode = useCallback(async (email: string, token: string) => {
    if (!supabase) throw new Error("Cloud sync is not configured.");
    setStatus("connecting");
    setMessage("Verifying this device and loading your desktop VCC data...");
    const { data: result, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) { setStatus("error"); setMessage(error.message); throw error; }
    if (result.session) setSession(result.session);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    lastSynced.current = "";
    baseRef.current = null;
    setStatus("signed_out");
    setMessage("Signed out. This device will keep its local copy.");
  }, []);

  return {
    configured: cloudConfigured,
    status,
    email: isSharedAccount(session) ? session.user.email || "VCC account" : "",
    message,
    sendLoginCode,
    verifyLoginCode,
    restoreFromCloud,
    signOut,
  };
}
