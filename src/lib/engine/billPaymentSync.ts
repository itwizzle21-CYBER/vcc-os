import type { SpreadsheetRow } from "../types/app";

const PAYMENT_ID_PREFIX = "bill-payment-";
const CAR_PAYMENT_MARKER = "Car payment recorded from Bills.";

export function syncBillPaymentTransactions(
  previousBills: SpreadsheetRow[],
  nextBills: SpreadsheetRow[],
  transactions: SpreadsheetRow[],
  paymentDate = localDate(new Date())
): SpreadsheetRow[] {
  const previousById = new Map(previousBills.map((row) => [row.id, row]));
  const nextById = new Map(nextBills.map((row) => [row.id, row]));
  let nextTransactions = [...transactions];

  for (const bill of nextBills) {
    const previousBill = previousById.get(bill.id);
    const wasPaid = previousBill ? isPaid(previousBill) : false;
    const paid = isPaid(bill);
    const paymentId = paymentTransactionId(bill.id);
    const paymentIndex = nextTransactions.findIndex((row) => row.id === paymentId);

    if (paid && paymentIndex === -1) {
      nextTransactions.push(createBillPaymentTransaction(bill, paymentDate));
    } else if (paid && paymentIndex !== -1) {
      const existingPayment = nextTransactions[paymentIndex];
      nextTransactions[paymentIndex] = createBillPaymentTransaction(bill, existingPayment.cells.date || paymentDate);
    }

    if (!paid && wasPaid && paymentIndex !== -1) {
      nextTransactions = nextTransactions.filter((row) => row.id !== paymentId);
    }
  }

  // Deleting a bill must not erase an already-recorded payment.
  return nextTransactions.filter((transaction) => {
    if (!transaction.id.startsWith(PAYMENT_ID_PREFIX)) return true;
    const billId = transaction.id.slice(PAYMENT_ID_PREFIX.length);
    return !nextById.has(billId) || isPaid(nextById.get(billId)!);
  });
}

function createBillPaymentTransaction(bill: SpreadsheetRow, paymentDate: string): SpreadsheetRow {
  const name = String(bill.cells.name || "Bill").trim() || "Bill";
  const carPayment = isCarPaymentBill(bill);
  return {
    id: paymentTransactionId(bill.id),
    cells: {
      description: carPayment ? `${name} payment` : `${name} bill payment`,
      type: "expense",
      category: carPayment ? "Debt Payments" : bill.cells.category || "",
      amount: bill.cells.amount || "",
      date: paymentDate,
      account: "",
      recurring: bill.cells.autopay || "",
      notes: carPayment
        ? `${CAR_PAYMENT_MARKER} Recorded automatically when ${name} was marked paid.`
        : `Recorded automatically when ${name} was marked paid.`,
    },
  };
}

export function isCarPaymentBill(bill: SpreadsheetRow): boolean {
  const value = [bill.cells.name, bill.cells.category, bill.cells.notes]
    .join(" ")
    .trim()
    .toLowerCase();
  return ["car payment", "car note", "auto loan", "vehicle payment", "vehicle loan"].some((term) => value.includes(term));
}

export function isCarPaymentTransaction(transaction: SpreadsheetRow): boolean {
  return transaction.cells.notes?.includes("Car payment recorded") || false;
}

function paymentTransactionId(billId: string): string {
  return `${PAYMENT_ID_PREFIX}${billId}`;
}

function isPaid(row: SpreadsheetRow): boolean {
  return String(row.cells.status || "").trim().toLowerCase() === "paid";
}

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
