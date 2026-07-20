import type { AppData, SpreadsheetRow } from "../types/app";

export type VitaReceiptRecord = {
  transaction_id: string;
  merchant: string;
  amount: number | string;
  occurred_on: string;
  direction: "expense" | "income" | "transfer";
  account_name: string;
  category: string;
  reference_code: string | null;
  raw_text?: string | null;
};

export function vitaReceiptToTransaction(receipt: VitaReceiptRecord): SpreadsheetRow {
  const amount = Math.abs(Number(receipt.amount) || 0);
  const signedAmount = receipt.direction === "expense" ? -amount : amount;

  return {
    id: receipt.transaction_id,
    cells: {
      description: receipt.merchant,
      type: receipt.direction,
      category: receipt.category,
      amount: signedAmount.toFixed(2),
      date: receipt.occurred_on,
      account: receipt.account_name,
      recurring: "No",
      notes: `VitaScan${receipt.reference_code ? ` - Ref ${receipt.reference_code}` : ""}${receipt.raw_text ? `\nFull scan:\n${receipt.raw_text}` : ""}`,
    },
  };
}

export function mergeVitaReceipts(data: AppData, receipts: VitaReceiptRecord[]): AppData {
  const transactionIds = new Set(data.sections.transactions.map((row) => row.id));
  const additions = receipts
    .filter((receipt) => {
      if (!receipt.transaction_id || transactionIds.has(receipt.transaction_id)) return false;
      transactionIds.add(receipt.transaction_id);
      return true;
    })
    .map(vitaReceiptToTransaction);

  if (!additions.length) return data;

  return {
    ...data,
    sections: {
      ...data.sections,
      transactions: [...data.sections.transactions, ...additions],
    },
  };
}
