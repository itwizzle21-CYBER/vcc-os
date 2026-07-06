export type BillStatus = "pending" | "paid" | "overdue";
export type BillImpact = "critical" | "high" | "medium" | "low";
export type MissionPriority = "high" | "medium" | "low";
export type AlertType = "warning" | "info" | "success";

export interface DecisionBill {
  id: number;
  name: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  impact: BillImpact;
  category?: string;
}

export interface RankedBill extends DecisionBill {
  daysUntilDue: number;
  urgencyScore: number;
  impactScore: number;
  score: number;
  reason: string;
}

export interface TodayMission {
  id: number;
  title: string;
  dueDate: string;
  priority: MissionPriority;
  category: string;
  completed: boolean;
  amount: string;
  reason: string;
  score: number;
  recommendedMove: string;
  recommendedExplanation: string;
  supportingTasks: Array<{
    id: number;
    title: string;
    dueDate: string;
    priority: MissionPriority;
    category: string;
    completed: boolean;
  }>;
}

export interface MoneySnapshotInput {
  cash: number;
  savings: number;
  investments: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accounts?: Array<{ label?: string; name?: string; balance: number }>;
}

export interface MoneySnapshotOutput {
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  monthlyNet: string;
  cashAfterDueBills: string;
  dueBillsTotal: string;
  savingsCoverage: string;
  breakdown: Array<{ label: string; value: string; percentage: number }>;
  liabilityBreakdown: Array<{ label: string; value: string; percentage: number }>;
  accounts: Array<{ label: string; value: string; percentage: number }>;
}

export interface PriorityAlert {
  id: number;
  type: AlertType;
  title: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
  score: number;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getDaysUntilDue(dueDate: string, today: Date): number {
  const due = startOfDay(new Date(dueDate));
  const current = startOfDay(today);
  return Math.ceil((due.getTime() - current.getTime()) / 86_400_000);
}

function getUrgencyScore(daysUntilDue: number, status: BillStatus): number {
  if (status === "overdue" || daysUntilDue < 0) return 100 + Math.min(Math.abs(daysUntilDue) * 8, 40);
  if (daysUntilDue === 0) return 95;
  if (daysUntilDue <= 2) return 82;
  if (daysUntilDue <= 5) return 68;
  if (daysUntilDue <= 10) return 48;
  return 20;
}

function getImpactScore(impact: BillImpact, amount: number): number {
  const base = {
    critical: 90,
    high: 72,
    medium: 48,
    low: 24,
  }[impact];
  return base + Math.min(amount / 25, 24);
}

function describeDueDate(daysUntilDue: number): string {
  if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue`;
  if (daysUntilDue === 0) return "Today";
  if (daysUntilDue === 1) return "Tomorrow";
  return `In ${daysUntilDue} days`;
}

function priorityFromScore(score: number): MissionPriority {
  if (score >= 82) return "high";
  if (score >= 56) return "medium";
  return "low";
}

function buildReason(bill: DecisionBill, daysUntilDue: number): string {
  const dueText = describeDueDate(daysUntilDue).toLowerCase();
  const amount = formatCurrency(bill.amount);
  if (bill.status === "overdue" || daysUntilDue < 0) {
    return `${bill.name} is ${dueText} and carries ${bill.impact} impact at ${amount}.`;
  }
  return `${bill.name} is due ${dueText} with ${bill.impact} impact at ${amount}.`;
}

export function rankBills(bills: DecisionBill[], today = new Date()): RankedBill[] {
  return bills
    .filter((bill) => bill.status !== "paid")
    .map((bill) => {
      const daysUntilDue = getDaysUntilDue(bill.dueDate, today);
      const urgencyScore = getUrgencyScore(daysUntilDue, bill.status);
      const impactScore = getImpactScore(bill.impact, bill.amount);
      const score = Math.round(urgencyScore * 0.58 + impactScore * 0.32 + Math.min(bill.amount / 20, 10));

      return {
        ...bill,
        daysUntilDue,
        urgencyScore,
        impactScore,
        score,
        reason: buildReason(bill, daysUntilDue),
      };
    })
    .sort((a, b) => b.score - a.score || a.daysUntilDue - b.daysUntilDue || b.amount - a.amount);
}

export function createTodayMission(bills: DecisionBill[], today = new Date()): TodayMission {
  const rankedBills = rankBills(bills, today);
  const primary = rankedBills[0];

  if (!primary) {
    return {
      id: 0,
      title: "Hold cash position and review upcoming obligations",
      dueDate: "Today",
      priority: "low",
      category: "Planning",
      completed: false,
      amount: "$0.00",
      reason: "No unpaid bills need immediate action today.",
      score: 0,
      recommendedMove: "Keep cash available and review the next billing cycle.",
      recommendedExplanation: "There is no urgent bill pressure, so the best move is staying liquid and avoiding unnecessary spending.",
      supportingTasks: [],
    };
  }

  const supportingTasks = rankedBills.slice(1, 4).map((bill) => ({
    id: bill.id,
    title: `Prepare ${bill.name}`,
    dueDate: describeDueDate(bill.daysUntilDue),
    priority: priorityFromScore(bill.score),
    category: bill.category || "Bills",
    completed: false,
  }));

  return {
    id: primary.id,
    title: `Pay ${primary.name}`,
    dueDate: describeDueDate(primary.daysUntilDue),
    priority: priorityFromScore(primary.score),
    category: primary.category || "Bills",
    completed: false,
    amount: formatCurrency(primary.amount),
    reason: primary.reason,
    score: primary.score,
    recommendedMove: `Pay ${primary.name} first`,
    recommendedExplanation: `${primary.reason} Clearing it protects cash flow, avoids late fees, and reduces the highest-risk obligation on today's board.`,
    supportingTasks,
  };
}

export function createMoneySnapshot(
  input: MoneySnapshotInput,
  bills: DecisionBill[],
  today = new Date()
): MoneySnapshotOutput {
  const dueBills = rankBills(bills, today).filter((bill) => bill.daysUntilDue <= 7);
  const dueBillsTotal = dueBills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalAssets = input.cash + input.savings + input.investments;
  const netWorth = totalAssets - input.totalLiabilities;
  const monthlyNet = input.monthlyIncome - input.monthlyExpenses;
  const assetBreakdown = [
    { label: "Operating and cash accounts", amount: input.cash },
    { label: "Protected Savings", amount: input.savings },
    { label: "Investments", amount: input.investments },
  ];
  const accountTotal = input.accounts?.reduce((sum, account) => sum + account.balance, 0) || 0;

  return {
    totalAssets: formatCurrency(totalAssets),
    totalLiabilities: formatCurrency(input.totalLiabilities),
    netWorth: formatCurrency(netWorth),
    monthlyIncome: formatCurrency(input.monthlyIncome),
    monthlyExpenses: formatCurrency(input.monthlyExpenses),
    monthlyNet: formatCurrency(monthlyNet),
    cashAfterDueBills: formatCurrency(input.cash - dueBillsTotal),
    dueBillsTotal: formatCurrency(dueBillsTotal),
    savingsCoverage: `${Math.max(0, input.monthlyExpenses ? input.savings / input.monthlyExpenses : 0).toFixed(1)} months`,
    breakdown: assetBreakdown.map((item) => ({
      label: item.label,
      value: formatCurrency(item.amount),
      percentage: totalAssets > 0 ? Math.round((item.amount / totalAssets) * 100) : 0,
    })),
    accounts: (input.accounts || []).map((account) => ({
      label: account.label || account.name || "Account",
      value: formatCurrency(account.balance),
      percentage: accountTotal > 0 ? Math.round((account.balance / accountTotal) * 100) : 0,
    })),
    liabilityBreakdown: [
      {
        label: "Known liabilities",
        value: formatCurrency(input.totalLiabilities),
        percentage: 100,
      },
    ],
  };
}

export function createPriorityAlerts(bills: DecisionBill[], today = new Date()): PriorityAlert[] {
  const rankedBills = rankBills(bills, today);
  const alerts = rankedBills.slice(0, 4).map((bill) => ({
    id: bill.id,
    type: bill.score >= 82 ? "warning" as const : "info" as const,
    title: bill.daysUntilDue < 0 ? `${bill.name} is overdue` : `${bill.name} needs attention`,
    message: `${bill.reason} Decision score: ${bill.score}/100.`,
    actionUrl: "/bills",
    actionLabel: "View Bill",
    score: bill.score,
  }));

  if (alerts.length === 0) {
    return [
      {
        id: 1,
        type: "success",
        title: "No urgent bills today",
        message: "All tracked bills are paid or outside the urgent window.",
        actionUrl: "/bills",
        actionLabel: "Review Bills",
        score: 0,
      },
    ];
  }

  return alerts;
}
