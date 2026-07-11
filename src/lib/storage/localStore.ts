import type { AppData, SectionKey, SpreadsheetRow } from "../types/app";
import { isBlankRow, toNumber } from "../calculations/currency";
import { normalizeInventoryRow } from "../engine/inventoryEngine";
import { createZeroData, sectionConfigs } from "./defaultData";

const STORAGE_KEY = "vcc-os:data:v2";
const LEGACY_KEYS = ["vcc-os:data", "vcc_os_data", "vccData", "vcc-os-financial-state"];

export function loadAppData(): AppData {
  if (typeof window === "undefined") return createZeroData();
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

  const empty = createZeroData();
  saveAppData(empty);
  return empty;
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
  const starter = createZeroData();
  const source = raw as Partial<AppData> & Record<string, unknown>;
  const sections = { ...starter.sections };

  for (const section of Object.keys(sectionConfigs) as SectionKey[]) {
    const maybeRows = source.sections && Array.isArray(source.sections[section])
      ? source.sections[section]
      : Array.isArray(source[section])
        ? source[section]
        : undefined;
    if (maybeRows) {
      sections[section] = maybeRows
        .map((row) => migrateRow(section, row))
        .map((row) => (section === "inventory" ? normalizeInventoryRow(row) : row))
        .filter((row) => !isBlankRow(row.cells))
        .filter((row) => !isLegacySampleRow(section, row));
    }
  }

  sections.inventory = sections.inventory.map(normalizeInventoryRow);

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

function isLegacySampleRow(section: SectionKey, row: SpreadsheetRow): boolean {
  const cells = row.cells;
  switch (section) {
    case "money":
      return (
        matchesSeed(row, "money-1", cells.label, "Operating Cash", cells.amount, 4250.32) ||
        matchesSeed(row, "money-2", cells.label, "Protected Savings", cells.amount, 12800) ||
        matchesSeed(row, "money-3", cells.label, "SpotMe", cells.amount, 120) ||
        matchesSeed(row, "money-4", cells.label, "MyPay", cells.amount, 330)
      );
    case "bills":
      return (
        matchesSeed(row, "bill-1", cells.name, "Electric bill", cells.amount, 186.42) ||
        matchesSeed(row, "bill-2", cells.name, "Credit card minimum", cells.amount, 450)
      );
    case "income":
      return matchesSeed(row, "income-1", cells.source, "Paycheck", cells.amount, 1200);
    case "transactions":
      return (
        matchesSeed(row, "txn-1", cells.description, "Groceries", cells.amount, 72.15) ||
        matchesSeed(row, "txn-2", cells.description, "Paycheck", cells.amount, 1200)
      );
    case "debt":
      return (
        matchesSeed(row, "debt-1", cells.name, "Credit card", cells.balance, 8250) ||
        matchesSeed(row, "debt-2", cells.name, "Car note", cells.balance, 10200)
      );
    case "carPayment":
      return false;
    case "savings":
      return (
        matchesSeed(row, "sav-1", cells.name, "Protected Savings", cells.balance, 12800) ||
        matchesSeed(row, "sav-2", cells.name, "Emergency Fund", cells.balance, 2400)
      );
    case "inventory":
      return (
        matchesSeed(row, "inv-1", cells.item, "Water", cells.cost, 5) ||
        matchesSeed(row, "inv-2", cells.item, "Tylenol", cells.cost, 8) ||
        matchesSeed(row, "inv-3", cells.item, "Toilet paper", cells.cost, 12)
      );
    case "goals":
      return (
        matchesSeed(row, "goal-1", cells.name, "Emergency Fund", cells.target, 5000) ||
        matchesSeed(row, "goal-2", cells.name, "Debt Free", cells.target, 18450)
      );
    default:
      return false;
  }
}

function matchesSeed(row: SpreadsheetRow, id: string, label: string | undefined, expectedLabel: string, amount: string | undefined, expectedAmount: number): boolean {
  return row.id === id && normalizeText(label) === normalizeText(expectedLabel) && Math.abs(toNumber(amount) - expectedAmount) < 0.01;
}

function normalizeText(value: string | undefined): string {
  return String(value || "").trim().toLowerCase();
}
