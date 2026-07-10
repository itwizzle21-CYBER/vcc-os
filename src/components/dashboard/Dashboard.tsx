import {
  ArrowUpRight,
  Bell,
  Boxes,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
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
  const order = normalizeWidgetOrder(settings.widgetOrder);

  const widgets: Widget[] = [
    {
      id: "command",
      className: "mission-control-card",
      content: (
        <a href="/missions" className="widget-link command-surface">
          <div className="command-orbit" aria-hidden="true" />
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Command Center</p>
              <h2>{decisionState.todayBriefing}</h2>
            </div>
            <ShieldCheck size={22} />
          </div>
          <div className="recommended command-recommendation">
            <span>Today&apos;s Recommended</span>
            <strong>{decisionState.recommendedMove}</strong>
          </div>
        </a>
      ),
    },
    {
      id: "total-cash",
      className: "widget-kpi",
      content: <KpiLink href="/money" label="Total Cash" value={financialState.totalCash} detail="Across money sources" icon={<Wallet size={18} />} />,
    },
    {
      id: "money-snapshot",
      className: "widget-kpi",
      content: <KpiLink href="/money" label="Spendable Cash" value={financialState.spendableCash} detail="After planned repayments" icon={<Sparkles size={18} />} />,
    },
    {
      id: "protected-savings",
      className: "widget-kpi",
      content: <KpiLink href="/savings" label="Protected Savings" value={financialState.protectedSavings} detail="Shielded from spending" icon={<Landmark size={18} />} />,
    },
    {
      id: "balance",
      className: "dashboard-side-card",
      content: (
        <a href="/money" className="widget-link balance-surface">
          <div>
            <p className="eyebrow">Money Snapshot</p>
            <h2>{formatCurrency(financialState.safeToSpend)}</h2>
            <span>Safe To Spend</span>
          </div>
          <div className="balance-list">
            <Metric label="Total Cash" value={financialState.totalCash} />
            <Metric label="Spendable Cash" value={financialState.spendableCash} />
            <Metric label="Protected Savings" value={financialState.protectedSavings} />
            <Metric label="Available Savings" value={financialState.availableSavings} />
            <Metric label="Borrowed Money" value={financialState.borrowedMoney} />
          </div>
        </a>
      ),
    },
    {
      id: "bills",
      className: "compact-action-card",
      content: (
        <a href="/bills" className="widget-link focus-widget">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Bills + Pressure</p>
              <h2>{financialState.billsDueThisWeek} due this week</h2>
            </div>
            <ReceiptText size={20} />
          </div>
          <strong className="focus-value">{formatCurrency(financialState.billsPressure)}</strong>
          <p>{financialState.overdueBills} overdue, {financialState.billsDueToday} due today</p>
        </a>
      ),
    },
    {
      id: "inventory",
      className: "compact-action-card",
      content: (
        <a href="/inventory" className="widget-link focus-widget">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2>{financialState.buyNextCount} items need action</h2>
            </div>
            <Boxes size={20} />
          </div>
          <strong className="focus-value">{formatCurrency(financialState.estimatedRefillCost)}</strong>
          <p>{financialState.criticalItems} critical, {financialState.lowStock} low stock</p>
        </a>
      ),
    },
    {
      id: "analytics",
      className: "dashboard-chart-card",
      content: (
        <a href="/reports" className="widget-link analytics-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Cash Flow</p>
              <h2>Financial movement</h2>
            </div>
            <ArrowUpRight size={18} />
          </div>
          <div className="analytics-split">
            <div className="bars compact-bars">
              {financialState.cashFlow.map((bar) => (
                <div key={bar.label}>
                  <span>{bar.label}</span>
                  <div>
                    <i style={{ height: `${Math.max(8, Math.min(100, bar.income / 60))}%` }} />
                    <b style={{ height: `${Math.max(8, Math.min(100, bar.spending / 60))}%` }} />
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
      ),
    },
    {
      id: "activity",
      className: "dashboard-activity-card",
      content: (
        <div className="widget-link">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>Priority alerts</h2>
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
        </div>
      ),
    },
    {
      id: "progress",
      className: "dashboard-progress-card",
      content: (
        <a href="/debt" className="widget-link progress-surface">
          <p className="eyebrow">Debt Progress</p>
          <h2>{formatCurrency(financialState.totalDebt)}</h2>
          <div className="progress-track">
            <div style={{ width: `${financialState.debtFreePercent}%` }} />
          </div>
          <p>{financialState.debtFreePercent.toFixed(0)}% debt-free progress</p>
          <small>Next payoff: {financialState.nextPayoff}</small>
        </a>
      ),
    },
    {
      id: "objectives",
      className: "dashboard-objectives-card",
      content: (
        <div className="widget-link">
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
    <div className="dashboard-board dashboard-redesign">
      <div className="dashboard-intro">
        <div>
          <p className="eyebrow">Mission Control</p>
          <h2>Financial command board</h2>
        </div>
        <a href="/reports">Open Reports</a>
      </div>
      <div className="widget-board premium-widget-board" aria-label="Customizable dashboard widgets">
        {visible.map((widget) => (
          <article
            key={widget.id}
            className={`dashboard-widget premium-widget ${widget.className} ${draggedId === widget.id ? "is-dragging" : ""}`}
            draggable
            onDragStart={() => setDraggedId(widget.id)}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropWidget(widget.id)}
          >
            <div className="widget-controls">
              <button type="button" className="drag-handle" aria-label={`Drag ${widget.id} widget`} title="Drag to rearrange">
                <GripVertical size={16} />
              </button>
              <button type="button" aria-label={`Move ${widget.id} widget up`} onClick={() => moveWidget(widget.id, -1)}>
                <ChevronUp size={15} />
              </button>
              <button type="button" aria-label={`Move ${widget.id} widget down`} onClick={() => moveWidget(widget.id, 1)}>
                <ChevronDown size={15} />
              </button>
            </div>
            {widget.content}
          </article>
        ))}
      </div>
    </div>
  );
}

const defaultOrder = ["command", "total-cash", "money-snapshot", "protected-savings", "balance", "bills", "inventory", "analytics", "activity", "progress", "objectives"];
const oldDefaultOrder = ["total-cash", "money-snapshot", "protected-savings", "command", "balance", "bills", "inventory", "analytics", "activity", "progress", "objectives"];

function normalizeWidgetOrder(order?: string[]) {
  if (!order?.length) return defaultOrder;
  if (order.join("|") === oldDefaultOrder.join("|")) return defaultOrder;
  const known = new Set(defaultOrder);
  const existing = order.filter((id) => known.has(id));
  const missing = defaultOrder.filter((id) => !existing.includes(id));
  return [...existing, ...missing];
}

function KpiLink({ href, label, value, detail, icon }: { href: string; label: string; value: number; detail: string; icon: ReactNode }) {
  return (
    <a href={href} className="widget-link kpi-content premium-kpi">
      <span className="kpi-icon">{icon}</span>
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
      <small>{detail}</small>
    </a>
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
