import { describe, expect, it } from "vitest";
import { formatReceiptArchive, formatReceiptNotes, parseReceiptText } from "./receiptParser";

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

  it("prefers the labeled total and never invents a missing date", () => {
    const receipt = parseReceiptText("Corner Market\nSubtotal $18.00\nTax $1.44\nTotal $19.44");
    expect(receipt.amount).toBe("19.44");
    expect(receipt.date).toBe("");
    expect(receipt.rawText).toContain("Tax $1.44");
  });

  it("extracts retail items, quantities, PLUs, and validated barcodes", () => {
    const receipt = parseReceiptText([
      "WORLD MARKET",
      "4011 BANANAS 1.29",
      "MILK 2 x 2.50 5.00",
      "TOTAL $6.29",
      "07/19/2026",
      "UPC 036000291452",
    ].join("\n"));

    expect(receipt).toMatchObject({
      merchant: "WORLD MARKET",
      amount: "6.29",
      date: "2026-07-19",
      currencyCode: "USD",
      currencySymbol: "$",
      category: "Groceries",
    });
    expect(receipt.pluNumbers).toContain("4011");
    expect(receipt.barcodes).toContain("036000291452");
    expect(receipt.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "BANANAS", plu: "4011", totalPrice: 1.29 }),
      expect.objectContaining({ name: "MILK", quantity: 2, unitPrice: 2.5, totalPrice: 5 }),
    ]));
  });

  it("understands European prices, currency, and day-first dates", () => {
    const receipt = parseReceiptText([
      "MERCADO CENTRAL",
      "TOMATES 1,25",
      "LECHE 2,40",
      "TOTAL 3,65 EUR",
      "19/07/2026",
      "EAN 4006381333931",
    ].join("\n"));

    expect(receipt).toMatchObject({ amount: "3.65", date: "2026-07-19", currencyCode: "EUR", currencySymbol: "€" });
    expect(receipt.items.map((item) => item.name)).toEqual(["TOMATES", "LECHE"]);
    expect(receipt.barcodes).toContain("4006381333931");
  });

  it("keeps native barcode detection in the synced receipt archive", () => {
    const receipt = parseReceiptText("TOKYO MART\nGREEN TEA ¥ 3.50\nTOTAL ¥ 3.50\n2026-07-19", ["4901234567894"]);
    expect(receipt.barcodes).toContain("4901234567894");
    expect(formatReceiptArchive(receipt)).toContain("Barcodes: 4901234567894");
    expect(formatReceiptNotes(receipt)).toContain("Items:");
  });

  it("reconstructs a missing total from item lines and tax", () => {
    const receipt = parseReceiptText("LOCAL SHOP\nBREAD $2.00\nMILK $3.00\nTAX $0.40\n07/19/2026");
    expect(receipt.amount).toBe("5.40");
  });

  it("reads compact two-digit receipt dates", () => {
    const usReceipt = parseReceiptText("WELCOME TO NORTH MARKET\nTOTAL $10.56\n07/20/26");
    const ukReceipt = parseReceiptText("LONDON GROCER\nTOTAL 8.20 GBP\n20/07/26");

    expect(usReceipt).toMatchObject({ merchant: "NORTH MARKET", date: "2026-07-20" });
    expect(ukReceipt.date).toBe("2026-07-20");
  });

  it("reads named receipt dates", () => {
    expect(parseReceiptText("CITY SHOP\nTOTAL $4.20\nJul 20, 2026").date).toBe("2026-07-20");
    expect(parseReceiptText("CITY SHOP\nTOTAL 4.20 GBP\n20 July 2026").date).toBe("2026-07-20");
  });
});
