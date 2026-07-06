import {
  createMoneySnapshot,
  formatCurrency,
  type DecisionBill,
  type MoneySnapshotInput,
  type MoneySnapshotOutput,
} from "./decisionEngine";

export type AccountName =
  | "Operating Cash"
  | "Protected Savings"
  | "Chime"
  | "Cash App"
  | "Apple Cash"
  | "Borrowed Money / Advances";

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "bill"
  | "debt"
  | "savings"
  | "advance"
  | "fee"
  | "repayment";

export interface AccountBalance {
  name: AccountName;
  balance: number;
}

export interface Transaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  type: TransactionType;
  account: AccountName;
  linkedSource: "money-snapshot" | "protected-savings" | "bill-payment" | "debt-payment" | "manual";
  sourceKey?: string;
}

export interface ActivityEvent {
  id: string;
  date: string;
  action: "Add" | "Edit" | "Delete" | "Transfer" | "Bill payment" | "Debt payment" | "Savings transfer";
  title: string;
  detail: string;
}

export interface FinancialState {
  accounts: AccountBalance[];
  investments: number;
  totalLiabilities: number;
  monthlyExpenses: number;
  transactions: Transaction[];
  activity: ActivityEvent[];
}

export interface DerivedFinancialState {
  moneySnapshot: MoneySnapshotOutput;
  monthlyIncome: number;
  weeklyIncome: number;
  runningBalance: number;
  safeToSpend: number;
  protectedSavings: number;
  operatingCash: number;
  totalSavings: number;
  transactions: Transaction[];
  activity: ActivityEvent[];
  savingsCard: {
    totalSavings: number;
    totalGoalAmount: number;
    savingsPercentage: number;
    monthlyContribution: number;
  };
  billsCard: {
    overdueBills: number;
    upcomingBills: number;
    totalDue: number;
  };
}

const today = new Date().toISOString().slice(0, 10);

export const initialFinancialState: FinancialState = {
  accounts: [
    { name: "Operating Cash", balance: 4250.32 },
    { name: "Protected Savings", balance: 12800 },
    { name: "Chime", balance: 980.45 },
    { name: "Cash App", balance: 212.9 },
    { name: "Apple Cash", balance: 76.18 },
    { name: "Borrowed Money / Advances", balance: 450 },
  ],
  investments: 7530.18,
  totalLiabilities: 18450,
  monthlyExpenses: 3150,
  transactions: [
    {
      id: "txn-income-primary",
      date: today,
      title: "Monthly income",
      amount: 5200,
      type: "income",
      account: "Operating Cash",
      linkedSource: "money-snapshot",
      sourceKey: "monthlyIncome",
    },
    {
      id: "txn-protected-savings",
      date: today,
      title: "Protected Savings transfer",
      amount: 500,
      type: "savings",
      account: "Protected Savings",
      linkedSource: "protected-savings",
      sourceKey: "protectedSavingsTransfer",
    },
    {
      id: "txn-advance",
      date: today,
      title: "Borrowed money / advance",
      amount: 450,
      type: "advance",
      account: "Borrowed Money / Advances",
      linkedSource: "money-snapshot",
      sourceKey: "borrowedMoney",
    },
    {
      id: "txn-fee",
      date: today,
      title: "Fees",
      amount: -22,
      type: "fee",
      account: "Operating Cash",
      linkedSource: "money-snapshot",
      sourceKey: "fees",
    },
  ],
  activity: [
    {
      id: "act-initial-sync",
      date: today,
      action: "Add",
      title: "Money Snapshot synced",
      detail: "Income, operating cash, protected savings, advances, and fees are feeding Transactions.",
    },
    {
      id: "act-protected-savings",
      date: today,
      action: "Savings transfer",
      title: "Protected Savings updated",
      detail: "Protected Savings transfer is reflected in Savings totals.",
    },
  ],
};

export function deriveFinancialState(
  state: FinancialState,
  bills: DecisionBill[],
  todayDate = new Date()
): DerivedFinancialState {
  const accountTotal = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  const operatingCash = getAccountBalance(state, "Operating Cash");
  const protectedSavings = getAccountBalance(state, "Protected Savings");
  const cashAccounts = accountTotal - protectedSavings;
  const monthlyIncome = state.transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Math.max(0, transaction.amount), 0);
  const weeklyIncome = monthlyIncome / 4.33;
  const snapshotInput: MoneySnapshotInput = {
    cash: cashAccounts,
    savings: protectedSavings,
    investments: state.investments,
    totalLiabilities: state.totalLiabilities,
    monthlyIncome,
    monthlyExpenses: state.monthlyExpenses,
    accounts: state.accounts,
  };
  const moneySnapshot = createMoneySnapshot(snapshotInput, bills, todayDate);
  const dueBillsTotal = bills
    .filter((bill) => bill.status !== "paid")
    .reduce((sum, bill) => sum + bill.amount, 0);
  const runningBalance = operatingCash + sumTransactionsForAccount(state.transactions, "Operating Cash");
  const safeToSpend = Math.max(0, operatingCash - dueBillsTotal);
  const totalSavings = protectedSavings;
  const savingsGoal = 18000;

  return {
    moneySnapshot,
    monthlyIncome,
    weeklyIncome,
    runningBalance,
    safeToSpend,
    protectedSavings,
    operatingCash,
    totalSavings,
    transactions: [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)),
    activity: state.activity,
    savingsCard: {
      totalSavings,
      totalGoalAmount: savingsGoal,
      savingsPercentage: savingsGoal > 0 ? (totalSavings / savingsGoal) * 100 : 0,
      monthlyContribution: getSourceTransactionAmount(state.transactions, "protectedSavingsTransfer"),
    },
    billsCard: {
      overdueBills: bills.filter((bill) => bill.status === "overdue").length,
      upcomingBills: bills.filter((bill) => bill.status !== "paid").length,
      totalDue: dueBillsTotal,
    },
  };
}

export function updateMoneySource(
  state: FinancialState,
  updates: Partial<Record<"operatingCash" | "protectedSavings" | "monthlyIncome" | "borrowedMoney" | "fees", number>>
): FinancialState {
  const next: FinancialState = {
    ...state,
    accounts: state.accounts.map((account) => ({ ...account })),
    transactions: state.transactions.map((transaction) => ({ ...transaction })),
    activity: [...state.activity],
  };

  if (typeof updates.operatingCash === "number") {
    setAccountBalance(next, "Operating Cash", updates.operatingCash);
    addActivity(next, "Edit", "Operating Cash updated", `${formatCurrency(updates.operatingCash)} is now the active cash source.`);
  }

  if (typeof updates.protectedSavings === "number") {
    const previous = getAccountBalance(next, "Protected Savings");
    setAccountBalance(next, "Protected Savings", updates.protectedSavings);
    upsertSourceTransaction(next, {
      sourceKey: "protectedSavingsTransfer",
      title: "Protected Savings transfer",
      amount: updates.protectedSavings - previous,
      type: "savings",
      account: "Protected Savings",
      linkedSource: "protected-savings",
    });
    addActivity(next, "Savings transfer", "Protected Savings synced", `${formatCurrency(updates.protectedSavings)} is now reflected in Savings.`);
  }

  if (typeof updates.monthlyIncome === "number") {
    upsertSourceTransaction(next, {
      sourceKey: "monthlyIncome",
      title: "Monthly income",
      amount: updates.monthlyIncome,
      type: "income",
      account: "Operating Cash",
      linkedSource: "money-snapshot",
    });
    addActivity(next, "Edit", "Income synced", `${formatCurrency(updates.monthlyIncome)} updated Transactions and Monthly Income.`);
  }

  if (typeof updates.borrowedMoney === "number") {
    setAccountBalance(next, "Borrowed Money / Advances", updates.borrowedMoney);
    upsertSourceTransaction(next, {
      sourceKey: "borrowedMoney",
      title: "Borrowed money / advance",
      amount: updates.borrowedMoney,
      type: "advance",
      account: "Borrowed Money / Advances",
      linkedSource: "money-snapshot",
    });
    addActivity(next, "Edit", "Borrowed money updated", `${formatCurrency(updates.borrowedMoney)} synced to the advance account.`);
  }

  if (typeof updates.fees === "number") {
    upsertSourceTransaction(next, {
      sourceKey: "fees",
      title: "Fees",
      amount: -Math.abs(updates.fees),
      type: "fee",
      account: "Operating Cash",
      linkedSource: "money-snapshot",
    });
    addActivity(next, "Edit", "Fees synced", `${formatCurrency(updates.fees)} now appears in Transactions.`);
  }

  return next;
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatCurrency(value)}`;
}

function getAccountBalance(state: FinancialState, name: AccountName): number {
  return state.accounts.find((account) => account.name === name)?.balance || 0;
}

function setAccountBalance(state: FinancialState, name: AccountName, balance: number) {
  const account = state.accounts.find((item) => item.name === name);
  if (account) account.balance = balance;
}

function sumTransactionsForAccount(transactions: Transaction[], account: AccountName): number {
  return transactions
    .filter((transaction) => transaction.account === account && transaction.type !== "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function getSourceTransactionAmount(transactions: Transaction[], sourceKey: string): number {
  return transactions.find((transaction) => transaction.sourceKey === sourceKey)?.amount || 0;
}

function upsertSourceTransaction(
  state: FinancialState,
  input: Pick<Transaction, "sourceKey" | "title" | "amount" | "type" | "account" | "linkedSource">
) {
  const existing = state.transactions.find((transaction) => transaction.sourceKey === input.sourceKey);
  if (existing) {
    existing.amount = input.amount;
    existing.date = today;
    existing.title = input.title;
    existing.type = input.type;
    existing.account = input.account;
    existing.linkedSource = input.linkedSource;
    return;
  }

  state.transactions.unshift({
    id: `txn-${input.sourceKey}`,
    date: today,
    title: input.title,
    amount: input.amount,
    type: input.type,
    account: input.account,
    linkedSource: input.linkedSource,
    sourceKey: input.sourceKey,
  });
}

function addActivity(state: FinancialState, action: ActivityEvent["action"], title: string, detail: string) {
  state.activity = [
    {
      id: `act-${Date.now()}-${title}`,
      date: today,
      action,
      title,
      detail,
    },
    ...state.activity.filter((event) => event.title !== title),
  ].slice(0, 8);
}
