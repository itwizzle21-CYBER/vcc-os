import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("shows a brief, skippable welcome before the dashboard", async ({ page }) => {
  await page.goto("/");
  const welcome = page.getByRole("status", { name: /Welcome to VCC-OS/i });
  await expect(welcome).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip intro" })).toBeVisible();
  await expect(welcome).toBeHidden({ timeout: 6_000 });
  await expect(page.getByRole("heading", { name: /Stabilize|Build|Protect|Restock/i }).first()).toBeVisible();
});

test("uses the current time of day in the dashboard greeting", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("status", { name: /Welcome to VCC-OS/i })).toBeHidden({ timeout: 6_000 });
  const hour = new Date().getHours();
  const expected = hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
  await expect(page.locator(".dashboard-brand-copy small")).toHaveText(expected);
});

test("renders an actionable not-found page for unknown routes", async ({ page }) => {
  await page.goto("/not-a-real-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /outside the command center/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute("href", "/");
});

test("keeps desktop navigation labels visible and navigates correctly", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop navigation uses the mobile drawer on small screens.");
  await page.goto("/bills");
  const moneyLink = page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Money Snapshot" });
  await expect(moneyLink).toBeVisible();
  expect((await moneyLink.boundingBox())?.width).toBeGreaterThan(70);
  await moneyLink.click();
  await expect(page).toHaveURL(/\/money$/);
  await expect(page.getByRole("heading", { name: "Money Snapshot", exact: true })).toBeVisible();
});

test("requires confirmation before deleting a financial row", async ({ page }) => {
  await page.goto("/bills");
  const rows = page.locator("table tbody tr");
  const initialCount = await rows.count();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Delete Bills row 1" }).click();
  await expect(rows).toHaveCount(initialCount);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Bills row 1" }).click();
  await expect(rows).toHaveCount(initialCount - 1);
});

test("mobile navigation exposes labeled destinations", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile navigation check.");
  await page.goto("/settings");
  await page.getByRole("button", { name: "Open navigation menu" }).first().click();
  const drawer = page.getByRole("navigation", { name: "Primary mobile navigation" });
  await expect(drawer.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Transactions" })).toBeVisible();
});

test("VCC Agent stays out of the way and can start a guided walkthrough", async ({ page }) => {
  await page.goto("/money");
  await expect(page.getByRole("button", { name: "Open VCC Agent" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Chat with VCC Agent" })).toBeHidden();
  await page.getByRole("button", { name: "Open VCC Agent" }).click();
  await expect(page.getByRole("dialog", { name: "Chat with VCC Agent" })).toBeVisible();
  await page.getByRole("textbox", { name: "Ask VCC Agent" }).fill("Walk me through VCC");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText(/Money Snapshot → Bills → Income/).last()).toBeVisible();
  await expect(page.getByRole("link", { name: /Begin the walkthrough/ })).toHaveAttribute("href", "/money");

  await page.getByRole("textbox", { name: "Ask VCC Agent" }).fill("Can I safely spend today?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText(/Hold non-essential spending|Spendable \/ Safe amount/).last()).toBeVisible();
  await page.getByText("Small reason").last().click();
  await expect(page.getByText(/Based on: Money Snapshot and bills/)).toBeVisible();
});

test("configures the welcome content, duration, and style", async ({ page }) => {
  await page.goto("/settings#settings-appearance");
  await page.getByRole("link", { name: "Appearance" }).click();
  await page.getByRole("textbox", { name: "Welcome headline" }).fill("Ready to build");
  await page.getByRole("textbox", { name: "Supporting message" }).fill("Loading today’s priorities");
  await page.getByRole("button", { name: "Sweep" }).click();
  await page.getByRole("slider", { name: "Welcome display time" }).fill("5");
  await expect(page.getByText("5s", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Preview welcome" }).click();
  const welcome = page.getByRole("status", { name: /Welcome to VCC-OS/i });
  await expect(welcome).toContainText("Ready to build");
  await expect(welcome).toContainText("Loading today’s priorities");
  await expect(welcome).toHaveClass(/welcome-transition-sweep/);
  await expect(welcome).toBeHidden({ timeout: 6_500 });
});

test("has no measurable accessibility failures on the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("status", { name: /Welcome to VCC-OS/i })).toBeHidden({ timeout: 6_000 });
  const failures = await page.evaluate(() => {
    const visible = (element: Element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== "hidden";
    };
    const issues: string[] = [];
    document.querySelectorAll("img").forEach((image) => {
      if (!image.hasAttribute("alt")) issues.push("Image missing alt text");
    });
    document.querySelectorAll("button,a").forEach((control) => {
      if (!visible(control)) return;
      const name = control.textContent?.trim() || control.getAttribute("aria-label");
      const box = control.getBoundingClientRect();
      if (!name) issues.push("Visible control missing an accessible name");
      if (box.width < 24 || box.height < 24) issues.push(`Undersized target: ${Math.round(box.width)}x${Math.round(box.height)}`);
    });
    if (document.querySelectorAll("h1").length !== 1) issues.push("Page must expose exactly one h1");
    if (!document.querySelector("main")) issues.push("Page missing main landmark");
    return issues;
  });
  expect(failures).toEqual([]);
});
