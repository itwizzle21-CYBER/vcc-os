import { isBlankRow, toNumber } from "../calculations/currency";
import type { AppData, SpreadsheetRow } from "../types/app";
import { isCarPaymentTransaction, syncBillPaymentTransactions } from "./billPaymentSync";
import { syncTransactionTransfers } from "./savingsTransferEngine";

export function applyBillRowsEvent(
  data: AppData,
  nextBills: SpreadsheetRow[],
  paymentDate?: string,
): AppData {
  assertNewBillPaymentsHaveAccounts(data.sections.bills, nextBills);
  const billTransactions = syncBillPaymentTransactions(
    data.sections.bills,
    nextBills,
    data.sections.transactions,
    paymentDate,
  );
  const carPayment = reconcileCarPaymentRows(
    data.sections.transactions,
    billTransactions,
    data.sections.carPayment,
  );
  const reconciled = syncTransactionTransfers(data, carPayment.transactions);

  return {
    ...reconciled,
    sections: {
      ...reconciled.sections,
      bills: nextBills,
      carPayment: carPayment.carPayment,
    },
  };
}

export function deleteTransactionEvent(data: AppData, transactionId: string): AppData {
  const deleted = data.sections.transactions.find((row) => row.id === transactionId);
  if (!deleted) return data;

  const nextTransactions = data.sections.transactions.filter((row) => row.id !== transactionId);
  const billId = deleted.cells.billId?.trim();
  const nextBills = billId
    ? data.sections.bills.map((bill) => bill.id === billId
      ? {
          ...bill,
          cells: {
            ...bill.cells,
            status: "unpaid",
            paymentAccount: "",
            paidDate: "",
          },
        }
      : bill)
    : data.sections.bills;
  const carPayment = reconcileCarPaymentRows(
    data.sections.transactions,
    nextTransactions,
    data.sections.carPayment,
  );
  const reconciled = syncTransactionTransfers(data, carPayment.transactions);

  return {
    ...reconciled,
    sections: {
      ...reconciled.sections,
      bills: nextBills,
      carPayment: carPayment.carPayment,
    },
  };
}

export function reconcileCarPaymentRows(
  previousTransactions: SpreadsheetRow[],
  nextTransactions: SpreadsheetRow[],
  carPaymentRows: SpreadsheetRow[],
): { transactions: SpreadsheetRow[]; carPayment: SpreadsheetRow[] } {
  const previousIds = new Set(previousTransactions.map((row) => row.id));
  const nextIds = new Set(nextTransactions.map((row) => row.id));
  const loan = carPaymentRows.find((row) => !isBlankRow(row.cells));
  if (!loan) return { transactions: nextTransactions, carPayment: carPaymentRows };

  let remaining = toNumber(loan.cells.remainingBalance);
  const transactions = nextTransactions.map((transaction) => {
    if (!isCarPaymentTransaction(transaction) || previousIds.has(transaction.id)) return transaction;
    const amount = Math.abs(toNumber(transaction.cells.amount));
    const interest = Math.max(0, toNumber(loan.cells.apr));
    const interestAmount = amount * (interest / 100);
    const principalAmount = Math.max(0, amount - interestAmount);
    remaining = Math.max(0, remaining - principalAmount);
    return {
      ...transaction,
      cells: {
        ...transaction.cells,
        interestPercent: String(interest),
        interestAmount: String(interestAmount),
        principalAmount: String(principalAmount),
        remainingBalance: String(remaining),
        vehicleId: loan.id,
      },
    };
  });

  previousTransactions.forEach((transaction) => {
    if (isCarPaymentTransaction(transaction) && !nextIds.has(transaction.id)) {
      remaining += Math.max(0, toNumber(transaction.cells.principalAmount) || Math.abs(toNumber(transaction.cells.amount)));
    }
  });

  return {
    transactions,
    carPayment: carPaymentRows.map((row) => row.id === loan.id
      ? { ...row, cells: { ...row.cells, remainingBalance: remaining.toFixed(2) } }
      : row),
  };
}

function assertNewBillPaymentsHaveAccounts(previousBills: SpreadsheetRow[], nextBills: SpreadsheetRow[]): void {
  const previousById = new Map(previousBills.map((bill) => [bill.id, bill]));
  for (const bill of nextBills) {
    if (!isPaid(bill) || isPaid(previousById.get(bill.id))) continue;
    if (!bill.cells.paymentAccount?.trim()) {
      throw new Error(`Choose the account that paid ${bill.cells.name || "this bill"} before marking it paid.`);
    }
  }
}

function isPaid(row: SpreadsheetRow | undefined): boolean {
  return String(row?.cells.status || "").trim().toLowerCase() === "paid";
}
