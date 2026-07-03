import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Mission {
  id: number;
  title: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  category: string;
}

interface TodaysMissionProps {
  data?: Mission[];
}

export default function TodaysMissionCard({ data }: TodaysMissionProps) {
  const [missions, setMissions] = useState<Mission[]>(data || []);

  const toggleMission = (id: number) => {
    setMissions(
      missions.map((m) =>
        m.id === id ? { ...m, completed: !m.completed } : m
      )
    );
  };

  const completed = missions.filter((m) => m.completed).length;
  const total = missions.length;
  const progress = Math.round((completed / total) * 100);

  const priorityColor = {
    high: "text-red-400 bg-red-500/10",
    medium: "text-yellow-400 bg-yellow-500/10",
    low: "text-slate-400 bg-slate-500/10",
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl p-6 shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-3">Today's Mission</h3>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">
              {completed} of {total} completed
            </span>
            <span className="text-sm font-bold text-cyan-400">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mission list */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {missions.map((mission) => (
          <div
            key={mission.id}
            onClick={() => toggleMission(mission.id)}
            className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              mission.completed
                ? "bg-slate-700/20 border border-slate-700/30"
                : "bg-slate-700/40 border border-slate-600/50 hover:bg-slate-700/60 hover:border-slate-500/50"
            }`}
          >
            <div className="flex items-start gap-3">
              {mission.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5 group-hover:text-slate-400" />
              )}

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    mission.completed
                      ? "text-slate-500 line-through"
                      : "text-slate-200"
                  }`}
                >
                  {mission.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      priorityColor[mission.priority]
                    }`}
                  >
                    {mission.priority.charAt(0).toUpperCase() +
                      mission.priority.slice(1)}
                  </span>
                  <span className="text-xs text-slate-500">{mission.category}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
