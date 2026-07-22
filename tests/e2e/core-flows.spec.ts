import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem("vcc-e2e-initialized")) return;
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.sessionStorage.setItem("vcc-e2e-initialized", "true");
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

test("dashboard exposes trustworthy decisions, metrics, and module routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("status", { name: /Welcome to VCC-OS/i })).toBeHidden({ timeout: 6_000 });

  await expect(page.getByRole("heading", { name: "VCC-OS Dashboard" })).toBeAttached();
  await expect(page.getByText("Recommended next move", { exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(3);
  for (const href of ["/money", "/bills", "/inventory", "/transactions", "/savings", "/goals", "/car-payment"]) {
    await expect(page.locator(`.dashboard-module-card[href="${href}"]`)).toHaveCount(1);
  }

  const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewport).not.toContain("user-scalable=no");
  expect(viewport).not.toContain("maximum-scale=1");

  const mission = page.locator(".mission-banner");
  const missionHref = await mission.getAttribute("href");
  expect(["/money", "/bills", "/inventory", "/savings", "/debt", "/goals", "/transactions"]).toContain(missionHref);
  await mission.click();
  await expect(page).toHaveURL(new RegExp(`${missionHref}$`));
});

test("dashboard keeps system status readable in light mode", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("vcc-os:theme-preference", "light"));
  await page.goto("/");
  await expect(page.getByRole("status", { name: /Welcome to VCC-OS/i })).toBeHidden({ timeout: 6_000 });
  const color = await page.locator(".dashboard-status-line").evaluate((element) => getComputedStyle(element).color);
  const channels = color.match(/\d+/g)?.slice(0, 3).map(Number) || [];
  expect(channels).toHaveLength(3);
  const luminance = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const foreground = 0.2126 * luminance(channels[0]) + 0.7152 * luminance(channels[1]) + 0.0722 * luminance(channels[2]);
  const contrastAgainstWhite = 1.05 / (foreground + 0.05);
  expect(contrastAgainstWhite).toBeGreaterThanOrEqual(4.5);
});

test("mobile dashboard launchers stay distinct and keyboard-operable", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile launcher behavior.");
  await page.goto("/");
  await expect(page.getByRole("status", { name: /Welcome to VCC-OS/i })).toBeHidden({ timeout: 6_000 });

  const quick = page.getByRole("button", { name: "Open quick page launcher" });
  const agent = page.getByRole("button", { name: "Open VCC Agent" });
  const sync = page.locator(".cloud-sync-trigger");
  const boxes = await Promise.all([quick.boundingBox(), agent.boundingBox(), sync.boundingBox()]);
  expect(boxes.every(Boolean)).toBe(true);
  const overlaps = (a: NonNullable<(typeof boxes)[number]>, b: NonNullable<(typeof boxes)[number]>) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  expect(overlaps(boxes[0]!, boxes[1]!)).toBe(false);
  expect(overlaps(boxes[0]!, boxes[2]!)).toBe(false);
  expect(overlaps(boxes[1]!, boxes[2]!)).toBe(false);

  await quick.click();
  const dashboardItem = page.getByRole("menuitem", { name: "Dashboard" });
  await expect(dashboardItem).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("menuitem", { name: "Money Snapshot" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(quick).toBeFocused();

  const navigationTrigger = page.getByRole("button", { name: "Open navigation menu" });
  await navigationTrigger.click();
  const drawer = page.getByRole("navigation", { name: "Primary mobile navigation" });
  const closeNavigation = drawer.getByRole("button", { name: "Close navigation menu" });
  await expect(closeNavigation).toBeVisible();
  await closeNavigation.click();
  await expect(navigationTrigger).toBeVisible();
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

test("VCC Agent learns conversational preferences and can forget them", async ({ page }) => {
  await page.goto("/goals");
  await page.getByRole("button", { name: "Open VCC Agent" }).click();
  await page.getByRole("button", { name: "Get to know me" }).click();
  const input = page.getByRole("textbox", { name: "Ask VCC Agent" });
  await input.fill("build an emergency fund");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText(/What creates the most pressure today/)).toBeVisible();
  await input.fill("bills arrive too close together");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText(/How should I guide you/)).toBeVisible();
  await input.fill("one step at a time");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText(/respond in a step-by-step way/)).toBeVisible();
  await page.getByRole("button", { name: "Forget what you learned" }).click();
  await expect(page.getByText(/cleared what I learned/)).toBeVisible();
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

test("loads every application page without runtime or heading-structure failures", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  for (const path of [
    "/money", "/bills", "/income", "/transactions", "/debt", "/debts", "/car-payment",
    "/savings", "/inventory", "/goals", "/reports", "/missions", "/settings", "/vitascan",
  ]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
  }

  expect(errors).toEqual([]);
});

test("keeps rejected duplicate inventory edits and blank currency cells consistent", async ({ page }) => {
  await page.goto("/inventory");
  await page.getByRole("button", { name: "Add Item" }).click();
  const newItem = page.locator('input[aria-label^="Item, Inventory row"]').last();
  await newItem.fill("Milk");
  await page.locator("h1").click();
  await expect(page.getByRole("alert")).toContainText("already in Inventory");
  await expect(newItem).toHaveValue("");

  const blankCost = page.locator('input[aria-label^="Cost, Inventory row"]').last();
  await blankCost.focus();
  await page.locator("h1").click();
  await expect(blankCost).toHaveValue("");
  const savedCost = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return saved.sections.inventory.at(-1).cells.cost;
  });
  expect(savedCost).toBe("");
});

test("traps focus in the background picker and restores it on close", async ({ page }) => {
  await page.goto("/settings#settings-appearance");
  await page.getByRole("link", { name: "Appearance" }).click();
  const manage = page.getByRole("button", { name: "Manage backgrounds" });
  await manage.click();
  const dialog = page.getByRole("dialog", { name: "Choose VCC background" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close background picker" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Save background" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close background picker" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(manage).toBeFocused();
});

test("VitaScan saves to this VCC workspace and keeps light-theme actions readable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "The OCR handoff only needs one browser execution.");
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem("vcc-os:theme-preference", "light"));
  await page.goto("/vitascan");
  const transactionsLink = page.getByRole("link", { name: "Open VCC Transactions" });
  await expect(transactionsLink).toHaveAttribute("href", "/transactions");
  expect(await transactionsLink.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(7, 89, 133)");

  await page.getByLabel("Use screenshot").setInputFiles("tests/fixtures/retail-receipt.svg");
  await expect(page.getByRole("heading", { name: "Details captured" })).toBeVisible({ timeout: 90_000 });
  await expect(page.getByPlaceholder("Store or payee")).toHaveValue("NORTH MARKET");
  await expect(page.getByPlaceholder("0.00")).toHaveValue("10.56");
  await page.getByRole("button", { name: "Add to VCC" }).click();
  const viewTransactions = page.getByRole("link", { name: "View in Transactions" });
  await expect(viewTransactions).toHaveAttribute("href", "/transactions");
  await viewTransactions.click();
  await expect(page).toHaveURL(/127\.0\.0\.1:4173\/transactions$/);
  await expect(page.locator('input[aria-label^="Description, Transactions row"]').last()).toHaveValue("NORTH MARKET");
});

test("exercises major navigation, filter, report, and car-loan controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop control matrix; mobile navigation has dedicated coverage.");
  await page.setViewportSize({ width: 1600, height: 900 });

  await page.goto("/bills");
  await expect(page.getByRole("link", { name: "Notification settings" })).toHaveAttribute("href", "/settings#settings-notifications");
  for (const filter of ["Overdue", "Unpaid"]) {
    const button = page.getByRole("button", { name: filter });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    const shownStat = page.locator(".bills-inline-stats span").first();
    await expect(shownStat).toHaveText(/^\d+ shown$/);
    const shownCount = Number((await shownStat.textContent())?.split(" ")[0]);
    await expect(page.locator("table tbody tr")).toHaveCount(shownCount);
  }
  await page.getByRole("textbox", { name: "Search VCC OS" }).fill("Goals");
  await expect(page.locator(".search-results").getByRole("link", { name: /Goals/ }).first()).toBeVisible();

  await page.goto("/reports");
  await page.getByRole("button", { name: "Monthly" }).click();
  await expect(page.getByRole("button", { name: "Monthly" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: "Trend lines" }).click();
  await expect(page.getByRole("tab", { name: "Trend lines" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Next chart" }).last().click();
  await expect(page.getByRole("tab", { name: "Milestones" })).toHaveAttribute("aria-selected", "true");

  await page.goto("/car-payment");
  for (const [tab, heading] of [
    ["Payment Receipts", "Confirmed receipt evidence"],
    ["Amortization", "Amortization schedule"],
    ["Dealer Communications", "Communications"],
    ["Original Contract", "Contract reference"],
    ["Overview", "Where the money went"],
  ] as const) {
    await page.getByRole("button", { name: tab }).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});

test("keeps the closed mobile drawer inert and restores focus after use", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile keyboard containment check.");
  await page.goto("/settings");
  const drawer = page.getByRole("navigation", { name: "Primary mobile navigation", includeHidden: true });
  await expect(drawer).toHaveAttribute("inert", "");
  const trigger = page.getByRole("button", { name: "Open navigation menu" }).last();
  await trigger.click();
  await expect(drawer).not.toHaveAttribute("inert", "");
  await expect(drawer.getByRole("link", { name: "VCC OS" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveAttribute("inert", "");
  await expect(trigger).toBeFocused();
});
