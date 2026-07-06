import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { formatCurrency } from "../../lib/calculations/currency";
import type { DecisionState, FinancialState } from "../../lib/types/app";

export default function Dashboard({
  financialState,
  decisionState,
}: {
  financialState: FinancialState;
  decisionState: DecisionState;
}) {
  return (
    <div className="dashboard-board">
      <section className="kpi-row">
        <a href="/money" className="kpi-card">
          <span>Total Cash</span>
          <strong>{formatCurrency(financialState.totalCash)}</strong>
          <small>All cash accounts</small>
        </a>
        <a href="/money" className="kpi-card">
          <span>Safe To Spend</span>
          <strong>{formatCurrency(financialState.safeToSpend)}</strong>
          <small>After bills and borrowed money</small>
        </a>
        <a href="/bills" className="kpi-card warning">
          <span>Bills Pressure</span>
          <strong>{formatCurrency(financialState.billsPressure)}</strong>
          <small>{financialState.billsDueThisWeek} due this week</small>
        </a>
      </section>

      <section className="dashboard-grid">
        <a href="/missions" className="panel command-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Today Briefing</p>
              <h2>Recommended Move</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          <p className="briefing">{decisionState.todayBriefing}</p>
          <div className="recommended">{decisionState.recommendedMove}</div>
          <div className="alerts-strip">
            {decisionState.priorityAlerts.slice(0, 3).map((alert) => (
              <span key={alert.title} className={alert.tone}>
                {alert.title}
              </span>
            ))}
          </div>
        </a>

        <a href="/money" className="panel balance-panel">
          <p className="eyebrow">Money Snapshot</p>
          <div className="balance-list">
            <Metric label="Total Cash" value={financialState.totalCash} />
            <Metric label="Spendable Cash" value={financialState.spendableCash} />
            <Metric label="Safe To Spend" value={financialState.safeToSpend} />
            <Metric label="Protected Savings" value={financialState.protectedSavings} />
            <Metric label="Available Savings" value={financialState.availableSavings} />
            <Metric label="Borrowed Money" value={financialState.borrowedMoney} />
          </div>
        </a>

        <a href="/debt" className="panel progress-panel">
          <p className="eyebrow">Debt Progress</p>
          <h2>{formatCurrency(financialState.totalDebt)}</h2>
          <div className="progress-track">
            <div style={{ width: `${financialState.debtFreePercent}%` }} />
          </div>
          <p>{financialState.debtFreePercent.toFixed(0)}% debt-free progress</p>
          <small>Next payoff: {financialState.nextPayoff}</small>
        </a>

        <a href="/transactions" className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Cash Flow</p>
              <h2>Income vs Spending</h2>
            </div>
            <ArrowUpRight size={18} />
          </div>
          <div className="bars">
            {financialState.cashFlow.map((bar) => (
              <div key={bar.label}>
                <span>{bar.label}</span>
                <div>
                  <i style={{ height: `${Math.min(100, bar.income / 60)}%` }} />
                  <b style={{ height: `${Math.min(100, bar.spending / 60)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </a>

        <a href="/transactions" className="panel stats-panel">
          <p className="eyebrow">Statistics</p>
          <Metric label="Weekly Spending" value={financialState.weeklySpending} />
          <Metric label="Monthly Spending" value={financialState.monthlySpending} />
          <Metric label="Weekly Income" value={financialState.weeklyIncome} />
          <Metric label="Monthly Income" value={financialState.monthlyIncome} />
        </a>

        <a href="/inventory" className="panel transactions-panel">
          <p className="eyebrow">Buy Next</p>
          <h2>{financialState.buyNextCount} items need action</h2>
          <div className="mini-list">
            {financialState.buyNextRows.slice(0, 5).map((row) => (
              <div key={row.id}>
                <span>{row.cells.item}</span>
                <strong>{row.cells.cost || "$0.00"}</strong>
              </div>
            ))}
          </div>
        </a>

        <section className="panel objective-panel">
          <p className="eyebrow">Objective Stack</p>
          <div className="objective-list">
            {decisionState.missionStack.map((mission) => (
              <a key={mission.title} href="/missions">
                <strong>{mission.title}</strong>
                <span>{mission.detail}</span>
                <em>{mission.priority}</em>
              </a>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-line">
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
    </div>
  );
}
