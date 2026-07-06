import { AlertCircle, TrendingDown } from "lucide-react";

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
    <a
      href="/debts"
      className="group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-600/50"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Debt</h3>
        <TrendingDown className="h-5 w-5 text-red-400 transition-colors group-hover:text-red-300" />
      </div>

      {debtData.averageInterestRate > 10 && (
        <div className="mb-4 rounded-lg border border-orange-500/20 bg-orange-500/10 p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <div>
              <p className="text-sm font-semibold text-orange-400">High Interest Rate</p>
              <p className="text-xs text-orange-300">Consider accelerating payments</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3">
        <div className="rounded-lg border border-slate-600/30 bg-slate-700/20 p-3">
          <p className="mb-1 text-xs text-slate-400">Total Debt</p>
          <p className="text-lg font-bold text-red-400">${debtData.totalDebt.toFixed(2)}</p>
        </div>

        <div className="rounded-lg border border-slate-600/30 bg-slate-700/20 p-3">
          <p className="mb-1 text-xs text-slate-400">Monthly Payment</p>
          <p className="text-lg font-bold text-orange-400">
            ${debtData.monthlyPaymentRequired.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg border border-slate-600/30 bg-slate-700/20 p-3">
          <p className="mb-1 text-xs text-slate-400">Avg Interest Rate</p>
          <p className="text-lg font-bold text-yellow-400">
            {debtData.averageInterestRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <button className="mt-4 w-full rounded-lg border border-red-500/30 bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:border-red-500/50 hover:bg-red-600/30 group-hover:bg-red-600/40">
        View Debts -&gt;
      </button>
    </a>
  );
}
