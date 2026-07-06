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
  { path: "/", label: "Dashboard" },
  { path: "/money", label: "Money" },
  { path: "/bills", label: "Bills" },
  { path: "/inventory", label: "Inventory" },
  { path: "/savings", label: "Savings" },
  { path: "/debts", label: "Debts" },
  { path: "/settings", label: "Settings" },
];

function App() {
  const path = normalizePath(window.location.pathname);

  if (path === "/") {
    return <Dashboard />;
  }

  return (
    <AppShell>
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

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav className="mb-8 flex flex-wrap gap-2">
          {routes.map((route) => (
            <a
              key={route.path}
              href={route.path}
              className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500/60 hover:text-white"
            >
              {route.label}
            </a>
          ))}
        </nav>
        {children}
      </div>
    </div>
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
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Operational status for the clean VCC-OS dashboard build."
      />
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-2xl backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-bold text-white">Application Settings</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatusItem label="Mode" value="Production dashboard" />
          <StatusItem label="Routes" value="Restored" />
          <StatusItem label="Decision Engine" value={sampleTodaysMission.recommendedMove} />
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
