import { isValidIsoDate, toNumber } from "../calculations/currency";
import type { AppData, PaycheckHistoryRow, SpreadsheetRow } from "../types/app";

export interface DepositAccountOption {
  id: string;
  label: string;
  balance: number;
  isNew: boolean;
}

const suggestedAccounts = [
  { id: "money-account-chime", label: "Chime" },
  { id: "money-account-apple-cash", label: "Apple Cash" },
  { id: "money-account-wise", label: "Wise" },
  { id: "money-account-cash-app", label: "Cash App" },
  { id: "money-account-cash", label: "Cash on Hand" },
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
  const existingLabels = new Set(existing.map((row) => normalizeAccountLabel(row.cells.label)));
  const currentOptions = existing.map((row) => ({
    id: row.id,
    label: normalizeAccountLabel(row.cells.label) === "cashonhand" ? "Cash on Hand" : row.cells.label,
    balance: toNumber(row.cells.amount),
    isNew: false,
  }));
  const suggestedOptions = suggestedAccounts
    .filter((account) => !existingLabels.has(normalizeAccountLabel(account.label)))
    .map((account) => ({ ...account, balance: 0, isNew: true }));
  return [...currentOptions, ...suggestedOptions];
}

export function lockPaycheckWeek(data: AppData): AppData {
  const planner = data.paycheckPlanner;
  const incomeSource = planner.incomeSource.trim();
  const existingDepositAccount = eligibleDepositAccounts(data).find((row) => row.id === planner.depositAccountId);
  const suggestedDepositAccount = suggestedAccounts.find((account) => account.id === planner.depositAccountId);
  const depositAccount = existingDepositAccount || (suggestedDepositAccount ? createMoneyAccount(suggestedDepositAccount.id, suggestedDepositAccount.label) : undefined);
  const income = toNumber(planner.paycheckAmount);
  const spotMeRepayment = toNumber(planner.spotMeRepayment);
  const myPayRepayment = toNumber(planner.myPayRepayment);
  const repayments = spotMeRepayment + myPayRepayment;
  const remaining = Math.round((income - repayments) * 100) / 100;

  if (!incomeSource) throw new Error("Add the source of this income before locking the week.");
  if (!depositAccount) throw new Error("Choose the card or account receiving this paycheck.");
  if (!isValidIsoDate(planner.payDate)) throw new Error("Choose a valid paycheck date before locking the week.");
  if (income <= 0) throw new Error("Enter a paycheck amount greater than $0.");
  if (spotMeRepayment < 0 || myPayRepayment < 0) throw new Error("Repayment amounts cannot be negative.");
  if (remaining < 0) throw new Error("Repayments cannot exceed the paycheck amount.");

  const existing = data.paycheckHistory.find((row) => row.payDate === planner.payDate);
  const historyId = existing?.id || `paycheck-${planner.payDate}-${Date.now()}`;
  const restoredMoney = data.sections.money.map((row) => {
    const previousRepayment = existing?.borrowedRepayments
      ?.filter((item) => item.rowId === row.id)
      .reduce((sum, item) => sum + item.amount, 0) || 0;
    return previousRepayment > 0
      ? { ...row, cells: { ...row.cells, amount: currencyValue(toNumber(row.cells.amount) + previousRepayment) } }
      : row;
  });
  const borrowedRepayments = allocateBorrowedRepayments(restoredMoney, spotMeRepayment, myPayRepayment);
  const historyRow: PaycheckHistoryRow = {
    id: historyId,
    incomeSource,
    depositAccountId: depositAccount.id,
    depositAccountLabel: depositAccount.cells.label,
    borrowedRepayments,
    payDate: planner.payDate,
    income: planner.paycheckAmount,
    spotMe: planner.spotMeRepayment,
    myPay: planner.myPayRepayment,
    remaining: currencyValue(remaining),
    weekStart: planner.weekStart,
    weekEnd: planner.weekEnd,
    locked: true,
  };

  const accountAdjustments = new Map<string, number>();
  if (existing?.depositAccountId) {
    accountAdjustments.set(existing.depositAccountId, -toNumber(existing.remaining));
  }
  accountAdjustments.set(depositAccount.id, (accountAdjustments.get(depositAccount.id) || 0) + remaining);
  borrowedRepayments.forEach((repayment) => {
    accountAdjustments.set(repayment.rowId, (accountAdjustments.get(repayment.rowId) || 0) - repayment.amount);
  });

  const moneyRows = existingDepositAccount || !depositAccount
    ? restoredMoney
    : [...restoredMoney, depositAccount];
  const money = moneyRows.map((row) => {
    const adjustment = accountAdjustments.get(row.id);
    const cells = {
      ...row.cells,
      weekStart: row.cells.weekStart || planner.weekStart,
      weekEnd: row.cells.weekEnd || planner.weekEnd,
    };
    if (adjustment === undefined) return { ...row, cells };
    return { ...row, cells: { ...cells, amount: currencyValue(toNumber(row.cells.amount) + adjustment) } };
  });
  const transaction = paycheckTransaction(historyRow, depositAccount);
  const transactions = [
    ...data.sections.transactions.filter((row) => row.cells.paycheckHistoryId !== historyId),
    transaction,
  ];

  return {
    ...data,
    paycheckPlanner: { ...planner, locked: true, depositApplied: true },
    paycheckHistory: [historyRow, ...data.paycheckHistory.filter((row) => row.payDate !== planner.payDate)],
    sections: { ...data.sections, money, transactions },
  };
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
      recurring: "No",
      notes: repaymentTotal > 0
        ? `${currencyValue(repaymentTotal)} in SpotMe/MyPay repayments; ${currencyValue(toNumber(history.remaining))} deposited and applied to the account balance.`
        : `${currencyValue(toNumber(history.remaining))} deposited and applied to the account balance.`,
      paycheckHistoryId: history.id,
      depositAccountId: depositAccount.id,
      balanceApplied: "yes",
    },
  };
}

function currencyValue(value: number): string {
  return value.toFixed(2);
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

function allocateBorrowedRepayments(
  rows: SpreadsheetRow[],
  spotMeAmount: number,
  myPayAmount: number,
): Array<{ rowId: string; label: string; amount: number }> {
  const borrowedRows = rows.filter((row) => {
    const value = `${row.cells.section || ""} ${row.cells.label || ""} ${row.cells.notes || ""}`.toLowerCase();
    return ["borrow", "spotme", "spot me", "mypay", "my pay", "advance", "owed"].some((term) => value.includes(term));
  });
  const balances = new Map(borrowedRows.map((row) => [row.id, Math.max(0, toNumber(row.cells.amount))]));
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

  const spotRemaining = apply(spotMeAmount, (row) => /spot\s?me/i.test(`${row.cells.label} ${row.cells.notes}`));
  const myPayRemaining = apply(myPayAmount, (row) => /my\s?pay/i.test(`${row.cells.label} ${row.cells.notes}`));
  apply(spotRemaining + myPayRemaining, () => true);

  return borrowedRows
    .filter((row) => (allocated.get(row.id) || 0) > 0)
    .map((row) => ({ rowId: row.id, label: row.cells.label || "Borrowed money", amount: allocated.get(row.id) || 0 }));
}
