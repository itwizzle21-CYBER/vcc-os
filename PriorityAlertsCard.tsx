import { AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";

interface Alert {
  id: number;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
}

interface PriorityAlertsProps {
  data?: Alert[];
}

export default function PriorityAlertsCard({ data }: PriorityAlertsProps) {
  if (!data) return null;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
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
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl p-6 shadow-2xl h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-4">Priority Alerts</h3>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {data.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertColor(alert.type)} hover:border-opacity-100 transition-all duration-200 cursor-pointer group`}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm mb-1">
                  {alert.title}
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed mb-2">
                  {alert.message}
                </p>
                <a
                  href={alert.actionUrl}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {alert.actionLabel} →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
