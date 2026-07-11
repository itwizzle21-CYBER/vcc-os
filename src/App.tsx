import { useEffect, useMemo, useState } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./components/dashboard/Dashboard";
import PaycheckPlanner from "./components/modules/PaycheckPlanner";
import Spreadsheet from "./components/shared/Spreadsheet";
import SummaryGrid from "./components/shared/SummaryGrid";
import { formatCurrency, isBlankRow, toNumber } from "./lib/calculations/currency";
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
      {path === "/" && <Dashboard financialState={financialState} decisionState={decisionState} data={data} settings={data.settings} onSettingsChange={(settings) => updateData({ ...data, settings })} />}
      {path === "/money" && (
        <MoneyPage data={data} financialState={financialState} decisionState={decisionState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} onChange={updateData} />
      )}
      {path === "/bills" && <BillsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/income" && <ModulePage section="income" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/transactions" && <TransactionsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {(path === "/debt" || path === "/debts") && <ModulePage section="debt" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/savings" && <SavingsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/inventory" && <InventoryPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/goals" && <GoalsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/reports" && <ReportsPage data={data} financialState={financialState} decisionState={decisionState} />}
      {path === "/missions" && <MissionsPage decisionState={decisionState} />}
      {path === "/settings" && <SettingsPage data={data} onChange={updateData} />}
    </AppShell>
  );
}

function MoneyPage({
  data,
  financialState,
  decisionState,
  updateRows,
  updateSort,
  resetSection,
  onChange,
}: {
  data: AppData;
  financialState: ReturnType<typeof computeFinancialState>;
  decisionState: ReturnType<typeof computeDecisionEngine>;
  updateRows: (section: SectionKey, rows: SpreadsheetRow[]) => void;
  updateSort: (section: SectionKey, sortBy: string) => void;
  resetSection: (section: SectionKey) => void;
  onChange: (data: AppData) => void;
}) {
  const moneyRows = data.sections.money;
  const moneyStats = [
    { label: "Total Cash", value: financialState.totalCash },
    { label: "Spendable Cash", value: financialState.spendableCash },
    { label: "Safe To Spend", value: financialState.safeToSpend },
    { label: "Protected Savings", value: financialState.protectedSavings },
    { label: "Available Savings", value: financialState.availableSavings },
    { label: "Borrowed Money", value: financialState.borrowedMoney, tone: "warn" as const },
  ];

  return (
    <div className="money-page">
      <section className="money-hero-panel">
        <div>
          <p className="eyebrow">Money Snapshot</p>
          <h2>Your complete financial picture</h2>
          <p>{decisionState.todayBriefing}</p>
        </div>
        <div className="money-hero-metrics">
          {moneyStats.map((stat) => (
            <span key={stat.label}>
              <small>{stat.label}</small>
              <strong>{formatCurrency(stat.value)}</strong>
            </span>
          ))}
        </div>
      </section>

      <PaycheckPlanner data={data} onChange={onChange} />

      <section className="money-simple-inputs">
        <Spreadsheet
          config={{ ...sectionConfigs.money, title: "Money Snapshot Inputs" }}
          rows={moneyRows}
          sortBy={data.sortBy.money}
          onSortChange={updateSort}
          onRowsChange={updateRows}
          onResetSection={resetSection}
          getComputedCell={(row, columnKey) => computedCell("money", row, columnKey)}
          addLabel="Add Money Row"
        />
      </section>
    </div>
  );
}

function BillsPage({
  data,
  financialState,
  updateRows,
  updateSort,
  resetSection,
}: {
  data: AppData;
  financialState: ReturnType<typeof computeFinancialState>;
  updateRows: (section: SectionKey, rows: SpreadsheetRow[]) => void;
  updateSort: (section: SectionKey, sortBy: string) => void;
  resetSection: (section: SectionKey) => void;
}) {
  const [billSearch, setBillSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const billRows = data.sections.bills.map(normalizeBillRow);
  const filledBillRows = billRows.filter((row) => !isBlankRow(row.cells));
  const visibleBillRows = billRows.filter((row) => {
    if (isBlankRow(row.cells)) return true;
    const status = billStatus(row);
    const query = billSearch.trim().toLowerCase();
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    const matchesSearch = !query || [row.cells.name, row.cells.category, row.cells.status, row.cells.priority, row.cells.notes]
      .join(" ")
      .toLowerCase()
      .includes(query);
    return matchesStatus && matchesSearch;
  });
  const visibleBillIds = new Set(visibleBillRows.map((row) => row.id));
  const billStats = {
    shown: visibleBillRows.filter((row) => !isBlankRow(row.cells)).length,
    total: filledBillRows.length,
    amount: visibleBillRows.reduce((sum, row) => sum + toNumber(row.cells.amount), 0),
    overdue: filledBillRows.filter((row) => ["overdue", "late"].includes(billStatus(row))).length,
    upcoming: filledBillRows.filter((row) => billStatus(row) === "upcoming").length,
    paid: filledBillRows.filter((row) => billStatus(row) === "paid").length,
    autopay: filledBillRows.filter((row) => isAffirmative(row.cells.autopay)).length,
    critical: filledBillRows.filter((row) => (row.cells.priority || "").toLowerCase() === "critical").length,
  };

  function updateVisibleBillRows(section: SectionKey, nextVisibleRows: SpreadsheetRow[]) {
    const normalizedNextRows = nextVisibleRows.map(normalizeBillRow);
    const nextVisibleIds = new Set(normalizedNextRows.map((row) => row.id));
    const preservedRows = billRows.filter((row) => !visibleBillIds.has(row.id) || nextVisibleIds.has(row.id));
    const mergedRows = preservedRows.map((row) => normalizedNextRows.find((next) => next.id === row.id) || row);
    const addedRows = normalizedNextRows.filter((row) => !billRows.some((existing) => existing.id === row.id));
    updateRows(section, [...mergedRows, ...addedRows]);
  }

  return (
    <div className="bills-page module-page">
      <SummaryGrid items={summaryForSection("bills", financialState)} />
      <section className="bills-command-panel">
        <div>
          <p className="eyebrow">Bills Control</p>
          <h2>Track and manage recurring expenses</h2>
        </div>
        <div className="bills-filter-row">
          <label className="bills-search">
            <span>Search bills</span>
            <input value={billSearch} onChange={(event) => setBillSearch(event.target.value)} placeholder="Search bills, categories, status" />
          </label>
          <div className="bills-status-tabs" role="tablist" aria-label="Bill status filter">
            {[
              ["all", "All"],
              ["upcoming", "Upcoming"],
              ["paid", "Paid"],
              ["overdue", "Overdue"],
              ["late", "Late"],
              ["cancelled", "Cancelled"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={statusFilter === value ? "active" : ""}
                aria-pressed={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="bills-inline-stats">
          <span>{billStats.shown} shown</span>
          <span>{billStats.total} bills</span>
          <strong>{formatCurrency(billStats.amount)} total</strong>
          <strong className={billStats.overdue > 0 ? "bad" : ""}>{billStats.overdue} overdue</strong>
          <em>{billStats.autopay} autopay</em>
        </div>
      </section>

      <section className="bills-insight-grid">
        <article className="panel bill-insight-card">
          <p className="eyebrow">Status Mix</p>
          <div className="bill-status-bars">
            <BillMiniBar label="Upcoming" value={billStats.upcoming} total={Math.max(1, billStats.total)} tone="blue" />
            <BillMiniBar label="Paid" value={billStats.paid} total={Math.max(1, billStats.total)} tone="green" />
            <BillMiniBar label="Overdue/Late" value={billStats.overdue} total={Math.max(1, billStats.total)} tone="red" />
          </div>
        </article>
        <article className="panel bill-insight-card">
          <p className="eyebrow">Priority Alert</p>
          <h2>{billStats.critical ? `${billStats.critical} critical bills` : "No critical bills"}</h2>
          <p className="empty-copy">
            {billStats.overdue > 0 ? `${billStats.overdue} bill${billStats.overdue > 1 ? "s need" : " needs"} attention now.` : "Bill pressure is being tracked from your rows."}
          </p>
        </article>
      </section>

      <Spreadsheet
        config={sectionConfigs.bills}
        rows={visibleBillRows}
        sortBy={data.sortBy.bills}
        onSortChange={updateSort}
        onRowsChange={updateVisibleBillRows}
        onResetSection={resetSection}
        getComputedCell={(row, columnKey) => computedCell("bills", row, columnKey)}
        addLabel="Add Bill"
      />
    </div>
  );
}

function TransactionsPage({
  data,
  financialState,
  updateRows,
  updateSort,
  resetSection,
}: {
  data: AppData;
  financialState: ReturnType<typeof computeFinancialState>;
  updateRows: (section: SectionKey, rows: SpreadsheetRow[]) => void;
  updateSort: (section: SectionKey, sortBy: string) => void;
  resetSection: (section: SectionKey) => void;
}) {
  const [transactionSearch, setTransactionSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const transactionRows = data.sections.transactions.map(normalizeTransactionRow);
  const visibleTransactionRows = transactionRows.filter((row) => {
    if (isBlankRow(row.cells)) return !transactionSearch.trim() && typeFilter === "all" && dateFilter === "all";
    const type = transactionType(row);
    const query = transactionSearch.trim().toLowerCase();
    const matchesType = typeFilter === "all" || type === typeFilter;
    const matchesSearch = !query || [row.cells.description, row.cells.category, row.cells.account, row.cells.notes]
      .join(" ")
      .toLowerCase()
      .includes(query);
    const matchesDate = dateFilter === "all" || transactionDateMatches(row.cells.date, dateFilter);
    return matchesType && matchesSearch && matchesDate;
  });
  const visibleTransactionIds = new Set(visibleTransactionRows.map((row) => row.id));
  const visibleFilledRows = visibleTransactionRows.filter((row) => !isBlankRow(row.cells));
  const incomeTotal = visibleFilledRows
    .filter((row) => transactionType(row) === "income")
    .reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const expenseTotal = visibleFilledRows
    .filter((row) => transactionType(row) === "expense")
    .reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const transferTotal = visibleFilledRows
    .filter((row) => transactionType(row) === "transfer")
    .reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const recurringCount = visibleFilledRows.filter((row) => isAffirmative(row.cells.recurring)).length;

  function updateVisibleTransactionRows(section: SectionKey, nextVisibleRows: SpreadsheetRow[]) {
    const normalizedNextRows = nextVisibleRows.map(normalizeTransactionRow);
    const nextVisibleIds = new Set(normalizedNextRows.map((row) => row.id));
    const preservedRows = transactionRows.filter((row) => !visibleTransactionIds.has(row.id) || nextVisibleIds.has(row.id));
    const mergedRows = preservedRows.map((row) => normalizedNextRows.find((next) => next.id === row.id) || row);
    const addedRows = normalizedNextRows.filter((row) => !transactionRows.some((existing) => existing.id === row.id));
    updateRows(section, [...mergedRows, ...addedRows]);
  }

  return (
    <div className="transactions-page module-page">
      <SummaryGrid items={summaryForSection("transactions", financialState)} />
      <section className="transactions-command-panel">
        <div>
          <p className="eyebrow">Transactions Control</p>
          <h2>Track every dollar in and out</h2>
        </div>
        <div className="transactions-filter-row">
          <label className="transactions-search">
            <span>Search transactions</span>
            <input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Search descriptions, categories, accounts" />
          </label>
          <div className="transactions-filter-controls">
            <label>
              <span>Type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </label>
            <label>
              <span>Date</span>
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="lastmonth">Last Month</option>
              </select>
            </label>
          </div>
        </div>
        <div className="transactions-inline-stats">
          <span>{visibleFilledRows.length} transactions</span>
          <strong className="income">+{formatCurrency(incomeTotal)}</strong>
          <strong className="expense">-{formatCurrency(expenseTotal)}</strong>
          <em>{formatCurrency(transferTotal)} transfers</em>
          <em>{recurringCount} recurring</em>
        </div>
      </section>

      <section className="transactions-insight-grid">
        <article className="panel transaction-flow-card">
          <p className="eyebrow">Filtered Flow</p>
          <div className="transaction-flow-bars">
            <TransactionMiniBar label="Income" value={incomeTotal} max={Math.max(1, incomeTotal, expenseTotal, transferTotal)} tone="green" />
            <TransactionMiniBar label="Expenses" value={expenseTotal} max={Math.max(1, incomeTotal, expenseTotal, transferTotal)} tone="red" />
            <TransactionMiniBar label="Transfers" value={transferTotal} max={Math.max(1, incomeTotal, expenseTotal, transferTotal)} tone="blue" />
          </div>
        </article>
        <article className="panel transaction-flow-card">
          <p className="eyebrow">Activity Signal</p>
          <h2>{visibleFilledRows.length ? `${visibleFilledRows.length} visible rows` : "No transactions found"}</h2>
          <p className="empty-copy">
            {recurringCount ? `${recurringCount} recurring transaction${recurringCount > 1 ? "s are" : " is"} visible in this view.` : "Use filters to isolate income, expenses, transfers, and recent months."}
          </p>
        </article>
      </section>

      <Spreadsheet
        config={sectionConfigs.transactions}
        rows={visibleTransactionRows}
        sortBy={data.sortBy.transactions}
        onSortChange={updateSort}
        onRowsChange={updateVisibleTransactionRows}
        onResetSection={resetSection}
        getComputedCell={(row, columnKey) => computedCell("transactions", row, columnKey)}
        addLabel="Add Transaction"
      />
    </div>
  );
}

function SavingsPage({
  data,
  financialState,
  updateRows,
  updateSort,
  resetSection,
}: {
  data: AppData;
  financialState: ReturnType<typeof computeFinancialState>;
  updateRows: (section: SectionKey, rows: SpreadsheetRow[]) => void;
  updateSort: (section: SectionKey, sortBy: string) => void;
  resetSection: (section: SectionKey) => void;
}) {
  const [savingsSearch, setSavingsSearch] = useState("");
  const [vaultType, setVaultType] = useState("all");
  const savingsRows = data.sections.savings.map(normalizeSavingsRow);
  const filledSavingsRows = savingsRows.filter((row) => !isBlankRow(row.cells));
  const monthlySavingsRate = data.sections.transactions
    .map(normalizeTransactionRow)
    .filter((row) => transactionType(row) === "transfer" && row.cells.category.toLowerCase().includes("saving") && transactionDateMatches(row.cells.date, "month"))
    .reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const totalSaved = filledSavingsRows.reduce((sum, row) => sum + toNumber(row.cells.balance), 0);
  const totalTarget = filledSavingsRows.reduce((sum, row) => sum + toNumber(row.cells.target), 0);
  const monthlyInterest = filledSavingsRows.reduce((sum, row) => sum + (toNumber(row.cells.balance) * toNumber(row.cells.interestRate)) / 100 / 12, 0);
  const progressPercent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
  const visibleSavingsRows = savingsRows.filter((row) => {
    if (isBlankRow(row.cells)) return !savingsSearch.trim() && vaultType === "all";
    const query = savingsSearch.trim().toLowerCase();
    const type = savingsType(row);
    const matchesType = vaultType === "all" || type === vaultType;
    const matchesSearch = !query || [row.cells.name, row.cells.institution, row.cells.type, row.cells.notes]
      .join(" ")
      .toLowerCase()
      .includes(query);
    return matchesType && matchesSearch;
  });
  const visibleSavingsIds = new Set(visibleSavingsRows.map((row) => row.id));

  function updateVisibleSavingsRows(section: SectionKey, nextVisibleRows: SpreadsheetRow[]) {
    const normalizedNextRows = nextVisibleRows.map(normalizeSavingsRow);
    const nextVisibleIds = new Set(normalizedNextRows.map((row) => row.id));
    const preservedRows = savingsRows.filter((row) => !visibleSavingsIds.has(row.id) || nextVisibleIds.has(row.id));
    const mergedRows = preservedRows.map((row) => normalizedNextRows.find((next) => next.id === row.id) || row);
    const addedRows = normalizedNextRows.filter((row) => !savingsRows.some((existing) => existing.id === row.id));
    updateRows(section, [...mergedRows, ...addedRows]);
  }

  return (
    <div className="savings-page module-page">
      <SummaryGrid items={summaryForSection("savings", financialState)} />
      <section className="savings-command-panel">
        <div>
          <p className="eyebrow">Savings Vaults</p>
          <h2>Your financial vaults</h2>
        </div>
        <div className="savings-filter-row">
          <label className="savings-search">
            <span>Search vaults</span>
            <input value={savingsSearch} onChange={(event) => setSavingsSearch(event.target.value)} placeholder="Search names, institutions, notes" />
          </label>
          <label className="savings-type-select">
            <span>Type</span>
            <select value={vaultType} onChange={(event) => setVaultType(event.target.value)}>
              <option value="all">All Vaults</option>
              <option value="high_yield">High Yield</option>
              <option value="traditional">Traditional</option>
              <option value="money_market">Money Market</option>
              <option value="cd">CD</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <div className="savings-inline-stats">
          <strong>{formatCurrency(totalSaved)} saved</strong>
          <span>{formatCurrency(totalTarget)} target</span>
          <em>{progressPercent}% progress</em>
          <em>+{formatCurrency(monthlyInterest)} monthly interest</em>
          <em>{formatCurrency(monthlySavingsRate)} saved this month</em>
        </div>
      </section>

      <section className="vault-grid">
        {filledSavingsRows.length ? filledSavingsRows.map((row) => (
          <VaultCard key={row.id} row={row} monthlySavingsRate={monthlySavingsRate} vaultCount={Math.max(1, filledSavingsRows.length)} />
        )) : (
          <article className="panel vault-empty-card">
            <p className="eyebrow">No Vaults Yet</p>
            <h2>Create your first savings bucket</h2>
            <p className="empty-copy">Use the spreadsheet below to add emergency funds, car savings, protected savings, or high-yield accounts.</p>
          </article>
        )}
      </section>

      <Spreadsheet
        config={sectionConfigs.savings}
        rows={visibleSavingsRows}
        sortBy={data.sortBy.savings}
        onSortChange={updateSort}
        onRowsChange={updateVisibleSavingsRows}
        onResetSection={resetSection}
        getComputedCell={(row, columnKey) => computedCell("savings", row, columnKey)}
        addLabel="Add Vault"
      />
    </div>
  );
}

function GoalsPage({
  data,
  financialState,
  updateRows,
  updateSort,
  resetSection,
}: {
  data: AppData;
  financialState: ReturnType<typeof computeFinancialState>;
  updateRows: (section: SectionKey, rows: SpreadsheetRow[]) => void;
  updateSort: (section: SectionKey, sortBy: string) => void;
  resetSection: (section: SectionKey) => void;
}) {
  const [goalSearch, setGoalSearch] = useState("");
  const [goalStatus, setGoalStatus] = useState("all");
  const goalRows = data.sections.goals.map(normalizeGoalRow);
  const filledGoalRows = goalRows.filter((row) => !isBlankRow(row.cells));
  const activeGoals = filledGoalRows.filter((row) => goalStatusValue(row) === "active");
  const completedGoals = filledGoalRows.filter((row) => goalStatusValue(row) === "completed");
  const totalTarget = activeGoals.reduce((sum, row) => sum + toNumber(row.cells.target), 0);
  const totalCurrent = activeGoals.reduce((sum, row) => sum + toNumber(row.cells.current), 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;
  const visibleGoalRows = goalRows.filter((row) => {
    if (isBlankRow(row.cells)) return !goalSearch.trim() && goalStatus === "all";
    const query = goalSearch.trim().toLowerCase();
    const status = goalStatusValue(row);
    const matchesStatus = goalStatus === "all" || status === goalStatus;
    const matchesSearch = !query || [row.cells.name, row.cells.category, row.cells.priority, row.cells.status]
      .join(" ")
      .toLowerCase()
      .includes(query);
    return matchesStatus && matchesSearch;
  });
  const visibleGoalIds = new Set(visibleGoalRows.map((row) => row.id));

  function updateVisibleGoalRows(section: SectionKey, nextVisibleRows: SpreadsheetRow[]) {
    const normalizedNextRows = nextVisibleRows.map(normalizeGoalRow);
    const nextVisibleIds = new Set(normalizedNextRows.map((row) => row.id));
    const preservedRows = goalRows.filter((row) => !visibleGoalIds.has(row.id) || nextVisibleIds.has(row.id));
    const mergedRows = preservedRows.map((row) => normalizedNextRows.find((next) => next.id === row.id) || row);
    const addedRows = normalizedNextRows.filter((row) => !goalRows.some((existing) => existing.id === row.id));
    updateRows(section, [...mergedRows, ...addedRows]);
  }

  return (
    <div className="goals-page module-page">
      <SummaryGrid items={summaryForSection("goals", financialState)} />
      <section className="goals-command-panel">
        <div>
          <p className="eyebrow">Goals Board</p>
          <h2>Track progress toward your dreams</h2>
        </div>
        <div className="goals-filter-row">
          <label className="goals-search">
            <span>Search goals</span>
            <input value={goalSearch} onChange={(event) => setGoalSearch(event.target.value)} placeholder="Search goals, categories, priorities" />
          </label>
          <label className="goals-status-select">
            <span>Status</span>
            <select value={goalStatus} onChange={(event) => setGoalStatus(event.target.value)}>
              <option value="all">All Goals</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </label>
        </div>
        <div className="goals-inline-stats">
          <strong>{activeGoals.length} active</strong>
          <span>{overallProgress}% overall progress</span>
          <em>{completedGoals.length} completed</em>
          <em>{formatCurrency(totalCurrent)} saved</em>
          <em>{formatCurrency(totalTarget)} target</em>
        </div>
      </section>

      <section className="goal-card-grid">
        {filledGoalRows.length ? filledGoalRows.map((row) => <GoalCard key={row.id} row={row} />) : (
          <article className="panel goal-empty-card">
            <p className="eyebrow">No Goals Yet</p>
            <h2>Set your first financial goal</h2>
            <p className="empty-copy">Use the spreadsheet below to add goals like emergency fund, car, home, education, or retirement.</p>
          </article>
        )}
      </section>

      <Spreadsheet
        config={sectionConfigs.goals}
        rows={visibleGoalRows}
        sortBy={data.sortBy.goals}
        onSortChange={updateSort}
        onRowsChange={updateVisibleGoalRows}
        onResetSection={resetSection}
        getComputedCell={(row, columnKey) => computedCell("goals", row, columnKey)}
        addLabel="Add Goal"
      />
    </div>
  );
}

function GoalCard({ row }: { row: SpreadsheetRow }) {
  const current = toNumber(row.cells.current);
  const target = toNumber(row.cells.target);
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const status = goalStatusValue(row);
  const complete = status === "completed";
  const priority = goalPriority(row);

  return (
    <article className={`goal-card ${priority} ${complete ? "complete" : ""}`}>
      <div className="goal-card-heading">
        <span>{goalIcon(row)}</span>
        <div>
          <h2>{row.cells.name || "Unnamed goal"}</h2>
          <p>
            <em>{priority}</em>
            {row.cells.deadline && <small>Due {row.cells.deadline}</small>}
          </p>
        </div>
      </div>
      <div className="goal-amount-row">
        <strong>{formatCurrency(current)}</strong>
        <span>of {formatCurrency(target)}</span>
      </div>
      <div className="goal-progress"><i style={{ width: `${pct}%` }} /></div>
      <div className="goal-footer">
        <span>{pct}%</span>
        <span>{complete ? "Completed" : status}</span>
      </div>
    </article>
  );
}

function VaultCard({ row, monthlySavingsRate, vaultCount }: { row: SpreadsheetRow; monthlySavingsRate: number; vaultCount: number }) {
  const balance = toNumber(row.cells.balance);
  const target = toNumber(row.cells.target);
  const interestRate = toNumber(row.cells.interestRate);
  const pct = target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 0;
  const projection = savingsProjection(row, monthlySavingsRate / Math.max(1, vaultCount));
  const type = savingsType(row);

  return (
    <article className={`vault-card ${type}`}>
      <div className="vault-heading">
        <span>{vaultIcon(type)}</span>
        <div>
          <h2>{row.cells.name || "Unnamed vault"}</h2>
          <p>{vaultLabel(type)}{row.cells.institution ? ` · ${row.cells.institution}` : ""}</p>
        </div>
      </div>
      <div className="vault-balance-row">
        <div>
          <strong>{formatCurrency(balance)}</strong>
          {target > 0 && <small>of {formatCurrency(target)}</small>}
        </div>
        {interestRate > 0 && <em>{interestRate}% APY</em>}
      </div>
      {target > 0 && (
        <>
          <div className="vault-progress"><i style={{ width: `${pct}%` }} /></div>
          <div className="vault-footer">
            <span>{pct}% complete</span>
            <span>{projection}</span>
          </div>
        </>
      )}
    </article>
  );
}

function TransactionMiniBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: "green" | "red" | "blue" }) {
  return (
    <div className={`transaction-mini-bar ${tone}`}>
      <span>{label}</span>
      <i><b style={{ width: `${Math.max(5, Math.min(100, (value / max) * 100))}%` }} /></i>
      <strong>{formatCurrency(value)}</strong>
    </div>
  );
}

function BillMiniBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: "blue" | "green" | "red" }) {
  return (
    <div className={`bill-mini-bar ${tone}`}>
      <span>{label}</span>
      <i><b style={{ width: `${Math.max(5, Math.min(100, (value / total) * 100))}%` }} /></i>
      <strong>{value}</strong>
    </div>
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
  const [inventoryTab, setInventoryTab] = useState("all");
  const [inventorySearch, setInventorySearch] = useState("");
  const inventoryRows = props.data.sections.inventory.map(normalizeInventoryRow);
  const filledInventoryRows = inventoryRows.filter((row) => !isBlankRow(row.cells));
  const searchedInventoryRows = filledInventoryRows.filter((row) => {
    const query = inventorySearch.trim().toLowerCase();
    if (!query) return true;
    return [row.cells.item, row.cells.category, row.cells.alert, row.cells.notes]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
  const visibleInventoryRows = searchedInventoryRows.filter((row) => {
    if (inventoryTab === "all") return true;
    if (inventoryTab === "buy-next") return row.cells.alert === "Critical" || row.cells.alert === "Low";
    return row.cells.alert.toLowerCase() === inventoryTab;
  });
  const visibleInventoryIds = new Set(visibleInventoryRows.map((row) => row.id));
  const inventoryStats = {
    visible: visibleInventoryRows.length,
    total: filledInventoryRows.length,
    critical: filledInventoryRows.filter((row) => row.cells.alert === "Critical").length,
    low: filledInventoryRows.filter((row) => row.cells.alert === "Low").length,
    stocked: filledInventoryRows.filter((row) => row.cells.alert === "Stocked").length,
    refill: visibleInventoryRows.reduce((sum, row) => {
      const qty = toNumber(row.cells.qty);
      const min = toNumber(row.cells.minNeeded);
      const needed = Math.max(0, min - qty);
      return sum + needed * toNumber(row.cells.cost);
    }, 0),
  };

  function updateVisibleInventoryRows(section: SectionKey, nextVisibleRows: SpreadsheetRow[]) {
    const nextVisibleIds = new Set(nextVisibleRows.map((row) => row.id));
    const preservedRows = inventoryRows.filter((row) => !visibleInventoryIds.has(row.id) || nextVisibleIds.has(row.id));
    const mergedRows = preservedRows.map((row) => nextVisibleRows.find((next) => next.id === row.id) || row);
    const addedRows = nextVisibleRows.filter((row) => !inventoryRows.some((existing) => existing.id === row.id));
    props.updateRows(section, [...mergedRows, ...addedRows].map(normalizeInventoryRow));
  }

  return (
    <div className="inventory-page module-page">
      <SummaryGrid items={summaryForSection("inventory", props.financialState)} />
      <section className="inventory-command-panel">
        <div className="inventory-tabs" role="tablist" aria-label="Inventory status filter">
          {[
            ["all", "All"],
            ["buy-next", "Buy Next"],
            ["critical", "Critical"],
            ["low", "Low"],
            ["stocked", "Stocked"],
            ["clear", "Clear"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={inventoryTab === value ? "active" : ""}
              aria-pressed={inventoryTab === value}
              onClick={() => setInventoryTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="inventory-search">
          <span>Search inventory</span>
          <input value={inventorySearch} onChange={(event) => setInventorySearch(event.target.value)} placeholder="Search items, categories, alerts" />
        </label>
        <div className="inventory-inline-stats">
          <span>{inventoryStats.visible} shown</span>
          <span>{inventoryStats.total} items</span>
          <strong>{inventoryStats.critical} critical</strong>
          <strong>{inventoryStats.low} low</strong>
          <strong>{inventoryStats.stocked} stocked</strong>
          <em>{formatCurrency(inventoryStats.refill)} refill</em>
        </div>
      </section>
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
        rows={visibleInventoryRows}
        sortBy={props.data.sortBy.inventory}
        onSortChange={props.updateSort}
        onRowsChange={updateVisibleInventoryRows}
        onResetSection={props.resetSection}
        getComputedCell={(row, columnKey) => computedCell("inventory", row, columnKey)}
        preventDuplicateKey="item"
        addLabel="Add Item"
      />
    </div>
  );
}

function ReportsPage({
  data,
  financialState,
  decisionState,
}: {
  data: AppData;
  financialState: ReturnType<typeof computeFinancialState>;
  decisionState: ReturnType<typeof computeDecisionEngine>;
}) {
  const [period, setPeriod] = useState("monthly");
  const transactions = data.sections.transactions.map(normalizeTransactionRow).filter((row) => !isBlankRow(row.cells));
  const filteredTransactions = transactions.filter((row) => period === "all" || transactionDateMatchesReport(row.cells.date, period));
  const incomeRows = filteredTransactions.filter((row) => transactionType(row) === "income");
  const expenseRows = filteredTransactions.filter((row) => transactionType(row) === "expense");
  const totalIncome = incomeRows.reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const totalExpenses = expenseRows.reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const cashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((cashFlow / totalIncome) * 100) : 0;
  const categoryData = buildCategoryReport(expenseRows);
  const trendData = buildTrendReport(filteredTransactions, period);
  const trendMax = Math.max(1, ...trendData.flatMap((item) => [item.income, item.expenses]));
  const forecast = buildForecast(cashFlow, period);
  const forecastMax = Math.max(1, ...forecast.map((item) => Math.abs(item.balance)));
  const reportSummary = [
    { label: "Income", value: totalIncome },
    { label: "Expenses", value: totalExpenses, tone: "bad" as const },
    { label: "Cash Flow", value: cashFlow, tone: cashFlow >= 0 ? undefined : "bad" as const },
    { label: "Savings Rate", value: `${savingsRate}%` },
  ];

  return (
    <div className="reports-page">
      <section className="reports-command-panel">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Visual analytics for your finances</h2>
        </div>
        <div className="reports-period-tabs" role="tablist" aria-label="Report period">
          {[
            ["weekly", "Weekly"],
            ["monthly", "Monthly"],
            ["yearly", "Yearly"],
            ["all", "All Time"],
          ].map(([value, label]) => (
            <button key={value} type="button" className={period === value ? "active" : ""} aria-pressed={period === value} onClick={() => setPeriod(value)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <SummaryGrid items={reportSummary} />

      {transactions.length === 0 ? (
        <section className="panel report-empty-state">
          <p className="eyebrow">No Data Yet</p>
          <h2>Add transactions to unlock reports</h2>
          <p className="empty-copy">Reports stay empty until your transaction spreadsheet has real rows.</p>
          <a href="/transactions" className="report-link">Open Transactions</a>
        </section>
      ) : (
        <section className="reports-grid report-analytics-grid">
          <article className="panel report-card report-card-wide">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Cash Flow Trend</p>
                <h2>Income and expenses</h2>
              </div>
              <a href="/transactions" className="report-link">Transactions</a>
            </div>
            <div className="report-flow-chart" aria-label="Cash flow trend">
              {trendData.length ? trendData.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <div>
                    <i style={{ height: `${Math.max(7, (item.income / trendMax) * 100)}%` }} />
                    <b style={{ height: `${Math.max(7, (item.expenses / trendMax) * 100)}%` }} />
                  </div>
                  <small>{formatCurrency(item.income)} in</small>
                  <small>{formatCurrency(item.expenses)} out</small>
                </div>
              )) : <p className="empty-copy">No transactions in this period.</p>}
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
            <div className="report-category-chart">
              {categoryData.length ? categoryData.slice(0, 8).map((category, index) => (
                <div key={category.label}>
                  <span><i style={{ background: REPORT_COLORS[index % REPORT_COLORS.length] }} />{category.label}</span>
                  <strong>{formatCurrency(category.amount)}</strong>
                  <b style={{ width: `${Math.max(5, (category.amount / Math.max(1, categoryData[0].amount)) * 100)}%`, background: REPORT_COLORS[index % REPORT_COLORS.length] }} />
                </div>
              )) : <p className="empty-copy">No expense data in this period.</p>}
            </div>
          </article>

          <article className="panel report-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">12-Month Forecast</p>
                <h2>Projected change</h2>
              </div>
              <span className="report-pill">{formatCurrency(projectedMonthlyCashFlow(cashFlow, period))}/mo</span>
            </div>
            <div className="report-forecast-bars" aria-label="Forecast">
              {forecast.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <i className={item.balance >= 0 ? "positive" : "negative"} style={{ height: `${Math.max(7, (Math.abs(item.balance) / forecastMax) * 100)}%` }} />
                  <strong>{formatCurrency(item.balance)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel report-card report-card-wide">
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
            <div className="report-metric-grid">
              <ReportMetric label="Safe To Spend" value={financialState.safeToSpend} href="/money" />
              <ReportMetric label="Bills Pressure" value={financialState.billsPressure} href="/bills" />
              <ReportMetric label="Protected Savings" value={financialState.protectedSavings} href="/savings" />
              <ReportMetric label="Total Debt" value={financialState.totalDebt} href="/debt" />
            </div>
          </article>
        </section>
      )}
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

const REPORT_COLORS = ["#56a5ff", "#25d39b", "#ffc22a", "#ff6666", "#b16cff", "#23c6d8", "#ec6aa5", "#8e9299"];

function transactionDateMatchesReport(dateText: string, period: string): boolean {
  if (!dateText) return false;
  const date = new Date(`${dateText}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  if (period === "weekly") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo && date <= now;
  }
  if (period === "monthly") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (period === "yearly") return date.getFullYear() === now.getFullYear();
  return true;
}

function buildCategoryReport(rows: SpreadsheetRow[]): Array<{ label: string; amount: number }> {
  return Object.entries(
    rows.reduce<Record<string, number>>((acc, row) => {
      const category = row.cells.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + Math.abs(toNumber(row.cells.amount));
      return acc;
    }, {})
  )
    .map(([label, amount]) => ({ label: titleCase(label.replace(/_/g, " ")), amount }))
    .sort((a, b) => b.amount - a.amount);
}

function buildTrendReport(rows: SpreadsheetRow[], period: string): Array<{ label: string; income: number; expenses: number }> {
  const buckets = rows.reduce<Record<string, { label: string; income: number; expenses: number; order: number }>>((acc, row) => {
    if (!row.cells.date) return acc;
    const date = new Date(`${row.cells.date}T12:00:00`);
    if (Number.isNaN(date.getTime())) return acc;
    const label = reportBucketLabel(date, period);
    const order = reportBucketOrder(date, period);
    if (!acc[label]) acc[label] = { label, income: 0, expenses: 0, order };
    if (transactionType(row) === "income") acc[label].income += Math.abs(toNumber(row.cells.amount));
    if (transactionType(row) === "expense") acc[label].expenses += Math.abs(toNumber(row.cells.amount));
    return acc;
  }, {});
  return Object.values(buckets).sort((a, b) => a.order - b.order);
}

function reportBucketLabel(date: Date, period: string): string {
  if (period === "weekly") return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (period === "monthly") return `Week ${Math.ceil(date.getDate() / 7)}`;
  return date.toLocaleDateString("en-US", { month: "short" });
}

function reportBucketOrder(date: Date, period: string): number {
  if (period === "weekly") return date.getTime();
  if (period === "monthly") return Math.ceil(date.getDate() / 7);
  return date.getMonth();
}

function projectedMonthlyCashFlow(cashFlow: number, period: string): number {
  const months = period === "yearly" ? 12 : period === "monthly" ? 1 : period === "weekly" ? 0.25 : 12;
  return months > 0 ? cashFlow / months : 0;
}

function buildForecast(cashFlow: number, period: string): Array<{ label: string; balance: number }> {
  const monthly = projectedMonthlyCashFlow(cashFlow, period);
  return [
    { label: "Now", balance: 0 },
    { label: "+3mo", balance: monthly * 3 },
    { label: "+6mo", balance: monthly * 6 },
    { label: "+12mo", balance: monthly * 12 },
  ];
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SettingsPage({ data, onChange }: { data: AppData; onChange: (data: AppData) => void }) {
  const [featurePrefs, setFeaturePrefs] = useState<Record<string, boolean>>(() => loadFeaturePrefs());

  function updateFeature(key: string, value: boolean) {
    const next = { ...featurePrefs, [key]: value };
    setFeaturePrefs(next);
    localStorage.setItem("vcc-os-smart-features", JSON.stringify(next));
  }

  function exportData() {
    const payload = {
      app: "VCC-OS",
      version: data.version,
      exportDate: new Date().toISOString(),
      data,
      smartFeatures: featurePrefs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vcc-os-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const imported = parsed.data || parsed;
        if (!imported.sections || !imported.settings) throw new Error("Invalid VCC export");
        onChange({
          ...data,
          ...imported,
          settings: { ...data.settings, ...imported.settings },
        });
        if (parsed.smartFeatures) {
          setFeaturePrefs(parsed.smartFeatures);
          localStorage.setItem("vcc-os-smart-features", JSON.stringify(parsed.smartFeatures));
        }
      } catch {
        window.alert("That file does not look like a valid VCC-OS export.");
      }
    };
    reader.readAsText(file);
  }

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

      <section className="panel settings-card">
        <SettingsCardHeader tone="blue" title="Profile" subtitle="Your local account information" />
        <div className="settings-grid">
          <SettingInput label="Greeting name" value={data.settings.accountName} onChange={(accountName) => onChange({ ...data, settings: { ...data.settings, accountName } })} />
          <SettingInput label="Profile label" value={data.settings.profileLabel} onChange={(profileLabel) => onChange({ ...data, settings: { ...data.settings, profileLabel } })} />
          <SettingToggle label="VCC Local Mode" checked={data.settings.localMode} onChange={(localMode) => onChange({ ...data, settings: { ...data.settings, localMode } })} />
          <SettingToggle label="Notifications" checked={data.settings.notificationsEnabled} onChange={(notificationsEnabled) => onChange({ ...data, settings: { ...data.settings, notificationsEnabled } })} />
        </div>
      </section>

      <section className="panel settings-card">
        <SettingsCardHeader tone="purple" title="Appearance" subtitle="Customize the look and feel" />
        <div className="settings-grid">
          <SettingSelect label="Theme mode" value={data.settings.theme} options={["dark", "midnight", "slate", "light"]} onChange={(theme) => onChange({ ...data, settings: { ...data.settings, theme: theme as AppData["settings"]["theme"] } })} />
          <SettingSelect label="Accent color" value={data.settings.accent} options={["blue", "green", "gold", "purple", "red"]} onChange={(accent) => onChange({ ...data, settings: { ...data.settings, accent: accent as AppData["settings"]["accent"] } })} />
          <SettingSelect label="Layout density" value={data.settings.density} options={["comfortable", "compact", "ultra"]} onChange={(density) => onChange({ ...data, settings: { ...data.settings, density: density as AppData["settings"]["density"] } })} />
          <SettingSelect label="Surface style" value={data.settings.surfaceStyle} options={["glass", "neumorphic", "minimal"]} onChange={(surfaceStyle) => onChange({ ...data, settings: { ...data.settings, surfaceStyle: surfaceStyle as AppData["settings"]["surfaceStyle"] } })} />
          <SettingToggle label="Confirm before reset" checked={data.settings.confirmBeforeReset} onChange={(confirmBeforeReset) => onChange({ ...data, settings: { ...data.settings, confirmBeforeReset } })} />
        </div>
      </section>

      <section className="panel settings-card">
        <SettingsCardHeader tone="green" title="Smart Features" subtitle="Financial intelligence controls" />
        <div className="settings-row-list">
          {smartFeatures.map((feature) => (
            <SettingFeatureRow
              key={feature.key}
              title={feature.label}
              description={feature.description}
              checked={featurePrefs[feature.key] !== false}
              onChange={(checked) => updateFeature(feature.key, checked)}
            />
          ))}
        </div>
      </section>

      <section className="panel settings-card">
        <SettingsCardHeader tone="gold" title="Notifications" subtitle="Stay informed about bills, alerts, and weekly status" />
        <div className="settings-row-list">
          <SettingFeatureRow title="Bill Reminders" description="Alert before bills are due" checked={featurePrefs.billReminders !== false} onChange={(checked) => updateFeature("billReminders", checked)} />
          <SettingFeatureRow title="Overdue Alerts" description="Warn when bills become overdue" checked={featurePrefs.overdueAlerts !== false} onChange={(checked) => updateFeature("overdueAlerts", checked)} />
          <SettingFeatureRow title="Weekly Summary" description="Show weekly financial digest signals" checked={featurePrefs.weeklySummary !== false} onChange={(checked) => updateFeature("weeklySummary", checked)} />
        </div>
      </section>

      <section className="panel settings-card">
        <SettingsCardHeader tone="purple" title="Dashboard Widgets" subtitle="Choose what appears" />
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

      <section className="panel settings-card">
        <SettingsCardHeader tone="green" title="Data Management" subtitle="Export, import, or reset your local VCC data" />
        <div className="settings-status-grid">
          <span>Money rows: {data.sections.money.length}</span>
          <span>Bills rows: {data.sections.bills.length}</span>
          <span>Transactions rows: {data.sections.transactions.length}</span>
          <span>Inventory rows: {data.sections.inventory.length}</span>
        </div>
        <div className="settings-actions">
          <button type="button" onClick={exportData}>Export Data</button>
          <label>
            <span>Import Data</span>
            <input type="file" accept="application/json,.json" onChange={(event) => importData(event.target.files?.[0])} />
          </label>
        </div>
        <div className="settings-reset-grid">
          {sectionResetOptions.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => {
                if (!data.settings.confirmBeforeReset || window.confirm(`Reset ${section.label} to zero rows?`)) {
                  onChange(resetSection(data, section.key));
                }
              }}
            >
              Reset {section.label}
            </button>
          ))}
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

      <section className="panel settings-card">
        <SettingsCardHeader tone="red" title="Sign Out" subtitle="Local mode does not require an online sign-out" />
        <p className="settings-copy">VCC-OS is running as a local-first workspace in this build.</p>
      </section>

      <section className="panel settings-card">
        <SettingsCardHeader tone="blue" title="About VCC-OS" subtitle="Vitality Command Center Operating System" />
        <p className="settings-copy">A personal finance command center for intelligence, automation, and clearer decisions.</p>
      </section>
    </div>
  );
}

const smartFeatures = [
  { key: "decisionEngine", label: "Decision Engine", description: "Generate spending recommendations" },
  { key: "forecasts", label: "Financial Forecasts", description: "Project future balances" },
  { key: "cashflowPrediction", label: "Cash Flow Prediction", description: "Compare income and expenses" },
  { key: "safeSpending", label: "Safe Spending Calculation", description: "Calculate safe-to-spend signals" },
  { key: "savingsRecommendations", label: "Savings Recommendations", description: "Surface saving opportunities" },
  { key: "healthScore", label: "Budget Health Score", description: "Show overall financial wellness signals" },
];

const sectionResetOptions: Array<{ key: SectionKey; label: string }> = [
  { key: "money", label: "Money" },
  { key: "bills", label: "Bills" },
  { key: "transactions", label: "Transactions" },
  { key: "savings", label: "Savings" },
  { key: "goals", label: "Goals" },
  { key: "inventory", label: "Inventory" },
  { key: "debt", label: "Debt" },
  { key: "income", label: "Income" },
];

function loadFeaturePrefs(): Record<string, boolean> {
  try {
    const saved = JSON.parse(localStorage.getItem("vcc-os-smart-features") || "{}");
    return { ...Object.fromEntries(smartFeatures.map((feature) => [feature.key, true])), ...saved };
  } catch {
    return Object.fromEntries(smartFeatures.map((feature) => [feature.key, true]));
  }
}

function SettingsCardHeader({ tone, title, subtitle }: { tone: "blue" | "purple" | "green" | "gold" | "red"; title: string; subtitle: string }) {
  return (
    <div className="settings-card-header">
      <span className={tone}>{title.slice(0, 1)}</span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function SettingFeatureRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="settings-feature-row">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
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
  if (section === "money" && columnKey === "section") {
    return moneySectionLabel(moneySection(row));
  }
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

function normalizeBillRow(row: SpreadsheetRow): SpreadsheetRow {
  const dueDate = row.cells.dueDate || row.cells.due_date || "";
  return {
    ...row,
    cells: {
      ...row.cells,
      name: row.cells.name || "",
      category: row.cells.category || "",
      dueDate,
      amount: row.cells.amount || "",
      status: row.cells.status || "",
      autopay: row.cells.autopay || row.cells.is_autopay || "",
      priority: row.cells.priority || "",
      notes: row.cells.notes || "",
    },
  };
}

function normalizeTransactionRow(row: SpreadsheetRow): SpreadsheetRow {
  return {
    ...row,
    cells: {
      ...row.cells,
      description: row.cells.description || "",
      type: row.cells.type || transactionType(row),
      category: row.cells.category || "",
      amount: row.cells.amount || "",
      date: row.cells.date || "",
      account: row.cells.account || "",
      recurring: row.cells.recurring || row.cells.is_recurring || "",
      notes: row.cells.notes || "",
    },
  };
}

function normalizeSavingsRow(row: SpreadsheetRow): SpreadsheetRow {
  return {
    ...row,
    cells: {
      ...row.cells,
      name: row.cells.name || "",
      balance: row.cells.balance || "",
      protected: row.cells.protected || "",
      target: row.cells.target || "",
      interestRate: row.cells.interestRate || row.cells.interest_rate || "",
      institution: row.cells.institution || "",
      type: row.cells.type || savingsType(row),
      notes: row.cells.notes || "",
    },
  };
}

function normalizeGoalRow(row: SpreadsheetRow): SpreadsheetRow {
  const current = row.cells.current || row.cells.current_amount || "";
  const target = row.cells.target || row.cells.target_amount || "";
  return {
    ...row,
    cells: {
      ...row.cells,
      name: row.cells.name || "",
      current,
      target,
      deadline: row.cells.deadline || "",
      category: row.cells.category || goalCategory(row),
      priority: row.cells.priority || "medium",
      status: row.cells.status || goalStatusFromAmounts(current, target),
      autoAlert: row.cells.autoAlert || "",
    },
  };
}

function transactionType(row: SpreadsheetRow): "income" | "expense" | "transfer" {
  const value = `${row.cells.type || ""} ${row.cells.category || ""}`.toLowerCase();
  if (value.includes("transfer")) return "transfer";
  if (value.includes("income") || toNumber(row.cells.amount) > 0) return "income";
  return "expense";
}

function transactionDateMatches(dateText: string, filter: string): boolean {
  if (!dateText) return false;
  const date = new Date(`${dateText}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  if (filter === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (filter === "lastmonth") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
  }
  return true;
}

function goalStatusFromAmounts(current: string, target: string): string {
  return toNumber(target) > 0 && toNumber(current) >= toNumber(target) ? "completed" : "active";
}

function goalStatusValue(row: SpreadsheetRow): string {
  const status = (row.cells.status || "").trim().toLowerCase();
  return status || goalStatusFromAmounts(row.cells.current, row.cells.target);
}

function goalPriority(row: SpreadsheetRow): "low" | "medium" | "high" | "critical" {
  const value = (row.cells.priority || "").trim().toLowerCase();
  if (value === "low" || value === "high" || value === "critical") return value;
  return "medium";
}

function goalCategory(row: SpreadsheetRow): string {
  const value = `${row.cells.category || ""} ${row.cells.name || ""}`.toLowerCase();
  if (value.includes("emergency")) return "emergency_fund";
  if (value.includes("vacation") || value.includes("trip")) return "vacation";
  if (value.includes("home") || value.includes("house")) return "home";
  if (value.includes("car") || value.includes("vehicle")) return "car";
  if (value.includes("education") || value.includes("school")) return "education";
  if (value.includes("retire")) return "retirement";
  if (value.includes("invest")) return "investment";
  return "other";
}

function goalIcon(row: SpreadsheetRow): string {
  return {
    emergency_fund: "!",
    vacation: "V",
    home: "H",
    car: "C",
    education: "E",
    retirement: "R",
    investment: "%",
    other: "G",
  }[goalCategory(row)] || "G";
}

function savingsType(row: SpreadsheetRow): "high_yield" | "traditional" | "money_market" | "cd" | "other" {
  const value = `${row.cells.type || ""} ${row.cells.name || ""}`.toLowerCase();
  if (value.includes("market")) return "money_market";
  if (value.includes("cd") || value.includes("certificate")) return "cd";
  if (value.includes("traditional")) return "traditional";
  if (value.includes("high") || value.includes("yield") || value.includes("hysa")) return "high_yield";
  return "other";
}

function vaultLabel(type: ReturnType<typeof savingsType>): string {
  return {
    high_yield: "High Yield",
    traditional: "Traditional",
    money_market: "Money Market",
    cd: "CD",
    other: "Savings",
  }[type];
}

function vaultIcon(type: ReturnType<typeof savingsType>): string {
  return {
    high_yield: "$",
    traditional: "B",
    money_market: "%",
    cd: "L",
    other: "S",
  }[type];
}

function savingsProjection(row: SpreadsheetRow, monthlyContribution: number): string {
  const balance = toNumber(row.cells.balance);
  const target = toNumber(row.cells.target);
  if (!target) return "No target";
  const remaining = target - balance;
  if (remaining <= 0) return "Goal reached";
  if (monthlyContribution <= 0) return "Add savings transfers";
  const months = Math.ceil(remaining / monthlyContribution);
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function billStatus(row: SpreadsheetRow): string {
  const status = (row.cells.status || "").trim().toLowerCase();
  return status || "upcoming";
}

function isAffirmative(value: string | undefined): boolean {
  return ["yes", "y", "true", "on", "1", "autopay"].includes(String(value || "").trim().toLowerCase());
}

function moneySection(row: SpreadsheetRow): "cash" | "savings" | "borrowed" | "credit" {
  const value = `${row.cells.section || ""} ${row.cells.label || ""}`.toLowerCase();
  if (value.includes("saving") || value.includes("protected")) return "savings";
  if (value.includes("borrow") || value.includes("spotme") || value.includes("mypay") || value.includes("advance")) return "borrowed";
  if (value.includes("credit")) return "credit";
  return "cash";
}

function moneySectionLabel(section: ReturnType<typeof moneySection>): string {
  return {
    cash: "Cash & Checking",
    savings: "Savings",
    borrowed: "Borrowed Money",
    credit: "Credit Usage",
  }[section];
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}
