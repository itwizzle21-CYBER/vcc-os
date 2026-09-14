import { createStarterData } from "../../src/lib/storage/defaultData";
import { syncConfirmedReceiptTransactions } from "../../src/lib/engine/carLoanEngine";
import type { AppData } from "../../src/lib/types/app";

// Keep established generic regression rows; replace every owner loan record,
// including the legacy summary and transactions derived from those receipts.
export function createBrowserData(): AppData {
  const data = createStarterData();
  data.carLoan = {
    contract: {
      id: "e2e-contract", contractDate: "2026-01-01", vehicle: "Synthetic Test Car",
      vehicleYear: "2026", vehicleMake: "Example", vehicleModel: "Test",
      vehicleStyle: "Sedan", maskedVin: "TEST-ONLY", originalOdometer: 100,
      lender: "Example Test Lender", apr: 5, amountFinanced: 1000,
      financeCharge: 50, totalScheduledPayments: 1050, downPayment: 100,
      totalSalePrice: 1150, deferredDownPayment: 0, scheduledPaymentAmount: 125,
      scheduledPaymentCount: 9, scheduleFrequency: "monthly",
      firstPaymentDate: "2026-02-01", lateChargePercent: 0, gracePeriodDays: 10,
      prepaymentPenalty: false, sourceLabel: "Invented browser fixture", verified: true,
    },
    receipts: [{
      id: "e2e-receipt", revision: 1, paidDate: "2026-02-01",
      receiptNumber: "E2E-0001", paymentType: "Regular", paymentMethod: "Chime Checking",
      receivedBy: "Example Test Clerk", totalPaid: 125, principalPaid: 120,
      interestPaid: 5, officialPayoff: 880, accountBalance: 880, paymentsRemaining: 8,
      status: "confirmed", notes: "Invented evidence; not a real payment",
      createdAt: "2026-02-01T12:00:00Z",
    }],
    communications: [{
      id: "e2e-message", messageDate: "2026-02-01", communicationType: "email",
      dealerRepresentative: "Example Test Clerk", exactMessage: "Synthetic payment received",
      paymentAcknowledged: 125, payoffStated: 880, accountBalanceStated: 880,
      relatedReceiptId: "e2e-receipt", status: "matches_receipt", notes: "Invented communication",
    }],
    schedule: [{
      paymentNumber: 1, scheduledDate: "2026-02-01", scheduledPayment: 125,
      scheduledPrincipal: 120, scheduledInterest: 5, scheduledPrincipalBalance: 880,
    }],
  };
  data.sections.carPayment = [{ id: "car-current", cells: {
    vehicle: "Synthetic Test Car", lender: "Example Test Lender", originalBalance: "1000.00",
    remainingBalance: "880.00", monthlyPayment: "125.00", dueDate: "2026-03-01",
    apr: "5%", status: "active", notes: "Invented browser fixture",
  } }];
  data.sections.transactions = syncConfirmedReceiptTransactions(data.sections.transactions, data.carLoan.receipts)
    .map((row) => row.id.startsWith("car-receipt-")
      ? { ...row, cells: { ...row.cells, description: "Synthetic test car payment" } }
      : row);
  return data;
}
