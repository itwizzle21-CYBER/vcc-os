import { ChevronDown, CreditCard, Home, Menu, Package, PiggyBank, ReceiptText, Settings, Wallet, X } from "lucide-react";
import { useState } from "react";
import BillsCard from "./BillsCard";
import BuyNextCard from "./BuyNextCard";
import Dashboard from "./Dashboard";
import DebtCard from "./DebtCard";
import GoalProgressCard from "./GoalProgressCard";
import MoneySnapshotCard from "./MoneySnapshotCard";
import SavingsCard from "./SavingsCard";
import {
  sampleBills,
  sampleBuyNext,
  sampleGoalProgress,
  sampleMoneySnapshot,
  sampleTodaysMission,
} from "./data";

const routes = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/money", label: "Money", icon: Wallet },
  { path: "/bills", label: "Bills", icon: ReceiptText },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/debts", label: "Debts", icon: CreditCard },
  { path: "/savings", label: "Savings", icon: PiggyBank },
  { path: "/settings", label: "Settings", icon: Settings },
];

function App() {
  const path = normalizePath(window.location.pathname);

  return (
    <AppShell currentPath={path}>
      {path === "/" && <Dashboard />}
      {path === "/money" && <MoneyPage />}
      {path === "/bills" && <BillsPage />}
      {path === "/inventory" && <InventoryPage />}
      {path === "/savings" && <SavingsPage />}
      {(path === "/debts" || path === "/debt") && <DebtsPage />}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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

          <a className="flex items-center gap-3 md:hidden" href="/">
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
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-700/60 bg-slate-900/70 text-slate-200 md:hidden"
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

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </div>
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
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border border-cyan-400/30 bg-cyan-500/15 text-cyan-200"
          : "border border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-900/70 hover:text-white"
      } ${compact ? "px-2 lg:px-3" : ""}`}
    >
      <Icon className="h-4 w-4" />
      <span>{route.label}</span>
    </a>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-lg text-slate-400">{subtitle}</p>
    </div>
  );
}

function MoneyPage() {
  return (
    <>
      <PageHeader
        title="Money"
        subtitle="Current assets, liabilities, monthly flow, and cash after near-term bills."
      />
      <MoneySnapshotCard data={sampleMoneySnapshot} />
    </>
  );
}

function BillsPage() {
  return (
    <>
      <PageHeader
        title="Bills"
        subtitle="Decision Engine bill priorities and the next obligations that need attention."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <BillsCard />
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl backdrop-blur-xl">
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
                  <p className="font-bold text-cyan-400">${bill.amount.toFixed(2)}</p>
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
  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Restock priorities from the active Buy Next inventory workflow."
      />
      <BuyNextCard data={sampleBuyNext} />
    </>
  );
}

function SavingsPage() {
  return (
    <>
      <PageHeader
        title="Savings"
        subtitle="Savings goals, contribution targets, and progress toward core life milestones."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <SavingsCard />
        <GoalProgressCard data={sampleGoalProgress} />
      </div>
    </>
  );
}

function DebtsPage() {
  return (
    <>
      <PageHeader
        title="Debts"
        subtitle="Debt snapshot and payoff focus from the active financial command center."
      />
      <DebtCard />
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
      value: "Cleanup recovery",
      detail: "Branch contains the repository cleanup plus restored route shell.",
    },
    {
      label: "Login",
      value: "Planned",
      detail: "No active authentication flow is enabled in this recovery build.",
    },
    {
      label: "Theme",
      value: "Command dark",
      detail: "Keeps the newer redesign skin while restoring VCC navigation and route coverage.",
    },
    {
      label: "Backup / Restore",
      value: "Planned",
      detail: "Last-good Settings supported exports; data controls should return with persistent pages.",
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
      <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 shadow-2xl backdrop-blur-xl">
        <h2 className="mb-2 text-xl font-bold text-white">Recovery Notes</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatusItem label="Routes" value="Dashboard, Money, Bills, Inventory, Debts, Savings, Settings" />
          <StatusItem label="Dashboard" value="Read-only intelligence surface" />
          <StatusItem label="Dedicated pages" value="Card clicks route into focused work areas" />
        </div>
      </div>
    </>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-4">
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
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
