import { Activity, Columns3, ListChecks, Rows3, ScanSearch } from "lucide-react";
import type { LayoutView, LayoutViewPage, LayoutViews } from "../../lib/types/app";

export const layoutViewOptions = [
  { id: 1 as const, name: "Focused Stack", description: "A calm, linear view with details revealed only when needed.", icon: Rows3 },
  { id: 2 as const, name: "Lens", description: "A side-by-side view centered on accounts, status, or categories.", icon: Columns3 },
  { id: 3 as const, name: "Timeline", description: "Activity-led sections that make sequence and progress easy to read.", icon: Activity },
  { id: 4 as const, name: "Command Strip", description: "Key totals first, followed by one focused working area.", icon: ScanSearch },
  { id: 5 as const, name: "Review Queue", description: "Exceptions and next decisions first, with recent history beside them.", icon: ListChecks },
] satisfies Array<{ id: LayoutView; name: string; description: string; icon: typeof Rows3 }>;

const pages: Array<{ key: LayoutViewPage; label: string; description: string; href: string }> = [
  { key: "dashboard", label: "Dashboard", description: "Your command center and priority modules.", href: "/" },
  { key: "money", label: "Money Snapshot", description: "Accounts, available cash, and paycheck planning.", href: "/money" },
  { key: "bills", label: "Bills", description: "Due dates, payment pressure, and bill records.", href: "/bills" },
  { key: "inventory", label: "Inventory", description: "Stock levels, refill needs, and purchase priorities.", href: "/inventory" },
  { key: "transactions", label: "Transactions", description: "Income, spending, receipts, and transfers.", href: "/transactions" },
  { key: "reports", label: "Reports", description: "Cash-flow analysis, categories, and forecasts.", href: "/reports" },
];

export function LayoutViewSettings({ value, onChange }: { value: LayoutViews; onChange: (next: LayoutViews) => void }) {
  return (
    <div className="layout-view-settings">
      <header className="layout-view-settings-intro">
        <div>
          <p className="settings-kicker">Independent page layouts</p>
          <h2>Choose how each workspace thinks</h2>
          <p>Every view uses the same saved data and calculations. Only the hierarchy and interaction model change.</p>
        </div>
        <span>5 views · 6 pages</span>
      </header>
      <div className="layout-view-page-list">
        {pages.map((page) => (
          <section className="layout-view-page-card" key={page.key} aria-labelledby={`layout-view-${page.key}`}>
            <div className="layout-view-page-heading">
              <div>
                <h3 id={`layout-view-${page.key}`}>{page.label}</h3>
                <p>{page.description}</p>
              </div>
              <a href={page.href}>Open page</a>
            </div>
            <div className="layout-view-choice-grid" role="radiogroup" aria-label={`${page.label} layout view`}>
              {layoutViewOptions.map((option) => {
                const Icon = option.icon;
                const selected = value[page.key] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={selected ? "is-selected" : undefined}
                    onClick={() => onChange({ ...value, [page.key]: option.id })}
                  >
                    <span className="layout-view-choice-icon"><Icon size={18} aria-hidden="true" /></span>
                    <span><strong>{option.id}. {option.name}</strong><small>{option.description}</small></span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function layoutViewClass(view: LayoutView) {
  return `layout-view layout-view-${view}`;
}
