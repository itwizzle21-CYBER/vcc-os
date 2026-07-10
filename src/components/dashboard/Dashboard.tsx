import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  FileBarChart,
  PiggyBank,
  ReceiptText,
  Target,
  Wallet,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { formatCurrency } from "../../lib/calculations/currency";
import type { DecisionState, FinancialState, UserSettings } from "../../lib/types/app";

export default function Dashboard({
  financialState,
  decisionState,
}: {
  financialState: FinancialState;
  decisionState: DecisionState;
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}) {
  const primaryAlert = decisionState.priorityAlerts[0];
  const income = financialState.monthlyIncome || financialState.weeklyIncome || financialState.receivedIncome;
  const expenses = financialState.monthlySpending + financialState.billsPressure;
  const cashFlowTotal = Math.max(1, income + expenses);
  const incomeWidth = Math.max(8, Math.min(100, (income / cashFlowTotal) * 100));
  const goalsActive = financialState.closestGoal === "None" ? 0 : 1;
  const activityTitle = financialState.lastTransaction === "None" ? "No transactions yet" : financialState.lastTransaction;

  return (
    <div className="base44-dashboard">
      <a href="/missions" className="mission-banner">
        <div>
          <p><Zap size={16} /> Today&apos;s Mission</p>
          <div className="mission-banner-body">
            <span><ReceiptText size={29} /></span>
            <div>
              <h2>{missionTitle(financialState, decisionState)}</h2>
              <small>{missionDetail(financialState)}</small>
            </div>
          </div>
        </div>
        <ArrowRight size={25} />
      </a>

      <section className="dashboard-kpi-row" aria-label="Money snapshot">
        <DashboardKpi href="/money" tone="blue" icon={<Wallet size={30} />} label="Net Balance" value={formatWholeCurrency(financialState.totalCash - financialState.totalDebt)} />
        <DashboardKpi href="/bills" tone="gold" icon={<ReceiptText size={30} />} label="Upcoming Bills" value={formatWholeCurrency(financialState.billsPressure)} />
        <DashboardKpi href="/savings" tone="green" icon={<PiggyBank size={30} />} label="Savings" value={formatWholeCurrency(financialState.protectedSavings + financialState.availableSavings)} />
        <DashboardKpi href="/goals" tone="purple" icon={<Target size={30} />} label="Active Goals" value={String(goalsActive)} />
      </section>

      <section className="dashboard-lower-grid">
        <a href="/reports" className="base-panel cash-flow-card">
          <div className="panel-heading">
            <h3><FileBarChart size={19} /> Cash Flow</h3>
            <span>View Reports <ArrowRight size={15} /></span>
          </div>
          <div className="cash-flow-stats">
            <div>
              <small>Income</small>
              <strong className="income-text">{formatWholeCurrency(income)}</strong>
            </div>
            <div>
              <small>Expenses</small>
              <strong className="expense-text">{formatWholeCurrency(expenses)}</strong>
            </div>
          </div>
          <div className="cash-flow-track">
            <i style={{ width: `${incomeWidth}%` }} />
          </div>
        </a>

        <a href="/missions" className="intelligence-wrap">
          <h3><Zap size={19} /> Intelligence</h3>
          <div className="base-panel intelligence-card">
            <span className={primaryAlert?.tone || "success"}><CheckCircle2 size={20} /></span>
            <div>
              <strong>{primaryAlert?.title || "All clear"}</strong>
              <small>{primaryAlert?.detail || "No alerts right now"}</small>
            </div>
          </div>
        </a>
      </section>

      <section className="base-panel recent-activity-card">
        <div className="panel-heading">
          <h3><Clock3 size={19} /> Recent Activity</h3>
          <a href="/transactions">All Transactions <ArrowRight size={15} /></a>
        </div>
        <a className="activity-row" href="/transactions">
          <span><Boxes size={18} /></span>
          <div>
            <strong>{activityTitle}</strong>
            <small>{financialState.lastTransaction === "None" ? "Add a transaction to start activity history." : "Latest transaction activity"}</small>
          </div>
        </a>
      </section>
    </div>
  );
}

function DashboardKpi({
  href,
  tone,
  icon,
  label,
  value,
}: {
  href: string;
  tone: "blue" | "gold" | "green" | "purple";
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <a href={href} className="base-panel dashboard-kpi-card">
      <span className={tone}>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </a>
  );
}

function missionTitle(financialState: FinancialState, decisionState: DecisionState) {
  if (financialState.billsDueToday > 0) return "Pay New Bill";
  return decisionState.recommendedMove;
}

function missionDetail(financialState: FinancialState) {
  if (financialState.billsDueToday > 0) return `Due today · ${formatCurrency(financialState.billsPressure)}`;
  return `${financialState.billsDueThisWeek} due this week · ${formatCurrency(financialState.safeToSpend)} safe`;
}

function formatWholeCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}
