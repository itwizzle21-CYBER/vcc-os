import { TrendingUp } from "lucide-react";

interface SavingsCardProps {
  data?: {
    totalSavings: number;
    totalGoalAmount: number;
    savingsPercentage: number;
    monthlyContribution: number;
  };
}

export default function SavingsCard({ data }: SavingsCardProps) {
  const savingsData = data || {
    totalSavings: 26000,
    totalGoalAmount: 60000,
    savingsPercentage: 43.3,
    monthlyContribution: 750,
  };

  return (
    <a
      href="/savings"
      className="group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-600/50"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Savings</h3>
        <TrendingUp className="h-5 w-5 text-green-400 transition-colors group-hover:text-green-300" />
      </div>

      <div className="flex-1 space-y-3">
        <div className="rounded-lg border border-slate-600/30 bg-slate-700/20 p-3">
          <p className="mb-1 text-xs text-slate-400">Total Saved</p>
          <p className="text-lg font-bold text-green-400">
            ${savingsData.totalSavings.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg border border-slate-600/30 bg-slate-700/20 p-3">
          <p className="mb-1 text-xs text-slate-400">Goal Amount</p>
          <p className="text-lg font-bold text-blue-400">
            ${savingsData.totalGoalAmount.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg border border-slate-600/30 bg-slate-700/20 p-3">
          <p className="mb-1 text-xs text-slate-400">Monthly Contribution</p>
          <p className="text-lg font-bold text-purple-400">
            ${savingsData.monthlyContribution.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mb-4 mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-bold text-green-400">
            {savingsData.savingsPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.min(100, savingsData.savingsPercentage)}%` }}
          />
        </div>
      </div>

      <button className="w-full rounded-lg border border-green-500/30 bg-green-600/20 px-3 py-2 text-sm font-medium text-green-400 transition-all hover:border-green-500/50 hover:bg-green-600/30 group-hover:bg-green-600/40">
        View Goals -&gt;
      </button>
    </a>
  );
}
