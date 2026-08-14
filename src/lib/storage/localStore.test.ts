import { afterEach, describe, expect, it, vi } from "vitest";
import { createStarterData } from "./defaultData";
import {
  APP_DATA_STORAGE_KEY,
  loadAppData,
  loadThemePreference,
  normalizeAppData,
  resetAllData,
  resetSection,
  saveAppData,
  saveThemePreference,
  THEME_PREFERENCE_KEY,
} from "./localStore";

function installLocalStorage(onSetItem?: (key: string, value: string) => void) {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        onSetItem?.(key, value);
        values.set(key, value);
      },
    },
  });
  return values;
}

afterEach(() => vi.unstubAllGlobals());

describe("full VCC reset", () => {
  it("returns a blank financial workspace and account identity", () => {
    const reset = resetAllData();

    expect(Object.values(reset.sections).every((rows) => rows.length === 0)).toBe(true);
    expect(reset.paycheckPlanner).toEqual({
      incomeSource: "",
      depositAccountId: "",
      paycheckAmount: "",
      payDate: "",
      weekStart: "",
      weekEnd: "",
      spotMeRepayment: "",
      myPayRepayment: "",
      depositApplied: false,
      locked: false,
    });
    expect(reset.paycheckHistory).toEqual([]);
    expect(reset.activity).toEqual([]);
    expect(reset.sortBy).toEqual({});
    expect(reset.settings.accountName).toBe("");
    expect(reset.settings.profileLabel).toBe("");
    expect(reset.settings.notificationsEnabled).toBe(false);
  });

  it("stays blank after persistence and reload", () => {
    installLocalStorage();
    saveAppData(resetAllData());

    const reloaded = loadAppData();

    expect(Object.values(reloaded.sections).every((rows) => rows.length === 0)).toBe(true);
    expect(reloaded.settings.accountName).toBe("");
    expect(reloaded.settings.hiddenWidgets).toContain("__vcc_blank_reset__");
  });
});

describe("theme preference", () => {
  it("uses the app-data theme when no device preference has been saved", () => {
    installLocalStorage();
    expect(loadThemePreference("system")).toBe("system");
    expect(loadThemePreference("dark")).toBe("dark");
  });

  it("starts a new workspace blank instead of injecting demonstration data", () => {
    installLocalStorage();

    const loaded = loadAppData();

    expect(Object.values(loaded.sections).every((rows) => rows.length === 0)).toBe(true);
    expect(loaded.version).toBe(5);
  });

  it("keeps an explicit device theme authoritative across reloads", () => {
    const values = installLocalStorage();
    saveThemePreference("dark");

    expect(values.get(THEME_PREFERENCE_KEY)).toBe("dark");
    expect(loadThemePreference("light")).toBe("dark");
  });

  it("ignores an invalid stored theme", () => {
    const values = installLocalStorage();
    values.set(THEME_PREFERENCE_KEY, "midnight");
    expect(loadThemePreference("light")).toBe("light");
  });

});

describe("section reset contract", () => {
  it("clears only the selected section without undoing linked domain state", () => {
    const data = createStarterData();
    const otherSections = Object.entries(data.sections).filter(([key]) => key !== "transactions");

    const reset = resetSection(data, "transactions");

    expect(reset.sections.transactions).toEqual([]);
    for (const [key, rows] of otherSections) {
      expect(reset.sections[key as keyof typeof reset.sections]).toBe(rows);
    }
    expect(reset.paycheckHistory).toBe(data.paycheckHistory);
    expect(reset.activity).toBe(data.activity);
    expect(reset.carLoan).toBe(data.carLoan);
  });
});

describe("application persistence contract", () => {
  it("writes one versioned snapshot for an explicit save", () => {
    const writes: Array<{ key: string; value: string }> = [];
    installLocalStorage((key, value) => writes.push({ key, value }));

    saveAppData(createStarterData());

    expect(writes).toHaveLength(1);
    expect(writes[0].key).toBe(APP_DATA_STORAGE_KEY);
    expect(JSON.parse(writes[0].value).version).toBe(5);
  });

  it("persists a current-key migration during load", () => {
    const writes: Array<{ key: string; value: string }> = [];
    const values = installLocalStorage((key, value) => writes.push({ key, value }));
    values.set(APP_DATA_STORAGE_KEY, JSON.stringify({ version: 3, sections: {}, settings: { accountName: "Migrated" } }));

    const loaded = loadAppData();

    expect(loaded.version).toBe(5);
    expect(loaded.settings.accountName).toBe("Migrated");
    expect(writes.filter(({ key }) => key === APP_DATA_STORAGE_KEY)).toHaveLength(1);
    expect(JSON.parse(values.get(APP_DATA_STORAGE_KEY) || "{}").version).toBe(5);
  });

  it("does not rewrite an already normalized current snapshot during load", () => {
    const writes: string[] = [];
    const values = installLocalStorage((key) => writes.push(key));
    const current = normalizeAppData(createStarterData());
    values.set(APP_DATA_STORAGE_KEY, JSON.stringify(current));

    loadAppData();

    expect(writes.filter((key) => key === APP_DATA_STORAGE_KEY)).toEqual([]);
  });
});

describe("import normalization", () => {
  it("repairs partial exports before they reach the application state", () => {
    const imported = normalizeAppData({ sections: {}, settings: { accountName: "Imported" } });

    expect(imported.settings.accountName).toBe("Imported");
    expect(imported.sections.inventory).toEqual([]);
    expect(imported.sections.transactions).toEqual(expect.any(Array));
    expect(imported.carLoan.receipts).toEqual(expect.any(Array));
    expect(imported.settings.layoutViews).toEqual({
      dashboard: 1,
      money: 2,
      bills: 3,
      inventory: 4,
      transactions: 3,
      reports: 4,
    });
  });

  it("preserves valid layout views and repairs invalid selections", () => {
    const imported = normalizeAppData({
      sections: {},
      settings: {
        layoutViews: {
          dashboard: 5,
          money: 0,
          bills: 9,
          inventory: 2,
          transactions: 4,
          reports: 1,
        },
      },
    });

    expect(imported.settings.layoutViews).toEqual({
      dashboard: 5,
      money: 2,
      bills: 3,
      inventory: 2,
      transactions: 4,
      reports: 1,
    });
  });

  it("renames legacy cash labels and removes recurring transaction fields", () => {
    const imported = normalizeAppData({
      sections: {
        money: [{ id: "wallet", cells: { label: "Cash on Hand", section: "cash", amount: "40" } }],
        transactions: [{
          id: "cash-purchase",
          cells: {
            description: "Paid from Cash on Hand",
            type: "expense",
            amount: "5",
            account: "Cash on Hand",
            recurring: "Yes",
            notes: "Cash on hand purchase",
          },
        }],
      },
      paycheckHistory: [{ id: "pay", depositAccountLabel: "Cash on Hand" }],
    });

    expect(imported.sections.money[0].cells.label).toBe("Cash");
    expect(imported.sections.transactions.find((row) => row.id === "cash-purchase")?.cells).toMatchObject({
      description: "Paid from Cash",
      account: "Cash",
      notes: "Cash purchase",
    });
    expect(imported.sections.transactions.find((row) => row.id === "cash-purchase")?.cells).not.toHaveProperty("recurring");
    expect(imported.paycheckHistory[0].depositAccountLabel).toBe("Cash");
  });

  it("migrates receipt tax rows into cent-accurate item totals", () => {
    const imported = normalizeAppData({
      version: 3,
      sections: {
        transactions: [
          { id: "receipt-item-1", cells: { receiptId: "receipt-1", description: "Water", type: "expense", amount: "-7.00" } },
          { id: "receipt-item-2", cells: { receiptId: "receipt-1", description: "Snack", type: "expense", amount: "-1.25" } },
          { id: "receipt-tax", cells: { receiptId: "receipt-1", description: "Sales tax", type: "expense", amount: "-0.50" } },
        ],
      },
    });

    expect(imported.version).toBe(5);
    expect(imported.sections.transactions.filter((row) => row.cells.receiptId === "receipt-1").map((row) => row.cells)).toEqual([
      expect.objectContaining({ description: "Water", salesTax: "0.42", amount: "-7.42", receiptTotal: "8.75" }),
      expect.objectContaining({ description: "Snack", salesTax: "0.08", amount: "-1.33", receiptTotal: "8.75" }),
    ]);
  });

  it("deduplicates exact accounts and conservatively merges duplicate inventory on import", () => {
    const imported = normalizeAppData({
      sections: {
        money: [
          { id: "cash-1", cells: { label: "Cash", section: "cash", amount: "10" } },
          { id: "cash-2", cells: { label: " cash ", section: "cash", amount: "$10.00" } },
        ],
        inventory: [
          { id: "water-1", cells: { item: "Water", qty: "5", minNeeded: "2" } },
          { id: "water-2", cells: { item: "water", qty: "0", minNeeded: "3" } },
        ],
      },
    });

    expect(imported.sections.money).toHaveLength(1);
    expect(imported.sections.inventory).toHaveLength(1);
    expect(imported.sections.inventory[0].cells).toMatchObject({ qty: "0", minNeeded: "3", alert: "Critical" });
    expect(imported.sections.inventory[0].cells.duplicateMergeEvidence).toBeTruthy();
  });
});
