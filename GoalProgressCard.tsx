import { Shield, Home, Car, Zap, Activity } from "lucide-react";

interface Goal {
  id: number;
  name: string;
  current: string;
  target: string;
  percentage: number;
  daysRemaining: number;
  monthlyContribution: string;
  icon: string;
}

interface GoalProgressProps {
  data?: Goal[];
}

export default function GoalProgressCard({ data }: GoalProgressProps) {
  if (!data) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "shield":
        return <Shield className="w-5 h-5" />;
      case "home":
        return <Home className="w-5 h-5" />;
      case "car":
        return <Car className="w-5 h-5" />;
      case "zap":
        return <Zap className="w-5 h-5" />;
      case "activity":
        return <Activity className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getGoalColor = (name: string) => {
    switch (name) {
      case "Emergency Fund":
        return "from-blue-500 to-cyan-500";
      case "Move Out Fund":
        return "from-purple-500 to-pink-500";
      case "Vehicle Fund":
        return "from-orange-500 to-red-500";
      case "Debt-Free":
        return "from-emerald-500 to-teal-500";
      case "Fitness":
        return "from-yellow-500 to-orange-500";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl p-8 shadow-2xl">
      <h3 className="text-2xl font-bold text-white mb-8">Goal Progress</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {data.map((goal) => (
          <div
            key={goal.id}
            className="group relative rounded-xl bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-600/30 p-5 hover:border-slate-500/50 transition-all duration-300 overflow-hidden"
          >
            {/* Background accent */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${getGoalColor(
                goal.name
              )} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}
            />

            <div className="relative z-10">
              {/* Icon and name */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${getGoalColor(
                    goal.name
                  )} text-white`}
                >
                  {getIcon(goal.icon)}
                </div>
                <h4 className="font-semibold text-white text-sm truncate">
                  {goal.name}
                </h4>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Progress</span>
                  <span className="text-sm font-bold text-white">
                    {goal.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getGoalColor(
                      goal.name
                    )} rounded-full transition-all duration-300`}
                    style={{ width: `${goal.percentage}%` }}
                  />
                </div>
              </div>

              {/* Current vs Target */}
              <div className="space-y-2 mb-3 pb-3 border-b border-slate-600/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Current</span>
                  <span className="text-sm font-semibold text-cyan-400">
                    {goal.current}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Target</span>
                  <span className="text-sm font-semibold text-white">
                    {goal.target}
                  </span>
                </div>
              </div>

              {/* Timeline and contribution */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Timeline</span>
                  <span className="text-slate-300 font-medium">
                    {goal.daysRemaining} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Monthly</span>
                  <span className="text-slate-300 font-medium">
                    {goal.monthlyContribution}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
