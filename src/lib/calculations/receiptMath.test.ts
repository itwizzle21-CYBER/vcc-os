import { describe, expect, it } from "vitest";
import { allocateTaxCents, calculateReceiptLineAmounts } from "./receiptMath";

describe("receipt calculations", () => {
  it("allocates ticket tax across items without losing a cent", () => {
    expect(calculateReceiptLineAmounts([
      { quantity: "2", unitPrice: "3.50" },
      { quantity: "1", unitPrice: "1.25" },
    ], "0.50")).toEqual([
      { subtotalCents: 700, salesTaxCents: 42, totalCents: 742 },
      { subtotalCents: 125, salesTaxCents: 8, totalCents: 133 },
    ]);
  });

  it("uses deterministic largest-remainder rounding for indivisible cents", () => {
    const allocations = allocateTaxCents([100, 100, 100], 10);

    expect(allocations).toEqual([4, 3, 3]);
    expect(allocations.reduce((sum, amount) => sum + amount, 0)).toBe(10);
  });

  it("leaves tax at zero when a ticket has no sales tax", () => {
    expect(calculateReceiptLineAmounts([{ quantity: "1", unitPrice: "4.99" }], "")).toEqual([
      { subtotalCents: 499, salesTaxCents: 0, totalCents: 499 },
    ]);
  });

  it("rounds each merchandise line to cents before calculating the ticket", () => {
    expect(calculateReceiptLineAmounts([{ quantity: "0.333", unitPrice: "3.00" }], "0.08")).toEqual([
      { subtotalCents: 100, salesTaxCents: 8, totalCents: 108 },
    ]);
  });
});
