import { expect, test } from "@playwright/test";
import { createStarterData } from "../../src/lib/storage/defaultData";

const regressionFixture = createStarterData();

test.beforeEach(async ({ page }) => {
  await page.addInitScript((fixture) => {
    if (window.sessionStorage.getItem("vcc-e2e-initialized")) return;
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem("vcc-os:data:v2", JSON.stringify(fixture));
    window.sessionStorage.setItem("vcc-e2e-initialized", "true");
  }, regressionFixture);
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
  await expect(page.getByRole("heading", { name: "System Priority Stack" })).toBeVisible();
  expect(await page.locator(".dashboard-mission-stack").getByRole("progressbar").count()).toBeGreaterThanOrEqual(4);
  const moneyCard = page.locator(".dashboard-money-account-card");
  await expect(moneyCard).toHaveCount(1);
  await expect(moneyCard.getByRole("link", { name: "Open Money Snapshot" })).toHaveAttribute("href", "/money");
  await expect(moneyCard.getByText("Live balances", { exact: true })).toBeVisible();
  await expect(moneyCard.locator(".dashboard-money-account-slide")).toHaveCount(1);
  await expect(moneyCard.getByRole("button", { name: "Automatic account rotation" })).toBeVisible();
  for (const [title, href] of [
    ["Transactions", "/transactions"],
    ["Bills", "/bills"],
    ["Inventory", "/inventory"],
    ["Savings", "/savings"],
    ["Goals", "/goals"],
    ["Car Payment", "/car-payment"],
  ]) {
    await expect(page.getByRole("link", { name: `Open ${title}`, exact: true })).toHaveAttribute("href", href);
  }

  const billsCard = page.getByRole("article", { name: "Bills metric slideshow" });
  await expect(billsCard.locator(".dashboard-live-metric-slide")).toHaveCount(1);
  const billsBefore = await billsCard.locator(".dashboard-live-metric-slide").innerText();
  await billsCard.getByRole("button", { name: "Show next Bills metric" }).click();
  await expect(billsCard.locator(".dashboard-live-metric-slide")).not.toHaveText(billsBefore);
  await expect(billsCard.getByRole("button", { name: "Automatic Bills rotation" })).toHaveAttribute("aria-pressed", "false");

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

test("mobile dashboard uses an iOS-style tab bar and keyboard-operable More sheet", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile navigation behavior.");
  await page.goto("/");
  await expect(page.getByRole("status", { name: /Welcome to VCC-OS/i })).toBeHidden({ timeout: 6_000 });

  const tabBar = page.getByRole("navigation", { name: "Mobile tab navigation" });
  await expect(tabBar.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  await expect(tabBar.getByRole("link", { name: "Money" })).toHaveAttribute("href", "/money");
  await expect(tabBar.getByRole("link", { name: "Transactions" })).toHaveAttribute("href", "/transactions");
  await expect(tabBar.getByRole("link", { name: "Bills" })).toHaveAttribute("href", "/bills");

  const more = tabBar.getByRole("button", { name: "Open More navigation" });
  const agent = page.getByRole("button", { name: "Open VCC Agent" });
  const sync = page.locator(".cloud-sync-trigger");
  const boxes = await Promise.all([tabBar.boundingBox(), agent.boundingBox(), sync.boundingBox()]);
  expect(boxes.every(Boolean)).toBe(true);
  const overlaps = (a: NonNullable<(typeof boxes)[number]>, b: NonNullable<(typeof boxes)[number]>) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  expect(overlaps(boxes[0]!, boxes[1]!)).toBe(false);
  expect(overlaps(boxes[0]!, boxes[2]!)).toBe(false);
  expect(overlaps(boxes[1]!, boxes[2]!)).toBe(false);

  await more.click();
  const drawer = page.getByRole("navigation", { name: "Primary mobile navigation" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Inventory" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
});

test("renders an actionable not-found page for unknown routes", async ({ page }) => {
  await page.goto("/not-a-real-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /outside the command center/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute("href", "/");
});

test("publishes VitaScan mobile install identity before the VCC app boots", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile installation metadata.");
  await page.route("**/main.tsx", (route) => route.abort());

  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/vcc.webmanifest");
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute("content", "VCC-OS");

  await page.goto("/vitascan");
  await expect(page).toHaveTitle("VitaScan — VCC Receipt Scanner");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/vitascan.webmanifest");
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute("content", "VitaScan");
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute("content", "VitaScan");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/icons/vitascan-apple-180.png?v=2");
});

test("keeps desktop navigation labels visible and navigates correctly", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop navigation uses the mobile drawer on small screens.");
  await page.setViewportSize({ width: 1068, height: 705 });
  await page.goto("/bills");
  const navigation = page.getByRole("navigation", { name: "Primary navigation" });
  const moneyLink = navigation.getByRole("link", { name: "Money Snapshot" });
  await expect(moneyLink).toBeVisible();
  expect((await moneyLink.boundingBox())?.width).toBeGreaterThan(70);
  const navigationBox = await navigation.boundingBox();
  const dashboardBox = await navigation.getByRole("link", { name: "Dashboard" }).boundingBox();
  const settingsBox = await navigation.getByRole("link", { name: "Settings" }).boundingBox();
  expect(navigationBox && dashboardBox && settingsBox).toBeTruthy();
  expect(dashboardBox!.x).toBeGreaterThanOrEqual(navigationBox!.x);
  expect(settingsBox!.x + settingsBox!.width).toBeLessThanOrEqual(navigationBox!.x + navigationBox!.width);
  await moneyLink.click();
  await expect(page).toHaveURL(/\/money$/);
  await expect(page.getByRole("heading", { name: "Money Snapshot", exact: true })).toBeVisible();
});

test("deletes a bill immediately and offers undo without a confirmation dialog", async ({ page }) => {
  await page.goto("/bills");
  const rows = page.locator("table tbody tr");
  const initialCount = await rows.count();
  let dialogCount = 0;
  page.on("dialog", async (dialog) => {
    dialogCount += 1;
    await dialog.dismiss();
  });

  await page.getByRole("button", { name: "Delete Bills row 1" }).click();
  await expect(rows).toHaveCount(initialCount - 1);
  await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  expect(dialogCount).toBe(0);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(rows).toHaveCount(initialCount);
});

test("keeps every core domain page available without a page-level hide control", async ({ page }) => {
  test.setTimeout(60_000);
  for (const [path, title] of [
    ["/", "VCC-OS Dashboard"],
    ["/money", "Money Snapshot"],
    ["/bills", "Bills"],
    ["/transactions", "Transactions"],
    ["/inventory", "Inventory"],
    ["/savings", "Savings"],
    ["/debt", "Debt"],
    ["/goals", "Goals"],
    ["/car-payment", "Car Payment"],
    ["/vitascan", "Scan it. Send it to VCC."],
  ]) {
    await page.goto(path);
    await expect(page.locator("main").getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^(Collapse|Expand) .+ page$/i })).toHaveCount(0);
  }
});

test("posting a paid bill debits one account and creates one linked transaction", async ({ page }) => {
  await page.goto("/bills");
  const initial = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return Number.parseFloat(data.sections.money.find((row: { cells: { label: string } }) => row.cells.label === "Chime Checking").cells.amount.replace(/[^0-9.-]/g, ""));
  });

  await page.getByRole("combobox", { name: /Status, Bills row 1/ }).selectOption("paid");
  const paymentDialog = page.getByRole("dialog", { name: /Mark Electric bill paid/i });
  await expect(paymentDialog).toBeVisible();
  await paymentDialog.getByLabel("Paid From").selectOption("Chime Checking");
  await expect(paymentDialog.getByLabel("Paid Date")).not.toHaveValue("");
  await paymentDialog.getByRole("button", { name: "Record payment" }).click();
  await expect(paymentDialog).toBeHidden();

  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    const bill = data.sections.bills[0];
    const linked = data.sections.transactions.filter((row: { cells: { billId?: string } }) => row.cells.billId === bill.id);
    const account = data.sections.money.find((row: { cells: { label: string } }) => row.cells.label === "Chime Checking");
    return { status: bill.cells.status, linked: linked.length, balance: Number.parseFloat(account.cells.amount) };
  })).toEqual({ status: "paid", linked: 1, balance: initial - 186.42 });

  await page.reload();
  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return data.sections.transactions.filter((row: { cells: { billId?: string } }) => row.cells.billId === data.sections.bills[0].id).length;
  })).toBe(1);

  await page.getByRole("button", { name: "Delete Bills row 1" }).click();
  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    const linked = data.sections.transactions.filter((row: { cells: { billId?: string } }) => row.cells.billId === "bill-electric");
    const account = data.sections.money.find((row: { cells: { label: string } }) => row.cells.label === "Chime Checking");
    return { bill: data.sections.bills.some((row: { id: string }) => row.id === "bill-electric"), linked: linked.length, balance: Number.parseFloat(account.cells.amount) };
  })).toEqual({ bill: false, linked: 0, balance: initial });

  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    const bill = data.sections.bills.find((row: { id: string }) => row.id === "bill-electric");
    const linked = data.sections.transactions.filter((row: { cells: { billId?: string } }) => row.cells.billId === "bill-electric");
    const account = data.sections.money.find((row: { cells: { label: string } }) => row.cells.label === "Chime Checking");
    return { status: bill?.cells.status, paidFrom: bill?.cells.paymentAccount, linked: linked.length, balance: Number.parseFloat(account.cells.amount) };
  })).toEqual({ status: "paid", paidFrom: "Chime Checking", linked: 1, balance: initial - 186.42 });
});

test("preserves supported bill statuses and clears payment evidence when a bill is reopened", async ({ page }) => {
  await page.goto("/bills");
  const status = page.getByRole("combobox", { name: /Status, Bills row 1/ });
  const paidFrom = page.getByRole("combobox", { name: /Paid From, Bills row 1/ });

  await status.selectOption("cancelled");
  await expect(status).toHaveValue("cancelled");
  await page.reload();
  await expect(page.getByRole("combobox", { name: /Status, Bills row 1/ })).toHaveValue("cancelled");

  await paidFrom.selectOption("Chime Checking");
  await status.selectOption("paid");
  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return data.sections.bills[0].cells;
  })).toMatchObject({ status: "paid", paymentAccount: "Chime Checking" });

  await status.selectOption("unpaid");
  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    const bill = data.sections.bills[0];
    return {
      status: bill.cells.status,
      paymentAccount: bill.cells.paymentAccount,
      paidDate: bill.cells.paidDate,
      linked: data.sections.transactions.filter((row: { cells: { billId?: string } }) => row.cells.billId === bill.id).length,
    };
  })).toEqual({ status: "unpaid", paymentAccount: "", paidDate: "", linked: 0 });
});

test("sorts paycheck history chronologically without rewriting stored records", async ({ page }) => {
  await page.goto("/money");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}").paycheckPlanner?.depositApplied)).toBe(true);
  const storedOrder = ["middle", "oldest", "newest"];
  await page.evaluate((history) => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    data.paycheckHistory = history;
    localStorage.setItem("vcc-os:data:v2", JSON.stringify(data));
  }, [
    { id: "middle", payDate: "2026-08-15", income: "800", spotMe: "0", myPay: "0", remaining: "800", weekStart: "2026-08-10", weekEnd: "2026-08-16", locked: true },
    { id: "oldest", payDate: "2026-08-01", income: "700", spotMe: "0", myPay: "0", remaining: "700", weekStart: "2026-07-27", weekEnd: "2026-08-02", locked: true },
    { id: "newest", payDate: "2026-08-22", income: "900", spotMe: "0", myPay: "0", remaining: "900", weekStart: "2026-08-17", weekEnd: "2026-08-23", locked: true },
  ]);
  await page.reload();

  const records = page.locator(".money-history-record");
  await expect(records).toHaveCount(3);
  await expect(records.locator("small")).toHaveText(["08-22-2026", "08-15-2026", "08-01-2026"]);
  await page.getByRole("combobox", { name: "Sort paycheck history" }).selectOption("oldest");
  await expect(records.locator("small")).toHaveText(["08-01-2026", "08-15-2026", "08-22-2026"]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}").paycheckHistory.map((row: { id: string }) => row.id))).toEqual(storedOrder);
});

test("edits and persists multiline Inventory Notes without hijacking caret keys", async ({ page }) => {
  await page.goto("/inventory");
  const notes = page.locator('textarea[data-column-key="notes"]').first();
  const rowId = await notes.getAttribute("data-row-id");
  const value = "Restock after payday\nUse warehouse coupon";

  await notes.click();
  await notes.fill(value);
  await notes.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  });
  await page.keyboard.press("ArrowLeft");
  expect(await notes.evaluate((element) => (element as HTMLTextAreaElement).selectionStart)).toBe(value.length - 1);
  await notes.blur();
  await expect.poll(() => page.evaluate(({ id, expected }) => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return data.sections.inventory.find((row: { id: string }) => row.id === id)?.cells.notes === expected;
  }, { id: rowId, expected: value })).toBe(true);

  await page.reload();
  await expect(page.locator(`textarea[data-row-id="${rowId}"][data-column-key="notes"]`)).toHaveValue(value);
  const viewportFits = await page.locator(".inventory-page").evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
  expect(viewportFits).toBe(true);
});

test("mobile swipe intentionally reveals transaction deletion and requires confirmation", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile swipe behavior.");
  await page.goto("/transactions");
  const firstRow = page.locator(".transaction-simple-row").first();
  await expect(firstRow).toBeVisible();
  const initialCount = await page.locator(".transaction-simple-row").count();

  await firstRow.evaluate((element) => {
    const makeTouch = (clientX: number) => new Touch({ identifier: 1, target: element, clientX, clientY: 120 });
    element.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, cancelable: true, touches: [makeTouch(250)] }));
    element.dispatchEvent(new TouchEvent("touchend", { bubbles: true, cancelable: true, changedTouches: [makeTouch(120)] }));
  });

  const deleteButton = page.locator(".transaction-swipe-row").first().getByRole("button", { name: /^Delete / });
  await expect(deleteButton).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await deleteButton.click();
  await expect(page.locator(".transaction-simple-row")).toHaveCount(initialCount - 1);
});

test("mobile navigation exposes labeled destinations", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile navigation check.");
  await page.goto("/settings");
  const tabs = page.getByRole("navigation", { name: "Mobile tab navigation" });
  await expect(tabs.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(tabs.getByRole("link", { name: "Transactions" })).toBeVisible();
  await tabs.getByRole("button", { name: "Open More navigation" }).click();
  const drawer = page.getByRole("navigation", { name: "Primary mobile navigation" });
  await expect(drawer.getByRole("link", { name: "Inventory" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Settings" })).toBeVisible();
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

test("switches between nuanced AI pet companions and remembers the selection", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Open VCC Agent" }).click();
  const companionTabs = page.getByRole("tablist", { name: "AI companion" });
  await expect(companionTabs.getByRole("tab")).toHaveCount(4);
  await expect(companionTabs.locator(".vcc-companion-art.is-tab")).toHaveCount(4);
  await expect(companionTabs.getByRole("tab", { name: "Scout" })).toHaveAttribute("aria-selected", "true");

  await companionTabs.getByRole("tab", { name: "Penny" }).click();
  await expect(page.locator(".vcc-agent-popover header strong")).toHaveText("Penny");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}").settings?.vccCompanionId)).toBe("penny");

  const input = page.getByRole("textbox", { name: "Ask VCC Agent" });
  await input.fill("What looks off?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText(/Reality check:/).last()).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Open VCC Agent" }).click();
  await expect(page.getByRole("tab", { name: "Penny" })).toHaveAttribute("aria-selected", "true");
});

test("moves an animated companion by mouse or touch and restores its saved position", async ({ page }, testInfo) => {
  await page.goto("/money");
  const launcher = page.getByRole("button", { name: "Open VCC Agent" });
  await expect(launcher.locator(".vcc-companion-art.is-launcher")).toBeVisible();
  const before = await launcher.boundingBox();
  expect(before).not.toBeNull();

  if (testInfo.project.name.includes("mobile")) {
    const session = await page.context().newCDPSession(page);
    const startX = before!.x + before!.width / 2;
    const startY = before!.y + before!.height / 2;
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y: startY, id: 1 }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 120, y: 240, id: 1 }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
    await page.mouse.down();
    await page.mouse.move(140, 180, { steps: 8 });
    await page.mouse.up();
  }

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("vcc.agent.position.v1") || "null"));
  expect(saved).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
  await page.reload();
  const restored = await launcher.boundingBox();
  expect(restored?.x).toBeCloseTo(saved.x, 0);
  expect(restored?.y).toBeCloseTo(saved.y, 0);

  await launcher.click();
  await expect(page.getByRole("dialog", { name: "Chat with VCC Agent" })).toBeVisible();
  await page.getByRole("button", { name: "Reset companion position" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("vcc.agent.position.v1"))).toBeNull();
});

test("offers a quiet companion check-in during longer VCC sessions", async ({ page }) => {
  await page.clock.install();
  await page.goto("/money");
  await expect(page.getByRole("button", { name: "Open VCC Agent" })).toBeVisible();
  await page.clock.runFor(100);
  await page.clock.fastForward(45_100);
  const nudge = page.locator(".vcc-agent-nudge");
  await expect(nudge).toBeVisible();
  await expect(nudge).toContainText(/next move|reality check|calm step|progress check/i);
  await nudge.getByRole("button", { name: /Ask/ }).click();
  await expect(page.getByRole("dialog", { name: "Chat with VCC Agent" })).toBeVisible();
  await expect(nudge).toBeHidden();
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

test("hides optional captions and hints for experienced users", async ({ page }) => {
  await page.goto("/settings#settings-appearance");
  await page.getByRole("link", { name: "Appearance" }).click();
  const guidanceToggle = page.getByLabel("Hide captions and hints");
  await guidanceToggle.check();
  await expect(page.locator("html")).toHaveAttribute("data-guidance", "minimal");

  await page.goto("/transactions");
  await expect(page.getByRole("button", { name: "Open manual receipt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add transaction" })).toBeVisible();
  await expect(page.locator(".transaction-concept-header .eyebrow")).toBeHidden();
  await expect(page.locator(".transaction-concept-header h2")).toBeVisible();
  await page.getByRole("button", { name: "Open manual receipt" }).click();
  await expect(page.locator(".receipt-popup-header .eyebrow")).toBeHidden();
  await expect(page.getByRole("button", { name: "Post receipt to Transactions" })).toBeVisible();
});

test("has no measurable accessibility failures across every application route", async ({ page }) => {
  test.setTimeout(90_000);
  const failures: string[] = [];
  for (const path of [
    "/", "/money", "/bills", "/income", "/transactions", "/debt", "/car-payment",
    "/savings", "/inventory", "/goals", "/reports", "/missions", "/settings", "/vitascan", "/not-found",
  ]) {
    await page.goto(path);
    if (path === "/") await expect(page.getByRole("status", { name: /Welcome to VCC-OS/i })).toBeHidden({ timeout: 6_000 });
    const routeFailures = await page.evaluate(() => {
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
    document.querySelectorAll("input,select,textarea").forEach((control) => {
      if (!visible(control) || (control as HTMLInputElement).type === "hidden") return;
      const id = control.getAttribute("id");
      const named = control.getAttribute("aria-label")
        || control.getAttribute("aria-labelledby")
        || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`))
        || control.closest("label");
      if (!named) issues.push("Visible form control missing a label");
    });
    if (document.querySelectorAll("h1").length !== 1) issues.push("Page must expose exactly one h1");
    if (!document.querySelector("main")) issues.push("Page missing main landmark");
    return issues;
    });
    failures.push(...routeFailures.map((issue) => `${path}: ${issue}`));
  }
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

test("keeps all 30 selectable layouts collision-free from mobile through desktop", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "This test supplies its own responsive viewport matrix.");
  test.setTimeout(420_000);
  await page.emulateMedia({ reducedMotion: "reduce" });

  const pages = [
    { label: "Dashboard", path: "/" },
    { label: "Money Snapshot", path: "/money" },
    { label: "Bills", path: "/bills" },
    { label: "Inventory", path: "/inventory" },
    { label: "Transactions", path: "/transactions" },
    { label: "Reports", path: "/reports" },
  ];
  const views = [
    { id: 1, name: "Focused Stack", description: "A calm, linear view with details revealed only when needed." },
    { id: 2, name: "Lens", description: "A side-by-side view centered on accounts, status, or categories." },
    { id: 3, name: "Timeline", description: "Activity-led sections that make sequence and progress easy to read." },
    { id: 4, name: "Command Strip", description: "Key totals first, followed by one focused working area." },
    { id: 5, name: "Review Queue", description: "Exceptions and next decisions first, with recent history beside them." },
  ];
  const viewports = [
    { width: 320, height: 844 },
    { width: 600, height: 900 },
    { width: 900, height: 900 },
    { width: 1400, height: 900 },
  ];
  const failures: string[] = [];

  for (const targetPage of pages) {
    for (const view of views) {
      await page.goto("/settings#settings-layout-views");
      const pageCard = page.getByRole("region", { name: targetPage.label, exact: true });
      const radio = pageCard.getByRole("radio", {
        name: `${view.id}. ${view.name} ${view.description}`,
        exact: true,
      });
      await radio.click();
      await expect(radio).toHaveAttribute("aria-checked", "true");

      await page.goto(targetPage.path);
      await expect(page.locator("[data-layout-view]")).toHaveAttribute("data-layout-view", String(view.id));

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }));
        const layout = await page.evaluate(() => {
          const root = document.querySelector<HTMLElement>("[data-layout-view]");
          const visible = root ? [...root.querySelectorAll<HTMLElement>("*")].filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none"
              && style.visibility !== "hidden"
              && !element.closest(".visually-hidden")
              && rect.width > 8
              && rect.height > 8;
          }) : [];
          const parents = [root, ...visible.filter((element) => {
            const style = getComputedStyle(element);
            return (style.display === "grid" || style.display === "flex")
              && element.children.length > 1
              && element.children.length <= 12;
          })].filter((element): element is HTMLElement => Boolean(element)).slice(0, 200);
          const overlaps: string[] = [];
          const structuralEscapes: string[] = [];
          const contentEscapes: string[] = [];

          for (const parent of parents) {
            const parentRect = parent.getBoundingClientRect();
            const children = [...parent.children].filter((child): child is HTMLElement => {
              if (!(child instanceof HTMLElement)) return false;
              const style = getComputedStyle(child);
              const rect = child.getBoundingClientRect();
              return style.display !== "none"
                && style.visibility !== "hidden"
                && style.position !== "absolute"
                && style.position !== "fixed"
                && rect.width > 8
                && rect.height > 8;
            });
            for (const child of children) {
              const childRect = child.getBoundingClientRect();
              if (parentRect.left - childRect.left > 3 || childRect.right - parentRect.right > 3) {
                structuralEscapes.push(
                  `${String(child.className || child.tagName)} outside ${String(parent.className || parent.tagName)}`,
                );
              }
            }
            for (let leftIndex = 0; leftIndex < children.length; leftIndex += 1) {
              for (let rightIndex = leftIndex + 1; rightIndex < children.length; rightIndex += 1) {
                const left = children[leftIndex].getBoundingClientRect();
                const right = children[rightIndex].getBoundingClientRect();
                const overlapWidth = Math.min(left.right, right.right) - Math.max(left.left, right.left);
                const overlapHeight = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
                if (overlapWidth > 3 && overlapHeight > 3 && overlapWidth * overlapHeight > 64) {
                  overlaps.push(`${String(parent.className)}: ${String(children[leftIndex].className)} / ${String(children[rightIndex].className)}`);
                }
              }
            }
          }

          const boundedContent = root ? [...root.querySelectorAll<HTMLElement>(
            "small, strong, b, p, h2, h3, dd, dt, input, select, textarea, button",
          )].filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none"
              && style.visibility !== "hidden"
              && style.position !== "absolute"
              && style.position !== "fixed"
              && !element.closest(".visually-hidden")
              && rect.width > 4
              && rect.height > 4;
          }) : [];

          for (const element of boundedContent) {
            const parent = element.parentElement;
            if (!parent || !root?.contains(parent)) continue;
            const elementRect = element.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            const escapesLeft = parentRect.left - elementRect.left;
            const escapesRight = elementRect.right - parentRect.right;
            if (escapesLeft > 3 || escapesRight > 3) {
              contentEscapes.push(
                `${element.tagName.toLowerCase()}.${String(element.className)} outside ${parent.tagName.toLowerCase()}.${String(parent.className)}`,
              );
            }
          }

          return {
            documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
            viewportWidth: window.innerWidth,
            overlaps,
            structuralEscapes: [...new Set(structuralEscapes)].slice(0, 30),
            contentEscapes: [...new Set(contentEscapes)].slice(0, 30),
            mainHeadings: document.querySelectorAll("main h1").length,
          };
        });

        if (layout.documentWidth > layout.viewportWidth) {
          failures.push(`${targetPage.label} layout ${view.id} at ${viewport.width}px: document is ${layout.documentWidth - layout.viewportWidth}px too wide`);
        }
        if (layout.overlaps.length) {
          failures.push(`${targetPage.label} layout ${view.id} at ${viewport.width}px overlaps: ${layout.overlaps.join(", ")}`);
        }
        if (layout.structuralEscapes.length) {
          failures.push(`${targetPage.label} layout ${view.id} at ${viewport.width}px structural overflow: ${layout.structuralEscapes.join(", ")}`);
        }
        if (layout.contentEscapes.length) {
          failures.push(`${targetPage.label} layout ${view.id} at ${viewport.width}px nested overflow: ${layout.contentEscapes.join(", ")}`);
        }
        if (layout.mainHeadings !== 1) {
          failures.push(`${targetPage.label} layout ${view.id} at ${viewport.width}px has ${layout.mainHeadings} main headings`);
        }
      }
    }
  }

  expect(failures).toEqual([]);
});

test("keeps wide-screen context rails readable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "This test targets full-screen desktop composition.");
  test.setTimeout(60_000);

  const chooseLayout = async (section: string, option: string) => {
    await page.goto("/settings#settings-layout-views");
    const pageCard = page.getByRole("region", { name: section, exact: true });
    await pageCard.getByRole("radio", { name: option, exact: true }).click();
  };

  await page.setViewportSize({ width: 1920, height: 1080 });
  await chooseLayout(
    "Dashboard",
    "2. Lens A side-by-side view centered on accounts, status, or categories.",
  );
  await page.goto("/");

  const dashboardMeasure = await page.locator(".mission-banner h2").evaluate((heading) => {
    const rect = heading.getBoundingClientRect();
    const lineHeight = Number.parseFloat(getComputedStyle(heading).lineHeight);
    return { lines: rect.height / lineHeight, width: rect.width };
  });
  expect(dashboardMeasure.width).toBeGreaterThan(220);
  expect(dashboardMeasure.lines).toBeLessThanOrEqual(3);

  await chooseLayout(
    "Bills",
    "4. Command Strip Key totals first, followed by one focused working area.",
  );
  await page.goto("/bills");

  const billsMeasure = await page.locator(".bills-due-primary h2").evaluate((heading) => {
    const rect = heading.getBoundingClientRect();
    const lineHeight = Number.parseFloat(getComputedStyle(heading).lineHeight);
    return { lines: rect.height / lineHeight, width: rect.width };
  });
  expect(billsMeasure.width).toBeGreaterThan(200);
  expect(billsMeasure.lines).toBeLessThanOrEqual(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("keeps rejected duplicate inventory edits and blank currency cells consistent", async ({ page }) => {
  await page.goto("/inventory");
  await page.getByRole("button", { name: "Add Item" }).click();
  const newItem = page.locator('textarea[aria-label^="Item, Inventory row"]').last();
  await newItem.fill("Milk");
  await newItem.press("Tab");
  await expect(page.getByRole("alert")).toContainText("already in Inventory");
  await expect(newItem).toHaveValue("");

  const blankCost = page.locator('input[aria-label^="Cost, Inventory row"]').last();
  await blankCost.focus();
  await blankCost.press("Tab");
  await expect(blankCost).toHaveValue("");
  const savedCost = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return saved.sections.inventory.at(-1).cells.cost;
  });
  expect(savedCost).toBe("");

  const milkQuantity = page.getByLabel("Qty, Inventory row 1");
  await milkQuantity.fill("-3");
  await milkQuantity.press("Tab");
  await expect(milkQuantity).toHaveValue("0");
  const savedQuantity = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return saved.sections.inventory.find((row: { id: string }) => row.id === "inv-milk")?.cells.qty;
  });
  expect(savedQuantity).toBe("0");
});

test("keeps overall priorities on Dashboard and ranks Inventory separately", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(page.getByRole("status", { name: /Welcome to VCC-OS/i })).toBeHidden({ timeout: 6_000 });
  await expect(page.getByRole("heading", { name: "System Priority Stack" })).toBeVisible();

  await page.goto("/bills");
  await expect(page.getByRole("region", { name: "Overall system decision" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Decision Engine bill order" })).toBeVisible();

  await page.goto("/inventory");
  await expect(page.getByRole("region", { name: "Overall system decision" })).toHaveCount(0);
  const inventoryDecision = page.getByRole("region", { name: "Decision Engine inventory order" });
  await expect(inventoryDecision).toBeVisible();
  await expect(inventoryDecision.getByRole("heading", { name: "Bread" })).toBeVisible();
  await expect(inventoryDecision.getByText(/available across non-savings accounts/)).toBeVisible();
  await expect(inventoryDecision.getByText(/Buy 1 · \$3\.25/)).toBeVisible();
  await expect(inventoryDecision.getByRole("list", { name: "Next inventory items in order" }).getByRole("listitem")).toHaveCount(4);
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

test("keeps narrow report controls compact and VitaScan upload targets full-size", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Narrow-layout regression coverage.");
  await page.setViewportSize({ width: 320, height: 800 });

  await page.goto("/reports");
  const periodTabs = page.getByRole("group", { name: "Report period" });
  const tabBox = await periodTabs.boundingBox();
  expect(tabBox).not.toBeNull();
  expect(tabBox!.height).toBeLessThanOrEqual(112);
  for (const label of ["Weekly", "Monthly", "Yearly", "All Time"]) {
    const buttonBox = await periodTabs.getByRole("button", { name: label }).boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.height).toBeGreaterThanOrEqual(24);
    expect(buttonBox!.height).toBeLessThanOrEqual(56);
  }

  await page.addInitScript(() => localStorage.setItem("vcc-os:theme-preference", "light"));
  await page.goto("/vitascan");
  await expect(page.locator(".vitascan-page .eyebrow").first()).toHaveCSS("color", "rgb(29, 78, 216)");
  for (const [inputName, labelSelector] of [
    ["Open camera", ".scan-button"],
    ["Use screenshot", ".scan-secondary"],
  ] as const) {
    const inputBox = await page.getByLabel(inputName).boundingBox();
    const labelBox = await page.locator(labelSelector).boundingBox();
    expect(inputBox).not.toBeNull();
    expect(labelBox).not.toBeNull();
    expect(inputBox!.width).toBeGreaterThanOrEqual(labelBox!.width - 2);
    expect(inputBox!.height).toBeGreaterThanOrEqual(labelBox!.height - 2);
  }
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
  await expect(page.getByText("NORTH MARKET", { exact: true }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return data.sections.transactions.some((row: { cells: { description?: string } }) => row.cells.description === "NORTH MARKET");
  })).toBe(true);
});

test("exercises major navigation, filter, report, and car-loan controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop control matrix; mobile navigation has dedicated coverage.");
  test.setTimeout(60_000);
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

  await page.goto("/transactions");
  await expect(page.getByRole("heading", { name: /activity/ }).first()).toBeVisible();
  const transactionToolbar = page.locator(".transaction-concept-toolbar");
  await expect(transactionToolbar.getByRole("textbox", { name: "Search transactions" })).toBeVisible();
  await expect(transactionToolbar.getByRole("button", { name: "Filters" })).toBeVisible();
  await expect(transactionToolbar.locator(".transaction-type-tabs button")).toHaveCount(4);
  await expect(page.locator('[data-column-key="recurring"]')).toHaveCount(0);
  const incomeAmount = page.locator(".transaction-row-amount.income strong").first();
  const expenseAmount = page.locator(".transaction-row-amount.expense strong").first();
  await expect(incomeAmount).toHaveText("+$1,200.00");
  await expect(expenseAmount).toHaveText("-$72.15");
  expect(await incomeAmount.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(6, 118, 71)");
  expect(await expenseAmount.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(180, 35, 24)");
  await transactionToolbar.getByRole("button", { name: "Filters" }).click();
  await expect(transactionToolbar.getByLabel("Category")).toBeVisible();
  const accountFilter = transactionToolbar.getByLabel("Account or vault");
  await accountFilter.selectOption("Cash App");
  await expect(page.locator(".transaction-simple-row")).toHaveCount(1);
  await expect(page.locator(".transaction-row-account")).toHaveText("Cash App");
  await accountFilter.selectOption("all");
  await transactionToolbar.getByRole("button", { name: "Transfers" }).click();
  await expect(page.locator(".transaction-simple-row")).toHaveCount(1);
  await expect(page.locator(".transaction-row-account")).toContainText("Emergency Fund");

  await page.goto("/reports");
  await page.getByRole("button", { name: "All Time" }).click();
  await expect(page.getByRole("button", { name: "All Time" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".report-svg-chart")).toHaveCount(2);
  await expect(page.locator(".report-category-chart")).toBeVisible();
  await expect(page.locator(".chart-slide-controls")).toHaveCount(0);

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

test("moves transaction transfers between linked accounts and savings vaults in either direction", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Add transaction" }).click();
  let editor = page.locator(".transaction-detail-editor");
  await editor.getByLabel("Type").selectOption("transfer");
  await editor.getByLabel("Description").fill("Move money to emergency fund");
  await editor.getByLabel("Amount").fill("50");
  await editor.getByLabel("Date").fill("2026-07-22");
  await editor.getByLabel("From").selectOption("Chime Checking");
  await editor.getByLabel("To").selectOption("Emergency Fund");
  await editor.getByRole("button", { name: "Save changes" }).click();

  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return [data.sections.money.find((item: { id: string }) => item.id === "money-cash-1").cells.amount, data.sections.savings.find((item: { id: string }) => item.id === "sav-emergency").cells.balance];
  })).toEqual(["2790.32", "12850.00"]);

  await page.getByRole("button", { name: "Add transaction" }).click();
  editor = page.locator(".transaction-detail-editor");
  await editor.getByLabel("Type").selectOption("transfer");
  await editor.getByLabel("Description").fill("Return money to checking");
  await editor.getByLabel("Amount").fill("100");
  await editor.getByLabel("Date").fill("2026-07-22");
  await editor.getByLabel("From").selectOption("Emergency Fund");
  await editor.getByLabel("To").selectOption("Chime Checking");
  await editor.getByRole("button", { name: "Save changes" }).click();
  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return [data.sections.money.find((item: { id: string }) => item.id === "money-cash-1").cells.amount, data.sections.savings.find((item: { id: string }) => item.id === "sav-emergency").cells.balance];
  })).toEqual(["2890.32", "12750.00"]);
});

test("adds multiple item-and-cost rows from one transaction entry", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Add transaction" }).click();
  const editor = page.locator(".transaction-detail-editor");
  await editor.getByLabel("Purpose").selectOption("purchase");
  await editor.getByLabel("Description").fill("Lunch");
  await editor.getByLabel("Amount").fill("12.50");
  await editor.getByRole("button", { name: "Add another item" }).click();
  await editor.getByLabel("Item 2", { exact: true }).fill("Coffee");
  await editor.getByLabel("Cost for item 2", { exact: true }).fill("4.25");
  await editor.getByText("Account", { exact: true }).locator("..").locator("select").selectOption("Cash App");
  await editor.getByRole("button", { name: "Save 2 items" }).click();

  await expect(page.getByText("2 transactions saved and account balances updated.")).toBeVisible();
  await expect(page.locator(".transaction-simple-row").filter({ hasText: "Lunch" })).toBeVisible();
  await expect(page.locator(".transaction-simple-row").filter({ hasText: "Coffee" })).toBeVisible();
});

test("records an existing bill as paid from the Transactions page", async ({ page }) => {
  await page.goto("/transactions");
  const initial = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return Number.parseFloat(data.sections.money.find((row: { cells: { label: string } }) => row.cells.label === "Chime Checking").cells.amount.replace(/[^0-9.-]/g, ""));
  });

  await page.getByRole("button", { name: "Add transaction" }).click();
  const editor = page.locator(".transaction-detail-editor");
  await editor.getByLabel("Purpose").selectOption("bill_payment");
  await editor.getByLabel("Bill", { exact: true }).selectOption("bill-electric");
  await editor.getByLabel("Paid From").selectOption("Chime Checking");
  await editor.getByRole("button", { name: "Record bill payment" }).click();

  await expect(page.getByText(/Electric bill was marked paid/i)).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    const bill = data.sections.bills.find((row: { id: string }) => row.id === "bill-electric");
    const payments = data.sections.transactions.filter((row: { cells: { billId?: string } }) => row.cells.billId === "bill-electric");
    const account = data.sections.money.find((row: { cells: { label: string } }) => row.cells.label === "Chime Checking");
    return { status: bill.cells.status, paidFrom: bill.cells.paymentAccount, paymentKind: payments[0]?.cells.transactionKind, payments: payments.length, balance: Number.parseFloat(account.cells.amount) };
  })).toEqual({ status: "paid", paidFrom: "Chime Checking", paymentKind: "bill_payment", payments: 1, balance: initial - 186.42 });
});

test("supports general and investment transactions without forcing retail items", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Add transaction" }).click();
  let editor = page.locator(".transaction-detail-editor");
  await expect(editor.getByLabel("Purpose")).toHaveValue("general");
  await expect(editor.getByText("Items and cost")).toHaveCount(0);
  await editor.getByLabel("Description").fill("Annual insurance filing");
  await editor.getByLabel("Amount").fill("20");
  await editor.getByLabel("Account", { exact: true }).selectOption("Cash App");
  await editor.getByRole("button", { name: "Save changes" }).click();

  await page.getByRole("button", { name: "Add transaction" }).click();
  editor = page.locator(".transaction-detail-editor");
  await editor.getByLabel("Purpose").selectOption("investment");
  await expect(editor.getByText("Items and cost")).toHaveCount(0);
  await editor.getByLabel("Description").fill("Brokerage contribution");
  await editor.getByLabel("Amount").fill("100");
  await editor.getByLabel("Account", { exact: true }).selectOption("Cash App");
  await editor.getByRole("button", { name: "Save changes" }).click();

  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return data.sections.transactions
      .filter((row: { cells: { description?: string } }) => ["Annual insurance filing", "Brokerage contribution"].includes(row.cells.description || ""))
      .map((row: { cells: Record<string, string> }) => ({ description: row.cells.description, kind: row.cells.transactionKind, category: row.cells.category, quantity: row.cells.quantity }));
  })).toEqual([
    { description: "Annual insurance filing", kind: "general", category: "Insurance", quantity: "" },
    { description: "Brokerage contribution", kind: "investment", category: "Investments", quantity: "" },
  ]);
});

test("posts a multi-item manual receipt as itemized transaction rows", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Open manual receipt" }).click();
  await page.getByPlaceholder("Where did you shop?").fill("Corner Market");
  await page.getByLabel("Receipt item 1", { exact: true }).fill("Sparkling water");
  await page.getByLabel("Quantity for receipt item 1", { exact: true }).fill("2");
  await page.getByLabel("Unit price for receipt item 1", { exact: true }).fill("3.50");
  await expect(page.getByLabel("Sales tax for receipt item 1", { exact: true })).toBeEmpty();
  await expect(page.getByLabel("Item total for receipt item 1", { exact: true })).toHaveText("$7.00");

  await page.getByRole("button", { name: "Add another item" }).click();
  await page.getByLabel("Receipt item 2", { exact: true }).fill("Granola bar");
  await page.getByLabel("Unit price for receipt item 2", { exact: true }).fill("1.25");
  await page.getByLabel("Receipt tax").fill("0.50");
  await expect(page.getByLabel("Sales tax for receipt item 1", { exact: true })).toHaveText("$0.42");
  await expect(page.getByLabel("Item total for receipt item 1", { exact: true })).toHaveText("$7.42");
  await expect(page.getByLabel("Sales tax for receipt item 2", { exact: true })).toHaveText("$0.08");
  await expect(page.getByLabel("Item total for receipt item 2", { exact: true })).toHaveText("$1.33");
  await expect(page.locator(".receipt-grand-total strong")).toHaveText("$8.75");
  await page.getByRole("button", { name: "Post receipt to Transactions" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Receipt posted" })).toContainText("2 items totaling $8.75");
  const posted = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    const receiptRows = data.sections.transactions.filter((row: { cells: { receiptId?: string } }) => row.cells.receiptId);
    const receiptId = receiptRows.at(-1)?.cells.receiptId;
    const rows = receiptRows.filter((row: { cells: { receiptId?: string } }) => row.cells.receiptId === receiptId);
    return {
      merchant: rows.map((row: { cells: { merchant: string } }) => row.cells.merchant),
      descriptions: rows.map((row: { cells: { description: string } }) => row.cells.description),
      categories: rows.map((row: { cells: { category: string } }) => row.cells.category),
      salesTax: rows.map((row: { cells: { salesTax: string } }) => row.cells.salesTax),
      itemTotals: rows.map((row: { cells: { amount: string } }) => row.cells.amount),
      total: rows.reduce((sum: number, row: { cells: { amount: string } }) => sum + Number(row.cells.amount), 0),
      receiptTotal: rows[0]?.cells.receiptTotal,
    };
  });
  expect(posted).toEqual({
    merchant: ["Corner Market", "Corner Market"],
    descriptions: ["Sparkling water", "Granola bar"],
    categories: ["Groceries", "Uncategorized"],
    salesTax: ["0.42", "0.08"],
    itemTotals: ["-7.42", "-1.33"],
    total: -8.75,
    receiptTotal: "8.75",
  });
});

test("keeps a manual receipt draft when its popup is closed and reopened", async ({ page }) => {
  await page.goto("/transactions");
  const receiptTrigger = page.getByRole("button", { name: "Open manual receipt" });
  await expect(receiptTrigger).toHaveAttribute("aria-expanded", "false");
  await receiptTrigger.click();
  await expect(page.getByRole("dialog", { name: "Enter one ticket, item by item" })).toBeVisible();
  await page.getByPlaceholder("Where did you shop?").fill("Saved while folded");
  await page.getByRole("button", { name: "Close manual receipt" }).click();
  await expect(page.getByPlaceholder("Where did you shop?")).toHaveCount(0);
  await expect(receiptTrigger).toBeFocused();
  await receiptTrigger.click();
  await expect(page.getByPlaceholder("Where did you shop?")).toHaveValue("Saved while folded");
});

test("applies cash income to Money Snapshot and keeps dropdown choices readable", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Add transaction" }).click();
  const editor = page.locator(".transaction-detail-editor");
  await editor.getByLabel("Type").selectOption("income");
  const accountSelect = editor.getByLabel("Account");
  const cashOptionStyles = await accountSelect.locator('option[value="Cash"]').evaluate((option) => {
    const style = getComputedStyle(option);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(cashOptionStyles).toEqual({ color: "rgb(20, 32, 51)", background: "rgb(255, 255, 255)" });
  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
  const darkCashOptionStyles = await accountSelect.locator('option[value="Cash"]').evaluate((option) => {
    const style = getComputedStyle(option);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(darkCashOptionStyles).toEqual({ color: "rgb(248, 250, 252)", background: "rgb(17, 24, 39)" });

  const date = await page.evaluate(() => {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  });
  await editor.getByLabel("Description").fill("Cash income");
  await editor.getByLabel("Amount").fill("125");
  await editor.getByLabel("Date").fill(date);
  await accountSelect.selectOption("Cash");
  await editor.getByRole("button", { name: "Save changes" }).click();

  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("vcc-os:data:v2") || "{}");
    return data.sections.money.find((item: { cells: { label: string } }) => item.cells.label === "Cash")?.cells.amount;
  })).toBe("125.00");

  await page.goto("/");
  await expect(page.getByRole("status", { name: /Welcome to VCC-OS/i })).toBeHidden({ timeout: 6_000 });
  const moneySnapshot = page.locator(".dashboard-money-account-card");
  await expect(moneySnapshot).toContainText("Money Snapshot");
  await expect(moneySnapshot).toContainText("Chime Checking");
  await expect(moneySnapshot).toContainText("$2,840.32");
  await expect(moneySnapshot).not.toContainText("Cash App");

  await moneySnapshot.getByRole("button", { name: "Show next account" }).click();
  await expect(moneySnapshot).toContainText("Cash App");
  await expect(moneySnapshot).toContainText("$640.00");
  await expect(moneySnapshot).not.toContainText("Chime Checking");

  await moneySnapshot.getByRole("button", { name: "Show next account" }).click();
  await expect(moneySnapshot).toContainText("Cash");
  await expect(moneySnapshot).toContainText("$125.00");
  await expect(moneySnapshot).toContainText("BalanceAvailable");
  await expect(moneySnapshot).toContainText("SourceMoney Snapshot");
  await expect(moneySnapshot).not.toContainText("Total Cash");
  await expect(moneySnapshot).not.toContainText("Spendable / Safe");
});

test("keeps spreadsheet cells ready for immediate desktop typing and keyboard navigation", async ({ page }) => {
  await page.goto("/bills");
  const description = page.locator('textarea[data-column-key="name"]').first();
  const descriptionCell = description.locator("..");

  await description.focus();
  await expect(descriptionCell).toHaveClass(/cell-selected/);
  await expect(descriptionCell).not.toHaveClass(/cell-editing/);
  await page.keyboard.type("x");
  await expect(description).toHaveValue("x");
  await expect(descriptionCell).toHaveClass(/cell-editing/);

  await page.keyboard.press("ArrowRight");
  const type = page.locator('textarea[data-column-key="category"]').first();
  await expect(type).toBeFocused();
  await expect(type.locator("..")).toHaveClass(/cell-selected/);
  await page.keyboard.press("ArrowLeft");
  await expect(description).toBeFocused();

  await page.keyboard.press("Delete");
  await expect(description).toHaveValue("");
  await expect(descriptionCell).toHaveClass(/cell-selected/);
  await expect(page.locator(".spreadsheet-panel [role=status]")).toContainText("Bill cleared");

  await description.click();
  await expect(descriptionCell).toHaveClass(/cell-editing/);
  await description.fill("Edited paycheck");
  await page.keyboard.press("Escape");
  await expect(descriptionCell).not.toHaveClass(/cell-editing/);
  await expect(description).toHaveValue("Edited paycheck");

  await page.getByRole("button", { name: "Add Bill" }).click();
  const newDescription = page.locator('textarea[data-column-key="name"]').last();
  await expect(newDescription).toBeFocused();
  await expect(newDescription.locator("..")).toHaveClass(/cell-editing/);
  await page.keyboard.type("Coffee");
  await expect(newDescription).toHaveValue("Coffee");
});

test("keeps the native calendar picker visible in dark mode", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("vcc-os:theme-preference", "dark"));
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Add transaction" }).click();
  const dateInput = page.locator(".transaction-detail-editor").getByLabel("Date");

  const styles = await dateInput.evaluate((input) => {
    const inputStyle = getComputedStyle(input);
    const indicatorStyle = getComputedStyle(input, "::-webkit-calendar-picker-indicator");
    return {
      colorScheme: inputStyle.colorScheme,
      filter: indicatorStyle.filter,
      opacity: indicatorStyle.opacity,
    };
  });

  expect(styles).toMatchObject({
    colorScheme: "dark",
    filter: "none",
    opacity: "1",
  });
});

test("keeps the transaction page free of horizontal scrolling", async ({ page }) => {
  for (const viewport of [
    { width: 1600, height: 900 },
    { width: 1024, height: 900 },
    { width: 320, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/transactions");

    const widths = await page.evaluate(() => {
      const tableWrap = document.querySelector<HTMLElement>(".transactions-page .table-wrap");
      return {
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        tableClient: tableWrap?.clientWidth || 0,
        tableScroll: tableWrap?.scrollWidth || 0,
      };
    });

    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
    expect(widths.tableScroll).toBeLessThanOrEqual(widths.tableClient);
  }
});

test("updates the transaction category from completed U.S. retail descriptions", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Add transaction" }).click();
  const editor = page.locator(".transaction-detail-editor");
  await editor.getByLabel("Description").fill("KROGER #0456");
  await editor.getByLabel("Amount").fill("62.40");
  await editor.getByText("Account", { exact: true }).locator("..").locator("select").selectOption("Cash App");
  await editor.getByRole("button", { name: "Save changes" }).click();

  await page.locator(".transaction-simple-row").filter({ hasText: "KROGER #0456" }).click();
  await page.getByRole("button", { name: "More accounting details" }).click();
  await expect(page.locator(".transaction-detail-editor").getByLabel("Category")).toHaveValue("Groceries");
});

test("keeps the closed mobile drawer inert and restores focus after use", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile keyboard containment check.");
  await page.goto("/settings");
  const drawer = page.getByRole("navigation", { name: "Primary mobile navigation", includeHidden: true });
  await expect(drawer).toHaveAttribute("inert", "");
  const trigger = page.getByRole("button", { name: "Open More navigation" });
  await trigger.click();
  await expect(drawer).not.toHaveAttribute("inert", "");
  await expect(drawer.getByRole("link", { name: "VCC OS" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveAttribute("inert", "");
  await expect(trigger).toBeFocused();
});
