import {
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Home,
  Landmark,
  MoreHorizontal,
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
  onSettingsChange,
}: {
  children: ReactNode;
  currentPath: string;
  settings: UserSettings;
  data: AppData;
  onSettingsChange: (settings: UserSettings) => void;
}) {
  const [brandOpen, setBrandOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [query, setQuery] = useState("");
  const brandRef = useRef<HTMLDivElement>(null);
  const mobileMoreRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => buildSearchResults(data, query), [data, query]);

  useEffect(() => {
    function closeOnAway(event: MouseEvent) {
      if (!brandRef.current?.contains(event.target as Node)) setBrandOpen(false);
      if (!mobileMoreRef.current?.contains(event.target as Node)) setMobileMoreOpen(false);
    }
    document.addEventListener("mousedown", closeOnAway);
    return () => document.removeEventListener("mousedown", closeOnAway);
  }, []);

  return (
    <div className={`app-shell theme-${settings.theme} accent-${settings.accent} density-${settings.density} ${settings.sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
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
        <a className="sidebar-profile" href="/settings" aria-label={`Open ${settings.accountName || "account"} profile`}>
          <UserCircle size={21} />
          <span>
            <strong>{settings.accountName || "Account"}</strong>
            <small>{settings.profileLabel}</small>
          </span>
        </a>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = normalize(currentPath) === item.path || (item.path === "/debt" && currentPath === "/debts");
            return (
              <a key={item.path} href={item.path} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                <Icon size={18} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <button
          className="sidebar-collapse"
          type="button"
          aria-label={settings.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={settings.sidebarCollapsed}
          onClick={() => onSettingsChange({ ...settings, sidebarCollapsed: !settings.sidebarCollapsed })}
        >
          {settings.sidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          <span>Collapse</span>
        </button>
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
            <a className="profile-pill top-profile" href="/settings">
              <UserCircle size={18} />
              <span>{settings.accountName || "Account Profile"}</span>
            </a>
          </div>
        </header>
        {children}
      </main>

      <nav className="mobile-nav" aria-label="Primary mobile navigation">
        {[nav[0], nav[1], nav[4], nav[7]].map((item) => {
          const Icon = item.icon;
          const active = normalize(currentPath) === item.path || (item.path === "/debt" && currentPath === "/debts");
          return (
            <a key={item.path} href={item.path} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <Icon size={18} />
              <span>{item.label}</span>
            </a>
          );
        })}
        <div className="mobile-more-wrap" ref={mobileMoreRef}>
          <button
            type="button"
            className={mobileMoreOpen || isMorePath(currentPath) ? "active" : ""}
            aria-expanded={mobileMoreOpen}
            aria-controls="mobile-more-menu"
            onClick={() => setMobileMoreOpen((open) => !open)}
          >
            <MoreHorizontal size={19} />
            <span>More</span>
          </button>
          {mobileMoreOpen && (
            <div className="mobile-more-menu" id="mobile-more-menu">
              {nav.filter((item) => !["/", "/money", "/transactions", "/inventory"].includes(item.path)).map((item) => {
                const Icon = item.icon;
                const active = normalize(currentPath) === item.path;
                return (
                  <a key={item.path} href={item.path} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

function isMorePath(path: string) {
  return !["/", "/money", "/transactions", "/inventory"].includes(normalize(path));
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
