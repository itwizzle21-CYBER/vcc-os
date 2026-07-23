import { describe, expect, it } from "vitest";
import { mergeReceiptCandidates, receiptImageScale, receiptOcrCorePaths, receiptOcrRuntimeOptions, scoreReceiptCandidate, shouldRunReceiptRecovery } from "./receiptOcr";
import { parseReceiptText } from "./receiptParser";

describe("VitaScan receipt OCR selection", () => {
  it("self-hosts executable OCR assets for the production security policy", () => {
    expect(receiptOcrRuntimeOptions.workerPath).not.toContain("cdn.jsdelivr.net");
    expect(receiptOcrCorePaths.every((path) => !path.includes("cdn.jsdelivr.net"))).toBe(true);
    expect(receiptOcrRuntimeOptions.workerBlobURL).toBe(false);
    expect(receiptOcrRuntimeOptions.langPath).toContain("4.0.0_fast");
    expect(receiptOcrRuntimeOptions.cachePath).toBe("vitascan-fast-v2");
  });

  it("shrinks high-resolution phone images before OCR", () => {
    const scale = receiptImageScale(1170, 2532);
    expect(scale).toBeLessThan(0.5);
    expect(Math.round(1170 * scale)).toBe(555);
    expect(Math.round(2532 * scale)).toBe(1200);
  });

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

  it("skips a second OCR pass when required receipt details are already reliable", () => {
    const completeText = [
      "NORTH MARKET",
      "WHOLE MILK 5.00",
      "TOTAL $5.00",
      "07/20/2026",
    ].join("\n");
    const incompleteText = "RECEIPT\nTHANK YOU";

    expect(shouldRunReceiptRecovery({
      text: completeText,
      confidence: 82,
      draft: parseReceiptText(completeText),
    })).toBe(false);
    expect(shouldRunReceiptRecovery({
      text: incompleteText,
      confidence: 82,
      draft: parseReceiptText(incompleteText),
    })).toBe(true);
  });

  it("fuses useful fields from complementary OCR passes", () => {
    const merchantPass = "NORTH MARKET\nTHANK YOU\n07/20/2026";
    const totalPass = "RECEIPT\nSUBTOTAL $9.99\nTAX $0.57\nTOTAL $10.56";
    const merged = mergeReceiptCandidates([
      { text: merchantPass, confidence: 88, draft: parseReceiptText(merchantPass) },
      { text: totalPass, confidence: 76, draft: parseReceiptText(totalPass) },
    ]);

    expect(merged).toMatchObject({ merchant: "NORTH MARKET", amount: "10.56", date: "2026-07-20" });
    expect(merged.rawText).toContain("TOTAL $10.56");
  });
});
