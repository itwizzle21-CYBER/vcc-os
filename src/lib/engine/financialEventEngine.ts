import { isBlankRow, toNumber } from "../calculations/currency";
import type { AppData, SpreadsheetRow } from "../types/app";
import {
  hasBillPaymentEvidence,
  isBillPaymentTransaction,
  isCarPaymentTransaction,
  storedBillStatus,
  syncBillPaymentTransactions,
} from "./billPaymentSync";
import { syncTransactionTransfers } from "./savingsTransferEngine";

export interface DeletedBillSnapshot {
  bill: SpreadsheetRow;
  billIndex: number;
  linkedTransactions: Array<{ row: SpreadsheetRow; index: number }>;
}

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

export function deleteBillEvent(
  data: AppData,
  billId: string,
): { data: AppData; snapshot: DeletedBillSnapshot | null } {
  const billIndex = data.sections.bills.findIndex((bill) => bill.id === billId);
  if (billIndex === -1) return { data, snapshot: null };

  const bill = data.sections.bills[billIndex];
  const linkedTransactions = data.sections.transactions
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.cells.billId === billId && isBillPaymentTransaction(row));
  const linkedIds = new Set(linkedTransactions.map(({ row }) => row.id));
  const nextTransactions = data.sections.transactions.filter((row) => !linkedIds.has(row.id));
  const carPayment = reconcileCarPaymentRows(
    data.sections.transactions,
    nextTransactions,
    data.sections.carPayment,
  );
  const reconciled = syncTransactionTransfers(data, carPayment.transactions);

  return {
    data: {
      ...reconciled,
      sections: {
        ...reconciled.sections,
        bills: data.sections.bills.filter((row) => row.id !== billId),
        carPayment: carPayment.carPayment,
      },
    },
    snapshot: { bill, billIndex, linkedTransactions },
  };
}

export function restoreDeletedBillEvent(data: AppData, snapshot: DeletedBillSnapshot): AppData {
  if (data.sections.bills.some((bill) => bill.id === snapshot.bill.id)) return data;

  const bills = [...data.sections.bills];
  bills.splice(Math.min(snapshot.billIndex, bills.length), 0, snapshot.bill);
  const transactions = [...data.sections.transactions];
  for (const linked of [...snapshot.linkedTransactions].sort((a, b) => a.index - b.index)) {
    if (transactions.some((row) => row.id === linked.row.id)) continue;
    transactions.splice(Math.min(linked.index, transactions.length), 0, linked.row);
  }
  const carPayment = reconcileCarPaymentRows(
    data.sections.transactions,
    transactions,
    data.sections.carPayment,
  );
  const reconciled = syncTransactionTransfers(data, carPayment.transactions);

  return {
    ...reconciled,
    sections: {
      ...reconciled.sections,
      bills,
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
    if (storedBillStatus(bill) !== "paid" || hasBillPaymentEvidence(previousById.get(bill.id))) continue;
    if (!bill.cells.paymentAccount?.trim()) {
      throw new Error(`Choose the account that paid ${bill.cells.name || "this bill"} before marking it paid.`);
    }
    if (!hasBillPaymentEvidence(bill)) {
      throw new Error(`Choose a valid paid date for ${bill.cells.name || "this bill"} before marking it paid.`);
    }
  }
}
