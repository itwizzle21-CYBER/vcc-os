import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  BellRing,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  Columns3,
  Database,
  Download,
  HardDrive,
  Info,
  LayoutDashboard,
  MonitorCog,
  Moon,
  Palette,
  RotateCcw,
  Save,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { CompanionArt, VCC_COMPANIONS } from "../agent/Companions";
import { LayoutViewSettings } from "../layout/LayoutViews";
import WelcomeTransition from "../layout/WelcomeTransition";
import BufferedTextInput from "../shared/BufferedTextInput";
import { resetAllData } from "../../lib/storage/localStore";
import { loadRecoveryPoints, MAX_BACKUP_BYTES, parseVccBackup, restoreRecoveryPoint, saveRecoveryPoint, serializeVccBackup } from "../../lib/storage/backup";
import type { AppData, SectionKey, UserSettings } from "../../lib/types/app";
import "../../settings-page.css";

export type WallpaperPreviewSettings = Pick<UserSettings, "wallpaper" | "customWallpaper" | "backgroundOpacity" | "cardOpacity">;

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SettingsPage({
  data,
  onChange,
  onResetSection,
  onWallpaperPreviewChange,
}: {
  data: AppData;
  onChange: (data: AppData) => void;
  onResetSection: (section: SectionKey) => void;
  onWallpaperPreviewChange: (preview: WallpaperPreviewSettings | null) => void;
}) {
  const [featurePrefs, setFeaturePrefs] = useState<Record<string, boolean>>(() => loadFeaturePrefs());
  const [recoveryPoints, setRecoveryPoints] = useState(() => loadRecoveryPoints());
  const [dataStatus, setDataStatus] = useState("");
  const [welcomePreviewId, setWelcomePreviewId] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1);
    return settingsNavigation.some(({ href }) => href === `#${hash}`) ? hash : "settings-profile";
  });

  function updateFeature(key: string, value: boolean) {
    const next = { ...featurePrefs, [key]: value };
    setFeaturePrefs(next);
    localStorage.setItem("vcc-os-smart-features", JSON.stringify(next));
  }

  function exportData() {
    const blob = new Blob([serializeVccBackup(data, featurePrefs)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vcc-os-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      window.alert("That backup is larger than VCC's 5 MB safety limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseVccBackup(String(reader.result || "{}"));
        saveRecoveryPoint(data, "Before backup import");
        setRecoveryPoints(loadRecoveryPoints());
        onChange(imported.data);
        if (Object.keys(imported.smartFeatures).length) {
          setFeaturePrefs(imported.smartFeatures);
          localStorage.setItem("vcc-os-smart-features", JSON.stringify(imported.smartFeatures));
        }
        setDataStatus("Backup restored. The previous workspace is available in recovery history.");
      } catch {
        window.alert("That file does not look like a valid VCC-OS export.");
      }
    };
    reader.readAsText(file);
  }

  const accountName = data.settings.accountName || "Local Account";
  const initials = accountName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "VC";
  const colorModeLabel = data.settings.theme === "system" ? "System" : titleCase(data.settings.theme);
  const backgroundLabel = wallpaperOptions.find((option) => option.value === data.settings.wallpaper)?.label || "Default";

  function openSettingsSection(id: string) {
    setOpenSection(id);
    window.history.replaceState(null, "", `${window.location.pathname}#${id}`);
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="settings-page premium-settings">
      {welcomePreviewId !== null && <WelcomeTransition key={welcomePreviewId} settings={data.settings} preview />}
      <div className="settings-layout">
        <aside className="settings-navigation">
          <p>Settings</p>
          <nav aria-label="Settings sections">
            {settingsNavigation.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className={openSection === href.slice(1) ? "is-active" : undefined}
                aria-current={openSection === href.slice(1) ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  openSettingsSection(href.slice(1));
                }}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <div className="settings-storage-note">
            <HardDrive size={17} aria-hidden="true" />
            <span><strong>Stored on this device</strong><small>Your financial workspace stays local.</small></span>
          </div>
        </aside>

        <div className="settings-content">
          <SettingsSection id="settings-profile" icon={UserRound} title="Workspace & privacy" description="Manage your identity, profile, and local data preferences." open={openSection === "settings-profile"}>
            <div className="settings-profile-overview">
              <div className="settings-account-identity">
                <span className="settings-avatar" aria-hidden="true">{initials}</span>
                <div>
                  <p className="settings-kicker">Personal workspace</p>
                  <h2>{accountName}</h2>
                  <p>{data.settings.profileLabel || "Local Profile"}</p>
                </div>
              </div>
              <div className="settings-account-state" aria-label="Account status">
                <span><ShieldCheck size={15} /> {data.settings.localMode ? "Local first" : "Cloud ready"}</span>
                <span><Save size={15} /> Changes save automatically</span>
              </div>
            </div>
            <div className="settings-field-grid">
              <SettingInput label="Greeting name" description="Shown across your dashboard and briefings." value={data.settings.accountName} onChange={(accountName) => onChange({ ...data, settings: { ...data.settings, accountName } })} />
              <SettingInput label="Profile label" description="A short name for this local workspace." value={data.settings.profileLabel} onChange={(profileLabel) => onChange({ ...data, settings: { ...data.settings, profileLabel } })} />
            </div>
            <SettingFeatureRow title="Local-first mode" description="Keep this VCC workspace and its data on this device." checked={data.settings.localMode} onChange={(localMode) => onChange({ ...data, settings: { ...data.settings, localMode } })} />
          </SettingsSection>

          <SettingsSection id="settings-layout-views" icon={Columns3} title="Layout Views" description="Choose one of five focused layouts for each major workspace." open={openSection === "settings-layout-views"}>
            <LayoutViewSettings
              value={data.settings.layoutViews}
              onChange={(layoutViews) => onChange({ ...data, settings: { ...data.settings, layoutViews } })}
            />
          </SettingsSection>

          <SettingsSection id="settings-appearance" icon={Palette} title="Appearance" description="Choose a focused visual system that feels right for daily use." open={openSection === "settings-appearance"}>
            <div className="settings-welcome-panel">
              <div className="settings-welcome-heading">
                <span aria-hidden="true"><Sparkles size={18} /></span>
                <div><strong>Welcome transition</strong><small>Shape the opening moment before your dashboard appears.</small></div>
              </div>
              <div className="settings-field-grid">
                <SettingInput label="Welcome headline" description="Leave blank to use the current time-of-day greeting." value={data.settings.welcomeHeadline} onChange={(welcomeHeadline) => onChange({ ...data, settings: { ...data.settings, welcomeHeadline } })} />
                <SettingInput label="Supporting message" description="Short status text shown beneath your name." value={data.settings.welcomeMessage} onChange={(welcomeMessage) => onChange({ ...data, settings: { ...data.settings, welcomeMessage } })} />
              </div>
              <SettingControlRow label="Transition style" description="Choose how the welcome content enters the screen.">
                <SettingSegmented label="Welcome transition style" value={data.settings.welcomeTransition} options={[
                  { value: "rise", label: "Rise" },
                  { value: "fade", label: "Fade" },
                  { value: "focus", label: "Focus" },
                  { value: "sweep", label: "Sweep" },
                ]} onChange={(welcomeTransition) => onChange({ ...data, settings: { ...data.settings, welcomeTransition: welcomeTransition as AppData["settings"]["welcomeTransition"] } })} />
              </SettingControlRow>
              <SettingControlRow label="Display time" description="Choose between 1 and 5 seconds.">
                <label className="settings-duration-control">
                  <input type="range" min="1" max="5" step="1" value={data.settings.welcomeDurationSeconds} aria-label="Welcome display time" onChange={(event) => onChange({ ...data, settings: { ...data.settings, welcomeDurationSeconds: Number(event.target.value) } })} />
                  <output>{data.settings.welcomeDurationSeconds}s</output>
                </label>
              </SettingControlRow>
              <button type="button" className="settings-preview-welcome" onClick={() => setWelcomePreviewId(Date.now())}>Preview welcome</button>
            </div>
            <div className="settings-appearance-studio">
              <div className="settings-appearance-intro">
                <div>
                  <p className="settings-kicker">Visual system</p>
                  <h3>Choose your workspace character</h3>
                  <p>Each theme changes surfaces, borders, depth, typography rhythm, and chart treatment across VCC.</p>
                </div>
                <span className="settings-live-badge"><Sparkles size={14} aria-hidden="true" /> Live preview</span>
              </div>
              <AppearanceThemePicker value={data.settings.appearanceTheme} onChange={(appearanceTheme) => onChange({ ...data, settings: { ...data.settings, appearanceTheme } })} />
              <div className="settings-layer-heading">
                <div>
                  <p className="settings-kicker">Independent layers</p>
                  <h3>Mix interface and canvas</h3>
                  <p>Color mode controls contrast and readability. Background controls the canvas beneath it. Choose both; neither selection turns the other off.</p>
                </div>
                <span className="settings-combination-badge">{colorModeLabel} + {backgroundLabel}</span>
              </div>
              <div className="settings-layer-grid">
                <section className="settings-layer-card" aria-labelledby="color-mode-title">
                  <header>
                    <span className="settings-layer-icon"><MonitorCog size={18} aria-hidden="true" /></span>
                    <div>
                      <strong id="color-mode-title">Color mode</strong>
                      <small>Interface contrast</small>
                    </div>
                    <span>{colorModeLabel}</span>
                  </header>
                  <SettingSegmented label="Light and dark mode" value={data.settings.theme} options={[
                    { value: "system", label: "System", icon: MonitorCog },
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                  ]} onChange={(theme) => onChange({ ...data, settings: { ...data.settings, theme: theme as AppData["settings"]["theme"] } })} />
                </section>
                <section className="settings-layer-card" aria-labelledby="background-layer-title">
                  <header>
                    <span className="settings-layer-icon"><Palette size={18} aria-hidden="true" /></span>
                    <div>
                      <strong id="background-layer-title">Background</strong>
                      <small>Workspace canvas</small>
                    </div>
                    <span>{backgroundLabel}</span>
                  </header>
                  <WallpaperPicker
                    value={data.settings.wallpaper}
                    customWallpaper={data.settings.customWallpaper}
                    backgroundOpacity={data.settings.backgroundOpacity}
                    cardOpacity={data.settings.cardOpacity}
                    onChange={(wallpaper, customWallpaper = data.settings.customWallpaper, backgroundOpacity = data.settings.backgroundOpacity, cardOpacity = data.settings.cardOpacity) => onChange({ ...data, settings: { ...data.settings, wallpaper, customWallpaper, backgroundOpacity, cardOpacity } })}
                    onPreviewChange={onWallpaperPreviewChange}
                  />
                </section>
              </div>
            </div>
            <SettingControlRow label="Accent" description="Used for focus, selection, and key actions.">
              <AccentPicker value={data.settings.accent} onChange={(accent) => onChange({ ...data, settings: { ...data.settings, accent: accent as AppData["settings"]["accent"] } })} />
            </SettingControlRow>
            <SettingControlRow label="Layout density" description="Adjust spacing without changing your data.">
              <SettingSegmented label="Layout density" value={data.settings.density} options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
                { value: "ultra", label: "Dense" },
              ]} onChange={(density) => onChange({ ...data, settings: { ...data.settings, density: density as AppData["settings"]["density"] } })} />
            </SettingControlRow>
            <SettingFeatureRow
              title="Hide captions and hints"
              description="Remove secondary guidance for a cleaner workspace while keeping headings, data, and accessible labels."
              checked={data.settings.hideInterfaceGuidance}
              onChange={(hideInterfaceGuidance) => onChange({ ...data, settings: { ...data.settings, hideInterfaceGuidance } })}
            />
            <SettingControlRow label="Surface" description="Change panel depth and translucency.">
              <SettingSegmented label="Surface style" value={data.settings.surfaceStyle} options={[
                { value: "glass", label: "Glass" },
                { value: "neumorphic", label: "Depth" },
                { value: "minimal", label: "Minimal" },
              ]} onChange={(surfaceStyle) => onChange({ ...data, settings: { ...data.settings, surfaceStyle: surfaceStyle as AppData["settings"]["surfaceStyle"] } })} />
            </SettingControlRow>
          </SettingsSection>

          <SettingsSection id="settings-intelligence" icon={BrainCircuit} title="Intelligence" description="Decide which financial signals VCC calculates for you." open={openSection === "settings-intelligence"}>
            <div className="settings-row-list">
              {smartFeatures.map((feature) => (
                <SettingFeatureRow key={feature.key} title={feature.label} description={feature.description} checked={featurePrefs[feature.key] !== false} onChange={(checked) => updateFeature(feature.key, checked)} />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection id="settings-notifications" icon={BellRing} title="Notifications" description="Keep important deadlines visible without adding noise." open={openSection === "settings-notifications"}>
            <SettingFeatureRow title="Allow notifications" description="Master control for reminders and account alerts." checked={data.settings.notificationsEnabled} onChange={(notificationsEnabled) => onChange({ ...data, settings: { ...data.settings, notificationsEnabled } })} />
            <div className="settings-row-list settings-dependent-rows" aria-disabled={!data.settings.notificationsEnabled}>
              <SettingFeatureRow title="Bill reminders" description="Alert before bills are due." checked={featurePrefs.billReminders !== false} disabled={!data.settings.notificationsEnabled} onChange={(checked) => updateFeature("billReminders", checked)} />
              <SettingFeatureRow title="Overdue alerts" description="Warn when bills become overdue." checked={featurePrefs.overdueAlerts !== false} disabled={!data.settings.notificationsEnabled} onChange={(checked) => updateFeature("overdueAlerts", checked)} />
              <SettingFeatureRow title="Weekly summary" description="Show a concise weekly financial digest." checked={featurePrefs.weeklySummary !== false} disabled={!data.settings.notificationsEnabled} onChange={(checked) => updateFeature("weeklySummary", checked)} />
            </div>
          </SettingsSection>

          <SettingsSection id="settings-dashboard" icon={LayoutDashboard} title="Dashboard" description="Choose the modules that stay visible in your command center." open={openSection === "settings-dashboard"}>
            <div className="settings-widget-grid">
              {widgetOptions.map((widget) => (
                <SettingToggle
                  key={widget.id}
                  label={widget.label}
                  checked={!data.settings.hiddenWidgets.includes(widget.id)}
                  onChange={(visible) => onChange({
                    ...data,
                    settings: {
                      ...data.settings,
                      hiddenWidgets: visible
                        ? data.settings.hiddenWidgets.filter((id) => id !== widget.id)
                        : [...data.settings.hiddenWidgets, widget.id],
                    },
                  })}
                />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection id="settings-features" icon={Bot} title="Features" description="Choose which optional tools appear across VCC-OS." open={openSection === "settings-features"}>
            <div className="settings-row-list">
              <SettingFeatureRow title="VitaScan" description="Show the receipt scanner in desktop and mobile navigation." checked={data.settings.vitaScanEnabled} onChange={(vitaScanEnabled) => onChange({ ...data, settings: { ...data.settings, vitaScanEnabled } })} />
              <SettingFeatureRow title="AI pet companions" description="Choose a pet guide with its own financial specialty, tone, and coaching style." checked={data.settings.vccPetEnabled} onChange={(vccPetEnabled) => onChange({ ...data, settings: { ...data.settings, vccPetEnabled } })} />
            </div>
            {data.settings.vccPetEnabled && (
              <div className="settings-companion-picker" role="radiogroup" aria-label="Default AI pet companion">
                <div><strong>Default companion</strong><small>All companions use the same VCC records and decision rules; only their focus and voice change.</small></div>
                <div className="settings-companion-grid">
                  {VCC_COMPANIONS.map((companion) => (
                    <button key={companion.id} type="button" role="radio" aria-checked={data.settings.vccCompanionId === companion.id} className={data.settings.vccCompanionId === companion.id ? "is-selected" : ""} onClick={() => onChange({ ...data, settings: { ...data.settings, vccCompanionId: companion.id } })}>
                      <CompanionArt companionId={companion.id} variant="settings" />
                      <span><strong>{companion.name}</strong><small>{companion.species} · {companion.specialty}</small><em>{companion.nuance}</em></span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {data.settings.vitaScanEnabled && <a className="settings-feature-link" href="/vitascan"><ScanLine size={17} aria-hidden="true" /> Open VitaScan</a>}
          </SettingsSection>

          <SettingsSection id="settings-data" icon={Database} title="Data & storage" description="Move, protect, or reset the information stored in this browser." open={openSection === "settings-data"}>
            <div className="settings-data-stats" aria-label="Stored row counts">
              <span><strong>{data.sections.money.length}</strong><small>Money</small></span>
              <span><strong>{data.sections.bills.length}</strong><small>Bills</small></span>
              <span><strong>{data.sections.transactions.length}</strong><small>Transactions</small></span>
              <span><strong>{data.sections.inventory.length}</strong><small>Inventory</small></span>
            </div>
            <div className="settings-transfer-row">
              <div>
                <strong>Backup & restore</strong>
                <small>Export a portable JSON backup or restore one you trust.</small>
              </div>
              <div className="settings-actions">
                <button type="button" onClick={exportData}><Download size={16} /> Export</button>
                <label className="settings-import-button">
                  <Upload size={16} />
                  <span>Import</span>
                  <input className="settings-file-input" aria-label="Import VCC data" type="file" accept="application/json,.json" onChange={(event) => importData(event.target.files?.[0])} />
                </label>
              </div>
            </div>
            {dataStatus && <p className="settings-data-status" role="status">{dataStatus}</p>}
            <div className="settings-recovery-history">
              <div><strong>Recovery history</strong><small>VCC keeps up to three local snapshots before imports, resets, and cloud restores.</small></div>
              {recoveryPoints.length ? <ul>
                {recoveryPoints.map((point) => <li key={point.id}>
                  <span><strong>{point.reason}</strong><small>{new Date(point.createdAt).toLocaleString()}</small></span>
                  <button type="button" onClick={() => {
                    const recovered = restoreRecoveryPoint(point.id);
                    if (!recovered) return;
                    saveRecoveryPoint(data, "Before recovery restore");
                    onChange(recovered);
                    setRecoveryPoints(loadRecoveryPoints());
                    setDataStatus("Recovery point restored.");
                  }}>Restore</button>
                </li>)}
              </ul> : <small>No recovery points yet.</small>}
            </div>
            <SettingFeatureRow title="Confirm before reset" description="Require a confirmation before destructive data actions." checked={data.settings.confirmBeforeReset} onChange={(confirmBeforeReset) => onChange({ ...data, settings: { ...data.settings, confirmBeforeReset } })} />
            <details className="settings-advanced">
              <summary><span><RotateCcw size={16} /> Advanced reset controls</span><ChevronDown size={17} aria-hidden="true" /></summary>
              <p>Reset one area without affecting the rest of your workspace.</p>
              <div className="settings-reset-grid">
                {sectionResetOptions.map((section) => (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => {
                      if (!data.settings.confirmBeforeReset || window.confirm(`Reset ${section.label} to zero rows?`)) {
                        saveRecoveryPoint(data, `Before ${section.label} reset`);
                        setRecoveryPoints(loadRecoveryPoints());
                        onResetSection(section.key);
                      }
                    }}
                  >
                    Reset {section.label}
                  </button>
                ))}
              </div>
            </details>
            <div className="settings-danger-zone">
              <div>
                <strong>Reset VCC to a blank state</strong>
                <small>Clears every row, planner value, history item, account label, and preference.</small>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!data.settings.confirmBeforeReset || window.confirm("Reset all VCC OS data and settings to a blank state? This cannot be undone.")) {
                    saveRecoveryPoint(data, "Before full reset");
                    setRecoveryPoints(loadRecoveryPoints());
                    localStorage.removeItem("vcc-os-smart-features");
                    setFeaturePrefs(Object.fromEntries(smartFeatures.map((feature) => [feature.key, true])));
                    onChange(resetAllData());
                  }
                }}
              >
                Reset VCC to blank
              </button>
            </div>
          </SettingsSection>

          <SettingsSection id="settings-about" icon={Info} title="About VCC-OS" description="Vitality Command Center Operating System." open={openSection === "settings-about"}>
            <div className="settings-about-row">
              <div className="settings-product-mark" aria-hidden="true"><MonitorCog size={22} /></div>
              <div>
                <strong>VCC-OS</strong>
                <small>Personal finance intelligence, automation, and clearer decisions.</small>
              </div>
              <span>Local build · v{data.version}</span>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

const settingsNavigation: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "#settings-profile", label: "Workspace & privacy", icon: UserRound },
  { href: "#settings-layout-views", label: "Layout Views", icon: Columns3 },
  { href: "#settings-appearance", label: "Appearance", icon: SlidersHorizontal },
  { href: "#settings-intelligence", label: "Intelligence", icon: BrainCircuit },
  { href: "#settings-notifications", label: "Notifications", icon: BellRing },
  { href: "#settings-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "#settings-features", label: "Features", icon: Bot },
  { href: "#settings-data", label: "Data & storage", icon: Database },
  { href: "#settings-about", label: "About", icon: Info },
];

const smartFeatures = [
  { key: "decisionEngine", label: "Decision Engine", description: "Generate spending recommendations" },
  { key: "forecasts", label: "Financial Forecasts", description: "Project future balances" },
  { key: "cashflowPrediction", label: "Cash Flow Prediction", description: "Compare income and expenses" },
  { key: "safeSpending", label: "Safe Spending Calculation", description: "Calculate safe-to-spend signals" },
  { key: "savingsRecommendations", label: "Savings Recommendations", description: "Surface saving opportunities" },
  { key: "healthScore", label: "Budget Health Score", description: "Show overall financial wellness signals" },
];

const sectionResetOptions: Array<{ key: SectionKey; label: string }> = [
  { key: "money", label: "Money" },
  { key: "bills", label: "Bills" },
  { key: "transactions", label: "Transactions" },
  { key: "savings", label: "Savings" },
  { key: "goals", label: "Goals" },
  { key: "inventory", label: "Inventory" },
  { key: "debt", label: "Debt" },
  { key: "carPayment", label: "Car Payment" },
  { key: "income", label: "Income" },
];

function loadFeaturePrefs(): Record<string, boolean> {
  try {
    const saved = JSON.parse(localStorage.getItem("vcc-os-smart-features") || "{}");
    return { ...Object.fromEntries(smartFeatures.map((feature) => [feature.key, true])), ...saved };
  } catch {
    return Object.fromEntries(smartFeatures.map((feature) => [feature.key, true]));
  }
}

function SettingsSection({ id, icon: Icon, title, description, children, open }: { id: string; icon: LucideIcon; title: string; description: string; children: ReactNode; open: boolean }) {
  if (!open) return null;

  return (
    <section className="settings-section settings-detail-panel is-open is-mobile-open" id={id} aria-labelledby={`${id}-title`}>
      <header className="settings-section-header">
        <div className="settings-section-trigger">
          <span className="settings-section-icon"><Icon size={19} aria-hidden="true" /></span>
          <span className="settings-section-heading">
            <span id={`${id}-title`}>{title}</span>
            <small>{description}</small>
          </span>
        </div>
      </header>
      <div className="settings-section-body" id={`${id}-content`}>
        {children}
      </div>
    </section>
  );
}

function SettingFeatureRow({ title, description, checked, disabled = false, onChange }: { title: string; description: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`settings-feature-row${disabled ? " is-disabled" : ""}`}>
      <span className="settings-row-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="vcc-switch">
        <input aria-label={title} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
        <span className="vcc-switch-track" aria-hidden="true"><span /></span>
      </span>
    </label>
  );
}

function SettingControlRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div className="settings-control-row">
      <div className="settings-row-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </div>
      {children}
    </div>
  );
}

function SettingSegmented({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string; icon?: LucideIcon }>; onChange: (value: string) => void }) {
  return (
    <div className="settings-segmented" role="group" aria-label={label}>
      {options.map((option) => {
        const OptionIcon = option.icon;
        return <button key={option.value} type="button" className={value === option.value ? "is-selected" : ""} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {OptionIcon ? <OptionIcon size={15} aria-hidden="true" /> : value === option.value && <Check size={14} aria-hidden="true" />}
          <span>{option.label}</span>
        </button>;
      })}
    </div>
  );
}

const appearanceThemes = [
  { value: "signature", name: "Signature", description: "Refined navy surfaces with luminous focus and balanced depth.", colors: ["#08111f", "#14213a", "#4f8cff"] },
  { value: "executive", name: "Executive", description: "Graphite structure, decisive borders, and restrained professional contrast.", colors: ["#111315", "#25282c", "#c79a4b"] },
  { value: "nordic", name: "Nordic", description: "Quiet cool surfaces, airy spacing, and calm editorial clarity.", colors: ["#e8edf2", "#f8fafb", "#347c78"] },
  { value: "contrast", name: "High Contrast", description: "Maximum separation, stronger focus rings, and crisp data readability.", colors: ["#050505", "#1b1b1b", "#ffd84d"] },
] as const;

function AppearanceThemePicker({ value, onChange }: { value: AppData["settings"]["appearanceTheme"]; onChange: (value: AppData["settings"]["appearanceTheme"]) => void }) {
  return (
    <div className="settings-theme-grid" role="radiogroup" aria-label="Professional themes">
      {appearanceThemes.map((theme) => (
        <button key={theme.value} type="button" role="radio" aria-checked={value === theme.value} className={`settings-theme-card theme-preview-${theme.value}${value === theme.value ? " is-selected" : ""}`} onClick={() => onChange(theme.value)}>
          <span className="settings-theme-card-top">
            <span className="settings-theme-palette" aria-hidden="true">{theme.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span>
            {value === theme.value && <span className="settings-theme-selected"><Check size={13} aria-hidden="true" /> Active</span>}
          </span>
          <strong>{theme.name}</strong>
          <small>{theme.description}</small>
        </button>
      ))}
    </div>
  );
}

const accentOptions = ["blue", "green", "gold", "purple", "red"] as const;

function AccentPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="settings-accent-picker" role="radiogroup" aria-label="Accent color">
      {accentOptions.map((accent) => (
        <button key={accent} type="button" className={value === accent ? "is-selected" : ""} role="radio" aria-checked={value === accent} aria-label={`${titleCase(accent)} accent`} title={`${titleCase(accent)} accent`} onClick={() => onChange(accent)}>
          <span className={`accent-swatch ${accent}`} aria-hidden="true" />
          {value === accent && <Check size={13} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

const wallpaperOptions: Array<{ value: AppData["settings"]["wallpaper"]; label: string; image?: string }> = [
  { value: "default", label: "Default" },
  { value: "modern", label: "Modern", image: "/wallpapers/modern.webp" },
  { value: "anime", label: "Anime", image: "/wallpapers/anime.webp" },
  { value: "animation", label: "Animation", image: "/wallpapers/animation.webp" },
  { value: "upload", label: "Upload" },
];

function WallpaperPicker({
  value,
  customWallpaper,
  backgroundOpacity,
  cardOpacity,
  onChange,
  onPreviewChange,
}: {
  value: AppData["settings"]["wallpaper"];
  customWallpaper: string;
  backgroundOpacity: number;
  cardOpacity: number;
  onChange: (value: AppData["settings"]["wallpaper"], customWallpaper?: string, backgroundOpacity?: number, cardOpacity?: number) => void;
  onPreviewChange: (preview: WallpaperPreviewSettings | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftWallpaper, setDraftWallpaper] = useState(value);
  const [draftCustomWallpaper, setDraftCustomWallpaper] = useState(customWallpaper);
  const [draftBackgroundOpacity, setDraftBackgroundOpacity] = useState(backgroundOpacity);
  const [draftCardOpacity, setDraftCardOpacity] = useState(cardOpacity);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const selectedOption = wallpaperOptions.find((option) => option.value === value) || wallpaperOptions[0];
  const draftOption = wallpaperOptions.find((option) => option.value === draftWallpaper) || wallpaperOptions[0];
  const draftPreview = wallpaperPreviewSource(draftWallpaper, draftCustomWallpaper);

  const closePicker = useCallback(() => {
    setDraftWallpaper(value);
    setDraftCustomWallpaper(customWallpaper);
    setDraftBackgroundOpacity(backgroundOpacity);
    setDraftCardOpacity(cardOpacity);
    onPreviewChange(null);
    setOpen(false);
  }, [backgroundOpacity, cardOpacity, customWallpaper, onPreviewChange, value]);

  useEffect(() => {
    setDraftWallpaper(value);
    setDraftCustomWallpaper(customWallpaper);
    setDraftBackgroundOpacity(backgroundOpacity);
    setDraftCardOpacity(cardOpacity);
  }, [value, customWallpaper, backgroundOpacity, cardOpacity]);

  useEffect(() => {
    if (!open) {
      onPreviewChange(null);
      return;
    }
    onPreviewChange({ wallpaper: draftWallpaper, customWallpaper: draftCustomWallpaper, backgroundOpacity: draftBackgroundOpacity, cardOpacity: draftCardOpacity });
  }, [open, draftWallpaper, draftCustomWallpaper, draftBackgroundOpacity, draftCardOpacity, onPreviewChange]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : manageButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusable = dialog ? [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')] : [];
    window.requestAnimationFrame(() => focusable[0]?.focus());
    function handleDialogKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePicker();
        return;
      }
      if (event.key !== "Tab" || focusable.length === 0) return;
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
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKey);
      previousFocus?.focus();
    };
  }, [open, closePicker]);

  function uploadWallpaper(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraftWallpaper("upload");
      setDraftCustomWallpaper(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  }

  function chooseUploadWallpaper() {
    if (draftCustomWallpaper) {
      setDraftWallpaper("upload");
      return;
    }
    uploadInputRef.current?.click();
  }

  function handleUploadKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    chooseUploadWallpaper();
  }

  function saveWallpaper() {
    onChange(draftWallpaper, draftCustomWallpaper, draftBackgroundOpacity, draftCardOpacity);
    onPreviewChange(null);
    setOpen(false);
  }

  return (
    <>
      <div className="settings-wallpaper-summary">
        <div className={`settings-wallpaper-current wallpaper-current-${value}`}>
          {value !== "default" && wallpaperPreviewSource(value, customWallpaper) ? <img src={wallpaperPreviewSource(value, customWallpaper)} alt="" /> : <span>Default</span>}
        </div>
        <div>
          <strong>{selectedOption.label}</strong>
          <small>{value === "default" ? "Original VCC background" : "Wallpaper background"}</small>
        </div>
        <button ref={manageButtonRef} type="button" onClick={() => setOpen(true)}>Manage backgrounds</button>
      </div>

      {open && createPortal(
        <div className="settings-wallpaper-modal" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closePicker();
        }}>
          <section ref={dialogRef} className="settings-wallpaper-dialog" role="dialog" aria-modal="true" aria-labelledby="wallpaper-dialog-title">
            <header className="settings-wallpaper-dialog-header">
              <div>
                <p className="settings-kicker">Backgrounds</p>
                <h3 id="wallpaper-dialog-title">Choose VCC background</h3>
              </div>
              <button type="button" aria-label="Close background picker" onClick={closePicker}><X size={18} /></button>
            </header>

            <div className="settings-wallpaper-dialog-body">
              <div className={`settings-wallpaper-vcc-preview${draftPreview ? " has-preview-image" : ""}`} style={wallpaperPreviewStyle(draftPreview, draftBackgroundOpacity, draftCardOpacity)}>
                <div className="settings-wallpaper-preview-nav">
                  <span>VCC-OS</span>
                  <b>{draftOption.label}</b>
                </div>
                <div className="settings-wallpaper-preview-card is-wide">
                  <small>Today&apos;s Mission</small>
                  <strong>Keep the command center clear</strong>
                  <span>Glass panels stay legible over the visible background.</span>
                </div>
                <div className="settings-wallpaper-preview-grid">
                  <div className="settings-wallpaper-preview-card">
                    <small>Money Snapshot</small>
                    <strong>$3,065.52</strong>
                  </div>
                  <div className="settings-wallpaper-preview-card">
                    <small>Priority Alerts</small>
                    <strong>3 active</strong>
                  </div>
                </div>
              </div>

              <div className="settings-wallpaper-tuning" aria-label="Background tuning">
                <SettingSlider
                  label="Background visibility"
                  value={draftBackgroundOpacity}
                  min={20}
                  max={100}
                  onChange={setDraftBackgroundOpacity}
                />
                <SettingSlider
                  label="Card opacity"
                  value={draftCardOpacity}
                  min={0}
                  max={100}
                  onChange={setDraftCardOpacity}
                />
              </div>

              <div className="settings-wallpaper-picker" role="radiogroup" aria-label="Background wallpaper">
                {wallpaperOptions.map((option) => {
                  const selected = draftWallpaper === option.value;
                  if (option.value === "upload") {
                    return (
                      <div
                        key={option.value}
                        className={`settings-wallpaper-option settings-wallpaper-upload${selected ? " is-selected" : ""}`}
                        role="radio"
                        aria-checked={selected}
                        tabIndex={0}
                        onClick={chooseUploadWallpaper}
                        onKeyDown={handleUploadKeyDown}
                      >
                        {draftCustomWallpaper ? <img className="settings-wallpaper-upload-preview" src={draftCustomWallpaper} alt="" /> : (
                          <span className="settings-wallpaper-upload-drop">
                            <Upload size={17} aria-hidden="true" />
                            <strong>{option.label}</strong>
                          </span>
                        )}
                        <span className="settings-wallpaper-upload-label">
                          <strong>{draftCustomWallpaper ? "Custom upload" : "Upload image"}</strong>
                          {selected && <Check size={14} aria-hidden="true" />}
                        </span>
                        <button
                          type="button"
                          className="settings-wallpaper-upload-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            uploadInputRef.current?.click();
                          }}
                        >
                          {draftCustomWallpaper ? "Replace" : "Choose"}
                        </button>
                        <input
                          ref={uploadInputRef}
                          className="settings-wallpaper-file"
                          aria-label="Upload custom wallpaper"
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            uploadWallpaper(event.currentTarget.files?.[0]);
                            event.currentTarget.value = "";
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <label key={option.value} className={`settings-wallpaper-option${selected ? " is-selected" : ""}`}>
                      <input type="radio" name="wallpaper" checked={selected} onChange={() => setDraftWallpaper(option.value)} />
                      {option.image ? <img src={option.image} alt="" loading="lazy" /> : <span className="settings-wallpaper-default-tile">Original</span>}
                      <span>
                        <strong>{option.label}</strong>
                        {selected && <Check size={14} aria-hidden="true" />}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <footer className="settings-wallpaper-dialog-actions">
              <button type="button" onClick={closePicker}>Cancel</button>
              <button type="button" className="settings-wallpaper-save" onClick={saveWallpaper}><Save size={16} /> Save background</button>
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}

function wallpaperPreviewSource(value: AppData["settings"]["wallpaper"], customWallpaper: string) {
  if (value === "upload") return customWallpaper;
  return wallpaperOptions.find((option) => option.value === value)?.image || "";
}

function wallpaperPreviewStyle(preview: string, backgroundOpacity: number, cardOpacity: number): CSSProperties {
  const visibility = clampNumber(backgroundOpacity, 20, 100) / 100;
  const cardAlpha = clampNumber(cardOpacity, 0, 100) / 100;
  return {
    ...(preview ? { "--settings-wallpaper-preview": `url(${JSON.stringify(preview)})` } : {}),
    "--settings-preview-start-alpha": previewLerp(0.72, 0.08, visibility).toFixed(2),
    "--settings-preview-end-alpha": previewLerp(0.88, 0.34, visibility).toFixed(2),
    "--settings-preview-side-alpha": previewLerp(0.58, 0.2, visibility).toFixed(2),
    "--settings-preview-middle-alpha": previewLerp(0.26, 0.04, visibility).toFixed(2),
    "--settings-preview-card-alpha": cardAlpha.toFixed(2),
  } as CSSProperties;
}

function SettingSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const normalizedValue = clampNumber(value, min, max);

  return (
    <label className="settings-range-control">
      <span>
        <strong>{label}</strong>
        <small>{normalizedValue}%</small>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={normalizedValue}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function clampNumber(value: number | undefined, min: number, max: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : max;
  return Math.min(max, Math.max(min, Math.round(safeValue)));
}

function previewLerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

const widgetOptions = [
  { id: "total-cash", label: "Total Cash" },
  { id: "money-snapshot", label: "Spendable / Safe" },
  { id: "protected-savings", label: "Protected Savings" },
  { id: "command", label: "Command Center" },
  { id: "balance", label: "Money Snapshot" },
  { id: "bills", label: "Bills + Pressure" },
  { id: "inventory", label: "Inventory" },
  { id: "analytics", label: "Cash Flow + Categories" },
  { id: "activity", label: "Activity Alerts" },
  { id: "progress", label: "Debt Progress" },
  { id: "objectives", label: "Objective Stack" },
];

function SettingInput({ label, description, value, onChange }: { label: string; description: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="settings-text-field">
      <span className="settings-row-copy"><strong>{label}</strong><small>{description}</small></span>
      <BufferedTextInput aria-label={label} value={value} onValueChange={onChange} delay={280} />
    </label>
  );
}

function SettingToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="setting-toggle">
      <span>{label}</span>
      <span className="vcc-switch">
        <input aria-label={label} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="vcc-switch-track" aria-hidden="true"><span /></span>
      </span>
    </label>
  );
}
