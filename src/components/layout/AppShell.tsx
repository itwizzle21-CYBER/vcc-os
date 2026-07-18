import {
  BarChart3,
  Bell,
  Boxes,
  Car,
  CheckCircle2,
  CircleDollarSign,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  FileBarChart,
  Home,
  Landmark,
  Menu,
  X,
  ReceiptText,
  ScanLine,
  Search,
  Settings,
  Target,
  UserCircle,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { AppData, UserSettings } from "../../lib/types/app";

const nav = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/money", label: "Money Snapshot", icon: Wallet },
  { path: "/bills", label: "Bills", icon: ReceiptText },
  { path: "/inventory", label: "Inventory", icon: Boxes },
  { path: "/transactions", label: "Transactions", icon: BarChart3 },
  { path: "/vitascan", label: "VitaScan", icon: ScanLine },
  { path: "/savings", label: "Savings", icon: Landmark },
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/reports", label: "Reports", icon: FileBarChart },
  { path: "/income", label: "Income", icon: CircleDollarSign },
  { path: "/debt", label: "Debt", icon: CreditCard },
  { path: "/car-payment", label: "Car Payment", icon: Car },
  { path: "/missions", label: "Missions", icon: CheckCircle2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

const primaryPaths = ["/", "/money", "/bills", "/inventory", "/transactions", "/vitascan", "/savings", "/goals", "/reports", "/settings"];
const dashboardNav = nav.filter((item) => primaryPaths.includes(item.path));
const launcherHoldDelay = 240;

export default function AppShell({
  children,
  currentPath,
  settings,
  wallpaperPreview,
  data,
  onSettingsChange,
}: {
  children: ReactNode;
  currentPath: string;
  settings: UserSettings;
  wallpaperPreview?: Pick<UserSettings, "wallpaper" | "customWallpaper" | "backgroundOpacity" | "cardOpacity"> | null;
  data: AppData;
  onSettingsChange: (settings: UserSettings) => void;
}) {
  const [brandOpen, setBrandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherDragging, setLauncherDragging] = useState(false);
  const [launcherTarget, setLauncherTarget] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const brandRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLDivElement>(null);
  const suppressLauncherClickRef = useRef(false);
  const launcherHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const launcherPointerRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    activated: boolean;
    moved: boolean;
    selectedPath: string;
  } | null>(null);
  const results = useMemo(() => buildSearchResults(data, query), [data, query]);
  const isDashboard = normalize(currentPath) === "/";
  const greeting = timeGreeting();
  const accountName = settings.accountName.trim();
  const firstName = accountName.split(/\s+/)[0];
  const showDashboardProfile = isDashboard && Boolean(accountName);
  const visualSettings = wallpaperPreview ? { ...settings, ...wallpaperPreview } : settings;
  const wallpaperSource = wallpaperUrl(visualSettings);
  const hasWallpaper = Boolean(wallpaperSource);
  const opacityStyle = hasWallpaper ? wallpaperStyleVars(visualSettings) : undefined;
  const currentLauncherIndex = Math.max(
    nav.findIndex((item) => normalize(currentPath) === item.path || (item.path === "/debt" && currentPath === "/debts")),
    0,
  );
  const launcherTargetIndex = nav.findIndex((item) => item.path === launcherTarget);
  const selectedLauncherIndex = launcherTargetIndex >= 0 ? launcherTargetIndex : currentLauncherIndex;

  useEffect(() => {
    function closeOnAway(event: MouseEvent) {
      if (!brandRef.current?.contains(event.target as Node)) setBrandOpen(false);
      if (!mobileMenuRef.current?.contains(event.target as Node)) setMobileMenuOpen(false);
      if (!launcherRef.current?.contains(event.target as Node)) {
        setLauncherOpen(false);
        setLauncherDragging(false);
        setLauncherTarget(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setBrandOpen(false);
        setMobileMenuOpen(false);
        setLauncherOpen(false);
        setLauncherDragging(false);
        setLauncherTarget(null);
      }
    }

    document.addEventListener("mousedown", closeOnAway);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnAway);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => () => {
    if (launcherHoldTimerRef.current) clearTimeout(launcherHoldTimerRef.current);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    setLauncherOpen(false);
    setLauncherDragging(false);
    setLauncherTarget(null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  function clearLauncherHoldTimer() {
    if (!launcherHoldTimerRef.current) return;
    clearTimeout(launcherHoldTimerRef.current);
    launcherHoldTimerRef.current = null;
  }

  function updateLauncherTarget(clientX: number) {
    const edgeInset = 18;
    const usableWidth = Math.max(window.innerWidth - edgeInset * 2, 1);
    const progress = Math.min(Math.max((clientX - edgeInset) / usableWidth, 0), 1);
    const targetIndex = Math.round(progress * (nav.length - 1));
    const targetPath = nav[targetIndex].path;
    if (launcherPointerRef.current) launcherPointerRef.current.selectedPath = targetPath;
    setLauncherTarget(targetPath);
  }

  function handleLauncherPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    clearLauncherHoldTimer();
    const session = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      activated: false,
      moved: false,
      selectedPath: nav[currentLauncherIndex].path,
    };
    launcherPointerRef.current = session;
    launcherHoldTimerRef.current = setTimeout(() => {
      session.activated = true;
      setMobileMenuOpen(false);
      setLauncherOpen(true);
      setLauncherDragging(true);
      setLauncherTarget(session.selectedPath);
    }, launcherHoldDelay);
  }

  function handleLauncherPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const session = launcherPointerRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - session.startX, event.clientY - session.startY);
    if (!session.activated) {
      if (distance > 9) clearLauncherHoldTimer();
      return;
    }
    event.preventDefault();
    if (distance > 7) session.moved = true;
    if (session.moved) updateLauncherTarget(event.clientX);
  }

  function handleLauncherPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const session = launcherPointerRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    clearLauncherHoldTimer();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    launcherPointerRef.current = null;
    suppressLauncherClickRef.current = session.activated;
    setLauncherDragging(false);
    if (session.activated) {
      setLauncherOpen(false);
      setLauncherTarget(null);
      if (session.moved) window.location.href = session.selectedPath;
    }
  }

  function handleLauncherPointerCancel(event: React.PointerEvent<HTMLButtonElement>) {
    clearLauncherHoldTimer();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    launcherPointerRef.current = null;
    setLauncherDragging(false);
    setLauncherOpen(false);
    setLauncherTarget(null);
  }

  return (
    <div
      className={`app-shell reference-shell theme-${settings.theme} accent-${settings.accent} density-${settings.density} ${hasWallpaper ? `has-wallpaper wallpaper-${visualSettings.wallpaper}` : "wallpaper-default"} ${settings.sidebarCollapsed ? "sidebar-collapsed" : ""} ${isDashboard ? "dashboard-shell" : ""}`}
      style={(hasWallpaper ? { "--vcc-wallpaper": `url(${JSON.stringify(wallpaperSource)})`, ...opacityStyle } : undefined) as CSSProperties | undefined}
    >
      <header className="dashboard-top-nav">
        <a className={`dashboard-top-brand${showDashboardProfile ? " has-profile" : ""}`} href={showDashboardProfile ? "/settings" : "/"} aria-label={showDashboardProfile ? `Open ${accountName} profile` : "Open VCC-OS dashboard"}>
          <span>{showDashboardProfile ? <UserCircle size={20} aria-hidden="true" /> : <Zap size={20} aria-hidden="true" />}</span>
          <div className="dashboard-brand-copy">
            {showDashboardProfile ? (
              <>
                <small>{greeting},</small>
                <strong>{firstName}</strong>
              </>
            ) : (
              <strong>VCC-OS</strong>
            )}
          </div>
        </a>
        <nav aria-label="Primary navigation">
          {dashboardNav.map((item) => {
            const Icon = item.icon;
            const active = normalize(currentPath) === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className={active ? "active" : ""}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <button
          className="dashboard-mobile-menu-trigger"
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>
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
        {!isDashboard && <header className="topbar">
          <button
            className="mobile-menu-trigger"
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <div>
            <h1>{titleForPath(currentPath, settings)}</h1>
          </div>
          <div className="top-actions">
            <div className="search-shell">
              <label className="search-pill">
                <Search size={16} />
                <input aria-label="Search VCC OS" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search VCC OS" />
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
        </header>}
        {children}
      </main>

      <div className={`mobile-menu-layer ${mobileMenuOpen ? "open" : ""}`} aria-hidden={!mobileMenuOpen}>
        <div className="mobile-menu-scrim" />
        <nav className="mobile-drawer" id="mobile-navigation" aria-label="Primary mobile navigation" ref={mobileMenuRef}>
          <div className="mobile-drawer-head">
            <a href="/" className="mobile-brand" onClick={() => setMobileMenuOpen(false)}>
              <span>V</span>
              <strong>VCC OS</strong>
            </a>
            <button type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <a className="mobile-profile" href="/settings" onClick={() => setMobileMenuOpen(false)}>
            <UserCircle size={20} />
            <span>
              <strong>{settings.accountName || "Account"}</strong>
              <small>{settings.profileLabel}</small>
            </span>
          </a>
          <div className="mobile-drawer-search">
            <Search size={16} />
            <input aria-label="Search VCC OS" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search VCC OS" />
          </div>
          <div className="mobile-drawer-results">
            {query.trim() && (
              results.length > 0 ? (
                results.slice(0, 4).map((result) => (
                  <a key={`${result.href}-${result.label}`} href={result.href} onClick={() => setMobileMenuOpen(false)}>
                    <strong>{result.label}</strong>
                    <span>{result.detail}</span>
                  </a>
                ))
              ) : (
                <span>No matches found</span>
              )
            )}
          </div>
          <div className="mobile-drawer-nav">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = normalize(currentPath) === item.path || (item.path === "/debt" && currentPath === "/debts");
              return (
                <a key={item.path} href={item.path} className={active ? "active" : ""} aria-current={active ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </nav>
      </div>
      <div className={`mobile-quick-launcher${launcherOpen ? " is-open" : ""}${launcherDragging ? " is-dragging" : ""}`} ref={launcherRef}>
        <div className="mobile-quick-launcher-menu" id="mobile-quick-launcher-menu" role="menu" aria-label="Quick page launcher" aria-hidden={!launcherOpen}>
          {nav.map((item, index) => {
            const Icon = item.icon;
            const active = normalize(currentPath) === item.path || (item.path === "/debt" && currentPath === "/debts");
            const highlighted = launcherTarget === item.path;
            const offset = index - selectedLauncherIndex;
            const distance = Math.abs(offset);
            const style = {
              "--launcher-x": `${offset * 48}px`,
              "--launcher-scale": highlighted ? 1.08 : distance === 1 ? 0.9 : 0.76,
              "--launcher-opacity": highlighted ? 1 : distance === 1 ? 0.58 : distance === 2 ? 0.2 : 0,
              "--launcher-delay": `${Math.min(distance, 3) * 22}ms`,
            } as CSSProperties;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`${active ? "active" : ""}${highlighted ? " is-target" : ""}`}
                data-launcher-path={item.path}
                role="menuitem"
                tabIndex={launcherOpen ? 0 : -1}
                aria-current={active ? "page" : undefined}
                style={style}
                title={item.label}
                onClick={() => setLauncherOpen(false)}
                onFocus={() => setLauncherTarget(item.path)}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="mobile-quick-launcher-item-label">{item.label}</span>
              </a>
            );
          })}
        </div>
        <div className="mobile-quick-launcher-label" id="mobile-quick-launcher-label" aria-live="polite">
          {nav[selectedLauncherIndex].label}
        </div>
        <button
          className="mobile-quick-launcher-button"
          type="button"
          aria-label={launcherOpen ? "Close quick page launcher" : "Open quick page launcher"}
          aria-expanded={launcherOpen}
          aria-controls="mobile-quick-launcher-menu"
          aria-describedby={launcherOpen ? "mobile-quick-launcher-label" : undefined}
          onClick={() => {
            if (suppressLauncherClickRef.current) {
              suppressLauncherClickRef.current = false;
              return;
            }
            setLauncherTarget(nav[currentLauncherIndex].path);
            setLauncherOpen((open) => !open);
          }}
          onPointerDown={handleLauncherPointerDown}
          onPointerMove={handleLauncherPointerMove}
          onPointerUp={handleLauncherPointerUp}
          onPointerCancel={handleLauncherPointerCancel}
        >
          <Zap size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function normalize(path: string) {
  return path === "/debts" ? "/debt" : path;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function titleForPath(path: string, settings: UserSettings) {
  const normalized = normalize(path);
  const label = nav.find((item) => item.path === normalized)?.label;
  if (!label) return "Page not found";
  return label === "Dashboard" ? `${timeGreeting()}, ${settings.accountName || "Account"}` : label;
}

function wallpaperUrl(settings: UserSettings) {
  if (settings.wallpaper === "upload" && settings.customWallpaper) return settings.customWallpaper;
  return {
    default: "",
    modern: "/wallpapers/modern.png",
    anime: "/wallpapers/anime.png",
    animation: "/wallpapers/animation.png",
    upload: "",
  }[settings.wallpaper] || "";
}

function wallpaperStyleVars(settings: UserSettings): CSSProperties {
  const visibility = clampPercent(settings.backgroundOpacity ?? 88, 20, 100) / 100;
  const cardOpacity = clampPercent(settings.cardOpacity ?? 84, 0, 100) / 100;
  const topAlpha = lerp(0.7, 0.04, visibility);
  const bottomAlpha = lerp(0.88, 0.24, visibility);
  const sideAlpha = lerp(0.6, 0.18, visibility);
  const middleAlpha = lerp(0.26, 0.02, visibility);

  return {
    "--vcc-wallpaper-top-alpha": topAlpha.toFixed(2),
    "--vcc-wallpaper-bottom-alpha": bottomAlpha.toFixed(2),
    "--vcc-wallpaper-side-alpha": sideAlpha.toFixed(2),
    "--vcc-wallpaper-middle-alpha": middleAlpha.toFixed(2),
    "--vcc-card-alpha": cardOpacity.toFixed(2),
  } as CSSProperties;
}

function clampPercent(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : max));
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
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
    carPayment: "/car-payment",
    savings: "/savings",
    inventory: "/inventory",
    goals: "/goals",
    reports: "/reports",
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
