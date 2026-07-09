import type { AppData, SectionConfig, SectionKey, SpreadsheetRow } from "../types/app";
import { todayIso, weekBounds } from "../calculations/currency";
import { normalizeInventoryRow } from "../engine/inventoryEngine";

export const sectionConfigs: Record<SectionKey, SectionConfig> = {
  money: {
    key: "money",
    title: "Money",
    columns: [
      { key: "label", label: "Source" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "weekStart", label: "Week Start", type: "date" },
      { key: "weekEnd", label: "Week End", type: "date" },
      { key: "notes", label: "Notes" },
    ],
  },
  bills: {
    key: "bills",
    title: "Bills",
    columns: [
      { key: "name", label: "Bill" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "dueDate", label: "Due Date", type: "date" },
      { key: "status", label: "Status" },
      { key: "notes", label: "Notes" },
    ],
  },
  income: {
    key: "income",
    title: "Income",
    columns: [
      { key: "source", label: "Source" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "date", label: "Date", type: "date" },
      { key: "type", label: "Type" },
      { key: "notes", label: "Notes" },
    ],
  },
  transactions: {
    key: "transactions",
    title: "Transactions",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "description", label: "Description" },
      { key: "category", label: "Category" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "account", label: "Account" },
    ],
  },
  debt: {
    key: "debt",
    title: "Debt",
    columns: [
      { key: "name", label: "Debt" },
      { key: "balance", label: "Balance", type: "currency" },
      { key: "minimum", label: "Minimum", type: "currency" },
      { key: "rate", label: "APR" },
      { key: "priority", label: "Priority", readOnly: true },
    ],
  },
  savings: {
    key: "savings",
    title: "Savings",
    columns: [
      { key: "name", label: "Bucket" },
      { key: "balance", label: "Balance", type: "currency" },
      { key: "protected", label: "Protected?" },
      { key: "target", label: "Target", type: "currency" },
      { key: "notes", label: "Notes" },
    ],
  },
  inventory: {
    key: "inventory",
    title: "Inventory",
    columns: [
      { key: "item", label: "Item" },
      { key: "category", label: "Category", readOnly: true },
      { key: "qty", label: "Qty", type: "number" },
      { key: "minNeeded", label: "Min Needed", type: "number" },
      { key: "cost", label: "Cost", type: "currency" },
      { key: "alert", label: "Alert", readOnly: true },
      { key: "notes", label: "Notes" },
    ],
  },
  goals: {
    key: "goals",
    title: "Goals",
    columns: [
      { key: "name", label: "Goal" },
      { key: "current", label: "Current", type: "currency" },
      { key: "target", label: "Target", type: "currency" },
      { key: "deadline", label: "Deadline", type: "date" },
      { key: "autoAlert", label: "Auto Alert", readOnly: true },
    ],
  },
};

export function blankRows(section: SectionKey, count = 20): SpreadsheetRow[] {
  const columns = sectionConfigs[section].columns;
  return Array.from({ length: count }, (_, index) => ({
    id: `${section}-blank-${Date.now()}-${index}`,
    cells: Object.fromEntries(columns.map((column) => [column.key, ""])),
  }));
}

function row(section: SectionKey, id: string, cells: Record<string, string>): SpreadsheetRow {
  const base = Object.fromEntries(sectionConfigs[section].columns.map((column) => [column.key, ""]));
  return { id, cells: { ...base, ...cells } };
}

function withBlankStarter(section: SectionKey, rows: SpreadsheetRow[]): SpreadsheetRow[] {
  return [...rows, ...blankRows(section, Math.max(0, 20 - rows.length))];
}

export function createStarterData(): AppData {
  const today = todayIso();
  const { start, end } = weekBounds(today);
  const inventorySeeds = [
    row("inventory", "inv-1", { item: "Water", qty: "1", minNeeded: "4", cost: "$5.00", notes: "Cases" }),
    row("inventory", "inv-2", { item: "Tylenol", qty: "0", minNeeded: "1", cost: "$8.00" }),
    row("inventory", "inv-3", { item: "Toilet paper", qty: "2", minNeeded: "2", cost: "$12.00" }),
  ].map(normalizeInventoryRow);

  return {
    version: 2,
    sections: {
      money: withBlankStarter("money", [
        row("money", "money-1", { label: "Operating Cash", amount: "$4,250.32", weekStart: start, weekEnd: end }),
        row("money", "money-2", { label: "Protected Savings", amount: "$12,800.00" }),
        row("money", "money-3", { label: "SpotMe", amount: "$120.00" }),
        row("money", "money-4", { label: "MyPay", amount: "$330.00" }),
      ]),
      bills: withBlankStarter("bills", [
        row("bills", "bill-1", { name: "Electric bill", amount: "$186.42", dueDate: today, status: "pending" }),
        row("bills", "bill-2", { name: "Credit card minimum", amount: "$450.00", dueDate: today, status: "pending" }),
      ]),
      income: withBlankStarter("income", [row("income", "income-1", { source: "Paycheck", amount: "$1,200.00", date: today, type: "Weekly" })]),
      transactions: withBlankStarter("transactions", [
        row("transactions", "txn-1", { date: today, description: "Groceries", category: "Food", amount: "$72.15", account: "Chime" }),
        row("transactions", "txn-2", { date: today, description: "Paycheck", category: "Income", amount: "$1,200.00", account: "Operating Cash" }),
      ]),
      debt: withBlankStarter("debt", [
        row("debt", "debt-1", { name: "Credit card", balance: "$8,250.00", minimum: "$225.00", rate: "19.9%" }),
        row("debt", "debt-2", { name: "Car note", balance: "$10,200.00", minimum: "$375.00", rate: "6.4%" }),
      ]),
      savings: withBlankStarter("savings", [
        row("savings", "sav-1", { name: "Protected Savings", balance: "$12,800.00", protected: "yes", target: "$18,000.00" }),
        row("savings", "sav-2", { name: "Emergency Fund", balance: "$2,400.00", protected: "no", target: "$5,000.00" }),
      ]),
      inventory: withBlankStarter("inventory", inventorySeeds),
      goals: withBlankStarter("goals", [
        row("goals", "goal-1", { name: "Emergency Fund", current: "$2,400.00", target: "$5,000.00", deadline: "2026-12-31" }),
        row("goals", "goal-2", { name: "Debt Free", current: "$0.00", target: "$18,450.00", deadline: "2028-07-06" }),
      ]),
    },
    sortBy: {},
    paycheckPlanner: {
      paycheckAmount: "1200",
      payDate: today,
      weekStart: start,
      weekEnd: end,
      spotMeRepayment: "120",
      myPayRepayment: "330",
      locked: false,
    },
    paycheckHistory: [],
    settings: {
      theme: "dark",
      accent: "blue",
      density: "compact",
      accountName: "Alex",
      profileLabel: "Local Profile",
      localMode: true,
      notificationsEnabled: true,
      confirmBeforeReset: true,
      widgetOrder: ["total-cash", "money-snapshot", "protected-savings", "command", "balance", "bills", "inventory", "analytics", "activity", "progress", "objectives"],
      hiddenWidgets: [],
      surfaceStyle: "glass",
      sidebarCollapsed: false,
    },
  };
}

export function createZeroData(): AppData {
  const today = todayIso();
  const { start, end } = weekBounds(today);

  return {
    version: 2,
    sections: {
      money: blankRows("money", 20),
      bills: blankRows("bills", 20),
      income: blankRows("income", 20),
      transactions: blankRows("transactions", 20),
      debt: blankRows("debt", 20),
      savings: blankRows("savings", 20),
      inventory: blankRows("inventory", 20),
      goals: blankRows("goals", 20),
    },
    sortBy: {},
    paycheckPlanner: {
      paycheckAmount: "",
      payDate: today,
      weekStart: start,
      weekEnd: end,
      spotMeRepayment: "",
      myPayRepayment: "",
      locked: false,
    },
    paycheckHistory: [],
    settings: {
      theme: "dark",
      accent: "blue",
      density: "compact",
      accountName: "Alex",
      profileLabel: "Local Profile",
      localMode: true,
      notificationsEnabled: true,
      confirmBeforeReset: true,
      widgetOrder: ["total-cash", "money-snapshot", "protected-savings", "command", "balance", "bills", "inventory", "analytics", "activity", "progress", "objectives"],
      hiddenWidgets: [],
      surfaceStyle: "glass",
      sidebarCollapsed: false,
    },
  };
}
