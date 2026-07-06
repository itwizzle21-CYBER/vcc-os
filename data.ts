import {
  createMoneySnapshot,
  createPriorityAlerts,
  createTodayMission,
  type DecisionBill,
} from "./decisionEngine";

const today = new Date();

const toDate = (daysFromToday: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
};

export const sampleBills: DecisionBill[] = [
  {
    id: 1,
    name: "Electric bill",
    amount: 186.42,
    dueDate: toDate(0),
    status: "pending",
    impact: "critical",
    category: "Utilities",
  },
  {
    id: 2,
    name: "Credit card minimum",
    amount: 450,
    dueDate: toDate(2),
    status: "pending",
    impact: "high",
    category: "Debt",
  },
  {
    id: 3,
    name: "Car insurance",
    amount: 214.8,
    dueDate: toDate(5),
    status: "pending",
    impact: "high",
    category: "Insurance",
  },
  {
    id: 4,
    name: "Streaming bundle",
    amount: 34.99,
    dueDate: toDate(9),
    status: "pending",
    impact: "low",
    category: "Subscriptions",
  },
];

export const sampleDailyBriefing = {
  greeting: "Good morning, Alex",
  date: today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }),
  summary: "Decision Engine v1 is prioritizing today's cash move by urgency, due date, and bill impact.",
  highlights: [
    {
      title: "Cash Available",
      value: "$4,250.32",
      change: "$3,613.90 after 7-day bills",
      trend: "up" as const,
    },
    {
      title: "Due This Week",
      value: "$851.22",
      change: "3 obligations in window",
      trend: "down" as const,
    },
    {
      title: "Decision Focus",
      value: "Electric",
      change: "Highest urgency and impact",
      trend: "up" as const,
    },
  ],
};

export const sampleTodaysMission = createTodayMission(sampleBills, today);

export const sampleMoneySnapshot = createMoneySnapshot(
  {
    cash: 4250.32,
    savings: 12800,
    investments: 7530.18,
    totalLiabilities: 18450,
    monthlyIncome: 5200,
    monthlyExpenses: 3150,
  },
  sampleBills,
  today
);

export const samplePriorityAlerts = createPriorityAlerts(sampleBills, today);

export const sampleBuyNext = [
  {
    id: 1,
    name: "Milk",
    category: "Groceries",
    status: "Critical" as const,
    lastPurchased: "2 days ago",
    estimatedCost: "$4.50",
    priority: 1,
  },
  {
    id: 2,
    name: "Bread",
    category: "Groceries",
    status: "Critical" as const,
    lastPurchased: "3 days ago",
    estimatedCost: "$3.25",
    priority: 2,
  },
  {
    id: 3,
    name: "Eggs",
    category: "Groceries",
    status: "Low" as const,
    lastPurchased: "5 days ago",
    estimatedCost: "$5.99",
    priority: 3,
  },
  {
    id: 4,
    name: "Toilet Paper",
    category: "Household Essentials",
    status: "Low" as const,
    lastPurchased: "1 week ago",
    estimatedCost: "$12.99",
    priority: 4,
  },
  {
    id: 5,
    name: "Shampoo",
    category: "Hygiene",
    status: "Good" as const,
    lastPurchased: "2 weeks ago",
    estimatedCost: "$8.50",
    priority: 5,
  },
];

export const sampleGoalProgress = [
  {
    id: 1,
    name: "Emergency Fund",
    current: "$12,800",
    target: "$18,000",
    percentage: 71,
    daysRemaining: 120,
    monthlyContribution: "$500",
    icon: "shield",
  },
  {
    id: 2,
    name: "Move Out Fund",
    current: "$3,200",
    target: "$15,000",
    percentage: 21,
    daysRemaining: 365,
    monthlyContribution: "$300",
    icon: "home",
  },
  {
    id: 3,
    name: "Vehicle Fund",
    current: "$5,600",
    target: "$25,000",
    percentage: 22,
    daysRemaining: 540,
    monthlyContribution: "$250",
    icon: "car",
  },
  {
    id: 4,
    name: "Debt-Free",
    current: "$18,450 remaining",
    target: "$0",
    percentage: 0,
    daysRemaining: 730,
    monthlyContribution: "$500",
    icon: "zap",
  },
  {
    id: 5,
    name: "Fitness",
    current: "24 workouts",
    target: "100 workouts",
    percentage: 24,
    daysRemaining: 180,
    monthlyContribution: "8 workouts/month",
    icon: "activity",
  },
];

export const sampleCashFlow = [
  { month: "Jan", income: 5200, expenses: 3100, net: 2100 },
  { month: "Feb", income: 5200, expenses: 3250, net: 1950 },
  { month: "Mar", income: 5200, expenses: 2950, net: 2250 },
  { month: "Apr", income: 5200, expenses: 3400, net: 1800 },
  { month: "May", income: 5200, expenses: 3150, net: 2050 },
  { month: "Jun", income: 5200, expenses: 3100, net: 2100 },
];
