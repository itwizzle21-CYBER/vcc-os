import BillsCard from "./BillsCard";
import BuyNextCard from "./BuyNextCard";
import DailyBriefingCard from "./DailyBriefingCard";
import DebtCard from "./DebtCard";
import GoalProgressCard from "./GoalProgressCard";
import MoneySnapshotCard from "./MoneySnapshotCard";
import PriorityAlertsCard from "./PriorityAlertsCard";
import SavingsCard from "./SavingsCard";
import TodaysMissionCard from "./TodaysMissionCard";
import {
  sampleBuyNext,
  sampleDailyBriefing,
  sampleGoalProgress,
  sampleMoneySnapshot,
  samplePriorityAlerts,
  sampleTodaysMission,
} from "./data";

export default function Dashboard() {
  return (
    <>
      <div className="mb-6 sm:mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          VCC Mission Control
        </p>
        <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
          {sampleDailyBriefing.greeting}
        </h1>
        <p className="text-lg text-slate-400">{sampleDailyBriefing.date}</p>
      </div>

      <section className="mb-6 sm:mb-8" aria-label="Briefing">
        <DailyBriefingCard data={sampleDailyBriefing} />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 sm:mb-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" aria-label="Mission priorities">
        <PriorityAlertsCard data={samplePriorityAlerts} />
        <TodaysMissionCard data={sampleTodaysMission} />
      </section>

      <section className="mb-6 sm:mb-8" aria-label="Money Snapshot">
        <a href="/money" className="block rounded-2xl outline-none transition hover:scale-[1.002] focus-visible:ring-2 focus-visible:ring-cyan-400">
          <MoneySnapshotCard data={sampleMoneySnapshot} />
        </a>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 sm:mb-8 lg:grid-cols-3" aria-label="Core command cards">
        <BillsCard />
        <BuyNextCard data={sampleBuyNext} />
        <DebtCard />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 sm:mb-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" aria-label="Goals and savings">
        <a href="/savings" className="block rounded-2xl outline-none transition hover:scale-[1.002] focus-visible:ring-2 focus-visible:ring-cyan-400">
          <GoalProgressCard data={sampleGoalProgress} />
        </a>
        <SavingsCard />
      </section>

      <section className="mb-8" aria-label="Recent changes">
        <ActivityPanel />
      </section>
    </>
  );
}

function ActivityPanel() {
  const rows = [
    {
      title: "Routes restored",
      detail: "Dashboard, Money, Bills, Inventory, Debts, Savings, and Settings are available.",
      status: "Recovered",
    },
    {
      title: "Dashboard locked",
      detail: "Cards are read-only intelligence surfaces and route into dedicated pages.",
      status: "Protected",
    },
    {
      title: "Decision Engine active",
      detail: "Mission, alerts, and money context are generated from the recovery data set.",
      status: "Online",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
            Activity
          </p>
          <h2 className="text-2xl font-bold text-white">Recent Changes</h2>
        </div>
        <a href="/settings" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
          View Settings -&gt;
        </a>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {rows.map((row) => (
          <div key={row.title} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
              {row.status}
            </p>
            <h3 className="mb-2 font-semibold text-white">{row.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{row.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
