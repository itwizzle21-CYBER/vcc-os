import { applyDerivedRow, today } from "../calculations/helpers";
import type { Row, Section, SectionKey } from "../types/vcc";

export const STORAGE_KEY = "vcc_os_protected_vault_v2";
export const BACKUP_KEY = "vcc_os_backup_v1";

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
      { Bill: "", "Due Date": "", Amount: "", Status: "", Priority: "Low", "Auto Alert": "Clear", Notes: "" },
      { Bill: "", "Due Date": "", Amount: "", Status: "", Priority: "Low", "Auto Alert": "Clear", Notes: "" },
      { Bill: "", "Due Date": "", Amount: "", Status: "", Priority: "Low", "Auto Alert": "Clear", Notes: "" },
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
    key: "budget",
    label: "Budget",
    subtitle: "Plan operating cash before spending. Keep planned and actual numbers clean.",
    columns: ["Category", "Planned", "Actual", "Status", "Notes"],
    rows: [
      { Category: "Food", Planned: "", Actual: "", Status: "Planned", Notes: "" },
      { Category: "Gas", Planned: "", Actual: "", Status: "Planned", Notes: "" },
      { Category: "Bills", Planned: "", Actual: "", Status: "Planned", Notes: "" },
      { Category: "Debt", Planned: "", Actual: "", Status: "Planned", Notes: "" },
      { Category: "Savings", Planned: "", Actual: "", Status: "Planned", Notes: "" },
    ],
  },
  {
    key: "debt",
    label: "Debt",
    subtitle: "Debt balances and payments eating future cash.",
    columns: ["Debt", "Current Balance", "Payment Due", "Due Date", "Status", "Blocks Cash", "Notes"],
    rows: [
      { Debt: "", "Current Balance": "", "Payment Due": "", "Due Date": "", Status: "", "Blocks Cash": "", Notes: "" },
      { Debt: "", "Current Balance": "", "Payment Due": "", "Due Date": "", Status: "", "Blocks Cash": "", Notes: "" },
      { Debt: "", "Current Balance": "", "Payment Due": "", "Due Date": "", Status: "", "Blocks Cash": "", Notes: "" },
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
        "Target Amount": "",
        "Current Amount": "",
        Protected: "Yes",
        "Access Rule": "Food, gas, shelter, car, shutoff, or true emergency only",
        "Allowed Withdrawal": "",
        "Withdrawal Reason": "",
        Status: "Locked",
        Notes: "Protected. Do not count as spendable cash.",
      },
      {
        Goal: "Move-Out Fund",
        "Vault Type": "Future",
        "Target Amount": "",
        "Current Amount": "",
        Protected: "Yes",
        "Access Rule": "Do not touch unless move-out mission requires it",
        "Allowed Withdrawal": "",
        "Withdrawal Reason": "",
        Status: "Locked",
        Notes: "Future stability money.",
      },
      {
        Goal: "Investment Fund",
        "Vault Type": "Growth",
        "Target Amount": "",
        "Current Amount": "",
        Protected: "Flexible",
        "Access Rule": "Approved investment only. No emotional spending.",
        "Allowed Withdrawal": "",
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
    key: "buyNext",
    label: "Buy Next",
    subtitle: "Focused list of next items to buy or handle. Dashboard intelligence also reads Inventory.",
    columns: ["Item", "Source", "Estimated Cost", "Priority", "Status", "Notes"],
    rows: [
      { Item: "", Source: "Inventory", "Estimated Cost": "", Priority: "", Status: "Open", Notes: "" },
      { Item: "", Source: "Bills", "Estimated Cost": "", Priority: "", Status: "Open", Notes: "" },
      { Item: "", Source: "Debt", "Estimated Cost": "", Priority: "", Status: "Open", Notes: "" },
    ],
  },
  {
    key: "activity",
    label: "Activity",
    subtitle: "Manual log of important VCC actions, updates, and checkpoints.",
    columns: ["Date", "Area", "Action", "Status", "Notes"],
    rows: [
      { Date: today(), Area: "Money", Action: "", Status: "Open", Notes: "" },
      { Date: today(), Area: "Bills", Action: "", Status: "Open", Notes: "" },
      { Date: today(), Area: "Inventory", Action: "", Status: "Open", Notes: "" },
    ],
  },
  {
    key: "goals",
    label: "Goals",
    subtitle: "Big-picture progress toward freedom, stability, and growth.",
    columns: ["Goal", "Category", "Target", "Current", "Progress %", "Priority", "Next Step", "Notes"],
    rows: [
      { Goal: "Emergency Fund", Category: "Money", Target: "", Current: "", "Progress %": "", Priority: "High", "Next Step": "", Notes: "" },
      { Goal: "", Category: "", Target: "", Current: "", "Progress %": "", Priority: "", "Next Step": "", Notes: "" },
    ],
  },
  {
    key: "missions",
    label: "Missions",
    subtitle: "Daily moves that protect stability and build momentum.",
    columns: ["Mission", "Priority", "Status", "Due Date", "Next Action", "Notes"],
    rows: [
      { Mission: "", Priority: "", Status: "", "Due Date": "", "Next Action": "", Notes: "" },
      { Mission: "", Priority: "", Status: "", "Due Date": "", "Next Action": "", Notes: "" },
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  } catch (error) {
    console.error("Unable to save VCC data.", error);
  }
}

export function loadSections() {
  let saved: string | null = null;

  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error("Unable to read VCC data.", error);
  }

  if (!saved) return structuredClone(defaultSections);

  try {
    return normalizeSections(JSON.parse(saved));
  } catch {
    return structuredClone(defaultSections);
  }
}

export function normalizeSections(raw: unknown) {
  if (!Array.isArray(raw)) return structuredClone(defaultSections);

  return defaultSections.map((defaultSection) => {
    const savedSection = raw.find((section): section is Section => {
      if (!section || typeof section !== "object") return false;
      return "key" in section && section.key === defaultSection.key;
    });
    if (!savedSection) return structuredClone(defaultSection);

    return {
      ...defaultSection,
      rows: Array.isArray(savedSection.rows)
        ? mergeSavedRows(defaultSection, savedSection.rows)
        : defaultSection.rows.map((row) => applyDerivedRow(defaultSection.key, row)),
    };
  });
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
  const sourceRow = isRowRecord(row) ? row : {};
  const migratedRow = section.key === "inventory" ? migrateInventoryRow(sourceRow) : sourceRow;
  const normalized = section.columns.reduce<Row>((nextRow, column) => {
    const value = migratedRow[column];
    nextRow[column] = value == null ? "" : String(value);
    return nextRow;
  }, {});

  return applyDerivedRow(section.key, normalized);
}

function isRowRecord(row: unknown): row is Row {
  return typeof row === "object" && row !== null && !Array.isArray(row);
}

function getIdentityColumn(sectionKey: SectionKey) {
  if (sectionKey === "money") return "Category";
  if (sectionKey === "savings") return "Goal";
  if (sectionKey === "budget") return "Category";
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
