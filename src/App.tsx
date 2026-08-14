import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BrainCircuit,
  CalendarClock,
  Check,
  Plus,
  ReceiptText,
  Trash2,
  X,
} from "lucide-react";
import AppShell from "./components/layout/AppShell";
import { layoutViewClass } from "./components/layout/LayoutViews";
import NotFound from "./components/layout/NotFound";
import WelcomeTransition from "./components/layout/WelcomeTransition";
import type { WallpaperPreviewSettings } from "./components/settings/SettingsPage";
import Spreadsheet from "./components/shared/Spreadsheet";
import SummaryGrid from "./components/shared/SummaryGrid";
import BufferedTextInput from "./components/shared/BufferedTextInput";
import type { TransactionLayoutVariant } from "./components/transactions/TransactionHistoryConcepts";
import { formatCurrency, formatDateMDY, isBlankRow, todayIso, toNumber } from "./lib/calculations/currency";
import { amountToCents, calculateReceiptLineAmounts, centsToAmount } from "./lib/calculations/receiptMath";
import { computeDecisionEngine, rankBillRows } from "./lib/engine/decisionEngine";
import { computeFinancialState } from "./lib/engine/financialEngine";
import { applyBillRowsEvent, deleteTransactionEvent } from "./lib/engine/financialEventEngine";
import { categorizeItem, getInventoryAlert, normalizeInventoryRow, rankInventoryRows } from "./lib/engine/inventoryEngine";
import { migrateLegacyReceiptTaxRows } from "./lib/engine/receiptTransactionEngine";
import { identifyTransactionCategory, signedTransactionAmount, transactionMatchesPeriod, transactionType, type TransactionPeriod } from "./lib/engine/transactionEngine";
import { applySavingsTransfer, syncTransactionEndpointLabels, syncTransactionTransfers, transactionEndpointOptions, type TransactionShortfallSource } from "./lib/engine/savingsTransferEngine";
import { depositAccountOptions, eligibleDepositAccounts, type DepositAccountOption } from "./lib/engine/paycheckPlannerEngine";
import { sectionConfigs } from "./lib/storage/defaultData";
import { loadAppData, resetSection, saveAppData, saveThemePreference } from "./lib/storage/localStore";
import { applyVisualSettings, getSystemTheme } from "./lib/theme/themePreference";
import type { AppData, SectionKey, SpreadsheetRow, ThemeMode } from "./lib/types/app";
import { enforceChimeBalanceFloor } from "./lib/engine/chimeAccountingEngine";
import { canonicalizeAccountRows, canonicalizeInventoryRows } from "./lib/engine/canonicalRecords";
import { syncRecurringBillOccurrences } from "./lib/engine/recurringBillEngine";
import { useVccCloudSync } from "./lib/cloud/useVccCloudSync";

const worldwideTransactionCategories = [
  "Income", "Housing", "Utilities", "Groceries", "Restaurants", "Transportation", "Fuel", "Travel", "Healthcare", "Insurance",
  "Debt Payments", "Savings", "Investments", "Education", "Childcare", "Pets", "Subscriptions", "Entertainment", "Shopping",
  "Personal Care", "Tobacco", "Taxes", "Fees", "Gifts & Donations", "Business", "Transfers", "Other", "Uncategorized",
];

const VccAgent = lazy(() => import("./components/agent/VccAgent"));
const CloudSyncControl = lazy(() => import("./components/shared/CloudSyncControl"));
const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const PaycheckPlanner = lazy(() => import("./components/modules/PaycheckPlanner"));
const CarLoanWorkspace = lazy(() => import("./components/modules/CarLoanWorkspace"));
const ReportsPage = lazy(() => import("./components/modules/ReportsPage"));
const SettingsPage = lazy(() => import("./components/settings/SettingsPage"));
const TransactionHistoryConcepts = lazy(() => import("./components/transactions/TransactionHistoryConcepts"));
const VitaScan = lazy(() => import("./components/modules/VitaScan"));

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const themePreferenceRef = useRef<ThemeMode>(data.settings.theme);
  const [wallpaperPreview, setWallpaperPreview] = useState<WallpaperPreviewSettings | null>(null);
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() => getSystemTheme());
  const path = normalizePath(window.location.pathname);
  const isKnownPath = knownPaths.has(path);
  const financialState = useMemo(() => computeFinancialState(data), [data]);
  const [recentlyCompletedMissionIds, setRecentlyCompletedMissionIds] = useState<string[]>([]);
  const previousBorrowedMoneyRef = useRef(financialState.borrowedMoney);
  const missionRemovalTimerRef = useRef<number | undefined>(undefined);
  const decisionState = useMemo(
    () => computeDecisionEngine(financialState, data, recentlyCompletedMissionIds),
    [financialState, data, recentlyCompletedMissionIds],
  );
  const activeTheme = data.settings.theme === "system" ? systemTheme : data.settings.theme;
  const normalizeAndSetData = useCallback((next: AppData) => {
    const normalized = {
      ...next,
      version: 5,
      settings: { ...next.settings, theme: themePreferenceRef.current },
      sections: {
        ...next.sections,
        money: canonicalizeAccountRows(next.sections.money),
        inventory: canonicalizeInventoryRows(next.sections.inventory),
        transactions: migrateLegacyReceiptTaxRows(next.sections.transactions),
      },
    };
    saveAppData(normalized);
    setData(normalized);
  }, []);
  const cloudSync = useVccCloudSync(data, normalizeAndSetData);

  useEffect(() => {
    const previousBorrowedMoney = previousBorrowedMoneyRef.current;
    const currentBorrowedMoney = financialState.borrowedMoney;
    previousBorrowedMoneyRef.current = currentBorrowedMoney;

    if (currentBorrowedMoney > 0) {
      if (missionRemovalTimerRef.current) window.clearTimeout(missionRemovalTimerRef.current);
      setRecentlyCompletedMissionIds((ids) => ids.filter((id) => id !== "clear-borrowed-money"));
      return;
    }
    if (previousBorrowedMoney <= 0) return;

    const completedAt = new Date().toISOString();
    setRecentlyCompletedMissionIds((ids) => [...new Set([...ids, "clear-borrowed-money"])]);
    setData((currentData) => {
      const next = {
        ...currentData,
        activity: [{
          id: `activity-borrowed-repaid-${Date.now()}`,
          type: "mission_completed" as const,
          title: "Borrowed money mission completed",
          detail: `${formatCurrency(previousBorrowedMoney)} in recorded SpotMe/MyPay or advances was repaid.`,
          createdAt: completedAt,
        }, ...currentData.activity].slice(0, 50),
      };
      saveAppData(next);
      return next;
    });
    if (missionRemovalTimerRef.current) window.clearTimeout(missionRemovalTimerRef.current);
    missionRemovalTimerRef.current = window.setTimeout(() => {
      setRecentlyCompletedMissionIds((ids) => ids.filter((id) => id !== "clear-borrowed-money"));
    }, 3500);
  }, [financialState.borrowedMoney]);

  useEffect(() => () => {
    if (missionRemovalTimerRef.current) window.clearTimeout(missionRemovalTimerRef.current);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemTheme(media.matches ? "dark" : "light");
    updateSystemTheme();
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
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
    const nextRows = section === "money"
      ? canonicalizeAccountRows(enforceChimeBalanceFloor(autoFillMoneyWeek(rows, data)))
      : section === "inventory"
        ? canonicalizeInventoryRows(rows)
        : rows;
    if (section === "bills") {
      const recurringRows = syncRecurringBillOccurrences(nextRows);
      updateData(applyBillRowsEvent(data, recurringRows));
      return;
    }
    const nextData = { ...data, sections: { ...data.sections, [section]: nextRows } };
    updateData(section === "money" || section === "savings" ? syncTransactionEndpointLabels(nextData) : nextData);
  }

  function updateSort(section: SectionKey, sortBy: string) {
    updateData({ ...data, sortBy: { ...data.sortBy, [section]: sortBy } });
  }

  function handleResetSection(section: SectionKey) {
    updateData(resetSection(data, section));
  }

  if (path === "/vitascan") return (
    <Suspense fallback={(
      <main className="vitascan-loading" role="status">
        <h1 className="sr-only">VitaScan</h1>
        <span>Opening VitaScan…</span>
      </main>
    )}>
      <VitaScan data={data} onChange={updateData} />
      <CloudSyncControl sync={cloudSync}/>
    </Suspense>
  );

  return (
    <>
    {path === "/" && <WelcomeTransition settings={data.settings} />}
    <AppShell currentPath={path} settings={data.settings} activeTheme={activeTheme} wallpaperPreview={wallpaperPreview} data={data} onSettingsChange={(settings) => updateData({ ...data, settings })}>
      <Suspense fallback={<RouteLoading />}>
      {path === "/" && <Dashboard financialState={financialState} decisionState={decisionState} activity={data.activity} accounts={depositAccountOptions(data)} layoutView={data.settings.layoutViews.dashboard} />}
      {path === "/money" && (
        <MoneyPage data={data} financialState={financialState} decisionState={decisionState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} onChange={updateData} />
      )}
      {path === "/bills" && <BillsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/income" && <ModulePage section="income" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/transactions" && <TransactionsConceptPage data={data} onChange={updateData} />}
      {(path === "/debt" || path === "/debts") && <ModulePage section="debt" data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/car-payment" && <CarLoanWorkspace data={data} financialState={financialState} onChange={updateData} />}
      {path === "/savings" && <SavingsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} onChange={updateData} />}
      {path === "/inventory" && <InventoryPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/goals" && <GoalsPage data={data} financialState={financialState} updateRows={updateRows} updateSort={updateSort} resetSection={handleResetSection} />}
      {path === "/reports" && <ReportsPage layoutView={data.settings.layoutViews.reports} transactions={data.sections.transactions.map(normalizeTransactionRow)} />}
      {path === "/missions" && <MissionsPage decisionState={decisionState} activity={data.activity} />}
      {path === "/settings" && <SettingsPage data={data} onChange={updateData} onResetSection={handleResetSection} onWallpaperPreviewChange={setWallpaperPreview} />}
      {!isKnownPath && <NotFound />}
      </Suspense>
      <Suspense fallback={null}>
        {isKnownPath && <VccAgent data={data} financialState={financialState} decisionState={decisionState} petEnabled={data.settings.vccPetEnabled} companionId={data.settings.vccCompanionId} onCompanionChange={(vccCompanionId) => updateData({ ...data, settings: { ...data.settings, vccCompanionId } })} />}
      </Suspense>
    </AppShell>
    {recentlyCompletedMissionIds.includes("clear-borrowed-money") && (
      <div className="mission-completion-notice" role="status" aria-live="polite">
        <Check size={18} aria-hidden="true" />
        <div><strong>Borrowed money repaid</strong><span>Mission completed and added to Activity.</span></div>
      </div>
    )}
    <Suspense fallback={null}>
      <CloudSyncControl sync={cloudSync}/>
    </Suspense>
    </>
  );
}

function RouteLoading() {
  return (
    <section className="panel" role="status" aria-live="polite">
      <p>Opening page…</p>
    </section>
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
  const accounts = depositAccountOptions(data);
  const spendableSafe = Math.min(financialState.spendableCash, financialState.safeToSpend);
  const moneyStats = [
    { label: "Total Cash", value: financialState.totalCash },
    { label: "Spendable / Safe", value: spendableSafe },
    { label: "Protected Savings", value: financialState.protectedSavings },
    { label: "Available Savings", value: financialState.availableSavings },
    { label: "Account Deficit", value: financialState.accountDeficit, tone: "bad" as const },
    { label: "Borrowed Money", value: financialState.borrowedMoney, tone: "warn" as const },
    { label: "Unaccounted Cash", value: financialState.unreconciledCash, tone: "warn" as const },
  ];

  return (
    <div className={`money-page ${layoutViewClass(data.settings.layoutViews.money)}`} data-layout-view={data.settings.layoutViews.money}>
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

      <MoneyAccountOverview accounts={accounts} />

      <PaycheckPlanner data={data} onChange={onChange} showHistory={false} />

      <section className="money-simple-inputs" aria-labelledby="canonical-accounts-title">
        <div className="money-account-heading">
          <div>
            <p className="eyebrow">Authoritative Accounts</p>
            <h2 id="canonical-accounts-title">Manage account balances at their source</h2>
            <p>Money Snapshot is derived from these accounts, linked transactions, savings vaults, bills, and borrowing rules.</p>
          </div>
        </div>
        <Spreadsheet
          config={{ ...sectionConfigs.money, title: "Canonical Accounts" }}
          rows={moneyRows}
          sortBy={data.sortBy.money}
          onSortChange={updateSort}
          onRowsChange={updateRows}
          onResetSection={resetSection}
          getComputedCell={(row, columnKey) => computedCell("money", row, columnKey)}
          preventDuplicateKey="label"
          addLabel="Add Account"
        />
      </section>

      <MoneyPaycheckHistory data={data} />
    </div>
  );
}

function MoneyAccountOverview({ accounts }: { accounts: DepositAccountOption[] }) {
  const connectedCount = accounts.filter((account) => !account.isNew).length;

  return (
    <section className="money-account-panel" aria-labelledby="money-accounts-title">
      <div className="money-account-heading">
        <div>
          <p className="eyebrow">Linked Accounts</p>
          <h2 id="money-accounts-title">Every account in one view</h2>
          <p>These balances are shared with Transactions, savings transfers, and the Current Week Planner.</p>
        </div>
        <span>{connectedCount} with activity</span>
      </div>
      <div className="money-account-grid">
        {accounts.map((account) => (
          <article key={account.id} className={`${account.isNew ? "available" : "connected"} ${account.balance < 0 ? "negative" : ""}`}>
            <div>
              <strong>{account.label}</strong>
              <small>{account.balance < 0 ? "Overdrawn · included in totals" : account.isNew ? "Ready for first transaction" : "Linked and updating"}</small>
            </div>
            <b>{formatCurrency(account.balance)}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function MoneyPaycheckHistory({
  data,
}: {
  data: AppData;
}) {
  return (
    <section className="money-history-panel" aria-label="Money Snapshot paycheck history">
      <div className="money-history-heading">
        <div>
          <p className="eyebrow">Paycheck History</p>
          <h2>Locked Paycheck Records</h2>
        </div>
        <span>{data.paycheckHistory.length ? `${data.paycheckHistory.length} locked` : "No records yet"}</span>
      </div>

      <div className="money-history-list">
        {data.paycheckHistory.map((row) => (
          <article className="money-history-record" key={row.id}>
            <div>
              <span>Locked Week</span>
              <strong>{formatCurrency(toNumber(row.remaining))}</strong>
              <small>{row.payDate ? formatDateMDY(row.payDate) : "No pay date"}</small>
            </div>
            <dl>
              <div>
                <dt>Income Source</dt>
                <dd>{row.incomeSource || "Not recorded"}</dd>
              </div>
              <div>
                <dt>Deposited To</dt>
                <dd>{row.depositAccountLabel || "Not recorded"}</dd>
              </div>
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

        {data.paycheckHistory.length === 0 && (
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
  const [billMessage, setBillMessage] = useState("");
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
  const dueBill = rankedBills[0];
  const billStats = {
    shown: visibleBillRows.filter((row) => !isBlankRow(row.cells)).length,
    total: filledBillRows.length,
    amount: visibleBillRows.reduce((sum, row) => sum + toNumber(row.cells.amount), 0),
    overdue: filledBillRows.filter((row) => ["overdue", "late"].includes(billStatus(row))).length,
    unpaid: filledBillRows.filter((row) => billStatus(row) === "unpaid").length,
    paid: filledBillRows.filter((row) => billStatus(row) === "paid").length,
    autopay: filledBillRows.filter((row) => isAffirmative(row.cells.autopay)).length,
    priority: rankedBills.filter((bill) => ["overdue", "late"].includes(bill.status) || bill.score >= 75).length,
  };

  function updateVisibleBillRows(section: SectionKey, nextVisibleRows: SpreadsheetRow[]) {
    const normalizedNextRows = nextVisibleRows.map(normalizeBillRow);
    const nextVisibleIds = new Set(normalizedNextRows.map((row) => row.id));
    const preservedRows = billRows.filter((row) => !visibleBillIds.has(row.id) || nextVisibleIds.has(row.id));
    const mergedRows = preservedRows.map((row) => normalizedNextRows.find((next) => next.id === row.id) || row);
    const addedRows = normalizedNextRows.filter((row) => !billRows.some((existing) => existing.id === row.id));
    const nextBillRows = [...mergedRows, ...addedRows];
    for (const nextRow of normalizedNextRows) {
      const previousRow = billRows.find((row) => row.id === nextRow.id);
      const newlyPaid = billStatus(nextRow) === "paid" && billStatus(previousRow || { id: "", cells: {} }) !== "paid";
      if (newlyPaid && !nextRow.cells.paymentAccount?.trim()) {
        setBillMessage(`Choose the account that paid ${nextRow.cells.name || "this bill"} before marking it paid.`);
        return;
      }
      if (newlyPaid && !nextRow.cells.paidDate) nextRow.cells.paidDate = todayIso();
    }
    setBillMessage("");
    updateRows(section, nextBillRows);
  }

  const billsTableConfig = {
    ...sectionConfigs.bills,
    title: "Bills",
    columns: sectionConfigs.bills.columns.filter((column) => column.key !== "recurring"),
  };

  return (
    <div className={`bills-page module-page ${layoutViewClass(data.settings.layoutViews.bills)}`} data-layout-view={data.settings.layoutViews.bills}>
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

      <SummaryGrid items={summaryForSection("bills", financialState)} />

      <section className="bills-command-panel bills-list-toolbar" aria-label="Bills list controls">
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
        <div className="bills-inline-stats" aria-label="Visible bill summary">
          <span>{billStats.shown} shown</span>
          <strong>{formatCurrency(billStats.amount)} total</strong>
          <strong className={billStats.overdue > 0 ? "bad" : ""}>{billStats.overdue} overdue</strong>
          <em>{billStats.autopay} autopay</em>
        </div>
      </section>
      {billMessage && <p className="table-validation" role="alert">{billMessage}</p>}

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
          <h2>{billStats.priority ? `${billStats.priority} priority bill${billStats.priority === 1 ? "" : "s"}` : "No priority bills"}</h2>
          <p className="empty-copy">
            {billStats.overdue > 0 ? `${billStats.overdue} bill${billStats.overdue > 1 ? "s need" : " needs"} attention now.` : "Bill pressure is being tracked from your rows."}
          </p>
        </article>
      </section>

      <Spreadsheet
        config={billsTableConfig}
        rows={visibleBillRows}
        sortBy={data.sortBy.bills}
        onSortChange={updateSort}
        onRowsChange={updateVisibleBillRows}
        onResetSection={resetSection}
        getComputedCell={(row, columnKey) => computedCell("bills", row, columnKey)}
        selectOptions={{
          status: ["unpaid", "upcoming", "overdue", "paid", "cancelled"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) })),
          paymentAccount: transactionEndpointOptions(data)
            .filter((account) => account.kind === "money" && !account.isNew)
            .map((account) => ({ value: account.value, label: account.label })),
        }}
        addLabel="Add Bill"
      />
    </div>
  );
}

// Legacy spreadsheet surface retained for rollback compatibility; live routing uses Layout Views.
export function TransactionsPage({
  data,
  financialState,
  updateSort,
  resetSection,
  onChange,
}: {
  data: AppData;
  financialState: ReturnType<typeof computeFinancialState>;
  updateSort: (section: SectionKey, sortBy: string) => void;
  resetSection: (section: SectionKey) => void;
  onChange: (next: AppData) => void;
}) {
  const [transactionSearch, setTransactionSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [transferMessage, setTransferMessage] = useState("");
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(true);
  const transactionEndpoints = useMemo(() => transactionEndpointOptions(data), [data]);
  const transactionSelectOptions = useMemo(() => {
    const options = transactionEndpoints.map(({ value, label }) => ({ value, label }));
    return {
      account: options,
      transferDestination: options,
      shortfallSource: [
        { value: "overdraft", label: "Let account go negative" },
        { value: "borrowed", label: "Borrowed money" },
        { value: "unreconciled", label: "Unaccounted cash" },
      ],
    };
  }, [transactionEndpoints]);
  const accountFilterOptions = useMemo(() => {
    const uniqueAccounts = new Map<string, string>();
    [
      ...transactionEndpoints.map((option) => option.value),
      ...data.sections.transactions.flatMap((row) => [row.cells.account, row.cells.transferDestination]),
    ].forEach((account) => {
      const label = account?.trim();
      if (label) uniqueAccounts.set(label.toLowerCase(), label);
    });
    return [...uniqueAccounts.values()].sort((left, right) => left.localeCompare(right));
  }, [data.sections.transactions, transactionEndpoints]);
  const transactionRows = data.sections.transactions.map(normalizeTransactionRow);
  const visibleTransactionRows = transactionRows.filter((row) => {
    if (isBlankRow(row.cells)) return !transactionSearch.trim() && categoryFilter === "all" && typeFilter === "all" && accountFilter === "all" && dateFilter === "all";
    const type = transactionType(row);
    const category = transactionCategory(row);
    const query = transactionSearch.trim().toLowerCase();
    const matchesCategory = categoryFilter === "all" || category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesType = typeFilter === "all" || type === typeFilter;
    const matchesAccount = accountFilter === "all" || [row.cells.account, row.cells.transferDestination]
      .some((account) => account?.trim().toLowerCase() === accountFilter.toLowerCase());
    const matchesSearch = !query || [row.cells.description, row.cells.merchant, row.cells.category, row.cells.account, row.cells.transferDestination, row.cells.notes]
      .join(" ")
      .toLowerCase()
      .includes(query);
    const matchesDate = dateFilter === "all" || transactionDateMatches(row.cells.date, dateFilter);
    return matchesCategory && matchesType && matchesAccount && matchesSearch && matchesDate;
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
  const expenseRows = transactionRows.filter((row) => !isBlankRow(row.cells) && transactionType(row) === "expense");
  const spendingByPeriod = (period: TransactionPeriod) => expenseRows
    .filter((row) => transactionMatchesPeriod(row.cells.date, period))
    .reduce((sum, row) => sum + Math.abs(signedTransactionAmount(row)), 0);
  const thisWeekSpending = spendingByPeriod("week");
  const lastWeekSpending = spendingByPeriod("lastweek");
  const thisMonthSpending = spendingByPeriod("month");
  const lastMonthSpending = spendingByPeriod("lastmonth");

  function updateVisibleTransactionRows(section: SectionKey, nextVisibleRows: SpreadsheetRow[]) {
    if (section !== "transactions") return;
    const normalizedNextRows = nextVisibleRows.map(normalizeTransactionRow);
    const nextVisibleIds = new Set(normalizedNextRows.map((row) => row.id));
    const preservedRows = transactionRows.filter((row) => !visibleTransactionIds.has(row.id) || nextVisibleIds.has(row.id));
    const mergedRows = preservedRows.map((row) => normalizedNextRows.find((next) => next.id === row.id) || row);
    const addedRows = normalizedNextRows.filter((row) => !transactionRows.some((existing) => existing.id === row.id));
    try {
      const next = syncTransactionTransfers(data, [...mergedRows, ...addedRows]);
      onChange(next);
      setTransferMessage(next.sections.transactions.find((row) => row.cells.transferValidation)?.cells.transferValidation || "");
    } catch (error) {
      setTransferMessage(error instanceof Error ? error.message : "The transfer could not be applied.");
    }
  }

  function addReceiptRows(rows: SpreadsheetRow[]): boolean {
    try {
      const next = syncTransactionTransfers(data, [...transactionRows, ...rows]);
      onChange(next);
      setTransferMessage("");
      return true;
    } catch (error) {
      setTransferMessage(error instanceof Error ? error.message : "The receipt could not be added.");
      return false;
    }
  }

  return (
    <div className="transactions-page module-page">
      <SummaryGrid items={summaryForSection("transactions", financialState)} />
      <section className="transactions-command-panel">
        <div>
          <p className="eyebrow">Transactions Control</p>
          <h2>Track every dollar in and out</h2>
        </div>
        <div className="transactions-inline-stats">
          <span>{visibleFilledRows.length} transactions</span>
          <strong className="income">+{formatCurrency(incomeTotal)}</strong>
          <strong className="expense">-{formatCurrency(expenseTotal)}</strong>
          <em>{formatCurrency(transferTotal)} transfers</em>
          <em>Week impact {formatCurrency(financialState.transactionWeekNet)}</em>
          <em>Shortfall spending {formatCurrency(financialState.shortfallSpending)}</em>
          <em>{categoryFilter === "all" ? "All categories" : categoryFilter}</em>
          <em>{accountFilter === "all" ? "All accounts" : accountFilter}</em>
        </div>
        <div className="transactions-period-section" aria-labelledby="spending-period-title">
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
        </div>
      </section>

      <ReceiptEntry
        accounts={transactionSelectOptions.account || []}
        onAddReceipt={addReceiptRows}
      />

      <section className={`transaction-history-shell ${transactionHistoryOpen ? "" : "is-collapsed"}`} aria-labelledby="transaction-history-title">
        <button
          type="button"
          className="transaction-history-heading"
          aria-label={transactionHistoryOpen ? "Collapse transaction history" : "Expand transaction history"}
          aria-expanded={transactionHistoryOpen}
          aria-controls="transaction-history-content"
          onClick={() => setTransactionHistoryOpen((open) => !open)}
        >
          <span className="transaction-history-heading-copy">
            <span className="eyebrow">Spreadsheet</span>
            <span className="collapsible-section-title" id="transaction-history-title">Transaction history</span>
            <span className="transaction-history-description">Search, filter, and edit every recorded transaction.</span>
          </span>
          <span className="collapsible-section-state">
            {transactionHistoryOpen ? "Hide history" : "Show history"}
          </span>
        </button>
        {transactionHistoryOpen && (
          <div id="transaction-history-content" className="transaction-history-content">
            <Spreadsheet
              config={{ ...sectionConfigs.transactions, title: "Transaction History" }}
              rows={visibleTransactionRows}
              sortBy={data.sortBy.transactions}
              onSortChange={updateSort}
              onRowsChange={updateVisibleTransactionRows}
              onResetSection={resetSection}
              getComputedCell={(row, columnKey) => computedCell("transactions", row, columnKey)}
              selectOptions={transactionSelectOptions}
              addLabel="Add Transaction"
              hideSearch
              toolbarContent={(
                <div className="transactions-table-filters" aria-label="Transaction filters">
                  <label className="transactions-table-search">
                    <span className="sr-only">Search transactions</span>
                    <BufferedTextInput aria-label="Search transactions" value={transactionSearch} onValueChange={setTransactionSearch} placeholder="Search transactions" />
                  </label>
                  <label>
                    <span className="sr-only">Worldwide Category</span>
                    <select aria-label="Transaction category" title="Worldwide Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                      <option value="all">All Categories</option>
                      {worldwideTransactionCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Type</span>
                    <select aria-label="Transaction type" title="Type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                      <option value="all">All Types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Account</span>
                    <select aria-label="Transaction account" title="Account" value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
                      <option value="all">All Accounts</option>
                      {accountFilterOptions.map((account) => (
                        <option key={account} value={account}>
                          {account}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Date</span>
                    <select aria-label="Transaction date range" title="Date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
                      <option value="all">All Time</option>
                      <option value="week">This Week</option>
                      <option value="lastweek">Last Week</option>
                      <option value="month">This Month</option>
                      <option value="lastmonth">Last Month</option>
                    </select>
                  </label>
                </div>
              )}
            />
            {transferMessage && <p className="table-validation" role="alert">{transferMessage}</p>}
          </div>
        )}
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
          <p className="empty-copy">Use filters to isolate accounts, income, expenses, transfers, and recent months.</p>
        </article>
      </section>

    </div>
  );
}

function TransactionsConceptPage({ data, onChange }: { data: AppData; onChange: (next: AppData) => void }) {
  const [message, setMessage] = useState("");
  const transactionEndpoints = useMemo(() => transactionEndpointOptions(data), [data]);
  const transactionRows = data.sections.transactions.map(normalizeTransactionRow).filter((row) => !isBlankRow(row.cells));
  const incomeTotal = transactionRows
    .filter((row) => transactionType(row) === "income")
    .reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const expenseTotal = transactionRows
    .filter((row) => transactionType(row) === "expense")
    .reduce((sum, row) => sum + Math.abs(signedTransactionAmount(row)), 0);
  const transferTotal = transactionRows
    .filter((row) => transactionType(row) === "transfer")
    .reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const layoutVariant: TransactionLayoutVariant = data.settings.layoutViews.transactions;

  function saveTransactionRows(input: SpreadsheetRow | SpreadsheetRow[]): boolean {
    const rows = Array.isArray(input) ? input : [input];
    const linkedPayment = rows.find((row) => transactionRows.find((existing) => existing.id === row.id)?.cells.financialEventType === "bill_payment");
    if (linkedPayment) {
      setMessage("Edit this payment from Bills so the bill, transaction, and paying account remain one event.");
      return false;
    }
    const normalizedRows = rows.map(normalizeTransactionRow);
    const savedIds = new Set(normalizedRows.map((row) => row.id));
    const nextRows = [
      ...transactionRows.map((existing) => normalizedRows.find((row) => row.id === existing.id) || existing),
      ...normalizedRows.filter((row) => !transactionRows.some((existing) => existing.id === row.id)),
    ];
    try {
      const next = syncTransactionTransfers(data, nextRows);
      const validation = next.sections.transactions.find((transaction) => savedIds.has(transaction.id) && transaction.cells.transferValidation)?.cells.transferValidation || "";
      if (validation) {
        setMessage(validation);
        return false;
      }
      onChange(next);
      setMessage(rows.length > 1 ? `${rows.length} transactions saved and account balances updated.` : "Transaction saved and account balances updated.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The transaction could not be saved.");
      return false;
    }
  }

  function deleteTransactionRow(rowId: string) {
    const transaction = transactionRows.find((row) => row.id === rowId);
    const description = transaction?.cells.description || transaction?.cells.merchant || "this transaction";
    if (!window.confirm(`Delete ${description}? Linked balances and bill state will be reconciled.`)) return;
    try {
      onChange(deleteTransactionEvent(data, rowId));
      setMessage("Transaction deleted; linked balances and bill state were reconciled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The transaction could not be deleted.");
    }
  }

  function addReceiptRows(rows: SpreadsheetRow[]): boolean {
    try {
      onChange(syncTransactionTransfers(data, [...transactionRows, ...rows]));
      setMessage("");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The receipt could not be added.");
      return false;
    }
  }

  return (
    <div className={`transactions-page module-page transaction-concept-shell ${layoutViewClass(layoutVariant)}`} data-layout-view={layoutVariant}>
      <TransactionHistoryConcepts
        variant={layoutVariant}
        rows={transactionRows}
        accounts={transactionEndpoints}
        incomeTotal={incomeTotal}
        expenseTotal={expenseTotal}
        transferTotal={transferTotal}
        message={message}
        receiptAction={<ReceiptEntry accounts={transactionEndpoints.map(({ value, label }) => ({ value, label }))} onAddReceipt={addReceiptRows} />}
        onSave={saveTransactionRows}
        onDelete={deleteTransactionRow}
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
  onChange,
}: {
  data: AppData;
  financialState: ReturnType<typeof computeFinancialState>;
  updateRows: (section: SectionKey, rows: SpreadsheetRow[]) => void;
  updateSort: (section: SectionKey, sortBy: string) => void;
  resetSection: (section: SectionKey) => void;
  onChange: (data: AppData) => void;
}) {
  const [savingsSearch, setSavingsSearch] = useState("");
  const [vaultType, setVaultType] = useState("all");
  const [transferSourceId, setTransferSourceId] = useState("");
  const [transferDestinationId, setTransferDestinationId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(todayIso);
  const [transferMessage, setTransferMessage] = useState("");
  const savingsRows = data.sections.savings.map(normalizeSavingsRow);
  const filledSavingsRows = savingsRows.filter((row) => !isBlankRow(row.cells));
  const linkedMoneyAccounts = eligibleDepositAccounts(data);
  const transferSources = linkedMoneyAccounts;
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

  function submitSavingsTransfer() {
    try {
      const next = applySavingsTransfer(data, {
        sourceId: transferSourceId,
        destinationId: transferDestinationId,
        amount: toNumber(transferAmount),
        date: transferDate,
      });
      const destination = filledSavingsRows.find((row) => row.id === transferDestinationId);
      onChange(next);
      setTransferAmount("");
      setTransferSourceId("");
      setTransferMessage(`${formatCurrency(toNumber(transferAmount))} moved to ${destination?.cells.name || "Savings"}. Money Snapshot and Transactions are updated.`);
    } catch (error) {
      setTransferMessage(error instanceof Error ? error.message : "The savings transfer could not be completed.");
    }
  }

  return (
    <div className="savings-page module-page">
      <SummaryGrid items={summaryForSection("savings", financialState)} />
      <section className="savings-linked-accounts" aria-labelledby="linked-savings-accounts-title">
        <div>
          <p className="eyebrow">Money Snapshot Accounts</p>
          <h2 id="linked-savings-accounts-title">Linked funding accounts</h2>
          <p>These are the same cards and cash accounts available in Money Snapshot and the Current Week Planner.</p>
        </div>
        <div className="savings-linked-account-list">
          {linkedMoneyAccounts.map((row) => (
            <article key={row.id}>
              <span>{row.cells.label || "Cash account"}</span>
              <strong>{formatCurrency(toNumber(row.cells.amount))}</strong>
              <small>Available for savings transfers</small>
            </article>
          ))}
          {!linkedMoneyAccounts.length && <p className="empty-copy">Add or select an account in Money Snapshot’s Current Week Planner to link it here.</p>}
        </div>
      </section>
      <section className="savings-transfer-panel" aria-labelledby="savings-transfer-title">
        <div>
          <p className="eyebrow">Connected Transfer</p>
          <h2 id="savings-transfer-title">Move money into savings</h2>
          <p>Choose the exact card or cash account. One transfer updates Money Snapshot, Transactions, and the destination savings vault.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); submitSavingsTransfer(); }}>
          <label>
            <span>From card or account</span>
            <select aria-label="Savings transfer source" value={transferSourceId} onChange={(event) => { setTransferSourceId(event.target.value); setTransferMessage(""); }} required>
              <option value="">Select source</option>
              {transferSources.map((row) => <option key={row.id} value={row.id}>{row.cells.label || "Cash account"} · {formatCurrency(toNumber(row.cells.amount))}</option>)}
            </select>
          </label>
          <label>
            <span>To savings vault</span>
            <select aria-label="Savings transfer destination" value={transferDestinationId} onChange={(event) => { setTransferDestinationId(event.target.value); setTransferMessage(""); }} required>
              <option value="">Select vault</option>
              {filledSavingsRows.map((row) => <option key={row.id} value={row.id}>{row.cells.name || "Savings"} · {formatCurrency(toNumber(row.cells.balance))}</option>)}
            </select>
          </label>
          <label>
            <span>Amount</span>
            <input aria-label="Savings transfer amount" inputMode="decimal" value={transferAmount} onChange={(event) => { setTransferAmount(event.target.value); setTransferMessage(""); }} placeholder="$0.00" required />
          </label>
          <label>
            <span>Date</span>
            <input aria-label="Savings transfer date" type="date" value={transferDate} onChange={(event) => { setTransferDate(event.target.value); setTransferMessage(""); }} required />
          </label>
          <button type="submit" disabled={!transferSources.length || !filledSavingsRows.length}>Transfer to Savings</button>
        </form>
        {!transferSources.length && <p className="savings-transfer-help">Add or select a card or cash account in Money Snapshot before transferring.</p>}
        {!filledSavingsRows.length && <p className="savings-transfer-help">Add a savings vault below before transferring.</p>}
        {transferMessage && <p className="savings-transfer-message" role="status">{transferMessage}</p>}
      </section>
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
*/

type ReceiptLineDraft = {
  id: string;
  item: string;
  quantity: string;
  unitPrice: string;
};

function createReceiptLine(): ReceiptLineDraft {
  return {
    id: `receipt-line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    item: "",
    quantity: "1",
    unitPrice: "",
  };
}

function ReceiptEntry({
  accounts,
  onAddReceipt,
}: {
  accounts: Array<{ value: string; label: string }>;
  onAddReceipt: (rows: SpreadsheetRow[]) => boolean;
}) {
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState(todayIso());
  const [account, setAccount] = useState("");
  const [shortfallSource, setShortfallSource] = useState<TransactionShortfallSource>("overdraft");
  const [tax, setTax] = useState("");
  const [lines, setLines] = useState<ReceiptLineDraft[]>(() => [createReceiptLine()]);
  const [message, setMessage] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const receiptTriggerRef = useRef<HTMLButtonElement>(null);
  const receiptDialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!account && accounts.length) setAccount(accounts[0].value);
  }, [account, accounts]);

  useEffect(() => {
    if (!receiptOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : receiptTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const frame = window.requestAnimationFrame(() => {
      receiptDialogRef.current?.querySelector<HTMLElement>("[data-receipt-autofocus]")?.focus();
    });
    function handleDialogKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setReceiptOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(receiptDialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || [])];
      if (!focusable.length) return;
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
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKey);
      previousFocus?.focus();
    };
  }, [receiptOpen]);

  const lineAmounts = calculateReceiptLineAmounts(lines, tax);
  const subtotalCents = lineAmounts.reduce((sum, amounts) => sum + amounts.subtotalCents, 0);
  const taxCents = amountToCents(tax);
  const totalCents = subtotalCents + taxCents;
  const subtotal = centsToAmount(subtotalCents);
  const taxAmount = centsToAmount(taxCents);
  const total = centsToAmount(totalCents);
  const completeLineCount = lines.filter((line, index) => line.item.trim() && lineAmounts[index].subtotalCents > 0).length;

  function updateLine(id: string, field: keyof Omit<ReceiptLineDraft, "id">, value: string) {
    setLines((current) => current.map((line) => line.id === id ? { ...line, [field]: value } : line));
    setMessage("");
  }

  function removeLine(id: string) {
    setLines((current) => current.length === 1 ? [createReceiptLine()] : current.filter((line) => line.id !== id));
    setMessage("");
  }

  function postReceipt() {
    const cleanMerchant = merchant.trim();
    const completeLines = lines.filter((line, index) => line.item.trim() && lineAmounts[index].subtotalCents > 0);
    if (!cleanMerchant) {
      setMessage("Add the store or merchant name first.");
      return;
    }
    if (!date) {
      setMessage("Choose the receipt date.");
      return;
    }
    if (!account) {
      setMessage("Choose the account used for this receipt.");
      return;
    }
    if (!completeLines.length) {
      setMessage("Add at least one item with a price greater than $0.");
      return;
    }
    if (completeLines.length !== lines.length) {
      setMessage("Finish or remove each blank item row before posting the receipt.");
      return;
    }

    const receiptId = `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const receiptNote = `${cleanMerchant} receipt · ${completeLines.length} item${completeLines.length === 1 ? "" : "s"} · Total ${formatCurrency(total)}`;
    const rows: SpreadsheetRow[] = completeLines.map((line, index) => {
      const amounts = lineAmounts[index];
      const draft: SpreadsheetRow = {
        id: `${receiptId}-${line.id}`,
        cells: {
          description: line.item.trim(),
          merchant: cleanMerchant,
          type: "expense",
          category: "",
          quantity: String(Math.max(0, toNumber(line.quantity))),
          unitCost: Math.max(0, toNumber(line.unitPrice)).toFixed(2),
          salesTax: amounts.salesTaxCents ? centsToAmount(amounts.salesTaxCents).toFixed(2) : "",
          amount: (-centsToAmount(amounts.totalCents)).toFixed(2),
          date,
          account,
          transferDestination: "",
          shortfallSource,
          receiptId,
          receiptSubtotal: subtotal.toFixed(2),
          receiptTax: taxAmount ? taxAmount.toFixed(2) : "",
          receiptTotal: total.toFixed(2),
          notes: receiptNote,
        },
      };
      return { ...draft, cells: { ...draft.cells, category: identifyTransactionCategory(draft) } };
    });

    if (!onAddReceipt(rows)) return;
    setMerchant("");
    setTax("");
    setLines([createReceiptLine()]);
    setMessage(`Receipt posted: ${completeLines.length} item${completeLines.length === 1 ? "" : "s"} totaling ${formatCurrency(total)}.`);
  }

  return (
    <>
      <div className="receipt-launcher">
      <button
        ref={receiptTriggerRef}
        type="button"
        className="receipt-launch-button"
        aria-label="Open manual receipt"
        aria-haspopup="dialog"
        aria-expanded={receiptOpen}
        title="Open manual receipt"
        onClick={() => setReceiptOpen(true)}
      >
        <ReceiptText size={19} aria-hidden="true" />
        <span>Manual receipt</span>
      </button>
      </div>

      {receiptOpen && createPortal(
        <div className="receipt-popup-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setReceiptOpen(false);
        }}>
          <section ref={receiptDialogRef} className="receipt-popup-dialog" role="dialog" aria-modal="true" aria-labelledby="receipt-entry-title">
            <header className="receipt-popup-header">
              <div>
                <p className="eyebrow">Manual receipt</p>
                <h2 id="receipt-entry-title">Enter one ticket, item by item</h2>
                <p>Choose the paying account, add the items, and post one accurate receipt.</p>
              </div>
              <button type="button" className="receipt-popup-close" aria-label="Close manual receipt" onClick={() => setReceiptOpen(false)}><X size={18} /></button>
            </header>
            <div id="receipt-entry-content" className="receipt-entry-content">
      <div className="receipt-meta-grid">
        <label>
          <span>Store / merchant</span>
          <input data-receipt-autofocus value={merchant} onChange={(event) => { setMerchant(event.target.value); setMessage(""); }} placeholder="Where did you shop?" />
        </label>
        <label>
          <span>Purchase date</span>
          <input className="calendar-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          <span>Paid from</span>
          <select value={account} onChange={(event) => setAccount(event.target.value)}>
            <option value="">Choose account</option>
            {accounts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>
          <span>If account is short</span>
          <select value={shortfallSource} onChange={(event) => setShortfallSource(event.target.value as TransactionShortfallSource)}>
            <option value="overdraft">Let account go negative</option>
            <option value="borrowed">Borrowed money</option>
            <option value="unreconciled">Unaccounted cash</option>
          </select>
        </label>
      </div>

      <div className="receipt-sheet" role="group" aria-label="Receipt items">
        <div className="receipt-sheet-header" aria-hidden="true">
          <span>Item</span><span>Qty</span><span>Each</span><span>Sales tax</span><span>Item total</span><span />
        </div>
        {lines.map((line, index) => (
          <div className="receipt-line" key={line.id}>
            <label>
              <span className="sr-only">Item {index + 1}</span>
              <input aria-label={`Receipt item ${index + 1}`} value={line.item} onChange={(event) => updateLine(line.id, "item", event.target.value)} placeholder={index === 0 ? "Item name" : "Next item"} />
            </label>
            <label>
              <span className="sr-only">Quantity for item {index + 1}</span>
              <input aria-label={`Quantity for receipt item ${index + 1}`} type="number" min="0.01" step="1" value={line.quantity} onChange={(event) => updateLine(line.id, "quantity", event.target.value)} />
            </label>
            <label className="receipt-money-input">
              <span aria-hidden="true">$</span>
              <input aria-label={`Unit price for receipt item ${index + 1}`} inputMode="decimal" value={line.unitPrice} onChange={(event) => updateLine(line.id, "unitPrice", event.target.value)} placeholder="0.00" />
            </label>
            <output aria-label={`Sales tax for receipt item ${index + 1}`} className="receipt-line-tax">
              {lineAmounts[index].salesTaxCents ? formatCurrency(centsToAmount(lineAmounts[index].salesTaxCents)) : ""}
            </output>
            <output aria-label={`Item total for receipt item ${index + 1}`}>{formatCurrency(centsToAmount(lineAmounts[index].totalCents))}</output>
            <button type="button" className="receipt-remove-line" aria-label={`Remove receipt item ${index + 1}`} onClick={() => removeLine(line.id)}><Trash2 size={16} /></button>
          </div>
        ))}
        <button type="button" className="receipt-add-line" onClick={() => setLines((current) => [...current, createReceiptLine()])}><Plus size={16} /> Add another item</button>
      </div>

      <div className="receipt-footer">
        <div className="receipt-help">
          <strong>{completeLineCount} of {lines.length} item rows ready</strong>
          <span>Each item becomes its own row in the Transactions spreadsheet.</span>
        </div>
        <div className="receipt-totals">
          <span><small>Subtotal</small><strong>{formatCurrency(subtotal)}</strong></span>
          <label><small>Tax</small><span className="receipt-tax-input"><b>$</b><input aria-label="Receipt tax" inputMode="decimal" value={tax} onChange={(event) => { setTax(event.target.value); setMessage(""); }} placeholder="0.00" /></span></label>
          <span className="receipt-grand-total"><small>Total</small><strong>{formatCurrency(total)}</strong></span>
        </div>
      </div>

      <div className="receipt-actions">
        <p className="receipt-message" role="status" aria-live="polite">{message}</p>
        <button type="button" className="receipt-post-button" onClick={postReceipt}><ReceiptText size={17} /> Post receipt to Transactions</button>
      </div>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}

/* Legacy payment helper retained with the workspace above.
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
  const inventoryBudget = Math.max(0, props.financialState.spendableCash);
  const rankedInventory = rankInventoryRows(filledInventoryRows, inventoryBudget);
  const nextInventoryItem = rankedInventory[0];
  const plannedInventoryCost = rankedInventory.reduce((sum, item) => sum + item.plannedCost, 0);
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
    <div className={`inventory-page module-page ${layoutViewClass(props.data.settings.layoutViews.inventory)}`} data-layout-view={props.data.settings.layoutViews.inventory}>
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
      <section className="inventory-decision-order panel" aria-label="Decision Engine inventory order">
        <div className="inventory-decision-primary">
          <span className="inventory-decision-icon" aria-hidden="true"><BrainCircuit size={22} /></span>
          <div>
            <p className="eyebrow">Decision Engine Inventory Order</p>
            <h2>{nextInventoryItem ? nextInventoryItem.item : "Inventory is stocked"}</h2>
            <p className="empty-copy">
              {nextInventoryItem ? nextInventoryItem.reason : "No inventory item is currently below its minimum."}
            </p>
            <small className="inventory-route-budget">
              {formatCurrency(inventoryBudget)} available across non-savings accounts · {formatCurrency(plannedInventoryCost)} routed
            </small>
          </div>
        </div>
        {nextInventoryItem && (
          <>
            <div className="inventory-decision-metrics">
              <span><small>Alert</small><strong>{nextInventoryItem.alert}</strong></span>
              <span><small>Buy now</small><strong>{nextInventoryItem.plannedQty} of {nextInventoryItem.shortage}</strong></span>
              <span><small>Score</small><strong>{nextInventoryItem.score}/100</strong></span>
            </div>
            <ol className="inventory-decision-list" aria-label="Next inventory items in order">
              {rankedInventory.slice(0, 4).map((item, index) => (
                <li key={item.row.id}>
                  <span>{index + 1}</span>
                  <strong>{item.item}</strong>
                  <em>{item.plannedQty > 0 ? `Buy ${item.plannedQty} · ${formatCurrency(item.plannedCost)}` : `Unfunded · ${formatCurrency(item.refillCost)}`}</em>
                </li>
              ))}
            </ol>
          </>
        )}
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

function MissionsPage({ decisionState, activity }: { decisionState: ReturnType<typeof computeDecisionEngine>; activity: AppData["activity"] }) {
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
            <a key={mission.id} href={mission.href} className={`mission-row ${mission.completed ? "complete" : "active"}`}>
              <strong>{mission.title}</strong>
              <span>{mission.detail}</span>
              <small>{mission.completed ? "Checked" : mission.target}</small>
              <i aria-hidden="true"><b style={{ width: `${Math.max(0, Math.min(100, mission.progress))}%` }} /></i>
              <em>{mission.priority}</em>
            </a>
          ))}
        </div>
      </section>
      <section className="panel mission-activity-panel">
        <p className="eyebrow">Activity</p>
        <h2>Mission updates</h2>
        <div className="mission-activity-list">
          {activity.slice(0, 8).map((event) => (
            <article key={event.id}>
              <strong>{event.title}</strong>
              <span>{event.detail}</span>
              <small>{formatDateMDY(event.createdAt.slice(0, 10))}</small>
            </article>
          ))}
          {!activity.length && <p className="empty-copy">Completed missions will be recorded here.</p>}
        </div>
      </section>
    </div>
  );
}

function summaryForSection(section: SectionKey, financialState: ReturnType<typeof computeFinancialState>) {
  return {
    money: [
      { label: "Total Cash", value: financialState.totalCash },
      { label: "Cash", value: financialState.cashOnHand },
      { label: "Spendable / Safe", value: Math.min(financialState.spendableCash, financialState.safeToSpend) },
      { label: "Week Spending", value: -Math.abs(financialState.weeklySpending), tone: "bad" as const },
      { label: "Week Net Impact", value: financialState.transactionWeekNet, tone: financialState.transactionWeekNet < 0 ? "bad" as const : "good" as const },
      { label: "Protected Savings", value: financialState.protectedSavings },
      { label: "Available Savings", value: financialState.availableSavings },
      { label: "Account Deficit", value: financialState.accountDeficit, tone: "bad" as const },
      { label: "Weekly Income", value: financialState.weeklyIncome },
      { label: "Monthly Income", value: financialState.monthlyIncome },
      { label: "Received Income", value: financialState.receivedIncome },
      { label: "Borrowed Money", value: financialState.borrowedMoney, tone: "warn" as const },
      { label: "Unaccounted Cash", value: financialState.unreconciledCash, tone: "warn" as const },
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
      { label: "Shortfall Spending", value: financialState.shortfallSpending, tone: "warn" as const },
      { label: "Account Deficit", value: financialState.accountDeficit, tone: "bad" as const },
      { label: "Unaccounted Cash", value: financialState.unreconciledCash, tone: "warn" as const },
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
      paymentAccount: row.cells.paymentAccount || "",
      paidDate: row.cells.paidDate || "",
      recurring: row.cells.recurring || row.cells.is_recurring || "No",
      autopay: row.cells.autopay || row.cells.is_autopay || "",
      priority: row.cells.priority || "",
      notes: row.cells.notes || "",
    },
  };
}

function normalizeTransactionRow(row: SpreadsheetRow): SpreadsheetRow {
  const cells = { ...row.cells };
  delete cells.recurring;
  delete cells.is_recurring;
  const normalizedRow = {
    ...row,
    cells: {
      ...cells,
      description: cells.description || "",
      merchant: cells.merchant || (row.id.startsWith("vitascan-") ? cells.description : ""),
      type: cells.type || "",
      category: cells.category || "",
      quantity: cells.quantity || "",
      unitCost: cells.unitCost || "",
      salesTax: cells.salesTax || "",
      amount: cells.amount || "",
      date: cells.date || "",
      account: cells.account || "",
      transferDestination: cells.transferDestination || "",
      shortfallSource: cells.shortfallSource || "",
      notes: cells.notes || "",
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
  return [row.cells.description, row.cells.merchant, row.cells.account, row.cells.transferDestination, row.cells.notes, row.cells.type, row.cells.amount, row.cells.category]
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
