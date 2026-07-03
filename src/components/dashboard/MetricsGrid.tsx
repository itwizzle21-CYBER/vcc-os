import { labelFor, money } from "../../lib/calculations/helpers";
import type { AppView, Metrics, SectionKey } from "../../lib/types/vcc";

export function MetricsGrid({
  metrics,
  alertCount,
  open,
}: {
  metrics: Metrics;
  alertCount: number;
  open: (view: AppView) => void;
}) {
  return (
    <div className="topMetricCards">
      <button className={`moneyHeroCard ${metrics.spendableCash < 0 ? "danger" : ""}`} onClick={() => open("money")}>
        <span>Spendable</span>
        <strong>{money(metrics.spendableCash)}</strong>
        <small>{metrics.spendableCash >= 0 ? "+ Ready" : "- Blocked"}</small>
        <div>
          <span>Operating {money(metrics.operatingCash)}</span>
        </div>
      </button>

      <ProofCard label="Protected" value={money(metrics.protectedSavings)} source="savings" open={open} trend="+ Protected" />
      <ProofCard label="Alerts" value={String(alertCount)} source="alerts" open={open} danger={alertCount > 0} trend={alertCount > 0 ? "- Action" : "+ Clear"} />
    </div>
  );
}

function ProofCard({
  label,
  value,
  source,
  open,
  danger = false,
  trend,
}: {
  label: string;
  value: string;
  source: SectionKey;
  open: (view: AppView) => void;
  danger?: boolean;
  trend: string;
}) {
  return (
    <button className={`proofCard ${danger ? "danger" : ""}`} onClick={() => open(source)}>
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{trend}</span>
      <small>{labelFor(source)}</small>
    </button>
  );
}
