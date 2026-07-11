import { formatCurrency } from "../calculations/currency";
import type { AppData, DecisionState, FinancialState } from "../types/app";

export function computeDecisionEngine(financialState: FinancialState, data: AppData): DecisionState {
  const spendableSafe = mergedSpendable(financialState);
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
        priority: financialState.billsPressure > 0 ? "High" : "Medium",
      },
      {
        title: "Clear borrowed money",
        detail: `SpotMe/MyPay/advances currently reduce the cash plan by ${formatCurrency(financialState.borrowedMoney)}.`,
        href: "/money",
        priority: financialState.borrowedMoney > 0 ? "High" : "Low",
      },
      {
        title: "Restock Buy Next",
        detail: `${financialState.buyNextCount} inventory row${financialState.buyNextCount === 1 ? "" : "s"} are below minimum.`,
        href: "/inventory",
        priority: financialState.buyNextCount > 0 ? "Medium" : "Low",
      },
    ],
  };
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
