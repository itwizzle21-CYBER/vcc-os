import {
  Activity,
  ChevronDown,
  CreditCard,
  Home,
  Menu,
  Package,
  PiggyBank,
  ReceiptText,
  Settings,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import BillsCard from "./BillsCard";
import BuyNextCard from "./BuyNextCard";
import Dashboard from "./Dashboard";
import DebtCard from "./DebtCard";
import GoalProgressCard from "./GoalProgressCard";
import MoneySnapshotCard from "./MoneySnapshotCard";
import SavingsCard from "./SavingsCard";
import TransactionsPage from "./TransactionsPage";
import {
  sampleBills,
  sampleBuyNext,
  sampleGoalProgress,
  sampleTodaysMission,
} from "./data";
import { formatCurrency } from "./decisionEngine";
import {
  deriveFinancialState,
  initialFinancialState,
  updateMoneySource,
  type DerivedFinancialState,
  type FinancialState,
} from "./transactionEngine";

const routes = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/money", label: "Money", icon: Wallet },
  { path: "/transactions", label: "Transactions", icon: Activity },
  { path: "/bills", label: "Bills", icon: ReceiptText },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/debts", label: "Debts", icon: CreditCard },
  { path: "/savings", label: "Savings", icon: PiggyBank },
  { path: "/activity", label: "Activity", icon: Activity },
  { path: "/settings", label: "Settings", icon: Settings },
];

function App() {
  const path = normalizePath(window.location.pathname);
  const [financialState, setFinancialState] = useState(initialFinancialState);
  const financials = useMemo(() => deriveFinancialState(financialState, sampleBills), [financialState]);

  return (
    <AppShell currentPath={path}>
      {path === "/" && <Dashboard financials={financials} />}
      {path === "/money" && (
        <MoneyPage
          financialState={financialState}
          financials={financials}
          onUpdateMoney={(updates) => setFinancialState((state) => updateMoneySource(state, updates))}
        />
      )}
      {path === "/transactions" && <TransactionsPage transactions={financials.transactions} />}
      {path === "/bills" && <BillsPage financials={financials} />}
      {path === "/inventory" && <InventoryPage />}
      {path === "/savings" && <SavingsPage financials={financials} />}
      {(path === "/debts" || path === "/debt") && <DebtsPage />}
      {path === "/activity" && <ActivityPage financials={financials} />}
      {path === "/settings" && <SettingsPage />}
      {!isKnownRoute(path) && <NotFoundPage />}
    </AppShell>
  );
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

function isKnownRoute(path: string) {
  return routes.some((route) => route.path === path) || path === "/debt";
}

function AppShell({ children, currentPath }: { children: React.ReactNode; currentPath: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activePath = currentPath === "/debt" ? "/debts" : currentPath;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <details className="group relative hidden md:block">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-cyan-500/20 bg-slate-900/70 px-3 py-2 text-white shadow-xl transition hover:border-cyan-400/40">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500 text-sm font-black text-slate-950">
                V
              </span>
              <span>
                <span className="block text-sm font-black tracking-[0.18em]">VCC_OS</span>
                <span className="block text-xs text-slate-400">Command Center</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-700/70 bg-slate-950 p-3 shadow-2xl">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Navigation
              </p>
              <div className="grid gap-1">
                {routes.map((route) => (
                  <NavLink key={route.path} route={route} active={activePath === route.path} />
                ))}
              </div>
            </div>
          </details>

          <a className="flex min-h-11 items-center gap-3 md:hidden" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500 text-sm font-black text-slate-950">
              V
            </span>
            <span className="text-sm font-black tracking-[0.18em] text-white">VCC_OS</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {routes.map((route) => (
              <NavLink key={route.path} route={route} active={activePath === route.path} compact />
            ))}
          </nav>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-lg border border-slate-700/60 bg-slate-900/70 text-slate-200 md:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-slate-800/70 bg-slate-950 px-4 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="grid gap-2">
              {routes.map((route) => (
                <NavLink key={route.path} route={route} active={activePath === route.path} />
              ))}
            </div>
          </nav>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">{children}</div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800/80 bg-slate-950/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl backdrop-blur-xl md:hidden"
        aria-label="Sticky mobile navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {routes.slice(0, 5).map((route) => (
            <MobileNavLink key={route.path} route={route} active={activePath === route.path} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  route,
  active,
  compact,
}: {
  route: (typeof routes)[number];
  active: boolean;
  compact?: boolean;
}) {
  const Icon = route.icon;

  return (
    <a
      href={route.path}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border border-cyan-400/30 bg-cyan-500/15 text-cyan-200"
          : "border border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-900/70 hover:text-white"
      } ${compact ? "px-2 lg:px-3" : ""}`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{route.label}</span>
    </a>
  );
}

function MobileNavLink({ route, active }: { route: (typeof routes)[number]; active: boolean }) {
  const Icon = route.icon;

  return (
    <a
      href={route.path}
      aria-current={active ? "page" : undefined}
      className={`grid min-h-14 place-items-center rounded-xl text-[11px] font-semibold ${
        active ? "bg-cyan-500/15 text-cyan-200" : "text-slate-400"
      }`}
    >
      <Icon className="mb-1 h-5 w-5" />
      <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-1">{route.label}</span>
    </a>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5 sm:mb-8">
      <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg">{subtitle}</p>
    </div>
  );
}

function MoneyPage({
  financialState,
  financials,
  onUpdateMoney,
}: {
  financialState: FinancialState;
  financials: DerivedFinancialState;
  onUpdateMoney: Parameters<typeof updateMoneySource>[1] extends infer Updates
    ? (updates: Updates) => void
    : never;
}) {
  const [form, setForm] = useState({
    operatingCash: financials.operatingCash,
    protectedSavings: financials.protectedSavings,
    monthlyIncome: financials.monthlyIncome,
    borrowedMoney: financialState.accounts.find((account) => account.name === "Borrowed Money / Advances")?.balance || 0,
    fees: Math.abs(financialState.transactions.find((transaction) => transaction.sourceKey === "fees")?.amount || 0),
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: Number(value) || 0 }));
  }

  return (
    <>
      <PageHeader
        title="Money"
        subtitle="Current assets, liabilities, monthly flow, and cash after near-term bills."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <MoneySnapshotCard data={financials.moneySnapshot} />
        <form
          className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 shadow-2xl backdrop-blur-xl"
          onSubmit={(event) => {
            event.preventDefault();
            onUpdateMoney(form);
          }}
        >
          <h2 className="mb-4 text-xl font-bold text-white">Edit Money Sources</h2>
          <div className="space-y-4">
            <MoneyInput label="Operating Cash" value={form.operatingCash} onChange={(value) => updateField("operatingCash", value)} />
            <MoneyInput label="Protected Savings" value={form.protectedSavings} onChange={(value) => updateField("protectedSavings", value)} />
            <MoneyInput label="Monthly Income" value={form.monthlyIncome} onChange={(value) => updateField("monthlyIncome", value)} />
            <MoneyInput label="Borrowed Money / Advances" value={form.borrowedMoney} onChange={(value) => updateField("borrowedMoney", value)} />
            <MoneyInput label="Fees" value={form.fees} onChange={(value) => updateField("fees", value)} />
          </div>
          <button className="mt-5 min-h-11 w-full rounded-lg border border-cyan-500/30 bg-cyan-500/15 px-4 text-sm font-bold text-cyan-200">
            Save and Sync
          </button>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Income, protected savings, advances, and fees update Transactions from this one action.
          </p>
        </form>
      </div>
    </>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-300">{label}</span>
      <input
        value={value}
        type="number"
        min="0"
        step="0.01"
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 text-base text-white outline-none focus:border-cyan-400/60"
      />
    </label>
  );
}

function BillsPage({ financials }: { financials: DerivedFinancialState }) {
  return (
    <>
      <PageHeader
        title="Bills"
        subtitle="Decision Engine bill priorities and the next obligations that need attention."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <BillsCard data={financials.billsCard} />
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Tracked Bills</h2>
          <div className="space-y-3">
            {sampleBills.map((bill) => (
              <div
                key={bill.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-700/50 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-white">{bill.name}</p>
                  <p className="text-sm text-slate-400">{bill.category}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-bold text-cyan-400">{formatCurrency(bill.amount)}</p>
                  <p className="text-sm text-slate-400">{bill.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function InventoryPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [items, setItems] = useState(sampleBuyNext);
  const [itemName, setItemName] = useState("");

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Restock priorities from the active Buy Next inventory workflow."
      />
      <div className="mb-4 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4">
        <button
          type="button"
          className="min-h-11 w-full rounded-lg border border-cyan-500/30 bg-cyan-500/15 px-4 text-sm font-bold text-cyan-200"
          onClick={() => setShowAdd((open) => !open)}
        >
          {showAdd ? "Close Add Item" : "Add Item"}
        </button>
        {showAdd && (
          <form
            className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              if (!itemName.trim()) return;
              setItems((current) => [
                {
                  id: Date.now(),
                  name: itemName.trim(),
                  category: "Inventory",
                  status: "Low",
                  lastPurchased: "New",
                  estimatedCost: "$0.00",
                  priority: current.length + 1,
                },
                ...current,
              ]);
              setItemName("");
              setShowAdd(false);
            }}
          >
            <input
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              className="min-h-11 rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 text-base text-white outline-none focus:border-cyan-400/60"
              placeholder="Item name"
            />
            <button className="min-h-11 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 text-sm font-bold text-emerald-200">
              Save
            </button>
          </form>
        )}
      </div>
      <BuyNextCard data={items} />
    </>
  );
}

function SavingsPage({ financials }: { financials: DerivedFinancialState }) {
  return (
    <>
      <PageHeader
        title="Savings"
        subtitle="Savings goals, contribution targets, and progress toward core life milestones."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <SavingsCard data={financials.savingsCard} />
        <GoalProgressCard data={sampleGoalProgress} />
      </div>
    </>
  );
}

function DebtsPage() {
  const history = [
    { label: "Minimum payment posted", amount: "$450.00", date: "2026-07-06" },
    { label: "Extra payoff planned", amount: "$150.00", date: "2026-07-12" },
    { label: "Interest review", amount: "10.3% avg", date: "2026-07-15" },
  ];

  return (
    <>
      <PageHeader
        title="Debts"
        subtitle="Debt snapshot and payoff focus from the active financial command center."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <DebtCard />
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Payment History</h2>
          <div className="space-y-3">
            {history.map((row) => (
              <div key={row.label} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{row.label}</p>
                    <p className="mt-1 text-sm text-slate-400">{row.date}</p>
                  </div>
                  <p className="font-bold text-red-300">{row.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ActivityPage({ financials }: { financials: DerivedFinancialState }) {
  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="Adds, edits, transfers, bill payments, debt payments, and savings transfers without duplicate history."
      />
      <div className="space-y-3">
        {financials.activity.map((event) => (
          <div key={event.id} className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="font-bold text-white">{event.title}</p>
              <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs font-bold text-cyan-200">
                {event.action}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">{event.detail}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function SettingsPage() {
  const settingsCards = [
    {
      label: "Storage",
      value: "Local-ready",
      detail: "Browser-local data can be reintroduced without changing the dashboard contract.",
    },
    {
      label: "Version",
      value: "Sprint 3",
      detail: "Mobile polish plus shared Money Snapshot and Transactions engine.",
    },
    {
      label: "Login",
      value: "Planned",
      detail: "No active authentication flow is enabled in this recovery build.",
    },
    {
      label: "Theme",
      value: "Command dark",
      detail: "Desktop visual structure is preserved while mobile controls were tightened.",
    },
    {
      label: "Backup / Restore",
      value: "Planned",
      detail: "Dedicated data controls can return with persistence in a future sprint.",
    },
    {
      label: "Diagnostics",
      value: "Healthy",
      detail: `Decision Engine move: ${sampleTodaysMission.recommendedMove}.`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Control center for app status, storage, account readiness, diagnostics, and future recovery tools."
      />
      <h2 className="mb-4 text-2xl font-bold text-white">Application Settings</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingsCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 shadow-2xl backdrop-blur-xl"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              {card.value}
            </p>
            <h2 className="mb-2 text-xl font-bold text-white">{card.label}</h2>
            <p className="text-sm leading-relaxed text-slate-400">{card.detail}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page Not Found" subtitle="That VCC-OS route is not available." />
      <a className="font-semibold text-cyan-400 hover:text-cyan-300" href="/">
        Return to dashboard
      </a>
    </>
  );
}

export default App;
