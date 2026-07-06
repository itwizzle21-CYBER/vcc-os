import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

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
    cashAfterDueBills: string;
    dueBillsTotal: string;
    savingsCoverage: string;
    breakdown: Breakdown[];
    liabilityBreakdown: Breakdown[];
    accounts: Breakdown[];
  };
}

export default function MoneySnapshotCard({ data }: MoneySnapshotProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="mb-6 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-5 sm:mb-8 sm:p-6">
        <p className="mb-2 text-sm font-medium text-slate-400">Net Worth</p>
        <p className="break-words text-3xl font-bold text-white sm:text-4xl">{data.netWorth}</p>
        <p className="mt-2 text-sm text-emerald-400">Assets minus known liabilities</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Assets" value={data.totalAssets} tone="white" />
        <Metric label="Total Liabilities" value={data.totalLiabilities} tone="red" />
        <Metric label="Monthly Income" value={data.monthlyIncome} tone="emerald" icon="up" />
        <Metric label="Monthly Expenses" value={data.monthlyExpenses} tone="orange" icon="down" />
        <Metric label="Monthly Net" value={data.monthlyNet} tone="cyan" />
        <Metric label="7-Day Bills" value={data.dueBillsTotal} tone="cyan" accent />
        <Metric label="Cash After Bills" value={data.cashAfterDueBills} tone="emerald" accent />
        <Metric label="Savings Coverage" value={data.savingsCoverage} tone="white" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
        <BreakdownGroup
          title="Asset Allocation"
          items={data.breakdown}
          barClassName="from-blue-500 to-cyan-500"
        />
        <BreakdownGroup
          title="Liability Breakdown"
          items={data.liabilityBreakdown}
          barClassName="from-red-500 to-orange-500"
        />
      </div>

      {data.accounts.length > 0 && (
        <div className="mt-6 border-t border-slate-700/50 pt-6 sm:mt-8 sm:pt-8">
          <BreakdownGroup title="Accounts" items={data.accounts} barClassName="from-cyan-500 to-emerald-500" />
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  icon,
  accent,
}: {
  label: string;
  value: string;
  tone: "white" | "red" | "emerald" | "orange" | "cyan";
  icon?: "up" | "down";
  accent?: boolean;
}) {
  const toneClass = {
    white: "text-white",
    red: "text-red-400",
    emerald: "text-emerald-400",
    orange: "text-orange-400",
    cyan: "text-cyan-400",
  }[tone];
  const accentClass = accent
    ? tone === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : "border-cyan-500/20 bg-cyan-500/10"
    : "border-slate-600/30 bg-slate-700/20";

  return (
    <div className={`min-h-24 rounded-lg border p-4 ${accentClass}`}>
      <p className="mb-2 text-xs font-medium text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`break-words text-xl font-bold ${toneClass}`}>{value}</p>
        {icon === "up" && <ArrowUpRight className={`h-4 w-4 ${toneClass}`} />}
        {icon === "down" && <ArrowDownLeft className={`h-4 w-4 ${toneClass}`} />}
      </div>
    </div>
  );
}

function BreakdownGroup({
  title,
  items,
  barClassName,
}: {
  title: string;
  items: Breakdown[];
  barClassName: string;
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold text-slate-300">{title}</h4>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-slate-400">{item.label}</span>
              <span className="flex-shrink-0 text-sm font-semibold text-white">{item.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barClassName}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.percentage}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
