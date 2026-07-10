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
import { formatCurrency, isBlankRow, toNumber } from "../../lib/calculations/currency";
import type { AppData, DecisionState, FinancialState, SpreadsheetRow, UserSettings } from "../../lib/types/app";

export default function Dashboard({
  financialState,
  decisionState,
  data,
}: {
  financialState: FinancialState;
  decisionState: DecisionState;
  data: AppData;
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}) {
  const income = financialState.monthlyIncome || financialState.weeklyIncome || financialState.receivedIncome;
  const expenses = financialState.monthlySpending + financialState.billsPressure;
  const cashFlowTotal = Math.max(1, income + expenses);
  const incomeWidth = Math.max(8, Math.min(100, (income / cashFlowTotal) * 100));
  const goalsActive = data.sections.goals.filter((row) => !isBlankRow(row.cells) && toNumber(row.cells.current) < toNumber(row.cells.target)).length;
  const alerts = decisionState.priorityAlerts.length
    ? decisionState.priorityAlerts.slice(0, 3)
    : [{ title: "All clear", detail: "No alerts right now", tone: "success" as const }];
  const recentActivity = data.sections.transactions
    .filter((row) => !isBlankRow(row.cells))
    .slice(-5)
    .reverse();

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

        <section className="intelligence-wrap">
          <h3><Zap size={19} /> Intelligence</h3>
          {alerts.map((alert) => (
            <a href="/missions" className="base-panel intelligence-card" key={alert.title}>
              <span className={alert.tone}><AlertIcon tone={alert.tone} /></span>
              <div>
                <strong>{alert.title}</strong>
                <small>{alert.detail}</small>
              </div>
            </a>
          ))}
        </section>
      </section>

      <section className="base-panel recent-activity-card">
        <div className="panel-heading">
          <h3><Clock3 size={19} /> Recent Activity</h3>
          <a href="/transactions">All Transactions <ArrowRight size={15} /></a>
        </div>
        <div className="dashboard-activity-list">
          {recentActivity.length ? recentActivity.map((row) => (
            <a className="activity-row" href="/transactions" key={row.id}>
              <span className={toNumber(row.cells.amount) >= 0 ? "income" : "expense"}><ActivityIcon row={row} /></span>
              <div>
                <strong>{row.cells.description || "Transaction"}</strong>
                <small>{row.cells.category || "Uncategorized"} · {row.cells.date || "No date"}</small>
              </div>
              <b>{formatCurrency(toNumber(row.cells.amount))}</b>
            </a>
          )) : (
            <a className="activity-row" href="/transactions">
              <span><Boxes size={18} /></span>
              <div>
                <strong>No transactions yet</strong>
                <small>Add a transaction to start activity history.</small>
              </div>
            </a>
          )}
        </div>
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

function AlertIcon({ tone }: { tone: "warning" | "info" | "success" }) {
  if (tone === "warning") return <ReceiptText size={20} />;
  if (tone === "info") return <Zap size={20} />;
  return <CheckCircle2 size={20} />;
}

function ActivityIcon({ row }: { row: SpreadsheetRow }) {
  return toNumber(row.cells.amount) >= 0 ? <PiggyBank size={18} /> : <ReceiptText size={18} />;
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
