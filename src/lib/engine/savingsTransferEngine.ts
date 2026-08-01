import { isValidIsoDate, toNumber } from "../calculations/currency";
import { depositAccountOptions, eligibleDepositAccounts } from "./paycheckPlannerEngine";
import { transactionType } from "./transactionEngine";
import type { AppData, SpreadsheetRow } from "../types/app";
import { assertChimeBalanceAllowed, isChimeAccount } from "./chimeAccountingEngine";

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
const BORROWED_SHORTFALL_ROW_ID = "money-borrowed-transaction-shortfalls";
const MYPAY_ADVANCE_ROW_ID = "money-borrowed-mypay-advances";

export type TransactionShortfallSource = "overdraft" | "borrowed" | "unreconciled";

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

export function syncTransactionEndpointLabels(data: AppData): AppData {
  const endpointById = new Map(transactionEndpointOptions(data).map((option) => [option.id, option]));
  const transactions = data.sections.transactions.map((row) => {
    const sourceId = row.cells.transferSourceId || row.cells.balanceEndpointId || row.cells.depositAccountId;
    const source = sourceId ? endpointById.get(sourceId) : undefined;
    const destination = row.cells.transferDestinationId
      ? endpointById.get(row.cells.transferDestinationId)
      : undefined;
    if (!source && !destination) return row;
    return {
      ...row,
      cells: {
        ...row.cells,
        account: source?.value || row.cells.account,
        transferDestination: destination?.value || row.cells.transferDestination,
      },
    };
  });
  const paycheckHistory = data.paycheckHistory.map((row) => {
    const endpoint = row.depositAccountId ? endpointById.get(row.depositAccountId) : undefined;
    return endpoint ? { ...row, depositAccountLabel: endpointName(endpoint) } : row;
  });

  return {
    ...data,
    sections: { ...data.sections, transactions },
    paycheckHistory,
  };
}

export function syncTransactionTransfers(data: AppData, nextTransactions: SpreadsheetRow[]): AppData {
  const endpointOptions = transactionEndpointOptions(data);
  const previousTransactions = new Map(data.sections.transactions.map((row) => [row.id, row]));
  const moneyBalances = new Map(endpointOptions.filter((option) => option.kind === "money").map((option) => [option.id, option.balance]));
  const savingsBalances = new Map(endpointOptions.filter((option) => option.kind === "savings").map((option) => [option.id, option.balance]));
  const borrowedBalances = new Map(
    data.sections.money
      .filter(isBorrowedMoneyRow)
      .map((row) => [row.id, toNumber(row.cells.amount)]),
  );
  const materializedBorrowedIds = new Set(borrowedBalances.keys());
  if (!borrowedBalances.has(BORROWED_SHORTFALL_ROW_ID)) borrowedBalances.set(BORROWED_SHORTFALL_ROW_ID, 0);
  const existingMyPayRow = data.sections.money.find((row) => isBorrowedMoneyRow(row) && /my\s?pay/i.test(`${row.cells.label || ""} ${row.cells.notes || ""}`));
  const myPayLiabilityId = existingMyPayRow?.id || MYPAY_ADVANCE_ROW_ID;
  if (!borrowedBalances.has(myPayLiabilityId)) borrowedBalances.set(myPayLiabilityId, 0);
  const materializedMoneyIds = new Set(data.sections.money.map((row) => row.id));

  for (const row of data.sections.transactions) {
    if (row.cells.balanceApplied !== "yes" || row.cells.balanceApplication !== TRANSACTION_EDITOR) continue;
    const amount = Math.abs(toNumber(row.cells.amount));
    const effect = row.cells.balanceEffect || transactionType(row);
    if (effect === "transfer") {
      adjustEndpointBalance(row.cells.transferSourceId, amount, moneyBalances, savingsBalances);
      adjustEndpointBalance(row.cells.transferDestinationId, -amount, moneyBalances, savingsBalances);
    } else {
      const fundedShortfall = isExternallyFundedShortfall(row) ? Math.abs(toNumber(row.cells.shortfallAmount)) : 0;
      adjustEndpointBalance(row.cells.balanceEndpointId, effect === "income" ? -amount : amount - fundedShortfall, moneyBalances, savingsBalances);
      const liabilityId = row.cells.shortfallLiabilityId || BORROWED_SHORTFALL_ROW_ID;
      if (row.cells.shortfallSource === "borrowed" && fundedShortfall > 0 && materializedBorrowedIds.has(liabilityId)) {
        adjustBorrowedBalance(liabilityId, -fundedShortfall, borrowedBalances);
      }
      const previousMyPayAdvance = Math.abs(toNumber(row.cells.myPayAdvanceAmount));
      if (previousMyPayAdvance > 0) {
        adjustBorrowedBalance(row.cells.myPayLiabilityId || myPayLiabilityId, -previousMyPayAdvance, borrowedBalances);
      }
    }
  }

  const transactions = nextTransactions.map((row) => {
    const cleanRow = stripEditorApplication(row);
    if (row.cells.balanceApplied === "yes" && row.cells.balanceApplication !== TRANSACTION_EDITOR) return row;
    const previous = previousTransactions.get(row.id);
    const shouldApplyBalance = !previous
      || previous.cells.balanceApplication === TRANSACTION_EDITOR
      || balanceFieldsChanged(previous, row);
    if (!shouldApplyBalance) return row;
    const type = transactionType(row);

    if (type === "income" || type === "expense") {
      const transactionRow = stripTransferFields(cleanRow);
      const accountValue = row.cells.account?.trim();
      const amount = Math.abs(toNumber(row.cells.amount));
      const date = row.cells.date?.trim();
      if (!accountValue || !amount || !date) return transactionRow;
      const endpoint = resolveEndpoint(
        endpointOptions,
        accountValue,
        row.cells.balanceEndpointId,
        Boolean(previous && previous.cells.account === row.cells.account),
      );
      if (!endpoint) throw new Error("Choose a valid account or savings vault.");
      if (!isValidIsoDate(date)) throw new Error("Choose a valid transaction date.");
      const currentBalance = endpointBalance(endpoint, moneyBalances, savingsBalances);
      const shortfallSource = normalizeShortfallSource(row.cells.shortfallSource);
      const shortfallAmount = type === "expense"
        ? Math.max(0, Math.round((amount - Math.max(0, currentBalance)) * 100) / 100)
        : 0;
      if (type === "expense" && endpoint.kind === "money") {
        const account = data.sections.money.find((candidate) => candidate.id === endpoint.id);
        assertChimeBalanceAllowed(account, currentBalance - amount);
      }
      const externallyFunded = shortfallAmount > 0 && shortfallSource !== "overdraft";
      if (externallyFunded) adjustEndpointBalance(endpoint.id, shortfallAmount, moneyBalances, savingsBalances);
      if (shortfallAmount > 0 && shortfallSource === "borrowed") {
        adjustBorrowedBalance(BORROWED_SHORTFALL_ROW_ID, shortfallAmount, borrowedBalances);
      }
      adjustEndpointBalance(endpoint.id, type === "income" ? amount : -amount, moneyBalances, savingsBalances);
      if (endpoint.kind === "money") materializedMoneyIds.add(endpoint.id);
      const spotMeRepaid = type === "income" && endpoint.kind === "money" && isChimeAccount(data.sections.money.find((candidate) => candidate.id === endpoint.id))
        ? Math.min(amount, Math.max(0, -currentBalance))
        : 0;
      const isMyPayAdvance = type === "income" && /my\s?pay/i.test(`${row.cells.description || ""} ${row.cells.category || ""} ${row.cells.notes || ""}`);
      if (isMyPayAdvance) adjustBorrowedBalance(myPayLiabilityId, amount, borrowedBalances);
      return {
        ...transactionRow,
        cells: {
          ...transactionRow.cells,
          type,
          amount: currencyValue(type === "income" ? amount : -amount),
          account: endpoint.value,
          shortfallSource: type === "expense" ? shortfallSource : "",
          shortfallAmount: shortfallAmount ? currencyValue(shortfallAmount) : "",
          shortfallLiabilityId: shortfallAmount > 0 && shortfallSource === "borrowed" ? BORROWED_SHORTFALL_ROW_ID : "",
          balanceEndpointId: endpoint.id,
          balanceEffect: type,
          balanceApplied: "yes",
          balanceApplication: TRANSACTION_EDITOR,
          spotMeRepaid: spotMeRepaid ? currencyValue(spotMeRepaid) : "",
          myPayAdvanceAmount: isMyPayAdvance ? currencyValue(amount) : "",
          myPayLiabilityId: isMyPayAdvance ? myPayLiabilityId : "",
          incomeClassification: isMyPayAdvance ? "borrowed_advance" : "earned",
          notes: isMyPayAdvance && spotMeRepaid > 0
            ? `$${currencyValue(spotMeRepaid)} automatically repaid SpotMe first; $${currencyValue(amount - spotMeRepaid)} was added to available Chime checking.`
            : transactionRow.cells.notes,
        },
      };
    }

    if (type !== "transfer") return cleanRow;

    const sourceValue = row.cells.account?.trim();
    const destinationValue = row.cells.transferDestination?.trim();
    const amount = Math.abs(toNumber(row.cells.amount));
    const date = row.cells.date?.trim();
    if (!sourceValue || !destinationValue || !amount || !date) return cleanRow;

    const source = resolveEndpoint(
      endpointOptions,
      sourceValue,
      row.cells.transferSourceId,
      Boolean(previous && previous.cells.account === row.cells.account),
    );
    const destination = resolveEndpoint(
      endpointOptions,
      destinationValue,
      row.cells.transferDestinationId,
      Boolean(previous && previous.cells.transferDestination === row.cells.transferDestination),
    );
    if (!source) throw new Error("Choose a valid source account or savings vault.");
    if (!destination) throw new Error("Choose a valid destination account or savings vault.");
    if (source.id === destination.id && source.kind === destination.kind) {
      return withTransferValidation(cleanRow, "Choose two different places for this transfer.");
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
        category: source.kind === "money" && destination.kind === "money" ? "Transfers" : "Savings",
        amount: currencyValue(-amount),
        account: source.value,
        transferDestination: destination.value,
        transferSourceId: source.id,
        transferDestinationId: destination.id,
        shortfallSource: "",
        balanceEffect: "transfer",
        balanceApplied: "yes",
        balanceApplication: TRANSACTION_EDITOR,
        notes: cleanRow.cells.notes || `Moved from ${endpointName(source)} to ${endpointName(destination)}. Balances applied automatically.`,
      },
    };
  });

  const addedMoneyRows = endpointOptions
    .filter((option) => option.kind === "money" && option.isNew && materializedMoneyIds.has(option.id))
    .map((option) => ({ id: option.id, cells: { label: endpointName(option), amount: currencyValue(moneyBalances.get(option.id) || 0), section: "cash", notes: "Added from Transactions" } }));
  const borrowedShortfallBalance = borrowedBalances.get(BORROWED_SHORTFALL_ROW_ID) || 0;
  const addedBorrowedRows = materializedBorrowedIds.has(BORROWED_SHORTFALL_ROW_ID) || borrowedShortfallBalance <= 0
    ? []
    : [{
      id: BORROWED_SHORTFALL_ROW_ID,
      cells: {
        label: "Borrowed Transaction Shortfalls",
        amount: currencyValue(borrowedShortfallBalance),
        section: "borrowed",
        notes: "Borrowing recorded when a transaction exceeded its selected account balance.",
      },
    }];
  const myPayAdvanceBalance = borrowedBalances.get(myPayLiabilityId) || 0;
  const addedMyPayRows = existingMyPayRow || myPayAdvanceBalance <= 0
    ? []
    : [{
      id: myPayLiabilityId,
      cells: {
        label: "MyPay Advances",
        amount: currencyValue(myPayAdvanceBalance),
        section: "borrowed",
        notes: "Automatically tracked when a MyPay advance is added to checking.",
      },
    }];

  return {
    ...data,
    sections: {
      ...data.sections,
      money: [
        ...data.sections.money.map((row) => {
          if (moneyBalances.has(row.id)) return { ...row, cells: { ...row.cells, amount: currencyValue(moneyBalances.get(row.id) || 0) } };
          if (borrowedBalances.has(row.id)) return { ...row, cells: { ...row.cells, amount: currencyValue(borrowedBalances.get(row.id) || 0) } };
          return row;
        }),
        ...addedMoneyRows,
        ...addedBorrowedRows,
        ...addedMyPayRows,
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

function resolveEndpoint(
  options: TransactionEndpointOption[],
  value: string,
  id?: string,
  preferId = false,
): TransactionEndpointOption | undefined {
  if (preferId && id) {
    const linked = options.find((option) => option.id === id);
    if (linked) return linked;
  }
  const byValue = options.find((option) => normalizeEndpointLabel(option.value) === normalizeEndpointLabel(value));
  if (byValue) return byValue;
  return id ? options.find((option) => option.id === id) : undefined;
}

function endpointBalance(option: TransactionEndpointOption, moneyBalances: Map<string, number>, savingsBalances: Map<string, number>): number {
  return (option.kind === "money" ? moneyBalances : savingsBalances).get(option.id) || 0;
}

function adjustEndpointBalance(id: string | undefined, adjustment: number, moneyBalances: Map<string, number>, savingsBalances: Map<string, number>) {
  if (!id) return;
  const balances = moneyBalances.has(id) ? moneyBalances : savingsBalances.has(id) ? savingsBalances : undefined;
  if (balances) balances.set(id, Math.round(((balances.get(id) || 0) + adjustment) * 100) / 100);
}

function adjustBorrowedBalance(id: string, adjustment: number, borrowedBalances: Map<string, number>) {
  borrowedBalances.set(id, Math.round(((borrowedBalances.get(id) || 0) + adjustment) * 100) / 100);
}

function stripEditorApplication(row: SpreadsheetRow): SpreadsheetRow {
  const cells = { ...row.cells };
  delete cells.transferValidation;
  if (row.cells.balanceApplication !== TRANSACTION_EDITOR) return { ...row, cells };
  delete cells.balanceApplied;
  delete cells.balanceApplication;
  delete cells.transferSourceId;
  delete cells.transferDestinationId;
  delete cells.balanceEndpointId;
  delete cells.balanceEffect;
  delete cells.shortfallAmount;
  delete cells.shortfallLiabilityId;
  delete cells.spotMeRepaid;
  delete cells.myPayAdvanceAmount;
  delete cells.myPayLiabilityId;
  delete cells.incomeClassification;
  return { ...row, cells };
}

function stripTransferFields(row: SpreadsheetRow): SpreadsheetRow {
  const cells: Record<string, string> = { ...row.cells, transferDestination: "" };
  delete cells.transferSourceId;
  delete cells.transferDestinationId;
  delete cells.transferDescriptionApplied;
  delete cells.transferValidation;
  return { ...row, cells };
}

function withTransferValidation(row: SpreadsheetRow, message: string): SpreadsheetRow {
  return { ...row, cells: { ...row.cells, transferValidation: message } };
}

function balanceFieldsChanged(previous: SpreadsheetRow, next: SpreadsheetRow): boolean {
  return ["type", "amount", "date", "account", "transferDestination", "shortfallSource"]
    .some((key) => String(previous.cells[key] || "") !== String(next.cells[key] || ""));
}

function normalizeShortfallSource(value: string | undefined): TransactionShortfallSource {
  if (value === "borrowed" || value === "unreconciled") return value;
  return "overdraft";
}

function isExternallyFundedShortfall(row: SpreadsheetRow): boolean {
  return row.cells.shortfallSource === "borrowed" || row.cells.shortfallSource === "unreconciled";
}

function isBorrowedMoneyRow(row: SpreadsheetRow): boolean {
  return (row.cells.section || "").trim().toLowerCase() === "borrowed";
}

function endpointName(option: TransactionEndpointOption): string {
  return option.value.replace(/ · (Account|Vault)(?: \d+)?$/, "");
}

function normalizeEndpointLabel(value: string | undefined): string {
  const normalized = String(value || "").trim().toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, "");
  return ["cash", "cashonhand", "physicalcash", "walletcash"].includes(compact) ? "cash" : normalized;
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
