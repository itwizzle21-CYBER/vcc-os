import {
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  CreditCard,
  Home,
  Landmark,
  ReceiptText,
  Search,
  Settings,
  Target,
  UserCircle,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import type { UserSettings } from "../../lib/types/app";

const nav = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/money", label: "Money", icon: Wallet },
  { path: "/bills", label: "Bills", icon: ReceiptText },
  { path: "/transactions", label: "Transactions", icon: BarChart3 },
  { path: "/debt", label: "Debt", icon: CreditCard },
  { path: "/savings", label: "Savings", icon: Landmark },
  { path: "/inventory", label: "Inventory", icon: Boxes },
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/missions", label: "Missions", icon: CheckCircle2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({
  children,
  currentPath,
  settings,
}: {
  children: ReactNode;
  currentPath: string;
  settings: UserSettings;
}) {
  return (
    <div className={`app-shell theme-${settings.theme} accent-${settings.accent} density-${settings.density}`}>
      <aside className="sidebar">
        <a className="brand" href="/">
          <span>V</span>
          <div>
            <strong>VCC OS</strong>
            <small>Finance Command</small>
          </div>
        </a>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = normalize(currentPath) === item.path || (item.path === "/debt" && currentPath === "/debts");
            return (
              <a key={item.path} href={item.path} className={active ? "active" : ""}>
                <Icon size={18} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{currentPath === "/" ? "VCC Local Mode" : "Mission Control"}</p>
            <h1>{titleForPath(currentPath)}</h1>
          </div>
          <div className="top-actions">
            <div className="search-pill">
              <Search size={16} />
              <span>Search finance workspace</span>
            </div>
            <button className="icon-pill" aria-label="Notifications">
              <Bell size={17} />
              <span>3</span>
            </button>
            <a className="profile-pill" href="/settings">
              <UserCircle size={18} />
              <span>Account Profile</span>
            </a>
          </div>
        </header>
        {children}
      </main>

      <nav className="mobile-nav">
        {nav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = normalize(currentPath) === item.path || (item.path === "/debt" && currentPath === "/debts");
          return (
            <a key={item.path} href={item.path} className={active ? "active" : ""}>
              <Icon size={18} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}

function normalize(path: string) {
  return path === "/debts" ? "/debt" : path;
}

function titleForPath(path: string) {
  const normalized = normalize(path);
  const label = nav.find((item) => item.path === normalized)?.label || "Dashboard";
  return label === "Dashboard" ? "Good evening, Alex" : label;
}
