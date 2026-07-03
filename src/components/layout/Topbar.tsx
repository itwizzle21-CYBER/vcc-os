import type { AppView, Section } from "../../lib/types/vcc";

export function Topbar({
  view,
  menuOpen,
  sections,
  setMenuOpen,
  open,
}: {
  view: AppView;
  menuOpen: boolean;
  sections: Section[];
  setMenuOpen: (updater: (current: boolean) => boolean) => void;
  open: (view: AppView) => void;
}) {
  const currentLabel =
    view === "dashboard"
      ? "Mission Control"
      : view === "settings"
        ? "Settings"
        : sections.find((section) => section.key === view)?.label ?? "VCC OS";

  return (
    <header className="topbar">
      <button
        className="brand logoOnly"
        aria-label="Open navigation menu"
        title="Open navigation menu"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span className="logo">âŒ</span>
      </button>

      <div className="commandTitle">
        <p>VCC OS</p>
        <h1>{currentLabel}</h1>
      </div>

      {menuOpen && (
        <nav className="menu">
          <button className={view === "dashboard" ? "active" : ""} onClick={() => open("dashboard")}>
            Dashboard
          </button>

          {sections.map((section) => (
            <button
              key={section.key}
              className={view === section.key ? "active" : ""}
              onClick={() => open(section.key)}
            >
              {section.label}
            </button>
          ))}

          <button className={view === "settings" ? "active" : ""} onClick={() => open("settings")}>
            Settings
          </button>
        </nav>
      )}
    </header>
  );
}
