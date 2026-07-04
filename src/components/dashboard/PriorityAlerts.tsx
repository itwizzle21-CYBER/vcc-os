import { labelFor } from "../../lib/calculations/helpers";
import type { Alert, AppView } from "../../lib/types/vcc";

export function PriorityAlerts({
  alerts,
  open,
}: {
  alerts: Alert[];
  open: (view: AppView) => void;
}) {
  if (alerts.length === 0) {
    return (
      <div className="empty">
        <h2>No major blockers detected.</h2>
        <p>Keep the dashboard updated and VCC will keep watching.</p>
      </div>
    );
  }

  return (
    <div className="alertGrid">
      {alerts.map((alert, index) => (
        <button key={`${alert.title}-${index}`} className={`alert ${alert.level.toLowerCase()}`} onClick={() => open(alert.source)}>
          <p>{alert.level} / {labelFor(alert.source)}</p>
          <h2>{alert.title}</h2>
          <span>{alert.proof}</span>
          <strong>{alert.action}</strong>
        </button>
      ))}
    </div>
  );
}
