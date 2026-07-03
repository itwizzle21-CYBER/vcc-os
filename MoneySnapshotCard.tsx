import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Breakdown {
  label: string;
  value: string;
  percentage: number;
}

interface MoneySnapshotProps {
  data?: {
    totalAssets: string;
    totalLiabilities: string;
    netWorth: string;
    monthlyIncome: string;
    monthlyExpenses: string;
    monthlyNet: string;
    breakdown: Breakdown[];
    liabilityBreakdown: Breakdown[];
  };
}

export default function MoneySnapshotCard({ data }: MoneySnapshotProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl p-8 shadow-2xl">
      {/* Net Worth Banner */}
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
        <p className="text-slate-400 text-sm font-medium mb-2">Net Worth</p>
        <p className="text-4xl font-bold text-white">{data.netWorth}</p>
        <p className="text-emerald-400 text-sm mt-2">
          ↑ $450 from last month
        </p>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {/* Assets */}
        <div className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
          <p className="text-slate-400 text-xs font-medium mb-2">Total Assets</p>
          <p className="text-xl font-bold text-white">{data.totalAssets}</p>
        </div>

        {/* Liabilities */}
        <div className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
          <p className="text-slate-400 text-xs font-medium mb-2">
            Total Liabilities
          </p>
          <p className="text-xl font-bold text-red-400">{data.totalLiabilities}</p>
        </div>

        {/* Monthly Income */}
        <div className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
          <p className="text-slate-400 text-xs font-medium mb-2">
            Monthly Income
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-emerald-400">
              {data.monthlyIncome}
            </p>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
          <p className="text-slate-400 text-xs font-medium mb-2">
            Monthly Expenses
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-orange-400">
              {data.monthlyExpenses}
            </p>
            <ArrowDownLeft className="w-4 h-4 text-orange-400" />
          </div>
        </div>

        {/* Monthly Net */}
        <div className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
          <p className="text-slate-400 text-xs font-medium mb-2">Monthly Net</p>
          <p className="text-xl font-bold text-cyan-400">{data.monthlyNet}</p>
        </div>
      </div>

      {/* Breakdown sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Assets breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-4">
            Asset Allocation
          </h4>
          <div className="space-y-3">
            {data.breakdown.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-sm font-semibold text-white">
                    {item.value}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-4">
            Liability Breakdown
          </h4>
          <div className="space-y-3">
            {data.liabilityBreakdown.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-sm font-semibold text-white">
                    {item.value}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
