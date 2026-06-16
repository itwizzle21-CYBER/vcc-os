import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import DailyBriefingCard from "@/components/Dashboard/DailyBriefingCard";
import TodaysMissionCard from "@/components/Dashboard/TodaysMissionCard";
import MoneySnapshotCard from "@/components/Dashboard/MoneySnapshotCard";
import PriorityAlertsCard from "@/components/Dashboard/PriorityAlertsCard";
import BuyNextCard from "@/components/Dashboard/BuyNextCard";
import GoalProgressCard from "@/components/Dashboard/GoalProgressCard";
import BillsCard from "@/modules/bills/components/BillsCard";
import DebtCard from "@/modules/debt/components/DebtCard";
import SavingsCard from "@/modules/savings/components/SavingsCard";

export default function Dashboard() {
  // Fetch all dashboard data from tRPC
  const dailyBriefing = trpc.dashboard.getDailyBriefing.useQuery() as any;
  const todaysMission = trpc.dashboard.getTodaysMission.useQuery() as any;
  const moneySnapshot = trpc.dashboard.getMoneySnapshot.useQuery() as any;
  const priorityAlerts = trpc.dashboard.getPriorityAlerts.useQuery() as any;
  const buyNext = trpc.dashboard.getBuyNext.useQuery() as any;
  const goalProgress = trpc.dashboard.getGoalProgress.useQuery() as any;

  const [isLoading, setIsLoading] = useState(true);

  // Fallback mock data in case of errors
  const mockDailyBriefing = {
    greeting: "Good morning, Alex",
    date: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    summary: "You're on track with your financial goals. Focus on paying down the credit card this week.",
    highlights: [
      { title: "Cash Position", value: "$4,250.32", change: "+$320 from yesterday", trend: "up" },
      { title: "Debt Status", value: "$18,450", change: "-$150 this week", trend: "down" },
      { title: "Savings Rate", value: "32%", change: "+2% vs last month", trend: "up" },
    ],
  };

  const mockTodaysMission = [
    { id: 1, title: "Pay electric bill", dueDate: "Today", priority: "high", completed: false, category: "Bills" },
    { id: 2, title: "Review credit card statement", dueDate: "Today", priority: "medium", completed: false, category: "Debt" },
    { id: 3, title: "Transfer $500 to savings", dueDate: "Today", priority: "high", completed: false, category: "Savings" },
    { id: 4, title: "Check inventory levels", dueDate: "Today", priority: "low", completed: true, category: "Inventory" },
    { id: 5, title: "Review trading performance", dueDate: "Today", priority: "medium", completed: false, category: "Trading" },
  ];

  const mockMoneySnapshot = {
    totalAssets: "$24,580.50",
    totalLiabilities: "$18,450.00",
    netWorth: "$6,130.50",
    monthlyIncome: "$5,200.00",
    monthlyExpenses: "$3,150.00",
    monthlyNet: "$2,050.00",
    breakdown: [
      { label: "Cash", value: "$4,250", percentage: 17 },
      { label: "Savings", value: "$12,800", percentage: 52 },
      { label: "Investments", value: "$7,530", percentage: 31 },
    ],
    liabilityBreakdown: [
      { label: "Credit Card", value: "$8,450", percentage: 46 },
      { label: "Personal Loan", value: "$10,000", percentage: 54 },
    ],
  };

  const mockPriorityAlerts = [
    { id: 1, type: "warning", title: "Credit Card Payment Due", message: "Your credit card payment of $450 is due in 3 days", actionUrl: "/bills", actionLabel: "View Bill" },
    { id: 2, type: "info", title: "Savings Goal Progress", message: "You're 68% toward your Emergency Fund goal. Keep it up!", actionUrl: "/savings", actionLabel: "View Goal" },
    { id: 3, type: "success", title: "Debt Reduction Milestone", message: "You've paid off $2,500 in debt this quarter", actionUrl: "/debt", actionLabel: "View Progress" },
    { id: 4, type: "warning", title: "Inventory Alert", message: "Groceries inventory is running low - 3 items critical", actionUrl: "/inventory", actionLabel: "View Inventory" },
  ];

  const mockBuyNext = [
    { id: 1, name: "Milk", category: "Groceries", status: "Critical", lastPurchased: "2 days ago", estimatedCost: "$4.50", priority: 1 },
    { id: 2, name: "Bread", category: "Groceries", status: "Critical", lastPurchased: "3 days ago", estimatedCost: "$3.25", priority: 2 },
    { id: 3, name: "Eggs", category: "Groceries", status: "Low", lastPurchased: "5 days ago", estimatedCost: "$5.99", priority: 3 },
    { id: 4, name: "Toilet Paper", category: "Household Essentials", status: "Low", lastPurchased: "1 week ago", estimatedCost: "$12.99", priority: 4 },
    { id: 5, name: "Shampoo", category: "Hygiene", status: "Good", lastPurchased: "2 weeks ago", estimatedCost: "$8.50", priority: 5 },
  ];

  const mockGoalProgress = [
    { id: 1, name: "Emergency Fund", current: "$12,800", target: "$18,000", percentage: 71, daysRemaining: 120, monthlyContribution: "$500", icon: "shield" },
    { id: 2, name: "Move Out Fund", current: "$3,200", target: "$15,000", percentage: 21, daysRemaining: 365, monthlyContribution: "$300", icon: "home" },
    { id: 3, name: "Vehicle Fund", current: "$5,600", target: "$25,000", percentage: 22, daysRemaining: 540, monthlyContribution: "$250", icon: "car" },
    { id: 4, name: "Debt-Free", current: "$18,450 remaining", target: "$0", percentage: 0, daysRemaining: 730, monthlyContribution: "$500", icon: "zap" },
    { id: 5, name: "Fitness", current: "24 workouts", target: "100 workouts", percentage: 24, daysRemaining: 180, monthlyContribution: "8 workouts/month", icon: "activity" },
  ];

  useEffect(() => {
    const allLoaded =
      !dailyBriefing.isLoading &&
      !todaysMission.isLoading &&
      !moneySnapshot.isLoading &&
      !priorityAlerts.isLoading &&
      !buyNext.isLoading &&
      !goalProgress.isLoading;

    setIsLoading(!allLoaded);
  }, [
    dailyBriefing.isLoading,
    todaysMission.isLoading,
    moneySnapshot.isLoading,
    priorityAlerts.isLoading,
    buyNext.isLoading,
    goalProgress.isLoading,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse mb-4">
            <div className="w-6 h-6 bg-slate-900 rounded-full" />
          </div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {dailyBriefing.data?.greeting || mockDailyBriefing.greeting}
          </h1>
          <p className="text-slate-400 text-lg">
            {dailyBriefing.data?.date || mockDailyBriefing.date}
          </p>
        </div>

        {/* Daily Briefing - Full Width */}
        <div className="mb-8">
          <DailyBriefingCard data={dailyBriefing.data} />
        </div>

        {/* Top Row: Today's Mission + Money Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <TodaysMissionCard data={todaysMission.data} />
          </div>
          <div className="lg:col-span-2">
            <MoneySnapshotCard data={moneySnapshot.data} />
          </div>
        </div>

        {/* Middle Row: Priority Alerts + Buy Next */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <PriorityAlertsCard data={priorityAlerts.data} />
          </div>
          <div>
            <BuyNextCard data={buyNext.data} />
          </div>
        </div>

        {/* Bottom Row: Goal Progress - Full Width */}
        <div className="mb-8">
          <GoalProgressCard data={goalProgress.data} />
        </div>

        {/* Module Widgets */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BillsCard />
            <DebtCard />
            <SavingsCard />
          </div>
        </div>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
