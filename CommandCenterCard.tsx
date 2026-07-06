import { AlertTriangle, CalendarClock, CheckCircle, Info, Target, TrendingUp } from "lucide-react";
import type { PriorityAlert, TodayMission } from "./decisionEngine";

interface Highlight {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

interface CommandCenterProps {
  briefing: {
    summary: string;
    highlights: Highlight[];
  };
  mission: TodayMission;
  alerts: PriorityAlert[];
}

export default function CommandCenterCard({ briefing, mission, alerts }: CommandCenterProps) {
  const topAlerts = alerts.slice(0, 2);

  return (
    <a
      href="/activity"
      className="block rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 p-5 shadow-2xl outline-none backdrop-blur-xl transition hover:border-cyan-500/30 focus-visible:ring-2 focus-visible:ring-cyan-400 sm:p-8"
    >
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
            Command Center
          </p>
          <h2 className="text-2xl font-bold text-white">Today&apos;s mission and briefing</h2>
        </div>
        <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 text-sm font-bold text-cyan-200">
          Score {mission.score}
        </span>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-slate-300 sm:text-base">{briefing.summary}</p>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {briefing.highlights.map((highlight) => (
          <div key={highlight.title} className="rounded-xl border border-slate-600/30 bg-slate-700/20 p-4">
            <p className="mb-2 text-sm font-medium text-slate-400">{highlight.title}</p>
            <div className="flex items-center justify-between gap-3">
              <p className="break-words text-xl font-bold text-white">{highlight.value}</p>
              <TrendingUp
                className={`h-4 w-4 flex-shrink-0 ${
                  highlight.trend === "up" ? "text-emerald-400" : "rotate-180 text-red-400"
                }`}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">{highlight.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <div className="mb-3 flex items-start gap-3">
            <Target className="mt-1 h-5 w-5 flex-shrink-0 text-cyan-300" />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">{mission.title}</h3>
              <p className="mt-1 text-sm text-slate-300">
                {mission.amount} due {mission.dueDate.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-2 text-emerald-300">
              <CalendarClock className="h-4 w-4" />
              <p className="text-sm font-bold">Recommended move</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{mission.recommendedMove}</p>
          </div>
        </div>

        <div className="space-y-3">
          {topAlerts.map((alert) => (
            <div key={alert.id} className="rounded-xl border border-slate-600/30 bg-slate-950/30 p-4">
              <div className="mb-2 flex items-start gap-2">
                {alert.type === "warning" && <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />}
                {alert.type === "success" && <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />}
                {alert.type === "info" && <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />}
                <p className="text-sm font-semibold text-white">{alert.title}</p>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </a>
  );
}
