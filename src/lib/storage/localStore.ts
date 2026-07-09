import type { AppData, SectionKey, SpreadsheetRow } from "../types/app";
import { normalizeInventoryRow } from "../engine/inventoryEngine";
import { blankRows, createStarterData, createZeroData, sectionConfigs } from "./defaultData";

const STORAGE_KEY = "vcc-os:data:v2";
const LEGACY_KEYS = ["vcc-os:data", "vcc_os_data", "vccData", "vcc-os-financial-state"];

export function loadAppData(): AppData {
  if (typeof window === "undefined") return createStarterData();
  const existing = readJson(window.localStorage.getItem(STORAGE_KEY));
  if (existing) return migrateAppData(existing);

  for (const key of LEGACY_KEYS) {
    const legacy = readJson(window.localStorage.getItem(key));
    if (legacy) {
      const migrated = migrateAppData(legacy);
      saveAppData(migrated);
      return migrated;
    }
  }

  const starter = createStarterData();
  saveAppData(starter);
  return starter;
}

export function saveAppData(data: AppData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: 2 }));
}

export function resetSection(data: AppData, section: SectionKey): AppData {
  return {
    ...data,
    sections: {
      ...data.sections,
      [section]: [],
    },
  };
}

export function resetAllData(): AppData {
  return createZeroData();
}

function migrateAppData(raw: unknown): AppData {
  const starter = createStarterData();
  const source = raw as Partial<AppData> & Record<string, unknown>;
  const sections = { ...starter.sections };

  for (const section of Object.keys(sectionConfigs) as SectionKey[]) {
    const maybeRows = source.sections && Array.isArray(source.sections[section])
      ? source.sections[section]
      : Array.isArray(source[section])
        ? source[section]
        : undefined;
    if (maybeRows) sections[section] = ensureStarterRows(section, maybeRows.map((row) => migrateRow(section, row)));
  }

  sections.inventory = ensureStarterRows("inventory", sections.inventory.map(normalizeInventoryRow));
  sections.transactions = ensureStarterRows("transactions", sections.transactions);

  return {
    ...starter,
    ...source,
    version: 2,
    sections,
    sortBy: { ...starter.sortBy, ...(typeof source.sortBy === "object" ? source.sortBy : {}) },
    paycheckPlanner: { ...starter.paycheckPlanner, ...(typeof source.paycheckPlanner === "object" ? source.paycheckPlanner : {}) },
    paycheckHistory: Array.isArray(source.paycheckHistory) ? source.paycheckHistory : starter.paycheckHistory,
    settings: { ...starter.settings, ...(typeof source.settings === "object" ? source.settings : {}) },
  } as AppData;
}

function migrateRow(section: SectionKey, raw: unknown): SpreadsheetRow {
  const source = raw as Partial<SpreadsheetRow> & Record<string, unknown>;
  const cells = typeof source.cells === "object" && source.cells ? source.cells as Record<string, string> : source as Record<string, string>;
  const base = Object.fromEntries(sectionConfigs[section].columns.map((column) => [column.key, ""]));
  return {
    id: String(source.id || `${section}-${cryptoRandom()}`),
    cells: {
      ...base,
      ...cells,
    },
  };
}

function ensureStarterRows(section: SectionKey, rows: SpreadsheetRow[]): SpreadsheetRow[] {
  return [...rows, ...blankRows(section, Math.max(0, 20 - rows.length))];
}

function readJson(value: string | null): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
