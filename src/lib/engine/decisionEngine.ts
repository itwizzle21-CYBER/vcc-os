import { formatCurrency } from "../calculations/currency";
import type { AppData, DecisionState, FinancialState } from "../types/app";

export function computeDecisionEngine(financialState: FinancialState, data: AppData): DecisionState {
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
      title: "Borrowed money is reducing safe cash",
      detail: `${formatCurrency(financialState.borrowedMoney)} is being held back from Safe To Spend.`,
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
      ? `This week is locked. ${formatCurrency(financialState.safeToSpend)} is safe after repayments and bill pressure.`
      : `Plan the week before spending. Safe To Spend is ${formatCurrency(financialState.safeToSpend)} before the next locked paycheck.`,
    recommendedMove,
    priorityAlerts: alerts.slice(0, 4),
    missionStack: [
      {
        title: "Protect Safe To Spend",
        detail: `Keep spendable cash above ${formatCurrency(financialState.billsPressure)} until bills clear.`,
        priority: financialState.billsPressure > 0 ? "High" : "Medium",
      },
      {
        title: "Clear borrowed money",
        detail: `SpotMe/MyPay/advances currently reduce the cash plan by ${formatCurrency(financialState.borrowedMoney)}.`,
        priority: financialState.borrowedMoney > 0 ? "High" : "Low",
      },
      {
        title: "Restock Buy Next",
        detail: `${financialState.buyNextCount} inventory row${financialState.buyNextCount === 1 ? "" : "s"} are below minimum.`,
        priority: financialState.buyNextCount > 0 ? "Medium" : "Low",
      },
    ],
  };
}

function chooseRecommendedMove(financialState: FinancialState): string {
  if (financialState.overdueBills > 0) return "Pay overdue bills before new spending.";
  if (financialState.borrowedMoney > 0) return "Repay SpotMe/MyPay first, then recalculate Safe To Spend.";
  if (financialState.billsPressure > financialState.spendableCash * 0.5) return "Hold cash for bills due this week.";
  if (financialState.criticalItems > 0) return "Refill critical Buy Next items with the lowest-cost run.";
  return "Keep the week steady and avoid adding new fixed costs.";
}
