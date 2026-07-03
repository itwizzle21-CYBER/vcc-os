export type SectionKey =
  | "money"
  | "bills"
  | "income"
  | "transactions"
  | "debt"
  | "savings"
  | "inventory"
  | "goals"
  | "missions"
  | "alerts";

export type AppView = SectionKey | "dashboard" | "settings";

export type Row = Record<string, string>;

export type Section = {
  key: SectionKey;
  label: string;
  subtitle: string;
  columns: string[];
  rows: Row[];
};

export type Alert = {
  title: string;
  source: SectionKey;
  level: "Critical" | "High" | "Medium";
  proof: string;
  action: string;
};

export type Metrics = {
  cashOnHand: number;
  weeklyIncome: number;
  otherIncome: number;
  transactionNet: number;
  operatingCash: number;
  billsPressure: number;
  foodNeeded: number;
  gasNeeded: number;
  debtPressure: number;
  totalDebtBalance: number;
  debtBlocksCash: number;
  totalPressure: number;
  spendableCash: number;
  savingsVault: number;
  protectedSavings: number;
  flexibleSavings: number;
  allowedWithdrawal: number;
  lockedSavings: number;
  unpaidBills: number;
  overdueBills: number;
  activeDebt: number;
  borrowedMoney: number;
  netPosition: number;
  criticalInventory: number;
  buyNext: string;
  openMissions: number;
  avgGoalProgress: number;
};

export type FinancialState = {
  money: {
    totalCash: number;
    safeToSpend: number;
    spendableCash: number;
    protectedSavings: number;
    availableSavings: number;
    borrowedMoney: number;
    emergencyFund: number;
  };
  income: {
    weeklyIncome: number;
    monthlyIncome: number;
    yearlyIncome: number;
  };
  bills: {
    billsRemaining: number;
    billsPaid: number;
    billsDueThisWeek: number;
    billsOverdue: number;
    monthlyBills: number;
  };
  debt: {
    totalDebt: number;
    remainingDebt: number;
    minimumPayments: number;
  };
  inventory: {
    totalInventoryValue: number;
    criticalItems: number;
    buyNextItems: string[];
  };
  goals: {
    goalProgress: number;
    goalRemaining: number;
  };
  health: {
    financialHealthScore: number;
  };
  metrics: Metrics;
};

export type HealthStatus = "Excellent" | "Good" | "Stable" | "Warning" | "Critical";

export type DecisionEngineState = {
  todayMission: Alert | undefined;
  recommendedMove: RecommendedMove;
  priorityAlerts: Alert[];
  missionStack: Alert[];
  financialStatus: HealthStatus;
  protectionStatus: string;
  cashStatus: string;
  debtStatus: string;
  inventoryStatus: string;
  savingsStatus: string;
};

export type RecommendedMove = {
  title: string;
  why: string;
  doFirst: string;
  doNotDo: string;
  checkpoint: string;
  source: SectionKey;
  tone: "danger" | "warning" | "stable";
};

export type CardTone = "bad" | "good" | "warn" | "neutral";

export type DashboardCard = {
  value: string;
  label: string;
  detail: string;
  tone: CardTone;
};
