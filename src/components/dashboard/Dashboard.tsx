import {
  ArrowRight,
  Boxes,
  PiggyBank,
  ReceiptText,
  Target,
  TrendingDown,
  Wallet,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { formatCurrency } from "../../lib/calculations/currency";
import type { AppData, DecisionState, FinancialState, UserSettings } from "../../lib/types/app";

interface DashboardProps {
  financialState: FinancialState;
  decisionState: DecisionState;
  data: AppData;
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

interface DashboardModuleCardProps {
  href: string;
  tone: "blue" | "gold" | "green" | "emerald" | "purple" | "red";
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  metrics: Array<[string, string]>;
}

export default function Dashboard({
  financialState,
}: DashboardProps) {
  const moduleCards: DashboardModuleCardProps[] = [
    {
      href: "/money",
      tone: "blue",
      icon: <Wallet size={22} />,
      title: "Money Snapshot",
      value: formatWholeCurrency(financialState.totalCash),
      detail: "Current cash position",
      metrics: [
        ["Spendable Cash", formatWholeCurrency(financialState.spendableCash)],
        ["Safe To Spend", formatWholeCurrency(financialState.safeToSpend)],
        ["Protected Savings", formatWholeCurrency(financialState.protectedSavings)],
        ["Borrowed Money", formatWholeCurrency(financialState.borrowedMoney)],
      ],
    },
    {
      href: "/bills",
      tone: "gold",
      icon: <ReceiptText size={22} />,
      title: "Bills",
      value: formatWholeCurrency(financialState.billsPressure),
      detail: "Due pressure",
      metrics: [
        ["Due Today", String(financialState.billsDueToday)],
        ["Due This Week", String(financialState.billsDueThisWeek)],
        ["Overdue", String(financialState.overdueBills)],
        ["Bills Pressure", formatWholeCurrency(financialState.billsPressure)],
      ],
    },
    {
      href: "/inventory",
      tone: "green",
      icon: <Boxes size={22} />,
      title: "Inventory",
      value: String(financialState.buyNextCount),
      detail: "Buy Next items",
      metrics: [
        ["Critical Items", String(financialState.criticalItems)],
        ["Low Stock", String(financialState.lowStock)],
        ["Buy Next", String(financialState.buyNextCount)],
        ["Refill Cost", formatWholeCurrency(financialState.estimatedRefillCost)],
      ],
    },
    {
      href: "/transactions",
      tone: "red",
      icon: <TrendingDown size={22} />,
      title: "Transactions",
      value: formatWholeCurrency(financialState.monthlySpending),
      detail: "Monthly spending",
      metrics: [
        ["Weekly Spending", formatWholeCurrency(financialState.weeklySpending)],
        ["Monthly Spending", formatWholeCurrency(financialState.monthlySpending)],
        ["Largest Expense", financialState.largestExpense],
        ["Last Transaction", financialState.lastTransaction],
      ],
    },
    {
      href: "/savings",
      tone: "emerald",
      icon: <PiggyBank size={22} />,
      title: "Savings",
      value: formatWholeCurrency(financialState.protectedSavings + financialState.availableSavings),
      detail: "Protected and available",
      metrics: [
        ["Protected Savings", formatWholeCurrency(financialState.protectedSavings)],
        ["Available Savings", formatWholeCurrency(financialState.availableSavings)],
        ["Emergency Fund", formatWholeCurrency(financialState.emergencyFund)],
        ["Goal Savings", formatWholeCurrency(financialState.goalSavings)],
      ],
    },
    {
      href: "/goals",
      tone: "purple",
      icon: <Target size={22} />,
      title: "Goals",
      value: `${Math.round(financialState.goalCompletionPercent)}%`,
      detail: "Overall completion",
      metrics: [
        ["Goals Complete", String(financialState.goalsComplete)],
        ["Closest Goal", financialState.closestGoal],
        ["Completion", `${Math.round(financialState.goalCompletionPercent)}%`],
        ["Estimated Finish", financialState.estimatedFinish],
      ],
    },
  ];

  return (
    <div className="base44-dashboard">
      <div className="dashboard-status-line">
        <i />
        <span>System Active</span>
      </div>

      <a href="/missions" className="mission-banner">
        <div>
          <p><Zap size={16} /> Today&apos;s Mission</p>
          <div className="mission-banner-body">
            <span><ReceiptText size={29} /></span>
            <div>
              <h2>Pay New Bill</h2>
              <small>{missionDetail(financialState)}</small>
            </div>
          </div>
        </div>
        <ArrowRight size={25} />
      </a>

      <section className="dashboard-module-grid" aria-label="VCC dashboard modules">
        {moduleCards.map((card) => (
          <DashboardModuleCard key={card.href} {...card} />
        ))}
      </section>
    </div>
  );
}

function DashboardModuleCard({
  href,
  tone,
  icon,
  title,
  value,
  detail,
  metrics,
}: DashboardModuleCardProps) {
  return (
    <a href={href} className="base-panel dashboard-module-card">
      <div className="dashboard-module-head">
        <span className={tone}>{icon}</span>
        <ArrowRight size={17} />
      </div>
      <div className="dashboard-module-title">
        <small>{title}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
      <dl>
        {metrics.map(([label, metric]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{metric}</dd>
          </div>
        ))}
      </dl>
    </a>
  );
}

function missionDetail(financialState: FinancialState) {
  const dueToday = financialState.billsDueToday > 0 ? financialState.billsPressure : 0;
  return `Due today \u00b7 ${formatCurrency(dueToday)}`;
}

function formatWholeCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}
