import type { Alert, AppView } from "../../lib/types/vcc";

export function BriefingCard({
  topAlert,
  open,
}: {
  topAlert: Alert | undefined;
  open: (view: AppView) => void;
}) {
  return (
    <div className="hero">
      <div>
        <div className="statusline">
          <span className="online">ONLINE</span>
          <span>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
        </div>

        <p className="kicker">TODAY_BRIEFING</p>
        <h1>{topAlert ? topAlert.title : "VCC is clear right now"}</h1>
        <p className="heroText">
          {topAlert
            ? topAlert.action
            : "Keep the numbers updated. Use operating cash first and keep savings protected."}
        </p>
      </div>

      <button className="primary" onClick={() => open(topAlert?.source ?? "missions")}>
        Investigate
      </button>
    </div>
  );
}
