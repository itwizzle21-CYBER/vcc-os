import { isValidIsoDate, toNumber } from "../calculations/currency";
import type { AppData, PaycheckHistoryRow, SpreadsheetRow } from "../types/app";
import { automaticSpotMeRepayment, isChimeAccount } from "./chimeAccountingEngine";

export interface DepositAccountOption {
  id: string;
  label: string;
  balance: number;
  isNew: boolean;
}

export interface PaycheckRecordInput {
  incomeSource: string;
  depositAccountId: string;
  paycheckAmount: string;
  payDate: string;
  weekStart: string;
  weekEnd: string;
  spotMeRepayment: string;
  myPayRepayment: string;
}

const suggestedAccounts = [
  { id: "money-account-chime", label: "Chime" },
  { id: "money-account-apple-cash", label: "Apple Cash" },
  { id: "money-account-wise", label: "Wise" },
  { id: "money-account-cash-app", label: "Cash App" },
  { id: "money-account-cash", label: "Cash" },
] as const;

export function eligibleDepositAccounts(data: AppData): SpreadsheetRow[] {
  return data.sections.money.filter((row) => {
    const section = (row.cells.section || "").trim().toLowerCase();
    if (["cash", "checking", "debit"].some((term) => section.includes(term))) return Boolean(row.cells.label?.trim());
    if (["saving", "protected", "borrow", "advance", "credit"].some((term) => section.includes(term))) return false;

    const value = `${row.cells.label || ""} ${row.cells.notes || ""}`.toLowerCase();
    const excluded = ["saving", "protected", "borrow", "spotme", "mypay", "advance", "credit card", "credit usage"].some((term) => value.includes(term));
    return !excluded && Boolean(row.cells.label?.trim());
  });
}

export function depositAccountOptions(data: AppData): DepositAccountOption[] {
  const existing = eligibleDepositAccounts(data);
  const existingLabels = new Set(existing.map((row) => canonicalAccountLabel(row.cells.label)));
  const currentOptions = existing.map((row) => ({
    id: row.id,
    label: displayAccountLabel(row.cells.label),
    balance: toNumber(row.cells.amount),
    isNew: false,
  }));
  const suggestedOptions = suggestedAccounts
    .filter((account) => !existingLabels.has(canonicalAccountLabel(account.label)))
    .map((account) => ({ ...account, balance: 0, isNew: true }));
  return [...currentOptions, ...suggestedOptions];
}

export function applyPendingPaycheckDeposit(data: AppData): AppData {
  if (!data.paycheckPlanner.locked || data.paycheckPlanner.depositApplied) return data;
  const selectedAccountExists = depositAccountOptions(data)
    .some((account) => account.id === data.paycheckPlanner.depositAccountId);
  const fallbackAccountId = eligibleDepositAccounts(data)[0]?.id || suggestedAccounts[0].id;
  const normalized = {
    ...data,
    paycheckPlanner: {
      ...data.paycheckPlanner,
      incomeSource: data.paycheckPlanner.incomeSource.trim() || "Paycheck",
      depositAccountId: selectedAccountExists ? data.paycheckPlanner.depositAccountId : fallbackAccountId,
    },
  };
  const existing = normalized.paycheckHistory.find((row) => row.payDate === normalized.paycheckPlanner.payDate);
  return applyPaycheckRecord(normalized, normalized.paycheckPlanner, existing?.id);
}

export function recordPaycheck(data: AppData): AppData {
  const existing = data.paycheckHistory.find((row) => row.payDate === data.paycheckPlanner.payDate);
  if (existing?.locked) {
    if (recordInputMatchesHistory(data.paycheckPlanner, existing) && data.paycheckPlanner.depositApplied) return data;
    throw new Error("Unlock the matching paycheck in History before changing it.");
  }
  return applyPaycheckRecord(data, data.paycheckPlanner, existing?.id);
}

/** @deprecated Kept for compatibility with older callers. Recording no longer locks the planner. */
export const lockPaycheckWeek = recordPaycheck;

export function setPaycheckHistoryLock(data: AppData, historyId: string, locked: boolean): AppData {
  const existing = requireHistoryRow(data, historyId);
  if (existing.locked === locked) return data;
  return {
    ...data,
    paycheckHistory: data.paycheckHistory.map((row) => row.id === historyId ? { ...row, locked } : row),
  };
}

export function updatePaycheckHistoryRecord(
  data: AppData,
  historyId: string,
  input: PaycheckRecordInput,
): AppData {
  const existing = requireHistoryRow(data, historyId);
  if (existing.locked) throw new Error("Unlock this paycheck record before editing it.");
  const conflictingDate = data.paycheckHistory.some((row) => row.id !== historyId && row.payDate === input.payDate);
  if (conflictingDate) throw new Error("Another paycheck is already recorded for that pay date.");
  return applyPaycheckRecord(data, input, historyId);
}

export function deletePaycheckHistoryRecord(data: AppData, historyId: string): AppData {
  const existing = requireHistoryRow(data, historyId);
  if (existing.locked) throw new Error("Unlock this paycheck record before deleting it.");
  const reversed = reversePaycheckEffects(data, existing);
  const plannerMatches = data.paycheckPlanner.payDate === existing.payDate;
  return {
    ...reversed,
    paycheckPlanner: plannerMatches
      ? { ...reversed.paycheckPlanner, depositApplied: false, locked: false }
      : reversed.paycheckPlanner,
    paycheckHistory: reversed.paycheckHistory.filter((row) => row.id !== historyId),
  };
}

function applyPaycheckRecord(data: AppData, input: PaycheckRecordInput, replaceHistoryId?: string): AppData {
  const existing = replaceHistoryId ? requireHistoryRow(data, replaceHistoryId) : undefined;
  const base = existing ? reversePaycheckEffects(data, existing) : data;
  const incomeSource = input.incomeSource.trim();
  const existingDepositAccount = eligibleDepositAccounts(base).find((row) => row.id === input.depositAccountId);
  const suggestedDepositAccount = suggestedAccounts.find((account) => account.id === input.depositAccountId);
  const depositAccount = existingDepositAccount || (suggestedDepositAccount ? createMoneyAccount(suggestedDepositAccount.id, suggestedDepositAccount.label) : undefined);
  const incomeCents = toCents(input.paycheckAmount);
  const requestedSpotMeRepaymentCents = toCents(input.spotMeRepayment);
  const myPayRepaymentCents = toCents(input.myPayRepayment);
  const embeddedSpotMeRepaymentCents = toCents(automaticSpotMeRepayment(depositAccount, incomeCents / 100));
  const spotMeIsEmbedded = isChimeAccount(depositAccount) && embeddedSpotMeRepaymentCents > 0;
  const spotMeRepaymentCents = spotMeIsEmbedded ? embeddedSpotMeRepaymentCents : requestedSpotMeRepaymentCents;
  const remainingCents = incomeCents - spotMeRepaymentCents - myPayRepaymentCents;
  const depositAppliedCents = incomeCents - myPayRepaymentCents - (spotMeIsEmbedded ? 0 : spotMeRepaymentCents);

  if (!incomeSource) throw new Error("Add the source of this income before recording the paycheck.");
  if (!depositAccount) throw new Error("Choose the card or account receiving this paycheck.");
  if (!isValidIsoDate(input.payDate)) throw new Error("Choose a valid paycheck date before recording the paycheck.");
  if (incomeCents <= 0) throw new Error("Enter a paycheck amount greater than $0.");
  if (requestedSpotMeRepaymentCents < 0 || myPayRepaymentCents < 0) throw new Error("Repayment amounts cannot be negative.");
  if (remainingCents < 0) throw new Error("Repayments cannot exceed the paycheck amount.");

  const historyId = existing?.id || `paycheck-${input.payDate}-${Date.now()}`;
  const moneyBeforeDeposit = existingDepositAccount || !depositAccount
    ? base.sections.money
    : [...base.sections.money, depositAccount];
  const borrowedRepayments = allocateBorrowedRepayments(
    moneyBeforeDeposit,
    spotMeIsEmbedded ? 0 : spotMeRepaymentCents,
    myPayRepaymentCents,
  );
  const historyRow: PaycheckHistoryRow = {
    id: historyId,
    incomeSource,
    depositAccountId: depositAccount.id,
    depositAccountLabel: depositAccount.cells.label,
    borrowedRepayments,
    depositAppliedAmount: centsValue(depositAppliedCents),
    payDate: input.payDate,
    income: centsValue(incomeCents),
    spotMe: centsValue(spotMeRepaymentCents),
    myPay: centsValue(myPayRepaymentCents),
    remaining: centsValue(remainingCents),
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    locked: true,
  };

  const accountAdjustments = new Map<string, number>();
  accountAdjustments.set(depositAccount.id, depositAppliedCents);
  borrowedRepayments.forEach((repayment) => {
    accountAdjustments.set(repayment.rowId, (accountAdjustments.get(repayment.rowId) || 0) - toCents(repayment.amount));
  });

  const money = moneyBeforeDeposit.map((row) => {
    const adjustment = accountAdjustments.get(row.id);
    const cells = {
      ...row.cells,
      weekStart: row.cells.weekStart || input.weekStart,
      weekEnd: row.cells.weekEnd || input.weekEnd,
    };
    if (adjustment === undefined) return { ...row, cells };
    return { ...row, cells: { ...cells, amount: centsValue(toCents(row.cells.amount) + adjustment) } };
  });
  const transaction = paycheckTransaction(historyRow, depositAccount);
  const transactions = [
    ...base.sections.transactions.filter((row) => row.cells.paycheckHistoryId !== historyId),
    transaction,
  ];

  return {
    ...base,
    paycheckPlanner: {
      ...base.paycheckPlanner,
      ...input,
      paycheckAmount: historyRow.income,
      spotMeRepayment: historyRow.spotMe,
      myPayRepayment: historyRow.myPay,
      locked: false,
      depositApplied: true,
    },
    paycheckHistory: [historyRow, ...base.paycheckHistory.filter((row) => row.id !== historyId)],
    sections: { ...base.sections, money, transactions },
  };
}

function reversePaycheckEffects(data: AppData, history: PaycheckHistoryRow): AppData {
  const accountAdjustments = new Map<string, number>();
  const depositCents = history.depositAccountId ? toCents(history.depositAppliedAmount ?? history.remaining) : 0;
  if (history.depositAccountId && depositCents !== 0) {
    if (!data.sections.money.some((row) => row.id === history.depositAccountId)) {
      throw new Error("The original deposit account is missing. Restore it before changing this paycheck.");
    }
    accountAdjustments.set(history.depositAccountId, -depositCents);
  }
  for (const repayment of history.borrowedRepayments || []) {
    const repaymentCents = toCents(repayment.amount);
    if (!repaymentCents) continue;
    if (!data.sections.money.some((row) => row.id === repayment.rowId)) {
      throw new Error(`The original ${repayment.label} repayment row is missing. Restore it before changing this paycheck.`);
    }
    accountAdjustments.set(repayment.rowId, (accountAdjustments.get(repayment.rowId) || 0) + repaymentCents);
  }
  const money = data.sections.money.map((row) => {
    const adjustment = accountAdjustments.get(row.id);
    if (adjustment === undefined) return row;
    return { ...row, cells: { ...row.cells, amount: centsValue(toCents(row.cells.amount) + adjustment) } };
  });
  return {
    ...data,
    sections: {
      ...data.sections,
      money,
      transactions: data.sections.transactions.filter((row) => row.cells.paycheckHistoryId !== history.id),
    },
  };
}

function requireHistoryRow(data: AppData, historyId: string): PaycheckHistoryRow {
  const history = data.paycheckHistory.find((row) => row.id === historyId);
  if (!history) throw new Error("That paycheck history record no longer exists.");
  return history;
}

function recordInputMatchesHistory(input: PaycheckRecordInput, history: PaycheckHistoryRow): boolean {
  return input.incomeSource.trim() === (history.incomeSource || "").trim()
    && input.depositAccountId === (history.depositAccountId || "")
    && toCents(input.paycheckAmount) === toCents(history.income)
    && input.payDate === history.payDate
    && input.weekStart === history.weekStart
    && input.weekEnd === history.weekEnd
    && toCents(input.spotMeRepayment) === toCents(history.spotMe)
    && toCents(input.myPayRepayment) === toCents(history.myPay);
}

function paycheckTransaction(history: PaycheckHistoryRow, depositAccount: SpreadsheetRow): SpreadsheetRow {
  const repaymentTotal = toNumber(history.spotMe) + toNumber(history.myPay);
  return {
    id: `paycheck-income-${history.id}`,
    cells: {
      description: `${history.incomeSource || "Paycheck"} paycheck`,
      type: "income",
      category: "Income",
      amount: currencyValue(toNumber(history.income)),
      date: history.payDate,
      account: depositAccount.cells.label || "Money Snapshot account",
      notes: repaymentTotal > 0
        ? `$${currencyValue(toNumber(history.spotMe))} repaid to SpotMe first and $${currencyValue(toNumber(history.myPay))} repaid to MyPay; $${currencyValue(toNumber(history.remaining))} remained available.`
        : `$${currencyValue(toNumber(history.remaining))} deposited and applied to the account balance.`,
      paycheckHistoryId: history.id,
      depositAccountId: depositAccount.id,
      balanceApplied: "yes",
    },
  };
}

export function paycheckBreakdown(data: AppData): { spotMeRepayment: number; myPayRepayment: number; remaining: number; spotMeAutomatic: boolean } {
  const planner = data.paycheckPlanner;
  const existingAccount = eligibleDepositAccounts(data).find((row) => row.id === planner.depositAccountId);
  const suggestedAccount = suggestedAccounts.find((row) => row.id === planner.depositAccountId);
  const account = existingAccount || (suggestedAccount ? createMoneyAccount(suggestedAccount.id, suggestedAccount.label) : undefined);
  const income = toNumber(planner.paycheckAmount);
  const automaticRepayment = automaticSpotMeRepayment(account, income);
  const spotMeAutomatic = isChimeAccount(account) && automaticRepayment > 0;
  const spotMeRepayment = spotMeAutomatic ? automaticRepayment : toNumber(planner.spotMeRepayment);
  const myPayRepayment = toNumber(planner.myPayRepayment);
  return { spotMeRepayment, myPayRepayment, remaining: income - spotMeRepayment - myPayRepayment, spotMeAutomatic };
}

function toCents(value: string | number | undefined): number {
  return Math.round(toNumber(value) * 100);
}

function centsValue(cents: number): string {
  return (Math.round(cents) / 100).toFixed(2);
}

function currencyValue(value: number): string {
  return centsValue(toCents(value));
}

function createMoneyAccount(id: string, label: string): SpreadsheetRow {
  return {
    id,
    cells: {
      label,
      amount: "0.00",
      section: "cash",
      weekStart: "",
      weekEnd: "",
      notes: "Created from Current Week Planner",
    },
  };
}

function normalizeAccountLabel(value: string | undefined): string {
  const normalized = String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ["cash", "cashonhand", "physicalcash", "walletcash"].includes(normalized) ? "cashonhand" : normalized;
}

export function displayAccountLabel(value: string | undefined): string {
  const label = String(value || "").trim();
  return normalizeAccountLabel(label) === "cashonhand" ? "Cash" : label;
}

function canonicalAccountLabel(value: string | undefined): string {
  const normalized = normalizeAccountLabel(value);
  if (["chime", "chimechecking", "chimecard", "chimedebit"].includes(normalized)) return "chime";
  if (["applecash", "applecashcard"].includes(normalized)) return "applecash";
  if (["wise", "wiseaccount", "wisecard"].includes(normalized)) return "wise";
  if (["cashapp", "cashappcard"].includes(normalized)) return "cashapp";
  return normalized;
}

function allocateBorrowedRepayments(
  rows: SpreadsheetRow[],
  spotMeCents: number,
  myPayCents: number,
): Array<{ rowId: string; label: string; amount: number }> {
  const borrowedRows = rows.filter((row) => {
    const value = `${row.cells.section || ""} ${row.cells.label || ""} ${row.cells.notes || ""}`.toLowerCase();
    return ["borrow", "spotme", "spot me", "mypay", "my pay", "advance", "owed"].some((term) => value.includes(term));
  });
  const balances = new Map(borrowedRows.map((row) => [row.id, Math.max(0, toCents(row.cells.amount))]));
  const allocated = new Map<string, number>();

  const apply = (amount: number, matches: (row: SpreadsheetRow) => boolean) => {
    let remaining = Math.max(0, amount);
    borrowedRows.filter(matches).forEach((row) => {
      if (remaining <= 0) return;
      const available = balances.get(row.id) || 0;
      const payment = Math.min(available, remaining);
      if (payment <= 0) return;
      balances.set(row.id, available - payment);
      allocated.set(row.id, (allocated.get(row.id) || 0) + payment);
      remaining -= payment;
    });
    return remaining;
  };

  const spotRemaining = apply(spotMeCents, (row) => /spot\s?me/i.test(`${row.cells.label} ${row.cells.notes}`));
  const myPayRemaining = apply(myPayCents, (row) => /my\s?pay/i.test(`${row.cells.label} ${row.cells.notes}`));
  apply(spotRemaining + myPayRemaining, () => true);

  return borrowedRows
    .filter((row) => (allocated.get(row.id) || 0) > 0)
    .map((row) => ({ rowId: row.id, label: row.cells.label || "Borrowed money", amount: (allocated.get(row.id) || 0) / 100 }));
}
