import { ShoppingCart, AlertCircle } from "lucide-react";

interface BuyItem {
  id: number;
  name: string;
  category: string;
  status: "Critical" | "Low" | "Good";
  lastPurchased: string;
  estimatedCost: string;
  priority: number;
}

interface BuyNextProps {
  data?: BuyItem[];
}

export default function BuyNextCard({ data }: BuyNextProps) {
  if (!data) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "Low":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "Good":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  const criticalCount = data.filter((item) => item.status === "Critical").length;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl p-6 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Buy Next</h3>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400">
              {criticalCount} Critical
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {data.map((item) => (
          <div
            key={item.id}
            className="group p-3 rounded-lg bg-slate-700/20 border border-slate-600/30 hover:bg-slate-700/40 hover:border-slate-500/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-white truncate">
                    {item.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-6">
                  <span className="text-xs text-slate-500">{item.category}</span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-500">
                    {item.lastPurchased}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold border ${getStatusColor(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
                <p className="text-sm font-semibold text-slate-300 min-w-fit">
                  {item.estimatedCost}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with total */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500">
          Estimated total: $
          {(
            data.reduce((sum, item) => {
              const cost = parseFloat(item.estimatedCost.replace("$", ""));
              return sum + cost;
            }, 0)
          ).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
