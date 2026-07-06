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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
            {sampleDailyBriefing.greeting}
          </h1>
          <p className="text-lg text-slate-400">{sampleDailyBriefing.date}</p>
        </div>

        <div className="mb-6 sm:mb-8">
          <DailyBriefingCard data={sampleDailyBriefing} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 sm:mb-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <TodaysMissionCard data={sampleTodaysMission} />
          </div>
          <div className="lg:col-span-2">
            <MoneySnapshotCard data={sampleMoneySnapshot} />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 sm:mb-8 lg:grid-cols-2">
          <PriorityAlertsCard data={samplePriorityAlerts} />
          <BuyNextCard data={sampleBuyNext} />
        </div>

        <div className="mb-6 sm:mb-8">
          <GoalProgressCard data={sampleGoalProgress} />
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-white">Quick Access</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <BillsCard />
            <DebtCard />
            <SavingsCard />
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
