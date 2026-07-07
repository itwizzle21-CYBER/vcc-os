import { ArrowUpRight, Bell, Boxes, ReceiptText, ShieldCheck } from "lucide-react";
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
          <small>Across money sources</small>
        </a>
        <a href="/money" className="kpi-card">
          <span>Money Snapshot</span>
          <strong>{formatCurrency(financialState.spendableCash)}</strong>
          <small>Spendable after repayment plan</small>
        </a>
        <a href="/bills" className="kpi-card warning">
          <span>Bills Pressure</span>
          <strong>{formatCurrency(financialState.billsPressure)}</strong>
          <small>{financialState.billsDueThisWeek} due this week</small>
        </a>
      </section>

      <section className="dashboard-grid refined-dashboard-grid">
        <a href="/missions" className="panel command-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Today&apos;s Recommended</p>
              <h2>{decisionState.recommendedMove}</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          <p className="briefing">{decisionState.todayBriefing}</p>
          <div className="recommended">Next action: {decisionState.missionStack[0]?.title || "Protect the week"}</div>
        </a>

        <a href="/money" className="panel balance-panel">
          <p className="eyebrow">Money Snapshot</p>
          <div className="balance-list">
            <Metric label="Total Cash" value={financialState.totalCash} />
            <Metric label="Money Snapshot" value={financialState.spendableCash} />
            <Metric label="Safe To Spend" value={financialState.safeToSpend} />
            <Metric label="Protected Savings" value={financialState.protectedSavings} />
            <Metric label="Available Savings" value={financialState.availableSavings} />
            <Metric label="Borrowed Money" value={financialState.borrowedMoney} />
          </div>
        </a>

        <a href="/bills" className="panel bills-focus-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Bills</p>
              <h2>{financialState.billsDueThisWeek} due this week</h2>
            </div>
            <ReceiptText size={20} />
          </div>
          <strong>{formatCurrency(financialState.billsPressure)}</strong>
          <p>{financialState.overdueBills} overdue, {financialState.billsDueToday} due today</p>
        </a>

        <a href="/inventory" className="panel inventory-focus-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2>{financialState.buyNextCount} items need action</h2>
            </div>
            <Boxes size={20} />
          </div>
          <strong>{formatCurrency(financialState.estimatedRefillCost)}</strong>
          <p>{financialState.criticalItems} critical, {financialState.lowStock} low stock</p>
        </a>

        <a href="/transactions" className="panel analytics-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Statistics / Cash Flow / Categories</p>
              <h2>Spending picture</h2>
            </div>
            <ArrowUpRight size={18} />
          </div>
          <div className="analytics-split">
            <div className="bars compact-bars">
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
            <div className="category-list">
              {(financialState.categorySummary.length ? financialState.categorySummary : [{ label: "No category spend", amount: 0 }]).map((category) => (
                <div key={category.label}>
                  <span>{category.label}</span>
                  <strong>{formatCurrency(category.amount)}</strong>
                </div>
              ))}
            </div>
          </div>
        </a>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>Quick notifications</h2>
            </div>
            <Bell size={18} />
          </div>
          <div className="notification-list">
            {decisionState.priorityAlerts.slice(0, 3).map((alert) => (
              <a key={alert.title} href="/missions" className={alert.tone}>
                <strong>{alert.title}</strong>
                <span>{alert.detail}</span>
              </a>
            ))}
          </div>
        </section>

        <a href="/debt" className="panel progress-panel">
          <p className="eyebrow">Debt Progress</p>
          <h2>{formatCurrency(financialState.totalDebt)}</h2>
          <div className="progress-track">
            <div style={{ width: `${financialState.debtFreePercent}%` }} />
          </div>
          <p>{financialState.debtFreePercent.toFixed(0)}% debt-free progress</p>
          <small>Next payoff: {financialState.nextPayoff}</small>
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
