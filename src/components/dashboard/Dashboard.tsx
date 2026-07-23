import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Car,
  Check,
  CheckCircle2,
  Circle,
  CreditCard,
  ListChecks,
  PiggyBank,
  ReceiptText,
  Target,
  TrendingDown,
  Wallet,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ActivityEvent, DecisionState, FinancialState } from "../../lib/types/app";

interface DashboardProps {
  financialState: FinancialState;
  decisionState: DecisionState;
  activity: ActivityEvent[];
}

interface DashboardModuleCardProps {
  href: string;
  tone: "blue" | "gold" | "green" | "emerald" | "purple" | "red";
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  metrics: Array<[string, string]>;
  progress?: {
    label: string;
    value: number;
    detail: string;
  };
}

export default function Dashboard({
  financialState,
  decisionState,
  activity,
}: DashboardProps) {
  const missionIcon = iconForMission(decisionState.todayMission.href);
  const moduleCards: DashboardModuleCardProps[] = [
    {
      href: "/money",
      tone: "blue",
      icon: <Wallet size={22} />,
      title: "Money Snapshot",
      value: formatExactCurrency(Math.min(financialState.spendableCash, financialState.safeToSpend)),
      detail: "Spendable this week",
      metrics: [
        ["Total Cash", formatExactCurrency(financialState.totalCash)],
        ["Weekly Income", formatExactCurrency(financialState.weeklyIncome)],
        ["Week Spending", formatDashboardSpending(financialState.weeklySpending)],
        ["Week Net Impact", formatExactCurrency(financialState.transactionWeekNet)],
        ["Protected Savings", formatExactCurrency(financialState.protectedSavings)],
        ["Borrowed Money", formatExactCurrency(financialState.borrowedMoney)],
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
      value: formatDashboardSpending(financialState.monthlySpending),
      detail: "Monthly spending",
      metrics: [
        ["Week Impact", formatExactCurrency(financialState.transactionWeekNet)],
        ["Weekly Spending", formatDashboardSpending(financialState.weeklySpending)],
        ["Monthly Spending", formatDashboardSpending(financialState.monthlySpending)],
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
    {
      href: "/car-payment",
      tone: "blue",
      icon: <Car size={22} />,
      title: "Car Payment",
      value: formatWholeCurrency(financialState.carLoanOfficialPayoff),
      detail: "Latest official dealer payoff",
      metrics: [
        ["Official Payoff", formatWholeCurrency(financialState.carLoanOfficialPayoff)],
        ["Dealer Balance", formatWholeCurrency(financialState.carLoanDealerBalance)],
        ["Total Cash Paid", formatWholeCurrency(financialState.carLoanTotalCashPaid)],
        ["Payments Remaining", `${financialState.carLoanPaymentsRemaining} weeks`],
      ],
      progress: {
        label: "Confirmed Principal Progress",
        value: financialState.carPaymentPaidPercent,
        detail: `${formatWholeCurrency(financialState.carLoanPrincipalPaid)} principal documented`,
      },
    },
  ];

  return (
    <div className="base44-dashboard">
      <h1 className="sr-only">VCC-OS Dashboard</h1>
      <p className="dashboard-status-line">
        <i aria-hidden="true" />
        <span>System Active</span>
      </p>

      <a href={decisionState.todayMission.href} className="mission-banner">
        <div>
          <p><Zap size={16} /> Today&apos;s Mission</p>
          <div className="mission-banner-body">
            <span>{missionIcon}</span>
            <div>
              <h2>{decisionState.todayMission.title}</h2>
              <small>{decisionState.todayMission.detail}</small>
            </div>
          </div>
          <strong className="mission-briefing">{decisionState.todayBriefing}</strong>
        </div>
        <span className={`mission-priority priority-${decisionState.todayMission.priority.toLowerCase()}`}>
          {decisionState.todayMission.priority}
        </span>
        <ArrowRight size={25} aria-hidden="true" />
      </a>

      <section className="dashboard-intelligence-grid" aria-label="Decision Engine priority output">
        <article className="base-panel dashboard-intelligence-panel">
          <div className="dashboard-intelligence-heading">
            <span><ListChecks size={18} /></span>
            <h2>Mission Stack</h2>
          </div>
          <div className="dashboard-mission-stack">
            {decisionState.missionStack.map((mission) => (
              <a key={mission.id} href={mission.href} className={`dashboard-mission-row ${mission.completed ? "complete" : "active"}`}>
                <span className="mission-check-indicator" aria-hidden="true">
                  {mission.completed ? <Check size={14} /> : <Circle size={14} />}
                </span>
                <div>
                  <strong>{mission.title}</strong>
                  <span className="sr-only">Status: {mission.completed ? "Completed" : "In progress"}.</span>
                  <span>{mission.detail}</span>
                  <small>{mission.target}</small>
                  <i
                    role="progressbar"
                    aria-label={`${mission.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(Math.max(0, Math.min(100, mission.progress)))}
                  >
                    <b aria-hidden="true" style={{ width: `${Math.max(0, Math.min(100, mission.progress))}%` }} />
                  </i>
                </div>
                <em className={`stack-priority priority-${mission.priority.toLowerCase()}`}>{mission.priority}</em>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            ))}
          </div>
        </article>

        <article className="base-panel dashboard-intelligence-panel">
          <div className="dashboard-intelligence-heading">
            <span><AlertTriangle size={18} /></span>
            <h2>Priority Alerts</h2>
          </div>
          <div className="dashboard-alert-stack">
            {decisionState.priorityAlerts.map((alert) => (
              <div key={alert.title} className={`dashboard-alert-row ${alert.tone}`}>
                <strong>{alert.title}</strong>
                <span>{alert.detail}</span>
              </div>
            ))}
            <div className="dashboard-alert-row info recommendation">
              <strong>Recommended next move</strong>
              <span>{decisionState.recommendedMove}</span>
            </div>
          </div>
        </article>

        <article className="base-panel dashboard-intelligence-panel dashboard-activity-panel">
          <div className="dashboard-intelligence-heading">
            <span><CheckCircle2 size={18} /></span>
            <h2>Recent Activity</h2>
          </div>
          <div className="dashboard-activity-stack">
            {activity.slice(0, 3).map((event) => (
              <div key={event.id} className="dashboard-activity-row">
                <Check size={15} aria-hidden="true" />
                <div><strong>{event.title}</strong><span>{event.detail}</span></div>
              </div>
            ))}
            {!activity.length && <p className="dashboard-activity-empty">Completed missions will appear here.</p>}
          </div>
        </article>
      </section>

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
  progress,
}: DashboardModuleCardProps) {
  return (
    <a href={href} className="base-panel dashboard-module-card">
      <div className="dashboard-module-head">
        <span className={tone}>{icon}</span>
        <ArrowRight size={17} aria-hidden="true" />
      </div>
      <div className="dashboard-module-title">
        <small>{title}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
      {progress && (
        <div className="dashboard-card-progress" aria-label={`${progress.label}: ${Math.round(progress.value)}%`}>
          <div>
            <span>{progress.label}</span>
            <strong>{Math.round(progress.value)}%</strong>
          </div>
          <i><b style={{ width: `${Math.max(0, Math.min(100, progress.value))}%` }} /></i>
          <small>{progress.detail}</small>
        </div>
      )}
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

function iconForMission(href: DecisionState["todayMission"]["href"]) {
  if (href === "/bills") return <ReceiptText size={29} />;
  if (href === "/inventory") return <Boxes size={29} />;
  if (href === "/savings") return <PiggyBank size={29} />;
  if (href === "/debt") return <CreditCard size={29} />;
  if (href === "/goals") return <Target size={29} />;
  if (href === "/transactions") return <TrendingDown size={29} />;
  if (href === "/money") return <Wallet size={29} />;
  return <CheckCircle2 size={29} />;
}

function formatWholeCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDashboardSpending(value: number) {
  const magnitude = Math.abs(Number.isFinite(value) ? value : 0);
  return formatWholeCurrency(magnitude > 0 ? -magnitude : 0);
}

function formatExactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}
