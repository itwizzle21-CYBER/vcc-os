export type ReceiptDraft = {
  merchant: string;
  amount: string;
  date: string;
  direction: "expense" | "income" | "transfer";
  account: string;
  category: string;
  reference: string;
  rawText: string;
  confidence: number;
};

const providers = ["Chime", "Cash App", "Apple Cash", "Venmo", "PayPal", "Zelle"];

export function parseReceiptText(rawText: string): ReceiptDraft {
  const text = rawText.replace(/\r/g, "").trim();
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const provider = providers.find((name) => text.toLowerCase().includes(name.toLowerCase())) || "Other";
  const money = [...text.matchAll(/(?:\$\s*)?(-?\d{1,3}(?:,\d{3})*(?:\.\d{2}))/g)]
    .map((match) => ({ raw: match[0], value: Math.abs(Number(match[1].replace(/,/g, ""))) }))
    .filter((item) => Number.isFinite(item.value) && item.value > 0 && item.value < 1000000);
  const preferred = money.find((item) => /\$/.test(item.raw)) || money[0];
  const dateMatch = text.match(/\b(20\d{2})[-/]([01]?\d)[-/]([0-3]?\d)\b/) || text.match(/\b([01]?\d)[/]([0-3]?\d)[/](20\d{2})\b/);
  let date = new Date().toISOString().slice(0, 10);
  if (dateMatch) date = dateMatch[1].length === 4
    ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`
    : `${dateMatch[3]}-${dateMatch[1].padStart(2, "0")}-${dateMatch[2].padStart(2, "0")}`;
  const income = /received|deposit|paid you|cash in|direct deposit/i.test(text);
  const transfer = /transfer(?:red)?|sent to|moved money/i.test(text);
  const merchant = lines.find((line) => !providers.some((p) => line.toLowerCase().includes(p.toLowerCase())) && !/\$|completed|payment|receipt|transaction/i.test(line)) || provider;
  const reference = text.match(/(?:reference|confirmation|transaction|receipt)(?:\s+(?:id|number|#))?[:\s#-]*([a-z0-9-]{5,})/i)?.[1] || "";
  return {
    merchant: merchant.slice(0, 80),
    amount: preferred ? preferred.value.toFixed(2) : "",
    date,
    direction: income ? "income" : transfer ? "transfer" : "expense",
    account: provider,
    category: income ? "Income" : transfer ? "Transfers" : "Uncategorized",
    reference,
    rawText: text,
    confidence: Math.min(98, 30 + (preferred ? 25 : 0) + (dateMatch ? 15 : 0) + (provider !== "Other" ? 15 : 0) + (merchant ? 10 : 0)),
  };
}
