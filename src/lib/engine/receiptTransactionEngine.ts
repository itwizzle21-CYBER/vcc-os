import { allocateTaxCents, amountToCents, centsToAmount } from "../calculations/receiptMath";
import { toNumber } from "../calculations/currency";
import type { SpreadsheetRow } from "../types/app";
import { transactionType } from "./transactionEngine";

export function migrateLegacyReceiptTaxRows(rows: SpreadsheetRow[]): SpreadsheetRow[] {
  const receiptGroups = new Map<string, SpreadsheetRow[]>();
  rows.forEach((row) => {
    const receiptId = row.cells.receiptId?.trim();
    if (!receiptId) return;
    receiptGroups.set(receiptId, [...(receiptGroups.get(receiptId) || []), row]);
  });

  const migratedItems = new Map<string, SpreadsheetRow>();
  const removedTaxRowIds = new Set<string>();

  receiptGroups.forEach((group) => {
    const legacyTaxRows = group.filter(isLegacySalesTaxRow);
    const itemRows = group.filter((row) => !legacyTaxRows.includes(row));
    if (!legacyTaxRows.length || !itemRows.length) return;

    const itemSubtotalCents = itemRows.map((row) => amountToCents(Math.abs(toNumber(row.cells.amount))));
    const taxCents = legacyTaxRows.reduce((sum, row) => sum + amountToCents(Math.abs(toNumber(row.cells.amount))), 0);
    const subtotalCents = itemSubtotalCents.reduce((sum, amount) => sum + amount, 0);
    const allocations = allocateTaxCents(itemSubtotalCents, taxCents);
    const receiptTotal = centsToAmount(subtotalCents + taxCents).toFixed(2);

    itemRows.forEach((row, index) => {
      const itemTaxCents = allocations[index];
      const total = centsToAmount(itemSubtotalCents[index] + itemTaxCents);
      const signedTotal = transactionType(row) === "income" ? total : -total;
      migratedItems.set(row.id, {
        ...row,
        cells: {
          ...row.cells,
          salesTax: itemTaxCents ? centsToAmount(itemTaxCents).toFixed(2) : "",
          amount: signedTotal.toFixed(2),
          receiptSubtotal: centsToAmount(subtotalCents).toFixed(2),
          receiptTax: centsToAmount(taxCents).toFixed(2),
          receiptTotal,
        },
      });
    });
    legacyTaxRows.forEach((row) => removedTaxRowIds.add(row.id));
  });

  if (!removedTaxRowIds.size) return rows;
  return rows
    .filter((row) => !removedTaxRowIds.has(row.id))
    .map((row) => migratedItems.get(row.id) || row);
}

function isLegacySalesTaxRow(row: SpreadsheetRow): boolean {
  return row.cells.description?.trim().toLowerCase() === "sales tax"
    && !row.cells.salesTax?.trim();
}
