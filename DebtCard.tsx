import { TrendingDown, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface DebtCardProps {
  data?: {
    totalDebt: number;
    activeDebts: number;
    monthlyPaymentRequired: number;
    averageInterestRate: number;
  };
}

export default function DebtCard({ data }: DebtCardProps) {
  const debtData = data || {
    totalDebt: 19950.5,
    activeDebts: 3,
    monthlyPaymentRequired: 600,
    averageInterestRate: 10.3,
  };

  return (
    <Link href="/debt">
      <a className="rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl p-6 shadow-2xl h-full flex flex-col hover:border-slate-600/50 transition-all duration-300 cursor-pointer group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Debt</h3>
          <TrendingDown className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
        </div>

        {/* Alert */}
        {debtData.averageInterestRate > 10 && (
          <div className="mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-sm font-semibold text-orange-400">High Interest Rate</p>
                <p className="text-xs text-orange-300">Consider accelerating payments</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="space-y-3 flex-1">
          <div className="p-3 rounded-lg bg-slate-700/20 border border-slate-600/30">
            <p className="text-xs text-slate-400 mb-1">Total Debt</p>
            <p className="text-lg font-bold text-red-400">${debtData.totalDebt.toFixed(2)}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-700/20 border border-slate-600/30">
            <p className="text-xs text-slate-400 mb-1">Monthly Payment</p>
            <p className="text-lg font-bold text-orange-400">${debtData.monthlyPaymentRequired.toFixed(2)}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-700/20 border border-slate-600/30">
            <p className="text-xs text-slate-400 mb-1">Avg Interest Rate</p>
            <p className="text-lg font-bold text-yellow-400">{debtData.averageInterestRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* CTA */}
        <button className="mt-4 w-full py-2 px-3 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-600/30 hover:border-red-500/50 transition-all group-hover:bg-red-600/40">
          View Debts →
        </button>
      </a>
    </Link>
  );
}
