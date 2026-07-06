import BillsCard from "./BillsCard";
import BuyNextCard from "./BuyNextCard";
import CommandCenterCard from "./CommandCenterCard";
import DebtCard from "./DebtCard";
import GoalProgressCard from "./GoalProgressCard";
import MoneySnapshotCard from "./MoneySnapshotCard";
import SavingsCard from "./SavingsCard";
import {
  sampleBuyNext,
  sampleDailyBriefing,
  sampleGoalProgress,
  samplePriorityAlerts,
  sampleTodaysMission,
} from "./data";
import type { DerivedFinancialState } from "./transactionEngine";

interface DashboardProps {
  financials: DerivedFinancialState;
}

export default function Dashboard({ financials }: DashboardProps) {
  return (
    <>
      <div className="mb-5 sm:mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          VCC Mission Control
        </p>
        <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
          {sampleDailyBriefing.greeting}
        </h1>
        <p className="text-base text-slate-400 sm:text-lg">{sampleDailyBriefing.date}</p>
      </div>

      <section className="mb-5 sm:mb-8" aria-label="Command Center">
        <CommandCenterCard
          briefing={sampleDailyBriefing}
          mission={sampleTodaysMission}
          alerts={samplePriorityAlerts}
        />
      </section>

      <section className="mb-5 sm:mb-8" aria-label="Money Snapshot">
        <a
          href="/money"
          className="block rounded-2xl outline-none transition hover:scale-[1.002] focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <MoneySnapshotCard data={financials.moneySnapshot} />
        </a>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 lg:grid-cols-3" aria-label="Core command cards">
        <BillsCard data={financials.billsCard} />
        <a href="/inventory" className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
          <BuyNextCard data={sampleBuyNext} />
        </a>
        <DebtCard />
      </section>

      <section className="mb-5 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" aria-label="Goals and savings">
        <a href="/savings" className="block rounded-2xl outline-none transition hover:scale-[1.002] focus-visible:ring-2 focus-visible:ring-cyan-400">
          <GoalProgressCard data={sampleGoalProgress} />
        </a>
        <SavingsCard data={financials.savingsCard} />
      </section>

      <section className="mb-8" aria-label="Recent changes">
        <ActivityPanel financials={financials} />
      </section>
    </>
  );
}

function ActivityPanel({ financials }: DashboardProps) {
  return (
    <a
      href="/activity"
      className="block rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 p-5 shadow-2xl outline-none backdrop-blur-xl transition hover:border-cyan-500/30 focus-visible:ring-2 focus-visible:ring-cyan-400 sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
            Activity
          </p>
          <h2 className="text-2xl font-bold text-white">Recent Changes</h2>
        </div>
        <span className="text-sm font-semibold text-cyan-300">View Activity -&gt;</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {financials.activity.slice(0, 3).map((row) => (
          <div key={row.id} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
              {row.action}
            </p>
            <h3 className="mb-2 font-semibold text-white">{row.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{row.detail}</p>
          </div>
        ))}
      </div>
    </a>
  );
}
