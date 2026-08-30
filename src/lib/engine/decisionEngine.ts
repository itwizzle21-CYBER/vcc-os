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
    todayBriefing: data.paycheckPlanner.depositApplied
      ? financialState.spendableSafeAvailable
        ? `Your latest paycheck is recorded. ${formatCurrency(spendableSafe)} is spendable after repayments and bill pressure.`
        : "Your latest paycheck is recorded, but Spendable / Safe needs a confirmed cash-account balance."
      : financialState.spendableSafeAvailable
        ? `Plan the week before spending. Spendable / Safe is ${formatCurrency(spendableSafe)} before the next paycheck.`
        : "Add a confirmed cash-account balance before VCC presents a Spendable / Safe amount.",
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

  if (!financialState.spendableSafeAvailable) {
    missions.push({
      id: "complete-financial-setup",
      title: "Complete your financial setup",
      detail: `${financialState.spendableSafeMissingInputs.join(" and ")} is required before VCC can verify Spendable / Safe.`,
      href: "/money",
      target: `${financialState.spendableSafeMissingInputs.length} required input${financialState.spendableSafeMissingInputs.length === 1 ? "" : "s"} missing`,
      progress: 0,
      completed: false,
      priority: "High",
      rank: 97,
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

  const billReserveActive = financialState.spendableSafeAvailable
    && financialState.billsPressure > spendableSafe * 0.5
    && financialState.billsPressure > 0;
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
      target: financialState.spendableSafeAvailable ? `${formatCurrency(spendableSafe)} Spendable / Safe` : "Spendable / Safe unavailable",
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
  if (!financialState.spendableSafeAvailable) return "Add a confirmed cash account and balance before relying on Spendable / Safe.";
  if (financialState.unreconciledCash > 0) return "Reconcile the unaccounted cash source before new spending.";
  if (financialState.borrowedMoney > 0) return "Repay SpotMe/MyPay first, then recalculate Spendable / Safe.";
  if (financialState.billsDueThisWeek > 0) return "Review bills due within seven days and reserve the required cash.";
  if (financialState.billsPressure > spendableSafe * 0.5) return "Hold cash for bills due this week.";
  if (financialState.criticalItems > 0) return "Refill critical Buy Next items with the lowest-cost run.";
  return "Keep the week steady and avoid adding new fixed costs.";
}

function chooseTodayMission(financialState: FinancialState): DecisionState["todayMission"] {
  const spendableSafe = mergedSpendable(financialState);
  if (financialState.overdueBills > 0) {
    return createTodayMission(financialState, {
      id: "stabilize-overdue-bills",
      title: "Stabilize overdue bills",
      detail: `${financialState.overdueBills} overdue bill${financialState.overdueBills === 1 ? "" : "s"} need a decision before new spending.`,
      href: "/bills",
      workflowHref: "/bills?mission=overdue",
      priority: "Critical",
      state: "critical",
      context: "Your highest-priority confirmed obligation right now.",
      metrics: [
        { value: String(financialState.overdueBills), label: `Bill${financialState.overdueBills === 1 ? "" : "s"} overdue`, detail: "Need a decision" },
        { value: formatCurrency(financialState.overdueAmount), label: "Total overdue", detail: "Across open bills" },
      ],
      steps: ["Review each overdue bill", "Confirm whether it is still outstanding", "Pay, defer, correct, or remove it", "Let VCC recalculate the next mission"],
      rationale: `${financialState.overdueBills} confirmed bill${financialState.overdueBills === 1 ? " is" : "s are"} overdue. Resolving ${financialState.overdueBills === 1 ? "it" : "them"} outranks discretionary spending because ${financialState.overdueBills === 1 ? "it is" : "they are"} already past due.`,
      ctaLabel: "Start Mission",
    });
  }

  if (financialState.accountDeficit > 0) {
    return createTodayMission(financialState, {
      id: "cover-account-deficit",
      title: "Cover the account deficit",
      detail: `${formatCurrency(financialState.accountDeficit)} is below zero across your tracked accounts.`,
      href: "/money",
      workflowHref: "/money",
      priority: "Critical",
      state: "critical",
      context: "A confirmed negative balance needs immediate attention.",
      metrics: [{ value: formatCurrency(financialState.accountDeficit), label: "Account deficit", detail: "Across tracked accounts" }],
      steps: ["Open Money Snapshot", "Confirm the negative balance", "Choose the account to stabilize", "Update the balance after action"],
      rationale: `Tracked account balances are below zero by ${formatCurrency(financialState.accountDeficit)}. Stabilizing them comes before optional spending because the deficit is already affecting available cash.`,
      ctaLabel: "Review Accounts",
    });
  }

  if (!financialState.spendableSafeAvailable) {
    const missingCount = financialState.spendableSafeMissingInputs.length;
    return createTodayMission(financialState, {
      id: "complete-financial-setup",
      title: "Complete your financial setup",
      detail: "VCC needs confirmed balance information before it can calculate a trustworthy Spendable / Safe amount.",
      href: "/money",
      workflowHref: "/money",
      priority: "High",
      state: "info",
      context: "One step to better financial clarity.",
      metrics: [{ value: String(missingCount), label: `Required input${missingCount === 1 ? "" : "s"} missing`, detail: "Needed for a verified result" }],
      steps: ["Add or confirm a financial account", "Enter its current balance", "Review income information", "Return for a recalculated mission"],
      rationale: `${financialState.spendableSafeMissingInputs.join(" and ")} is missing. VCC will not treat unknown financial information as $0 or present an unsupported spending recommendation.`,
      ctaLabel: "Complete Setup",
    });
  }

  if (financialState.unreconciledCash > 0) {
    return createTodayMission(financialState, {
      id: "reconcile-unaccounted-cash",
      title: "Reconcile unaccounted cash",
      detail: `Confirm where ${formatCurrency(financialState.unreconciledCash)} of shortfall spending came from.`,
      href: "/transactions",
      workflowHref: "/transactions",
      priority: "High",
      state: "info",
      context: "A missing funding source is blocking full confidence.",
      metrics: [{ value: formatCurrency(financialState.unreconciledCash), label: "Unreconciled cash", detail: "Funding source unknown" }],
      steps: ["Open the affected transactions", "Confirm the funding source", "Correct the account link", "Review the recalculated cash position"],
      rationale: `${formatCurrency(financialState.unreconciledCash)} of recorded spending has no confirmed funding source. Resolving that information comes before optimization because it affects the reliability of the cash plan.`,
      ctaLabel: "Review Transactions",
    });
  }

  if (financialState.billsDueThisWeek > 0) {
    return createTodayMission(financialState, {
      id: "prepare-upcoming-bills",
      title: financialState.billsDueToday > 0 ? "Clear today's bills" : "Prepare for bills due this week",
      detail: `${financialState.billsDueThisWeek} bill${financialState.billsDueThisWeek === 1 ? " is" : "s are"} due within seven days.`,
      href: "/bills",
      workflowHref: "/bills?mission=upcoming",
      priority: "High",
      state: "warning",
      context: "Important obligations are approaching.",
      metrics: [
        { value: String(financialState.billsDueThisWeek), label: "Bills due", detail: "Within 7 days" },
        { value: formatCurrency(financialState.billsDueThisWeekAmount), label: "Total due", detail: "Within 7 days" },
      ],
      steps: ["Review upcoming bills", "Verify available funds", "Reserve the required money", "Protect remaining operating cash"],
      rationale: `${financialState.billsDueThisWeek} required bill${financialState.billsDueThisWeek === 1 ? " is" : "s are"} approaching. Planning for ${formatCurrency(financialState.billsDueThisWeekAmount)} now helps prevent ${financialState.billsDueThisWeek === 1 ? "it" : "them"} from becoming overdue.`,
      ctaLabel: "Review Upcoming Bills",
    });
  }

  if (financialState.borrowedMoney > 0) {
    return createTodayMission(financialState, {
      id: "clear-borrowed-money",
      title: "Reduce borrowed cash drag",
      detail: `${formatCurrency(financialState.borrowedMoney)} is lowering Spendable / Safe.`,
      href: "/money",
      workflowHref: "/money",
      priority: "High",
      state: "warning",
      context: "Borrowed cash is constraining the current plan.",
      metrics: [{ value: formatCurrency(financialState.borrowedMoney), label: "Borrowed money", detail: "Reducing safe cash" }],
      steps: ["Review borrowed balances", "Confirm required repayments", "Protect essential cash", "Update balances after repayment"],
      rationale: `${formatCurrency(financialState.borrowedMoney)} of external borrowing is reducing the verified Spendable / Safe amount. Clearing it improves the reliability and flexibility of the cash plan.`,
      ctaLabel: "Review Money Snapshot",
    });
  }

  if (financialState.billsPressure > spendableSafe * 0.5 && financialState.billsPressure > 0) {
    return createTodayMission(financialState, {
      id: "protect-bill-cash",
      title: "Protect cash for bills",
      detail: `${formatCurrency(financialState.billsPressure)} is reserved pressure against ${formatCurrency(spendableSafe)} Spendable / Safe.`,
      href: "/bills",
      workflowHref: "/bills?mission=upcoming",
      priority: "High",
      state: "warning",
      context: "Near-term obligations are using a large share of safe cash.",
      metrics: [
        { value: formatCurrency(financialState.billsPressure), label: "Bill pressure", detail: "Due within 7 days" },
        { value: formatCurrency(spendableSafe), label: "Spendable / Safe", detail: "After current pressure" },
      ],
      steps: ["Review required bills", "Reserve their cash", "Delay optional spending", "Recheck the plan after payment"],
      rationale: `Near-term bill pressure is large relative to the verified ${formatCurrency(spendableSafe)} Spendable / Safe amount, so protecting required cash comes before optional spending.`,
      ctaLabel: "Protect Bill Cash",
    });
  }

  if (financialState.criticalItems > 0) {
    return createTodayMission(financialState, {
      id: "restock-critical-inventory",
      title: "Restock critical inventory",
      detail: `${financialState.criticalItems} critical item${financialState.criticalItems === 1 ? "" : "s"} should be handled from Buy Next.`,
      href: "/inventory",
      workflowHref: "/inventory",
      priority: "Medium",
      state: "warning",
      context: "Essential inventory needs attention soon.",
      metrics: [{ value: String(financialState.criticalItems), label: "Critical items", detail: `${formatCurrency(financialState.estimatedRefillCost)} estimated refill` }],
      steps: ["Open Buy Next", "Confirm essential items", "Choose the lowest-cost run", "Update quantities after purchase"],
      rationale: `${financialState.criticalItems} critical inventory item${financialState.criticalItems === 1 ? " is" : "s are"} below the minimum. Replenishing essentials is the highest-value next action after current financial obligations are stable.`,
      ctaLabel: "Open Buy Next",
    });
  }

  if (financialState.totalDebt > 0 && financialState.minimumPayments > 0) {
    return createTodayMission(financialState, {
      id: "maintain-debt-progress",
      title: "Keep debt progress moving",
      detail: `${formatCurrency(financialState.minimumPayments)} in minimum payments is the next debt checkpoint.`,
      href: "/debt",
      workflowHref: "/debt",
      priority: "Medium",
      state: "good",
      context: "Your urgent obligations are under control.",
      metrics: [{ value: formatCurrency(financialState.minimumPayments), label: "Minimum payments", detail: `${financialState.nextPayoff} is next` }],
      steps: ["Review the next payoff target", "Confirm minimum payments", "Choose an affordable extra amount", "Record the next payment"],
      rationale: `No more urgent exception is outranking the debt plan. Maintaining the ${formatCurrency(financialState.minimumPayments)} payment checkpoint protects current progress.`,
      ctaLabel: "Review Debt Plan",
    });
  }

  if (financialState.goalsComplete > 0 && financialState.goalCompletionPercent >= 100) {
    return createTodayMission(financialState, {
      id: "acknowledge-goal-milestone",
      title: "Savings milestone reached",
      detail: `${financialState.goalsComplete} tracked goal${financialState.goalsComplete === 1 ? " has" : "s have"} reached its target.`,
      href: "/goals",
      workflowHref: "/goals",
      priority: "Low",
      state: "success",
      context: "A meaningful financial milestone is complete.",
      metrics: [{ value: String(financialState.goalsComplete), label: `Goal${financialState.goalsComplete === 1 ? "" : "s"} reached`, detail: "Target fully funded" }],
      steps: ["Review the completed goal", "Protect the funded amount", "Choose the next legitimate objective", "Set the next target when ready"],
      rationale: "All currently tracked goal targets are funded. Acknowledging the milestone and choosing the next objective is now the highest-value action.",
      ctaLabel: "Plan the Next Goal",
    });
  }

  if (financialState.goalCompletionPercent < 100 && financialState.closestGoal !== "None") {
    return createTodayMission(financialState, {
      id: "advance-closest-goal",
      title: "Advance the closest goal",
      detail: `${financialState.closestGoal} is the nearest goal signal from the current data.`,
      href: "/goals",
      workflowHref: "/goals",
      priority: "Low",
      state: "good",
      context: "Your short-term position is stable enough to build forward.",
      metrics: [{ value: `${Math.round(financialState.goalCompletionPercent)}%`, label: "Goal progress", detail: `${financialState.closestGoal} is closest` }],
      steps: ["Review the closest goal", "Confirm the target", "Choose a safe contribution", "Record the transfer"],
      rationale: `No urgent exception is active. ${financialState.closestGoal} is currently the closest supported goal, so a measured contribution is the strongest next move.`,
      ctaLabel: "Advance Goal",
    });
  }

  return createTodayMission(financialState, {
    id: "hold-week-steady",
    title: "Stay in control",
    detail: `Spendable / Safe is ${formatCurrency(spendableSafe)} with no urgent exception detected.`,
    href: "/money",
    workflowHref: "/money",
    priority: "Low",
    state: "good",
    context: "Your current position is on track.",
    metrics: [{ value: formatCurrency(spendableSafe), label: "Spendable / Safe", detail: "Verified current position" }],
    steps: ["Keep required cash protected", "Review the next upcoming obligation", "Avoid adding unnecessary fixed costs", "Continue the current plan"],
    rationale: "Canonical balances and current obligations show no urgent or near-term exception. Protecting the current position is the most useful next action.",
    ctaLabel: "Review Money Snapshot",
  });
}

function createTodayMission(
  financialState: FinancialState,
  mission: Omit<DecisionState["todayMission"], "spendableSafe">,
): DecisionState["todayMission"] {
  return { ...mission, spendableSafe: spendableSafeStatus(financialState) };
}

function spendableSafeStatus(financialState: FinancialState): DecisionState["todayMission"]["spendableSafe"] {
  if (!financialState.spendableSafeAvailable) {
    return {
      available: false,
      detail: `${financialState.spendableSafeMissingInputs.join(" and ")} is required before VCC can verify this amount.`,
      href: "/money",
      actionLabel: "Go to Money Snapshot",
    };
  }

  return {
    available: true,
    value: mergedSpendable(financialState),
    detail: financialState.billsPressure > 0
      ? `After ${formatCurrency(financialState.billsPressure)} in near-term bill pressure.`
      : "Calculated from confirmed account balances and current obligations.",
    href: "/money",
    actionLabel: "Review Money Snapshot",
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
