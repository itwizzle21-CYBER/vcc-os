import { toNumber } from "./currency";

export type ReceiptPriceInput = {
  quantity: string | number;
  unitPrice: string | number;
};

export type ReceiptLineAmounts = {
  subtotalCents: number;
  salesTaxCents: number;
  totalCents: number;
};

export function amountToCents(value: string | number | undefined): number {
  return Math.max(0, Math.round(toNumber(value) * 100));
}

export function centsToAmount(cents: number): number {
  return Math.round(cents) / 100;
}

export function allocateTaxCents(lineSubtotalCents: number[], taxCents: number): number[] {
  const safeLines = lineSubtotalCents.map((amount) => Math.max(0, Math.round(amount)));
  const safeTax = Math.max(0, Math.round(taxCents));
  const subtotal = safeLines.reduce((sum, amount) => sum + amount, 0);
  if (!safeTax || !subtotal) return safeLines.map(() => 0);

  const allocations = safeLines.map((amount) => Math.floor((amount * safeTax) / subtotal));
  let remaining = safeTax - allocations.reduce((sum, amount) => sum + amount, 0);
  const priority = safeLines
    .map((amount, index) => ({ index, remainder: (amount * safeTax) % subtotal }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);

  for (let index = 0; index < priority.length && remaining > 0; index += 1, remaining -= 1) {
    allocations[priority[index].index] += 1;
  }
  return allocations;
}

export function calculateReceiptLineAmounts(lines: ReceiptPriceInput[], salesTax: string | number | undefined): ReceiptLineAmounts[] {
  const lineSubtotalCents = lines.map((line) => {
    const quantity = Math.max(0, toNumber(line.quantity));
    const unitPrice = Math.max(0, toNumber(line.unitPrice));
    return Math.round(quantity * unitPrice * 100);
  });
  const allocatedTax = allocateTaxCents(lineSubtotalCents, amountToCents(salesTax));

  return lineSubtotalCents.map((subtotalCents, index) => ({
    subtotalCents,
    salesTaxCents: allocatedTax[index],
    totalCents: subtotalCents + allocatedTax[index],
  }));
}
