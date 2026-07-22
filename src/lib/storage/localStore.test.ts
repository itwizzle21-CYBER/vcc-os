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
});
