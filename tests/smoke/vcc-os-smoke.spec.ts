import { expect, test, type Page } from "@playwright/test";

const navigationPages = [
  "Dashboard",
  "Money Snapshot",
  "Bills",
  "Income",
  "Budget",
  "Transactions",
  "Debt",
  "Protected Savings Vault",
  "Inventory",
  "Buy Next",
  "Activity",
  "Goals",
  "Missions",
  "Settings",
];

test("VCC_OS production smoke test", async ({ page, baseURL }) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(new RegExp(escapeRegExp(baseURL ?? "https://vcc-os.vercel.app")));
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("VCC Command Center")).toBeVisible();

  for (const label of navigationPages) {
    await openNavigationPage(page, label);
  }

  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page).toHaveURL(/#\/settings$/);
  await page.goto("/#/settings", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset All Data" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export Backup" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import Backup" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear Cache" })).toBeVisible();
  await expect(page.getByText("Storage Status")).toBeVisible();
  await expect(page.getByText("Version")).toBeVisible();
  await expect(page.getByText("Diagnostics")).toBeVisible();

  expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);
});

async function openNavigationPage(page: Page, label: string) {
  const navButton = page.getByRole("button").filter({ hasText: label }).first();
  await expect(navButton, `Missing navigation for ${label}`).toBeVisible();
  await navButton.click();

  if (label === "Dashboard") {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    return;
  }

  await expect(page.getByRole("heading", { name: label })).toBeVisible();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
