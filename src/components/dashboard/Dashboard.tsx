import { ArrowUpRight, Bell, Boxes, ChevronDown, ChevronUp, GripVertical, ReceiptText, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { formatCurrency } from "../../lib/calculations/currency";
import type { DecisionState, FinancialState, UserSettings } from "../../lib/types/app";

interface Widget {
  id: string;
  className: string;
  content: ReactNode;
}

export default function Dashboard({
  financialState,
  decisionState,
  settings,
  onSettingsChange,
}: {
  financialState: FinancialState;
  decisionState: DecisionState;
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const order = settings.widgetOrder?.length ? settings.widgetOrder : defaultOrder;

  const widgets: Widget[] = [
    {
      id: "total-cash",
      className: "widget-kpi",
      content: <a href="/money" className="widget-link kpi-content"><span>Total Cash</span><strong>{formatCurrency(financialState.totalCash)}</strong><small>Across money sources</small></a>,
    },
    {
      id: "money-snapshot",
      className: "widget-kpi",
      content: <a href="/money" className="widget-link kpi-content"><span>Spendable Cash</span><strong>{formatCurrency(financialState.spendableCash)}</strong><small>After planned repayments</small></a>,
    },
    {
      id: "protected-savings",
      className: "widget-kpi",
      content: <a href="/savings" className="widget-link kpi-content"><span>Protected Savings</span><strong>{formatCurrency(financialState.protectedSavings)}</strong><small>Shielded from spending</small></a>,
    },
    {
      id: "command",
      className: "widget-wide command-panel",
      content: (
        <a href="/missions" className="widget-link">
          <div className="panel-heading"><div><p className="eyebrow">Today Briefing</p><h2>{decisionState.todayBriefing}</h2></div><ShieldCheck size={20} /></div>
          <div className="recommended"><span>Today&apos;s Recommended</span><strong>{decisionState.recommendedMove}</strong></div>
        </a>
      ),
    },
    {
      id: "balance",
      className: "widget-tall",
      content: (
        <a href="/money" className="widget-link">
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
      ),
    },
    {
      id: "bills",
      className: "",
      content: (
        <a href="/bills" className="widget-link focus-widget">
          <div className="panel-heading"><div><p className="eyebrow">Bills + Pressure</p><h2>{financialState.billsDueThisWeek} due this week</h2></div><ReceiptText size={20} /></div>
          <strong className="focus-value">{formatCurrency(financialState.billsPressure)}</strong>
          <p>{financialState.overdueBills} overdue, {financialState.billsDueToday} due today</p>
        </a>
      ),
    },
    {
      id: "inventory",
      className: "",
      content: (
        <a href="/inventory" className="widget-link focus-widget">
          <div className="panel-heading"><div><p className="eyebrow">Inventory</p><h2>{financialState.buyNextCount} items need action</h2></div><Boxes size={20} /></div>
          <strong className="focus-value">{formatCurrency(financialState.estimatedRefillCost)}</strong>
          <p>{financialState.criticalItems} critical, {financialState.lowStock} low stock</p>
        </a>
      ),
    },
    {
      id: "analytics",
      className: "widget-wide",
      content: (
        <a href="/transactions" className="widget-link analytics-panel">
          <div className="panel-heading"><div><p className="eyebrow">Cash Flow + Categories</p><h2>Spending picture</h2></div><ArrowUpRight size={18} /></div>
          <div className="analytics-split">
            <div className="bars compact-bars">{financialState.cashFlow.map((bar) => <div key={bar.label}><span>{bar.label}</span><div><i style={{ height: `${Math.min(100, bar.income / 60)}%` }} /><b style={{ height: `${Math.min(100, bar.spending / 60)}%` }} /></div></div>)}</div>
            <div className="category-list">{(financialState.categorySummary.length ? financialState.categorySummary : [{ label: "No category spend", amount: 0 }]).map((category) => <div key={category.label}><span>{category.label}</span><strong>{formatCurrency(category.amount)}</strong></div>)}</div>
          </div>
        </a>
      ),
    },
    {
      id: "activity",
      className: "",
      content: (
        <div className="widget-link">
          <div className="panel-heading"><div><p className="eyebrow">Activity</p><h2>Priority alerts</h2></div><Bell size={18} /></div>
          <div className="notification-list">{decisionState.priorityAlerts.slice(0, 3).map((alert) => <a key={alert.title} href="/missions" className={alert.tone}><strong>{alert.title}</strong><span>{alert.detail}</span></a>)}</div>
        </div>
      ),
    },
    {
      id: "progress",
      className: "",
      content: (
        <a href="/debt" className="widget-link">
          <p className="eyebrow">Debt Progress</p><h2>{formatCurrency(financialState.totalDebt)}</h2>
          <div className="progress-track"><div style={{ width: `${financialState.debtFreePercent}%` }} /></div>
          <p>{financialState.debtFreePercent.toFixed(0)}% debt-free progress</p><small>Next payoff: {financialState.nextPayoff}</small>
        </a>
      ),
    },
    {
      id: "objectives",
      className: "widget-wide",
      content: (
        <div className="widget-link">
          <p className="eyebrow">Objective Stack</p>
          <div className="objective-list">{decisionState.missionStack.map((mission) => <a key={mission.title} href="/missions"><strong>{mission.title}</strong><span>{mission.detail}</span><em>{mission.priority}</em></a>)}</div>
        </div>
      ),
    },
  ];

  const visible = order
    .map((id) => widgets.find((widget) => widget.id === id))
    .filter((widget): widget is Widget => Boolean(widget) && !settings.hiddenWidgets.includes(widget!.id));

  function moveWidget(id: string, direction: -1 | 1) {
    const from = order.indexOf(id);
    const to = Math.max(0, Math.min(order.length - 1, from + direction));
    if (from === to) return;
    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, id);
    onSettingsChange({ ...settings, widgetOrder: next });
  }

  function dropWidget(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const next = [...order];
    const from = next.indexOf(draggedId);
    const to = next.indexOf(targetId);
    next.splice(from, 1);
    next.splice(to, 0, draggedId);
    onSettingsChange({ ...settings, widgetOrder: next });
    setDraggedId(null);
  }

  return (
    <div className="dashboard-board">
      <div className="widget-board" aria-label="Customizable dashboard widgets">
        {visible.map((widget) => (
          <article
            key={widget.id}
            className={`dashboard-widget ${widget.className} ${draggedId === widget.id ? "is-dragging" : ""}`}
            draggable
            onDragStart={() => setDraggedId(widget.id)}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropWidget(widget.id)}
          >
            <div className="widget-controls">
              <button type="button" className="drag-handle" aria-label={`Drag ${widget.id} widget`} title="Drag to rearrange"><GripVertical size={16} /></button>
              <button type="button" aria-label={`Move ${widget.id} widget up`} onClick={() => moveWidget(widget.id, -1)}><ChevronUp size={15} /></button>
              <button type="button" aria-label={`Move ${widget.id} widget down`} onClick={() => moveWidget(widget.id, 1)}><ChevronDown size={15} /></button>
            </div>
            {widget.content}
          </article>
        ))}
      </div>
    </div>
  );
}

const defaultOrder = ["total-cash", "money-snapshot", "protected-savings", "command", "balance", "bills", "inventory", "analytics", "activity", "progress", "objectives"];

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric-line"><span>{label}</span><strong>{formatCurrency(value)}</strong></div>;
}
