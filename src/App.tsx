import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  BellRing,
  Bot,
  BrainCircuit,
  CalendarClock,
  Check,
  ChevronDown,
  Database,
  Download,
  HardDrive,
  Info,
  LayoutDashboard,
  MonitorCog,
  Moon,
  Palette,
  RotateCcw,
  Save,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import AppShell from "./components/layout/AppShell";
import NotFound from "./components/layout/NotFound";
import WelcomeTransition from "./components/layout/WelcomeTransition";
import Dashboard from "./components/dashboard/Dashboard";
import VccAgent from "./components/agent/VccAgent";
import PaycheckPlanner from "./components/modules/PaycheckPlanner";
import CarLoanWorkspace from "./components/modules/CarLoanWorkspace";
import Spreadsheet from "./components/shared/Spreadsheet";
import SummaryGrid from "./components/shared/SummaryGrid";
import CloudSyncControl from "./components/shared/CloudSyncControl";
import BufferedTextInput from "./components/shared/BufferedTextInput";
import { formatCurrency, formatDateMDY, isBlankRow, toNumber } from "./lib/calculations/currency";
import { computeDecisionEngine, rankBillRows } from "./lib/engine/decisionEngine";
import { isCarPaymentBill, isCarPaymentTransaction, syncBillPaymentTransactions } from "./lib/engine/billPaymentSync";
import { computeFinancialState } from "./lib/engine/financialEngine";
import { categorizeItem, getInventoryAlert, normalizeInventoryRow } from "./lib/engine/inventoryEngine";
import { identifyTransactionCategory, signedTransactionAmount, transactionMatchesPeriod, transactionType, type TransactionPeriod } from "./lib/engine/transactionEngine";
import { sectionConfigs } from "./lib/storage/defaultData";
import { loadAppData, normalizeAppData, resetAllData, resetSection, saveAppData, saveThemePreference } from "./lib/storage/localStore";
import { applyVisualSettings, getSystemTheme } from "./lib/theme/themePreference";
import type { AppData, SectionKey, SpreadsheetRow, ThemeMode, UserSettings } from "./lib/types/app";
import { useVccCloudSync } from "./lib/cloud/useVccCloudSync";

const worldwideTransactionCategories = [
  "Income",
  "Housing",
  "Utilities",
  "Groceries",
  "Restaurants",
  "Transportation",
  "Fuel",
  "Travel",
  "Healthcare",
  "Insurance",
  "Debt Payments",
  "Savings",
  "Investments",
  "Education",
  "Childcare",
  "Pets",
  "Subscriptions",
  "Entertainment",
  "Shopping",
  "Personal Care",
  "Taxes",
  "Fees",
  "Gifts & Donations",
  "Business",
  "Transfers",
  "Other",
  "Uncategorized",
];

type WallpaperPreviewSettings = Pick<UserSettings, "wallpaper" | "customWallpaper" | "backgroundOpacity" | "cardOpacity">;
const VitaScan = lazy(() => import("./components/modules/VitaScan"));

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const themePreferenceRef = useRef<ThemeMode>(data.settings.theme);
  const [wallpaperPreview, setWallpaperPreview] = useState<WallpaperPreviewSettings | null>(null);
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() => getSystemTheme());
  const path = normalizePath(window.location.pathname);
  const isKnownPath = knownPaths.has(path);
  const financialState = useMemo(() => computeFinancialState(data), [data]);
  const decisionState = useMemo(() => computeDecisionEngine(financialState, data), [financialState, data]);
  const activeTheme = data.settings.theme === "system" ? systemTheme : data.settings.theme;
  const normalizeAndSetData = useCallback((next: AppData) => {
    const normalized = {
      ...next,
      settings: { ...next.settings, theme: themePreferenceRef.current },
      sections: { ...next.sections, inventory: next.sections.inventory.map(normalizeInventoryRow) },
    };
    saveAppData(normalized);
    setData(normalized);
  }, []);
  const cloudSync = useVccCloudSync(data, normalizeAndSetData);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemTheme(media.matches ? "dark" : "light");
    updateSystemTheme();
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    saveAppData(data);
    document.title = path === "/vitascan" ? "VitaScan — VCC Receipt Scanner" : "VCC-OS";
    applyVisualSettings(data.settings);
  }, [activeTheme, data, path]);

  function updateData(next: AppData) {
    if (next.settings.theme !== themePreferenceRef.current) {
      themePreferenceRef.current = next.settings.theme;
      saveThemePreference(next.settings.theme);
    }
    applyVisualSettings({ ...next.settings, theme: themePreferenceRef.current });
    normalizeAndSetData(next);
  }

  function updateRows(section: SectionKey, rows: SpreadsheetRow[]) {
    const nextRows = section === "money" ? autoFillMoneyWeek(rows, data) : rows;
    if (section === "bills") {
      const syncedTransactions = syncBillPaymentTransactions(data.sections.bills, nextRows, data.sections.transactions);
      const { transactions, carPayment } = applyBillPaymentsToCarLoan(
        data.sections.transactions,
        syncedTransactions,
        data.sections.carPayment
      );
      updateData({
        ...data,
        sections: { ...data.sections, bills: nextRows, transactions, carPayment },
      });
      return;
    }
    updateData({ ...data, sections: { ...data.sections, [section]: nextRows } });
  }

  function updateSort(section: SectionKey, sortBy: string) {
    updateData({ ...data, sortBy: { ...data.sortBy, [section]: sortBy } });
  }

  function handleResetSection(section: SectionKey) {
    updateData(resetSection(data, section));
  }

  if (path === "/vitascan") return <Suspense fallback={<main className="vitascan-loading" role="status">Opening VitaScan…</main>}><VitaScan data={data} onChange={updateData} /><CloudSyncControl sync={cloudSync}/></Suspense>;

  return (
    <>
    {path === "/" && <WelcomeTransition settings={data.settings} />}
    <AppShell currentPath={path} settings={data.settings} activeTheme={activeTheme} wallpaperPreview={wallpaperPreview} data={data} onSettingsChange={(settings) => updateData({ ...data, settings })}>
      {path === "/" && <Dashboard financialState={financialState} decisionState={decisionState} data={data} settings={data.settings} onSettingsChange={(settings) => updateData({ ...data, settings })} />}
      {path === "/money" && (
        <MoneyPage data={data} financialState={financialState} decisionState={decisionState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} onChange={updateData} />
      )}
      {path === "/bills" && <BillsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/income" && <ModulePage section="income" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/transactions" && <TransactionsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {(path === "/debt" || path === "/debts") && <ModulePage section="debt" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/car-payment" && <CarLoanWorkspace data={data} financialState={financialState} onChange={updateData} />}
      {path === "/savings" && <SavingsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/inventory" && <InventoryPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/goals" && <GoalsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/reports" && <ReportsPage data={data} financialState={financialState} decisionState={decisionState} />}
      {path === "/missions" && <MissionsPage decisionState={decisionState} />}
      {path === "/settings" && <SettingsPage data={data} onChange={updateData} onWallpaperPreviewChange={setWallpaperPreview} />}
      {!isKnownPath && <NotFound />}
      {isKnownPath && <VccAgent data={data} financialState={financialState} decisionState={decisionState} petEnabled={data.settings.vccPetEnabled} />}
    </AppShell>
    <CloudSyncControl sync={cloudSync}/>
    </>
  );
}

function applyBillPaymentsToCarLoan(
  previousTransactions: SpreadsheetRow[],
  nextTransactions: SpreadsheetRow[],
  carPaymentRows: SpreadsheetRow[]
): { transactions: SpreadsheetRow[]; carPayment: SpreadsheetRow[] } {
  const previousIds = new Set(previousTransactions.map((row) => row.id));
  const nextIds = new Set(nextTransactions.map((row) => row.id));
  const loan = carPaymentRows.find((row) => !isBlankRow(row.cells));
  if (!loan) return { transactions: nextTransactions, carPayment: carPaymentRows };

  let remaining = toNumber(loan.cells.remainingBalance);
  const transactions = nextTransactions.map((transaction) => {
    if (!isCarPaymentTransaction(transaction) || previousIds.has(transaction.id)) return transaction;
    const amount = Math.abs(toNumber(transaction.cells.amount));
    const interest = Math.max(0, toNumber(loan.cells.apr));
    const interestAmount = amount * (interest / 100);
    const principalAmount = Math.max(0, amount - interestAmount);
    remaining = Math.max(0, remaining - principalAmount);
    return {
      ...transaction,
      cells: {
        ...transaction.cells,
        interestPercent: String(interest),
        interestAmount: String(interestAmount),
        principalAmount: String(principalAmount),
        remainingBalance: String(remaining),
        vehicleId: loan.id,
      },
    };
  });

  previousTransactions.forEach((transaction) => {
    if (isCarPaymentTransaction(transaction) && !nextIds.has(transaction.id)) {
      remaining += Math.max(0, toNumber(transaction.cells.principalAmount) || Math.abs(toNumber(transaction.cells.amount)));
    }
  });

  return {
    transactions,
    carPayment: carPaymentRows.map((row) => row.id === loan.id
      ? { ...row, cells: { ...row.cells, remainingBalance: formatCurrency(remaining) } }
      : row),
  };
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
  const spendableSafe = Math.min(financialState.spendableCash, financialState.safeToSpend);
  const moneyStats = [
    { label: "Total Cash", value: financialState.totalCash },
    { label: "Spendable / Safe", value: spendableSafe },
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

      <PaycheckPlanner data={data} onChange={onChange} showHistory={false} />

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

      <MoneyPaymentHistory data={data} />
    </div>
  );
}

function MoneyPaymentHistory({
  data,
}: {
  data: AppData;
}) {
  const carPayments = data.sections.transactions.filter(isCarPaymentTransaction);
  return (
    <section className="money-history-panel" aria-label="Money Snapshot payment history">
      <div className="money-history-heading">
        <div>
          <p className="eyebrow">Payment History</p>
          <h2>Money Snapshot Records</h2>
        </div>
        <span>{data.paycheckHistory.length ? `${data.paycheckHistory.length} locked` : "No records yet"}</span>
      </div>

      <div className="money-history-list">
        {carPayments.map((row) => (
          <article className="money-history-record car-payment-history-record" key={row.id}>
            <div>
              <span>Car Payment</span>
              <strong>{formatCurrency(Math.abs(toNumber(row.cells.amount)))}</strong>
              <small>{row.cells.date ? formatDateMDY(row.cells.date) : "No payment date"}</small>
            </div>
            <dl>
              <div><dt>Payment</dt><dd>{row.cells.description || "Car payment"}</dd></div>
              <div><dt>Category</dt><dd>{row.cells.category || "Debt Payments"}</dd></div>
              <div><dt>Source</dt><dd>Bills</dd></div>
            </dl>
          </article>
        ))}
        {data.paycheckHistory.map((row) => (
          <article className="money-history-record" key={row.id}>
            <div>
              <span>Locked Week</span>
              <strong>{formatCurrency(toNumber(row.remaining))}</strong>
              <small>{row.payDate ? formatDateMDY(row.payDate) : "No pay date"}</small>
            </div>
            <dl>
              <div>
                <dt>Paycheck</dt>
                <dd>{formatCurrency(toNumber(row.income))}</dd>
              </div>
              <div>
                <dt>SpotMe</dt>
                <dd>{formatCurrency(toNumber(row.spotMe))}</dd>
              </div>
              <div>
                <dt>MyPay</dt>
                <dd>{formatCurrency(toNumber(row.myPay))}</dd>
              </div>
              <div>
                <dt>Remaining</dt>
                <dd>{formatCurrency(toNumber(row.remaining))}</dd>
              </div>
              <div>
                <dt>Week</dt>
                <dd>{row.weekStart && row.weekEnd ? `${formatDateMDY(row.weekStart)} to ${formatDateMDY(row.weekEnd)}` : "Not set"}</dd>
              </div>
            </dl>
          </article>
        ))}

        {data.paycheckHistory.length === 0 && carPayments.length === 0 && (
          <p className="empty-copy">Lock a paycheck week to create read-only payment history records.</p>
        )}
      </div>
    </section>
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
  const rankedBills = rankBillRows(filledBillRows);
  const carPaymentBills = filledBillRows.filter(isCarPaymentBill);
  const dueBill = rankedBills[0];
  const billStats = {
    shown: visibleBillRows.filter((row) => !isBlankRow(row.cells)).length,
    total: filledBillRows.length,
    amount: visibleBillRows.reduce((sum, row) => sum + toNumber(row.cells.amount), 0),
    overdue: filledBillRows.filter((row) => ["overdue", "late"].includes(billStatus(row))).length,
    unpaid: filledBillRows.filter((row) => billStatus(row) === "unpaid").length,
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
            <BufferedTextInput aria-label="Search bills" value={billSearch} onValueChange={setBillSearch} placeholder="Search bills, categories, status" />
          </label>
          <div className="bills-status-tabs" role="tablist" aria-label="Bill status filter">
            {[
              ["all", "All"],
              ["unpaid", "Unpaid"],
              ["paid", "Paid"],
              ["overdue", "Overdue"],
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

      <section className="bills-due-display panel" aria-label="Decision Engine bill order">
        <div className="bills-due-primary">
          <span className="bills-due-icon" aria-hidden="true">
            <CalendarClock size={20} />
          </span>
          <div>
            <p className="eyebrow">Decision Engine Order</p>
            <h2>{dueBill ? dueBill.name : "No bill due next"}</h2>
            <p className="empty-copy">
              {dueBill ? dueBill.reason : "Paid and cancelled bills are out of the queue."}
            </p>
          </div>
        </div>
        {dueBill ? (
          <>
            <div className="bills-due-metrics">
              <span>
                <small>Due</small>
                <strong>{dueBill.dueLabel}</strong>
              </span>
              <span>
                <small>Amount</small>
                <strong>{formatCurrency(dueBill.amount)}</strong>
              </span>
              <span>
                <small>Score</small>
                <strong>{dueBill.score}/100</strong>
              </span>
            </div>
            <ol className="bills-due-list" aria-label="Next bills in order">
              {rankedBills.slice(0, 3).map((bill, index) => (
                <li key={bill.row.id}>
                  <span>{index + 1}</span>
                  <strong>{bill.name}</strong>
                  <em>{bill.dueLabel}</em>
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </section>

      <section className="bills-insight-grid">
        <article className="panel bill-insight-card">
          <p className="eyebrow">Status Mix</p>
          <div className="bill-status-bars">
            <BillMiniBar label="Unpaid" value={billStats.unpaid} total={Math.max(1, billStats.total)} tone="blue" />
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

      {carPaymentBills.length > 0 && (
        <a className="car-payment-bill-link panel" href="/car-payment">
          <div>
            <p className="eyebrow">Linked Auto Loan</p>
            <h2>{carPaymentBills.length === 1 ? carPaymentBills[0].cells.name : `${carPaymentBills.length} car-payment bills`}</h2>
            <p className="empty-copy">Mark the bill paid to add one payment to Transactions, Money Snapshot, and Car Payment history.</p>
          </div>
          <strong>Open Car Payment →</strong>
        </a>
      )}

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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const transactionRows = data.sections.transactions.map(normalizeTransactionRow);
  const visibleTransactionRows = transactionRows.filter((row) => {
    if (isBlankRow(row.cells)) return !transactionSearch.trim() && categoryFilter === "all" && typeFilter === "all" && dateFilter === "all";
    const type = transactionType(row);
    const category = transactionCategory(row);
    const query = transactionSearch.trim().toLowerCase();
    const matchesCategory = categoryFilter === "all" || category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesType = typeFilter === "all" || type === typeFilter;
    const matchesSearch = !query || [row.cells.description, row.cells.category, row.cells.account, row.cells.notes]
      .join(" ")
      .toLowerCase()
      .includes(query);
    const matchesDate = dateFilter === "all" || transactionDateMatches(row.cells.date, dateFilter);
    return matchesCategory && matchesType && matchesSearch && matchesDate;
  });
  const visibleTransactionIds = new Set(visibleTransactionRows.map((row) => row.id));
  const visibleFilledRows = visibleTransactionRows.filter((row) => !isBlankRow(row.cells));
  const incomeTotal = visibleFilledRows
    .filter((row) => transactionType(row) === "income")
    .reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const expenseTotal = visibleFilledRows
    .filter((row) => transactionType(row) === "expense")
    .reduce((sum, row) => sum + Math.abs(signedTransactionAmount(row)), 0);
  const transferTotal = visibleFilledRows
    .filter((row) => transactionType(row) === "transfer")
    .reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const recurringCount = visibleFilledRows.filter((row) => isAffirmative(row.cells.recurring)).length;
  const expenseRows = transactionRows.filter((row) => !isBlankRow(row.cells) && transactionType(row) === "expense");
  const spendingByPeriod = (period: TransactionPeriod) => expenseRows
    .filter((row) => transactionMatchesPeriod(row.cells.date, period))
    .reduce((sum, row) => sum + Math.abs(signedTransactionAmount(row)), 0);
  const thisWeekSpending = spendingByPeriod("week");
  const lastWeekSpending = spendingByPeriod("lastweek");
  const thisMonthSpending = spendingByPeriod("month");
  const lastMonthSpending = spendingByPeriod("lastmonth");

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
            <BufferedTextInput aria-label="Search transactions" value={transactionSearch} onValueChange={setTransactionSearch} placeholder="Search descriptions, categories, accounts" />
          </label>
          <div className="transactions-filter-controls">
            <label>
              <span>Worldwide Category</span>
              <select aria-label="Transaction category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">All Categories</option>
                {worldwideTransactionCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Type</span>
              <select aria-label="Transaction type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </label>
            <label>
              <span>Date</span>
              <select aria-label="Transaction date range" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="lastweek">Last Week</option>
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
          <em>Week impact {formatCurrency(financialState.transactionWeekNet)}</em>
          <em>{categoryFilter === "all" ? "All categories" : categoryFilter}</em>
          <em>{recurringCount} recurring</em>
        </div>
      </section>

      <section className="spending-period-panel" aria-labelledby="spending-period-title">
        <div className="spending-period-heading">
          <div>
            <p className="eyebrow">Spending by period</p>
            <h2 id="spending-period-title">Know exactly when the money was spent</h2>
          </div>
          <span>Expenses only · calendar periods</span>
        </div>
        <div className="spending-period-groups">
          <SpendingPeriodComparison label="Week to week" currentLabel="This week" previousLabel="Last week" current={thisWeekSpending} previous={lastWeekSpending} onCurrentClick={() => setDateFilter("week")} onPreviousClick={() => setDateFilter("lastweek")} />
          <SpendingPeriodComparison label="Month to month" currentLabel="This month" previousLabel="Last month" current={thisMonthSpending} previous={lastMonthSpending} onCurrentClick={() => setDateFilter("month")} onPreviousClick={() => setDateFilter("lastmonth")} />
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

function SpendingPeriodComparison({ label, currentLabel, previousLabel, current, previous, onCurrentClick, onPreviousClick }: { label: string; currentLabel: string; previousLabel: string; current: number; previous: number; onCurrentClick: () => void; onPreviousClick: () => void }) {
  const change = current - previous;
  const direction = change > 0 ? "more" : change < 0 ? "less" : "the same";

  return (
    <article className="spending-period-group">
      <p>{label}</p>
      <div>
        <button type="button" onClick={onCurrentClick}><span>{currentLabel}</span><strong>{formatCurrency(current)}</strong></button>
        <button type="button" onClick={onPreviousClick}><span>{previousLabel}</span><strong>{formatCurrency(previous)}</strong></button>
      </div>
      <small className={change > 0 ? "spending-up" : change < 0 ? "spending-down" : ""}>
        {change === 0 ? "No change from the prior period" : `${formatCurrency(Math.abs(change))} ${direction} than the prior period`}
      </small>
    </article>
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
            <BufferedTextInput aria-label="Search savings vaults" value={savingsSearch} onValueChange={setSavingsSearch} placeholder="Search names, institutions, notes" />
          </label>
          <label className="savings-type-select">
            <span>Type</span>
            <select aria-label="Savings vault type" value={vaultType} onChange={(event) => setVaultType(event.target.value)}>
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
            <BufferedTextInput aria-label="Search goals" value={goalSearch} onValueChange={setGoalSearch} placeholder="Search goals, categories, priorities" />
          </label>
          <label className="goals-status-select">
            <span>Status</span>
            <select aria-label="Goal status" value={goalStatus} onChange={(event) => setGoalStatus(event.target.value)}>
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

/* Legacy payment workspace retained temporarily for migration reference.
function CarPaymentPage(props: Omit<Parameters<typeof ModulePage>[0], "section" | "header"> & { onChange: (data: AppData) => void }) {
  const paidPercent = Math.round(props.financialState.carPaymentPaidPercent);
  const remaining = props.financialState.carPaymentRemainingTotal;
  const original = props.financialState.carPaymentOriginalTotal;
  const paidTotal = Math.max(0, original - remaining);
  const loanRows = props.data.sections.carPayment.length
    ? props.data.sections.carPayment
    : [{ id: "car-payment-start", cells: Object.fromEntries(sectionConfigs.carPayment.columns.map((column) => [column.key, ""])) }];
  const pageData = { ...props.data, sections: { ...props.data.sections, carPayment: loanRows } };
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => dateInputValue(new Date()));
  const [interestPercent, setInterestPercent] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const paymentHistory = props.data.sections.transactions
    .filter(isCarPaymentTransaction)
    .sort((a, b) => (b.cells.date || "").localeCompare(a.cells.date || ""));

  function recordCarPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loan = loanRows.find((row) => !isBlankRow(row.cells));
    const amount = Math.abs(toNumber(paymentAmount));
    const currentRemaining = toNumber(loan?.cells.remainingBalance);
    const interest = Math.max(0, toNumber(interestPercent));
    if (!loan || !loan.cells.vehicle.trim()) {
      setPaymentMessage("Fill out the vehicle loan row before recording a payment.");
      return;
    }
    if (amount <= 0 || !paymentDate) {
      setPaymentMessage("Enter a payment amount and payment date.");
      return;
    }
    const interestAmount = amount * (interest / 100);
    const principalAmount = Math.max(0, amount - interestAmount);
    const nextRemaining = Math.max(0, currentRemaining - principalAmount);
    const transaction: SpreadsheetRow = {
      id: `car-payment-${Date.now()}`,
      cells: {
        description: `${loan.cells.vehicle} car payment`,
        type: "expense",
        category: "Debt Payments",
        amount: formatCurrency(amount),
        date: paymentDate,
        account: loan.cells.lender || "",
        recurring: "No",
        notes: `Car payment recorded from Car Payment. Interest: ${interest}%. Principal: ${formatCurrency(principalAmount)}. Remaining: ${formatCurrency(nextRemaining)}.`,
        interestPercent: String(interest),
        interestAmount: String(interestAmount),
        principalAmount: String(principalAmount),
        remainingBalance: String(nextRemaining),
        vehicleId: loan.id,
      },
    };
    const nextLoanRows = loanRows.map((row) => row.id === loan.id
      ? { ...row, cells: { ...row.cells, remainingBalance: formatCurrency(nextRemaining) } }
      : row);
    props.onChange({
      ...props.data,
      sections: {
        ...props.data.sections,
        carPayment: nextLoanRows,
        transactions: [...props.data.sections.transactions, transaction],
      },
    });
    setPaymentAmount("");
    setPaymentMessage(`Payment recorded. ${formatCurrency(nextRemaining)} remains.`);
  }

  return (
    <div className="car-payment-page">
      <ModulePage
        {...props}
        data={pageData}
        section="carPayment"
        header={
          <>
        <section className="car-payment-hero">
          <div className="car-payment-total-box">
            <p className="eyebrow">Auto Loan</p>
            <small>Overall loan total</small>
            <h2>{original > 0 ? formatCurrency(original) : "Add your car payment details"}</h2>
            <p>
              {original > 0
                ? `${paidPercent}% paid down from ${formatCurrency(original)}.`
                : "Track the vehicle, lender, balance, monthly payment, due date, APR, and payoff notes."}
            </p>
          </div>
          <div className="car-payment-progress-card car-payment-remaining-box">
            <small>Remaining balance</small>
            <h2>{formatCurrency(remaining)}</h2>
            <span>{paidPercent}% paid</span>
            <i><b style={{ width: `${Math.max(0, Math.min(100, paidPercent))}%` }} /></i>
            <small>{formatCurrency(paidTotal)} paid · {formatCurrency(props.financialState.carPaymentMonthlyTotal)} monthly</small>
          </div>
        </section>
        <section className="car-payment-entry panel">
          <div>
            <p className="eyebrow">Make a Payment</p>
            <h2>Record a car-note payment</h2>
            <p className="empty-copy">Creates the transaction, updates Money Snapshot, reduces the remaining principal, and adds the history record below.</p>
          </div>
          <form onSubmit={recordCarPayment}>
            <label><span>Payment amount</span><input aria-label="Car payment amount" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder={props.financialState.carPaymentMonthlyTotal ? formatCurrency(props.financialState.carPaymentMonthlyTotal) : "$0.00"} /></label>
            <label><span>Date paid</span><input aria-label="Car payment date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} /></label>
            <label><span>Interest in payment (%)</span><input aria-label="Car payment interest percent" inputMode="decimal" value={interestPercent} onChange={(event) => setInterestPercent(event.target.value)} placeholder="0.00" /></label>
            <button type="submit">Record Payment</button>
          </form>
          {paymentMessage && <p className="car-payment-message" role="status">{paymentMessage}</p>}
        </section>
        <section className="car-payment-history panel" aria-label="Car payment history">
          <div className="money-history-heading">
            <div><p className="eyebrow">Payment History</p><h2>Recorded car payments</h2></div>
            <span>{paymentHistory.length ? `${paymentHistory.length} recorded` : "No payments yet"}</span>
          </div>
          <div className="car-payment-history-list">
            {paymentHistory.map((row) => (
              <article key={row.id}>
                <div><strong>{row.cells.description || "Car payment"}</strong><small>Recorded payment</small></div>
                <span>{row.cells.date ? formatDateMDY(row.cells.date) : "No date"}</span>
                <span>{toNumber(row.cells.interestPercent).toFixed(2)}% interest</span>
                <strong>{formatCurrency(Math.abs(toNumber(row.cells.amount)))}</strong>
              </article>
            ))}
            {paymentHistory.length === 0 && <p className="empty-copy">Mark a car note or car payment as paid on the Bills page to create the first record.</p>}
          </div>
        </section>
          </>
        }
      />
    </div>
  );
}

function dateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
*/

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
          <BufferedTextInput aria-label="Search inventory" value={inventorySearch} onValueChange={setInventorySearch} placeholder="Search items, categories, alerts" />
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
  const [cashFlowSlide, setCashFlowSlide] = useState(0);
  const [forecastSlide, setForecastSlide] = useState(0);
  const transactions = data.sections.transactions.map(normalizeTransactionRow).filter((row) => !isBlankRow(row.cells));
  const filteredTransactions = transactions.filter((row) => period === "all" || transactionDateMatchesReport(row.cells.date, period));
  const incomeRows = filteredTransactions.filter((row) => transactionType(row) === "income");
  const expenseRows = filteredTransactions.filter((row) => transactionType(row) === "expense");
  const totalIncome = incomeRows.reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const totalExpenses = expenseRows.reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const cashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((cashFlow / totalIncome) * 100) : 0;
  const categoryData = buildCategoryReport(expenseRows);
  const averageExpense = expenseRows.length > 0 ? totalExpenses / expenseRows.length : 0;
  const burnRate = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
  const topCategoryShare = totalExpenses > 0 && categoryData.length > 0 ? Math.round((categoryData[0].amount / totalExpenses) * 100) : 0;
  const trendData = buildTrendReport(filteredTransactions, period);
  const trendMax = Math.max(1, ...trendData.flatMap((item) => [item.income, item.expenses]));
  const netTrendMax = Math.max(1, ...trendData.map((item) => Math.abs(item.income - item.expenses)));
  const forecast = buildForecast(cashFlow, period);
  const forecastMax = Math.max(1, ...forecast.map((item) => Math.abs(item.balance)));
  const monthlyProjection = projectedMonthlyCashFlow(cashFlow, period);
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

      <section className="report-insight-strip" aria-label="Report metrics">
        <div><span>Transactions</span><strong>{filteredTransactions.length}</strong><small>{incomeRows.length} income · {expenseRows.length} expense</small></div>
        <div><span>Average expense</span><strong>{formatCurrency(averageExpense)}</strong><small>per expense transaction</small></div>
        <div><span>Income used</span><strong className={burnRate > 100 ? "metric-negative" : ""}>{burnRate}%</strong><small>{burnRate > 100 ? "spending exceeds income" : `${Math.max(0, 100 - burnRate)}% retained`}</small></div>
        <div><span>Largest category</span><strong>{categoryData[0]?.label || "—"}</strong><small>{topCategoryShare}% of total expenses</small></div>
      </section>

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
            <ChartSlideControls labels={["Compare", "Trend lines", "Net flow"]} active={cashFlowSlide} onChange={setCashFlowSlide} />
            <figure className="report-chart-figure">
              {cashFlowSlide < 2 && <div className="report-chart-key" aria-hidden="true"><span className="income">Income</span><span className="expense">Expenses</span></div>}
              {cashFlowSlide === 0 && <div className="report-flow-chart" role="img" aria-label={`Income and expense comparison. Income ${formatCurrency(totalIncome)}, expenses ${formatCurrency(totalExpenses)}.`}>
              {trendData.length ? trendData.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <div>
                    <i style={{ height: `${(item.income / trendMax) * 100}%` }} title={`Income ${formatCurrency(item.income)}`} />
                    <b style={{ height: `${(item.expenses / trendMax) * 100}%` }} title={`Expenses ${formatCurrency(item.expenses)}`} />
                  </div>
                  <small>{formatCurrency(item.income)} in</small>
                  <small>{formatCurrency(item.expenses)} out</small>
                </div>
              )) : <p className="empty-copy">No transactions in this period.</p>}
              </div>}
              {cashFlowSlide === 1 && <ReportLineChart data={trendData} max={trendMax} />}
              {cashFlowSlide === 2 && <div className="report-net-chart" role="img" aria-label="Net cash flow by period, above zero is positive and below zero is negative">
                {trendData.map((item) => {
                  const net = item.income - item.expenses;
                  return <div key={item.label}><strong>{formatCurrency(net)}</strong><div><i className={net >= 0 ? "positive" : "negative"} style={{ height: `${(Math.abs(net) / netTrendMax) * 50}%` }} /></div><span>{item.label}</span></div>;
                })}
              </div>}
              <figcaption>{cashFlow >= 0 ? `You kept ${formatCurrency(cashFlow)} after expenses.` : `Expenses exceeded income by ${formatCurrency(Math.abs(cashFlow))}.`}</figcaption>
              <table className="visually-hidden"><caption>Cash flow trend data</caption><thead><tr><th>Period</th><th>Income</th><th>Expenses</th></tr></thead><tbody>{trendData.map((item) => <tr key={item.label}><th>{item.label}</th><td>{formatCurrency(item.income)}</td><td>{formatCurrency(item.expenses)}</td></tr>)}</tbody></table>
            </figure>
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
                  <b style={{ width: `${(category.amount / Math.max(1, categoryData[0].amount)) * 100}%`, background: REPORT_COLORS[index % REPORT_COLORS.length] }} />
                  <small>{totalExpenses > 0 ? Math.round((category.amount / totalExpenses) * 100) : 0}% of spend</small>
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
            <ChartSlideControls labels={["Projection", "Milestones", "Monthly pace"]} active={forecastSlide} onChange={setForecastSlide} />
            {forecastSlide === 0 && <ForecastLineChart data={forecast} max={forecastMax} />}
            {forecastSlide === 1 && <div className="report-forecast-bars" role="img" aria-label={`Quarterly forecast milestones at ${formatCurrency(monthlyProjection)} per month`}>
              {forecast.filter((_, index) => [2, 5, 8, 11].includes(index)).map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <div className="forecast-track"><i className={item.balance >= 0 ? "positive" : "negative"} style={{ height: `${(Math.abs(item.balance) / forecastMax) * 50}%` }} /></div>
                  <strong>{formatCurrency(item.balance)}</strong>
                </div>
              ))}
            </div>}
            {forecastSlide === 2 && <div className="report-waterfall-chart" role="img" aria-label={`Monthly contribution of ${formatCurrency(monthlyProjection)} over 12 months`}>
              {forecast.map((item, index) => <div key={item.label}><strong>{formatCurrency(item.balance)}</strong><div><i className={monthlyProjection >= 0 ? "positive" : "negative"} style={{ height: `${Math.max(8, ((index + 1) / 12) * 100)}%` }} /></div><span>{item.label}</span></div>)}
            </div>}
            <p className="report-chart-caption">At the current pace, 12-month cash flow is projected at <strong>{formatCurrency(monthlyProjection * 12)}</strong>.</p>
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
              <ReportMetric label="Spendable / Safe" value={Math.min(financialState.spendableCash, financialState.safeToSpend)} href="/money" />
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
            <a key={mission.title} href={mission.href} className={`mission-row ${mission.completed ? "complete" : "active"}`}>
              <strong>{mission.title}</strong>
              <span>{mission.detail}</span>
              <small>{mission.completed ? "Checked" : mission.target}</small>
              <i aria-hidden="true"><b style={{ width: `${Math.max(0, Math.min(100, mission.progress))}%` }} /></i>
              <em>{mission.priority}</em>
            </a>
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
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index + 1, 1);
    return { label: date.toLocaleDateString("en-US", { month: "short" }), balance: monthly * (index + 1) };
  });
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SettingsPage({
  data,
  onChange,
  onWallpaperPreviewChange,
}: {
  data: AppData;
  onChange: (data: AppData) => void;
  onWallpaperPreviewChange: (preview: WallpaperPreviewSettings | null) => void;
}) {
  const [featurePrefs, setFeaturePrefs] = useState<Record<string, boolean>>(() => loadFeaturePrefs());
  const [welcomePreviewId, setWelcomePreviewId] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1);
    return settingsNavigation.some(({ href }) => href === `#${hash}`) ? hash : "settings-profile";
  });

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
        onChange(normalizeAppData(imported));
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

  const accountName = data.settings.accountName || "Local Account";
  const initials = accountName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "VC";
  const colorModeLabel = data.settings.theme === "system" ? "System" : titleCase(data.settings.theme);
  const backgroundLabel = wallpaperOptions.find((option) => option.value === data.settings.wallpaper)?.label || "Default";

  function openSettingsSection(id: string) {
    setOpenSection(id);
    window.history.replaceState(null, "", `${window.location.pathname}#${id}`);
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="settings-page premium-settings">
      {welcomePreviewId !== null && <WelcomeTransition key={welcomePreviewId} settings={data.settings} preview />}
      <div className="settings-layout">
        <aside className="settings-navigation">
          <p>Settings</p>
          <nav aria-label="Settings sections">
            {settingsNavigation.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className={openSection === href.slice(1) ? "is-active" : undefined}
                aria-current={openSection === href.slice(1) ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  openSettingsSection(href.slice(1));
                }}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <div className="settings-storage-note">
            <HardDrive size={17} aria-hidden="true" />
            <span><strong>Stored on this device</strong><small>Your financial workspace stays local.</small></span>
          </div>
        </aside>

        <div className="settings-content">
          <SettingsSection id="settings-profile" icon={UserRound} title="Workspace & privacy" description="Manage your identity, profile, and local data preferences." open={openSection === "settings-profile"}>
            <div className="settings-profile-overview">
              <div className="settings-account-identity">
                <span className="settings-avatar" aria-hidden="true">{initials}</span>
                <div>
                  <p className="settings-kicker">Personal workspace</p>
                  <h2>{accountName}</h2>
                  <p>{data.settings.profileLabel || "Local Profile"}</p>
                </div>
              </div>
              <div className="settings-account-state" aria-label="Account status">
                <span><ShieldCheck size={15} /> {data.settings.localMode ? "Local first" : "Cloud ready"}</span>
                <span><Save size={15} /> Changes save automatically</span>
              </div>
            </div>
            <div className="settings-field-grid">
              <SettingInput label="Greeting name" description="Shown across your dashboard and briefings." value={data.settings.accountName} onChange={(accountName) => onChange({ ...data, settings: { ...data.settings, accountName } })} />
              <SettingInput label="Profile label" description="A short name for this local workspace." value={data.settings.profileLabel} onChange={(profileLabel) => onChange({ ...data, settings: { ...data.settings, profileLabel } })} />
            </div>
            <SettingFeatureRow title="Local-first mode" description="Keep this VCC workspace and its data on this device." checked={data.settings.localMode} onChange={(localMode) => onChange({ ...data, settings: { ...data.settings, localMode } })} />
          </SettingsSection>

          <SettingsSection id="settings-appearance" icon={Palette} title="Appearance" description="Choose a focused visual system that feels right for daily use." open={openSection === "settings-appearance"}>
            <div className="settings-welcome-panel">
              <div className="settings-welcome-heading">
                <span aria-hidden="true"><Sparkles size={18} /></span>
                <div><strong>Welcome transition</strong><small>Shape the opening moment before your dashboard appears.</small></div>
              </div>
              <div className="settings-field-grid">
                <SettingInput label="Welcome headline" description="Leave blank to use the current time-of-day greeting." value={data.settings.welcomeHeadline} onChange={(welcomeHeadline) => onChange({ ...data, settings: { ...data.settings, welcomeHeadline } })} />
                <SettingInput label="Supporting message" description="Short status text shown beneath your name." value={data.settings.welcomeMessage} onChange={(welcomeMessage) => onChange({ ...data, settings: { ...data.settings, welcomeMessage } })} />
              </div>
              <SettingControlRow label="Transition style" description="Choose how the welcome content enters the screen.">
                <SettingSegmented label="Welcome transition style" value={data.settings.welcomeTransition} options={[
                  { value: "rise", label: "Rise" },
                  { value: "fade", label: "Fade" },
                  { value: "focus", label: "Focus" },
                  { value: "sweep", label: "Sweep" },
                ]} onChange={(welcomeTransition) => onChange({ ...data, settings: { ...data.settings, welcomeTransition: welcomeTransition as AppData["settings"]["welcomeTransition"] } })} />
              </SettingControlRow>
              <SettingControlRow label="Display time" description="Choose between 1 and 5 seconds.">
                <label className="settings-duration-control">
                  <input type="range" min="1" max="5" step="1" value={data.settings.welcomeDurationSeconds} aria-label="Welcome display time" onChange={(event) => onChange({ ...data, settings: { ...data.settings, welcomeDurationSeconds: Number(event.target.value) } })} />
                  <output>{data.settings.welcomeDurationSeconds}s</output>
                </label>
              </SettingControlRow>
              <button type="button" className="settings-preview-welcome" onClick={() => setWelcomePreviewId(Date.now())}>Preview welcome</button>
            </div>
            <div className="settings-appearance-studio">
              <div className="settings-appearance-intro">
                <div>
                  <p className="settings-kicker">Visual system</p>
                  <h3>Choose your workspace character</h3>
                  <p>Each theme changes surfaces, borders, depth, typography rhythm, and chart treatment across VCC.</p>
                </div>
                <span className="settings-live-badge"><Sparkles size={14} aria-hidden="true" /> Live preview</span>
              </div>
              <AppearanceThemePicker value={data.settings.appearanceTheme} onChange={(appearanceTheme) => onChange({ ...data, settings: { ...data.settings, appearanceTheme } })} />
              <div className="settings-layer-heading">
                <div>
                  <p className="settings-kicker">Independent layers</p>
                  <h3>Mix interface and canvas</h3>
                  <p>Color mode controls contrast and readability. Background controls the canvas beneath it. Choose both; neither selection turns the other off.</p>
                </div>
                <span className="settings-combination-badge">{colorModeLabel} + {backgroundLabel}</span>
              </div>
              <div className="settings-layer-grid">
                <section className="settings-layer-card" aria-labelledby="color-mode-title">
                  <header>
                    <span className="settings-layer-icon"><MonitorCog size={18} aria-hidden="true" /></span>
                    <div>
                      <strong id="color-mode-title">Color mode</strong>
                      <small>Interface contrast</small>
                    </div>
                    <span>{colorModeLabel}</span>
                  </header>
                  <SettingSegmented label="Light and dark mode" value={data.settings.theme} options={[
                    { value: "system", label: "System", icon: MonitorCog },
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                  ]} onChange={(theme) => onChange({ ...data, settings: { ...data.settings, theme: theme as AppData["settings"]["theme"] } })} />
                </section>
                <section className="settings-layer-card" aria-labelledby="background-layer-title">
                  <header>
                    <span className="settings-layer-icon"><Palette size={18} aria-hidden="true" /></span>
                    <div>
                      <strong id="background-layer-title">Background</strong>
                      <small>Workspace canvas</small>
                    </div>
                    <span>{backgroundLabel}</span>
                  </header>
                  <WallpaperPicker
                    value={data.settings.wallpaper}
                    customWallpaper={data.settings.customWallpaper}
                    backgroundOpacity={data.settings.backgroundOpacity}
                    cardOpacity={data.settings.cardOpacity}
                    onChange={(wallpaper, customWallpaper = data.settings.customWallpaper, backgroundOpacity = data.settings.backgroundOpacity, cardOpacity = data.settings.cardOpacity) => onChange({ ...data, settings: { ...data.settings, wallpaper, customWallpaper, backgroundOpacity, cardOpacity } })}
                    onPreviewChange={onWallpaperPreviewChange}
                  />
                </section>
              </div>
            </div>
            <SettingControlRow label="Accent" description="Used for focus, selection, and key actions.">
              <AccentPicker value={data.settings.accent} onChange={(accent) => onChange({ ...data, settings: { ...data.settings, accent: accent as AppData["settings"]["accent"] } })} />
            </SettingControlRow>
            <SettingControlRow label="Layout density" description="Adjust spacing without changing your data.">
              <SettingSegmented label="Layout density" value={data.settings.density} options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
                { value: "ultra", label: "Dense" },
              ]} onChange={(density) => onChange({ ...data, settings: { ...data.settings, density: density as AppData["settings"]["density"] } })} />
            </SettingControlRow>
            <SettingControlRow label="Surface" description="Change panel depth and translucency.">
              <SettingSegmented label="Surface style" value={data.settings.surfaceStyle} options={[
                { value: "glass", label: "Glass" },
                { value: "neumorphic", label: "Depth" },
                { value: "minimal", label: "Minimal" },
              ]} onChange={(surfaceStyle) => onChange({ ...data, settings: { ...data.settings, surfaceStyle: surfaceStyle as AppData["settings"]["surfaceStyle"] } })} />
            </SettingControlRow>
          </SettingsSection>

          <SettingsSection id="settings-intelligence" icon={BrainCircuit} title="Intelligence" description="Decide which financial signals VCC calculates for you." open={openSection === "settings-intelligence"}>
            <div className="settings-row-list">
              {smartFeatures.map((feature) => (
                <SettingFeatureRow key={feature.key} title={feature.label} description={feature.description} checked={featurePrefs[feature.key] !== false} onChange={(checked) => updateFeature(feature.key, checked)} />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection id="settings-notifications" icon={BellRing} title="Notifications" description="Keep important deadlines visible without adding noise." open={openSection === "settings-notifications"}>
            <SettingFeatureRow title="Allow notifications" description="Master control for reminders and account alerts." checked={data.settings.notificationsEnabled} onChange={(notificationsEnabled) => onChange({ ...data, settings: { ...data.settings, notificationsEnabled } })} />
            <div className="settings-row-list settings-dependent-rows" aria-disabled={!data.settings.notificationsEnabled}>
              <SettingFeatureRow title="Bill reminders" description="Alert before bills are due." checked={featurePrefs.billReminders !== false} disabled={!data.settings.notificationsEnabled} onChange={(checked) => updateFeature("billReminders", checked)} />
              <SettingFeatureRow title="Overdue alerts" description="Warn when bills become overdue." checked={featurePrefs.overdueAlerts !== false} disabled={!data.settings.notificationsEnabled} onChange={(checked) => updateFeature("overdueAlerts", checked)} />
              <SettingFeatureRow title="Weekly summary" description="Show a concise weekly financial digest." checked={featurePrefs.weeklySummary !== false} disabled={!data.settings.notificationsEnabled} onChange={(checked) => updateFeature("weeklySummary", checked)} />
            </div>
          </SettingsSection>

          <SettingsSection id="settings-dashboard" icon={LayoutDashboard} title="Dashboard" description="Choose the modules that stay visible in your command center." open={openSection === "settings-dashboard"}>
            <div className="settings-widget-grid">
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
          </SettingsSection>

          <SettingsSection id="settings-features" icon={Bot} title="Features" description="Choose which optional tools appear across VCC-OS." open={openSection === "settings-features"}>
            <div className="settings-row-list">
              <SettingFeatureRow title="VitaScan" description="Show the receipt scanner in desktop and mobile navigation." checked={data.settings.vitaScanEnabled} onChange={(vitaScanEnabled) => onChange({ ...data, settings: { ...data.settings, vitaScanEnabled } })} />
              <SettingFeatureRow title="VCC companion mode" description="Give Ask VCC a small pet-like presence while keeping the chatbot compact." checked={data.settings.vccPetEnabled} onChange={(vccPetEnabled) => onChange({ ...data, settings: { ...data.settings, vccPetEnabled } })} />
            </div>
            {data.settings.vitaScanEnabled && <a className="settings-feature-link" href="/vitascan"><ScanLine size={17} aria-hidden="true" /> Open VitaScan</a>}
          </SettingsSection>

          <SettingsSection id="settings-data" icon={Database} title="Data & storage" description="Move, protect, or reset the information stored in this browser." open={openSection === "settings-data"}>
            <div className="settings-data-stats" aria-label="Stored row counts">
              <span><strong>{data.sections.money.length}</strong><small>Money</small></span>
              <span><strong>{data.sections.bills.length}</strong><small>Bills</small></span>
              <span><strong>{data.sections.transactions.length}</strong><small>Transactions</small></span>
              <span><strong>{data.sections.inventory.length}</strong><small>Inventory</small></span>
            </div>
            <div className="settings-transfer-row">
              <div>
                <strong>Backup & restore</strong>
                <small>Export a portable JSON backup or restore one you trust.</small>
              </div>
              <div className="settings-actions">
                <button type="button" onClick={exportData}><Download size={16} /> Export</button>
                <label className="settings-import-button">
                  <Upload size={16} />
                  <span>Import</span>
                  <input className="settings-file-input" aria-label="Import VCC data" type="file" accept="application/json,.json" onChange={(event) => importData(event.target.files?.[0])} />
                </label>
              </div>
            </div>
            <SettingFeatureRow title="Confirm before reset" description="Require a confirmation before destructive data actions." checked={data.settings.confirmBeforeReset} onChange={(confirmBeforeReset) => onChange({ ...data, settings: { ...data.settings, confirmBeforeReset } })} />
            <details className="settings-advanced">
              <summary><span><RotateCcw size={16} /> Advanced reset controls</span><ChevronDown size={17} aria-hidden="true" /></summary>
              <p>Reset one area without affecting the rest of your workspace.</p>
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
            </details>
            <div className="settings-danger-zone">
              <div>
                <strong>Reset VCC to a blank state</strong>
                <small>Clears every row, planner value, history item, account label, and preference.</small>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!data.settings.confirmBeforeReset || window.confirm("Reset all VCC OS data and settings to a blank state? This cannot be undone.")) {
                    localStorage.removeItem("vcc-os-smart-features");
                    setFeaturePrefs(Object.fromEntries(smartFeatures.map((feature) => [feature.key, true])));
                    onChange(resetAllData());
                  }
                }}
              >
                Reset VCC to blank
              </button>
            </div>
          </SettingsSection>

          <SettingsSection id="settings-about" icon={Info} title="About VCC-OS" description="Vitality Command Center Operating System." open={openSection === "settings-about"}>
            <div className="settings-about-row">
              <div className="settings-product-mark" aria-hidden="true"><MonitorCog size={22} /></div>
              <div>
                <strong>VCC-OS</strong>
                <small>Personal finance intelligence, automation, and clearer decisions.</small>
              </div>
              <span>Local build · v{data.version}</span>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

const settingsNavigation: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "#settings-profile", label: "Workspace & privacy", icon: UserRound },
  { href: "#settings-appearance", label: "Appearance", icon: SlidersHorizontal },
  { href: "#settings-intelligence", label: "Intelligence", icon: BrainCircuit },
  { href: "#settings-notifications", label: "Notifications", icon: BellRing },
  { href: "#settings-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "#settings-features", label: "Features", icon: Bot },
  { href: "#settings-data", label: "Data & storage", icon: Database },
  { href: "#settings-about", label: "About", icon: Info },
];

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
  { key: "carPayment", label: "Car Payment" },
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

function SettingsSection({ id, icon: Icon, title, description, children, open }: { id: string; icon: LucideIcon; title: string; description: string; children: React.ReactNode; open: boolean }) {
  if (!open) return null;

  return (
    <section className="settings-section settings-detail-panel is-open is-mobile-open" id={id} aria-labelledby={`${id}-title`}>
      <header className="settings-section-header">
        <div className="settings-section-trigger">
          <span className="settings-section-icon"><Icon size={19} aria-hidden="true" /></span>
          <span className="settings-section-heading">
            <span id={`${id}-title`}>{title}</span>
            <small>{description}</small>
          </span>
        </div>
      </header>
      <div className="settings-section-body" id={`${id}-content`}>
        {children}
      </div>
    </section>
  );
}

function SettingFeatureRow({ title, description, checked, disabled = false, onChange }: { title: string; description: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`settings-feature-row${disabled ? " is-disabled" : ""}`}>
      <span className="settings-row-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="vcc-switch">
        <input aria-label={title} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
        <span className="vcc-switch-track" aria-hidden="true"><span /></span>
      </span>
    </label>
  );
}

function SettingControlRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="settings-control-row">
      <div className="settings-row-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </div>
      {children}
    </div>
  );
}

function SettingSegmented({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string; icon?: LucideIcon }>; onChange: (value: string) => void }) {
  return (
    <div className="settings-segmented" role="group" aria-label={label}>
      {options.map((option) => {
        const OptionIcon = option.icon;
        return <button key={option.value} type="button" className={value === option.value ? "is-selected" : ""} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {OptionIcon ? <OptionIcon size={15} aria-hidden="true" /> : value === option.value && <Check size={14} aria-hidden="true" />}
          <span>{option.label}</span>
        </button>;
      })}
    </div>
  );
}

const appearanceThemes = [
  { value: "signature", name: "Signature", description: "Refined navy surfaces with luminous focus and balanced depth.", colors: ["#08111f", "#14213a", "#4f8cff"] },
  { value: "executive", name: "Executive", description: "Graphite structure, decisive borders, and restrained professional contrast.", colors: ["#111315", "#25282c", "#c79a4b"] },
  { value: "nordic", name: "Nordic", description: "Quiet cool surfaces, airy spacing, and calm editorial clarity.", colors: ["#e8edf2", "#f8fafb", "#347c78"] },
  { value: "contrast", name: "High Contrast", description: "Maximum separation, stronger focus rings, and crisp data readability.", colors: ["#050505", "#1b1b1b", "#ffd84d"] },
] as const;

function AppearanceThemePicker({ value, onChange }: { value: AppData["settings"]["appearanceTheme"]; onChange: (value: AppData["settings"]["appearanceTheme"]) => void }) {
  return (
    <div className="settings-theme-grid" role="radiogroup" aria-label="Professional themes">
      {appearanceThemes.map((theme) => (
        <button key={theme.value} type="button" role="radio" aria-checked={value === theme.value} className={`settings-theme-card theme-preview-${theme.value}${value === theme.value ? " is-selected" : ""}`} onClick={() => onChange(theme.value)}>
          <span className="settings-theme-card-top">
            <span className="settings-theme-palette" aria-hidden="true">{theme.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span>
            {value === theme.value && <span className="settings-theme-selected"><Check size={13} aria-hidden="true" /> Active</span>}
          </span>
          <strong>{theme.name}</strong>
          <small>{theme.description}</small>
        </button>
      ))}
    </div>
  );
}

const accentOptions = ["blue", "green", "gold", "purple", "red"] as const;

function AccentPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="settings-accent-picker" role="radiogroup" aria-label="Accent color">
      {accentOptions.map((accent) => (
        <button key={accent} type="button" className={value === accent ? "is-selected" : ""} role="radio" aria-checked={value === accent} aria-label={`${titleCase(accent)} accent`} title={`${titleCase(accent)} accent`} onClick={() => onChange(accent)}>
          <span className={`accent-swatch ${accent}`} aria-hidden="true" />
          {value === accent && <Check size={13} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

function ChartSlideControls({ labels, active, onChange }: { labels: string[]; active: number; onChange: (index: number) => void }) {
  return <div className="chart-slide-controls">
    <button type="button" onClick={() => onChange((active - 1 + labels.length) % labels.length)} aria-label="Previous chart">‹</button>
    <div role="tablist" aria-label="Chart views">{labels.map((label, index) => <button key={label} type="button" role="tab" aria-selected={active === index} onClick={() => onChange(index)}><i aria-hidden="true" />{label}</button>)}</div>
    <button type="button" onClick={() => onChange((active + 1) % labels.length)} aria-label="Next chart">›</button>
  </div>;
}

function chartPoints(values: number[], max: number): string {
  return values.map((value, index) => `${42 + (values.length <= 1 ? 264 : (index / (values.length - 1)) * 528)},${180 - (value / Math.max(1, max)) * 162}`).join(" ");
}

function ReportLineChart({ data, max }: { data: Array<{ label: string; income: number; expenses: number }>; max: number }) {
  if (!data.length) return <p className="empty-copy">No transactions in this period.</p>;
  return <svg className="report-svg-chart" viewBox="0 0 600 220" role="img" aria-label="Income and expense trend lines">
    <line x1="42" y1="180" x2="570" y2="180" className="chart-axis" /><polyline points={chartPoints(data.map((item) => item.income), max)} className="chart-line income" /><polyline points={chartPoints(data.map((item) => item.expenses), max)} className="chart-line expense" />
    {data.map((item, index) => { const x = 42 + (data.length <= 1 ? 264 : (index / (data.length - 1)) * 528); return <g key={item.label}><circle cx={x} cy={180 - (item.income / max) * 162} r="4" className="chart-dot income" /><circle cx={x} cy={180 - (item.expenses / max) * 162} r="4" className="chart-dot expense" /><text x={x} y="205" textAnchor="middle">{item.label}</text></g>; })}
  </svg>;
}

function ForecastLineChart({ data, max }: { data: Array<{ label: string; balance: number }>; max: number }) {
  const points = data.map((item, index) => `${42 + (index / Math.max(1, data.length - 1)) * 528},${item.balance >= 0 ? 110 - (item.balance / max) * 82 : 110 + (Math.abs(item.balance) / max) * 82}`).join(" ");
  return <svg className="report-svg-chart forecast" viewBox="0 0 600 220" role="img" aria-label="Cumulative 12-month cash flow projection">
    <line x1="42" y1="110" x2="570" y2="110" className="chart-axis zero" /><polyline points={points} className={`chart-line ${data[0]?.balance >= 0 ? "income" : "expense"}`} />
    {data.map((item, index) => { const x = 42 + (index / Math.max(1, data.length - 1)) * 528; const y = item.balance >= 0 ? 110 - (item.balance / max) * 82 : 110 + (Math.abs(item.balance) / max) * 82; return <g key={item.label}><circle cx={x} cy={y} r="3.5" className={`chart-dot ${item.balance >= 0 ? "income" : "expense"}`} />{(index === 0 || index === 5 || index === 11) && <text x={x} y="207" textAnchor="middle">{item.label}</text>}</g>; })}
  </svg>;
}

const wallpaperOptions: Array<{ value: AppData["settings"]["wallpaper"]; label: string; image?: string }> = [
  { value: "default", label: "Default" },
  { value: "modern", label: "Modern", image: "/wallpapers/modern.png" },
  { value: "anime", label: "Anime", image: "/wallpapers/anime.png" },
  { value: "animation", label: "Animation", image: "/wallpapers/animation.png" },
  { value: "upload", label: "Upload" },
];

function WallpaperPicker({
  value,
  customWallpaper,
  backgroundOpacity,
  cardOpacity,
  onChange,
  onPreviewChange,
}: {
  value: AppData["settings"]["wallpaper"];
  customWallpaper: string;
  backgroundOpacity: number;
  cardOpacity: number;
  onChange: (value: AppData["settings"]["wallpaper"], customWallpaper?: string, backgroundOpacity?: number, cardOpacity?: number) => void;
  onPreviewChange: (preview: WallpaperPreviewSettings | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftWallpaper, setDraftWallpaper] = useState(value);
  const [draftCustomWallpaper, setDraftCustomWallpaper] = useState(customWallpaper);
  const [draftBackgroundOpacity, setDraftBackgroundOpacity] = useState(backgroundOpacity);
  const [draftCardOpacity, setDraftCardOpacity] = useState(cardOpacity);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const selectedOption = wallpaperOptions.find((option) => option.value === value) || wallpaperOptions[0];
  const draftOption = wallpaperOptions.find((option) => option.value === draftWallpaper) || wallpaperOptions[0];
  const draftPreview = wallpaperPreviewSource(draftWallpaper, draftCustomWallpaper);

  const closePicker = useCallback(() => {
    setDraftWallpaper(value);
    setDraftCustomWallpaper(customWallpaper);
    setDraftBackgroundOpacity(backgroundOpacity);
    setDraftCardOpacity(cardOpacity);
    onPreviewChange(null);
    setOpen(false);
  }, [backgroundOpacity, cardOpacity, customWallpaper, onPreviewChange, value]);

  useEffect(() => {
    setDraftWallpaper(value);
    setDraftCustomWallpaper(customWallpaper);
    setDraftBackgroundOpacity(backgroundOpacity);
    setDraftCardOpacity(cardOpacity);
  }, [value, customWallpaper, backgroundOpacity, cardOpacity]);

  useEffect(() => {
    if (!open) {
      onPreviewChange(null);
      return;
    }
    onPreviewChange({ wallpaper: draftWallpaper, customWallpaper: draftCustomWallpaper, backgroundOpacity: draftBackgroundOpacity, cardOpacity: draftCardOpacity });
  }, [open, draftWallpaper, draftCustomWallpaper, draftBackgroundOpacity, draftCardOpacity, onPreviewChange]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : manageButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusable = dialog ? [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')] : [];
    window.requestAnimationFrame(() => focusable[0]?.focus());
    function handleDialogKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePicker();
        return;
      }
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleDialogKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKey);
      previousFocus?.focus();
    };
  }, [open, closePicker]);

  function uploadWallpaper(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraftWallpaper("upload");
      setDraftCustomWallpaper(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  }

  function chooseUploadWallpaper() {
    if (draftCustomWallpaper) {
      setDraftWallpaper("upload");
      return;
    }
    uploadInputRef.current?.click();
  }

  function handleUploadKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    chooseUploadWallpaper();
  }

  function saveWallpaper() {
    onChange(draftWallpaper, draftCustomWallpaper, draftBackgroundOpacity, draftCardOpacity);
    onPreviewChange(null);
    setOpen(false);
  }

  return (
    <>
      <div className="settings-wallpaper-summary">
        <div className={`settings-wallpaper-current wallpaper-current-${value}`}>
          {value !== "default" && wallpaperPreviewSource(value, customWallpaper) ? <img src={wallpaperPreviewSource(value, customWallpaper)} alt="" /> : <span>Default</span>}
        </div>
        <div>
          <strong>{selectedOption.label}</strong>
          <small>{value === "default" ? "Original VCC background" : "Wallpaper background"}</small>
        </div>
        <button ref={manageButtonRef} type="button" onClick={() => setOpen(true)}>Manage backgrounds</button>
      </div>

      {open && createPortal(
        <div className="settings-wallpaper-modal" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closePicker();
        }}>
          <section ref={dialogRef} className="settings-wallpaper-dialog" role="dialog" aria-modal="true" aria-labelledby="wallpaper-dialog-title">
            <header className="settings-wallpaper-dialog-header">
              <div>
                <p className="settings-kicker">Backgrounds</p>
                <h3 id="wallpaper-dialog-title">Choose VCC background</h3>
              </div>
              <button type="button" aria-label="Close background picker" onClick={closePicker}><X size={18} /></button>
            </header>

            <div className="settings-wallpaper-dialog-body">
              <div className={`settings-wallpaper-vcc-preview${draftPreview ? " has-preview-image" : ""}`} style={wallpaperPreviewStyle(draftPreview, draftBackgroundOpacity, draftCardOpacity)}>
                <div className="settings-wallpaper-preview-nav">
                  <span>VCC-OS</span>
                  <b>{draftOption.label}</b>
                </div>
                <div className="settings-wallpaper-preview-card is-wide">
                  <small>Today&apos;s Mission</small>
                  <strong>Keep the command center clear</strong>
                  <span>Glass panels stay legible over the visible background.</span>
                </div>
                <div className="settings-wallpaper-preview-grid">
                  <div className="settings-wallpaper-preview-card">
                    <small>Money Snapshot</small>
                    <strong>$3,065.52</strong>
                  </div>
                  <div className="settings-wallpaper-preview-card">
                    <small>Priority Alerts</small>
                    <strong>3 active</strong>
                  </div>
                </div>
              </div>

              <div className="settings-wallpaper-tuning" aria-label="Background tuning">
                <SettingSlider
                  label="Background visibility"
                  value={draftBackgroundOpacity}
                  min={20}
                  max={100}
                  onChange={setDraftBackgroundOpacity}
                />
                <SettingSlider
                  label="Card opacity"
                  value={draftCardOpacity}
                  min={0}
                  max={100}
                  onChange={setDraftCardOpacity}
                />
              </div>

              <div className="settings-wallpaper-picker" role="radiogroup" aria-label="Background wallpaper">
                {wallpaperOptions.map((option) => {
                  const selected = draftWallpaper === option.value;
                  if (option.value === "upload") {
                    return (
                      <div
                        key={option.value}
                        className={`settings-wallpaper-option settings-wallpaper-upload${selected ? " is-selected" : ""}`}
                        role="radio"
                        aria-checked={selected}
                        tabIndex={0}
                        onClick={chooseUploadWallpaper}
                        onKeyDown={handleUploadKeyDown}
                      >
                        {draftCustomWallpaper ? <img className="settings-wallpaper-upload-preview" src={draftCustomWallpaper} alt="" /> : (
                          <span className="settings-wallpaper-upload-drop">
                            <Upload size={17} aria-hidden="true" />
                            <strong>{option.label}</strong>
                          </span>
                        )}
                        <span className="settings-wallpaper-upload-label">
                          <strong>{draftCustomWallpaper ? "Custom upload" : "Upload image"}</strong>
                          {selected && <Check size={14} aria-hidden="true" />}
                        </span>
                        <button
                          type="button"
                          className="settings-wallpaper-upload-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            uploadInputRef.current?.click();
                          }}
                        >
                          {draftCustomWallpaper ? "Replace" : "Choose"}
                        </button>
                        <input
                          ref={uploadInputRef}
                          className="settings-wallpaper-file"
                          aria-label="Upload custom wallpaper"
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            uploadWallpaper(event.currentTarget.files?.[0]);
                            event.currentTarget.value = "";
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <label key={option.value} className={`settings-wallpaper-option${selected ? " is-selected" : ""}`}>
                      <input type="radio" name="wallpaper" checked={selected} onChange={() => setDraftWallpaper(option.value)} />
                      {option.image ? <img src={option.image} alt="" loading="lazy" /> : <span className="settings-wallpaper-default-tile">Original</span>}
                      <span>
                        <strong>{option.label}</strong>
                        {selected && <Check size={14} aria-hidden="true" />}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <footer className="settings-wallpaper-dialog-actions">
              <button type="button" onClick={closePicker}>Cancel</button>
              <button type="button" className="settings-wallpaper-save" onClick={saveWallpaper}><Save size={16} /> Save background</button>
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}

function wallpaperPreviewSource(value: AppData["settings"]["wallpaper"], customWallpaper: string) {
  if (value === "upload") return customWallpaper;
  return wallpaperOptions.find((option) => option.value === value)?.image || "";
}

function wallpaperPreviewStyle(preview: string, backgroundOpacity: number, cardOpacity: number): CSSProperties {
  const visibility = clampNumber(backgroundOpacity, 20, 100) / 100;
  const cardAlpha = clampNumber(cardOpacity, 0, 100) / 100;
  return {
    ...(preview ? { "--settings-wallpaper-preview": `url(${JSON.stringify(preview)})` } : {}),
    "--settings-preview-start-alpha": previewLerp(0.72, 0.08, visibility).toFixed(2),
    "--settings-preview-end-alpha": previewLerp(0.88, 0.34, visibility).toFixed(2),
    "--settings-preview-side-alpha": previewLerp(0.58, 0.2, visibility).toFixed(2),
    "--settings-preview-middle-alpha": previewLerp(0.26, 0.04, visibility).toFixed(2),
    "--settings-preview-card-alpha": cardAlpha.toFixed(2),
  } as CSSProperties;
}

function SettingSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const normalizedValue = clampNumber(value, min, max);

  return (
    <label className="settings-range-control">
      <span>
        <strong>{label}</strong>
        <small>{normalizedValue}%</small>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={normalizedValue}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function clampNumber(value: number | undefined, min: number, max: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : max;
  return Math.min(max, Math.max(min, Math.round(safeValue)));
}

function previewLerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

const widgetOptions = [
  { id: "total-cash", label: "Total Cash" },
  { id: "money-snapshot", label: "Spendable / Safe" },
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

function SettingInput({ label, description, value, onChange }: { label: string; description: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="settings-text-field">
      <span className="settings-row-copy"><strong>{label}</strong><small>{description}</small></span>
      <BufferedTextInput aria-label={label} value={value} onValueChange={onChange} delay={280} />
    </label>
  );
}

function SettingToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="setting-toggle">
      <span>{label}</span>
      <span className="vcc-switch">
        <input aria-label={label} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="vcc-switch-track" aria-hidden="true"><span /></span>
      </span>
    </label>
  );
}

function summaryForSection(section: SectionKey, financialState: ReturnType<typeof computeFinancialState>) {
  return {
    money: [
      { label: "Total Cash", value: financialState.totalCash },
      { label: "Spendable / Safe", value: Math.min(financialState.spendableCash, financialState.safeToSpend) },
      { label: "Week Spending", value: -Math.abs(financialState.weeklySpending), tone: "bad" as const },
      { label: "Week Net Impact", value: financialState.transactionWeekNet, tone: financialState.transactionWeekNet < 0 ? "bad" as const : "good" as const },
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
      { label: "Week Impact", value: financialState.transactionWeekNet, tone: financialState.transactionWeekNet < 0 ? "bad" as const : "good" as const },
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
    carPayment: [
      { label: "Remaining Total", value: financialState.carPaymentRemainingTotal, tone: "warn" as const },
      { label: "Original Total", value: financialState.carPaymentOriginalTotal },
      { label: "Monthly Payment", value: financialState.carPaymentMonthlyTotal },
      { label: "Paid Off", value: `${financialState.carPaymentPaidPercent.toFixed(0)}%` },
      { label: "Next Vehicle", value: financialState.nextCarPayment },
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
  if (section === "bills" && columnKey === "status") {
    return billStatus(row);
  }
  if (section === "money" && columnKey === "section") {
    return moneySectionLabel(moneySection(row));
  }
  if (section === "inventory") {
    if (columnKey === "category") return row.cells.item ? categorizeItem(row.cells.item) : "";
    if (columnKey === "alert") return getInventoryAlert(row.cells.qty || "", row.cells.minNeeded || "");
  }
  if (section === "transactions" && columnKey === "category") {
    return hasTransactionIdentifier(row) ? identifyTransactionCategory(row) : "";
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
  const normalizedRow = {
    ...row,
    cells: {
      ...row.cells,
      description: row.cells.description || "",
      type: row.cells.type || "",
      category: row.cells.category || "",
      amount: row.cells.amount || "",
      date: row.cells.date || "",
      account: row.cells.account || "",
      recurring: row.cells.recurring || row.cells.is_recurring || "",
      notes: row.cells.notes || "",
    },
  };

  return {
    ...normalizedRow,
    cells: {
      ...normalizedRow.cells,
      category: hasTransactionIdentifier(normalizedRow) ? identifyTransactionCategory(normalizedRow) : "",
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

function transactionCategory(row: SpreadsheetRow): string {
  return identifyTransactionCategory(row);
}

function hasTransactionIdentifier(row: SpreadsheetRow): boolean {
  return [row.cells.description, row.cells.account, row.cells.notes, row.cells.type, row.cells.amount, row.cells.category]
    .some((value) => String(value || "").trim());
}

function transactionDateMatches(dateText: string, filter: string): boolean {
  if (filter === "week" || filter === "lastweek" || filter === "month" || filter === "lastmonth") return transactionMatchesPeriod(dateText, filter);
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
  if (status === "paid") return "paid";
  if (status === "overdue" || status === "late") return "overdue";
  const dueDate = row.cells.dueDate || row.cells.due_date || "";
  if (dueDate) {
    const due = new Date(`${dueDate}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!Number.isNaN(due.getTime()) && due < today) return "overdue";
  }
  return "unpaid";
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

const knownPaths = new Set([
  "/",
  "/money",
  "/bills",
  "/income",
  "/transactions",
  "/debt",
  "/debts",
  "/car-payment",
  "/savings",
  "/inventory",
  "/goals",
  "/reports",
  "/vitascan",
  "/missions",
  "/settings",
]);
