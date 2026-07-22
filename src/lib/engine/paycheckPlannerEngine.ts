import { toNumber } from "../calculations/currency";
import type { AppData, PaycheckHistoryRow, SpreadsheetRow } from "../types/app";

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

export function lockPaycheckWeek(data: AppData): AppData {
  const planner = data.paycheckPlanner;
  const incomeSource = planner.incomeSource.trim();
  const depositAccount = eligibleDepositAccounts(data).find((row) => row.id === planner.depositAccountId);
  const income = toNumber(planner.paycheckAmount);
  const repayments = toNumber(planner.spotMeRepayment) + toNumber(planner.myPayRepayment);
  const remaining = Math.round((income - repayments) * 100) / 100;

  if (!incomeSource) throw new Error("Add the source of this income before locking the week.");
  if (!depositAccount) throw new Error("Choose the card or account receiving this paycheck.");
  if (!planner.payDate) throw new Error("Choose the paycheck date before locking the week.");
  if (income <= 0) throw new Error("Enter a paycheck amount greater than $0.");
  if (remaining < 0) throw new Error("Repayments cannot exceed the paycheck amount.");

  const existing = data.paycheckHistory.find((row) => row.payDate === planner.payDate);
  const historyId = existing?.id || `paycheck-${planner.payDate}-${Date.now()}`;
  const historyRow: PaycheckHistoryRow = {
    id: historyId,
    incomeSource,
    depositAccountId: depositAccount.id,
    depositAccountLabel: depositAccount.cells.label,
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

  const money = data.sections.money.map((row) => {
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
