import { describe, expect, it } from "vitest";
import { scoreReceiptCandidate } from "./receiptOcr";
import { parseReceiptText } from "./receiptParser";

describe("VitaScan receipt OCR selection", () => {
  it("prefers a complete retail read over a short uncertain pass", () => {
    const shortText = "NORTH MARKET\nTOTAL $10.56";
    const completeText = [
      "NORTH MARKET",
      "4011 BANANAS 1.29",
      "WHOLE MILK 2 x 2.50 5.00",
      "SOURDOUGH BREAD 3.49",
      "TOTAL $10.56",
      "07/20/2026",
      "UPC 036000291452",
    ].join("\n");

    const shortScore = scoreReceiptCandidate({ text: shortText, confidence: 92, draft: parseReceiptText(shortText) });
    const completeScore = scoreReceiptCandidate({ text: completeText, confidence: 78, draft: parseReceiptText(completeText) });

    expect(completeScore).toBeGreaterThan(shortScore);
  });
});
