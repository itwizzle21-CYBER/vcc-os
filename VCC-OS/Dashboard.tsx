import { useEffect, useMemo, useState } from "react";

type SectionKey =
  | "money"
  | "bills"
  | "income"
  | "transactions"
  | "debt"
  | "savings"
  | "inventory"
  | "goals"
  | "missions"
  | "alerts";

type Row = Record<string, string>;

type Section = {
  key: SectionKey;
  label: string;
  subtitle: string;
  columns: string[];
  rows: Row[];
};

type Alert = {
  title: string;
  source: SectionKey;
  level: "Critical" | "High" | "Medium";
  proof: string;
  action: string;
};

type Metrics = {
  cashOnHand: number;
  weeklyIncome: number;
  otherIncome: number;
  transactionNet: number;
  operatingCash: number;
  billsPressure: number;
  foodNeeded: number;
  gasNeeded: number;
  debtPressure: number;
  totalPressure: number;
  spendableCash: number;
  savingsVault: number;
  protectedSavings: number;
  flexibleSavings: number;
  allowedWithdrawal: number;
  lockedSavings: number;
  unpaidBills: number;
  overdueBills: number;
  activeDebt: number;
  criticalInventory: number;
  openMissions: number;
  avgGoalProgress: number;
};

type RecommendedMove = {
  title: string;
  why: string;
  doFirst: string;
  doNotDo: string;
  checkpoint: string;
  source: SectionKey;
  tone: "danger" | "warning" | "stable";
};

const STORAGE_KEY = "vcc_os_protected_vault_v2";

const defaultSections: Section[] = [
  {
    key: "money",
    label: "Money Snapshot",
    subtitle: "Operating cash only. Savings is protected and does not count as spendable.",
    columns: ["Category", "Amount", "Status", "Priority", "Notes"],
    rows: [
      { Category: "Cash On Hand", Amount: "", Status: "Needs update", Priority: "Critical", Notes: "Money available right now." },
      { Category: "Weekly Income", Amount: "", Status: "Needs update", Priority: "High", Notes: "Job check or weekly expected income." },
      { Category: "Other Income", Amount: "", Status: "Optional", Priority: "Medium", Notes: "Side money, payout, help, etc." },
      { Category: "Food Needed", Amount: "", Status: "Needs update", Priority: "Critical", Notes: "Food money needed before next check." },
      { Category: "Gas Needed", Amount: "", Status: "Needs update", Priority: "Critical", Notes: "Gas money needed before next check." },
    ],
  },
  {
    key: "bills",
    label: "Bills",
    subtitle: "Bills due, paid, unpaid, and overdue.",
    columns: ["Bill", "Due Date", "Amount", "Status", "Priority", "Notes"],
    rows: [
      { Bill: "Car note", "Due Date": "", Amount: "", Status: "Unpaid", Priority: "Critical", Notes: "" },
      { Bill: "Phone", "Due Date": "", Amount: "", Status: "Unpaid", Priority: "High", Notes: "" },
      { Bill: "Insurance", "Due Date": "", Amount: "", Status: "Unpaid", Priority: "High", Notes: "" },
    ],
  },
  {
    key: "income",
    label: "Income",
    subtitle: "Paychecks, payouts, side money, and expected money.",
    columns: ["Source", "Expected", "Received", "Date", "Status", "Notes"],
    rows: [
      { Source: "Job check", Expected: "", Received: "", Date: "", Status: "Expected", Notes: "" },
      { Source: "Trading payout", Expected: "", Received: "", Date: "", Status: "Pending", Notes: "" },
      { Source: "Other income", Expected: "", Received: "", Date: "", Status: "Pending", Notes: "" },
    ],
  },
  {
    key: "transactions",
    label: "Transactions",
    subtitle: "Deposits, spending, leaks, and money movement.",
    columns: ["Date", "Type", "Category", "Description", "Amount", "Notes"],
    rows: [
      { Date: today(), Type: "Expense", Category: "Food", Description: "", Amount: "", Notes: "" },
      { Date: today(), Type: "Expense", Category: "Gas", Description: "", Amount: "", Notes: "" },
    ],
  },
  {
    key: "debt",
    label: "Debt",
    subtitle: "Debt balances and payments eating future cash.",
    columns: ["Debt", "Current Balance", "Payment Due", "Due Date", "Status", "Notes"],
    rows: [
      { Debt: "Car balance", "Current Balance": "", "Payment Due": "", "Due Date": "", Status: "Active", Notes: "" },
      { Debt: "MyPay", "Current Balance": "", "Payment Due": "", "Due Date": "", Status: "Active", Notes: "" },
      { Debt: "SpotMe", "Current Balance": "", "Payment Due": "", "Due Date": "", Status: "Active", Notes: "" },
    ],
  },
  {
    key: "savings",
    label: "Protected Savings Vault",
    subtitle: "Emergency, move-out, and investment money. This is not regular spending money.",
    columns: [
      "Goal",
      "Vault Type",
      "Target Amount",
      "Current Amount",
      "Protected",
      "Access Rule",
      "Allowed Withdrawal",
      "Withdrawal Reason",
      "Status",
      "Notes",
    ],
    rows: [
      {
        Goal: "Emergency Fund",
        "Vault Type": "Emergency",
        "Target Amount": "500",
        "Current Amount": "0",
        Protected: "Yes",
        "Access Rule": "Food, gas, shelter, car, shutoff, or true emergency only",
        "Allowed Withdrawal": "0",
        "Withdrawal Reason": "",
        Status: "Locked",
        Notes: "Protected. Do not count as spendable cash.",
      },
      {
        Goal: "Move-Out Fund",
        "Vault Type": "Future",
        "Target Amount": "",
        "Current Amount": "0",
        Protected: "Yes",
        "Access Rule": "Do not touch unless move-out mission requires it",
        "Allowed Withdrawal": "0",
        "Withdrawal Reason": "",
        Status: "Locked",
        Notes: "Future stability money.",
      },
      {
        Goal: "Investment Fund",
        "Vault Type": "Growth",
        "Target Amount": "",
        "Current Amount": "0",
        Protected: "Flexible",
        "Access Rule": "Approved investment only. No emotional spending.",
        "Allowed Withdrawal": "0",
        "Withdrawal Reason": "",
        Status: "Watch",
        Notes: "Only use when upside is clear and risk is controlled.",
      },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    subtitle: "Food, gas, hygiene, car, and home survival items.",
    columns: ["Item", "Category", "Current Level", "Needed", "Urgency", "Status", "Notes"],
    rows: [
      { Item: "Food", Category: "House", "Current Level": "Low", Needed: "", Urgency: "Critical", Status: "Needed", Notes: "" },
      { Item: "Gas", Category: "Car", "Current Level": "Low", Needed: "", Urgency: "High", Status: "Needed", Notes: "" },
    ],
  },
  {
    key: "goals",
    label: "Goals",
    subtitle: "Big-picture progress toward freedom, stability, and growth.",
    columns: ["Goal", "Category", "Target", "Current", "Progress %", "Priority", "Next Step", "Notes"],
    rows: [
      { Goal: "Emergency Fund", Category: "Money", Target: "500", Current: "0", "Progress %": "0", Priority: "High", "Next Step": "Save first amount", Notes: "" },
      { Goal: "VCC System", Category: "System", Target: "Clean app", Current: "Working", "Progress %": "90", Priority: "High", "Next Step": "Recommended Move logic", Notes: "" },
    ],
  },
  {
    key: "missions",
    label: "Missions",
    subtitle: "Daily moves that protect stability and build momentum.",
    columns: ["Mission", "Priority", "Status", "Due Date", "Next Action", "Notes"],
    rows: [
      { Mission: "Update money numbers", Priority: "High", Status: "Open", "Due Date": today(), "Next Action": "Enter cash, income, bills, food, gas, and debt", Notes: "" },
      { Mission: "Protect savings", Priority: "High", Status: "Open", "Due Date": today(), "Next Action": "Use operating cash before touching savings", Notes: "" },
    ],
  },
  {
    key: "alerts",
    label: "Priority Alerts",
    subtitle: "Auto-generated blockers from VCC data.",
    columns: [],
    rows: [],
  },
];

export default function Dashboard() {
  const [view, setView] = useState<SectionKey | "dashboard">("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>(() => loadSections());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  const metrics = useMemo(() => getMetrics(sections), [sections]);
  const alerts = useMemo(() => getAlerts(metrics, sections), [metrics, sections]);
  const recommendedMove = useMemo(() => getRecommendedMove(metrics, alerts), [metrics, alerts]);
  const activeSection = sections.find((section) => section.key === view);

  function open(nextView: SectionKey | "dashboard") {
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
          rows: section.rows.map((row, index) =>
            index === rowIndex ? { ...row, [column]: value } : row
          ),
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
        return { ...section, rows: [...section.rows, emptyRow] };
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
    const confirmed = window.confirm("Reset all VCC data to starter setup?");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    setSections(structuredClone(defaultSections));
    setView("dashboard");
    setMenuOpen(false);
  }

  return (
    <main className="vcc">
      <style>{styles}</style>

      <header className="topbar">
        <button className="brand" onClick={() => setMenuOpen((current) => !current)}>
          <span className="logo">⌁</span>
          <span>VCC_OS</span>
          <span className="caret">{menuOpen ? "⌃" : "⌄"}</span>
        </button>

        {menuOpen && (
          <nav className="menu">
            <button className={view === "dashboard" ? "active" : ""} onClick={() => open("dashboard")}>
              Dashboard
            </button>

            {sections.map((section) => (
              <button
                key={section.key}
                className={view === section.key ? "active" : ""}
                onClick={() => open(section.key)}
              >
                {section.label}
              </button>
            ))}

            <button className="resetData" onClick={resetAllData}>
              Reset All Data
            </button>
          </nav>
        )}
      </header>

      {view === "dashboard" && (
        <DashboardHome
          sections={sections}
          metrics={metrics}
          alerts={alerts}
          recommendedMove={recommendedMove}
          open={open}
        />
      )}

      {activeSection?.key === "alerts" && (
        <AlertsPage alerts={alerts} open={open} back={() => open("dashboard")} />
      )}

      {activeSection && activeSection.key !== "alerts" && (
        <SectionPage
          section={activeSection}
          updateCell={updateCell}
          addRow={addRow}
          deleteRow={deleteRow}
          resetSection={resetSection}
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
  open: (view: SectionKey | "dashboard") => void;
}) {
  const topAlert = alerts[0];

  return (
    <section className="content">
      <div className="hero">
        <div>
          <div className="statusline">
            <span className="online">● ONLINE</span>
            <span>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
          </div>

          <p className="kicker">TODAY_BRIEFING</p>
          <h1>{topAlert ? topAlert.title : "VCC is clear right now"}</h1>
          <p className="heroText">
            {topAlert
              ? topAlert.action
              : "Keep the numbers updated. Use operating cash first and keep savings protected."}
          </p>
        </div>

        <button className="primary" onClick={() => open(topAlert?.source ?? "missions")}>
          INVESTIGATE →
        </button>
      </div>

      <RecommendedMovePanel move={recommendedMove} open={open} />

      <div className="proof">
        <ProofCard label="Spendable Cash" value={money(metrics.spendableCash)} source="money" open={open} danger={metrics.spendableCash < 0} />
        <ProofCard label="Operating Cash" value={money(metrics.operatingCash)} source="money" open={open} />
        <ProofCard label="Total Pressure" value={money(metrics.totalPressure)} source="money" open={open} danger={metrics.totalPressure > metrics.operatingCash} />
        <ProofCard label="Protected Vault" value={money(metrics.protectedSavings)} source="savings" open={open} />
        <ProofCard label="Allowed Pull" value={money(metrics.allowedWithdrawal)} source="savings" open={open} />
        <ProofCard label="Auto Alerts" value={String(alerts.length)} source="alerts" open={open} danger={alerts.length > 0} />
      </div>

      {alerts.length > 0 && (
        <div className="stack">
          <div className="stackHead">
            <p>OBJECTIVE_STACK</p>
            <span>{alerts.length} ACTIVE</span>
          </div>

          {alerts.slice(0, 7).map((alert, index) => (
            <button key={`${alert.title}-${index}`} className={`stackItem ${alert.level.toLowerCase()}`} onClick={() => open(alert.source)}>
              <span>{index + 1}</span>
              <div>
                <p>{alert.level} · {labelFor(alert.source)}</p>
                <h3>{alert.title}</h3>
                <small>{alert.proof}</small>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="cards">
        {sections.map((section) => {
          const card = cardFor(section.key, metrics, alerts);
          return (
            <button key={section.key} className={`card ${card.tone}`} onClick={() => open(section.key)}>
              <p>{section.label}</p>
              <h2>{card.value}</h2>
              <span>{card.label}</span>
              <small>{card.detail}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RecommendedMovePanel({
  move,
  open,
}: {
  move: RecommendedMove;
  open: (view: SectionKey | "dashboard") => void;
}) {
  return (
    <button className={`movePanel ${move.tone}`} onClick={() => open(move.source)}>
      <div className="moveTop">
        <div>
          <p className="kicker">TODAY_RECOMMENDED_MOVE</p>
          <h2>{move.title}</h2>
        </div>
        <span>OPEN SOURCE →</span>
      </div>

      <div className="moveGrid">
        <div>
          <p>WHY</p>
          <h3>{move.why}</h3>
        </div>

        <div>
          <p>DO FIRST</p>
          <h3>{move.doFirst}</h3>
        </div>

        <div>
          <p>DO NOT DO</p>
          <h3>{move.doNotDo}</h3>
        </div>

        <div>
          <p>NEXT CHECKPOINT</p>
          <h3>{move.checkpoint}</h3>
        </div>
      </div>
    </button>
  );
}

function ProofCard({
  label,
  value,
  source,
  open,
  danger = false,
}: {
  label: string;
  value: string;
  source: SectionKey;
  open: (view: SectionKey | "dashboard") => void;
  danger?: boolean;
}) {
  return (
    <button className={`proofCard ${danger ? "danger" : ""}`} onClick={() => open(source)}>
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{labelFor(source)}</span>
    </button>
  );
}

function AlertsPage({
  alerts,
  open,
  back,
}: {
  alerts: Alert[];
  open: (view: SectionKey | "dashboard") => void;
  back: () => void;
}) {
  return (
    <section className="content">
      <PageHeader title="Priority Alerts" subtitle="Auto-generated blockers from your VCC data." back={back} />

      {alerts.length === 0 ? (
        <div className="empty">
          <h2>No major blockers detected.</h2>
          <p>Keep the dashboard updated and VCC will keep watching.</p>
        </div>
      ) : (
        <div className="alertGrid">
          {alerts.map((alert, index) => (
            <button key={`${alert.title}-${index}`} className={`alert ${alert.level.toLowerCase()}`} onClick={() => open(alert.source)}>
              <p>{alert.level} · {labelFor(alert.source)}</p>
              <h2>{alert.title}</h2>
              <span>{alert.proof}</span>
              <strong>{alert.action}</strong>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionPage({
  section,
  updateCell,
  addRow,
  deleteRow,
  resetSection,
  back,
}: {
  section: Section;
  updateCell: (sectionKey: SectionKey, rowIndex: number, column: string, value: string) => void;
  addRow: (sectionKey: SectionKey) => void;
  deleteRow: (sectionKey: SectionKey, rowIndex: number) => void;
  resetSection: (sectionKey: SectionKey) => void;
  back: () => void;
}) {
  return (
    <section className="content">
      <PageHeader title={section.label} subtitle={section.subtitle} back={back} />

      <div className="actions">
        <button className="secondary" onClick={() => resetSection(section.key)}>RESET</button>
        <button className="primary" onClick={() => addRow(section.key)}>+ ADD ROW</button>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              {section.columns.map((column) => <th key={column}>{column}</th>)}
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
                      placeholder="-"
                    />
                  </td>
                ))}
                <td>
                  <button className="delete" onClick={() => deleteRow(section.key, rowIndex)}>DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PageHeader({ title, subtitle, back }: { title: string; subtitle: string; back: () => void }) {
  return (
    <div className="pageHeader">
      <button className="back" onClick={back}>← DASHBOARD</button>
      <p className="kicker">DEDICATED_PAGE</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

function getMetrics(sections: Section[]): Metrics {
  const moneySection = getSection(sections, "money");
  const billsSection = getSection(sections, "bills");
  const incomeSection = getSection(sections, "income");
  const transactionsSection = getSection(sections, "transactions");
  const debtSection = getSection(sections, "debt");
  const savingsSection = getSection(sections, "savings");
  const inventorySection = getSection(sections, "inventory");
  const goalsSection = getSection(sections, "goals");
  const missionsSection = getSection(sections, "missions");

  const cashOnHand = moneyAmount(moneySection, "Cash On Hand");
  const weeklyIncome = moneyAmount(moneySection, "Weekly Income");
  const otherIncome = moneyAmount(moneySection, "Other Income");
  const foodNeeded = moneyAmount(moneySection, "Food Needed");
  const gasNeeded = moneyAmount(moneySection, "Gas Needed");

  const receivedIncome = incomeSection.rows.reduce((sum, row) => sum + number(row.Received), 0);

  const transactionNet = transactionsSection.rows.reduce((sum, row) => {
    const amount = number(row.Amount);
    const type = (row.Type ?? "").toLowerCase();
    return type === "income" || type === "deposit" ? sum + amount : sum - amount;
  }, 0);

  const unpaidBills = billsSection.rows.filter((row) => !isPaid(row.Status));
  const billsPressure = unpaidBills.reduce((sum, row) => sum + number(row.Amount), 0);
  const overdueBills = unpaidBills.filter((row) => isOverdue(row["Due Date"]) || (row.Status ?? "").toLowerCase() === "overdue").length;

  const activeDebtRows = debtSection.rows.filter((row) => !["paid", "closed", "done"].includes((row.Status ?? "").toLowerCase()));
  const debtPressure = activeDebtRows.reduce((sum, row) => sum + number(row["Payment Due"]), 0);

  let savingsVault = 0;
  let protectedSavings = 0;
  let flexibleSavings = 0;
  let allowedWithdrawal = 0;

  savingsSection.rows.forEach((row) => {
    const current = number(row["Current Amount"]);
    const allowed = number(row["Allowed Withdrawal"]);
    const protectedFlag = (row.Protected ?? "").toLowerCase();
    const status = (row.Status ?? "").toLowerCase();

    savingsVault += current;

    if (protectedFlag === "yes") protectedSavings += current;
    else flexibleSavings += current;

    if (["approved", "allowed", "unlocked"].includes(status)) {
      allowedWithdrawal += Math.min(allowed, current);
    }
  });

  const operatingCash = cashOnHand + weeklyIncome + otherIncome + receivedIncome + transactionNet;
  const totalPressure = billsPressure + foodNeeded + gasNeeded + debtPressure;
  const spendableCash = operatingCash - totalPressure;
  const lockedSavings = Math.max(savingsVault - allowedWithdrawal, 0);

  const criticalInventory = inventorySection.rows.filter((row) => {
    const urgency = (row.Urgency ?? "").toLowerCase();
    const status = (row.Status ?? "").toLowerCase();
    return ["critical", "high"].includes(urgency) && !["done", "handled", "bought"].includes(status);
  }).length;

  const openMissions = missionsSection.rows.filter((row) => !["done", "closed", "complete"].includes((row.Status ?? "").toLowerCase())).length;

  const avgGoalProgress =
    goalsSection.rows.length === 0
      ? 0
      : Math.round(goalsSection.rows.reduce((sum, row) => sum + number(row["Progress %"]), 0) / goalsSection.rows.length);

  return {
    cashOnHand,
    weeklyIncome,
    otherIncome,
    transactionNet,
    operatingCash,
    billsPressure,
    foodNeeded,
    gasNeeded,
    debtPressure,
    totalPressure,
    spendableCash,
    savingsVault,
    protectedSavings,
    flexibleSavings,
    allowedWithdrawal,
    lockedSavings,
    unpaidBills: unpaidBills.length,
    overdueBills,
    activeDebt: activeDebtRows.length,
    criticalInventory,
    openMissions,
    avgGoalProgress,
  };
}

function getAlerts(metrics: Metrics, sections: Section[]): Alert[] {
  const alerts: Alert[] = [];
  const inventory = getSection(sections, "inventory");
  const goals = getSection(sections, "goals");

  if (metrics.cashOnHand === 0 && metrics.weeklyIncome === 0 && metrics.otherIncome === 0) {
    alerts.push({
      title: "Money Snapshot is missing core numbers",
      source: "money",
      level: "Critical",
      proof: "Cash On Hand, Weekly Income, and Other Income are blank or zero.",
      action: "Enter real operating cash first so VCC can judge the situation.",
    });
  }

  if (metrics.spendableCash < 0) {
    alerts.push({
      title: "Operating cash is short",
      source: "money",
      level: "Critical",
      proof: `Spendable Cash is ${money(metrics.spendableCash)}. Savings is not counted as spendable.`,
      action: "Reduce pressure, increase income, or decide what must wait before touching savings.",
    });
  }

  if (metrics.totalPressure > metrics.operatingCash && metrics.totalPressure > 0) {
    alerts.push({
      title: "Pressure is higher than operating cash",
      source: "money",
      level: "Critical",
      proof: `Pressure is ${money(metrics.totalPressure)} and operating cash is ${money(metrics.operatingCash)}.`,
      action: "Prioritize food, gas, car, phone, and anything that prevents worse damage.",
    });
  }

  if (metrics.spendableCash < 0 && metrics.protectedSavings > 0 && metrics.allowedWithdrawal <= 0) {
    alerts.push({
      title: "Savings exists but is protected",
      source: "savings",
      level: "High",
      proof: `Protected Savings is ${money(metrics.protectedSavings)}, but Allowed Withdrawal is ${money(metrics.allowedWithdrawal)}.`,
      action: "Do not pull from savings unless the Savings page approves the reason.",
    });
  }

  if (metrics.allowedWithdrawal > 0) {
    alerts.push({
      title: "Savings withdrawal is approved",
      source: "savings",
      level: "Medium",
      proof: `Allowed Withdrawal is ${money(metrics.allowedWithdrawal)}.`,
      action: "Only use the approved amount for the listed reason.",
    });
  }

  if (metrics.overdueBills > 0) {
    alerts.push({
      title: "Overdue bills need action",
      source: "bills",
      level: "Critical",
      proof: `${metrics.overdueBills} bill(s) are overdue or past due.`,
      action: "Handle overdue bills before wants or low-priority spending.",
    });
  }

  if (metrics.unpaidBills > 0) {
    alerts.push({
      title: "Unpaid bills are creating pressure",
      source: "bills",
      level: metrics.unpaidBills >= 3 ? "Critical" : "High",
      proof: `${metrics.unpaidBills} unpaid bill(s). Bill pressure: ${money(metrics.billsPressure)}.`,
      action: "Decide what gets paid now, delayed, or watched.",
    });
  }

  if (metrics.activeDebt > 0) {
    alerts.push({
      title: "Active debt is eating future cash",
      source: "debt",
      level: "High",
      proof: `${metrics.activeDebt} active debt item(s). Payment pressure: ${money(metrics.debtPressure)}.`,
      action: "Update balances and attack the debt that blocks the next check.",
    });
  }

  if (metrics.savingsVault <= 0) {
    alerts.push({
      title: "No savings buffer yet",
      source: "savings",
      level: "High",
      proof: "Savings Vault is currently zero.",
      action: "Build even a small emergency buffer after survival pressure is handled.",
    });
  }

  inventory.rows.forEach((row) => {
    const urgency = (row.Urgency ?? "").toLowerCase();
    const status = (row.Status ?? "").toLowerCase();
    if (["critical", "high"].includes(urgency) && !["done", "handled", "bought"].includes(status)) {
      alerts.push({
        title: `${row.Item || "Inventory item"} needs attention`,
        source: "inventory",
        level: urgency === "critical" ? "Critical" : "High",
        proof: `${row.Item || "Item"} is marked ${row.Urgency || "urgent"}.`,
        action: "Handle or update this before it becomes a bigger problem.",
      });
    }
  });

  goals.rows.forEach((row) => {
    const priority = (row.Priority ?? "").toLowerCase();
    const progress = number(row["Progress %"]);
    if (priority === "high" && progress < 25) {
      alerts.push({
        title: `${row.Goal || "Goal"} is behind`,
        source: "goals",
        level: "High",
        proof: `${row.Goal || "Goal"} is high priority but only ${progress}% complete.`,
        action: "Set the next small step or adjust the goal.",
      });
    }
  });

  return alerts.sort((a, b) => levelWeight(b.level) - levelWeight(a.level));
}

function getRecommendedMove(metrics: Metrics, alerts: Alert[]): RecommendedMove {
  if (metrics.cashOnHand === 0 && metrics.weeklyIncome === 0 && metrics.otherIncome === 0) {
    return {
      title: "Update Money Snapshot first",
      why: "VCC cannot make a clean recommendation until it knows your operating cash.",
      doFirst: "Enter Cash On Hand, Weekly Income, Food Needed, and Gas Needed.",
      doNotDo: "Do not make spending decisions from blank numbers.",
      checkpoint: "After numbers are entered, return to Dashboard and check the new recommendation.",
      source: "money",
      tone: "danger",
    };
  }

  if (metrics.overdueBills > 0) {
    return {
      title: "Handle overdue bills first",
      why: `${metrics.overdueBills} bill(s) are overdue or past due. That can create bigger damage fast.`,
      doFirst: "Open Bills and decide what must be paid, delayed, or negotiated today.",
      doNotDo: "Do not spend on wants or pull savings without a survival reason.",
      checkpoint: "Update bill statuses after action is taken.",
      source: "bills",
      tone: "danger",
    };
  }

  if (metrics.spendableCash < 0 && metrics.allowedWithdrawal > 0) {
    return {
      title: "Use only the approved savings pull if necessary",
      why: `Spendable Cash is ${money(metrics.spendableCash)}, but ${money(metrics.allowedWithdrawal)} is approved for withdrawal.`,
      doFirst: "Use operating cash first. Pull only the approved amount for the listed reason.",
      doNotDo: "Do not treat the whole Savings Vault like spending money.",
      checkpoint: "After using the withdrawal, lower the Allowed Withdrawal amount.",
      source: "savings",
      tone: "warning",
    };
  }

  if (metrics.spendableCash < 0 && metrics.protectedSavings > 0) {
    return {
      title: "Protect savings and reduce pressure",
      why: `Spendable Cash is ${money(metrics.spendableCash)}, but savings is locked. That means pressure must be managed from operating cash first.`,
      doFirst: "Cut or delay the lowest-priority pressure and look for an income move.",
      doNotDo: "Do not break the Emergency Fund unless the Savings page approves it.",
      checkpoint: "Recheck Spendable Cash after adjusting bills, food, gas, or debt pressure.",
      source: "money",
      tone: "danger",
    };
  }

  if (metrics.spendableCash < 0) {
    return {
      title: "Stop spending and find the cash gap",
      why: `Spendable Cash is ${money(metrics.spendableCash)} and there is no approved savings pull.`,
      doFirst: "Open Money Snapshot and identify the biggest pressure item.",
      doNotDo: "Do not add new spending, trading risk, or nonessential purchases.",
      checkpoint: "Get Spendable Cash back to zero or higher.",
      source: "money",
      tone: "danger",
    };
  }

  if (metrics.criticalInventory > 0) {
    return {
      title: "Handle survival inventory",
      why: `${metrics.criticalInventory} inventory item(s) are critical or high urgency.`,
      doFirst: "Open Inventory and handle food, gas, hygiene, car, or home needs first.",
      doNotDo: "Do not ignore small survival items until they become emergencies.",
      checkpoint: "Mark inventory items handled once covered.",
      source: "inventory",
      tone: "warning",
    };
  }

  if (metrics.unpaidBills > 0) {
    return {
      title: "Plan unpaid bills before spending",
      why: `${metrics.unpaidBills} bill(s) are unpaid, with ${money(metrics.billsPressure)} in bill pressure.`,
      doFirst: "Open Bills and decide what gets paid from spendable cash.",
      doNotDo: "Do not spend leftover cash until bill priority is clear.",
      checkpoint: "Update Paid/Unpaid statuses after payment decisions.",
      source: "bills",
      tone: "warning",
    };
  }

  if (metrics.savingsVault <= 0 && metrics.spendableCash > 0) {
    return {
      title: "Start the emergency buffer",
      why: "Spendable Cash is positive, but the Savings Vault is empty.",
      doFirst: "Move a small amount into Emergency Fund after survival needs are covered.",
      doNotDo: "Do not over-save if it leaves food, gas, or bills short.",
      checkpoint: "Update Emergency Fund Current Amount.",
      source: "savings",
      tone: "stable",
    };
  }

  if (metrics.openMissions > 0) {
    return {
      title: "Execute the next open mission",
      why: `${metrics.openMissions} mission(s) are still open and the money pressure is manageable right now.`,
      doFirst: "Open Missions and complete the smallest high-priority action.",
      doNotDo: "Do not drift just because no crisis is flashing.",
      checkpoint: "Mark one mission Done before adding more.",
      source: "missions",
      tone: "stable",
    };
  }

  return {
    title: "Maintain discipline and keep the vault protected",
    why: "No critical blocker is leading right now.",
    doFirst: "Keep numbers current and protect savings from random spending.",
    doNotDo: "Do not create new pressure just because the dashboard looks stable.",
    checkpoint: "Update VCC again after the next money move.",
    source: alerts[0]?.source ?? "missions",
    tone: "stable",
  };
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
        label: "Snapshot income",
        detail: "Job check + other income",
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
        detail: `${metrics.activeDebt} active debts`,
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
        label: "Critical items",
        detail: "Food, gas, home, car",
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

function loadSections() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultSections);

  try {
    const parsed = JSON.parse(saved) as Section[];
    if (!Array.isArray(parsed)) return structuredClone(defaultSections);

    return defaultSections.map((defaultSection) => {
      const savedSection = parsed.find((section) => section.key === defaultSection.key);
      if (!savedSection) return structuredClone(defaultSection);

      return {
        ...defaultSection,
        rows: Array.isArray(savedSection.rows) ? savedSection.rows : defaultSection.rows,
      };
    });
  } catch {
    return structuredClone(defaultSections);
  }
}

function getSection(sections: Section[], key: SectionKey) {
  return sections.find((section) => section.key === key) ?? defaultSections.find((section) => section.key === key)!;
}

function moneyAmount(section: Section, category: string) {
  const row = section.rows.find((item) => item.Category === category);
  return number(row?.Amount);
}

function number(value: string | undefined) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[$,]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isPaid(status: string | undefined) {
  return ["paid", "done", "closed"].includes((status ?? "").toLowerCase());
}

function isOverdue(date: string | undefined) {
  if (!date) return false;
  const dueDate = new Date(`${date}T23:59:59`);
  if (Number.isNaN(dueDate.getTime())) return false;
  return dueDate < new Date();
}

function levelWeight(level: Alert["level"]) {
  if (level === "Critical") return 3;
  if (level === "High") return 2;
  return 1;
}

function labelFor(key: SectionKey) {
  const labels: Record<SectionKey, string> = {
    money: "Money Snapshot",
    bills: "Bills",
    income: "Income",
    transactions: "Transactions",
    debt: "Debt",
    savings: "Protected Savings Vault",
    inventory: "Inventory",
    goals: "Goals",
    missions: "Missions",
    alerts: "Priority Alerts",
  };

  return labels[key];
}

const styles = `
* { box-sizing: border-box; }

html,
body,
#root {
  margin: 0;
  min-height: 100%;
  background: #020617;
}

button,
input {
  font: inherit;
}

.vcc {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 28rem),
    linear-gradient(180deg, #020617, #030712);
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  min-height: 82px;
  display: flex;
  align-items: center;
  padding: 18px 28px;
  background: rgba(2, 6, 23, 0.94);
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  backdrop-filter: blur(18px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  background: transparent;
  border: 0;
  color: #60a5fa;
  font-size: 25px;
  font-weight: 900;
  letter-spacing: 8px;
  cursor: pointer;
}

.logo {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(96, 165, 250, 0.5);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.9);
}

.caret {
  color: #94a3b8;
  letter-spacing: 0;
}

.menu {
  position: absolute;
  top: 74px;
  left: 28px;
  width: min(390px, calc(100vw - 56px));
  max-height: calc(100vh - 105px);
  overflow: auto;
  background: rgba(2, 6, 23, 0.98);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 22px;
  padding: 12px;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.55);
}

.menu button {
  width: 100%;
  display: block;
  padding: 15px;
  margin-bottom: 6px;
  text-align: left;
  color: #cbd5e1;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 900;
}

.menu button.active,
.menu button:hover {
  color: #60a5fa;
  background: rgba(37, 99, 235, 0.14);
  border-color: rgba(96, 165, 250, 0.34);
}

.menu .resetData {
  margin-top: 12px;
  color: #fb7185;
  border-color: rgba(251, 113, 133, 0.28);
}

.content {
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 28px;
}

.hero,
.pageHeader,
.tableWrap,
.empty,
.stack,
.alert,
.movePanel {
  border: 1px solid rgba(96, 165, 250, 0.28);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.95));
  border-radius: 28px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 22px;
  padding: 28px;
  margin-bottom: 18px;
}

.statusline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  color: #94a3b8;
  margin-bottom: 18px;
  font-size: 18px;
  letter-spacing: 4px;
  font-weight: 900;
}

.online {
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.45);
  background: rgba(16, 185, 129, 0.12);
  border-radius: 12px;
  padding: 10px 15px;
}

.kicker {
  margin: 0 0 12px;
  color: #60a5fa;
  font-size: 13px;
  letter-spacing: 5px;
  font-weight: 900;
}

.hero h1,
.pageHeader h1 {
  margin: 0;
  font-size: clamp(38px, 6vw, 68px);
  line-height: 1.02;
  letter-spacing: -2px;
}

.heroText {
  margin: 18px 0 0;
  max-width: 900px;
  color: #cbd5e1;
  font-size: clamp(17px, 2vw, 22px);
  line-height: 1.45;
}

.primary,
.secondary,
.back,
.delete {
  border-radius: 15px;
  padding: 13px 18px;
  cursor: pointer;
  font-weight: 900;
  letter-spacing: 2px;
}

.primary {
  align-self: flex-start;
  background: #3b82f6;
  color: #020617;
  border: 1px solid rgba(147, 197, 253, 0.6);
  white-space: nowrap;
}

.secondary,
.back {
  background: transparent;
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.45);
}

.back {
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.42);
  margin-bottom: 18px;
}

.delete {
  background: transparent;
  color: #fb7185;
  border: 1px solid rgba(251, 113, 133, 0.45);
}

.movePanel {
  width: 100%;
  text-align: left;
  color: #f8fafc;
  padding: 22px;
  margin-bottom: 18px;
  cursor: pointer;
}

.movePanel.danger {
  border-color: rgba(251, 113, 133, 0.5);
  background: linear-gradient(180deg, rgba(127, 29, 29, 0.24), rgba(15, 23, 42, 0.92));
}

.movePanel.warning {
  border-color: rgba(251, 191, 36, 0.5);
  background: linear-gradient(180deg, rgba(120, 53, 15, 0.24), rgba(15, 23, 42, 0.92));
}

.movePanel.stable {
  border-color: rgba(52, 211, 153, 0.38);
}

.moveTop {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.moveTop h2 {
  margin: 0;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.05;
}

.moveTop span {
  color: #60a5fa;
  font-weight: 900;
  letter-spacing: 2px;
  white-space: nowrap;
}

.moveGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.moveGrid div {
  background: rgba(2, 6, 23, 0.42);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  padding: 15px;
}

.moveGrid p {
  margin: 0 0 10px;
  color: #94a3b8;
  font-size: 12px;
  letter-spacing: 3px;
  font-weight: 900;
}

.moveGrid h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 16px;
  line-height: 1.45;
}

.proof {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.proofCard,
.card {
  text-align: left;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  padding: 18px;
  cursor: pointer;
}

.proofCard.danger,
.card.bad {
  border-color: rgba(251, 113, 133, 0.45);
  background: linear-gradient(180deg, rgba(127, 29, 29, 0.22), rgba(15, 23, 42, 0.82));
}

.card.good {
  border-color: rgba(52, 211, 153, 0.34);
}

.card.warn {
  border-color: rgba(251, 191, 36, 0.42);
}

.proofCard p,
.card p,
.alert p,
.stackHead p {
  margin: 0;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-size: 12px;
  font-weight: 900;
}

.proofCard h3,
.card h2 {
  margin: 12px 0 8px;
  color: #60a5fa;
  font-size: clamp(24px, 3vw, 34px);
}

.proofCard span,
.card span,
.card small,
.alert span {
  color: #cbd5e1;
  line-height: 1.45;
}

.stack {
  padding: 18px;
  margin-bottom: 18px;
}

.stackHead {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stackHead span {
  color: #fbbf24;
  font-weight: 900;
  letter-spacing: 3px;
}

.stackItem {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  text-align: left;
  color: #f8fafc;
  background: rgba(2, 6, 23, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
}

.stackItem.critical {
  border-color: rgba(251, 113, 133, 0.45);
}

.stackItem.high {
  border-color: rgba(251, 191, 36, 0.42);
}

.stackItem > span {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.18);
  color: #60a5fa;
  font-weight: 900;
}

.stackItem h3 {
  margin: 6px 0;
}

.cards {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.card {
  min-height: 180px;
}

.card small {
  display: block;
  margin-top: 14px;
  color: #94a3b8;
}

.pageHeader {
  padding: 28px;
  margin-bottom: 18px;
}

.pageHeader > p:last-child {
  color: #cbd5e1;
  font-size: 18px;
  line-height: 1.45;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.tableWrap {
  overflow-x: auto;
  padding: 14px;
}

table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  background: #020617;
  border-radius: 16px;
  overflow: hidden;
}

th {
  background: #07111f;
  color: #60a5fa;
  text-align: left;
  padding: 13px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  white-space: nowrap;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

td {
  padding: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  border-right: 1px solid rgba(148, 163, 184, 0.06);
}

td input {
  width: 100%;
  min-width: 150px;
  background: rgba(15, 23, 42, 0.84);
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  padding: 11px;
  outline: none;
}

td input:focus {
  border-color: rgba(96, 165, 250, 0.8);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.16);
}

.alertGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.alert {
  text-align: left;
  color: #f8fafc;
  padding: 20px;
  cursor: pointer;
}

.alert.critical {
  border-color: rgba(251, 113, 133, 0.45);
}

.alert.high {
  border-color: rgba(251, 191, 36, 0.42);
}

.alert h2 {
  margin: 14px 0;
}

.alert strong {
  display: block;
  margin-top: 14px;
}

.empty {
  padding: 24px;
}

@media (max-width: 1200px) {
  .proof {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .moveGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .topbar {
    padding: 14px 18px;
  }

  .brand {
    font-size: 20px;
    letter-spacing: 6px;
  }

  .content {
    padding: 16px;
  }

  .hero {
    flex-direction: column;
    padding: 22px;
  }

  .primary {
    width: 100%;
  }

  .moveTop {
    flex-direction: column;
  }

  .moveGrid,
  .proof,
  .cards,
  .alertGrid {
    grid-template-columns: 1fr;
  }

  .hero h1,
  .pageHeader h1 {
    font-size: 38px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .secondary,
  .primary {
    width: 100%;
  }
}

/* ===== VCC COMPACT DAILY MODE OVERRIDES ===== */

.content {
  padding: 18px;
}

.topbar {
  min-height: 70px;
  padding: 12px 22px;
}

.brand {
  font-size: 21px;
  letter-spacing: 6px;
}

.logo {
  width: 42px;
  height: 42px;
  border-radius: 15px;
}

.menu {
  top: 64px;
}

.hero {
  padding: 20px;
  margin-bottom: 14px;
  border-radius: 22px;
}

.statusline {
  margin-bottom: 12px;
  font-size: 15px;
  gap: 12px;
}

.online {
  padding: 8px 12px;
}

.kicker {
  margin-bottom: 8px;
  font-size: 11px;
  letter-spacing: 4px;
}

.hero h1,
.pageHeader h1 {
  font-size: clamp(30px, 4.8vw, 52px);
  line-height: 1;
}

.heroText {
  margin-top: 12px;
  font-size: clamp(15px, 1.6vw, 18px);
  line-height: 1.35;
}

.primary,
.secondary,
.back,
.delete {
  padding: 11px 15px;
  border-radius: 13px;
}

.movePanel {
  padding: 18px;
  margin-bottom: 14px;
  border-radius: 22px;
}

.moveTop {
  margin-bottom: 14px;
}

.moveTop h2 {
  font-size: clamp(25px, 3.3vw, 38px);
}

.moveGrid {
  gap: 10px;
}

.moveGrid div {
  padding: 12px;
  border-radius: 14px;
}

.moveGrid p {
  margin-bottom: 7px;
  font-size: 10px;
  letter-spacing: 3px;
}

.moveGrid h3 {
  font-size: 14px;
  line-height: 1.35;
}

.proof {
  gap: 10px;
  margin-bottom: 14px;
}

.proofCard,
.card {
  padding: 14px;
  border-radius: 16px;
}

.proofCard p,
.card p,
.alert p,
.stackHead p {
  font-size: 10px;
  letter-spacing: 3px;
}

.proofCard h3,
.card h2 {
  margin: 8px 0 5px;
  font-size: clamp(24px, 2.5vw, 31px);
}

.cards {
  gap: 10px;
}

.card {
  min-height: 135px;
}

.card small {
  margin-top: 9px;
}

.stack {
  padding: 14px;
  margin-bottom: 14px;
  border-radius: 22px;
}

.stackItem {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 15px;
}

.stackItem > span {
  width: 31px;
  height: 31px;
  border-radius: 10px;
}

.stackItem h3 {
  margin: 4px 0;
  font-size: 18px;
}

.stackItem small {
  font-size: 13px;
}

.pageHeader {
  padding: 20px;
  margin-bottom: 14px;
  border-radius: 22px;
}

.pageHeader > p:last-child {
  font-size: 16px;
}

.actions {
  margin-bottom: 14px;
}

.tableWrap {
  padding: 10px;
  border-radius: 20px;
}

th {
  padding: 10px;
}

td {
  padding: 6px;
}

td input {
  padding: 9px;
  min-width: 135px;
}

.alertGrid {
  gap: 10px;
}

.alert {
  padding: 16px;
  border-radius: 20px;
}

.alert h2 {
  margin: 10px 0;
}

.empty {
  padding: 18px;
}

@media (max-width: 760px) {
  .topbar {
    min-height: 64px;
    padding: 10px 14px;
  }

  .brand {
    font-size: 18px;
    letter-spacing: 5px;
    gap: 10px;
  }

  .logo {
    width: 38px;
    height: 38px;
  }

  .menu {
    top: 58px;
    left: 14px;
    width: calc(100vw - 28px);
  }

  .content {
    padding: 12px;
  }

  .hero {
    padding: 16px;
  }

  .hero h1,
  .pageHeader h1 {
    font-size: 32px;
  }

  .movePanel {
    padding: 15px;
  }

  .moveTop h2 {
    font-size: 28px;
  }

  .proofCard,
  .card {
    padding: 13px;
  }

  .card {
    min-height: 118px;
  }

  .stackItem {
    grid-template-columns: 30px 1fr;
    gap: 10px;
  }

  .stackItem h3 {
    font-size: 16px;
  }

  table {
    min-width: 850px;
  }
}

`;
