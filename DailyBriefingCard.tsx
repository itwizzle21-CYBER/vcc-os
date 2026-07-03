import { TrendingUp, TrendingDown } from "lucide-react";

interface Highlight {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

interface DailyBriefingProps {
  data?: {
    greeting: string;
    date: string;
    summary: string;
    highlights: Highlight[];
  };
}

export default function DailyBriefingCard({ data }: DailyBriefingProps) {
  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl p-8 shadow-2xl">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

      <div className="relative z-10">
        {/* Main message */}
        <div className="mb-8">
          <p className="text-slate-300 text-lg leading-relaxed">{data.summary}</p>
        </div>

        {/* Highlights grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.highlights.map((highlight, idx) => (
            <div
              key={idx}
              className="group relative rounded-xl bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-600/30 p-4 hover:border-slate-500/50 transition-all duration-300"
            >
              <p className="text-slate-400 text-sm font-medium mb-2">
                {highlight.title}
              </p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-white">{highlight.value}</p>
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    highlight.trend === "up"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {highlight.trend === "up" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-2">{highlight.change}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
