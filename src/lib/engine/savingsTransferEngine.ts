import { isValidIsoDate, toNumber } from "../calculations/currency";
import { depositAccountOptions, eligibleDepositAccounts } from "./paycheckPlannerEngine";
import type { AppData, SpreadsheetRow } from "../types/app";

export interface SavingsTransferInput {
  sourceId: string;
  destinationId: string;
  amount: number;
  date: string;
  transferId?: string;
}

export interface TransactionEndpointOption {
  value: string;
  label: string;
  id: string;
  kind: "money" | "savings";
  balance: number;
  isNew: boolean;
}

const TRANSACTION_EDITOR = "transaction-editor";

export function transactionEndpointOptions(data: AppData): TransactionEndpointOption[] {
  const moneyOptions = depositAccountOptions(data).map((account) => ({
    value: account.label,
    label: `${account.label} · Account${account.isNew ? " · add" : ` · ${currencyValue(account.balance)}`}`,
    id: account.id,
    kind: "money" as const,
    balance: account.balance,
    isNew: account.isNew,
  }));
  const savingsOptions = data.sections.savings
    .filter((row) => Boolean(row.cells.name?.trim()))
    .map((row) => ({
      value: row.cells.name.trim(),
      label: `${row.cells.name.trim()} · Vault · ${currencyValue(toNumber(row.cells.balance))}`,
      id: row.id,
      kind: "savings" as const,
      balance: toNumber(row.cells.balance),
      isNew: false,
    }));
  const valueCounts = new Map<string, number>();
  [...moneyOptions, ...savingsOptions].forEach((option) => {
    const key = normalizeEndpointLabel(option.value);
    valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
  });
  const occurrences = new Map<string, number>();
  return [...moneyOptions, ...savingsOptions].map((option) => {
    const duplicate = (valueCounts.get(normalizeEndpointLabel(option.value)) || 0) > 1;
    if (!duplicate) return option;
    const occurrenceKey = `${normalizeEndpointLabel(option.value)}:${option.kind}`;
    const occurrence = (occurrences.get(occurrenceKey) || 0) + 1;
    occurrences.set(occurrenceKey, occurrence);
    const sameKindCount = [...moneyOptions, ...savingsOptions].filter((candidate) => candidate.kind === option.kind && normalizeEndpointLabel(candidate.value) === normalizeEndpointLabel(option.value)).length;
    const suffix = `${option.kind === "money" ? "Account" : "Vault"}${sameKindCount > 1 ? ` ${occurrence}` : ""}`;
    return { ...option, value: `${option.value} · ${suffix}` };
  });
}

export function syncTransactionTransfers(data: AppData, nextTransactions: SpreadsheetRow[]): AppData {
  const endpointOptions = transactionEndpointOptions(data);
  const moneyBalances = new Map(endpointOptions.filter((option) => option.kind === "money").map((option) => [option.id, option.balance]));
  const savingsBalances = new Map(endpointOptions.filter((option) => option.kind === "savings").map((option) => [option.id, option.balance]));
  const materializedMoneyIds = new Set(data.sections.money.map((row) => row.id));

  for (const row of data.sections.transactions) {
    if (row.cells.balanceApplied !== "yes" || row.cells.balanceApplication !== TRANSACTION_EDITOR) continue;
    const amount = Math.abs(toNumber(row.cells.amount));
    adjustEndpointBalance(row.cells.transferSourceId, amount, moneyBalances, savingsBalances);
    adjustEndpointBalance(row.cells.transferDestinationId, -amount, moneyBalances, savingsBalances);
  }

  const transactions = nextTransactions.map((row) => {
    const cleanRow = stripEditorApplication(row);
    if (transactionTypeValue(row) !== "transfer") return cleanRow;
    if (row.cells.balanceApplied === "yes" && row.cells.balanceApplication !== TRANSACTION_EDITOR) return row;

    const sourceValue = row.cells.account?.trim();
    const destinationValue = row.cells.transferDestination?.trim();
    const amount = Math.abs(toNumber(row.cells.amount));
    const date = row.cells.date?.trim();
    if (!sourceValue || !destinationValue || !amount || !date) return cleanRow;

    const source = resolveEndpoint(endpointOptions, sourceValue, row.cells.transferSourceId);
    const destination = resolveEndpoint(endpointOptions, destinationValue, row.cells.transferDestinationId);
    if (!source) throw new Error("Choose a valid source account or savings vault.");
    if (!destination) throw new Error("Choose a valid destination account or savings vault.");
    if (source.id === destination.id && source.kind === destination.kind) {
      return withTransferValidation(cleanRow, "Choose two different places for this transfer.");
    }
    if (source.kind === destination.kind) {
      return withTransferValidation(cleanRow, "Choose one Money Snapshot account and one savings vault.");
    }
    if (!isValidIsoDate(date)) throw new Error("Choose a valid transfer date.");
    const sourceBalance = endpointBalance(source, moneyBalances, savingsBalances);
    if (amount > sourceBalance) throw new Error(`This transfer exceeds the ${endpointName(source)} balance.`);

    adjustEndpointBalance(source.id, -amount, moneyBalances, savingsBalances);
    adjustEndpointBalance(destination.id, amount, moneyBalances, savingsBalances);
    if (source.kind === "money") materializedMoneyIds.add(source.id);
    if (destination.kind === "money") materializedMoneyIds.add(destination.id);
    const generatedDescription = `Transfer from ${endpointName(source)} to ${endpointName(destination)}`;
    const descriptionWasGenerated = !row.cells.description?.trim() || row.cells.transferDescriptionApplied === "yes";

    return {
      ...cleanRow,
      cells: {
        ...cleanRow.cells,
        description: descriptionWasGenerated ? generatedDescription : cleanRow.cells.description,
        transferDescriptionApplied: descriptionWasGenerated ? "yes" : "",
        type: "transfer",
        category: "Savings",
        amount: currencyValue(-amount),
        account: source.value,
        transferDestination: destination.value,
        transferSourceId: source.id,
        transferDestinationId: destination.id,
        balanceApplied: "yes",
        balanceApplication: TRANSACTION_EDITOR,
        notes: cleanRow.cells.notes || `Moved from ${endpointName(source)} to ${endpointName(destination)}. Balances applied automatically.`,
      },
    };
  });

  const addedMoneyRows = endpointOptions
    .filter((option) => option.kind === "money" && option.isNew && materializedMoneyIds.has(option.id))
    .map((option) => ({ id: option.id, cells: { label: endpointName(option), amount: currencyValue(moneyBalances.get(option.id) || 0), section: "cash", notes: "Added from Transactions" } }));

  return {
    ...data,
    sections: {
      ...data.sections,
      money: [
        ...data.sections.money.map((row) => moneyBalances.has(row.id)
          ? { ...row, cells: { ...row.cells, amount: currencyValue(moneyBalances.get(row.id) || 0) } }
          : row),
        ...addedMoneyRows,
      ],
      savings: data.sections.savings.map((row) => savingsBalances.has(row.id)
        ? { ...row, cells: { ...row.cells, balance: currencyValue(savingsBalances.get(row.id) || 0) } }
        : row),
      transactions,
    },
  };
}

export function applySavingsTransfer(data: AppData, input: SavingsTransferInput): AppData {
  if (input.transferId && data.sections.transactions.some((row) => row.id === input.transferId)) return data;
  const source = data.sections.money.find((row) => row.id === input.sourceId);
  const destination = data.sections.savings.find((row) => row.id === input.destinationId);
  const amount = Math.round(input.amount * 100) / 100;

  if (!source) throw new Error("Choose a valid source card or account.");
  if (!eligibleDepositAccounts(data).some((row) => row.id === source.id)) throw new Error("Savings transfers must come from a cash, checking, or debit account.");
  if (!destination) throw new Error("Choose a valid savings vault.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a transfer amount greater than $0.");
  if (!isValidIsoDate(input.date)) throw new Error("Choose a valid transfer date.");

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
          transferDestination: destinationLabel,
        },
      }],
    },
  };
}

function resolveEndpoint(options: TransactionEndpointOption[], value: string, id?: string): TransactionEndpointOption | undefined {
  if (id) {
    const byId = options.find((option) => option.id === id);
    if (byId && byId.value === value) return byId;
  }
  return options.find((option) => normalizeEndpointLabel(option.value) === normalizeEndpointLabel(value));
}

function endpointBalance(option: TransactionEndpointOption, moneyBalances: Map<string, number>, savingsBalances: Map<string, number>): number {
  return (option.kind === "money" ? moneyBalances : savingsBalances).get(option.id) || 0;
}

function adjustEndpointBalance(id: string | undefined, adjustment: number, moneyBalances: Map<string, number>, savingsBalances: Map<string, number>) {
  if (!id) return;
  const balances = moneyBalances.has(id) ? moneyBalances : savingsBalances.has(id) ? savingsBalances : undefined;
  if (balances) balances.set(id, Math.round(((balances.get(id) || 0) + adjustment) * 100) / 100);
}

function stripEditorApplication(row: SpreadsheetRow): SpreadsheetRow {
  const cells = { ...row.cells };
  delete cells.transferValidation;
  if (row.cells.balanceApplication !== TRANSACTION_EDITOR) return { ...row, cells };
  delete cells.balanceApplied;
  delete cells.balanceApplication;
  delete cells.transferSourceId;
  delete cells.transferDestinationId;
  return { ...row, cells };
}

function withTransferValidation(row: SpreadsheetRow, message: string): SpreadsheetRow {
  return { ...row, cells: { ...row.cells, transferValidation: message } };
}

function transactionTypeValue(row: SpreadsheetRow): string {
  return String(row.cells.type || "").trim().toLowerCase();
}

function endpointName(option: TransactionEndpointOption): string {
  return option.value.replace(/ · (Account|Vault)(?: \d+)?$/, "");
}

function normalizeEndpointLabel(value: string | undefined): string {
  return String(value || "").trim().toLowerCase();
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
