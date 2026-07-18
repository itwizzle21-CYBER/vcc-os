import type { CarLoanCommunication, CarLoanData, CarLoanReceipt, SpreadsheetRow } from "../types/app";

export interface CarLoanSummary {
  confirmedReceipts: CarLoanReceipt[];
  currentReceipt?: CarLoanReceipt;
  totalCashPaid: number;
  principalPaid: number;
  interestPaid: number;
  feesPaid: number;
  downPaymentPaid: number;
  officialPayoff: number;
  dealerBalance: number;
  paymentsRemaining: number;
  issues: string[];
}

export function summarizeCarLoan(carLoan: CarLoanData, transactions: SpreadsheetRow[] = []): CarLoanSummary {
  const confirmedReceipts = carLoan.receipts
    .filter((receipt) => receipt.status === "confirmed")
    .sort((a, b) => `${a.paidDate}-${a.createdAt}`.localeCompare(`${b.paidDate}-${b.createdAt}`));
  const currentReceipt = confirmedReceipts[confirmedReceipts.length - 1];
  const fees = (receipt: CarLoanReceipt) =>
    value(receipt.lateFeesPaid) + value(receipt.otherFeesPaid) + value(receipt.sideNoteFeesPaid);

  return {
    confirmedReceipts,
    currentReceipt,
    totalCashPaid: sum(confirmedReceipts, (receipt) => receipt.totalPaid),
    principalPaid: sum(confirmedReceipts, (receipt) => value(receipt.principalPaid)),
    interestPaid: sum(confirmedReceipts, (receipt) => value(receipt.interestPaid)),
    feesPaid: sum(confirmedReceipts, fees),
    downPaymentPaid: sum(confirmedReceipts, (receipt) => value(receipt.downPaymentPaid)),
    officialPayoff: value(currentReceipt?.officialPayoff),
    dealerBalance: value(currentReceipt?.accountBalance),
    paymentsRemaining: value(currentReceipt?.paymentsRemaining),
    issues: reconciliationIssues(carLoan, transactions),
  };
}

export function receiptComponentTotal(receipt: CarLoanReceipt): number {
  return value(receipt.downPaymentPaid)
    + value(receipt.principalPaid)
    + value(receipt.interestPaid)
    + value(receipt.lateFeesPaid)
    + value(receipt.otherFeesPaid)
    + value(receipt.sideNoteFeesPaid)
    - value(receipt.creditsApplied);
}

export function reconciliationIssues(carLoan: CarLoanData, transactions: SpreadsheetRow[] = []): string[] {
  const active = carLoan.receipts.filter((receipt) => !["rejected", "superseded"].includes(receipt.status));
  const issues: string[] = [];
  const receiptNumbers = new Map<string, CarLoanReceipt[]>();

  active.forEach((receipt) => {
    if (receipt.receiptNumber) {
      const matching = receiptNumbers.get(receipt.receiptNumber) || [];
      receiptNumbers.set(receipt.receiptNumber, [...matching, receipt]);
    }
    if (Math.abs(receiptComponentTotal(receipt) - receipt.totalPaid) > 0.009) {
      issues.push(`Receipt ${receipt.receiptNumber || receipt.id} components differ from its documented total.`);
    }
  });

  receiptNumbers.forEach((receipts, number) => {
    if (receipts.length > 1) issues.push(`Receipt number ${number} appears ${receipts.length} times and needs dealer verification.`);
  });

  const dates = new Map<string, number>();
  active.forEach((receipt) => dates.set(receipt.paidDate, (dates.get(receipt.paidDate) || 0) + 1));
  dates.forEach((count, date) => {
    if (count > 1) issues.push(`${count} separate payments are documented on ${date}; they remain separate records.`);
  });

  const firstSchedule = carLoan.schedule[0];
  const firstActual = active.find((receipt) => receipt.paidDate === firstSchedule?.scheduledDate && receipt.status === "confirmed");
  if (firstSchedule && firstActual?.principalPaid !== undefined && Math.abs(firstActual.principalPaid - firstSchedule.scheduledPrincipal) > 0.009) {
    issues.push(`The ${firstActual.paidDate} receipt principal differs from the original amortization schedule.`);
  }

  carLoan.communications.forEach((communication) => {
    if (communication.status === "conflicts_with_receipt") issues.push(`Dealer communication on ${communication.messageDate} conflicts with a receipt.`);
  });
  const unsupportedPayments = transactions.filter((transaction) =>
    transaction.cells.category === "Debt Payments"
    && transaction.cells.notes?.includes("Car payment recorded")
    && !transaction.id.startsWith("car-receipt-")
  );
  if (unsupportedPayments.length) {
    issues.push(`${unsupportedPayments.length} car-payment transaction${unsupportedPayments.length === 1 ? " is" : "s are"} not backed by confirmed receipt evidence.`);
  }
  return issues;
}

export function syncConfirmedReceiptTransactions(
  transactions: SpreadsheetRow[],
  receipts: CarLoanReceipt[]
): SpreadsheetRow[] {
  const receiptIds = new Set(receipts.map((receipt) => receiptTransactionId(receipt.id)));
  const preserved = transactions.filter((row) => !row.id.startsWith("car-receipt-") || receiptIds.has(row.id));
  const byId = new Map(preserved.map((row) => [row.id, row]));

  receipts.forEach((receipt) => {
    const id = receiptTransactionId(receipt.id);
    if (receipt.status !== "confirmed") {
      byId.delete(id);
      return;
    }
    byId.set(id, receiptToTransaction(receipt));
  });
  return [...byId.values()];
}

export function receiptToTransaction(receipt: CarLoanReceipt): SpreadsheetRow {
  return {
    id: receiptTransactionId(receipt.id),
    cells: {
      description: receipt.paymentType.toLowerCase() === "down" ? "Lincoln MKX deferred down payment" : "Lincoln MKX car payment",
      type: "expense",
      category: "Debt Payments",
      amount: String(receipt.totalPaid),
      date: receipt.paidDate,
      account: receipt.paymentMethod,
      recurring: "No",
      notes: `Confirmed dealer receipt ${receipt.receiptNumber}. Car payment recorded from verified evidence.`,
      principalAmount: String(value(receipt.principalPaid)),
      interestAmount: String(value(receipt.interestPaid)),
      feesAmount: String(value(receipt.lateFeesPaid) + value(receipt.otherFeesPaid) + value(receipt.sideNoteFeesPaid)),
      officialPayoff: String(value(receipt.officialPayoff)),
      accountBalance: String(value(receipt.accountBalance)),
      receiptId: receipt.id,
    },
  };
}

export function communicationConflicts(communication: CarLoanCommunication, receipt?: CarLoanReceipt): boolean {
  if (!receipt) return false;
  return differs(communication.paymentAcknowledged, receipt.totalPaid)
    || differs(communication.payoffStated, receipt.officialPayoff)
    || differs(communication.accountBalanceStated, receipt.accountBalance);
}

function receiptTransactionId(receiptId: string) {
  return `car-receipt-${receiptId}`;
}

function sum(rows: CarLoanReceipt[], selector: (row: CarLoanReceipt) => number) {
  return rows.reduce((total, row) => total + selector(row), 0);
}

function value(input: number | undefined) {
  return Number.isFinite(input) ? input || 0 : 0;
}

function differs(a: number | undefined, b: number | undefined) {
  return a !== undefined && b !== undefined && Math.abs(a - b) > 0.009;
}
