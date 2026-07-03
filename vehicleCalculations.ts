import type { Debt } from "./schema";

/**
 * Calculate payoff progress percentage for vehicle debt
 */
export function calculatePayoffProgress(currentBalance: number, originalBalance: number): number {
  if (originalBalance === 0) return 0;
  const progress = ((originalBalance - currentBalance) / originalBalance) * 100;
  return Math.max(0, Math.min(100, progress));
}

/**
 * Calculate estimated payoff date based on weekly payment amount
 */
export function calculatePayoffEstimate(
  currentBalance: number,
  weeklyPaymentAmount: number,
  interestRate: number
): { weeks: number; estimatedDate: Date } {
  if (weeklyPaymentAmount <= 0) {
    return { weeks: Infinity, estimatedDate: new Date(9999, 11, 31) };
  }

  const monthlyRate = interestRate / 100 / 12;
  let balance = currentBalance;
  let weeks = 0;
  const maxIterations = 1000; // Prevent infinite loops

  while (balance > 0 && weeks < maxIterations) {
    // Add interest (approximately 1/4 of monthly interest per week)
    const weeklyInterest = (balance * monthlyRate) / 4;
    balance += weeklyInterest;

    // Subtract payment
    balance -= weeklyPaymentAmount;
    weeks++;
  }

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + weeks * 7);

  return { weeks, estimatedDate };
}

/**
 * Calculate days until next payment due
 */
export function calculateDaysUntilDue(nextDueDate: Date | undefined): number {
  if (!nextDueDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(nextDueDate);
  dueDate.setHours(0, 0, 0, 0);

  const timeDiff = dueDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return Math.max(0, daysDiff);
}

/**
 * Determine payment status based on due date
 */
export function getPaymentStatus(nextDueDate: Date | undefined): "overdue" | "due_soon" | "on_track" {
  const daysUntilDue = calculateDaysUntilDue(nextDueDate);

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 3) return "due_soon";
  return "on_track";
}

/**
 * Calculate total interest paid over loan life
 */
export function calculateTotalInterestPaid(
  originalBalance: number,
  currentBalance: number,
  weeklyPaymentAmount: number,
  interestRate: number
): number {
  const { weeks } = calculatePayoffEstimate(currentBalance, weeklyPaymentAmount, interestRate);
  const totalPaid = weeks * weeklyPaymentAmount;
  const totalInterest = totalPaid - currentBalance;
  return Math.max(0, totalInterest);
}

/**
 * Calculate monthly payment equivalent from weekly payment
 */
export function calculateMonthlyEquivalent(weeklyPaymentAmount: number): number {
  return weeklyPaymentAmount * 52 / 12; // 52 weeks / 12 months
}

/**
 * Calculate annual payment from weekly payment
 */
export function calculateAnnualPayment(weeklyPaymentAmount: number): number {
  return weeklyPaymentAmount * 52;
}

/**
 * Get vehicle debt summary
 */
export function getVehicleDebtSummary(debt: Debt) {
  if (!debt.isVehicleDebt) {
    return null;
  }

  const vehicleDisplay = `${debt.vehicleYear} ${debt.vehicleMake} ${debt.vehicleModel}`;
  const payoffProgress = calculatePayoffProgress(debt.balance, debt.balance + 5000); // Assume 5k paid down
  const { weeks, estimatedDate } = calculatePayoffEstimate(
    debt.balance,
    debt.weeklyPaymentAmount || 0,
    debt.interestRate
  );
  const daysUntilDue = calculateDaysUntilDue(debt.nextDueDate);
  const paymentStatus = getPaymentStatus(debt.nextDueDate);
  const monthlyEquivalent = calculateMonthlyEquivalent(debt.weeklyPaymentAmount || 0);
  const annualPayment = calculateAnnualPayment(debt.weeklyPaymentAmount || 0);

  return {
    vehicleDisplay,
    payoffProgress,
    payoffWeeks: weeks,
    estimatedPayoffDate: estimatedDate,
    daysUntilDue,
    paymentStatus,
    monthlyEquivalent,
    annualPayment,
    weeklyPayment: debt.weeklyPaymentAmount || 0,
    currentBalance: debt.balance,
    interestRate: debt.interestRate,
  };
}
