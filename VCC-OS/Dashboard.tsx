import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";

type SectionKey =
  | "moneySnapshot"
  | "weeklyCash"
  | "missions"
  | "alerts"
  | "buyNext"
  | "goals"
  | "bills"
  | "debt"
  | "savings";

type PageView = "home" | SectionKey;
type Row = Record<string, string>;

type Section = {
  key: SectionKey;
  label: string;
  title: string;
  subtitle: string;
  status: string;
  group: "briefing" | "command" | "finance";
  columns: string[];
  rows: Row[];
};

type AlertItem = {
  alert: string;
  source: SectionKey;
  urgency: "Critical" | "High" | "Medium";
  proof: string;
  action: string;
};

type Metrics = {
  cashOnHand: number;
  monthlyIncome: number;
  monthlyBills: number;
  weeklyIncome: number;
  weeklyBills: number;
  foodNeeded: number;
  gasNeeded: number;
  myPayOwed: number;
  spotMeOwed: number;
  emergencySavings: number;
  remainingCash: number;
  snapshotPressure: number;
  weeklyOutflow: number;
  weeklyNet: number;
  openMissions: number;
  criticalBuyNext: number;
  avgGoalProgress: number;
  unpaidBills: number;
  billTotal: number;
  activeDebt: number;
  debtTotal: number;
  savingsAmount: number;
};

type Briefing = {
  title: string;
  action: string;
  why: string;
  priority: SectionKey;
  objectives: AlertItem[];
  proof: { label: string; value: string; source: SectionKey }[];
};

const STORAGE_KEY = "vcc_os_briefing_objective_stack_v1";

const defaultSections: Section[] = [
  {
    key: "moneySnapshot",
    label: "Money Snapshot",
    title: "Money Snapshot",
    subtitle: "Cash on hand, income, bills, survival needs, borrow pressure, and remaining cash.",
    status: "INPUT",
    group: "briefing",
    columns: ["Category", "Amount", "Status", "Priority", "Notes"],
    rows: [
      { Category: "Cash On Hand", Amount: "", Status: "Needs update", Priority: "Critical", Notes: "Money physically available right now." },
      { Category: "Monthly Income", Amount: "", Status: "Needs update", Priority: "High", Notes: "Expected monthly income." },
      { Category: "Monthly Bills", Amount: "", Status: "Needs update", Priority: "High", Notes: "Expected monthly bills." },
      { Category: "Weekly Income", Amount: "", Status: "Needs update", Priority: "High", Notes: "Expected weekly income." },
      { Category: "Weekly Bills", Amount: "", Status: "Needs update", Priority: "High", Notes: "Bills due this week." },
      { Category: "Food Needed", Amount: "", Status: "Needs update", Priority: "Critical", Notes: "Food money needed soon." },
      { Category: "Gas Needed", Amount: "", Status: "Needs update", Priority: "Critical", Notes: "Gas money needed soon." },
      { Category: "MyPay Owed", Amount: "", Status: "Needs update", Priority: "High", Notes: "Money borrowed from MyPay." },
      { Category: "SpotMe Owed", Amount: "", Status: "Needs update", Priority: "High", Notes: "SpotMe balance owed." },
      { Category: "Emergency Savings", Amount: "", Status: "Needs update", Priority: "High", Notes: "Starter emergency buffer." },
      { Category: "Remaining Cash", Amount: "", Status: "Auto / Manual", Priority: "High", Notes: "Leave blank to let VCC estimate from cash and pressure." },
    ],
  },
  {
    key: "weeklyCash",
    label: "Weekly Cash",
    title: "Weekly Cash Flow",
    subtitle: "Weekly income, spending, borrows, rollover, and true cashflow.",
    status: "TRACK",
    group: "briefing",
    columns: ["Week", "Income", "Bills", "Spending", "Borrowed", "Rollover", "Net", "Notes"],
    rows: [
      { Week: currentWeekLabel(), Income: "", Bills: "", Spending: "", Borrowed: "", Rollover: "", Net: "", Notes: "" },
    ],
  },
  {
    key: "missions",
    label: "Missions",
    title: "Mission Log",
    subtitle: "Daily actions that move life forward.",
    status: "ACTIVE",
    group: "command",
    columns: ["Mission", "Priority", "Status", "Due Date", "Next Action", "Notes"],
    rows: [
      { Mission: "Update VCC numbers", Priority: "High", Status: "Open", "Due Date": today(), "Next Action": "Enter money, bills, debt, cash, and priorities", Notes: "" },
      { Mission: "Choose one money move", Priority: "High", Status: "Open", "Due Date": today(), "Next Action": "Decide what gets paid, delayed, or handled first", Notes: "" },
    ],
  },
  {
    key: "alerts",
    label: "Priority Alerts",
    title: "Priority Alerts",
    subtitle: "Auto-generated view of what can block financial freedom if ignored.",
    status: "AUTO",
    group: "command",
    columns: [],
    rows: [],
  },
  {
    key: "buyNext",
    label: "Buy Next",
    title: "Buy Next Queue",
    subtitle: "Inventory and purchase priorities.",
    status: "READY",
    group: "command",
    columns: ["Item", "Category", "Current Level", "Urgency", "Estimated Cost", "Buy Status", "Notes"],
    rows: [
      { Item: "Food", Category: "House", "Current Level": "Low", Urgency: "Critical", "Estimated Cost": "", "Buy Status": "Needed", Notes: "" },
      { Item: "Gas", Category: "Car", "Current Level": "Low", Urgency: "High", "Estimated Cost": "", "Buy Status": "Needed", Notes: "" },
    ],
  },
  {
    key: "goals",
    label: "Goal Progress",
    title: "Goal Progress",
    subtitle: "Progress tracking for the bigger mission.",
    status: "BUILDING",
    group: "command",
    columns: ["Goal", "Category", "Target", "Current", "Progress %", "Priority", "Next Step", "Notes"],
    rows: [
      { Goal: "VCC recovery", Category: "System", Target: "Working app", Current: "Dashboard online", "Progress %": "80", Priority: "High", "Next Step": "Briefing objective stack", Notes: "" },
      { Goal: "Emergency fund", Category: "Money", Target: "500", Current: "0", "Progress %": "0", Priority: "High", "Next Step": "Save first small amount", Notes: "" },
    ],
  },
  {
    key: "bills",
    label: "Bills Due",
    title: "Bills Due",
    subtitle: "Upcoming, unpaid, paid, and overdue bills.",
    status: "CHECK",
    group: "finance",
    columns: ["Bill", "Due Date", "Amount", "Status", "Paid Date", "Priority", "Notes"],
    rows: [
      { Bill: "Car note", "Due Date": "", Amount: "", Status: "Unpaid", "Paid Date": "", Priority: "High", Notes: "" },
      { Bill: "Phone", "Due Date": "", Amount: "", Status: "Unpaid", "Paid Date": "", Priority: "High", Notes: "" },
      { Bill: "Insurance", "Due Date": "", Amount: "", Status: "Unpaid", "Paid Date": "", Priority: "High", Notes: "" },
    ],
  },
  {
    key: "debt",
    label: "Debt",
    title: "Debt Command",
    subtitle: "Car balance, MyPay, SpotMe, and debt pressure.",
    status: "TRACK",
    group: "finance",
    columns: ["Debt", "Starting Balance", "Current Balance", "Payment", "Due Date", "Status", "Notes"],
    rows: [
      { Debt: "Car balance", "Starting Balance": "", "Current Balance": "", Payment: "", "Due Date": "", Status: "Active", Notes: "" },
      { Debt: "MyPay", "Starting Balance": "", "Current Balance": "", Payment: "", "Due Date": "", Status: "Active", Notes: "" },
      { Debt: "SpotMe", "Starting Balance": "", "Current Balance": "", Payment: "", "Due Date": "", Status: "Active", Notes: "" },
    ],
  },
  {
    key: "savings",
    label: "Savings",
    title: "Savings Vault",
    subtitle: "Emergency money, move-out money, and future goals.",
    status: "EMPTY",
    group: "finance",
    columns: ["Goal", "Target Amount", "Current Amount", "Needed", "Priority", "Deadline", "Notes"],
    rows: [
      { Goal: "Emergency fund", "Target Amount": "500", "Current Amount": "0", Needed: "500", Priority: "High", Deadline: "", Notes: "" },
      { Goal: "Move-out fund", "Target Amount": "", "Current Amount": "0", Needed: "", Priority: "Medium", Deadline: "", Notes: "" },
    ],
  },
];

export default function Dashboard() {
  const [view, setView] = useState<PageView>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return defaultSections;

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? mergeSections(defaultSections, parsed) : defaultSections;
    } catch {
      return defaultSections;
    }
  });

  useEffect(() => {
    saveSections(sections);
  }, [sections]);

  const activeSection = useMemo(() => {
    if (view === "home") return null;
    return sections.find((section) => section.key === view) ?? null;
  }, [sections, view]);

  const metrics = useMemo(() => getMetrics(sections), [sections]);
  const alerts = useMemo(() => getAutoAlerts(sections, metrics), [sections, metrics]);
  const briefing = useMemo(() => getBriefing(metrics, alerts), [metrics, alerts]);

  function openPage(nextView: PageView) {
    setView(nextView);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateCell(sectionKey: SectionKey, rowIndex: number, column: string, value: string) {
    if (sectionKey === "alerts") return;

    setSections((current) => {
      const nextSections = current.map((section) => {
        if (section.key !== sectionKey) return section;

        const rows = section.rows.map((row, index) => {
          if (index !== rowIndex) return row;
          return { ...row, [column]: value };
        });

        return { ...section, rows };
      });

      saveSections(nextSections);
      return nextSections;
    });
  }

  function commitInput(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    saveSections(sections);
    event.currentTarget.blur();
  }

  function addRow(sectionKey: SectionKey) {
    if (sectionKey === "alerts") return;

    setSections((current) => {
      const nextSections = current.map((section) => {
        if (section.key !== sectionKey) return section;

        const emptyRow = section.columns.reduce<Row>((row, column) => {
          row[column] = "";
          return row;
        }, {});

        return { ...section, rows: [...section.rows, emptyRow] };
      });

      saveSections(nextSections);
      return nextSections;
    });
  }

  function deleteRow(sectionKey: SectionKey, rowIndex: number) {
    if (sectionKey === "alerts") return;

    setSections((current) => {
      const nextSections = current.map((section) => {
        if (section.key !== sectionKey) return section;
        return { ...section, rows: section.rows.filter((_, index) => index !== rowIndex) };
      });

      saveSections(nextSections);
      return nextSections;
    });
  }

  function resetSection(sectionKey: SectionKey) {
    if (sectionKey === "alerts") return;

    const confirmed = window.confirm("Reset this page to the recommended starter rows?");
    if (!confirmed) return;

    const original = defaultSections.find((section) => section.key === sectionKey);
    if (!original) return;

    setSections((current) => {
      const nextSections = current.map((section) =>
        section.key === sectionKey ? cloneSection(original) : section
      );

      saveSections(nextSections);
      return nextSections;
    });
  }

  return (
    <main className="vcc-page">
      <style>{css}</style>

      <header className="vcc-topbar">
        <div className="vcc-dropdown-wrap">
          <button className="vcc-brand" onClick={() => setMenuOpen((current) => !current)}>
            <span className="vcc-logo">⌁</span>
            <span className="vcc-brand-text">VCC_OS</span>
            <span className={`vcc-caret ${menuOpen ? "open" : ""}`}>⌄</span>
          </button>

          {menuOpen && (
            <div className="vcc-dropdown-menu">
              <button className={`vcc-dropdown-item ${view === "home" ? "active" : ""}`} onClick={() => openPage("home")}>
                <span>⌂</span>
                Dashboard
              </button>

              <p className="vcc-dropdown-group">Briefing Sources</p>
              {sections.filter((section) => section.group === "briefing").map((section) => (
                <button key={section.key} className={`vcc-dropdown-item ${view === section.key ? "active" : ""}`} onClick={() => openPage(section.key)}>
                  <span>{sectionIcon(section.key)}</span>
                  {section.label}
                </button>
              ))}

              <p className="vcc-dropdown-group">Command</p>
              {sections.filter((section) => section.group === "command").map((section) => (
                <button key={section.key} className={`vcc-dropdown-item ${view === section.key ? "active" : ""}`} onClick={() => openPage(section.key)}>
                  <span>{sectionIcon(section.key)}</span>
                  {section.label}
                </button>
              ))}

              <p className="vcc-dropdown-group">Finance</p>
              {sections.filter((section) => section.group === "finance").map((section) => (
                <button key={section.key} className={`vcc-dropdown-item ${view === section.key ? "active" : ""}`} onClick={() => openPage(section.key)}>
                  <span>{sectionIcon(section.key)}</span>
                  {section.label}
                </button>
              ))}

              <div className="vcc-dropdown-online">
                <span />
                ONLINE
              </div>
            </div>
          )}
        </div>
      </header>

      {menuOpen && <button className="vcc-scrim" onClick={() => setMenuOpen(false)} />}

      <section className="vcc-content">
        {view === "home" ? (
          <HomePage sections={sections} metrics={metrics} alerts={alerts} briefing={briefing} openPage={openPage} />
        ) : activeSection?.key === "alerts" ? (
          <PriorityAlertsPage alerts={alerts} backHome={() => openPage("home")} openPage={openPage} />
        ) : activeSection ? (
          <SectionPage
            section={activeSection}
            updateCell={updateCell}
            commitInput={commitInput}
            addRow={addRow}
            deleteRow={deleteRow}
            resetSection={resetSection}
            backHome={() => openPage("home")}
          />
        ) : null}
      </section>
    </main>
  );
}

function HomePage({
  sections,
  metrics,
  alerts,
  briefing,
  openPage,
}: {
  sections: Section[];
  metrics: Metrics;
  alerts: AlertItem[];
  briefing: Briefing;
  openPage: (view: PageView) => void;
}) {
  return (
    <>
      <section className="briefing-panel">
        <div className="briefing-head">
          <div>
            <div className="status-row">
              <span className="online-pill">● ONLINE</span>
              <span className="date-text">{prettyDate()}</span>
            </div>

            <p className="briefing-kicker">TODAY_BRIEFING</p>
            <h1 className="briefing-title">{briefing.title}</h1>
            <p className="briefing-subtitle">{briefing.action}</p>
          </div>

          <button className="investigate-btn" onClick={() => openPage(briefing.priority)}>
            INVESTIGATE →
          </button>
        </div>

        <div className="briefing-why">
          <p>WHY_THIS_IS_THE_PRIORITY</p>
          <h2>{briefing.why}</h2>
        </div>

        {briefing.objectives.length > 1 && (
          <div className={`objective-window ${briefing.objectives.length > 4 ? "scroll" : ""}`}>
            <div className="objective-head">
              <p>OBJECTIVE_STACK</p>
              <span>{briefing.objectives.length} THINGS NEED ATTENTION</span>
            </div>

            <div className="objective-list">
              {briefing.objectives.map((objective, index) => (
                <button
                  key={`${objective.alert}-${index}`}
                  className={`objective-item ${objective.urgency.toLowerCase()}`}
                  onClick={() => openPage(objective.source)}
                >
                  <div className="objective-rank">{index + 1}</div>

                  <div>
                    <p>{objective.urgency} · {getSectionLabel(objective.source)}</p>
                    <h3>{objective.alert}</h3>
                    <span>{objective.action}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="proof-grid">
          {briefing.proof.map((item) => (
            <button key={`${item.source}-${item.label}`} className="proof-box" onClick={() => openPage(item.source)}>
              <p>{item.label}</p>
              <h3>{item.value}</h3>
              <span>Source: {getSectionLabel(item.source)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="glance-grid">
        {sections.map((section) => {
          const card = getGlanceCard(section, metrics, alerts);

          return (
            <button key={section.key} className={`glance-card ${card.tone}`} onClick={() => openPage(section.key)}>
              <div className="glance-top">
                <p>{section.label}</p>
                <span>{section.key === "alerts" ? "AUTO" : section.status}</span>
              </div>

              <div className="glance-main">
                <h2>{card.value}</h2>
                <p>{card.label}</p>
              </div>

              <div className="glance-bottom">
                <span>{card.detailOne}</span>
                <span>{card.detailTwo}</span>
              </div>
            </button>
          );
        })}
      </section>
    </>
  );
}

function PriorityAlertsPage({
  alerts,
  backHome,
  openPage,
}: {
  alerts: AlertItem[];
  backHome: () => void;
  openPage: (view: PageView) => void;
}) {
  return (
    <section className="section-page">
      <div className="section-header">
        <button className="back-btn" onClick={backHome}>
          ← DASHBOARD
        </button>

        <div className="section-title-row">
          <div>
            <p className="section-kicker">AUTO_GENERATED_VIEW</p>
            <h1>Priority Alerts</h1>
            <p>Read-only view of anything important or critical that can block financial freedom if ignored.</p>
          </div>

          <span className="section-status">AUTO</span>
        </div>
      </div>

      <div className="alert-panel">
        <div className="sheet-topline">
          <p>CRITICAL_GROWTH_BLOCKERS</p>
          <p>{alerts.length} ALERTS</p>
        </div>

        {alerts.length === 0 ? (
          <div className="empty-alerts">
            <h2>No major blockers detected.</h2>
            <p>Keep Money Snapshot, Weekly Cash, Bills, Debt, Savings, Goals, and Buy Next updated so VCC can keep watching.</p>
          </div>
        ) : (
          <div className="alert-list">
            {alerts.map((alert, index) => (
              <button key={`${alert.alert}-${index}`} className={`alert-card ${alert.urgency.toLowerCase()}`} onClick={() => openPage(alert.source)}>
                <div className="alert-card-top">
                  <p>{alert.urgency}</p>
                  <span>{getSectionLabel(alert.source)}</span>
                </div>

                <h2>{alert.alert}</h2>
                <p className="alert-proof">{alert.proof}</p>
                <p className="alert-action">{alert.action}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SectionPage({
  section,
  updateCell,
  commitInput,
  addRow,
  deleteRow,
  resetSection,
  backHome,
}: {
  section: Section;
  updateCell: (sectionKey: SectionKey, rowIndex: number, column: string, value: string) => void;
  commitInput: (event: KeyboardEvent<HTMLInputElement>) => void;
  addRow: (sectionKey: SectionKey) => void;
  deleteRow: (sectionKey: SectionKey, rowIndex: number) => void;
  resetSection: (sectionKey: SectionKey) => void;
  backHome: () => void;
}) {
  return (
    <section className="section-page">
      <div className="section-header">
        <button className="back-btn" onClick={backHome}>
          ← DASHBOARD
        </button>

        <div className="section-title-row">
          <div>
            <p className="section-kicker">DEDICATED_PAGE</p>
            <h1>{section.title}</h1>
            <p>{section.subtitle}</p>
          </div>

          <span className="section-status">{section.status}</span>
        </div>

        <div className="section-actions">
          <button className="secondary-btn" onClick={() => resetSection(section.key)}>
            RESET
          </button>
          <button className="primary-btn" onClick={() => addRow(section.key)}>
            + ADD_ROW
          </button>
        </div>
      </div>

      <div className="sheet-card">
        <div className="sheet-topline">
          <p>{section.label.toUpperCase()}_SHEET</p>
          <p>{section.rows.length} ROWS</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {section.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {section.rows.map((row, rowIndex) => (
                <tr key={`${section.key}-${rowIndex}`}>
                  {section.columns.map((column) => (
                    <td key={column}>
                      <input
                        value={row[column] ?? ""}
                        onChange={(event) => updateCell(section.key, rowIndex, column, event.target.value)}
                        onKeyDown={commitInput}
                        placeholder="-"
                      />
                    </td>
                  ))}

                  <td>
                    <button className="delete-btn" onClick={() => deleteRow(section.key, rowIndex)}>
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="save-note">Press Enter inside any cell to save and exit the input.</p>
      </div>
    </section>
  );
}

function getMetrics(sections: Section[]): Metrics {
  const moneySnapshot = sections.find((section) => section.key === "moneySnapshot");
  const weeklyCash = sections.find((section) => section.key === "weeklyCash");
  const missions = sections.find((section) => section.key === "missions");
  const buyNext = sections.find((section) => section.key === "buyNext");
  const goals = sections.find((section) => section.key === "goals");
  const bills = sections.find((section) => section.key === "bills");
  const debt = sections.find((section) => section.key === "debt");
  const savings = sections.find((section) => section.key === "savings");

  const cashOnHand = getMoneySnapshotAmount(moneySnapshot, "Cash On Hand");
  const monthlyIncome = getMoneySnapshotAmount(moneySnapshot, "Monthly Income");
  const monthlyBills = getMoneySnapshotAmount(moneySnapshot, "Monthly Bills");
  const snapshotWeeklyIncome = getMoneySnapshotAmount(moneySnapshot, "Weekly Income");
  const snapshotWeeklyBills = getMoneySnapshotAmount(moneySnapshot, "Weekly Bills");
  const foodNeeded = getMoneySnapshotAmount(moneySnapshot, "Food Needed");
  const gasNeeded = getMoneySnapshotAmount(moneySnapshot, "Gas Needed");
  const myPayOwed = getMoneySnapshotAmount(moneySnapshot, "MyPay Owed");
  const spotMeOwed = getMoneySnapshotAmount(moneySnapshot, "SpotMe Owed");
  const emergencySavings = getMoneySnapshotAmount(moneySnapshot, "Emergency Savings");
  const manualRemainingCash = getMoneySnapshotAmount(moneySnapshot, "Remaining Cash");

  const weeklyIncomeFromSheet = weeklyCash?.rows.reduce((sum, row) => sum + toNumber(row.Income), 0) ?? 0;
  const weeklyIncome = weeklyIncomeFromSheet || snapshotWeeklyIncome;

  const weeklyBillsFromSheet = weeklyCash?.rows.reduce((sum, row) => sum + toNumber(row.Bills), 0) ?? 0;
  const weeklyBills = weeklyBillsFromSheet || snapshotWeeklyBills;

  const weeklyOutflow =
    weeklyCash?.rows.reduce((sum, row) => sum + toNumber(row.Bills) + toNumber(row.Spending) + toNumber(row.Borrowed), 0) ?? 0;

  const weeklyNetFromSheet =
    weeklyCash?.rows.reduce((sum, row) => {
      const enteredNet = toNumber(row.Net);
      if (enteredNet !== 0) return sum + enteredNet;
      return sum + toNumber(row.Income) + toNumber(row.Rollover) - toNumber(row.Bills) - toNumber(row.Spending) - toNumber(row.Borrowed);
    }, 0) ?? 0;

  const snapshotPressure = weeklyBills + foodNeeded + gasNeeded + myPayOwed + spotMeOwed;
  const remainingCash = manualRemainingCash || cashOnHand + weeklyIncome - snapshotPressure;
  const weeklyNet = weeklyNetFromSheet || weeklyIncome - snapshotPressure;

  const openMissions =
    missions?.rows.filter((row) => !["done", "closed", "complete"].includes((row.Status ?? "").toLowerCase())).length ?? 0;

  const criticalBuyNext =
    buyNext?.rows.filter((row) => ["high", "critical"].includes((row.Urgency ?? "").toLowerCase())).length ?? 0;

  const goalRows = goals?.rows ?? [];
  const avgGoalProgress =
    goalRows.length === 0 ? 0 : Math.round(goalRows.reduce((sum, row) => sum + toNumber(row["Progress %"]), 0) / goalRows.length);

  const unpaidBillRows = bills?.rows.filter((row) => (row.Status ?? "").toLowerCase() !== "paid") ?? [];
  const billTotal = unpaidBillRows.reduce((sum, row) => sum + toNumber(row.Amount), 0);

  const activeDebtRows =
    debt?.rows.filter((row) => !["paid", "closed", "done"].includes((row.Status ?? "").toLowerCase())) ?? [];
  const debtTotal = activeDebtRows.reduce((sum, row) => sum + toNumber(row["Current Balance"]), 0);

  const savingsAmountFromSavings = savings?.rows.reduce((sum, row) => sum + toNumber(row["Current Amount"]), 0) ?? 0;
  const savingsAmount = savingsAmountFromSavings || emergencySavings;

  return {
    cashOnHand,
    monthlyIncome,
    monthlyBills,
    weeklyIncome,
    weeklyBills,
    foodNeeded,
    gasNeeded,
    myPayOwed,
    spotMeOwed,
    emergencySavings,
    remainingCash,
    snapshotPressure,
    weeklyOutflow,
    weeklyNet,
    openMissions,
    criticalBuyNext,
    avgGoalProgress,
    unpaidBills: unpaidBillRows.length,
    billTotal,
    activeDebt: activeDebtRows.length,
    debtTotal,
    savingsAmount,
  };
}

function getAutoAlerts(sections: Section[], metrics: Metrics): AlertItem[] {
  const alerts: AlertItem[] = [];
  const buyNext = sections.find((section) => section.key === "buyNext");
  const goals = sections.find((section) => section.key === "goals");

  if (metrics.cashOnHand === 0 && metrics.weeklyIncome === 0 && metrics.monthlyIncome === 0) {
    alerts.push({
      alert: "Money Snapshot is missing core numbers",
      source: "moneySnapshot",
      urgency: "Critical",
      proof: "Cash On Hand, Weekly Income, and Monthly Income are blank or $0.",
      action: "Enter your real cash and income first so VCC can judge the situation correctly.",
    });
  }

  if (metrics.remainingCash < 0) {
    alerts.push({
      alert: "Remaining cash is negative",
      source: "moneySnapshot",
      urgency: "Critical",
      proof: `Remaining Cash is estimated at ${formatMoney(metrics.remainingCash)} after snapshot pressure.`,
      action: "Review cash, weekly income, food, gas, MyPay, SpotMe, and weekly bills.",
    });
  }

  if (metrics.snapshotPressure > metrics.cashOnHand + metrics.weeklyIncome && metrics.snapshotPressure > 0) {
    alerts.push({
      alert: "Pressure is higher than available money",
      source: "moneySnapshot",
      urgency: "Critical",
      proof: `Snapshot pressure is ${formatMoney(metrics.snapshotPressure)} while cash + weekly income is ${formatMoney(metrics.cashOnHand + metrics.weeklyIncome)}.`,
      action: "Decide what must be paid now, what can wait, and what needs a new income move.",
    });
  }

  if (metrics.weeklyNet < 0) {
    alerts.push({
      alert: "Weekly cashflow is negative",
      source: "weeklyCash",
      urgency: "Critical",
      proof: `Weekly Net is ${formatMoney(metrics.weeklyNet)}.`,
      action: "Review weekly bills, spending, borrowed money, and rollover.",
    });
  }

  if (metrics.unpaidBills > 0) {
    alerts.push({
      alert: "Unpaid bills can block progress",
      source: "bills",
      urgency: metrics.unpaidBills >= 3 ? "Critical" : "High",
      proof: `${metrics.unpaidBills} bill(s) are marked unpaid. Bill pressure entered: ${formatMoney(metrics.billTotal)}.`,
      action: "Decide what must be paid, delayed, or watched.",
    });
  }

  if (metrics.myPayOwed > 0 || metrics.spotMeOwed > 0) {
    alerts.push({
      alert: "Borrowed money is reducing freedom",
      source: "moneySnapshot",
      urgency: "High",
      proof: `MyPay owed: ${formatMoney(metrics.myPayOwed)}. SpotMe owed: ${formatMoney(metrics.spotMeOwed)}.`,
      action: "Track borrowed balances so future checks stop getting eaten early.",
    });
  }

  if (metrics.activeDebt > 0) {
    alerts.push({
      alert: "Active debt is creating pressure",
      source: "debt",
      urgency: metrics.debtTotal > 0 ? "Critical" : "High",
      proof: `${metrics.activeDebt} debt item(s) are active. Debt balance entered: ${formatMoney(metrics.debtTotal)}.`,
      action: "Update balances and identify the most urgent debt.",
    });
  }

  if (metrics.savingsAmount <= 0) {
    alerts.push({
      alert: "No emergency buffer",
      source: "savings",
      urgency: "High",
      proof: "Savings is currently $0.",
      action: "Build a starter buffer once survival bills are handled.",
    });
  }

  if (metrics.foodNeeded > 0 || metrics.gasNeeded > 0) {
    alerts.push({
      alert: "Survival needs are active",
      source: "moneySnapshot",
      urgency: "High",
      proof: `Food needed: ${formatMoney(metrics.foodNeeded)}. Gas needed: ${formatMoney(metrics.gasNeeded)}.`,
      action: "Handle food and gas before lower-priority spending.",
    });
  }

  buyNext?.rows.forEach((row) => {
    const urgency = (row.Urgency ?? "").toLowerCase();
    const status = (row["Buy Status"] ?? "").toLowerCase();

    if (["critical", "high"].includes(urgency) && !["bought", "done", "handled"].includes(status)) {
      alerts.push({
        alert: `${row.Item || "Buy Next item"} needs attention`,
        source: "buyNext",
        urgency: urgency === "critical" ? "Critical" : "High",
        proof: `${row.Item || "Item"} is marked ${row.Urgency || "urgent"} and status is ${row["Buy Status"] || "not handled"}.`,
        action: "Handle or update this item so it does not disrupt daily stability.",
      });
    }
  });

  goals?.rows.forEach((row) => {
    const progress = toNumber(row["Progress %"]);
    const priority = (row.Priority ?? "").toLowerCase();

    if (priority === "high" && progress < 25) {
      alerts.push({
        alert: `${row.Goal || "Goal"} is behind`,
        source: "goals",
        urgency: "High",
        proof: `${row.Goal || "Goal"} is high priority but only ${progress}% complete.`,
        action: "Set the next small step or adjust the target.",
      });
    }
  });

  return alerts.sort((a, b) => urgencyWeight(b.urgency) - urgencyWeight(a.urgency));
}

function getBriefing(metrics: Metrics, alerts: AlertItem[]): Briefing {
  if (alerts.length > 0) {
    const top = alerts[0];
    const objectives = alerts.slice(0, 6);

    return {
      title: top.alert,
      action: top.action,
      why: alerts.length === 1
        ? top.proof
        : `${alerts.length} blockers are active. The first objective is listed above, and the objective stack shows what else needs attention.`,
      priority: top.source,
      objectives,
      proof: [
        { label: "Auto Alerts", value: String(alerts.length), source: "alerts" },
        { label: "Cash On Hand", value: formatMoney(metrics.cashOnHand), source: "moneySnapshot" },
        { label: "Remaining Cash", value: formatMoney(metrics.remainingCash), source: "moneySnapshot" },
        { label: "Savings", value: formatMoney(metrics.savingsAmount), source: "savings" },
      ],
    };
  }

  return {
    title: "No major blockers detected",
    action: "Keep numbers updated and execute the next mission.",
    why: "The system is not detecting critical pressure from Money Snapshot, Weekly Cash, Bills, Debt, Buy Next, Goals, or Savings.",
    priority: "missions",
    objectives: [],
    proof: [
      { label: "Open Missions", value: String(metrics.openMissions), source: "missions" },
      { label: "Savings", value: formatMoney(metrics.savingsAmount), source: "savings" },
      { label: "Weekly Net", value: formatMoney(metrics.weeklyNet), source: "weeklyCash" },
      { label: "Goal Progress", value: `${metrics.avgGoalProgress}%`, source: "goals" },
    ],
  };
}

function getGlanceCard(section: Section, metrics: Metrics, alerts: AlertItem[]) {
  switch (section.key) {
    case "moneySnapshot":
      return {
        value: formatMoney(metrics.remainingCash),
        label: "Remaining cash",
        detailOne: `Cash: ${formatMoney(metrics.cashOnHand)}`,
        detailTwo: `Pressure: ${formatMoney(metrics.snapshotPressure)}`,
        tone: metrics.remainingCash < 0 ? "red" : "blue",
      };
    case "weeklyCash":
      return {
        value: formatMoney(metrics.weeklyNet),
        label: "Weekly net",
        detailOne: `Income: ${formatMoney(metrics.weeklyIncome)}`,
        detailTwo: `Outflow: ${formatMoney(metrics.weeklyOutflow || metrics.snapshotPressure)}`,
        tone: metrics.weeklyNet < 0 ? "red" : "green",
      };
    case "missions":
      return {
        value: String(metrics.openMissions),
        label: "Open missions",
        detailOne: "Daily execution",
        detailTwo: "Tap to manage",
        tone: "blue",
      };
    case "alerts":
      return {
        value: String(alerts.length),
        label: "Auto blockers",
        detailOne: alerts.length > 1 ? "Objective stack active" : "Read-only view",
        detailTwo: "Feeds briefing",
        tone: alerts.length > 0 ? "red" : "green",
      };
    case "buyNext":
      return {
        value: String(metrics.criticalBuyNext),
        label: "Urgent buy items",
        detailOne: "Food · Gas · Basics",
        detailTwo: "Tap to update",
        tone: metrics.criticalBuyNext > 0 ? "gold" : "green",
      };
    case "goals":
      return {
        value: `${metrics.avgGoalProgress}%`,
        label: "Average progress",
        detailOne: "Long-term build",
        detailTwo: "Tap to track",
        tone: "blue",
      };
    case "bills":
      return {
        value: formatMoney(metrics.billTotal),
        label: `${metrics.unpaidBills} unpaid bills`,
        detailOne: "Bills due",
        detailTwo: "Tap to review",
        tone: metrics.unpaidBills > 0 ? "red" : "green",
      };
    case "debt":
      return {
        value: metrics.debtTotal > 0 ? formatMoney(metrics.debtTotal) : String(metrics.activeDebt),
        label: metrics.debtTotal > 0 ? "Debt balance" : "Active debt items",
        detailOne: "Car · MyPay · SpotMe",
        detailTwo: "Tap to update",
        tone: metrics.activeDebt > 0 ? "red" : "green",
      };
    case "savings":
      return {
        value: formatMoney(metrics.savingsAmount),
        label: "Saved total",
        detailOne: "Emergency · Move-out",
        detailTwo: "Tap to grow",
        tone: metrics.savingsAmount > 0 ? "green" : "blue",
      };
  }
}

function urgencyWeight(urgency: AlertItem["urgency"]) {
  if (urgency === "Critical") return 3;
  if (urgency === "High") return 2;
  return 1;
}

function getMoneySnapshotAmount(section: Section | undefined, category: string) {
  const row = section?.rows.find((item) => item.Category === category);
  return toNumber(row?.Amount);
}

function mergeSections(defaultList: Section[], savedList: Section[]) {
  return defaultList.map((defaultSection) => {
    const saved = savedList.find((section) => section.key === defaultSection.key);
    return saved ? { ...defaultSection, rows: saved.rows ?? defaultSection.rows } : defaultSection;
  });
}

function saveSections(sections: Section[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
}

function cloneSection(section: Section): Section {
  return JSON.parse(JSON.stringify(section));
}

function sectionIcon(key: SectionKey) {
  const icons: Record<SectionKey, string> = {
    moneySnapshot: "▣",
    weeklyCash: "▤",
    missions: "⊕",
    alerts: "⌾",
    buyNext: "□",
    goals: "◎",
    bills: "▥",
    debt: "▦",
    savings: "$",
  };

  return icons[key];
}

function getSectionLabel(key: SectionKey) {
  const labels: Record<SectionKey, string> = {
    moneySnapshot: "Money Snapshot",
    weeklyCash: "Weekly Cash",
    missions: "Missions",
    alerts: "Priority Alerts",
    buyNext: "Buy Next",
    goals: "Goal Progress",
    bills: "Bills Due",
    debt: "Debt",
    savings: "Savings",
  };

  return labels[key];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentWeekLabel() {
  return `Week of ${today()}`;
}

function prettyDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function toNumber(value: string | undefined) {
  if (!value) return 0;
  const clean = String(value).replace(/[$,]/g, "");
  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const css = `
* { box-sizing: border-box; }
html, body, #root { min-height: 100%; margin: 0; background: #030712; }
button, input { font: inherit; }

.vcc-page {
  min-height: 100vh;
  background: #030712;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}

.vcc-topbar {
  height: 92px;
  display: flex;
  align-items: center;
  padding: 0 30px;
  background: rgba(3, 7, 18, 0.96);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(16px);
}

.vcc-dropdown-wrap { position: relative; width: 100%; }

.vcc-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  background: transparent;
  border: 0;
  color: #60a5fa;
  cursor: pointer;
  padding: 0;
}

.vcc-logo {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.55);
  background: rgba(15, 23, 42, 0.88);
  font-size: 28px;
}

.vcc-brand-text {
  font-size: 24px;
  letter-spacing: 8px;
  font-weight: 900;
}

.vcc-caret {
  color: #94a3b8;
  font-size: 24px;
  transition: transform 160ms ease;
}

.vcc-caret.open { transform: rotate(180deg); }

.vcc-dropdown-menu {
  position: absolute;
  top: 66px;
  left: 0;
  width: min(420px, calc(100vw - 36px));
  max-height: calc(100vh - 110px);
  overflow-y: auto;
  background: rgba(3, 7, 18, 0.98);
  border: 1px solid rgba(59, 130, 246, 0.28);
  border-radius: 22px;
  padding: 14px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  z-index: 110;
}

.vcc-dropdown-group {
  margin: 18px 10px 8px;
  color: #475569;
  font-size: 12px;
  letter-spacing: 4px;
  text-transform: uppercase;
  font-weight: 900;
}

.vcc-dropdown-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  background: transparent;
  color: #94a3b8;
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 14px;
  font-size: 16px;
  text-align: left;
  cursor: pointer;
  font-weight: 900;
}

.vcc-dropdown-item.active {
  color: #60a5fa;
  background: rgba(37, 99, 235, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.5);
  box-shadow: inset 4px 0 0 #3b82f6;
}

.vcc-dropdown-online {
  margin: 18px 10px 6px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.5);
  background: rgba(16, 185, 129, 0.12);
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 900;
  letter-spacing: 3px;
  width: fit-content;
}

.vcc-dropdown-online span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #34d399;
}

.vcc-scrim {
  position: fixed;
  inset: 92px 0 0 0;
  background: rgba(2, 6, 23, 0.55);
  border: 0;
  z-index: 90;
}

.vcc-content {
  width: 100%;
  padding: 28px;
  max-width: 1360px;
  margin: 0 auto;
}

.briefing-panel,
.section-header,
.sheet-card,
.alert-panel {
  border-radius: 28px;
  border: 1px solid rgba(59, 130, 246, 0.34);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.96));
  box-shadow: 0 24px 60px rgba(0,0,0,0.32);
}

.briefing-panel {
  padding: 30px;
  margin-bottom: 26px;
}

.briefing-head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 22px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.online-pill {
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.5);
  background: rgba(16, 185, 129, 0.14);
  border-radius: 10px;
  padding: 8px 13px;
  font-weight: 900;
  letter-spacing: 3px;
}

.date-text {
  color: #94a3b8;
  font-size: 18px;
  letter-spacing: 3px;
}

.briefing-kicker,
.section-kicker {
  margin: 0;
  color: #60a5fa;
  font-size: 13px;
  letter-spacing: 4px;
  font-weight: 900;
}

.briefing-title {
  margin: 10px 0;
  font-size: clamp(34px, 5vw, 56px);
  line-height: 1;
}

.briefing-subtitle {
  margin: 0;
  color: #cbd5e1;
  font-size: clamp(16px, 2vw, 21px);
  line-height: 1.45;
  max-width: 780px;
}

.investigate-btn,
.primary-btn {
  background: #3b82f6;
  color: #020617;
  border: 1px solid rgba(147,197,253,.6);
  border-radius: 16px;
  padding: 13px 18px;
  cursor: pointer;
  font-weight: 900;
  letter-spacing: 2px;
  white-space: nowrap;
}

.briefing-why {
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 20px;
  padding: 18px;
  margin-bottom: 18px;
}

.briefing-why p {
  margin: 0 0 8px;
  color: #94a3b8;
  font-size: 12px;
  letter-spacing: 3px;
  font-weight: 900;
}

.briefing-why h2 {
  margin: 0;
  color: #f8fafc;
  font-size: clamp(20px, 3vw, 30px);
  line-height: 1.25;
}

.objective-window {
  border: 1px solid rgba(251, 191, 36, 0.28);
  background: rgba(120, 53, 15, 0.1);
  border-radius: 22px;
  padding: 16px;
  margin-bottom: 18px;
}

.objective-window.scroll {
  max-height: 380px;
  overflow-y: auto;
  padding-right: 12px;
}

.objective-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.objective-head p {
  margin: 0;
  color: #fbbf24;
  font-size: 12px;
  letter-spacing: 3px;
  font-weight: 900;
}

.objective-head span {
  color: #94a3b8;
  font-size: 12px;
  letter-spacing: 2px;
  font-weight: 900;
}

.objective-list {
  display: grid;
  gap: 10px;
}

.objective-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: flex-start;
  width: 100%;
  background: rgba(15, 23, 42, 0.74);
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
  text-align: left;
}

.objective-item.critical {
  border-color: rgba(251, 113, 133, 0.45);
}

.objective-item.high {
  border-color: rgba(251, 191, 36, 0.45);
}

.objective-rank {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(96, 165, 250, 0.4);
  color: #60a5fa;
  font-weight: 900;
}

.objective-item p {
  margin: 0 0 5px;
  color: #94a3b8;
  font-size: 12px;
  letter-spacing: 2px;
  font-weight: 900;
  text-transform: uppercase;
}

.objective-item h3 {
  margin: 0 0 6px;
  font-size: 18px;
}

.objective-item span {
  color: #cbd5e1;
  line-height: 1.45;
}

.proof-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.proof-box,
.glance-card,
.alert-card {
  background: rgba(15, 23, 42, 0.74);
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.16);
  cursor: pointer;
  text-align: left;
}

.proof-box {
  border-radius: 18px;
  padding: 16px;
}

.proof-box:hover,
.glance-card:hover,
.alert-card:hover,
.objective-item:hover {
  border-color: rgba(96, 165, 250, 0.75);
}

.proof-box p {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
  letter-spacing: 2px;
  font-weight: 900;
  text-transform: uppercase;
}

.proof-box h3 {
  margin: 10px 0 6px;
  color: #60a5fa;
  font-size: 30px;
}

.proof-box span {
  color: #64748b;
  font-size: 12px;
}

.glance-grid {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 16px;
}

.glance-card {
  min-height: 210px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.25);
}

.glance-card.blue { border-color: rgba(59, 130, 246, 0.26); }
.glance-card.red {
  border-color: rgba(251, 113, 133, 0.3);
  background: linear-gradient(180deg, rgba(127, 29, 29, 0.18), rgba(15, 23, 42, 0.78));
}
.glance-card.gold {
  border-color: rgba(251, 191, 36, 0.32);
  background: linear-gradient(180deg, rgba(120, 53, 15, 0.18), rgba(15, 23, 42, 0.78));
}
.glance-card.green {
  border-color: rgba(52, 211, 153, 0.32);
  background: linear-gradient(180deg, rgba(6, 78, 59, 0.16), rgba(15, 23, 42, 0.78));
}

.glance-top,
.alert-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.glance-top p,
.alert-card-top p {
  margin: 0;
  color: #60a5fa;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 3px;
}

.glance-top span,
.alert-card-top span {
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 10px;
  font-weight: 900;
}

.glance-main h2 {
  margin: 22px 0 8px;
  font-size: clamp(28px, 3vw, 42px);
  line-height: 1;
}

.glance-main p,
.glance-bottom,
.alert-proof {
  color: #cbd5e1;
  line-height: 1.4;
}

.glance-bottom {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #94a3b8;
  font-size: 13px;
}

.section-header {
  padding: 26px;
  margin-bottom: 22px;
}

.back-btn {
  background: transparent;
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.42);
  border-radius: 999px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 900;
  letter-spacing: 2px;
  margin-bottom: 22px;
}

.section-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.section-title-row h1 {
  margin: 10px 0;
  font-size: clamp(36px, 6vw, 58px);
  line-height: 1;
}

.section-title-row p {
  margin: 0;
  color: #94a3b8;
  font-size: 18px;
}

.section-status {
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.5);
  background: rgba(16, 185, 129, 0.12);
  border-radius: 12px;
  padding: 10px 13px;
  font-weight: 900;
  letter-spacing: 3px;
  white-space: nowrap;
}

.section-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.secondary-btn {
  background: transparent;
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.45);
  border-radius: 16px;
  padding: 13px 18px;
  cursor: pointer;
  font-weight: 900;
  letter-spacing: 2px;
}

.sheet-card,
.alert-panel {
  padding: 18px;
}

.sheet-topline {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 4px 4px 18px;
  color: #60a5fa;
  letter-spacing: 3px;
  font-weight: 900;
}

.sheet-topline p {
  margin: 0;
}

.table-wrap {
  overflow-x: auto;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  background: #020617;
}

th {
  background: #07111f;
  color: #60a5fa;
  padding: 13px;
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  white-space: nowrap;
}

td {
  padding: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  border-right: 1px solid rgba(148, 163, 184, 0.06);
}

td input {
  width: 100%;
  min-width: 145px;
  background: rgba(15, 23, 42, 0.8);
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  padding: 10px 11px;
  outline: none;
  font-size: 14px;
}

td input:focus {
  border-color: rgba(96, 165, 250, 0.8);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.18);
}

.delete-btn {
  background: transparent;
  color: #fb7185;
  border: 1px solid rgba(251, 113, 133, 0.45);
  border-radius: 12px;
  padding: 9px 12px;
  cursor: pointer;
  font-weight: 900;
}

.save-note {
  color: #94a3b8;
  margin: 14px 4px 0;
  font-size: 13px;
}

.alert-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.alert-card {
  border-radius: 22px;
  padding: 20px;
}

.alert-card.critical {
  border-color: rgba(251, 113, 133, 0.5);
  background: linear-gradient(180deg, rgba(127, 29, 29, 0.22), rgba(15, 23, 42, 0.82));
}

.alert-card.high {
  border-color: rgba(251, 191, 36, 0.45);
  background: linear-gradient(180deg, rgba(120, 53, 15, 0.2), rgba(15, 23, 42, 0.82));
}

.alert-card h2 {
  margin: 20px 0 10px;
}

.alert-action {
  color: #f8fafc;
  font-weight: 900;
}

.empty-alerts {
  border: 1px solid rgba(52, 211, 153, 0.25);
  background: rgba(6, 78, 59, 0.12);
  border-radius: 20px;
  padding: 22px;
}

.empty-alerts h2 {
  margin: 0 0 8px;
  color: #34d399;
}

.empty-alerts p {
  margin: 0;
  color: #94a3b8;
}

@media (max-width: 1350px) {
  .glance-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .proof-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 900px) {
  .vcc-topbar { height: 88px; padding: 0 24px; }
  .vcc-brand-text { font-size: 22px; letter-spacing: 7px; }
  .vcc-dropdown-menu { top: 62px; }
  .vcc-scrim { inset: 88px 0 0 0; }
  .vcc-content { padding: 22px; }
  .briefing-head { flex-direction: column; }
  .investigate-btn { width: 100%; }
  .proof-grid { grid-template-columns: 1fr; }
  .glance-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .alert-list { grid-template-columns: 1fr; }
  .section-title-row { flex-direction: column; }
  .section-status { width: fit-content; }
  .section-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .primary-btn, .secondary-btn { width: 100%; }
}

@media (max-width: 520px) {
  .vcc-topbar { height: 82px; padding: 0 18px; }
  .vcc-logo { width: 42px; height: 42px; border-radius: 14px; }
  .vcc-brand-text { font-size: 20px; letter-spacing: 6px; }
  .vcc-caret { font-size: 20px; }
  .vcc-dropdown-menu { top: 58px; width: calc(100vw - 36px); }
  .vcc-scrim { inset: 82px 0 0 0; }
  .vcc-content { padding: 16px; }
  .briefing-panel, .section-header, .sheet-card, .alert-panel { border-radius: 22px; }
  .briefing-panel { padding: 22px; }
  .objective-head { flex-direction: column; align-items: flex-start; }
  .glance-grid { grid-template-columns: 1fr; }
  .glance-card { min-height: 165px; padding: 19px; }
  .section-actions { grid-template-columns: 1fr; }
  .sheet-topline { flex-direction: column; }
  table { min-width: 850px; }
}
`;
