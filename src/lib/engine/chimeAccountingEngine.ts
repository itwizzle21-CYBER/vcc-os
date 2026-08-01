import { toNumber } from "../calculations/currency";
import type { SpreadsheetRow } from "../types/app";

export const CHIME_SPOTME_LIMIT = 40;

export function isChimeAccount(row: Pick<SpreadsheetRow, "cells"> | undefined): boolean {
  if (!row) return false;
  const value = `${row.cells.label || ""} ${row.cells.notes || ""}`.toLowerCase();
  return /\bchime\b/.test(value);
}

export function automaticSpotMeRepayment(account: SpreadsheetRow | undefined, income: number): number {
  if (!isChimeAccount(account)) return 0;
  return Math.min(CHIME_SPOTME_LIMIT, Math.max(0, -toNumber(account?.cells.amount)), Math.max(0, income));
}

export function assertChimeBalanceAllowed(account: SpreadsheetRow | undefined, nextBalance: number): void {
  if (isChimeAccount(account) && nextBalance < -CHIME_SPOTME_LIMIT) {
    throw new Error(`Chime SpotMe only allows this account to go down to -$${CHIME_SPOTME_LIMIT.toFixed(2)}.`);
  }
}

export function enforceChimeBalanceFloor(rows: SpreadsheetRow[]): SpreadsheetRow[] {
  return rows.map((row) => {
    if (!isChimeAccount(row) || toNumber(row.cells.amount) >= -CHIME_SPOTME_LIMIT) return row;
    return { ...row, cells: { ...row.cells, amount: (-CHIME_SPOTME_LIMIT).toFixed(2) } };
  });
}
