import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Car,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CreditCard,
  ListChecks,
  Pause,
  PiggyBank,
  Play,
  ReceiptText,
  Target,
  TrendingDown,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { DepositAccountOption } from "../../lib/engine/paycheckPlannerEngine";
import type { ActivityEvent, DecisionState, FinancialState, LayoutView } from "../../lib/types/app";
import { layoutViewClass } from "../layout/LayoutViews";

interface DashboardProps {
  financialState: FinancialState;
  decisionState: DecisionState;
  activity: ActivityEvent[];
  accounts: DepositAccountOption[];
  layoutView: LayoutView;
}

interface DashboardModuleCardProps {
  href: string;
  tone: "blue" | "gold" | "green" | "emerald" | "purple" | "red";
  icon: ReactNode;
  title: string;
  slides: DashboardMetricSlide[];
  rotationMs: number;
  progress?: {
    label: string;
    value: number;
    detail: string;
  };
}

interface DashboardMetricSlide {
  label: string;
  value: string;
}

export default function Dashboard({
  financialState,
  decisionState,
  activity,
  accounts,
  layoutView,
}: DashboardProps) {
  const missionIcon = iconForMission(decisionState.todayMission.href);
  const moduleCards: DashboardModuleCardProps[] = [
    {
      href: "/transactions",
      tone: "red",
      icon: <TrendingDown size={22} />,
      title: "Transactions",
      rotationMs: 8_200,
      slides: [
        { label: "Monthly spending", value: formatDashboardSpending(financialState.monthlySpending) },
        { label: "Weekly spending", value: formatDashboardSpending(financialState.weeklySpending) },
        { label: "Week impact", value: formatExactCurrency(financialState.transactionWeekNet) },
        { label: "Shortfall spending", value: formatDashboardSpending(financialState.shortfallSpending) },
        { label: "Largest expense", value: financialState.largestExpense },
        { label: "Last transaction", value: financialState.lastTransaction },
      ],
    },
    {
      href: "/bills",
      tone: "gold",
      icon: <ReceiptText size={22} />,
      title: "Bills",
      rotationMs: 9_300,
      slides: [
        { label: "Due pressure", value: formatWholeCurrency(financialState.billsPressure) },
        { label: "Due today", value: String(financialState.billsDueToday) },
        { label: "Due this week", value: String(financialState.billsDueThisWeek) },
        { label: "Overdue", value: String(financialState.overdueBills) },
      ],
    },
    {
      href: "/inventory",
      tone: "green",
      icon: <Boxes size={22} />,
      title: "Inventory",
      rotationMs: 10_400,
      slides: [
        { label: "Buy Next items", value: String(financialState.buyNextCount) },
        { label: "Critical items", value: String(financialState.criticalItems) },
        { label: "Low stock", value: String(financialState.lowStock) },
        { label: "Refill cost", value: formatWholeCurrency(financialState.estimatedRefillCost) },
      ],
    },
    {
      href: "/savings",
      tone: "emerald",
      icon: <PiggyBank size={22} />,
      title: "Savings",
      rotationMs: 11_500,
      slides: [
        { label: "Total savings", value: formatWholeCurrency(financialState.protectedSavings + financialState.availableSavings) },
        { label: "Protected savings", value: formatWholeCurrency(financialState.protectedSavings) },
        { label: "Available savings", value: formatWholeCurrency(financialState.availableSavings) },
        { label: "Emergency fund", value: formatWholeCurrency(financialState.emergencyFund) },
        { label: "Goal savings", value: formatWholeCurrency(financialState.goalSavings) },
      ],
    },
    {
      href: "/goals",
      tone: "purple",
      icon: <Target size={22} />,
      title: "Goals",
      rotationMs: 12_600,
      slides: [
        { label: "Overall completion", value: `${Math.round(financialState.goalCompletionPercent)}%` },
        { label: "Goals complete", value: String(financialState.goalsComplete) },
        { label: "Closest goal", value: financialState.closestGoal },
        { label: "Estimated finish", value: financialState.estimatedFinish },
      ],
    },
    {
      href: "/car-payment",
      tone: "blue",
      icon: <Car size={22} />,
      title: "Car Payment",
      rotationMs: 13_700,
      slides: [
        { label: "Official payoff", value: formatWholeCurrency(financialState.carLoanOfficialPayoff) },
        { label: "Dealer balance", value: formatWholeCurrency(financialState.carLoanDealerBalance) },
        { label: "Total cash paid", value: formatWholeCurrency(financialState.carLoanTotalCashPaid) },
        { label: "Payments remaining", value: `${financialState.carLoanPaymentsRemaining} weeks` },
      ],
      progress: {
        label: "Confirmed Principal Progress",
        value: financialState.carPaymentPaidPercent,
        detail: `${formatWholeCurrency(financialState.carLoanPrincipalPaid)} principal documented`,
      },
    },
  ];

  return (
    <div className={`base44-dashboard ${layoutViewClass(layoutView)}`} data-layout-view={layoutView}>
      <h1 className="sr-only">VCC-OS Dashboard</h1>
      <div
        className="dashboard-status-line dashboard-collapse-heading"
      >
        <i aria-hidden="true" />
        <span>System Active</span>
      </div>

      <div className="dashboard-page-content">
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

      <section className="dashboard-intelligence-grid" aria-label="Overall system priority output">
        <article className="base-panel dashboard-intelligence-panel">
          <div className="dashboard-intelligence-heading">
            <span><ListChecks size={18} /></span>
            <div>
              <h2>System Priority Stack</h2>
              <small>Ranked across the full VCC system</small>
            </div>
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
        <DashboardMoneyCard accounts={accounts} />
        {moduleCards.map((card) => (
          <DashboardModuleCard key={card.href} {...card} />
        ))}
      </section>
      </div>
    </div>
  );
}

function DashboardModuleCard({
  href,
  tone,
  icon,
  title,
  slides,
  rotationMs,
  progress,
}: DashboardModuleCardProps) {
  const { activeIndex, isPlaying, hasSlideshow, select, togglePlaying } = useDashboardSlideshow(slides.length, rotationMs);
  const activeSlide = slides[activeIndex] ?? slides[0];
  const hasLongValue = (activeSlide?.value.length ?? 0) > 18;

  return (
    <article className={`base-panel dashboard-module-card dashboard-money-card dashboard-live-metric-card tone-${tone}`} aria-label={`${title} metric slideshow`}>
      <header className="dashboard-money-card-header">
        <span className={`dashboard-money-card-icon ${tone}`}>{icon}</span>
        <div>
          <strong>{title}</strong>
          <small><i aria-hidden="true" /> Live metrics</small>
        </div>
        <a className="dashboard-module-open" href={href} aria-label={`Open ${title}`}>
          <ArrowRight size={17} aria-hidden="true" />
        </a>
      </header>

      {activeSlide && (
        <div className="dashboard-money-account-stage dashboard-live-metric-stage" aria-live={isPlaying ? "off" : "polite"} aria-atomic="true">
          <a key={activeSlide.label} className="dashboard-money-account-slide dashboard-live-metric-slide" href={href} aria-label={`Open ${title}: ${activeSlide.label}`}>
            <small>{activeSlide.label}</small>
            <span className={hasLongValue ? "long" : undefined}>{activeSlide.value}</span>
          </a>
          <div className="dashboard-money-account-detail">
            <span>
              <small>{progress?.label ?? "Status"}</small>
              <strong>{progress ? `${Math.round(progress.value)}%` : "Live"}</strong>
            </span>
            <span>
              <small>{progress ? "Detail" : "Source"}</small>
              <strong>{progress?.detail ?? title}</strong>
            </span>
          </div>
        </div>
      )}

      {hasSlideshow && (
        <div className="dashboard-money-slideshow-controls" role="group" aria-label={`${title} slideshow controls`}>
          <button type="button" onClick={() => select(activeIndex - 1)} aria-label={`Show previous ${title} metric`}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span aria-live="off">{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
          <button
            type="button"
            onClick={togglePlaying}
            aria-label={`Automatic ${title} rotation`}
            aria-pressed={isPlaying}
            title={isPlaying ? `Pause ${title} slideshow` : `Play ${title} slideshow`}
          >
            {isPlaying ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => select(activeIndex + 1)} aria-label={`Show next ${title} metric`}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}

function DashboardMoneyCard({ accounts }: { accounts: DepositAccountOption[] }) {
  const liveAccounts = accounts.filter((account) => !account.isNew);
  const {
    activeIndex: activeAccountIndex,
    isPlaying,
    hasSlideshow,
    select: selectAccount,
    togglePlaying,
  } = useDashboardSlideshow(liveAccounts.length, DASHBOARD_MONEY_SLIDE_DURATION_MS);
  const activeAccount = liveAccounts[activeAccountIndex];

  return (
    <article className="base-panel dashboard-module-card dashboard-money-card dashboard-money-account-card" aria-label="Money Snapshot account slideshow">
      <header className="dashboard-money-card-header">
        <span className="dashboard-money-card-icon"><Wallet size={21} aria-hidden="true" /></span>
        <div>
          <strong>Money Snapshot</strong>
          <small><i aria-hidden="true" /> Live balances</small>
        </div>
        <a className="dashboard-module-open" href="/money" aria-label="Open Money Snapshot">
          <ArrowRight size={17} aria-hidden="true" />
        </a>
      </header>

      {activeAccount ? (
        <div className="dashboard-money-account-stage" aria-live={isPlaying ? "off" : "polite"} aria-atomic="true">
          <a key={activeAccount.id} className="dashboard-money-account-slide" href="/money" aria-label={`Open ${activeAccount.label} in Money Snapshot`}>
            <small>Financial account</small>
            <strong>{activeAccount.label}</strong>
            <span className={activeAccount.balance < 0 ? "negative" : undefined}>{formatExactCurrency(activeAccount.balance)}</span>
          </a>
          <div className="dashboard-money-account-detail">
            <span>
              <small>Balance</small>
              <strong>{activeAccount.balance < 0 ? "Overdrawn" : "Available"}</strong>
            </span>
            <span>
              <small>Source</small>
              <strong>Money Snapshot</strong>
            </span>
          </div>
        </div>
      ) : (
        <a className="dashboard-money-empty" href="/money">
          <strong>No financial accounts yet</strong>
          <span>Add an account in Money Snapshot to begin the live slideshow.</span>
        </a>
      )}

      {hasSlideshow && (
        <div className="dashboard-money-slideshow-controls" role="group" aria-label="Money Snapshot slideshow controls">
          <button type="button" onClick={() => selectAccount(activeAccountIndex - 1)} aria-label="Show previous account">
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span aria-live="off">{String(activeAccountIndex + 1).padStart(2, "0")} / {String(liveAccounts.length).padStart(2, "0")}</span>
          <button
            type="button"
            onClick={togglePlaying}
            aria-label="Automatic account rotation"
            aria-pressed={isPlaying}
            title={isPlaying ? "Pause account slideshow" : "Play account slideshow"}
          >
            {isPlaying ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => selectAccount(activeAccountIndex + 1)} aria-label="Show next account">
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}

function useDashboardSlideshow(itemCount: number, rotationMs: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const hasSlideshow = itemCount > 1;

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, itemCount - 1)));
  }, [itemCount]);

  useEffect(() => {
    if (!hasSlideshow || !isPlaying) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % itemCount);
    }, rotationMs);

    return () => window.clearInterval(interval);
  }, [hasSlideshow, isPlaying, itemCount, rotationMs]);

  const select = (index: number) => {
    if (!itemCount) return;
    setIsPlaying(false);
    setActiveIndex((index + itemCount) % itemCount);
  };

  const togglePlaying = () => setIsPlaying((playing) => !playing);

  return { activeIndex, isPlaying, hasSlideshow, select, togglePlaying };
}

const DASHBOARD_MONEY_SLIDE_DURATION_MS = 7_000;

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

export function formatDashboardOutflow(value: number) {
  return formatWholeCurrency(Math.abs(Number.isFinite(value) ? value : 0));
}

function formatExactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}
