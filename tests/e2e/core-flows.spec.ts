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

test("keeps all 30 selectable layouts collision-free from mobile through desktop", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "This test supplies its own responsive viewport matrix.");
  test.setTimeout(120_000);

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

  await page.getByRole("button", { name: /KROGER #0456/ }).click();
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
