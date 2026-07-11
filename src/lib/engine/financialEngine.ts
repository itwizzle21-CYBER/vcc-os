import { getInventoryAlert } from "./inventoryEngine";
import { isBlankRow, toNumber } from "../calculations/currency";
import type { AppData, FinancialState, SpreadsheetRow } from "../types/app";

export function computeFinancialState(data: AppData): FinancialState {
  const money = data.sections.money.filter((row) => !isBlankRow(row.cells));
  const bills = data.sections.bills.filter((row) => !isBlankRow(row.cells));
  const income = data.sections.income.filter((row) => !isBlankRow(row.cells));
  const transactions = data.sections.transactions.filter((row) => !isBlankRow(row.cells));
  const debt = data.sections.debt.filter((row) => !isBlankRow(row.cells));
  const carPayment = data.sections.carPayment.filter((row) => !isBlankRow(row.cells));
  const savings = data.sections.savings.filter((row) => !isBlankRow(row.cells));
  const goals = data.sections.goals.filter((row) => !isBlankRow(row.cells));
  const inventory = data.sections.inventory.filter((row) => !isBlankRow(row.cells));

  const moneyRows = money.map((row) => ({
    row,
    amount: toNumber(row.cells.amount),
    section: moneySection(row),
  }));
  const cashMoney = moneyRows
    .filter((item) => item.section === "cash")
    .reduce((sum, item) => sum + positive(item.amount), 0);
  const protectedMoney = moneyRows
    .filter((item) => item.section === "protectedSavings")
    .reduce((sum, item) => sum + positive(item.amount), 0);
  const availableSavingsMoney = moneyRows
    .filter((item) => item.section === "availableSavings")
    .reduce((sum, item) => sum + positive(item.amount), 0);
  const borrowedMoney = moneyRows
    .filter((item) => item.section === "borrowed")
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const repaymentImpact = toNumber(data.paycheckPlanner.spotMeRepayment) + toNumber(data.paycheckPlanner.myPayRepayment);
  const plannerRemainingCash = data.paycheckPlanner.locked
    ? Math.max(0, toNumber(data.paycheckPlanner.paycheckAmount) - repaymentImpact)
    : 0;
  const latestHistoryRemainingCash = data.paycheckHistory.reduce(
    (max, row) => Math.max(max, positive(toNumber(row.remaining))),
    0
  );
  const operatingCash = cashMoney || Math.max(plannerRemainingCash, latestHistoryRemainingCash);
  const protectedSavings = savings
    .filter((row) => (row.cells.protected || "").toLowerCase().startsWith("y") || row.cells.name.toLowerCase().includes("protected"))
    .reduce((sum, row) => sum + toNumber(row.cells.balance), protectedMoney);
  const availableSavings = savings
    .filter((row) => !(row.cells.protected || "").toLowerCase().startsWith("y"))
    .reduce((sum, row) => sum + toNumber(row.cells.balance), availableSavingsMoney);
  const totalCash = operatingCash + protectedSavings + availableSavings;
  const lockedIncome = data.paycheckPlanner.locked ? toNumber(data.paycheckPlanner.paycheckAmount) : 0;
  const extraIncome = income.reduce((sum, row) => sum + positive(toNumber(row.cells.amount)), 0);
  const transactionIncome = transactions
    .filter((row) => row.cells.category.toLowerCase().includes("income") || toNumber(row.cells.amount) > 0)
    .reduce((sum, row) => sum + positive(toNumber(row.cells.amount)), 0);
  const weeklyIncome = lockedIncome || extraIncome || transactionIncome;
  const monthlyIncome = weeklyIncome * 4.33;
  const receivedIncome = data.paycheckHistory.reduce((sum, row) => sum + toNumber(row.income), 0) + transactionIncome;
  const spendableCash = Math.max(0, cashMoney > 0 ? operatingCash + weeklyIncome - repaymentImpact : operatingCash);

  const today = new Date();
  const billsDueToday = bills.filter((row) => isSameDay(row.cells.dueDate, today) && !isPaid(row)).length;
  const billsDueThisWeek = bills.filter((row) => isWithinDays(row.cells.dueDate, today, 7) && !isPaid(row)).length;
  const overdueBills = bills.filter((row) => isPast(row.cells.dueDate, today) && !isPaid(row)).length;
  const billsPressure = bills
    .filter((row) => isWithinDays(row.cells.dueDate, today, 7) && !isPaid(row))
    .reduce((sum, row) => sum + toNumber(row.cells.amount), 0);
  const safeToSpend = Math.max(0, spendableCash - billsPressure - borrowedMoney);

  const expenseRows = transactions.filter((row) => toNumber(row.cells.amount) < 0 || !row.cells.category.toLowerCase().includes("income"));
  const weeklySpending = expenseRows.filter((row) => isWithinDays(row.cells.date, today, 7)).reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const monthlySpending = expenseRows.filter((row) => isWithinDays(row.cells.date, today, 31)).reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const largest = [...expenseRows].sort((a, b) => Math.abs(toNumber(b.cells.amount)) - Math.abs(toNumber(a.cells.amount)))[0];
  const last = [...transactions].sort((a, b) => (b.cells.date || "").localeCompare(a.cells.date || ""))[0];
  const categorySummary = Object.entries(
    expenseRows.reduce<Record<string, number>>((acc, row) => {
      const category = row.cells.category || "Other";
      acc[category] = (acc[category] || 0) + Math.abs(toNumber(row.cells.amount));
      return acc;
    }, {})
  )
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const totalDebt = debt.reduce((sum, row) => sum + toNumber(row.cells.balance), 0);
  const minimumPayments = debt.reduce((sum, row) => sum + toNumber(row.cells.minimum), 0);
  const nextDebt = [...debt].sort((a, b) => toNumber(a.cells.balance) - toNumber(b.cells.balance))[0];
  const startingDebt = Math.max(totalDebt + 5000, 1);
  const carPaymentOriginalTotal = carPayment.reduce((sum, row) => {
    const original = toNumber(row.cells.originalBalance);
    const remaining = toNumber(row.cells.remainingBalance);
    return sum + Math.max(original, remaining);
  }, 0);
  const carPaymentRemainingTotal = carPayment.reduce((sum, row) => sum + toNumber(row.cells.remainingBalance), 0);
  const carPaymentMonthlyTotal = carPayment.reduce((sum, row) => sum + toNumber(row.cells.monthlyPayment), 0);
  const nextCarPaymentRow = [...carPayment]
    .filter((row) => !isPaid(row))
    .sort((a, b) => (a.cells.dueDate || "").localeCompare(b.cells.dueDate || ""))[0];

  const emergencyFund = savings.find((row) => row.cells.name.toLowerCase().includes("emergency"));
  const goalSavings = goals.reduce((sum, row) => sum + toNumber(row.cells.current), 0);
  const completeGoals = goals.filter((row) => toNumber(row.cells.current) >= toNumber(row.cells.target) && toNumber(row.cells.target) > 0).length;
  const closestGoal = [...goals]
    .filter((row) => toNumber(row.cells.target) > 0)
    .sort((a, b) => goalGap(a) - goalGap(b))[0];
  const totalGoalTarget = goals.reduce((sum, row) => sum + toNumber(row.cells.target), 0);

  const normalizedInventory: SpreadsheetRow[] = inventory.map((row) => ({
    ...row,
    cells: { ...row.cells, alert: getInventoryAlert(row.cells.qty || "", row.cells.minNeeded || "") },
  }));
  const buyNextRows = normalizedInventory
    .filter((row) => ["Critical", "Low"].includes(row.cells.alert))
    .sort((a, b) => alertScore(a) - alertScore(b));

  return {
    totalCash,
    spendableCash,
    safeToSpend,
    protectedSavings,
    availableSavings,
    borrowedMoney,
    weeklyIncome,
    monthlyIncome,
    receivedIncome,
    weeklySpending,
    monthlySpending,
    largestExpense: largest ? `${largest.cells.description || "Expense"} (${largest.cells.amount})` : "None",
    lastTransaction: last ? `${last.cells.description || "Transaction"} (${last.cells.amount})` : "None",
    billsDueToday,
    billsDueThisWeek,
    overdueBills,
    billsPressure,
    totalDebt,
    minimumPayments,
    nextPayoff: nextDebt?.cells.name || "None",
    debtFreePercent: Math.max(0, Math.min(100, 100 - (totalDebt / startingDebt) * 100)),
    carPaymentOriginalTotal,
    carPaymentRemainingTotal,
    carPaymentPaidPercent: carPaymentOriginalTotal > 0
      ? Math.max(0, Math.min(100, ((carPaymentOriginalTotal - carPaymentRemainingTotal) / carPaymentOriginalTotal) * 100))
      : 0,
    carPaymentMonthlyTotal,
    nextCarPayment: nextCarPaymentRow?.cells.vehicle || "None",
    emergencyFund: toNumber(emergencyFund?.cells.balance),
    goalSavings,
    goalsComplete: completeGoals,
    closestGoal: closestGoal?.cells.name || "None",
    goalCompletionPercent: totalGoalTarget > 0 ? Math.min(100, (goalSavings / totalGoalTarget) * 100) : 0,
    estimatedFinish: closestGoal?.cells.deadline || "TBD",
    criticalItems: normalizedInventory.filter((row) => row.cells.alert === "Critical").length,
    lowStock: normalizedInventory.filter((row) => row.cells.alert === "Low").length,
    buyNextCount: buyNextRows.length,
    estimatedRefillCost: buyNextRows.reduce((sum, row) => sum + toNumber(row.cells.cost), 0),
    buyNextRows,
    cashFlow: [
      { label: "Week", income: weeklyIncome, spending: weeklySpending },
      { label: "Month", income: monthlyIncome, spending: monthlySpending },
      { label: "Spendable / Safe", income: safeToSpend, spending: billsPressure },
    ],
    categorySummary,
  };
}

function positive(value: number): number {
  return value > 0 ? value : 0;
}

function moneySection(row: SpreadsheetRow): "cash" | "protectedSavings" | "availableSavings" | "borrowed" {
  const value = `${row.cells.section || ""} ${row.cells.label || ""} ${row.cells.notes || ""}`.toLowerCase();
  if (includesAny(value, ["spotme", "my pay", "mypay", "borrow", "advance", "owed", "credit usage"])) return "borrowed";
  if (includesAny(value, ["protected", "emergency", "reserve"])) return "protectedSavings";
  if (includesAny(value, ["saving", "hysa", "vault"])) return "availableSavings";
  return "cash";
}

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function isPaid(row: SpreadsheetRow): boolean {
  return (row.cells.status || "").toLowerCase().includes("paid");
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameDay(value: string, today: Date): boolean {
  const date = parseDate(value);
  return !!date && date.toDateString() === today.toDateString();
}

function isPast(value: string, today: Date): boolean {
  const date = parseDate(value);
  if (!date) return false;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  return date.getTime() < start.getTime();
}

function isWithinDays(value: string, today: Date, days: number): boolean {
  const date = parseDate(value);
  if (!date) return false;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + days);
  return date >= start && date <= end;
}

function goalGap(row: SpreadsheetRow): number {
  return Math.max(0, toNumber(row.cells.target) - toNumber(row.cells.current));
}

function alertScore(row: SpreadsheetRow): number {
  return row.cells.alert === "Critical" ? 0 : 1;
}
