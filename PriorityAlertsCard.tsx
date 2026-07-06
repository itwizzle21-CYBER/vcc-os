import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface Alert {
  id: number;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
  score?: number;
}

interface PriorityAlertsProps {
  data?: Alert[];
}

export default function PriorityAlertsCard({ data }: PriorityAlertsProps) {
  if (!data) return null;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-amber-500/10 border-amber-500/20";
      case "success":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "info":
      default:
        return "bg-blue-500/10 border-blue-500/20";
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Priority Alerts</h3>
        <span className="rounded-full border border-slate-600/50 px-3 py-1 text-xs font-semibold text-slate-300">
          Ranked
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {data.map((alert) => (
          <div
            key={alert.id}
            className={`group rounded-lg border p-4 transition-all duration-200 hover:border-opacity-100 ${getAlertColor(
              alert.type
            )}`}
          >
            <div className="flex gap-3">
              <div className="mt-0.5 flex-shrink-0">{getAlertIcon(alert.type)}</div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">{alert.title}</h4>
                  {typeof alert.score === "number" && (
                    <span className="rounded-full bg-slate-950/40 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                      {alert.score}
                    </span>
                  )}
                </div>
                <p className="mb-2 text-xs leading-relaxed text-slate-400">{alert.message}</p>
                <a
                  href={alert.actionUrl}
                  className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
                >
                  {alert.actionLabel} -&gt;
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
