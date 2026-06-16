import { AlertCircle, Calendar, DollarSign } from "lucide-react";
import { Link } from "wouter";

interface BillsCardProps {
  data?: {
    overdueBills: number;
    upcomingBills: number;
    totalDue: number;
  };
}

export default function BillsCard({ data }: BillsCardProps) {
  // Use sample data if not provided
  const billsData = data || {
    overdueBills: 1,
    upcomingBills: 3,
    totalDue: 250.49,
  };

  return (
    <Link href="/bills">
      <a className="rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl p-6 shadow-2xl h-full flex flex-col hover:border-slate-600/50 transition-all duration-300 cursor-pointer group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Bills</h3>
          <DollarSign className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
        </div>

        {/* Overdue Alert */}
        {billsData.overdueBills > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-400">
                  {billsData.overdueBills} Overdue
                </p>
                <p className="text-xs text-red-300">Action required</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="space-y-3 flex-1">
          <div className="p-3 rounded-lg bg-slate-700/20 border border-slate-600/30">
            <p className="text-xs text-slate-400 mb-1">Upcoming (7 days)</p>
            <p className="text-lg font-bold text-white">{billsData.upcomingBills}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-700/20 border border-slate-600/30">
            <p className="text-xs text-slate-400 mb-1">Total Due</p>
            <p className="text-lg font-bold text-orange-400">
              ${billsData.totalDue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* CTA */}
        <button className="mt-4 w-full py-2 px-3 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-600/30 hover:border-blue-500/50 transition-all group-hover:bg-blue-600/40">
          View Bills →
        </button>
      </a>
    </Link>
  );
}
