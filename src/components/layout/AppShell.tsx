import {
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  ChevronDown,
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
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData, UserSettings } from "../../lib/types/app";

const nav = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/money", label: "Money", icon: Wallet },
  { path: "/income", label: "Income", icon: CircleDollarSign },
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
  data,
}: {
  children: ReactNode;
  currentPath: string;
  settings: UserSettings;
  data: AppData;
}) {
  const [brandOpen, setBrandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const brandRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => buildSearchResults(data, query), [data, query]);

  useEffect(() => {
    function closeOnAway(event: MouseEvent) {
      if (!brandRef.current?.contains(event.target as Node)) setBrandOpen(false);
    }
    document.addEventListener("mousedown", closeOnAway);
    return () => document.removeEventListener("mousedown", closeOnAway);
  }, []);

  return (
    <div className={`app-shell theme-${settings.theme} accent-${settings.accent} density-${settings.density}`}>
      <div className="sensor-strip" aria-hidden="true" />
      <aside className="sidebar">
        <div className="brand-wrap" ref={brandRef}>
          <button className="brand" type="button" onClick={() => setBrandOpen((open) => !open)} aria-expanded={brandOpen}>
            <span>V</span>
            <div>
              <strong>VCC OS</strong>
              <small>{settings.localMode ? "Local Mode" : settings.profileLabel}</small>
            </div>
            <ChevronDown size={16} />
          </button>
          {brandOpen && (
            <div className="brand-menu">
              <a href="/" onClick={() => setBrandOpen(false)}>Dashboard Home</a>
              <a href="/settings" onClick={() => setBrandOpen(false)}>Account Settings</a>
              <a href="/missions" onClick={() => setBrandOpen(false)}>Mission Center</a>
            </div>
          )}
        </div>
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
            <p className="eyebrow">{settings.localMode ? "VCC Local Mode" : settings.profileLabel}</p>
            <h1>{titleForPath(currentPath, settings)}</h1>
          </div>
          <div className="top-actions">
            <div className="search-shell">
              <label className="search-pill">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search VCC OS" />
              </label>
              {query.trim() && (
                <div className="search-results">
                  {results.length > 0 ? (
                    results.map((result) => (
                      <a key={`${result.href}-${result.label}`} href={result.href}>
                        <strong>{result.label}</strong>
                        <span>{result.detail}</span>
                      </a>
                    ))
                  ) : (
                    <span>No matches found</span>
                  )}
                </div>
              )}
            </div>
            <button className="icon-pill" aria-label="Notifications">
              <Bell size={17} />
              {settings.notificationsEnabled && <span>3</span>}
            </button>
            <a className="profile-pill" href="/settings">
              <UserCircle size={18} />
              <span>{settings.accountName || "Account Profile"}</span>
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

function titleForPath(path: string, settings: UserSettings) {
  const normalized = normalize(path);
  const label = nav.find((item) => item.path === normalized)?.label || "Dashboard";
  return label === "Dashboard" ? `Good evening, ${settings.accountName || "Alex"}` : label;
}

function buildSearchResults(data: AppData, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const results: Array<{ label: string; detail: string; href: string }> = [];
  const sectionToPath: Record<string, string> = {
    money: "/money",
    bills: "/bills",
    income: "/income",
    transactions: "/transactions",
    debt: "/debt",
    savings: "/savings",
    inventory: "/inventory",
    goals: "/goals",
  };

  for (const item of nav) {
    if (item.label.toLowerCase().includes(normalized)) results.push({ label: item.label, detail: "Navigation", href: item.path });
  }

  for (const [section, rows] of Object.entries(data.sections)) {
    rows.slice(0, 40).forEach((row) => {
      const values = Object.values(row.cells).filter(Boolean).join(" ");
      if (values.toLowerCase().includes(normalized)) {
        results.push({
          label: values.split(" ").slice(0, 4).join(" ") || section,
          detail: section,
          href: sectionToPath[section] || "/",
        });
      }
    });
  }

  return results.slice(0, 8);
}
