import { toNumber } from "../calculations/currency";
import type { SpreadsheetRow } from "../types/app";

export type TransactionType = "income" | "expense" | "transfer";

const categoryRules: Array<{ category: string; keywords: string[] }> = [
  { category: "Income", keywords: ["paycheck", "payroll", "salary", "wage", "direct deposit", "bonus", "commission", "income"] },
  { category: "Housing", keywords: ["rent", "mortgage", "apartment", "landlord", "property tax", "hoa"] },
  { category: "Utilities", keywords: ["electric", "power", "water", "gas bill", "utility", "internet", "wifi", "phone bill", "sewer", "trash"] },
  { category: "Groceries", keywords: ["grocery", "groceries", "supermarket", "market", "walmart grocery", "aldi", "kroger", "whole foods", "trader joe", "food lion"] },
  { category: "Restaurants", keywords: ["restaurant", "coffee", "cafe", "doordash", "uber eats", "grubhub", "mcdonald", "burger", "pizza", "taco", "starbucks"] },
  { category: "Transportation", keywords: ["uber", "lyft", "transit", "bus", "train", "parking", "toll", "rideshare"] },
  { category: "Fuel", keywords: ["fuel", "gas station", "shell", "exxon", "chevron", "bp", "circle k", "speedway"] },
  { category: "Travel", keywords: ["hotel", "airline", "flight", "airbnb", "booking", "expedia", "rental car", "travel"] },
  { category: "Healthcare", keywords: ["doctor", "medical", "pharmacy", "cvs", "walgreens", "hospital", "clinic", "dental", "vision", "therapy"] },
  { category: "Insurance", keywords: ["insurance", "geico", "progressive", "state farm", "allstate", "premium"] },
  { category: "Debt Payments", keywords: ["credit card", "loan", "minimum payment", "debt", "lender", "student loan", "car payment"] },
  { category: "Savings", keywords: ["savings", "emergency fund", "hysa", "vault", "set aside"] },
  { category: "Investments", keywords: ["investment", "brokerage", "robinhood", "fidelity", "vanguard", "stock", "crypto"] },
  { category: "Education", keywords: ["tuition", "school", "course", "class", "bookstore", "student"] },
  { category: "Childcare", keywords: ["childcare", "daycare", "babysit", "school lunch"] },
  { category: "Pets", keywords: ["pet", "veterinary", "vet", "chewy", "petco", "petsmart"] },
  { category: "Subscriptions", keywords: ["subscription", "netflix", "spotify", "hulu", "disney", "youtube", "apple.com/bill", "patreon"] },
  { category: "Entertainment", keywords: ["movie", "cinema", "concert", "game", "xbox", "playstation", "steam", "ticket"] },
  { category: "Shopping", keywords: ["amazon", "target", "walmart", "store", "shop", "clothing", "apparel", "best buy"] },
  { category: "Personal Care", keywords: ["haircut", "salon", "barber", "nails", "beauty", "gym", "fitness"] },
  { category: "Taxes", keywords: ["tax", "irs", "state tax", "federal tax"] },
  { category: "Fees", keywords: ["fee", "overdraft", "atm", "service charge", "late fee"] },
  { category: "Gifts & Donations", keywords: ["gift", "donation", "charity", "church", "nonprofit"] },
  { category: "Business", keywords: ["business", "office", "software", "domain", "hosting", "supplies", "invoice"] },
  { category: "Transfers", keywords: ["transfer", "zelle", "venmo", "cash app", "paypal", "move money"] },
];

export function identifyTransactionCategory(row: SpreadsheetRow): string {
  const haystack = [
    row.cells.description,
    row.cells.account,
    row.cells.notes,
    row.cells.type,
  ]
    .join(" ")
    .toLowerCase();

  const rule = categoryRules.find((item) => item.keywords.some((keyword) => haystack.includes(keyword)));
  if (rule) return rule.category;
  const explicitCategory = String(row.cells.category || "").trim();
  if (explicitCategory && explicitCategory !== "Uncategorized") return explicitCategory;
  if (transactionType(row) === "income") return "Income";
  if (transactionType(row) === "transfer") return "Transfers";
  return "Uncategorized";
}

export function transactionType(row: SpreadsheetRow): TransactionType {
  const explicitType = String(row.cells.type || "").trim().toLowerCase();
  if (includesAny(explicitType, ["transfer", "move"])) return "transfer";
  if (includesAny(explicitType, ["expense", "debit", "purchase", "payment", "outflow"])) return "expense";
  if (includesAny(explicitType, ["income", "credit", "deposit", "refund", "inflow"])) return "income";

  const category = String(row.cells.category || "").trim().toLowerCase();
  if (category.includes("transfer")) return "transfer";
  if (includesAny(category, ["income", "paycheck", "salary", "bonus", "refund"])) return "income";
  if (category && category !== "uncategorized") return "expense";
  return toNumber(row.cells.amount) > 0 ? "income" : "expense";
}

export function signedTransactionAmount(row: SpreadsheetRow): number {
  const rawAmount = toNumber(row.cells.amount);
  const magnitude = Math.abs(rawAmount);
  const type = transactionType(row);

  if (type === "income") return magnitude;
  if (type === "expense") return -magnitude;
  return rawAmount;
}

function includesAny(value: string, values: string[]): boolean {
  return values.some((candidate) => value.includes(candidate));
}
