import { expect, test } from "@playwright/test";
import { createStarterData } from "../../src/lib/storage/defaultData";

const APP_DATA_STORAGE_KEY = "vcc-os:data:v2";
const regressionFixture = createStarterData();

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ fixture, storageKey }) => {
    const writes: string[] = [];
    Object.defineProperty(window, "__vccAppWrites", { configurable: true, value: writes });
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (key === storageKey) writes.push(value);
      return originalSetItem.call(this, key, value);
    };

    if (window.sessionStorage.getItem("vcc-persistence-e2e-initialized")) return;
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(storageKey, JSON.stringify(fixture));
    window.sessionStorage.setItem("vcc-persistence-e2e-initialized", "true");
  }, { fixture: regressionFixture, storageKey: APP_DATA_STORAGE_KEY });
});

test("persists one app snapshot for one settings mutation and restores it", async ({ page }) => {
  await page.goto("/settings#settings-profile");
  const greetingName = page.getByRole("textbox", { name: "Greeting name" });
  await expect(greetingName).toBeVisible();
  await page.evaluate(() => {
    (window as Window & { __vccAppWrites: string[] }).__vccAppWrites.length = 0;
  });

  await greetingName.fill("Persistent Owner");

  await expect.poll(() => page.evaluate(() => (
    window as Window & { __vccAppWrites: string[] }
  ).__vccAppWrites.length)).toBe(1);
  await expect.poll(() => page.evaluate((storageKey) => (
    JSON.parse(localStorage.getItem(storageKey) || "{}").settings?.accountName
  ), APP_DATA_STORAGE_KEY)).toBe("Persistent Owner");

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Greeting name" })).toHaveValue("Persistent Owner");
});

test("resets only the selected section through Settings", async ({ page }) => {
  await page.goto("/settings#settings-data");
  await page.getByRole("link", { name: "Data & storage" }).click();
  const beforeMoney = await page.evaluate((storageKey) => (
    JSON.parse(localStorage.getItem(storageKey) || "{}").sections?.money
  ), APP_DATA_STORAGE_KEY);
  const beforeTransactions = await page.evaluate((storageKey) => (
    JSON.parse(localStorage.getItem(storageKey) || "{}").sections?.transactions
  ), APP_DATA_STORAGE_KEY);
  await page.evaluate(() => {
    (window as Window & { __vccAppWrites: string[] }).__vccAppWrites.length = 0;
  });

  await page.getByText("Advanced reset controls").click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset Transactions" }).click();

  await expect.poll(() => page.evaluate((storageKey) => (
    JSON.parse(localStorage.getItem(storageKey) || "{}").sections?.transactions?.length
  ), APP_DATA_STORAGE_KEY)).toBe(0);
  expect(await page.evaluate((storageKey) => (
    JSON.parse(localStorage.getItem(storageKey) || "{}").sections?.money
  ), APP_DATA_STORAGE_KEY)).toEqual(beforeMoney);
  expect(await page.evaluate(() => (
    window as Window & { __vccAppWrites: string[] }
  ).__vccAppWrites.length)).toBe(1);

  await expect(page.getByText("Before Transactions reset")).toBeVisible();
  await page.getByRole("button", { name: "Restore" }).first().click();
  await expect.poll(() => page.evaluate((storageKey) => (
    JSON.parse(localStorage.getItem(storageKey) || "{}").sections?.transactions
  ), APP_DATA_STORAGE_KEY)).toEqual(beforeTransactions);
  await expect(page.getByText("Recovery point restored.")).toBeVisible();
});
