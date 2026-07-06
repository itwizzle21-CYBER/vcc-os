import { CheckCircle2, Circle, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import type { TodayMission } from "./decisionEngine";

interface Mission {
  id: number;
  title: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  category: string;
}

interface TodaysMissionProps {
  data?: TodayMission;
}

export default function TodaysMissionCard({ data }: TodaysMissionProps) {
  const [isCompleted, setIsCompleted] = useState(data?.completed || false);
  const [tasks, setTasks] = useState<Mission[]>(data?.supportingTasks || []);

  if (!data) return null;

  const toggleMission = (id: number) => {
    setTasks(tasks.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)));
  };

  const completed = tasks.filter((m) => m.completed).length + (isCompleted ? 1 : 0);
  const total = tasks.length + 1;
  const progress = Math.round((completed / total) * 100);

  const priorityColor = {
    high: "text-red-400 bg-red-500/10",
    medium: "text-yellow-400 bg-yellow-500/10",
    low: "text-slate-400 bg-slate-500/10",
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-white">Today's Mission</h3>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            Score {data.score}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCompleted(!isCompleted)}
          className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
            isCompleted
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-cyan-500/30 bg-cyan-500/10 hover:border-cyan-400/60"
          }`}
        >
          <div className="flex items-start gap-3">
            {isCompleted ? (
              <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <Target className="mt-1 h-5 w-5 flex-shrink-0 text-cyan-300" />
            )}
            <div className="min-w-0">
              <p className="text-base font-bold text-white">{data.title}</p>
              <p className="mt-1 text-sm text-slate-300">
                {data.amount} due {data.dueDate.toLowerCase()}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{data.reason}</p>
            </div>
          </div>
        </button>

        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <TrendingUp className="h-4 w-4" />
            <p className="text-sm font-bold">Today's Recommended Move</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-white">{data.recommendedMove}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {data.recommendedExplanation}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              {completed} of {total} completed
            </span>
            <span className="text-sm font-bold text-cyan-400">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((mission) => (
          <button
            type="button"
            key={mission.id}
            onClick={() => toggleMission(mission.id)}
            className={`group w-full rounded-lg border p-3 text-left transition-all duration-200 ${
              mission.completed
                ? "border-slate-700/30 bg-slate-700/20"
                : "border-slate-600/50 bg-slate-700/40 hover:border-slate-500/50 hover:bg-slate-700/60"
            }`}
          >
            <div className="flex items-start gap-3">
              {mission.completed ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500 group-hover:text-slate-400" />
              )}

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    mission.completed ? "text-slate-500 line-through" : "text-slate-200"
                  }`}
                >
                  {mission.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                      priorityColor[mission.priority]
                    }`}
                  >
                    {mission.priority.charAt(0).toUpperCase() + mission.priority.slice(1)}
                  </span>
                  <span className="truncate text-xs text-slate-500">{mission.category}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
