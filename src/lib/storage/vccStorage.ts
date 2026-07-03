import { applyDerivedRow, today } from "../calculations/helpers";
import type { Row, Section, SectionKey } from "../types/vcc";

export const STORAGE_KEY = "vcc_os_protected_vault_v2";

export const defaultSections: Section[] = [
  {
    key: "money",
    label: "Money Snapshot",
    subtitle: "Operating cash only. Savings is protected and does not count as spendable.",
    columns: ["Category", "Amount", "Status", "Priority", "Notes"],
    rows: [
      { Category: "Cash On Hand", Amount: "", Status: "Needs update", Priority: "Critical", Notes: "Money available right now." },
      { Category: "Weekly Income", Amount: "", Status: "Needs update", Priority: "High", Notes: "Job check or weekly expected income." },
      { Category: "Other Income", Amount: "", Status: "Optional", Priority: "Medium", Notes: "Side money, payout, help, etc." },
      { Category: "Food Needed", Amount: "", Status: "Needs update", Priority: "Critical", Notes: "Food money needed before next check." },
      { Category: "Gas Needed", Amount: "", Status: "Needs update", Priority: "Critical", Notes: "Gas money needed before next check." },
      { Category: "Operating Cash", Amount: "", Status: "Auto", Priority: "High", Notes: "Cash plus income and transaction net." },
      { Category: "Spendable Cash", Amount: "", Status: "Auto", Priority: "Critical", Notes: "Operating cash minus survival, bills, and debt pressure. Protected savings excluded." },
      { Category: "Bills Pressure", Amount: "", Status: "Auto", Priority: "High", Notes: "Unpaid, partial, and overdue bill pressure from Bills." },
      { Category: "Debt Pressure", Amount: "", Status: "Auto", Priority: "High", Notes: "Active debt payments due from Debt." },
      { Category: "Savings Vault Total", Amount: "", Status: "Auto", Priority: "Medium", Notes: "Total current savings from Savings Vault." },
      { Category: "Borrowed Money / Advances", Amount: "", Status: "Auto", Priority: "High", Notes: "Active advances and borrowed-money style debt." },
      { Category: "Net Position", Amount: "", Status: "Auto", Priority: "High", Notes: "Operating cash plus flexible savings minus bills, debt pressure, and advances." },
    ],
  },
  {
    key: "bills",
    label: "Bills",
    subtitle: "Bills due, paid, unpaid, and overdue.",
    columns: ["Bill", "Due Date", "Amount", "Status", "Priority", "Auto Alert", "Notes"],
    rows: [
      { Bill: "Car note", "Due Date": "", Amount: "", Status: "Unpaid", Priority: "Low", "Auto Alert": "Clear", Notes: "" },
      { Bill: "Phone", "Due Date": "", Amount: "", Status: "Unpaid", Priority: "Low", "Auto Alert": "Clear", Notes: "" },
      { Bill: "Insurance", "Due Date": "", Amount: "", Status: "Unpaid", Priority: "Low", "Auto Alert": "Clear", Notes: "" },
    ],
  },
  {
    key: "income",
    label: "Income",
    subtitle: "Track money that actually came in. Cash position will be handled separately inside this page.",
    columns: ["Source", "Income Type", "Date Received", "Amount", "Notes"],
    rows: [
      { Source: "", "Income Type": "", "Date Received": "", Amount: "", Notes: "" },
      { Source: "", "Income Type": "", "Date Received": "", Amount: "", Notes: "" },
      { Source: "", "Income Type": "", "Date Received": "", Amount: "", Notes: "" },
      { Source: "", "Income Type": "", "Date Received": "", Amount: "", Notes: "" },
      { Source: "", "Income Type": "", "Date Received": "", Amount: "", Notes: "" },
    ],
  },
  {
    key: "transactions",
    label: "Transactions",
    subtitle: "Deposits, spending, leaks, and money movement.",
    columns: ["Date", "Type", "Category", "Description", "Amount", "Notes"],
    rows: [
      { Date: today(), Type: "Expense", Category: "Food", Description: "", Amount: "", Notes: "" },
      { Date: today(), Type: "Expense", Category: "Gas", Description: "", Amount: "", Notes: "" },
    ],
  },
  {
    key: "debt",
    label: "Debt",
    subtitle: "Debt balances and payments eating future cash.",
    columns: ["Debt", "Current Balance", "Payment Due", "Due Date", "Status", "Blocks Cash", "Notes"],
    rows: [
      { Debt: "Car balance", "Current Balance": "", "Payment Due": "", "Due Date": "", Status: "Active", "Blocks Cash": "Yes", Notes: "" },
      { Debt: "MyPay", "Current Balance": "", "Payment Due": "", "Due Date": "", Status: "Active", "Blocks Cash": "Yes", Notes: "" },
      { Debt: "SpotMe", "Current Balance": "", "Payment Due": "", "Due Date": "", Status: "Active", "Blocks Cash": "Yes", Notes: "" },
    ],
  },
  {
    key: "savings",
    label: "Protected Savings Vault",
    subtitle: "Emergency, move-out, and investment money. This is not regular spending money.",
    columns: ["Goal", "Vault Type", "Target Amount", "Current Amount", "Protected", "Access Rule", "Allowed Withdrawal", "Withdrawal Reason", "Status", "Notes"],
    rows: [
      {
        Goal: "Emergency Fund",
        "Vault Type": "Emergency",
        "Target Amount": "500",
        "Current Amount": "0",
        Protected: "Yes",
        "Access Rule": "Food, gas, shelter, car, shutoff, or true emergency only",
        "Allowed Withdrawal": "0",
        "Withdrawal Reason": "",
        Status: "Locked",
        Notes: "Protected. Do not count as spendable cash.",
      },
      {
        Goal: "Move-Out Fund",
        "Vault Type": "Future",
        "Target Amount": "",
        "Current Amount": "0",
        Protected: "Yes",
        "Access Rule": "Do not touch unless move-out mission requires it",
        "Allowed Withdrawal": "0",
        "Withdrawal Reason": "",
        Status: "Locked",
        Notes: "Future stability money.",
      },
      {
        Goal: "Investment Fund",
        "Vault Type": "Growth",
        "Target Amount": "",
        "Current Amount": "0",
        Protected: "Flexible",
        "Access Rule": "Approved investment only. No emotional spending.",
        "Allowed Withdrawal": "0",
        "Withdrawal Reason": "",
        Status: "Watch",
        Notes: "Only use when upside is clear and risk is controlled.",
      },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    subtitle: "Food, gas, hygiene, car, and home survival items.",
    columns: ["Item", "Category", "Qty", "Min Needed", "Cost", "Alert", "Notes"],
    rows: createBlankInventoryRows(20),
  },
  {
    key: "goals",
    label: "Goals",
    subtitle: "Big-picture progress toward freedom, stability, and growth.",
    columns: ["Goal", "Category", "Target", "Current", "Progress %", "Priority", "Next Step", "Notes"],
    rows: [
      { Goal: "Emergency Fund", Category: "Money", Target: "500", Current: "0", "Progress %": "0", Priority: "High", "Next Step": "Save first amount", Notes: "" },
      { Goal: "VCC System", Category: "System", Target: "Clean app", Current: "Working", "Progress %": "90", Priority: "High", "Next Step": "Recommended Move logic", Notes: "" },
    ],
  },
  {
    key: "missions",
    label: "Missions",
    subtitle: "Daily moves that protect stability and build momentum.",
    columns: ["Mission", "Priority", "Status", "Due Date", "Next Action", "Notes"],
    rows: [
      { Mission: "Update money numbers", Priority: "High", Status: "Open", "Due Date": today(), "Next Action": "Enter cash, income, bills, food, gas, and debt", Notes: "" },
      { Mission: "Protect savings", Priority: "High", Status: "Open", "Due Date": today(), "Next Action": "Use operating cash before touching savings", Notes: "" },
    ],
  },
  {
    key: "alerts",
    label: "Priority Alerts",
    subtitle: "Auto-generated blockers from VCC data.",
    columns: [],
    rows: [],
  },
];

export function saveSections(sections: Section[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
}

export function loadSections() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultSections);

  try {
    const parsed = JSON.parse(saved) as Section[];
    if (!Array.isArray(parsed)) return structuredClone(defaultSections);

    return defaultSections.map((defaultSection) => {
      const savedSection = parsed.find((section) => section.key === defaultSection.key);
      if (!savedSection) return structuredClone(defaultSection);

      return {
        ...defaultSection,
        rows: Array.isArray(savedSection.rows)
          ? mergeSavedRows(defaultSection, savedSection.rows)
          : defaultSection.rows.map((row) => applyDerivedRow(defaultSection.key, row)),
      };
    });
  } catch {
    return structuredClone(defaultSections);
  }
}

function mergeSavedRows(defaultSection: Section, savedRows: Row[]) {
  const normalized = savedRows.map((row) => normalizeRow(defaultSection, row));
  const identityColumn = getIdentityColumn(defaultSection.key);

  if (!identityColumn) return normalized;

  const savedIdentities = new Set(
    normalized
      .map((row) => row[identityColumn])
      .filter(Boolean)
  );
  const missingDefaults = defaultSection.rows
    .filter((row) => row[identityColumn] && !savedIdentities.has(row[identityColumn]))
    .map((row) => normalizeRow(defaultSection, row));

  return [...normalized, ...missingDefaults];
}

function normalizeRow(section: Section, row: Row) {
  const migratedRow = section.key === "inventory" ? migrateInventoryRow(row) : row;
  const normalized = section.columns.reduce<Row>((nextRow, column) => {
    nextRow[column] = migratedRow[column] ?? "";
    return nextRow;
  }, {});

  return applyDerivedRow(section.key, normalized);
}

function getIdentityColumn(sectionKey: SectionKey) {
  if (sectionKey === "money") return "Category";
  if (sectionKey === "savings") return "Goal";
  return "";
}

function createBlankInventoryRows(count: number) {
  return Array.from({ length: count }, () => ({
    Item: "",
    Category: "",
    Qty: "",
    "Min Needed": "",
    Cost: "",
    Alert: "Clear",
    Notes: "",
  }));
}

function migrateInventoryRow(row: Row): Row {
  return {
    ...row,
    Qty: row.Qty ?? "",
    "Min Needed": row["Min Needed"] ?? row.Needed ?? "",
    Cost: row.Cost ?? "",
    Alert: row.Alert ?? "",
  };
}
