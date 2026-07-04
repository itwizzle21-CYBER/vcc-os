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
        type="button"
        className="brand logoOnly"
        aria-label="Open navigation menu"
        title="Open navigation menu"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span className="logo">V</span>
      </button>

      <div className="commandTitle">
        <p>VCC OS</p>
        <h1>{currentLabel}</h1>
      </div>

      {menuOpen && (
        <nav className="menu" aria-label="Mobile navigation">
          <button
            type="button"
            className={view === "dashboard" ? "active" : ""}
            aria-current={view === "dashboard" ? "page" : undefined}
            onClick={() => open("dashboard")}
          >
            Dashboard
          </button>

          {sections.map((section) => (
            <button
              type="button"
              key={section.key}
              className={view === section.key ? "active" : ""}
              aria-current={view === section.key ? "page" : undefined}
              onClick={() => open(section.key)}
            >
              {section.label}
            </button>
          ))}

          <button
            type="button"
            className={view === "settings" ? "active" : ""}
            aria-current={view === "settings" ? "page" : undefined}
            onClick={() => open("settings")}
          >
            Settings
          </button>
        </nav>
      )}
    </header>
  );
}
