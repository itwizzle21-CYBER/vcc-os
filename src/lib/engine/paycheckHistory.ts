import { isValidIsoDate } from "../calculations/currency";
import type { PaycheckHistoryRow } from "../types/app";

export type PaycheckHistorySortOrder = "newest" | "oldest";

export function sortPaycheckHistory(
  rows: PaycheckHistoryRow[],
  order: PaycheckHistorySortOrder,
): PaycheckHistoryRow[] {
  return [...rows].sort((left, right) => {
    const leftDate = historyDate(left);
    const rightDate = historyDate(right);
    if (!leftDate && !rightDate) return left.id.localeCompare(right.id);
    if (!leftDate) return 1;
    if (!rightDate) return -1;
    const chronological = leftDate.localeCompare(rightDate);
    return order === "newest" ? -chronological : chronological;
  });
}

function historyDate(row: PaycheckHistoryRow): string {
  return [row.payDate, row.weekEnd, row.weekStart].find(isValidIsoDate) || "";
}
