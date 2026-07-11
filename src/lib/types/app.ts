export type SectionKey =
  | "money"
  | "bills"
  | "income"
  | "transactions"
  | "debt"
  | "carPayment"
  | "savings"
  | "inventory"
  | "goals";

export type ThemeMode = "dark" | "midnight" | "slate" | "light";
export type AccentColor = "blue" | "green" | "gold" | "purple" | "red";
export type Density = "comfortable" | "compact" | "ultra";
export type SurfaceStyle = "glass" | "neumorphic" | "minimal";

export interface TableColumn {
  key: string;
  label: string;
  type?: "text" | "number" | "currency" | "date" | "readonly";
  readOnly?: boolean;
}

export interface SpreadsheetRow {
  id: string;
  cells: Record<string, string>;
}

export interface PaycheckPlanner {
  paycheckAmount: string;
  payDate: string;
  weekStart: string;
  weekEnd: string;
  spotMeRepayment: string;
  myPayRepayment: string;
  locked: boolean;
}

export interface PaycheckHistoryRow {
  id: string;
  payDate: string;
  income: string;
  spotMe: string;
  myPay: string;
  remaining: string;
  weekStart: string;
  weekEnd: string;
  locked: boolean;
}

export interface UserSettings {
  theme: ThemeMode;
  accent: AccentColor;
  density: Density;
  accountName: string;
  profileLabel: string;
  localMode: boolean;
  notificationsEnabled: boolean;
  confirmBeforeReset: boolean;
  widgetOrder: string[];
  hiddenWidgets: string[];
  surfaceStyle: SurfaceStyle;
  sidebarCollapsed: boolean;
}

export interface AppData {
  version: number;
  sections: Record<SectionKey, SpreadsheetRow[]>;
  sortBy: Partial<Record<SectionKey, string>>;
  paycheckPlanner: PaycheckPlanner;
  paycheckHistory: PaycheckHistoryRow[];
  settings: UserSettings;
}

export interface SectionConfig {
  key: SectionKey;
  title: string;
  columns: TableColumn[];
}

export interface FinancialState {
  totalCash: number;
  spendableCash: number;
  safeToSpend: number;
  protectedSavings: number;
  availableSavings: number;
  borrowedMoney: number;
  weeklyIncome: number;
  monthlyIncome: number;
  receivedIncome: number;
  weeklySpending: number;
  monthlySpending: number;
  largestExpense: string;
  lastTransaction: string;
  billsDueToday: number;
  billsDueThisWeek: number;
  overdueBills: number;
  billsPressure: number;
  totalDebt: number;
  minimumPayments: number;
  nextPayoff: string;
  debtFreePercent: number;
  carPaymentOriginalTotal: number;
  carPaymentRemainingTotal: number;
  carPaymentPaidPercent: number;
  carPaymentMonthlyTotal: number;
  nextCarPayment: string;
  emergencyFund: number;
  goalSavings: number;
  goalsComplete: number;
  closestGoal: string;
  goalCompletionPercent: number;
  estimatedFinish: string;
  criticalItems: number;
  lowStock: number;
  buyNextCount: number;
  estimatedRefillCost: number;
  buyNextRows: SpreadsheetRow[];
  cashFlow: Array<{ label: string; income: number; spending: number }>;
  categorySummary: Array<{ label: string; amount: number }>;
}

export interface DecisionState {
  todayBriefing: string;
  recommendedMove: string;
  todayMission: {
    title: string;
    detail: string;
    href: "/" | "/money" | "/bills" | "/inventory" | "/savings" | "/debt" | "/goals" | "/transactions";
    priority: "Critical" | "High" | "Medium" | "Low";
  };
  priorityAlerts: Array<{ title: string; detail: string; tone: "warning" | "info" | "success" }>;
  missionStack: Array<{
    title: string;
    detail: string;
    href: DecisionState["todayMission"]["href"];
    priority: "High" | "Medium" | "Low";
  }>;
}
