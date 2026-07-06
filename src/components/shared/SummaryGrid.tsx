import { formatCurrency } from "../../lib/calculations/currency";

interface SummaryGridProps {
  items: Array<{ label: string; value: string | number; tone?: "good" | "warn" | "bad" | "neutral" }>;
}

export default function SummaryGrid({ items }: SummaryGridProps) {
  return (
    <div className="summary-grid">
      {items.map((item) => (
        <div key={item.label} className={`summary-card ${item.tone || "neutral"}`}>
          <span>{item.label}</span>
          <strong>{typeof item.value === "number" ? formatCurrency(item.value) : item.value}</strong>
        </div>
      ))}
    </div>
  );
}
