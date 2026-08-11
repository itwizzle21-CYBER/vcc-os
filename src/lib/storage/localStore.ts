import type { AppData, SectionKey, SpreadsheetRow, ThemeMode } from "../types/app";
import { isBlankRow, toNumber } from "../calculations/currency";
import { canonicalizeAccountRows, canonicalizeInventoryRows } from "../engine/canonicalRecords";
import { syncConfirmedReceiptTransactions } from "../engine/carLoanEngine";
import { displayAccountLabel } from "../engine/paycheckPlannerEngine";
import { migrateLegacyReceiptTaxRows } from "../engine/receiptTransactionEngine";
import { createVerifiedCarLoanData } from "./carLoanReference";
import { createZeroData, sectionConfigs } from "./defaultData";

const STORAGE_KEY = "vcc-os:data:v2";
export const THEME_PREFERENCE_KEY = "vcc-os:theme-preference";
const LEGACY_KEYS = ["vcc-os:data", "vcc_os_data", "vccData", "vcc-os-financial-state"];
const BLANK_RESET_MARKER = "__vcc_blank_reset__";

export function loadAppData(): AppData {
  if (typeof window === "undefined") return createZeroData();
  const existing = readJson(window.localStorage.getItem(STORAGE_KEY));
  if (existing) {
    const migrated = normalizeAppData(existing);
    return withLocalThemePreference(migrated);
  }

  for (const key of LEGACY_KEYS) {
    const legacy = readJson(window.localStorage.getItem(key));
    if (legacy) {
      const migrated = normalizeAppData(legacy);
      saveAppData(migrated);
      return withLocalThemePreference(migrated);
    }
  }

  const blank = createZeroData();
  saveAppData(blank);
  return withLocalThemePreference(blank);
}

export function saveAppData(data: AppData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: 5 }));
}

export function loadThemePreference(fallback: ThemeMode): ThemeMode {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(THEME_PREFERENCE_KEY);
  return isThemeMode(stored) ? stored : fallback;
}

export function saveThemePreference(theme: ThemeMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_PREFERENCE_KEY, theme);
}

function withLocalThemePreference(data: AppData): AppData {
  const theme = loadThemePreference(data.settings.theme);
  if (theme === data.settings.theme) return data;
  return { ...data, settings: { ...data.settings, theme } };
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "dark" || value === "light";
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
  const data = createZeroData();
  return {
    ...data,
    settings: {
      ...data.settings,
      accountName: "",
      profileLabel: "",
      notificationsEnabled: false,
      hiddenWidgets: [BLANK_RESET_MARKER],
    },
  };
}

export function normalizeAppData(raw: unknown): AppData {
  const starter = createZeroData();
  const source = raw as Partial<AppData> & Record<string, unknown>;
  const sections = { ...starter.sections };
  const rawCarLoan = source.carLoan && typeof source.carLoan === "object"
    ? { ...starter.carLoan, ...source.carLoan }
    : createVerifiedCarLoanData();
  const carLoan = {
    ...rawCarLoan,
    receipts: (Array.isArray(rawCarLoan.receipts) ? rawCarLoan.receipts : [])
      .map((receipt) => ({ ...receipt, paymentMethod: displayAccountLabel(receipt.paymentMethod) })),
  };

  for (const section of Object.keys(sectionConfigs) as SectionKey[]) {
    const maybeRows = source.sections && Array.isArray(source.sections[section])
      ? source.sections[section]
      : Array.isArray(source[section])
        ? source[section]
        : undefined;
    if (maybeRows) {
      sections[section] = maybeRows
        .map((row) => migrateRow(section, row))
        .filter((row) => !isBlankRow(row.cells))
        .filter((row) => !isLegacySampleRow(section, row));
    }
  }

  sections.inventory = canonicalizeInventoryRows(sections.inventory);
  sections.money = canonicalizeAccountRows(sections.money.map((row) => ({
    ...row,
    cells: { ...row.cells, label: displayAccountLabel(row.cells.label) },
  })));
  sections.transactions = sections.transactions.map((row) => {
    const cells = { ...row.cells };
    delete cells.recurring;
    delete cells.is_recurring;
    return {
      ...row,
      cells: {
        ...cells,
        account: displayAccountLabel(cells.account),
        transferDestination: displayAccountLabel(cells.transferDestination),
        description: replaceCashAccountText(cells.description),
        notes: replaceCashAccountText(cells.notes),
      },
    };
  });
  sections.transactions = migrateLegacyReceiptTaxRows(sections.transactions);
  sections.transactions = syncConfirmedReceiptTransactions(sections.transactions, carLoan.receipts);

  if (!sections.carPayment.length && carLoan.contract) {
    const latestReceipt = [...carLoan.receipts]
      .filter((receipt) => receipt.status === "confirmed")
      .sort((a, b) => `${b.paidDate}-${b.createdAt}`.localeCompare(`${a.paidDate}-${a.createdAt}`))[0];
    sections.carPayment = [{
      id: "car-current",
      cells: {
        vehicle: carLoan.contract.vehicle,
        lender: carLoan.contract.lender,
        originalBalance: String(carLoan.contract.amountFinanced),
        remainingBalance: String(latestReceipt?.officialPayoff || carLoan.contract.amountFinanced),
        monthlyPayment: String(carLoan.contract.scheduledPaymentAmount),
        dueDate: carLoan.contract.firstPaymentDate,
        apr: String(carLoan.contract.apr),
        status: "active",
        notes: "Verified contract and latest confirmed dealer payoff",
      },
    }];
  }

  const sourceSettings = typeof source.settings === "object" && source.settings
    ? source.settings as Omit<Partial<AppData["settings"]>, "theme" | "appearanceTheme"> & { theme?: string; appearanceTheme?: string }
    : {};
  const legacyTheme = sourceSettings.theme;
  const theme = legacyTheme === "system" || legacyTheme === "dark" || legacyTheme === "light"
    ? legacyTheme
    : legacyTheme === "light" ? "light" : "dark";
  const appearanceTheme = sourceSettings.appearanceTheme === "signature"
    || sourceSettings.appearanceTheme === "executive"
    || sourceSettings.appearanceTheme === "nordic"
    || sourceSettings.appearanceTheme === "contrast"
    ? sourceSettings.appearanceTheme
    : legacyTheme === "slate" ? "executive" : "signature";
  const sourceLayoutViews = sourceSettings.layoutViews && typeof sourceSettings.layoutViews === "object"
    ? sourceSettings.layoutViews
    : {};
  const layoutViews = Object.fromEntries(
    Object.entries(starter.settings.layoutViews).map(([page, fallback]) => {
      const candidate = Number((sourceLayoutViews as Record<string, unknown>)[page]);
      return [page, candidate >= 1 && candidate <= 5 ? candidate : fallback];
    }),
  ) as AppData["settings"]["layoutViews"];
  const vccCompanionId = (["scout", "penny", "clover", "pico"] as const).includes(sourceSettings.vccCompanionId as "scout" | "penny" | "clover" | "pico")
    ? sourceSettings.vccCompanionId as AppData["settings"]["vccCompanionId"]
    : starter.settings.vccCompanionId;

  return {
    ...starter,
    ...source,
    version: 5,
    sections,
    carLoan,
    sortBy: { ...starter.sortBy, ...(typeof source.sortBy === "object" ? source.sortBy : {}) },
    paycheckPlanner: { ...starter.paycheckPlanner, ...(typeof source.paycheckPlanner === "object" ? source.paycheckPlanner : {}) },
    paycheckHistory: (Array.isArray(source.paycheckHistory) ? source.paycheckHistory : starter.paycheckHistory)
      .map((row) => ({ ...row, depositAccountLabel: displayAccountLabel(row.depositAccountLabel) })),
    activity: Array.isArray(source.activity) ? source.activity : starter.activity,
    settings: { ...starter.settings, ...sourceSettings, theme, appearanceTheme, vccCompanionId, layoutViews },
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

function replaceCashAccountText(value: string | undefined): string {
  return String(value || "").replace(/\bcash on hand\b/gi, "Cash");
}
