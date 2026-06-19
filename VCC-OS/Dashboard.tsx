import { useEffect, useMemo, useState } from "react";

type SectionKey =
  | "briefing"
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
  group: "command" | "finance";
  columns: string[];
  rows: Row[];
};

const STORAGE_KEY = "vcc_os_dropdown_sections_v1";

const defaultSections: Section[] = [
  {
    key: "briefing",
    label: "Briefing",
    title: "Daily Briefing",
    subtitle: "Daily command status, focus, and notes.",
    status: "ONLINE",
    group: "command",
    columns: ["Date", "Status", "Main Focus", "Money Status", "Notes"],
    rows: [
      {
        Date: today(),
        Status: "Active",
        "Main Focus": "Stabilize money",
        "Money Status": "Needs update",
        Notes: "Enter real numbers and check today’s pressure.",
      },
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
      {
        Mission: "Update VCC numbers",
        Priority: "High",
        Status: "Open",
        "Due Date": today(),
        "Next Action": "Enter bills, debt, and cash",
        Notes: "",
      },
      {
        Mission: "Choose one money move",
        Priority: "High",
        Status: "Open",
        "Due Date": today(),
        "Next Action": "Decide what gets paid or delayed",
        Notes: "",
      },
    ],
  },
  {
    key: "alerts",
    label: "Priority Alerts",
    title: "Priority Alert Radar",
    subtitle: "Problems that need attention first.",
    status: "WATCH",
    group: "command",
    columns: ["Alert", "Category", "Urgency", "Status", "Recommended Action", "Notes"],
    rows: [
      {
        Alert: "Bills check",
        Category: "Money",
        Urgency: "High",
        Status: "Open",
        "Recommended Action": "Confirm due dates and amounts",
        Notes: "",
      },
      {
        Alert: "Food / Gas check",
        Category: "Inventory",
        Urgency: "High",
        Status: "Open",
        "Recommended Action": "Enter what is actually needed",
        Notes: "",
      },
    ],
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
      {
        Item: "Food",
        Category: "House",
        "Current Level": "Low",
        Urgency: "Critical",
        "Estimated Cost": "",
        "Buy Status": "Needed",
        Notes: "",
      },
      {
        Item: "Gas",
        Category: "Car",
        "Current Level": "Low",
        Urgency: "High",
        "Estimated Cost": "",
        "Buy Status": "Needed",
        Notes: "",
      },
    ],
  },
  {
    key: "goals",
    label: "Goal Progress",
    title: "Goal Progress",
    subtitle: "Progress tracking for the bigger mission.",
    status: "BUILDING",
    group: "command",
    columns: ["Goal", "Category", "Target", "Current", "Progress %", "Next Step", "Notes"],
    rows: [
      {
        Goal: "VCC recovery",
        Category: "System",
        Target: "Working app",
        Current: "Dashboard online",
        "Progress %": "50",
        "Next Step": "Build dedicated pages",
        Notes: "",
      },
      {
        Goal: "Emergency fund",
        Category: "Money",
        Target: "500",
        Current: "0",
        "Progress %": "0",
        "Next Step": "Save first small amount",
        Notes: "",
      },
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
      {
        Bill: "Car note",
        "Due Date": "",
        Amount: "",
        Status: "Unpaid",
        "Paid Date": "",
        Priority: "High",
        Notes: "",
      },
      {
        Bill: "Phone",
        "Due Date": "",
        Amount: "",
        Status: "Unpaid",
        "Paid Date": "",
        Priority: "High",
        Notes: "",
      },
      {
        Bill: "Insurance",
        "Due Date": "",
        Amount: "",
        Status: "Unpaid",
        "Paid Date": "",
        Priority: "High",
        Notes: "",
      },
    ],
  },
  {
    key: "debt",
    label: "Debt",
    title: "Debt Command",
    subtitle: "Car balance, MyPay, SpotMe, and personal debt pressure.",
    status: "TRACK",
    group: "finance",
    columns: ["Debt", "Starting Balance", "Current Balance", "Payment", "Due Date", "Status", "Notes"],
    rows: [
      {
        Debt: "Car balance",
        "Starting Balance": "",
        "Current Balance": "",
        Payment: "",
        "Due Date": "",
        Status: "Active",
        Notes: "",
      },
      {
        Debt: "MyPay",
        "Starting Balance": "",
        "Current Balance": "",
        Payment: "",
        "Due Date": "",
        Status: "Active",
        Notes: "",
      },
      {
        Debt: "SpotMe",
        "Starting Balance": "",
        "Current Balance": "",
        Payment: "",
        "Due Date": "",
        Status: "Active",
        Notes: "",
      },
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
      {
        Goal: "Emergency fund",
        "Target Amount": "500",
        "Current Amount": "0",
        Needed: "500",
        Priority: "High",
        Deadline: "",
        Notes: "",
      },
      {
        Goal: "Move-out fund",
        "Target Amount": "",
        "Current Amount": "0",
        Needed: "",
        Priority: "Medium",
        Deadline: "",
        Notes: "",
      },
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
      return Array.isArray(parsed) ? parsed : defaultSections;
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

  const totals = useMemo(() => {
    const bills = sections.find((section) => section.key === "bills");
    const debt = sections.find((section) => section.key === "debt");
    const savings = sections.find((section) => section.key === "savings");

    const unpaidBills =
      bills?.rows.filter((row) => (row.Status ?? "").toLowerCase() !== "paid").length ?? 0;

    const activeDebt =
      debt?.rows.filter((row) => (row.Status ?? "").toLowerCase() !== "paid").length ?? 0;

    const savingsAmount =
      savings?.rows.reduce((sum, row) => sum + toNumber(row["Current Amount"]), 0) ?? 0;

    return { unpaidBills, activeDebt, savingsAmount };
  }, [sections]);

  function openPage(nextView: PageView) {
    setView(nextView);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateCell(sectionKey: SectionKey, rowIndex: number, column: string, value: string) {
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

  function commitInput(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    saveSections(sections);
    event.currentTarget.blur();
  }

  function addRow(sectionKey: SectionKey) {
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
              <button
                className={`vcc-dropdown-item ${view === "home" ? "active" : ""}`}
                onClick={() => openPage("home")}
              >
                <span>⌂</span>
                Dashboard
              </button>

              <p className="vcc-dropdown-group">Command</p>

              {sections
                .filter((section) => section.group === "command")
                .map((section) => (
                  <button
                    key={section.key}
                    className={`vcc-dropdown-item ${view === section.key ? "active" : ""}`}
                    onClick={() => openPage(section.key)}
                  >
                    <span>{sectionIcon(section.key)}</span>
                    {section.label}
                  </button>
                ))}

              <p className="vcc-dropdown-group">Finance</p>

              {sections
                .filter((section) => section.group === "finance")
                .map((section) => (
                  <button
                    key={section.key}
                    className={`vcc-dropdown-item ${view === section.key ? "active" : ""}`}
                    onClick={() => openPage(section.key)}
                  >
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
          <HomePage sections={sections} totals={totals} openPage={openPage} />
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
  totals,
  openPage,
}: {
  sections: Section[];
  totals: { unpaidBills: number; activeDebt: number; savingsAmount: number };
  openPage: (view: PageView) => void;
}) {
  return (
    <>
      <section className="mission-panel">
        <div className="status-row">
          <span className="online-pill">● ONLINE</span>
          <span className="date-text">{prettyDate()}</span>
        </div>

        <h1 className="mission-title">
          <span>MISSION</span> CONTROL
        </h1>

        <p className="mission-subtitle">Vitality Command Center · All systems nominal</p>

        <div className="command-stats">
          <div className="stat-box">
            <p>UNPAID_BILLS</p>
            <h2 className="blue">{totals.unpaidBills}</h2>
          </div>

          <div className="stat-box">
            <p>ACTIVE_DEBT</p>
            <h2 className="red">{totals.activeDebt}</h2>
          </div>

          <div className="stat-box">
            <p>SAVINGS</p>
            <h2 className="green">{formatMoney(totals.savingsAmount)}</h2>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        {sections.map((section) => (
          <button key={section.key} className="vcc-card" onClick={() => openPage(section.key)}>
            <div className="card-top">
              <p>{section.label}</p>
              <span>{section.status}</span>
            </div>

            <h2>{section.title}</h2>
            <p className="card-note">{section.subtitle}</p>
          </button>
        ))}
      </section>
    </>
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
  commitInput: (event: React.KeyboardEvent<HTMLInputElement>) => void;
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
                        onChange={(event) =>
                          updateCell(section.key, rowIndex, column, event.target.value)
                        }
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

function saveSections(sections: Section[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
}

function cloneSection(section: Section): Section {
  return JSON.parse(JSON.stringify(section));
}

function sectionIcon(key: SectionKey) {
  const icons: Record<SectionKey, string> = {
    briefing: "◉",
    missions: "⊕",
    alerts: "⌾",
    buyNext: "□",
    goals: "◎",
    bills: "▤",
    debt: "▣",
    savings: "$",
  };

  return icons[key];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function prettyDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function toNumber(value: string | undefined) {
  const number = Number(value);
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
* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-height: 100%;
  margin: 0;
  background: #030712;
}

button,
input {
  font: inherit;
}

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

.vcc-dropdown-wrap {
  position: relative;
  width: 100%;
}

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

.vcc-caret.open {
  transform: rotate(180deg);
}

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

.mission-panel {
  min-height: 300px;
  border-radius: 28px;
  padding: 30px;
  border: 1px solid rgba(59, 130, 246, 0.38);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.96)),
    repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(59,130,246,.08) 49px),
    repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(59,130,246,.08) 49px);
  box-shadow: 0 0 0 1px rgba(59,130,246,.15), 0 30px 70px rgba(0,0,0,.45);
  margin-bottom: 26px;
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

.mission-title {
  margin: 0;
  font-size: clamp(36px, 6vw, 54px);
  line-height: 1;
  letter-spacing: 1px;
}

.mission-title span {
  color: #3b82f6;
}

.mission-subtitle {
  margin: 18px 0 34px;
  color: #94a3b8;
  font-size: clamp(16px, 2.5vw, 21px);
}

.command-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.stat-box {
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(2, 6, 23, 0.44);
  border-radius: 20px;
  padding: 18px;
}

.stat-box p {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
  letter-spacing: 4px;
  font-weight: 900;
}

.stat-box h2 {
  margin: 10px 0 0;
  font-size: 42px;
}

.blue {
  color: #60a5fa;
}

.red {
  color: #fb7185;
}

.green {
  color: #34d399;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
  gap: 18px;
}

.vcc-card {
  min-height: 170px;
  background: rgba(15, 23, 42, 0.74);
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 24px;
  padding: 22px;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 18px 40px rgba(0,0,0,0.25);
}

.vcc-card:hover {
  border-color: rgba(59, 130, 246, 0.7);
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.card-top p {
  margin: 0;
  color: #60a5fa;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 3px;
}

.card-top span {
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 900;
}

.vcc-card h2 {
  margin: 20px 0 10px;
  font-size: 27px;
}

.card-note {
  margin: 0;
  color: #94a3b8;
  line-height: 1.55;
  font-size: 16px;
}

.section-page {
  width: 100%;
}

.section-header {
  border-radius: 28px;
  padding: 26px;
  border: 1px solid rgba(59, 130, 246, 0.34);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.96));
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

.section-kicker {
  margin: 0;
  color: #60a5fa;
  font-size: 13px;
  letter-spacing: 4px;
  font-weight: 900;
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

.primary-btn,
.secondary-btn {
  border-radius: 16px;
  padding: 13px 18px;
  cursor: pointer;
  font-weight: 900;
  letter-spacing: 2px;
}

.primary-btn {
  background: #3b82f6;
  color: #020617;
  border: 1px solid rgba(147,197,253,.6);
}

.secondary-btn {
  background: transparent;
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.45);
}

.sheet-card {
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(59, 130, 246, 0.28);
  border-radius: 28px;
  padding: 18px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.32);
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

@media (max-width: 900px) {
  .vcc-topbar {
    height: 88px;
    padding: 0 24px;
  }

  .vcc-brand-text {
    font-size: 22px;
    letter-spacing: 7px;
  }

  .vcc-dropdown-menu {
    top: 62px;
  }

  .vcc-scrim {
    inset: 88px 0 0 0;
  }

  .vcc-content {
    padding: 22px;
  }

  .command-stats {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .section-title-row {
    flex-direction: column;
  }

  .section-status {
    width: fit-content;
  }

  .section-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .vcc-topbar {
    height: 82px;
    padding: 0 18px;
  }

  .vcc-logo {
    width: 42px;
    height: 42px;
    border-radius: 14px;
  }

  .vcc-brand-text {
    font-size: 20px;
    letter-spacing: 6px;
  }

  .vcc-caret {
    font-size: 20px;
  }

  .vcc-dropdown-menu {
    top: 58px;
    width: calc(100vw - 36px);
  }

  .vcc-scrim {
    inset: 82px 0 0 0;
  }

  .vcc-content {
    padding: 16px;
  }

  .mission-panel,
  .section-header,
  .sheet-card {
    border-radius: 22px;
  }

  .mission-panel {
    padding: 22px;
    min-height: auto;
  }

  .stat-box h2 {
    font-size: 36px;
  }

  .vcc-card {
    min-height: 150px;
    padding: 19px;
  }

  .section-actions {
    grid-template-columns: 1fr;
  }

  .sheet-topline {
    flex-direction: column;
  }

  table {
    min-width: 850px;
  }
}
`;
