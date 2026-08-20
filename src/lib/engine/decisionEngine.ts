import { formatCurrency, toNumber } from "../calculations/currency";
import type { AppData, DecisionState, FinancialState, SpreadsheetRow } from "../types/app";
import { effectiveBillStatus } from "./billPaymentSync";

export interface RankedBillRow {
  row: SpreadsheetRow;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  dueLabel: string;
  status: string;
  priority: string;
  daysUntilDue: number;
  urgencyScore: number;
  impactScore: number;
  score: number;
  reason: string;
}

export function computeDecisionEngine(financialState: FinancialState, data: AppData, recentlyCompletedMissionIds: string[] = []): DecisionState {
  const spendableSafe = mergedSpendable(financialState);
  const alerts: DecisionState["priorityAlerts"] = [];
  if (financialState.accountDeficit > 0) {
    alerts.push({
      title: "An account is below zero",
      detail: `${formatCurrency(financialState.accountDeficit)} in account deficits is included in the cash totals.`,
      tone: "warning",
    });
  }
  if (financialState.unreconciledCash > 0) {
    alerts.push({
      title: "Unaccounted cash needs reconciliation",
      detail: `${formatCurrency(financialState.unreconciledCash)} funded spending without a confirmed source and is reducing Spendable / Safe.`,
      tone: "warning",
    });
  }
  if (financialState.overdueBills > 0) {
    alerts.push({
      title: "Overdue bill pressure",
      detail: `${financialState.overdueBills} overdue bill${financialState.overdueBills === 1 ? "" : "s"} need attention.`,
      tone: "warning",
    });
  }
  if (financialState.billsDueToday > 0) {
    alerts.push({
      title: "Bill due today",
      detail: `${financialState.billsDueToday} bill${financialState.billsDueToday === 1 ? " is" : "s are"} due today with ${formatCurrency(financialState.billsPressure)} in current bill pressure.`,
      tone: "warning",
    });
  }
  if (financialState.borrowedMoney > 0) {
    alerts.push({
      title: "Borrowed money is reducing spendable cash",
      detail: `${formatCurrency(financialState.borrowedMoney)} is being held back from Spendable / Safe.`,
      tone: "info",
    });
  }
  if (financialState.criticalItems > 0) {
    alerts.push({
      title: "Inventory needs a refill",
      detail: `${financialState.criticalItems} critical item${financialState.criticalItems === 1 ? "" : "s"} are in Buy Next.`,
      tone: "warning",
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      title: "No immediate pressure",
      detail: "Cash, bills, and inventory do not show an urgent exception.",
      tone: "success",
    });
  }

  const recommendedMove = chooseRecommendedMove(financialState);
  const missionStack = buildSystemPriorityStack(financialState, recentlyCompletedMissionIds);

  return {
    todayBriefing: data.paycheckPlanner.locked
      ? `This week is locked. ${formatCurrency(spendableSafe)} is spendable after repayments and bill pressure.`
      : `Plan the week before spending. Spendable / Safe is ${formatCurrency(spendableSafe)} before the next locked paycheck.`,
    recommendedMove,
    todayMission: chooseTodayMission(financialState),
    priorityAlerts: alerts.slice(0, 4),
    missionStack,
  };
}

type SystemMission = DecisionState["missionStack"][number] & { rank: number };

function buildSystemPriorityStack(financialState: FinancialState, recentlyCompletedMissionIds: string[]): DecisionState["missionStack"] {
  const spendableSafe = mergedSpendable(financialState);
  const spendableTarget = Math.max(1, financialState.billsPressure);
  const spendableProgress = financialState.billsPressure > 0
    ? Math.max(0, Math.min(100, (spendableSafe / spendableTarget) * 100))
    : 100;
  const missions: SystemMission[] = [];

  if (financialState.overdueBills > 0) {
    missions.push({
      id: "stabilize-overdue-bills",
      title: "Stabilize overdue bills",
      detail: `${financialState.overdueBills} overdue bill${financialState.overdueBills === 1 ? "" : "s"} need a decision before new spending.`,
      href: "/bills",
      target: `${financialState.overdueBills} overdue · ${formatCurrency(financialState.billsPressure)} pressure`,
      progress: 0,
      completed: false,
      priority: "Critical",
      rank: 100,
    });
  } else if (financialState.billsDueToday > 0) {
    missions.push({
      id: "clear-todays-bills",
      title: "Clear today's bills",
      detail: `${financialState.billsDueToday} bill${financialState.billsDueToday === 1 ? " is" : "s are"} due today.`,
      href: "/bills",
      target: `${formatCurrency(financialState.billsPressure)} bill pressure`,
      progress: 0,
      completed: false,
      priority: "High",
      rank: 95,
    });
  }

  if (financialState.accountDeficit > 0) {
    missions.push({
      id: "cover-account-deficit",
      title: "Cover the account deficit",
      detail: `${formatCurrency(financialState.accountDeficit)} is below zero across tracked accounts.`,
      href: "/money",
      target: `${formatCurrency(financialState.accountDeficit)} to cover`,
      progress: 0,
      completed: false,
      priority: "Critical",
      rank: 90,
    });
  }

  if (financialState.unreconciledCash > 0) {
    missions.push({
      id: "reconcile-unaccounted-cash",
      title: "Reconcile unaccounted cash",
      detail: "Confirm the funding source so every system total uses verified cash.",
      href: "/transactions",
      target: `${formatCurrency(financialState.unreconciledCash)} unresolved`,
      progress: 0,
      completed: false,
      priority: "High",
      rank: 85,
    });
  }

  const borrowedMissionId = "clear-borrowed-money";
  if (financialState.borrowedMoney > 0 || recentlyCompletedMissionIds.includes(borrowedMissionId)) {
    const completed = financialState.borrowedMoney <= 0;
    missions.push({
      id: borrowedMissionId,
      title: "Clear borrowed money",
      detail: completed
        ? "SpotMe/MyPay and recorded advances have been repaid."
        : `SpotMe/MyPay/advances currently reduce the cash plan by ${formatCurrency(financialState.borrowedMoney)}.`,
      href: "/money",
      target: completed ? "Cleared" : `${formatCurrency(financialState.borrowedMoney)} left`,
      progress: completed ? 100 : 0,
      completed,
      priority: completed ? "Low" : "High",
      rank: completed ? 5 : 80,
    });
  }

  const billReserveActive = financialState.billsPressure > spendableSafe * 0.5 && financialState.billsPressure > 0;
  if (!financialState.overdueBills && !financialState.billsDueToday && billReserveActive) {
    missions.push({
      id: "protect-bill-cash",
      title: "Protect cash for bills",
      detail: `Keep bill money reserved until ${formatCurrency(financialState.billsPressure)} in current pressure clears.`,
      href: "/bills",
      target: `${formatCurrency(spendableSafe)} safe / ${formatCurrency(spendableTarget)} pressure`,
      progress: spendableProgress,
      completed: false,
      priority: "High",
      rank: 75,
    });
  }

  if (financialState.buyNextCount > 0) {
    missions.push({
      id: "restock-buy-next",
      title: financialState.criticalItems > 0 ? "Restock critical inventory" : "Restock low inventory",
      detail: `${financialState.buyNextCount} inventory row${financialState.buyNextCount === 1 ? " is" : "s are"} below minimum.`,
      href: "/inventory",
      target: `${financialState.buyNextCount} remaining · ${formatCurrency(financialState.estimatedRefillCost)} estimated`,
      progress: 0,
      completed: false,
      priority: "Medium",
      rank: financialState.criticalItems > 0 ? 60 : 55,
    });
  }

  if (financialState.totalDebt > 0 && financialState.minimumPayments > 0) {
    missions.push({
      id: "maintain-debt-progress",
      title: "Keep debt progress moving",
      detail: `${financialState.nextPayoff} is the next payoff target from the current debt plan.`,
      href: "/debt",
      target: `${formatCurrency(financialState.minimumPayments)} minimum payments`,
      progress: financialState.debtFreePercent,
      completed: false,
      priority: "Medium",
      rank: 45,
    });
  }

  if (financialState.goalCompletionPercent < 100 && financialState.closestGoal !== "None") {
    missions.push({
      id: "advance-closest-goal",
      title: "Advance the closest goal",
      detail: `${financialState.closestGoal} is the nearest goal signal from the current data.`,
      href: "/goals",
      target: `${Math.round(financialState.goalCompletionPercent)}% overall completion`,
      progress: financialState.goalCompletionPercent,
      completed: false,
      priority: "Low",
      rank: 25,
    });
  }

  if (missions.length === 0) {
    missions.push({
      id: "hold-week-steady",
      title: "Hold the week steady",
      detail: "No urgent exception is outranking the current cash plan.",
      href: "/money",
      target: `${formatCurrency(spendableSafe)} Spendable / Safe`,
      progress: 100,
      completed: true,
      priority: "Low",
      rank: 10,
    });
  }

  return missions
    .sort((a, b) => Number(a.completed) - Number(b.completed) || b.rank - a.rank)
    .slice(0, 6)
    .map(({ rank, ...mission }) => {
      void rank;
      return mission;
    });
}

export function rankBillRows(rows: SpreadsheetRow[], today = new Date()): RankedBillRow[] {
  return rows
    .filter((row) => {
      const name = row.cells.name?.trim();
      const status = effectiveBillStatus(row, today);
      return Boolean(name) && status !== "paid" && status !== "cancelled";
    })
    .map((row) => {
      const status = effectiveBillStatus(row, today);
      const priority = normalizePriority(row.cells.priority);
      const amount = toNumber(row.cells.amount);
      const daysUntilDue = daysBetween(row.cells.dueDate, today);
      const urgencyScore = billUrgencyScore(daysUntilDue, status);
      const impactScore = billImpactScore(priority, amount);
      const score = Math.min(100, Math.round((urgencyScore * 0.58) + (impactScore * 0.32) + Math.min(amount / 20, 10)));
      const dueLabel = describeBillDueDate(daysUntilDue);

      return {
        row,
        name: row.cells.name,
        category: row.cells.category || "Bills",
        amount,
        dueDate: row.cells.dueDate || "",
        dueLabel,
        status,
        priority,
        daysUntilDue,
        urgencyScore,
        impactScore,
        score,
        reason: buildBillReason(row.cells.name, dueLabel, priority, amount, status),
      };
    })
    .sort((a, b) => b.score - a.score || a.daysUntilDue - b.daysUntilDue || b.amount - a.amount);
}

function chooseRecommendedMove(financialState: FinancialState): string {
  const spendableSafe = mergedSpendable(financialState);
  if (financialState.overdueBills > 0) return "Pay overdue bills before new spending.";
  if (financialState.billsDueToday > 0) return "Pay or schedule today’s bills before new spending.";
  if (financialState.accountDeficit > 0) return "Cover the negative account balance before new spending.";
  if (financialState.unreconciledCash > 0) return "Reconcile the unaccounted cash source before new spending.";
  if (financialState.borrowedMoney > 0) return "Repay SpotMe/MyPay first, then recalculate Spendable / Safe.";
  if (financialState.billsPressure > spendableSafe * 0.5) return "Hold cash for bills due this week.";
  if (financialState.criticalItems > 0) return "Refill critical Buy Next items with the lowest-cost run.";
  return "Keep the week steady and avoid adding new fixed costs.";
}

function chooseTodayMission(financialState: FinancialState): DecisionState["todayMission"] {
  const spendableSafe = mergedSpendable(financialState);
  if (financialState.overdueBills > 0) {
    return {
      title: "Stabilize overdue bills",
      detail: `${financialState.overdueBills} overdue bill${financialState.overdueBills === 1 ? "" : "s"} need a decision before new spending.`,
      href: "/bills",
      priority: "Critical",
    };
  }

  if (financialState.billsDueToday > 0) {
    return {
      title: "Clear today's bills",
      detail: `${financialState.billsDueToday} bill${financialState.billsDueToday === 1 ? "" : "s"} due today with ${formatCurrency(financialState.billsPressure)} in bill pressure.`,
      href: "/bills",
      priority: "High",
    };
  }

  if (financialState.accountDeficit > 0) {
    return {
      title: "Cover the account deficit",
      detail: `${formatCurrency(financialState.accountDeficit)} is below zero across your tracked accounts.`,
      href: "/money",
      priority: "Critical",
    };
  }

  if (financialState.unreconciledCash > 0) {
    return {
      title: "Reconcile unaccounted cash",
      detail: `Confirm where ${formatCurrency(financialState.unreconciledCash)} of shortfall spending came from.`,
      href: "/transactions",
      priority: "High",
    };
  }

  if (financialState.borrowedMoney > 0) {
    return {
      title: "Reduce borrowed cash drag",
      detail: `${formatCurrency(financialState.borrowedMoney)} is lowering Spendable / Safe.`,
      href: "/money",
      priority: "High",
    };
  }

  if (financialState.billsPressure > spendableSafe * 0.5 && financialState.billsPressure > 0) {
    return {
      title: "Protect cash for bills",
      detail: `${formatCurrency(financialState.billsPressure)} is reserved pressure against ${formatCurrency(spendableSafe)} Spendable / Safe.`,
      href: "/bills",
      priority: "High",
    };
  }

  if (financialState.criticalItems > 0) {
    return {
      title: "Restock critical inventory",
      detail: `${financialState.criticalItems} critical item${financialState.criticalItems === 1 ? "" : "s"} should be handled from Buy Next.`,
      href: "/inventory",
      priority: "Medium",
    };
  }

  if (financialState.totalDebt > 0 && financialState.minimumPayments > 0) {
    return {
      title: "Keep debt progress moving",
      detail: `${formatCurrency(financialState.minimumPayments)} in minimum payments is the next debt checkpoint.`,
      href: "/debt",
      priority: "Medium",
    };
  }

  if (financialState.goalCompletionPercent < 100 && financialState.closestGoal !== "None") {
    return {
      title: "Advance the closest goal",
      detail: `${financialState.closestGoal} is the nearest goal signal from the current data.`,
      href: "/goals",
      priority: "Low",
    };
  }

  return {
    title: "Hold the week steady",
    detail: `Spendable / Safe is ${formatCurrency(spendableSafe)}. Avoid adding fixed costs today.`,
    href: "/money",
    priority: "Low",
  };
}

function mergedSpendable(financialState: FinancialState): number {
  return Math.min(financialState.spendableCash, financialState.safeToSpend);
}

function normalizePriority(priority: string | undefined): string {
  const value = String(priority || "").trim().toLowerCase();
  if (["critical", "high", "medium", "low"].includes(value)) return value;
  return "medium";
}

function daysBetween(dateText: string | undefined, today: Date): number {
  if (!dateText) return 999;
  const due = new Date(`${dateText}T12:00:00`);
  if (Number.isNaN(due.getTime())) return 999;
  const current = new Date(today);
  current.setHours(12, 0, 0, 0);
  return Math.ceil((due.getTime() - current.getTime()) / 86_400_000);
}

function billUrgencyScore(daysUntilDue: number, status: string): number {
  if (status === "overdue" || status === "late" || daysUntilDue < 0) return 100 + Math.min(Math.abs(daysUntilDue) * 8, 40);
  if (daysUntilDue === 0) return 95;
  if (daysUntilDue === 1) return 88;
  if (daysUntilDue <= 3) return 78;
  if (daysUntilDue <= 7) return 62;
  if (daysUntilDue <= 14) return 42;
  return 20;
}

function billImpactScore(priority: string, amount: number): number {
  const base = {
    critical: 92,
    high: 74,
    medium: 50,
    low: 24,
  }[priority] || 50;
  return base + Math.min(amount / 25, 24);
}

function describeBillDueDate(daysUntilDue: number): string {
  if (daysUntilDue === 999) return "No due date";
  if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue`;
  if (daysUntilDue === 0) return "Due today";
  if (daysUntilDue === 1) return "Due tomorrow";
  return `Due in ${daysUntilDue} days`;
}

function buildBillReason(name: string, dueLabel: string, priority: string, amount: number, status: string): string {
  if (status === "overdue" || status === "late") {
    return `${name} is ${dueLabel.toLowerCase()} with ${priority} priority at ${formatCurrency(amount)}.`;
  }
  return `${name} is ${dueLabel.toLowerCase()} with ${priority} priority at ${formatCurrency(amount)}.`;
}
