import { isBlankRow, isValidIsoDate, toNumber } from "../calculations/currency";
import type { SpreadsheetRow } from "../types/app";
import { effectiveBillStatus } from "./billPaymentSync";

export interface BillReviewSummary {
  dueThisMonthCount: number;
  dueThisMonthAmount: number;
  openCount: number;
  openAmount: number;
  paidCount: number;
  paidAmount: number;
  overdueCount: number;
  overdueAmount: number;
  upcomingCount: number;
  autopayCount: number;
}

export interface BillPaymentImpact {
  availableCash: number;
  billAmount: number;
  projectedAfterPayment: number;
  canCover: boolean;
}

export function summarizeBillReview(rows: SpreadsheetRow[], referenceDate = new Date()): BillReviewSummary {
  const summary = {
    dueThisMonthCount: 0,
    dueThisMonthAmountCents: 0,
    openCount: 0,
    openAmountCents: 0,
    paidCount: 0,
    paidAmountCents: 0,
    overdueCount: 0,
    overdueAmountCents: 0,
    upcomingCount: 0,
    autopayCount: 0,
  };

  for (const row of rows) {
    if (isBlankRow(row.cells)) continue;
    const status = effectiveBillStatus(row, referenceDate);
    const amountCents = Math.max(0, Math.round(toNumber(row.cells.amount) * 100));
    const dueDays = daysUntil(row.cells.dueDate || row.cells.due_date, referenceDate);
    const dueDate = parseIsoDate(row.cells.dueDate || row.cells.due_date);

    if (status !== "cancelled" && dueDate && dueDate.getFullYear() === referenceDate.getFullYear() && dueDate.getMonth() === referenceDate.getMonth()) {
      summary.dueThisMonthCount += 1;
      summary.dueThisMonthAmountCents += amountCents;
    }

    if (status === "paid") {
      summary.paidCount += 1;
      summary.paidAmountCents += amountCents;
    } else if (status !== "cancelled") {
      summary.openCount += 1;
      summary.openAmountCents += amountCents;
    }

    if (status === "overdue") {
      summary.overdueCount += 1;
      summary.overdueAmountCents += amountCents;
    }
    if (status !== "paid" && status !== "cancelled" && dueDays >= 0 && dueDays <= 30) summary.upcomingCount += 1;
    if (/^(yes|true|1|on)$/i.test(String(row.cells.autopay || "").trim())) summary.autopayCount += 1;
  }

  return {
    dueThisMonthCount: summary.dueThisMonthCount,
    dueThisMonthAmount: summary.dueThisMonthAmountCents / 100,
    openCount: summary.openCount,
    openAmount: summary.openAmountCents / 100,
    paidCount: summary.paidCount,
    paidAmount: summary.paidAmountCents / 100,
    overdueCount: summary.overdueCount,
    overdueAmount: summary.overdueAmountCents / 100,
    upcomingCount: summary.upcomingCount,
    autopayCount: summary.autopayCount,
  };
}

export function previewBillPayment(accountBalance: string | number, billAmount: string | number): BillPaymentImpact {
  const availableCents = Math.round(toNumber(accountBalance) * 100);
  const billCents = Math.max(0, Math.round(Math.abs(toNumber(billAmount)) * 100));
  return {
    availableCash: availableCents / 100,
    billAmount: billCents / 100,
    projectedAfterPayment: (availableCents - billCents) / 100,
    canCover: availableCents >= billCents,
  };
}

function daysUntil(value: string | undefined, referenceDate: Date): number {
  const due = parseIsoDate(value);
  if (!due) return Number.POSITIVE_INFINITY;
  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function parseIsoDate(value: string | undefined): Date | null {
  if (!isValidIsoDate(value)) return null;
  return new Date(`${value}T12:00:00`);
}
