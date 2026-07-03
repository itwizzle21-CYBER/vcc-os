import { TrendingUp, Target } from "lucide-react";
import { Link } from "wouter";

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
    <Link href="/savings">
      <a className="rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl p-6 shadow-2xl h-full flex flex-col hover:border-slate-600/50 transition-all duration-300 cursor-pointer group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Savings</h3>
          <TrendingUp className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors" />
        </div>

        {/* Key Metrics */}
        <div className="space-y-3 flex-1">
          <div className="p-3 rounded-lg bg-slate-700/20 border border-slate-600/30">
            <p className="text-xs text-slate-400 mb-1">Total Saved</p>
            <p className="text-lg font-bold text-green-400">${savingsData.totalSavings.toFixed(2)}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-700/20 border border-slate-600/30">
            <p className="text-xs text-slate-400 mb-1">Goal Amount</p>
            <p className="text-lg font-bold text-blue-400">${savingsData.totalGoalAmount.toFixed(2)}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-700/20 border border-slate-600/30">
            <p className="text-xs text-slate-400 mb-1">Monthly Contribution</p>
            <p className="text-lg font-bold text-purple-400">${savingsData.monthlyContribution.toFixed(2)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Progress</span>
            <span className="text-xs font-bold text-green-400">{savingsData.savingsPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" style={{ width: `${Math.min(100, savingsData.savingsPercentage)}%` }} />
          </div>
        </div>

        {/* CTA */}
        <button className="w-full py-2 px-3 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-600/30 hover:border-green-500/50 transition-all group-hover:bg-green-600/40">
          View Goals →
        </button>
      </a>
    </Link>
  );
}
