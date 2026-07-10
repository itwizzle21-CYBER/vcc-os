import type { AppData, SectionConfig, SectionKey } from "../types/app";

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

export function createStarterData(): AppData {
  return createZeroData();
}

export function createZeroData(): AppData {
  return {
    version: 2,
    sections: {
      money: [],
      bills: [],
      income: [],
      transactions: [],
      debt: [],
      savings: [],
      inventory: [],
      goals: [],
    },
    sortBy: {},
    paycheckPlanner: {
      paycheckAmount: "",
      payDate: "",
      weekStart: "",
      weekEnd: "",
      spotMeRepayment: "",
      myPayRepayment: "",
      locked: false,
    },
    paycheckHistory: [],
    settings: {
      theme: "dark",
      accent: "blue",
      density: "compact",
      accountName: "",
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
