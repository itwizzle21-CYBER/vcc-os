import { toNumber } from "../calculations/currency";
import type { AppData, SpreadsheetRow } from "../types/app";

export interface SavingsTransferInput {
  sourceId: string;
  destinationId: string;
  amount: number;
  date: string;
  transferId?: string;
}

export function applySavingsTransfer(data: AppData, input: SavingsTransferInput): AppData {
  const source = data.sections.money.find((row) => row.id === input.sourceId);
  const destination = data.sections.savings.find((row) => row.id === input.destinationId);
  const amount = Math.round(input.amount * 100) / 100;

  if (!source) throw new Error("Choose a valid source card or account.");
  if (!destination) throw new Error("Choose a valid savings vault.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a transfer amount greater than $0.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Choose a valid transfer date.");

  const sourceBalance = toNumber(source.cells.amount);
  if (amount > sourceBalance) {
    throw new Error(`This transfer exceeds the ${source.cells.label || "source account"} balance.`);
  }

  const sourceLabel = source.cells.label || "Money Snapshot account";
  const destinationLabel = destination.cells.name || "Savings";
  const transaction = createSavingsTransferTransaction(source, destination, amount, input.date, input.transferId);

  return {
    ...data,
    sections: {
      ...data.sections,
      money: data.sections.money.map((row) => row.id === source.id
        ? { ...row, cells: { ...row.cells, amount: currencyValue(sourceBalance - amount) } }
        : row),
      savings: data.sections.savings.map((row) => row.id === destination.id
        ? { ...row, cells: { ...row.cells, balance: currencyValue(toNumber(row.cells.balance) + amount) } }
        : row),
      transactions: [...data.sections.transactions, {
        ...transaction,
        cells: {
          ...transaction.cells,
          description: `Savings transfer to ${destinationLabel}`,
          account: sourceLabel,
        },
      }],
    },
  };
}

export function isBalanceAppliedTransaction(row: SpreadsheetRow): boolean {
  return row.cells.balanceApplied === "yes";
}

function createSavingsTransferTransaction(
  source: SpreadsheetRow,
  destination: SpreadsheetRow,
  amount: number,
  date: string,
  transferId?: string,
): SpreadsheetRow {
  const id = transferId || `savings-transfer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    cells: {
      description: `Savings transfer to ${destination.cells.name || "Savings"}`,
      type: "transfer",
      category: "Savings",
      amount: currencyValue(-amount),
      date,
      account: source.cells.label || "Money Snapshot account",
      recurring: "No",
      notes: `Moved from ${source.cells.label || "Money Snapshot account"} to ${destination.cells.name || "Savings"}. Balances applied automatically.`,
      transferSourceId: source.id,
      transferDestinationId: destination.id,
      balanceApplied: "yes",
    },
  };
}

function currencyValue(value: number): string {
  return value.toFixed(2);
}
