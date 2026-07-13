import { formatCurrency, toNumber } from "../calculations/currency";
import type { AppData, DecisionState, FinancialState, SpreadsheetRow } from "../types/app";

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

export function computeDecisionEngine(financialState: FinancialState, data: AppData): DecisionState {
  const spendableSafe = mergedSpendable(financialState);
  const spendableTarget = Math.max(1, financialState.billsPressure);
  const spendableProgress = financialState.billsPressure > 0
    ? Math.min(100, (spendableSafe / spendableTarget) * 100)
    : 100;
  const borrowedProgress = financialState.borrowedMoney > 0 ? 0 : 100;
  const inventoryProgress = financialState.buyNextCount > 0 ? 0 : 100;
  const alerts: DecisionState["priorityAlerts"] = [];
  if (financialState.overdueBills > 0) {
    alerts.push({
      title: "Overdue bill pressure",
      detail: `${financialState.overdueBills} overdue bill${financialState.overdueBills === 1 ? "" : "s"} need attention.`,
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

  return {
    todayBriefing: data.paycheckPlanner.locked
      ? `This week is locked. ${formatCurrency(spendableSafe)} is spendable after repayments and bill pressure.`
      : `Plan the week before spending. Spendable / Safe is ${formatCurrency(spendableSafe)} before the next locked paycheck.`,
    recommendedMove,
    todayMission: chooseTodayMission(financialState),
    priorityAlerts: alerts.slice(0, 4),
    missionStack: [
      {
        title: "Protect Spendable / Safe",
        detail: `Keep spendable cash above ${formatCurrency(financialState.billsPressure)} until bills clear.`,
        href: "/money",
        target: financialState.billsPressure > 0 ? `${formatCurrency(spendableSafe)} / ${formatCurrency(spendableTarget)}` : "No bill pressure",
        progress: spendableProgress,
        completed: spendableProgress >= 100,
        priority: financialState.billsPressure > 0 ? "High" : "Medium",
      },
      {
        title: "Clear borrowed money",
        detail: `SpotMe/MyPay/advances currently reduce the cash plan by ${formatCurrency(financialState.borrowedMoney)}.`,
        href: "/money",
        target: financialState.borrowedMoney > 0 ? `${formatCurrency(financialState.borrowedMoney)} left` : "Cleared",
        progress: borrowedProgress,
        completed: financialState.borrowedMoney <= 0,
        priority: financialState.borrowedMoney > 0 ? "High" : "Low",
      },
      {
        title: "Restock Buy Next",
        detail: `${financialState.buyNextCount} inventory row${financialState.buyNextCount === 1 ? "" : "s"} are below minimum.`,
        href: "/inventory",
        target: financialState.buyNextCount > 0 ? `${financialState.buyNextCount} remaining` : "All stocked",
        progress: inventoryProgress,
        completed: financialState.buyNextCount <= 0,
        priority: financialState.buyNextCount > 0 ? "Medium" : "Low",
      },
    ],
  };
}

export function rankBillRows(rows: SpreadsheetRow[], today = new Date()): RankedBillRow[] {
  return rows
    .filter((row) => {
      const name = row.cells.name?.trim();
      const status = normalizeStatus(row.cells.status);
      return Boolean(name) && status !== "paid" && status !== "cancelled";
    })
    .map((row) => {
      const status = normalizeStatus(row.cells.status);
      const priority = normalizePriority(row.cells.priority);
      const amount = toNumber(row.cells.amount);
      const daysUntilDue = daysBetween(row.cells.dueDate, today);
      const effectiveStatus = daysUntilDue < 0 && status === "upcoming" ? "overdue" : status;
      const urgencyScore = billUrgencyScore(daysUntilDue, effectiveStatus);
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
        status: effectiveStatus,
        priority,
        daysUntilDue,
        urgencyScore,
        impactScore,
        score,
        reason: buildBillReason(row.cells.name, dueLabel, priority, amount, effectiveStatus),
      };
    })
    .sort((a, b) => b.score - a.score || a.daysUntilDue - b.daysUntilDue || b.amount - a.amount);
}

function chooseRecommendedMove(financialState: FinancialState): string {
  const spendableSafe = mergedSpendable(financialState);
  if (financialState.overdueBills > 0) return "Pay overdue bills before new spending.";
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

function normalizeStatus(status: string | undefined): string {
  const value = String(status || "").trim().toLowerCase();
  return value || "upcoming";
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
