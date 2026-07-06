import { AlertCircle, DollarSign } from "lucide-react";

interface BillsCardProps {
  data?: {
    overdueBills: number;
    upcomingBills: number;
    totalDue: number;
  };
}

export default function BillsCard({ data }: BillsCardProps) {
  const billsData = data || {
    overdueBills: 0,
    upcomingBills: 3,
    totalDue: 851.22,
  };

  return (
    <a
      href="/bills"
      className="group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-600/50"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Bills</h3>
        <DollarSign className="h-5 w-5 text-blue-400 transition-colors group-hover:text-blue-300" />
      </div>

      {billsData.overdueBills > 0 && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-400">
                {billsData.overdueBills} Overdue
              </p>
              <p className="text-xs text-red-300">Action required</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3">
        <div className="rounded-lg border border-slate-600/30 bg-slate-700/20 p-3">
          <p className="mb-1 text-xs text-slate-400">Upcoming (7 days)</p>
          <p className="text-lg font-bold text-white">{billsData.upcomingBills}</p>
        </div>

        <div className="rounded-lg border border-slate-600/30 bg-slate-700/20 p-3">
          <p className="mb-1 text-xs text-slate-400">Total Due</p>
          <p className="text-lg font-bold text-orange-400">${billsData.totalDue.toFixed(2)}</p>
        </div>
      </div>

      <button className="mt-4 w-full rounded-lg border border-blue-500/30 bg-blue-600/20 px-3 py-2 text-sm font-medium text-blue-400 transition-all hover:border-blue-500/50 hover:bg-blue-600/30 group-hover:bg-blue-600/40">
        View Bills -&gt;
      </button>
    </a>
  );
}
