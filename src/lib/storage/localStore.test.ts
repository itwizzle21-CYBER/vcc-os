import { afterEach, describe, expect, it, vi } from "vitest";
import { loadThemePreference, normalizeAppData, resetAllData, saveThemePreference, THEME_PREFERENCE_KEY } from "./localStore";

function installLocalStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
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
});

describe("theme preference", () => {
  it("uses the app-data theme when no device preference has been saved", () => {
    installLocalStorage();
    expect(loadThemePreference("system")).toBe("system");
    expect(loadThemePreference("dark")).toBe("dark");
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

describe("import normalization", () => {
  it("repairs partial exports before they reach the application state", () => {
    const imported = normalizeAppData({ sections: {}, settings: { accountName: "Imported" } });

    expect(imported.settings.accountName).toBe("Imported");
    expect(imported.sections.inventory).toEqual([]);
    expect(imported.sections.transactions).toEqual(expect.any(Array));
    expect(imported.carLoan.receipts).toEqual(expect.any(Array));
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

    expect(imported.version).toBe(4);
    expect(imported.sections.transactions.filter((row) => row.cells.receiptId === "receipt-1").map((row) => row.cells)).toEqual([
      expect.objectContaining({ description: "Water", salesTax: "0.42", amount: "-7.42", receiptTotal: "8.75" }),
      expect.objectContaining({ description: "Snack", salesTax: "0.08", amount: "-1.33", receiptTotal: "8.75" }),
    ]);
  });
});
