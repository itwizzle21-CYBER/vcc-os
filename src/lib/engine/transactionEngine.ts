import { toNumber } from "../calculations/currency";
import type { SpreadsheetRow } from "../types/app";

export type TransactionType = "income" | "expense" | "transfer";

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
