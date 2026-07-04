import {
  applyDerivedRow,
  getInventoryBuyNextRows,
  isOverdue,
  isPaid,
  money,
  moneyAmount,
  number,
} from "../calculations/helpers";
import { defaultSections } from "../storage/vccStorage";
import type { FinancialState, Section, SectionKey } from "../types/vcc";

export function computeFinancialState(data: Section[]): FinancialState {
  const moneySection = getSection(data, "money");
  const billsSection = getSection(data, "bills");
  const incomeSection = getSection(data, "income");
  const budgetSection = getSection(data, "budget");
  const transactionsSection = getSection(data, "transactions");
  const debtSection = getSection(data, "debt");
  const savingsSection = getSection(data, "savings");
  const inventorySection = getSection(data, "inventory");
  const buyNextSection = getSection(data, "buyNext");
  const activitySection = getSection(data, "activity");
  const goalsSection = getSection(data, "goals");
  const missionsSection = getSection(data, "missions");

  const cashOnHand = moneyAmount(moneySection, "Cash On Hand");
  const weeklyIncomeFromSnapshot = moneyAmount(moneySection, "Weekly Income");
  const otherIncomeFromSnapshot = moneyAmount(moneySection, "Other Income");
  const foodNeeded = moneyAmount(moneySection, "Food Needed");
  const gasNeeded = moneyAmount(moneySection, "Gas Needed");

  const weeklyIncomeFromRows = incomeSection.rows.reduce((sum, row) => {
    const status = (row.Status ?? "").toLowerCase();
    if (["cancelled", "canceled", "void", "not received"].includes(status)) return sum;
    const type = `${row["Income Type"] ?? ""} ${row.Source ?? ""}`.toLowerCase();
    if (!/(weekly|paycheck|job|wage|salary)/.test(type)) return sum;
    return sum + number(row.Amount);
  }, 0);

  const otherIncomeFromRows = incomeSection.rows.reduce((sum, row) => {
    const status = (row.Status ?? "").toLowerCase();
    if (["cancelled", "canceled", "void", "not received"].includes(status)) return sum;
    const type = `${row["Income Type"] ?? ""} ${row.Source ?? ""}`.toLowerCase();
    if (/(weekly|paycheck|job|wage|salary)/.test(type)) return sum;
    return sum + number(row.Amount);
  }, 0);

  const weeklyIncome = weeklyIncomeFromSnapshot + weeklyIncomeFromRows;
  const otherIncome = otherIncomeFromSnapshot + otherIncomeFromRows;

  const transactionNet = transactionsSection.rows.reduce((sum, row) => {
    const amount = number(row.Amount);
    const type = (row.Type ?? "").toLowerCase();
    return type === "income" || type === "deposit" ? sum + amount : sum - amount;
  }, 0);

  const activeBudgetRows = budgetSection.rows.filter((row) => {
    const status = (row.Status ?? "").toLowerCase();
    return !["closed", "done", "cancelled", "canceled"].includes(status);
  });
  const budgetPlanned = activeBudgetRows.reduce((sum, row) => sum + number(row.Planned), 0);
  const budgetActual = activeBudgetRows.reduce((sum, row) => sum + number(row.Actual), 0);
  const budgetRemaining = budgetPlanned - budgetActual;

  const normalizedBills = billsSection.rows
    .filter((row) => hasAnyValue(row, ["Bill", "Due Date", "Amount", "Status"]))
    .map((row) => applyDerivedRow("bills", row));
  const unpaidBills = normalizedBills.filter((row) => !isPaid(row.Status));
  const paidBills = normalizedBills.filter((row) => isPaid(row.Status));
  const billsPressure = unpaidBills.reduce((sum, row) => sum + number(row.Amount), 0);
  const overdueBills = unpaidBills.filter((row) => isOverdue(row["Due Date"]) || (row.Status ?? "").toLowerCase() === "overdue").length;
  const billsDueThisWeek = unpaidBills.filter((row) => isDueWithinDays(row["Due Date"], 7)).length;

  const activeDebtRows = debtSection.rows.filter(
    (row) =>
      hasAnyValue(row, ["Debt", "Current Balance", "Payment Due", "Due Date", "Status"]) &&
      !["paid", "closed", "done"].includes((row.Status ?? "").toLowerCase())
  );
  const totalDebtBalance = activeDebtRows.reduce((sum, row) => sum + number(row["Current Balance"]), 0);
  const debtPressure = activeDebtRows.reduce((sum, row) => sum + number(row["Payment Due"]), 0);
  const debtBlocksCash = activeDebtRows
    .filter((row) => (row["Blocks Cash"] ?? "").toLowerCase() === "yes")
    .reduce((sum, row) => sum + number(row["Payment Due"]), 0);
  const borrowedMoney = activeDebtRows
    .filter((row) => /(advance|borrow|mypay|spotme|loan|payday)/i.test(`${row.Debt ?? ""} ${row.Notes ?? ""}`))
    .reduce((sum, row) => sum + number(row["Current Balance"]) + number(row["Payment Due"]), 0);

  let savingsVault = 0;
  let protectedSavings = 0;
  let flexibleSavings = 0;
  let allowedWithdrawal = 0;
  let emergencyFund = 0;

  savingsSection.rows.forEach((row) => {
    const current = number(row["Current Amount"]);
    const allowed = number(row["Allowed Withdrawal"]);
    const protectedFlag = (row.Protected ?? "").toLowerCase();
    const status = (row.Status ?? "").toLowerCase();

    savingsVault += current;

    if (protectedFlag === "yes") protectedSavings += current;
    else flexibleSavings += current;

    if (["approved", "allowed", "unlocked"].includes(status)) {
      allowedWithdrawal += Math.min(allowed, current);
    }

    if (/emergency/i.test(`${row.Goal ?? ""} ${row["Vault Type"] ?? ""}`)) {
      emergencyFund += current;
    }
  });

  const operatingCash = cashOnHand + weeklyIncome + otherIncome + transactionNet;
  const totalPressure = billsPressure + foodNeeded + gasNeeded + debtPressure;
  const spendableCash = operatingCash - totalPressure;
  const lockedSavings = Math.max(savingsVault - allowedWithdrawal, 0);

  const normalizedInventoryRows = inventorySection.rows.map((row) => applyDerivedRow("inventory", row));
  const buyNextRows = getInventoryBuyNextRows(normalizedInventoryRows);
  const manualBuyNextRows = buyNextSection.rows.filter((row) => {
    const status = (row.Status ?? "").toLowerCase();
    return (row.Item ?? "").trim() && !["done", "closed", "bought", "handled"].includes(status);
  });
  const criticalInventory = normalizedInventoryRows.filter((row) => (row.Alert ?? "").toLowerCase() === "critical").length;
  const buyNextCount = buyNextRows.length + manualBuyNextRows.length;
  const buyNext = [...formatBuyNextItems(buyNextRows), ...formatManualBuyNextItems(manualBuyNextRows)].join(", ");
  const activityCount = activitySection.rows.filter((row) => {
    const status = (row.Status ?? "").toLowerCase();
    return (row.Action ?? "").trim() && !["done", "closed"].includes(status);
  }).length;

  const openMissions = missionsSection.rows.filter(
    (row) =>
      hasAnyValue(row, ["Mission", "Next Action", "Due Date", "Status"]) &&
      !["done", "closed", "complete"].includes((row.Status ?? "").toLowerCase())
  ).length;

  const activeGoalRows = goalsSection.rows.filter((row) => hasAnyValue(row, ["Goal", "Target", "Current", "Progress %", "Next Step"]));
  const avgGoalProgress =
    activeGoalRows.length === 0
      ? 0
      : Math.round(activeGoalRows.reduce((sum, row) => sum + number(row["Progress %"]), 0) / activeGoalRows.length);
  const goalRemaining = activeGoalRows.reduce((sum, row) => {
    const target = number(row.Target);
    const current = number(row.Current);
    return sum + Math.max(target - current, 0);
  }, 0);

  const netPosition = operatingCash + flexibleSavings + allowedWithdrawal - billsPressure - debtPressure - borrowedMoney;
  const metrics = {
    cashOnHand,
    weeklyIncome,
    otherIncome,
    transactionNet,
    budgetPlanned,
    budgetActual,
    budgetRemaining,
    operatingCash,
    billsPressure,
    foodNeeded,
    gasNeeded,
    debtPressure,
    totalDebtBalance,
    debtBlocksCash,
    totalPressure,
    spendableCash,
    savingsVault,
    protectedSavings,
    flexibleSavings,
    allowedWithdrawal,
    lockedSavings,
    unpaidBills: unpaidBills.length,
    overdueBills,
    activeDebt: activeDebtRows.length,
    borrowedMoney,
    netPosition,
    criticalInventory: buyNextCount,
    buyNext,
    activityCount,
    openMissions,
    avgGoalProgress,
  };

  return {
    money: {
      totalCash: operatingCash,
      safeToSpend: spendableCash,
      spendableCash,
      protectedSavings,
      availableSavings: allowedWithdrawal + flexibleSavings,
      borrowedMoney,
      emergencyFund,
    },
    income: {
      weeklyIncome,
      monthlyIncome: weeklyIncome * 4,
      yearlyIncome: weeklyIncome * 52,
    },
    bills: {
      billsRemaining: unpaidBills.length,
      billsPaid: paidBills.length,
      billsDueThisWeek,
      billsOverdue: overdueBills,
      monthlyBills: billsPressure,
    },
    debt: {
      totalDebt: totalDebtBalance,
      remainingDebt: totalDebtBalance,
      minimumPayments: debtPressure,
    },
    inventory: {
      totalInventoryValue: normalizedInventoryRows.reduce((sum, row) => sum + number(row.Cost) * number(row.Qty), 0),
      criticalItems: criticalInventory,
      buyNextItems: formatBuyNextItems(buyNextRows),
    },
    goals: {
      goalProgress: avgGoalProgress,
      goalRemaining,
    },
    health: {
      financialHealthScore: getFinancialHealthScore({
        spendableCash,
        overdueBills,
        criticalInventory,
        debtPressure,
        operatingCash,
        protectedSavings,
      }),
    },
    metrics,
  };
}

function formatBuyNextItems(rows: Array<Record<string, string>>) {
  return rows.map((row) => {
    const cost = number(row.Cost);
    return cost > 0 ? `${row.Item || "Inventory item"} (${money(cost)})` : row.Item || "Inventory item";
  });
}

function formatManualBuyNextItems(rows: Array<Record<string, string>>) {
  return rows.map((row) => {
    const cost = number(row["Estimated Cost"]);
    return cost > 0 ? `${row.Item || "Buy Next item"} (${money(cost)})` : row.Item || "Buy Next item";
  });
}

function getSection(sections: Section[], key: SectionKey) {
  return sections.find((section) => section.key === key) ?? defaultSections.find((section) => section.key === key)!;
}

function isDueWithinDays(date: string | undefined, days: number) {
  if (!date) return false;
  const dueDate = new Date(`${date}T23:59:59`);
  if (Number.isNaN(dueDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  return diff >= 0 && diff <= days;
}

function hasAnyValue(row: Record<string, string>, keys: string[]) {
  return keys.some((key) => (row[key] ?? "").trim() !== "");
}

function getFinancialHealthScore({
  spendableCash,
  overdueBills,
  criticalInventory,
  debtPressure,
  operatingCash,
  protectedSavings,
}: {
  spendableCash: number;
  overdueBills: number;
  criticalInventory: number;
  debtPressure: number;
  operatingCash: number;
  protectedSavings: number;
}) {
  let score = 70;
  if (spendableCash < 0) score -= 25;
  if (overdueBills > 0) score -= Math.min(overdueBills * 10, 25);
  if (criticalInventory > 0) score -= Math.min(criticalInventory * 8, 20);
  if (debtPressure > operatingCash && debtPressure > 0) score -= 15;
  if (protectedSavings > 0) score += 10;
  if (spendableCash > 0) score += 10;
  return Math.max(0, Math.min(100, score));
}
