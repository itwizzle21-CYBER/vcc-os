// Realistic sample data for CEO Dashboard

export const sampleDailyBriefing = {
  greeting: "Good morning, Alex",
  date: new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }),
  summary: "You're on track with your financial goals. Focus on paying down the credit card this week.",
  highlights: [
    {
      title: "Cash Position",
      value: "$4,250.32",
      change: "+$320 from yesterday",
      trend: "up",
    },
    {
      title: "Debt Status",
      value: "$18,450",
      change: "-$150 this week",
      trend: "down",
    },
    {
      title: "Savings Rate",
      value: "32%",
      change: "+2% vs last month",
      trend: "up",
    },
  ],
};

export const sampleTodaysMission = [
  {
    id: 1,
    title: "Pay electric bill",
    dueDate: "Today",
    priority: "high",
    completed: false,
    category: "Bills",
  },
  {
    id: 2,
    title: "Review credit card statement",
    dueDate: "Today",
    priority: "medium",
    completed: false,
    category: "Debt",
  },
  {
    id: 3,
    title: "Transfer $500 to savings",
    dueDate: "Today",
    priority: "high",
    completed: false,
    category: "Savings",
  },
  {
    id: 4,
    title: "Check inventory levels",
    dueDate: "Today",
    priority: "low",
    completed: true,
    category: "Inventory",
  },
  {
    id: 5,
    title: "Review trading performance",
    dueDate: "Today",
    priority: "medium",
    completed: false,
    category: "Trading",
  },
];

export const sampleMoneySnapshot = {
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

export const samplePriorityAlerts = [
  {
    id: 1,
    type: "warning",
    title: "Credit Card Payment Due",
    message: "Your credit card payment of $450 is due in 3 days",
    actionUrl: "/bills",
    actionLabel: "View Bill",
  },
  {
    id: 2,
    type: "info",
    title: "Savings Goal Progress",
    message: "You're 68% toward your Emergency Fund goal. Keep it up!",
    actionUrl: "/savings",
    actionLabel: "View Goal",
  },
  {
    id: 3,
    type: "success",
    title: "Debt Reduction Milestone",
    message: "You've paid off $2,500 in debt this quarter",
    actionUrl: "/debt",
    actionLabel: "View Progress",
  },
  {
    id: 4,
    type: "warning",
    title: "Inventory Alert",
    message: "Groceries inventory is running low - 3 items critical",
    actionUrl: "/inventory",
    actionLabel: "View Inventory",
  },
];

export const sampleBuyNext = [
  {
    id: 1,
    name: "Milk",
    category: "Groceries",
    status: "Critical",
    lastPurchased: "2 days ago",
    estimatedCost: "$4.50",
    priority: 1,
  },
  {
    id: 2,
    name: "Bread",
    category: "Groceries",
    status: "Critical",
    lastPurchased: "3 days ago",
    estimatedCost: "$3.25",
    priority: 2,
  },
  {
    id: 3,
    name: "Eggs",
    category: "Groceries",
    status: "Low",
    lastPurchased: "5 days ago",
    estimatedCost: "$5.99",
    priority: 3,
  },
  {
    id: 4,
    name: "Toilet Paper",
    category: "Household Essentials",
    status: "Low",
    lastPurchased: "1 week ago",
    estimatedCost: "$12.99",
    priority: 4,
  },
  {
    id: 5,
    name: "Shampoo",
    category: "Hygiene",
    status: "Good",
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
