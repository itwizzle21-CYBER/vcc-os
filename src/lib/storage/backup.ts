import type { AppData } from "../types/app";
import { normalizeAppData } from "./localStore";

export const VCC_BACKUP_FORMAT_VERSION = 1;
export const RECOVERY_HISTORY_KEY = "vcc-os:recovery-history:v1";
export const MAX_BACKUP_BYTES = 5_000_000;
const MAX_RECOVERY_POINTS = 3;

export type SmartFeaturePrefs = Record<string, boolean>;

export type VccBackupEnvelope = {
  app: "VCC-OS";
  formatVersion: typeof VCC_BACKUP_FORMAT_VERSION;
  dataVersion: number;
  exportedAt: string;
  data: AppData;
  smartFeatures: SmartFeaturePrefs;
};

export type ParsedVccBackup = { data: AppData; smartFeatures: SmartFeaturePrefs };
export type RecoveryPoint = { id: string; createdAt: string; reason: string; data: AppData };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isBackupData(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && isRecord(value.sections) && isRecord(value.settings);
}

function normalizeSmartFeatures(value: unknown): SmartFeaturePrefs {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
  );
}

export function createVccBackup(data: AppData, smartFeatures: SmartFeaturePrefs, exportedAt = new Date().toISOString()): VccBackupEnvelope {
  return {
    app: "VCC-OS",
    formatVersion: VCC_BACKUP_FORMAT_VERSION,
    dataVersion: data.version,
    exportedAt,
    data,
    smartFeatures: normalizeSmartFeatures(smartFeatures),
  };
}

export function serializeVccBackup(data: AppData, smartFeatures: SmartFeaturePrefs): string {
  return JSON.stringify(createVccBackup(data, smartFeatures), null, 2);
}

export function parseVccBackup(text: string): ParsedVccBackup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error("Backup is larger than the 5 MB safety limit.");
  }
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed)) throw new Error("Backup must be a JSON object.");
  if ("app" in parsed && parsed.app !== "VCC-OS") throw new Error("Backup belongs to another application.");
  if ("formatVersion" in parsed && parsed.formatVersion !== VCC_BACKUP_FORMAT_VERSION) {
    throw new Error("Backup format is newer than this VCC version supports.");
  }
  const source = "data" in parsed ? parsed.data : parsed;
  if (!isBackupData(source)) throw new Error("Backup is missing VCC sections or settings.");
  return { data: normalizeAppData(source), smartFeatures: normalizeSmartFeatures(parsed.smartFeatures) };
}

export function loadRecoveryPoints(): RecoveryPoint[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECOVERY_HISTORY_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is RecoveryPoint => (
      isRecord(value)
      && typeof value.id === "string"
      && typeof value.createdAt === "string"
      && typeof value.reason === "string"
      && isBackupData(value.data)
    )).slice(0, MAX_RECOVERY_POINTS);
  } catch {
    return [];
  }
}

export function saveRecoveryPoint(data: AppData, reason: string, createdAt = new Date().toISOString()): RecoveryPoint | null {
  if (typeof window === "undefined") return null;
  const point: RecoveryPoint = {
    id: `${createdAt}-${randomId()}`,
    createdAt,
    reason,
    data: normalizeAppData(data),
  };
  const history = [point, ...loadRecoveryPoints()].slice(0, MAX_RECOVERY_POINTS);
  while (history.length) {
    try {
      window.localStorage.setItem(RECOVERY_HISTORY_KEY, JSON.stringify(history));
      return point;
    } catch {
      history.pop();
    }
  }
  return null;
}

export function restoreRecoveryPoint(id: string): AppData | null {
  const point = loadRecoveryPoints().find((entry) => entry.id === id);
  return point ? normalizeAppData(point.data) : null;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(16).slice(2);
}
