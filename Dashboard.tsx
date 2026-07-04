import { useEffect, useMemo, useState } from "react";
import { BriefingCard } from "./src/components/dashboard/BriefingCard";
import { MetricsGrid } from "./src/components/dashboard/MetricsGrid";
import { ObjectiveStack } from "./src/components/dashboard/ObjectiveStack";
import { PriorityAlerts } from "./src/components/dashboard/PriorityAlerts";
import { RecommendedMoveCard } from "./src/components/dashboard/RecommendedMoveCard";
import { Topbar } from "./src/components/layout/Topbar";
import { BillsModule } from "./src/components/modules/BillsModule";
import { DebtModule } from "./src/components/modules/DebtModule";
import { GoalsModule } from "./src/components/modules/GoalsModule";
import { IncomeModule } from "./src/components/modules/IncomeModule";
import { InventoryModule } from "./src/components/modules/InventoryModule";
import type { ModulePageProps } from "./src/components/modules/ModulePage";
import { MissionsModule } from "./src/components/modules/MissionsModule";
import { MoneySnapshotModule } from "./src/components/modules/MoneySnapshotModule";
import { SavingsModule } from "./src/components/modules/SavingsModule";
import { TransactionsModule } from "./src/components/modules/TransactionsModule";
import { PageHeader } from "./src/components/shared/PageHeader";
import { applyDerivedRow, money } from "./src/lib/calculations/helpers";
import { computeDecisionEngine, computeFinancialState } from "./src/lib/engine";
import { defaultSections, loadSections, saveSections, STORAGE_KEY } from "./src/lib/storage/vccStorage";
import type { Alert, AppView, Metrics, RecommendedMove, Row, Section, SectionKey } from "./src/lib/types/vcc";
import "./src/styles/vccSkin.css";

export default function Dashboard() {
  const [view, setView] = useState<AppView>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>(() => loadSections());

  useEffect(() => {
    saveSections(sections);
  }, [sections]);

  const financial = useMemo(() => computeFinancialState(sections), [sections]);
  const decision = useMemo(() => computeDecisionEngine(financial, sections), [financial, sections]);
  const metrics = financial.metrics;
  const recommendedMove = decision.recommendedMove;
  const activeSection = sections.find((section) => section.key === view);

  function open(nextView: AppView) {
    setView(nextView);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateCell(sectionKey: SectionKey, rowIndex: number, column: string, value: string) {
    if (sectionKey === "alerts") return;

    setSections((current) =>
      current.map((section) => {
        if (section.key !== sectionKey) return section;
        return {
          ...section,
          rows: section.rows.map((row, index) => {
            const nextRow = index === rowIndex ? { ...row, [column]: value } : row;
            return applyDerivedRow(section.key, nextRow);
          }),
        };
      })
    );
  }

  function addRow(sectionKey: SectionKey) {
    if (sectionKey === "alerts") return;

    setSections((current) =>
      current.map((section) => {
        if (section.key !== sectionKey) return section;
        const emptyRow = section.columns.reduce<Row>((nextRow, column) => {
          nextRow[column] = "";
          return nextRow;
        }, {});
        return { ...section, rows: [...section.rows, applyDerivedRow(section.key, emptyRow)] };
      })
    );
  }

  function deleteRow(sectionKey: SectionKey, rowIndex: number) {
    if (sectionKey === "alerts") return;

    setSections((current) =>
      current.map((section) =>
        section.key === sectionKey
          ? { ...section, rows: section.rows.filter((_, index) => index !== rowIndex) }
          : section
      )
    );
  }

  function resetSection(sectionKey: SectionKey) {
    if (sectionKey === "alerts") return;
    const confirmed = window.confirm("Reset this page to starter rows?");
    if (!confirmed) return;

    const original = defaultSections.find((section) => section.key === sectionKey);
    if (!original) return;

    setSections((current) =>
      current.map((section) =>
        section.key === sectionKey ? structuredClone(original) : section
      )
    );
  }

  function resetAllData() {
    const confirmedText = window.prompt("Type RESET to erase all VCC data and restore the starter setup.");
    if (confirmedText !== "RESET") return;

    localStorage.removeItem(STORAGE_KEY);
    setSections(structuredClone(defaultSections));
    setView("dashboard");
    setMenuOpen(false);
  }

  return (
    <main className="vcc">
      <Topbar view={view} menuOpen={menuOpen} sections={sections} setMenuOpen={setMenuOpen} open={open} />
      <ShellSidebar sections={sections} view={view} open={open} />


      {view === "dashboard" && (
        <DashboardHome
          sections={sections}
          metrics={metrics}
          alerts={decision.missionStack}
          recommendedMove={recommendedMove}
          open={open}
        />
      )}

      {view === "settings" && (
        <SettingsPage resetAllData={resetAllData} back={() => open("dashboard")} />
      )}

      {activeSection?.key === "alerts" && (
        <AlertsPage alerts={decision.priorityAlerts} open={open} back={() => open("dashboard")} />
      )}

      {activeSection && activeSection.key !== "alerts" && (
        <ModuleRoute
          section={activeSection}
          updateCell={updateCell}
          addRow={addRow}
          deleteRow={deleteRow}
          resetSection={resetSection}
          metrics={metrics}
          back={() => open("dashboard")}
        />
      )}
    </main>
  );
}

function DashboardHome({
  sections,
  metrics,
  alerts,
  recommendedMove,
  open,
}: {
  sections: Section[];
  metrics: Metrics;
  alerts: Alert[];
  recommendedMove: RecommendedMove;
  open: (view: AppView) => void;
}) {
  const topAlert = alerts[0];

  return (
    <section className="content dashboardShell">
      <DashboardTopRow alerts={alerts} />
      <BriefingCard topAlert={topAlert} open={open} />

      <div className="dashboardBoard">
        <div className="dashboardPrimary">
          <MetricsGrid metrics={metrics} alertCount={alerts.length} open={open} />

          <div className="dashboardMiddle">
            <DebtProgressPanel metrics={metrics} open={open} />
            <CashFlowPanel metrics={metrics} open={open} />
          </div>

          <div className="dashboardLower">
            <WeeklyStatsPanel metrics={metrics} open={open} />
            <TransactionsPreviewPanel metrics={metrics} open={open} />
          </div>
        </div>

        <aside className="dashboardRightRail">
          <BalancePanel metrics={metrics} open={open} />
          <AllocationPanel metrics={metrics} open={open} />
          <RecommendedMoveCard move={recommendedMove} open={open} />
        </aside>
      </div>

      <ModuleDock sections={sections} metrics={metrics} alerts={alerts} open={open} />
      <ObjectiveStack alerts={alerts} open={open} />
    </section>
  );
}

function DebtProgressPanel({ metrics, open }: { metrics: Metrics; open: (view: AppView) => void }) {
  const debtPercent = metrics.totalDebtBalance > 0
    ? Math.min(100, Math.round((metrics.debtPressure / metrics.totalDebtBalance) * 100))
    : 0;

  return (
    <button className="referencePanel debtReferencePanel" onClick={() => open("debt")}>
      <div className="panelHead">
        <h2>Debt</h2>
        <span>This month</span>
      </div>
      <ProgressLine label="Active debt" value={money(metrics.totalDebtBalance)} percent={debtPercent} tone="green" />
      <ProgressLine label="Payment pressure" value={money(metrics.debtPressure)} percent={Math.min(100, debtPercent + 18)} tone="yellow" />
      <ProgressLine label="Borrowed money" value={money(metrics.borrowedMoney)} percent={metrics.borrowedMoney > 0 ? 72 : 8} tone="blue" />
    </button>
  );
}

function ProgressLine({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: string;
  percent: number;
  tone: "green" | "yellow" | "blue";
}) {
  return (
    <div className={`progressLine ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <i style={{ width: `${Math.max(4, Math.min(100, percent))}%` }} />
    </div>
  );
}

function CashFlowPanel({ metrics, open }: { metrics: Metrics; open: (view: AppView) => void }) {
  return (
    <button className="referencePanel cashFlowReferencePanel" onClick={() => open("transactions")}>
      <div className="panelHead">
        <h2>Cash Flow</h2>
        <span>{money(metrics.transactionNet)}</span>
      </div>
      <div className="cashFlowLegend">
        <span><b></b>Income</span>
        <span><b></b>Costs</span>
      </div>
      <div className="referenceLineChart" aria-hidden="true">
        {["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, index) => (
          <div key={month}>
            <i style={{ height: `${34 + ((index * 19) % 54)}%` }} />
            <em style={{ height: `${24 + ((index * 31) % 62)}%` }} />
            <span>{month}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function WeeklyStatsPanel({ metrics, open }: { metrics: Metrics; open: (view: AppView) => void }) {
  const values = [
    metrics.weeklyIncome,
    metrics.billsPressure,
    metrics.debtPressure,
    metrics.protectedSavings,
    metrics.transactionNet,
    metrics.spendableCash,
    metrics.allowedWithdrawal,
  ];

  return (
    <button className="referencePanel statsReferencePanel" onClick={() => open("money")}>
      <div className="panelHead">
        <h2>Statistics</h2>
        <span>VCC week</span>
      </div>
      <div className="barChart" aria-hidden="true">
        {values.map((value, index) => (
          <div key={index}>
            <i style={{ height: `${Math.max(8, Math.min(96, Math.abs(value) / Math.max(metrics.weeklyIncome || 1, 1) * 84))}%` }} />
            <em style={{ height: `${20 + ((index * 17) % 70)}%` }} />
            <span>{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"][index]}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function TransactionsPreviewPanel({ metrics, open }: { metrics: Metrics; open: (view: AppView) => void }) {
  const rows = [
    ["Spendable Cash", "Money", money(metrics.spendableCash), metrics.spendableCash >= 0 ? "Ready" : "Blocked"],
    ["Bills Pressure", "Bills", money(metrics.billsPressure), metrics.overdueBills > 0 ? "Urgent" : "Watching"],
    ["Buy Next", "Inventory", metrics.buyNext || "Clear", metrics.criticalInventory > 0 ? "Needed" : "Stable"],
  ];

  return (
    <button className="referencePanel transactionReferencePanel" onClick={() => open("transactions")}>
      <div className="panelHead">
        <h2>Transactions</h2>
        <span>Filter</span>
      </div>
      <div className="previewTable">
        <div>
          <span>Company</span>
          <span>Category</span>
          <span>Sum</span>
          <span>Status</span>
        </div>
        {rows.map(([company, category, sum, status]) => (
          <div key={company}>
            <strong>{company}</strong>
            <span>{category}</span>
            <span>{sum}</span>
            <em>{status}</em>
          </div>
        ))}
      </div>
    </button>
  );
}

function BalancePanel({ metrics, open }: { metrics: Metrics; open: (view: AppView) => void }) {
  return (
    <button className="referencePanel balanceReferencePanel" onClick={() => open("money")}>
      <span>Card Balance</span>
      <strong>{money(metrics.operatingCash + metrics.savingsVault)}</strong>
    </button>
  );
}

function AllocationPanel({ metrics, open }: { metrics: Metrics; open: (view: AppView) => void }) {
  return (
    <button className="referencePanel allocationReferencePanel" onClick={() => open("money")}>
      <div className="panelHead">
        <h2>Categories</h2>
        <span>This day</span>
      </div>
      <div className="categoryRing">
        <strong>{money(metrics.totalPressure)}</strong>
        <small>In total</small>
      </div>
      <p><b></b>Bills <span>{money(metrics.billsPressure)}</span></p>
      <p><b></b>Debt <span>{money(metrics.debtPressure)}</span></p>
      <p><b></b>Borrowed <span>{money(metrics.borrowedMoney)}</span></p>
    </button>
  );
}

function ModuleDock({
  sections,
  metrics,
  alerts,
  open,
}: {
  sections: Section[];
  metrics: Metrics;
  alerts: Alert[];
  open: (view: AppView) => void;
}) {
  return (
    <div className="moduleDock">
      {["bills", "debt", "savings", "inventory", "goals", "transactions"].map((key) => {
        const section = sections.find((item) => item.key === key);
        if (!section) return null;
        const card = cardFor(section.key, metrics, alerts);
        return (
          <button key={section.key} className={`card ${card.tone}`} onClick={() => open(section.key)}>
            <p>{section.label}</p>
            <h2>{card.value}</h2>
            <span>{card.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function DashboardTopRow({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="dashboardTopRow">
      <div>
        <span>VCC Command Center</span>
        <h1>Dashboard</h1>
      </div>
      <div className="dashboardUtilities">
        <label className="dashboardSearch">
          <span>Search</span>
          <input readOnly placeholder="Search VCC OS" />
        </label>
        <div className="notificationPill">{alerts.length}</div>
        <div className="userPill">
          <strong>VCC</strong>
          <small>Local mode</small>
        </div>
      </div>
    </div>
  );
}

function ShellSidebar({
  sections,
  view,
  open,
}: {
  sections: Section[];
  view: AppView;
  open: (view: AppView) => void;
}) {
  const primaryItems: Array<{ view: AppView; label: string }> = [
    { view: "dashboard", label: "Dashboard" },
    ...sections
      .filter((section) => section.key !== "alerts")
      .map((section) => ({ view: section.key as AppView, label: section.label })),
  ];

  return (
    <aside className="shellSidebar" aria-label="VCC navigation">
      <button className="sideLogo" aria-label="Dashboard" onClick={() => open("dashboard")}>
        <span className="logo">V</span>
        <span>VCC OS</span>
      </button>
      <nav>
        {primaryItems.map((item) => (
          <button key={item.view} className={view === item.view ? "active" : ""} onClick={() => open(item.view)}>
            <span className="sideIcon">{sideIcon(item.view)}</span>
            <span className="sideLabel">{item.label}</span>
          </button>
        ))}
      </nav>
      <button className={view === "settings" ? "active sideSettings" : "sideSettings"} onClick={() => open("settings")}>
        <span className="sideIcon">S</span>
        <span className="sideLabel">Settings</span>
      </button>
    </aside>
  );
}

function sideIcon(view: AppView) {
  switch (view) {
    case "dashboard":
      return "D";
    case "money":
      return "$";
    case "bills":
      return "B";
    case "income":
      return "+";
    case "transactions":
      return "T";
    case "debt":
      return "!";
    case "savings":
      return "S";
    case "inventory":
      return "I";
    case "goals":
      return "G";
    case "missions":
      return "M";
    case "settings":
      return "S";
    case "alerts":
      return "A";
  }
}
function AlertsPage({
  alerts,
  open,
  back,
}: {
  alerts: Alert[];
  open: (view: AppView) => void;
  back: () => void;
}) {
  return (
    <section className="content">
      <PageHeader title="Priority Alerts" subtitle="Auto-generated blockers from your VCC data." back={back} />
      <PriorityAlerts alerts={alerts} open={open} />
    </section>
  );
}
function SettingsPage({
  resetAllData,
  back,
}: {
  resetAllData: () => void;
  back: () => void;
}) {
  const settingsCards = [
    {
      title: "Accounts",
      status: "Foundation ready",
      detail: "Future home for user profiles, account switching, connected money sources, and account-level controls.",
    },
    {
      title: "Login",
      status: "Planned",
      detail: "Future authentication. No login is active yet, so VCC stays fast and local for now.",
    },
    {
      title: "Theme Customization",
      status: "Planned",
      detail: "Future controls for colors, contrast, card styles, glow strength, and command-center themes.",
    },
    {
      title: "Layout / Style Modes",
      status: "Planned",
      detail: "Future layout options like compact, full dashboard, mobile-first, and spreadsheet-heavy modes.",
    },
    {
      title: "QR Codes",
      status: "Planned",
      detail: "Future QR codes for quick access, onboarding, and sharing VCC with new users.",
    },
    {
      title: "Quick Access",
      status: "Planned",
      detail: "Future shortcuts for the most-used pages, emergency actions, and daily update flows.",
    },
  ];

  return (
    <section className="content">
      <PageHeader
        title="Settings"
        subtitle="Control center for accounts, login, themes, layouts, QR codes, quick access, and dangerous reset actions."
        back={back}
      />

      <div className="settingsGrid">
        {settingsCards.map((card) => (
          <div key={card.title} className="settingsCard">
            <p>{card.status}</p>
            <h2>{card.title}</h2>
            <span>{card.detail}</span>
          </div>
        ))}
      </div>

      <div className="dangerZone">
        <p className="kicker">DANGER_ZONE</p>
        <h2>Reset All Data</h2>
        <p>
          This erases saved VCC data from this browser and restores the starter setup.
          It now lives inside Settings instead of the main dropdown so it is harder to hit by accident.
        </p>
        <button className="dangerButton" onClick={resetAllData}>
          RESET ALL DATA
        </button>
        <small>Protection: you must type RESET exactly before anything is erased.</small>
      </div>
    </section>
  );
}

function ModuleRoute(props: ModulePageProps) {
  switch (props.section.key) {
    case "money":
      return <MoneySnapshotModule {...props} />;
    case "bills":
      return <BillsModule {...props} />;
    case "income":
      return <IncomeModule {...props} />;
    case "transactions":
      return <TransactionsModule {...props} />;
    case "debt":
      return <DebtModule {...props} />;
    case "savings":
      return <SavingsModule {...props} />;
    case "inventory":
      return <InventoryModule {...props} />;
    case "goals":
      return <GoalsModule {...props} />;
    case "missions":
      return <MissionsModule {...props} />;
    case "alerts":
      return null;
  }
}
function cardFor(key: SectionKey, metrics: Metrics, alerts: Alert[]) {
  switch (key) {
    case "money":
      return {
        value: money(metrics.spendableCash),
        label: "Spendable Cash",
        detail: `Operating ${money(metrics.operatingCash)} · Pressure ${money(metrics.totalPressure)}`,
        tone: metrics.spendableCash < 0 ? "bad" : "good",
      };
    case "bills":
      return {
        value: money(metrics.billsPressure),
        label: `${metrics.unpaidBills} unpaid bills`,
        detail: `${metrics.overdueBills} overdue`,
        tone: metrics.unpaidBills > 0 ? "bad" : "good",
      };
    case "income":
      return {
        value: money(metrics.weeklyIncome + metrics.otherIncome),
        label: "Live income",
        detail: `Weekly ${money(metrics.weeklyIncome)} plus other ${money(metrics.otherIncome)}`,
        tone: "good",
      };
    case "transactions":
      return {
        value: money(metrics.transactionNet),
        label: "Transaction net",
        detail: "Income minus spending",
        tone: metrics.transactionNet < 0 ? "bad" : "neutral",
      };
    case "debt":
      return {
        value: money(metrics.debtPressure),
        label: "Debt payment pressure",
        detail: `${metrics.activeDebt} active debts. Balance ${money(metrics.totalDebtBalance)}`,
        tone: metrics.activeDebt > 0 ? "bad" : "good",
      };
    case "savings":
      return {
        value: money(metrics.protectedSavings),
        label: "Protected savings",
        detail: `Allowed pull ${money(metrics.allowedWithdrawal)}`,
        tone: metrics.protectedSavings > 0 ? "good" : "neutral",
      };
    case "inventory":
      return {
        value: String(metrics.criticalInventory),
        label: "Buy Next",
        detail: metrics.buyNext ? `Buy next: ${metrics.buyNext}` : "Food, gas, home, car",
        tone: metrics.criticalInventory > 0 ? "warn" : "good",
      };
    case "goals":
      return {
        value: `${metrics.avgGoalProgress}%`,
        label: "Average progress",
        detail: "High-level growth",
        tone: "neutral",
      };
    case "missions":
      return {
        value: String(metrics.openMissions),
        label: "Open missions",
        detail: "Daily execution",
        tone: metrics.openMissions > 0 ? "neutral" : "good",
      };
    case "alerts":
      return {
        value: String(alerts.length),
        label: "Auto blockers",
        detail: "Read-only system view",
        tone: alerts.length > 0 ? "bad" : "good",
      };
  }
}


