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

export type ThemeMode = "system" | "dark" | "light";
export type AppearanceTheme = "signature" | "executive" | "nordic" | "contrast";
export type AccentColor = "blue" | "green" | "gold" | "purple" | "red";
export type Density = "comfortable" | "compact" | "ultra";
export type SurfaceStyle = "glass" | "neumorphic" | "minimal";
export type WallpaperChoice = "default" | "modern" | "anime" | "animation" | "upload";

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
  incomeSource: string;
  depositAccountId: string;
  paycheckAmount: string;
  payDate: string;
  weekStart: string;
  weekEnd: string;
  spotMeRepayment: string;
  myPayRepayment: string;
  depositApplied: boolean;
  locked: boolean;
}

export interface PaycheckHistoryRow {
  id: string;
  incomeSource?: string;
  depositAccountId?: string;
  depositAccountLabel?: string;
  borrowedRepayments?: Array<{ rowId: string; label: string; amount: number }>;
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
  appearanceTheme: AppearanceTheme;
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
  wallpaper: WallpaperChoice;
  customWallpaper: string;
  backgroundOpacity: number;
  cardOpacity: number;
  welcomeHeadline: string;
  welcomeMessage: string;
  welcomeDurationSeconds: number;
  welcomeTransition: "rise" | "fade" | "focus" | "sweep";
  vitaScanEnabled: boolean;
  vccPetEnabled: boolean;
}

export interface ActivityEvent {
  id: string;
  type: "mission_completed" | "info";
  title: string;
  detail: string;
  createdAt: string;
}

export type EvidenceStatus = "draft" | "confirmed" | "needs_review" | "superseded" | "rejected";
export type CommunicationStatus = "unverified" | "dealer_confirmed" | "matches_receipt" | "conflicts_with_receipt" | "superseded";

export interface CarLoanContract {
  id: string;
  contractDate: string;
  vehicle: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleStyle: string;
  maskedVin: string;
  originalOdometer: number;
  lender: string;
  apr: number;
  amountFinanced: number;
  financeCharge: number;
  totalScheduledPayments: number;
  downPayment: number;
  totalSalePrice: number;
  deferredDownPayment: number;
  scheduledPaymentAmount: number;
  scheduledPaymentCount: number;
  scheduleFrequency: string;
  firstPaymentDate: string;
  lateChargePercent: number;
  gracePeriodDays: number;
  prepaymentPenalty: boolean;
  sourceLabel: string;
  verified: boolean;
}

export interface CarLoanReceipt {
  id: string;
  revision: number;
  supersedesId?: string;
  paidDate: string;
  receiptNumber: string;
  paymentType: string;
  paymentMethod: string;
  receivedBy: string;
  totalPaid: number;
  downPaymentPaid?: number;
  principalPaid?: number;
  interestPaid?: number;
  lateFeesPaid?: number;
  otherFeesPaid?: number;
  sideNoteFeesPaid?: number;
  creditsApplied?: number;
  officialPayoff?: number;
  accountBalance?: number;
  paymentsRemaining?: number;
  attachmentName?: string;
  attachmentId?: string;
  status: EvidenceStatus;
  notes: string;
  createdAt: string;
}

export interface CarLoanCommunication {
  id: string;
  messageDate: string;
  communicationType: string;
  dealerRepresentative: string;
  exactMessage: string;
  amountStated?: number;
  paymentAcknowledged?: number;
  payoffStated?: number;
  accountBalanceStated?: number;
  feesStated?: number;
  relatedReceiptId?: string;
  attachmentName?: string;
  attachmentId?: string;
  status: CommunicationStatus;
  notes: string;
}

export interface CarLoanScheduleRow {
  paymentNumber: number;
  scheduledDate: string;
  scheduledPayment: number;
  scheduledPrincipal: number;
  scheduledInterest: number;
  scheduledPrincipalBalance: number;
}

export interface CarLoanData {
  contract: CarLoanContract | null;
  receipts: CarLoanReceipt[];
  communications: CarLoanCommunication[];
  schedule: CarLoanScheduleRow[];
}

export interface AppData {
  version: number;
  sections: Record<SectionKey, SpreadsheetRow[]>;
  sortBy: Partial<Record<SectionKey, string>>;
  paycheckPlanner: PaycheckPlanner;
  paycheckHistory: PaycheckHistoryRow[];
  activity: ActivityEvent[];
  carLoan: CarLoanData;
  settings: UserSettings;
}

export interface SectionConfig {
  key: SectionKey;
  title: string;
  columns: TableColumn[];
}

export interface FinancialState {
  totalCash: number;
  cashOnHand: number;
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
  transactionWeekNet: number;
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
  carLoanTotalCashPaid: number;
  carLoanPrincipalPaid: number;
  carLoanInterestPaid: number;
  carLoanFeesPaid: number;
  carLoanOfficialPayoff: number;
  carLoanDealerBalance: number;
  carLoanPaymentsRemaining: number;
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
    id: string;
    title: string;
    detail: string;
    href: DecisionState["todayMission"]["href"];
    target: string;
    progress: number;
    completed: boolean;
    priority: "High" | "Medium" | "Low";
  }>;
}
