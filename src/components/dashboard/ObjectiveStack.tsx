import { labelFor } from "../../lib/calculations/helpers";
import type { Alert, AppView } from "../../lib/types/vcc";

export function ObjectiveStack({
  alerts,
  open,
}: {
  alerts: Alert[];
  open: (view: AppView) => void;
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="stack">
      <div className="stackHead">
        <p>OBJECTIVE_STACK</p>
        <span>{alerts.length} ACTIVE</span>
      </div>

      {alerts.slice(0, 7).map((alert, index) => (
        <button key={`${alert.title}-${index}`} className={`stackItem ${alert.level.toLowerCase()}`} onClick={() => open(alert.source)}>
          <span>{index + 1}</span>
          <div>
            <p>{alert.level} / {labelFor(alert.source)}</p>
            <h3>{alert.title}</h3>
            <small>{alert.proof}</small>
          </div>
        </button>
      ))}
    </div>
  );
}
