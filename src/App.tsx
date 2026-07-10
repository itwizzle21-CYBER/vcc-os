import { useEffect, useMemo, useState } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./components/dashboard/Dashboard";
import PaycheckPlanner from "./components/modules/PaycheckPlanner";
import Spreadsheet from "./components/shared/Spreadsheet";
import SummaryGrid from "./components/shared/SummaryGrid";
import { formatCurrency } from "./lib/calculations/currency";
import { computeDecisionEngine } from "./lib/engine/decisionEngine";
import { computeFinancialState } from "./lib/engine/financialEngine";
import { categorizeItem, getInventoryAlert, normalizeInventoryRow } from "./lib/engine/inventoryEngine";
import { sectionConfigs } from "./lib/storage/defaultData";
import { loadAppData, resetAllData, resetSection, saveAppData } from "./lib/storage/localStore";
import type { AppData, SectionKey, SpreadsheetRow } from "./lib/types/app";

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const path = normalizePath(window.location.pathname);
  const financialState = useMemo(() => computeFinancialState(data), [data]);
  const decisionState = useMemo(() => computeDecisionEngine(financialState, data), [financialState, data]);

  useEffect(() => {
    saveAppData(data);
    document.documentElement.dataset.theme = data.settings.theme;
    document.documentElement.dataset.accent = data.settings.accent;
    document.documentElement.dataset.density = data.settings.density;
    document.documentElement.dataset.surface = data.settings.surfaceStyle;
  }, [data]);

  function updateData(next: AppData) {
    setData({
      ...next,
      sections: {
        ...next.sections,
        inventory: next.sections.inventory.map(normalizeInventoryRow),
      },
    });
  }

  function updateRows(section: SectionKey, rows: SpreadsheetRow[]) {
    const nextRows = section === "money" ? autoFillMoneyWeek(rows, data) : rows;
    updateData({ ...data, sections: { ...data.sections, [section]: nextRows } });
  }

  function updateSort(section: SectionKey, sortBy: string) {
    updateData({ ...data, sortBy: { ...data.sortBy, [section]: sortBy } });
  }

  function handleResetSection(section: SectionKey) {
    updateData(resetSection(data, section));
  }

  return (
    <AppShell currentPath={path} settings={data.settings} data={data} onSettingsChange={(settings) => updateData({ ...data, settings })}>
      {path === "/" && <Dashboard financialState={financialState} decisionState={decisionState} settings={data.settings} onSettingsChange={(settings) => updateData({ ...data, settings })} />}
      {path === "/money" && (
        <ModulePage section="money" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} header={<PaycheckPlanner data={data} onChange={updateData} />} />
      )}
      {path === "/bills" && <ModulePage section="bills" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/income" && <ModulePage section="income" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/transactions" && <ModulePage section="transactions" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {(path === "/debt" || path === "/debts") && <ModulePage section="debt" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/savings" && <ModulePage section="savings" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/inventory" && <InventoryPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/goals" && <ModulePage section="goals" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/reports" && <ReportsPage financialState={financialState} decisionState={decisionState} />}
      {path === "/missions" && <MissionsPage decisionState={decisionState} />}
      {path === "/settings" && <SettingsPage data={data} onChange={updateData} />}
    </AppShell>
  );
}

function ModulePage({
  section,
  data,
  financialState,
  updateRows,
  updateSort,
  resetSection,
  header,
}: {
  section: SectionKey;
  data: AppData;
  financialState: ReturnType<typeof computeFinancialState>;
  updateRows: (section: SectionKey, rows: SpreadsheetRow[]) => void;
  updateSort: (section: SectionKey, sortBy: string) => void;
  resetSection: (section: SectionKey) => void;
  header?: React.ReactNode;
}) {
  return (
    <div className="module-page">
      <SummaryGrid items={summaryForSection(section, financialState)} />
      {header}
      <Spreadsheet
        config={sectionConfigs[section]}
        rows={data.sections[section]}
        sortBy={data.sortBy[section]}
        onSortChange={updateSort}
        onRowsChange={updateRows}
        onResetSection={resetSection}
        getComputedCell={(row, columnKey) => computedCell(section, row, columnKey)}
      />
    </div>
  );
}

function InventoryPage(props: Omit<Parameters<typeof ModulePage>[0], "section">) {
  return (
    <div className="module-page">
      <SummaryGrid items={summaryForSection("inventory", props.financialState)} />
      <section className="buy-next-panel" id="buy-next">
        <div>
          <p className="eyebrow">Buy Next</p>
          <h2>Inventory below minimum</h2>
        </div>
        <div className="buy-next-grid">
          {props.financialState.buyNextRows.slice(0, 8).map((row) => (
            <a key={row.id} href="/inventory">
              <span>{row.cells.alert}</span>
              <strong>{row.cells.item || "Unnamed item"}</strong>
              <small>{row.cells.cost ? `Estimated ${row.cells.cost}` : "No cost entered"}</small>
            </a>
          ))}
        </div>
      </section>
      <Spreadsheet
        config={sectionConfigs.inventory}
        rows={props.data.sections.inventory}
        sortBy={props.data.sortBy.inventory}
        onSortChange={props.updateSort}
        onRowsChange={props.updateRows}
        onResetSection={props.resetSection}
        getComputedCell={(row, columnKey) => computedCell("inventory", row, columnKey)}
        preventDuplicateKey="item"
      />
    </div>
  );
}

function ReportsPage({
  financialState,
  decisionState,
}: {
  financialState: ReturnType<typeof computeFinancialState>;
  decisionState: ReturnType<typeof computeDecisionEngine>;
}) {
  const reportSummary = [
    { label: "Total Cash", value: financialState.totalCash },
    { label: "Monthly Spending", value: financialState.monthlySpending },
    { label: "Bills Pressure", value: financialState.billsPressure, tone: "warn" as const },
    { label: "Safe To Spend", value: financialState.safeToSpend },
  ];
  const highestCashFlowValue = Math.max(
    1,
    ...financialState.cashFlow.flatMap((item) => [Math.abs(item.income), Math.abs(item.spending)])
  );
  const categoryRows = financialState.categorySummary.length
    ? financialState.categorySummary
    : [{ label: "No category spend", amount: 0 }];

  return (
    <div className="reports-page">
      <SummaryGrid items={reportSummary} />
      <section className="reports-grid">
        <article className="panel report-card report-card-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Cash Flow Trend</p>
              <h2>Income and spending</h2>
            </div>
            <a href="/transactions" className="report-link">Transactions</a>
          </div>
          <div className="report-bars" aria-label="Cash flow report">
            {financialState.cashFlow.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <div>
                  <i style={{ height: `${Math.max(8, (Math.abs(item.income) / highestCashFlowValue) * 100)}%` }} />
                  <b style={{ height: `${Math.max(8, (Math.abs(item.spending) / highestCashFlowValue) * 100)}%` }} />
                </div>
                <small>{formatCurrency(item.income)} in</small>
                <small>{formatCurrency(item.spending)} out</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel report-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Spending By Category</p>
              <h2>Where money is going</h2>
            </div>
            <a href="/transactions" className="report-link">Open</a>
          </div>
          <div className="report-list">
            {categoryRows.map((category) => (
              <a key={category.label} href="/transactions">
                <span>{category.label}</span>
                <strong>{formatCurrency(category.amount)}</strong>
              </a>
            ))}
          </div>
        </article>

        <article className="panel report-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Decision Pulse</p>
              <h2>Current recommendation</h2>
            </div>
            <a href="/missions" className="report-link">Missions</a>
          </div>
          <div className="report-callout">
            <strong>{decisionState.recommendedMove}</strong>
            <span>{decisionState.todayBriefing}</span>
          </div>
        </article>

        <article className="panel report-card report-card-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Financial Position</p>
              <h2>Snapshot health</h2>
            </div>
            <a href="/money" className="report-link">Money</a>
          </div>
          <div className="report-metric-grid">
            <ReportMetric label="Borrowed Money" value={financialState.borrowedMoney} href="/money" />
            <ReportMetric label="Protected Savings" value={financialState.protectedSavings} href="/savings" />
            <ReportMetric label="Total Debt" value={financialState.totalDebt} href="/debt" />
            <ReportMetric label="Refill Cost" value={financialState.estimatedRefillCost} href="/inventory" />
          </div>
        </article>
      </section>
    </div>
  );
}

function MissionsPage({ decisionState }: { decisionState: ReturnType<typeof computeDecisionEngine> }) {
  return (
    <div className="missions-page">
      <section className="panel">
        <p className="eyebrow">Today Briefing</p>
        <h2>{decisionState.recommendedMove}</h2>
        <p>{decisionState.todayBriefing}</p>
      </section>
      <section className="mission-columns">
        <div className="panel">
          <p className="eyebrow">Priority Alerts</p>
          {decisionState.priorityAlerts.map((alert) => (
            <div key={alert.title} className={`alert-row ${alert.tone}`}>
              <strong>{alert.title}</strong>
              <span>{alert.detail}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <p className="eyebrow">Mission Stack</p>
          {decisionState.missionStack.map((mission) => (
            <div key={mission.title} className="mission-row">
              <strong>{mission.title}</strong>
              <span>{mission.detail}</span>
              <em>{mission.priority}</em>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportMetric({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <a href={href}>
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
    </a>
  );
}

function SettingsPage({ data, onChange }: { data: AppData; onChange: (data: AppData) => void }) {
  return (
    <div className="settings-page">
      <section className="panel settings-hero">
        <div>
          <p className="eyebrow">Account</p>
          <h2>{data.settings.accountName || "Local Account"}</h2>
          <p>Profile, local mode, appearance, notifications, density, and data controls.</p>
        </div>
        <div className="settings-status-grid">
          <span>{data.settings.localMode ? "Local Mode On" : "Cloud Mode Ready"}</span>
          <span>{data.settings.notificationsEnabled ? "Notifications On" : "Notifications Off"}</span>
          <span>{data.settings.density} density</span>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Profile</p>
        <h2>Account Details</h2>
        <div className="settings-grid">
          <SettingInput label="Greeting name" value={data.settings.accountName} onChange={(accountName) => onChange({ ...data, settings: { ...data.settings, accountName } })} />
          <SettingInput label="Profile label" value={data.settings.profileLabel} onChange={(profileLabel) => onChange({ ...data, settings: { ...data.settings, profileLabel } })} />
          <SettingToggle label="VCC Local Mode" checked={data.settings.localMode} onChange={(localMode) => onChange({ ...data, settings: { ...data.settings, localMode } })} />
          <SettingToggle label="Notifications" checked={data.settings.notificationsEnabled} onChange={(notificationsEnabled) => onChange({ ...data, settings: { ...data.settings, notificationsEnabled } })} />
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Customization</p>
        <h2>Workspace Settings</h2>
        <div className="settings-grid">
          <SettingSelect label="Theme mode" value={data.settings.theme} options={["dark", "midnight", "slate", "light"]} onChange={(theme) => onChange({ ...data, settings: { ...data.settings, theme: theme as AppData["settings"]["theme"] } })} />
          <SettingSelect label="Accent color" value={data.settings.accent} options={["blue", "green", "gold", "purple", "red"]} onChange={(accent) => onChange({ ...data, settings: { ...data.settings, accent: accent as AppData["settings"]["accent"] } })} />
          <SettingSelect label="Layout density" value={data.settings.density} options={["comfortable", "compact", "ultra"]} onChange={(density) => onChange({ ...data, settings: { ...data.settings, density: density as AppData["settings"]["density"] } })} />
          <SettingSelect label="Surface style" value={data.settings.surfaceStyle} options={["glass", "neumorphic", "minimal"]} onChange={(surfaceStyle) => onChange({ ...data, settings: { ...data.settings, surfaceStyle: surfaceStyle as AppData["settings"]["surfaceStyle"] } })} />
          <SettingToggle label="Confirm before reset" checked={data.settings.confirmBeforeReset} onChange={(confirmBeforeReset) => onChange({ ...data, settings: { ...data.settings, confirmBeforeReset } })} />
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Dashboard Widgets</p>
        <h2>Choose What Appears</h2>
        <p className="settings-copy">Drag widgets on the dashboard to reorder them. Hidden widgets stay available here.</p>
        <div className="widget-settings-grid">
          {widgetOptions.map((widget) => (
            <SettingToggle
              key={widget.id}
              label={widget.label}
              checked={!data.settings.hiddenWidgets.includes(widget.id)}
              onChange={(visible) => onChange({
                ...data,
                settings: {
                  ...data.settings,
                  hiddenWidgets: visible
                    ? data.settings.hiddenWidgets.filter((id) => id !== widget.id)
                    : [...data.settings.hiddenWidgets, widget.id],
                },
              })}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Data Health</p>
        <h2>Local Spreadsheet Storage</h2>
        <div className="settings-status-grid">
          <span>Money rows: {data.sections.money.length}</span>
          <span>Bills rows: {data.sections.bills.length}</span>
          <span>Transactions rows: {data.sections.transactions.length}</span>
          <span>Inventory rows: {data.sections.inventory.length}</span>
        </div>
      </section>

      <section className="panel danger-panel">
        <p className="eyebrow">Data Controls</p>
        <h2>Reset All Data To Zero</h2>
        <p>Clears all spreadsheet rows and leaves every section empty until you add new rows.</p>
        <button
          type="button"
          onClick={() => {
            if (!data.settings.confirmBeforeReset || window.confirm("Reset all VCC OS data to zero? This clears local spreadsheet values.")) {
              onChange({ ...resetAllData(), settings: data.settings });
            }
          }}
        >
          Zero All Data
        </button>
      </section>
    </div>
  );
}

const widgetOptions = [
  { id: "total-cash", label: "Total Cash" },
  { id: "money-snapshot", label: "Spendable Cash" },
  { id: "protected-savings", label: "Protected Savings" },
  { id: "command", label: "Command Center" },
  { id: "balance", label: "Money Snapshot" },
  { id: "bills", label: "Bills + Pressure" },
  { id: "inventory", label: "Inventory" },
  { id: "analytics", label: "Cash Flow + Categories" },
  { id: "activity", label: "Activity Alerts" },
  { id: "progress", label: "Debt Progress" },
  { id: "objectives", label: "Objective Stack" },
];

function SettingInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SettingToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="setting-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function SettingSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function summaryForSection(section: SectionKey, financialState: ReturnType<typeof computeFinancialState>) {
  return {
    money: [
      { label: "Total Cash", value: financialState.totalCash },
      { label: "Spendable Cash", value: financialState.spendableCash },
      { label: "Safe To Spend", value: financialState.safeToSpend },
      { label: "Protected Savings", value: financialState.protectedSavings },
      { label: "Available Savings", value: financialState.availableSavings },
      { label: "Weekly Income", value: financialState.weeklyIncome },
      { label: "Monthly Income", value: financialState.monthlyIncome },
      { label: "Received Income", value: financialState.receivedIncome },
      { label: "Borrowed Money", value: financialState.borrowedMoney, tone: "warn" as const },
    ],
    bills: [
      { label: "Bills Due Today", value: String(financialState.billsDueToday) },
      { label: "Bills Due This Week", value: String(financialState.billsDueThisWeek) },
      { label: "Overdue Bills", value: String(financialState.overdueBills), tone: "bad" as const },
      { label: "Bills Pressure", value: financialState.billsPressure, tone: "warn" as const },
    ],
    income: [
      { label: "Weekly Income", value: financialState.weeklyIncome },
      { label: "Monthly Income", value: financialState.monthlyIncome },
      { label: "Received Income", value: financialState.receivedIncome },
      { label: "Paycheck Status", value: "Planner ready" },
    ],
    transactions: [
      { label: "Weekly Spending", value: financialState.weeklySpending },
      { label: "Monthly Spending", value: financialState.monthlySpending },
      { label: "Weekly Income", value: financialState.weeklyIncome },
      { label: "Monthly Income", value: financialState.monthlyIncome },
      { label: "Largest Expense", value: financialState.largestExpense },
      { label: "Last Transaction", value: financialState.lastTransaction },
    ],
    debt: [
      { label: "Total Debt", value: financialState.totalDebt, tone: "bad" as const },
      { label: "Minimum Payments", value: financialState.minimumPayments },
      { label: "Next Payoff", value: financialState.nextPayoff },
      { label: "Debt-Free %", value: `${financialState.debtFreePercent.toFixed(0)}%` },
    ],
    savings: [
      { label: "Protected Savings", value: financialState.protectedSavings },
      { label: "Available Savings", value: financialState.availableSavings },
      { label: "Emergency Fund", value: financialState.emergencyFund },
      { label: "Goal Savings", value: financialState.goalSavings },
    ],
    inventory: [
      { label: "Critical Items", value: String(financialState.criticalItems), tone: "bad" as const },
      { label: "Low Stock", value: String(financialState.lowStock), tone: "warn" as const },
      { label: "Buy Next", value: String(financialState.buyNextCount) },
      { label: "Estimated Refill Cost", value: financialState.estimatedRefillCost },
    ],
    goals: [
      { label: "Goals Complete", value: String(financialState.goalsComplete) },
      { label: "Closest Goal", value: financialState.closestGoal },
      { label: "Completion %", value: `${financialState.goalCompletionPercent.toFixed(0)}%` },
      { label: "Estimated Finish", value: financialState.estimatedFinish },
    ],
  }[section];
}

function computedCell(section: SectionKey, row: SpreadsheetRow, columnKey: string): string | undefined {
  if (section === "inventory") {
    if (columnKey === "category") return row.cells.item ? categorizeItem(row.cells.item) : "";
    if (columnKey === "alert") return getInventoryAlert(row.cells.qty || "", row.cells.minNeeded || "");
  }
  if (section === "debt" && columnKey === "priority") {
    const balance = Number(String(row.cells.balance || "").replace(/[$,\s]/g, ""));
    return balance > 5000 ? "High" : balance > 0 ? "Normal" : "";
  }
  if (section === "goals" && columnKey === "autoAlert") {
    const current = Number(String(row.cells.current || "").replace(/[$,\s]/g, ""));
    const target = Number(String(row.cells.target || "").replace(/[$,\s]/g, ""));
    if (!target) return "";
    return current >= target ? "Complete" : `${Math.max(0, Math.round((current / target) * 100))}%`;
  }
  return undefined;
}

function autoFillMoneyWeek(rows: SpreadsheetRow[], data: AppData): SpreadsheetRow[] {
  if (!data.paycheckPlanner.locked) return rows;
  return rows.map((row) => {
    if (row.cells.weekStart || row.cells.weekEnd) return row;
    return { ...row, cells: { ...row.cells, weekStart: data.paycheckPlanner.weekStart, weekEnd: data.paycheckPlanner.weekEnd } };
  });
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}
