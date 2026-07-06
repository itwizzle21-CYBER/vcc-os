import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { formatSignedCurrency, type Transaction } from "./transactionEngine";

interface TransactionsPageProps {
  transactions: Transaction[];
}

const filters = ["All", "Income", "Transfers", "Bills", "Savings"] as const;

export default function TransactionsPage({ transactions }: TransactionsPageProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const filtered = useMemo(() => {
    if (activeFilter === "All") return transactions;
    if (activeFilter === "Transfers") return transactions.filter((item) => item.type === "transfer");
    if (activeFilter === "Bills") return transactions.filter((item) => item.type === "bill");
    if (activeFilter === "Savings") return transactions.filter((item) => item.type === "savings");
    return transactions.filter((item) => item.type === "income");
  }, [activeFilter, transactions]);

  return (
    <div className="space-y-4">
      <div className="sticky top-[65px] z-30 rounded-2xl border border-slate-700/50 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl md:static md:bg-slate-800/40">
        <div className="mb-3 flex min-h-11 items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 text-slate-400">
          <Search className="h-4 w-4" />
          <span className="text-sm">Search synced transactions</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`min-h-11 flex-shrink-0 rounded-lg border px-4 text-sm font-semibold ${
                activeFilter === filter
                  ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-700/70 bg-slate-900/60 text-slate-300"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filtered.map((transaction) => (
          <article
            key={transaction.id}
            className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-xl"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{transaction.title}</p>
                <p className="mt-1 text-xs text-slate-400">{transaction.account}</p>
              </div>
              <p className={`text-base font-black ${transaction.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatSignedCurrency(transaction.amount)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-slate-700/70 bg-slate-950/40 px-2 py-1 text-xs font-semibold capitalize text-slate-300">
                {transaction.type}
              </span>
              <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-200">
                {transaction.linkedSource.replace("-", " ")}
              </span>
              <span className="ml-auto inline-flex min-h-8 items-center text-xs text-slate-500">
                {transaction.date}
              </span>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 text-center text-slate-400">
          <Filter className="mx-auto mb-3 h-5 w-5" />
          No transactions match this filter yet.
        </div>
      )}
    </div>
  );
}
