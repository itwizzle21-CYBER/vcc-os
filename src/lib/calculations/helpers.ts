import type { Alert, Metrics, Row, Section, SectionKey } from "../types/vcc";

export function moneyAmount(section: Section, category: string) {
  const row = section.rows.find((item) => item.Category === category);
  return number(row?.Amount);
}

export function number(value: string | undefined) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[$,]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function money(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function isPaid(status: string | undefined) {
  return ["paid", "done", "closed"].includes((status ?? "").toLowerCase());
}

export function isOverdue(date: string | undefined) {
  if (!date) return false;
  const dueDate = new Date(`${date}T23:59:59`);
  if (Number.isNaN(dueDate.getTime())) return false;
  return dueDate < new Date();
}

export function levelWeight(level: Alert["level"]) {
  if (level === "Critical") return 3;
  if (level === "High") return 2;
  return 1;
}

export function labelFor(key: SectionKey) {
  const labels: Record<SectionKey, string> = {
    money: "Money Snapshot",
    bills: "Bills",
    income: "Income",
    budget: "Budget",
    transactions: "Transactions",
    debt: "Debt",
    savings: "Protected Savings Vault",
    inventory: "Inventory",
    buyNext: "Buy Next",
    activity: "Activity",
    goals: "Goals",
    missions: "Missions",
    alerts: "Priority Alerts",
  };

  return labels[key];
}

export function applyDerivedRow(sectionKey: SectionKey, row: Row) {
  if (sectionKey === "inventory") {
    return {
      ...row,
      Category: row.Item ? detectInventoryCategory(row.Item) : "",
      Alert: getInventoryAlert(row),
    };
  }

  if (sectionKey !== "bills") return row;

  return {
    ...row,
    Priority: getBillPriority(row),
    "Auto Alert": getBillAutoAlert(row),
  };
}

export function detectInventoryCategory(item: string | undefined) {
  const normalized = (item ?? "").toLowerCase();
  if (!normalized.trim()) return "";

  const categoryKeywords: Array<[string, RegExp]> = [
    ["Canned Food", /\b(beans|tuna|soup|corn|canned chicken)\b/],
    ["Frozen Food", /\b(meat|chicken|frozen pizza|vegetables)\b/],
    ["Drinks", /\b(water|juice|milk|soda|sports drink)\b/],
    ["Medical", /\b(medicine|tylenol|bandage|alcohol|peroxide|first aid)\b/],
    ["Hair Products", /\b(brush|comb|edge control|hair oil|conditioner)\b/],
    ["Skin Care", /\b(lotion|vaseline|cocoa butter|face wash)\b/],
    ["Cleaning Supplies", /\b(bleach|cleaner|disinfectant|spray|wipes)\b/],
    ["Paper Goods", /\b(tissue|toilet paper|paper towel|plates)\b/],
    ["Laundry", /\b(detergent|dryer sheets|fabric softener)\b/],
    ["Baby/Kids", /\b(diapers|wipes|kids snacks|school supplies)\b/],
    ["Car", /\b(oil|coolant|tire|gas|windshield fluid)\b/],
    ["Batteries/Electronics", /\b(flashlight|batteries|charger|cord)\b/],
    ["Seasonal", /\b(heater|fan|gloves|coats|christmas|summer)\b/],
    ["Hygiene", /\b(soap|toothpaste|deodorant|body wash|shampoo)\b/],
    ["Food", /\b(bread|rice|eggs|cereal|noodles|snacks)\b/],
    ["Tools", /\b(tool|tools|hammer|screwdriver|wrench|drill)\b/],
    ["Clothing", /\b(shirt|pants|socks|underwear|shoes|clothes|clothing)\b/],
    ["Emergency", /\b(emergency|radio|first responder|go bag|survival)\b/],
    ["Household", /\b(household|home|kitchen|trash bags|storage bags)\b/],
  ];

  return categoryKeywords.find(([, pattern]) => pattern.test(normalized))?.[0] ?? "Other";
}

export function getInventoryAlert(row: Row) {
  const qtyRaw = row.Qty ?? "";
  const minRaw = row["Min Needed"] ?? "";
  if (!qtyRaw.trim() && !minRaw.trim()) return "Clear";

  const qty = number(qtyRaw);
  const minNeeded = number(minRaw);

  if (qty <= 0 && minNeeded > 0) return "Critical";
  if (qty < minNeeded) return "Low";
  if (qty >= minNeeded) return "Stocked";
  return "Clear";
}

export function getDisplayRow(sectionKey: SectionKey, row: Row, metrics: Metrics) {
  const derivedRow = applyDerivedRow(sectionKey, row);
  if (sectionKey !== "money") return derivedRow;

  const amountByCategory: Record<string, number> = {
    "Operating Cash": metrics.operatingCash,
    "Spendable Cash": metrics.spendableCash,
    "Bills Pressure": metrics.billsPressure,
    "Debt Pressure": metrics.debtPressure,
    "Savings Vault Total": metrics.savingsVault,
    "Borrowed Money / Advances": metrics.borrowedMoney,
    "Net Position": metrics.netPosition,
  };

  const category = derivedRow.Category ?? "";
  if (!(category in amountByCategory)) return derivedRow;

  return {
    ...derivedRow,
    Amount: money(amountByCategory[category]),
    Status: amountByCategory[category] < 0 ? "Pressure" : "Auto",
    Priority: amountByCategory[category] < 0 || category.includes("Pressure") ? "High" : "Medium",
  };
}

export function getBillPriority(row: Row) {
  const status = (row.Status ?? "").toLowerCase();
  const dueIn = daysUntil(row["Due Date"]);

  if (status === "paid") return "Paid";
  if (status === "partial") return "High";
  if (status === "overdue" || isOverdue(row["Due Date"])) return "Critical";
  if (dueIn !== null && dueIn <= 3) return "High";
  if (dueIn !== null && dueIn <= 7) return "Medium";
  return "Low";
}

export function getBillAutoAlert(row: Row) {
  const status = (row.Status ?? "").toLowerCase();
  const dueIn = daysUntil(row["Due Date"]);

  if (status === "paid") return "Paid";
  if (status === "partial") return "Partial";
  if (status === "overdue" || isOverdue(row["Due Date"])) return "Overdue";
  if (dueIn !== null && dueIn <= 3) return "Due Soon";
  return "Clear";
}

export function isReadOnlyCell(sectionKey: SectionKey, row: Row, column: string) {
  if (sectionKey === "bills" && ["Priority", "Auto Alert"].includes(column)) return true;
  if (sectionKey === "inventory" && ["Category", "Alert"].includes(column)) return true;
  if (sectionKey === "money" && isCalculatedMoneyCategory(row.Category) && ["Amount", "Status", "Priority"].includes(column)) return true;
  return false;
}

export function isCalculatedMoneyCategory(category: string | undefined) {
  return [
    "Operating Cash",
    "Spendable Cash",
    "Bills Pressure",
    "Debt Pressure",
    "Savings Vault Total",
    "Borrowed Money / Advances",
    "Net Position",
  ].includes(category ?? "");
}

export function getSelectOptions(sectionKey: SectionKey, column: string) {
  if (sectionKey === "bills" && column === "Status") return ["Unpaid", "Paid", "Partial", "Overdue"];
  if (column === "Status") return ["", "Open", "Active", "Needed", "Watch", "Locked", "Allowed", "Approved", "Paid", "Done", "Closed", "Handled", "Bought"];
  if (column === "Priority") return ["", "Critical", "High", "Medium", "Low"];
  if (column === "Type") return ["", "Expense", "Income", "Deposit", "Transfer"];
  if (column === "Income Type") return ["", "Weekly", "Paycheck", "Job", "Other", "Side", "Gift"];
  if (column === "Protected") return ["", "Yes", "No", "Flexible"];
  if (column === "Blocks Cash") return ["", "Yes", "No"];
  if (column === "Urgency") return ["", "Critical", "High", "Medium", "Low"];
  if (column === "Current Level") return ["", "Empty", "Low", "Okay", "Full"];
  if (column === "Category" && sectionKey === "inventory") return ["", "Food", "Canned Food", "Frozen Food", "Drinks", "Medical", "Hygiene", "Hair Products", "Skin Care", "Cleaning Supplies", "Paper Goods", "Laundry", "Baby/Kids", "Car", "Tools", "Batteries/Electronics", "Seasonal", "Clothing", "Household", "Emergency", "Other"];
  return null;
}

export function isDateColumn(column: string) {
  return column === "Date" || column === "Due Date" || column === "Date Received";
}

export function daysUntil(date: string | undefined) {
  if (!date) return null;
  const dueDate = new Date(`${date}T23:59:59`);
  if (Number.isNaN(dueDate.getTime())) return null;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dueStart = new Date(dueDate);
  dueStart.setHours(0, 0, 0, 0);
  return Math.ceil((dueStart.getTime() - todayStart.getTime()) / 86_400_000);
}

export function chooseBuyNext(rows: Row[], spendableCash: number) {
  if (rows.length === 0) return "";

  const categoryWeight: Record<string, number> = {
    food: 10,
    gas: 9,
    car: 9,
    transportation: 9,
    shelter: 8,
    home: 7,
    hygiene: 7,
    work: 7,
  };
  const urgencyWeight: Record<string, number> = {
    critical: 20,
    high: 12,
    medium: 6,
    low: 1,
  };

  const ranked = [...rows].sort((a, b) => {
    const aCategory = (a.Category ?? "").toLowerCase();
    const bCategory = (b.Category ?? "").toLowerCase();
    const aNeed = number(a.Needed);
    const bNeed = number(b.Needed);
    const aAffordable = aNeed === 0 || aNeed <= spendableCash ? 3 : 0;
    const bAffordable = bNeed === 0 || bNeed <= spendableCash ? 3 : 0;
    const aScore = (urgencyWeight[(a.Urgency ?? "").toLowerCase()] ?? 0) + (categoryWeight[aCategory] ?? 0) + aAffordable;
    const bScore = (urgencyWeight[(b.Urgency ?? "").toLowerCase()] ?? 0) + (categoryWeight[bCategory] ?? 0) + bAffordable;
    return bScore - aScore;
  });

  return ranked[0]?.Item || "Inventory item";
}

const CURRENCY_COLUMNS = new Set([
  "Amount",
  "Expected",
  "Received",
  "Current Balance",
  "Payment Due",
  "Target Amount",
  "Current Amount",
  "Allowed Withdrawal",
  "Cost",
  "Planned",
  "Actual",
  "Estimated Cost",
]);

export function isCurrencyColumn(column: string) {
  return CURRENCY_COLUMNS.has(column);
}

export function formatCurrencyCellValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const cleaned = trimmed.replace(/[$,\s]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return trimmed;

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return trimmed;

  const absoluteValue = Math.abs(parsed);
  const hasCents = Math.round(absoluteValue * 100) % 100 !== 0;
  const formatted = absoluteValue.toLocaleString("en-US", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return `${parsed < 0 ? "-" : ""}$${formatted}`;
}

export function getInventoryBuyNextRows(rows: Row[]) {
  const alertWeight: Record<string, number> = {
    critical: 2,
    low: 1,
  };

  return rows
    .map((row) => applyDerivedRow("inventory", row))
    .filter((row) => ["critical", "low"].includes((row.Alert ?? "").toLowerCase()))
    .sort((a, b) => (alertWeight[(b.Alert ?? "").toLowerCase()] ?? 0) - (alertWeight[(a.Alert ?? "").toLowerCase()] ?? 0));
}
