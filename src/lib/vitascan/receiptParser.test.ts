import { describe, expect, it } from "vitest";
import { parseReceiptText } from "./receiptParser";

describe("VitaScan receipt parser", () => {
  it("extracts a Cash App expense", () => {
    const receipt = parseReceiptText("Cash App\nCoffee House\nPayment completed\n$14.25\n07/18/2026\nTransaction ID ABC12345");
    expect(receipt).toMatchObject({ account: "Cash App", merchant: "Coffee House", amount: "14.25", date: "2026-07-18", direction: "expense", reference: "ABC12345" });
  });

  it("recognizes money received", () => {
    const receipt = parseReceiptText("Chime\nDirect deposit received\n$820.00\n2026-07-18");
    expect(receipt.direction).toBe("income");
    expect(receipt.category).toBe("Income");
  });
});
