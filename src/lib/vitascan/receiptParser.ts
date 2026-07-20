export type ReceiptLineItem = {
  name: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  totalPrice: number;
  plu?: string;
  barcode?: string;
};

export type ReceiptDraft = {
  merchant: string;
  amount: string;
  date: string;
  direction: "expense" | "income" | "transfer";
  account: string;
  category: string;
  reference: string;
  currencyCode: string;
  currencySymbol: string;
  items: ReceiptLineItem[];
  barcodes: string[];
  pluNumbers: string[];
  rawText: string;
  confidence: number;
};

const paymentProviders = [
  "Chime", "Cash App", "Apple Cash", "Venmo", "PayPal", "Zelle", "Revolut", "Klarna",
  "Alipay", "WeChat Pay", "Google Pay", "Samsung Pay", "Wise",
];

const currencyDefinitions = [
  { code: "USD", symbol: "$", patterns: [/\bUSD\b/i, /US\$/i] },
  { code: "EUR", symbol: "€", patterns: [/\bEUR\b/i, /€/] },
  { code: "GBP", symbol: "£", patterns: [/\bGBP\b/i, /£/] },
  { code: "CAD", symbol: "C$", patterns: [/\bCAD\b/i, /C\$/i] },
  { code: "AUD", symbol: "A$", patterns: [/\bAUD\b/i, /A\$/i] },
  { code: "NZD", symbol: "NZ$", patterns: [/\bNZD\b/i, /NZ\$/i] },
  { code: "JPY", symbol: "¥", patterns: [/\bJPY\b/i, /¥/] },
  { code: "CNY", symbol: "¥", patterns: [/\bCNY\b/i, /\bRMB\b/i, /元/] },
  { code: "INR", symbol: "₹", patterns: [/\bINR\b/i, /₹/] },
  { code: "KRW", symbol: "₩", patterns: [/\bKRW\b/i, /₩/] },
  { code: "BRL", symbol: "R$", patterns: [/\bBRL\b/i, /R\$/i] },
  { code: "MXN", symbol: "MX$", patterns: [/\bMXN\b/i, /MX\$/i] },
  { code: "CHF", symbol: "CHF", patterns: [/\bCHF\b/i] },
  { code: "PLN", symbol: "zł", patterns: [/\bPLN\b/i, /zł/i] },
  { code: "SEK", symbol: "kr", patterns: [/\bSEK\b/i] },
  { code: "NOK", symbol: "kr", patterns: [/\bNOK\b/i] },
  { code: "DKK", symbol: "kr", patterns: [/\bDKK\b/i] },
  { code: "RUB", symbol: "₽", patterns: [/\bRUB\b/i, /₽/] },
  { code: "TRY", symbol: "₺", patterns: [/\bTRY\b/i, /₺/] },
  { code: "UAH", symbol: "₴", patterns: [/\bUAH\b/i, /₴/] },
  { code: "VND", symbol: "₫", patterns: [/\bVND\b/i, /₫/] },
  { code: "THB", symbol: "฿", patterns: [/\bTHB\b/i, /฿/] },
  { code: "ILS", symbol: "₪", patterns: [/\bILS\b/i, /₪/] },
  { code: "PHP", symbol: "₱", patterns: [/\bPHP\b/i, /₱/] },
  { code: "ZAR", symbol: "R", patterns: [/\bZAR\b/i] },
  { code: "AED", symbol: "د.إ", patterns: [/\bAED\b/i, /د\.إ/] },
];

const amountPattern = /-?(?:\d{1,3}(?:[.,'\u00a0 ]\d{3})+|\d+)(?:[.,]\d{2})/g;
const totalWords = /\b(grand total|total paid|amount paid|payment total|balance due|total|importe total|suma total|gesamt|summe|somme|montant|totale|totaal|razem|celkem|toplam|合計|总计|總計|합계|итого)\b/i;
const subtotalWords = /\b(subtotal|sub total|taxable total|sous-total|zwischensumme|subtotaal|podsumowanie)\b/i;
const nonItemWords = /\b(total|subtotal|tax|vat|iva|gst|hst|change|cash|card|credit|debit|tender|payment|balance|discount|coupon|savings|receipt|invoice|factura|facture|rechnung|rückgeld|monnaie|impuesto|steuer|merci|thank you)\b/i;

export function parseReceiptText(rawText: string, detectedBarcodes: string[] = []): ReceiptDraft {
  const text = rawText.replace(/\r/g, "").replace(/[\u00a0\u202f]/g, " ").trim();
  const lines = text.split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const currency = detectCurrency(text);
  const barcodes = unique([...detectedBarcodes.map(normalizeCode), ...extractBarcodes(text)]).filter(Boolean);
  const pluNumbers = extractPluNumbers(lines);
  const items = extractLineItems(lines, barcodes, pluNumbers);
  const totalCandidates = lines.filter((line) => totalWords.test(line) && !subtotalWords.test(line));
  const totalLine = totalCandidates[totalCandidates.length - 1] || "";
  const totalAmounts = extractAmounts(totalLine);
  const preferredAmount = totalAmounts[totalAmounts.length - 1] ?? inferReceiptAmount(lines, items);
  const date = extractReceiptDate(text, currency.code);
  const income = /\b(received|deposit|paid you|cash in|direct deposit|refund received|crédito recibido)\b/i.test(text);
  const transfer = /\b(transfer(?:red)?|sent to|moved money|wire transfer|virement|überweisung|transferencia)\b/i.test(text);
  const provider = paymentProviders.find((name) => text.toLowerCase().includes(name.toLowerCase()));
  const account = provider || detectPaymentMethod(text);
  const merchant = detectMerchant(lines, provider);
  const reference = text.match(/(?:reference|confirmation|transaction|receipt|invoice|order|factura|ticket)(?:\s+(?:id|number|no|#))?[:\s#-]*([a-z0-9-]{5,})/i)?.[1] || "";
  const category = income ? "Income" : transfer ? "Transfers" : inferCategory(text, items);

  return {
    merchant: merchant.slice(0, 80),
    amount: preferredAmount ? preferredAmount.toFixed(2) : "",
    date,
    direction: income ? "income" : transfer ? "transfer" : "expense",
    account,
    category,
    reference,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    items,
    barcodes,
    pluNumbers,
    rawText: text,
    confidence: Math.min(99, 25
      + (preferredAmount ? 20 : 0)
      + (date ? 12 : 0)
      + (merchant ? 10 : 0)
      + (currency.code ? 8 : 0)
      + Math.min(15, items.length * 3)
      + (barcodes.length || pluNumbers.length ? 8 : 0)),
  };
}

export function formatReceiptArchive(draft: ReceiptDraft): string {
  const intelligence = formatReceiptIntelligence(draft);
  return `${draft.rawText}${intelligence ? `\n\n[VitaScan retail intelligence]\n${intelligence}` : ""}`.trim();
}

export function formatReceiptNotes(draft: ReceiptDraft): string {
  const archive = formatReceiptArchive(draft);
  return `VitaScan${draft.reference ? ` - Ref ${draft.reference}` : ""}${archive ? `\n${archive}` : ""}`;
}

function formatReceiptIntelligence(draft: ReceiptDraft): string {
  const sections: string[] = [];
  if (draft.currencyCode) sections.push(`Currency: ${draft.currencyCode}`);
  if (draft.items.length) sections.push(`Items:\n${draft.items.map((item) => {
    const quantity = item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}${item.unitPrice ? ` @ ${item.unitPrice.toFixed(2)}` : ""} × ` : "";
    const plu = item.plu ? ` (PLU ${item.plu})` : "";
    return `- ${quantity}${item.name}: ${item.totalPrice.toFixed(2)}${plu}`;
  }).join("\n")}`);
  if (draft.pluNumbers.length) sections.push(`PLU numbers: ${draft.pluNumbers.join(", ")}`);
  if (draft.barcodes.length) sections.push(`Barcodes: ${draft.barcodes.join(", ")}`);
  return sections.join("\n");
}

function detectCurrency(text: string): { code: string; symbol: string } {
  const codeMention = currencyDefinitions.find((currency) => new RegExp(`\\b${currency.code}\\b`, "i").test(text));
  if (codeMention) return { code: codeMention.code, symbol: codeMention.symbol };
  const explicit = currencyDefinitions.find((currency) => currency.patterns.some((pattern) => pattern.test(text)));
  if (explicit) return { code: explicit.code, symbol: explicit.symbol };
  if (/\$/.test(text)) return { code: "USD", symbol: "$" };
  return { code: "", symbol: "" };
}

function extractAmounts(line: string): number[] {
  return [...line.matchAll(new RegExp(amountPattern.source, "g"))]
    .map((match) => parseLocalizedNumber(match[0]))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 100000000);
}

function inferReceiptAmount(lines: string[], items: ReceiptLineItem[]): number | undefined {
  const dueLines = lines.filter((line) => /\b(amount|due|paid|charged|balance|importe|montant|betrag|pagar|pagado)\b/i.test(line) && !/\b(change|cash back|refund)\b/i.test(line));
  const dueAmounts = dueLines.flatMap(extractAmounts);
  if (dueAmounts.length) return dueAmounts[dueAmounts.length - 1];

  if (items.length) {
    const itemTotal = items.reduce((total, item) => total + item.totalPrice, 0);
    const taxLines = lines.filter((line) => /\b(tax|vat|iva|gst|hst|impuesto|steuer|tva)\b/i.test(line));
    const tax = taxLines.flatMap(extractAmounts).reduce((total, value) => total + value, 0);
    if (itemTotal > 0) return itemTotal + tax;
  }

  const eligible = lines.filter((line) => !looksLikeDateOrCode(line) && !/\b(change|cash back|phone|tel)\b/i.test(line));
  const amounts = eligible.flatMap(extractAmounts);
  return amounts[amounts.length - 1];
}

function looksLikeDateOrCode(line: string): boolean {
  return /^\s*\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}(?:\s|$)/.test(line)
    || /\b(?:barcode|upc|ean|gtin)\b/i.test(line)
    || /^\s*\d{8,14}\s*$/.test(line);
}

function parseLocalizedNumber(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, "");
  const dot = cleaned.lastIndexOf(".");
  const comma = cleaned.lastIndexOf(",");
  const decimalIndex = Math.max(dot, comma);
  if (decimalIndex < 0) return Number(cleaned);
  const decimals = cleaned.length - decimalIndex - 1;
  if (decimals !== 2) return Number(cleaned.replace(/[.,]/g, ""));
  const whole = cleaned.slice(0, decimalIndex).replace(/[.,]/g, "");
  return Number(`${whole}.${cleaned.slice(decimalIndex + 1)}`);
}

function extractReceiptDate(text: string, currencyCode: string): string {
  const iso = text.match(/\b(20\d{2})[-/.]([01]?\d)[-/.]([0-3]?\d)\b/);
  if (iso) return validIsoDate(iso[1], iso[2], iso[3]);
  const named = text.match(/\b([0-3]?\d)[ \t]+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[ \t]+(\d{2,4})\b/i)
    || text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[ \t]+([0-3]?\d),?[ \t]+(\d{2,4})\b/i);
  if (named) {
    const monthFirst = /\p{L}/u.test(named[1]);
    const day = monthFirst ? named[2] : named[1];
    const monthName = monthFirst ? named[1] : named[2];
    const month = String(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].findIndex((value) => monthName.toLowerCase().startsWith(value)) + 1);
    return validIsoDate(normalizeReceiptYear(named[3]), month, day);
  }
  const local = text.match(/\b([0-3]?\d)[-/.]([0-3]?\d)[-/.](\d{2,4})\b/);
  if (!local) return "";
  const first = Number(local[1]);
  const second = Number(local[2]);
  const monthFirst = second > 12 || (first <= 12 && second <= 12 && ["USD", "CAD"].includes(currencyCode));
  const month = monthFirst ? local[1] : local[2];
  const day = monthFirst ? local[2] : local[1];
  return validIsoDate(normalizeReceiptYear(local[3]), month, day);
}

function normalizeReceiptYear(year: string): string {
  if (year.length === 4) return year;
  return String(Number(year) >= 70 ? 1900 + Number(year) : 2000 + Number(year));
}

function validIsoDate(year: string, month: string, day: string): string {
  const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const value = new Date(`${normalized}T12:00:00Z`);
  return Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== normalized ? "" : normalized;
}

function detectPaymentMethod(text: string): string {
  const match = text.match(/\b(Visa|Mastercard|Master Card|American Express|Amex|Discover|UnionPay|Maestro|Interac|EFTPOS|Debit|Credit|Cash)\b/i);
  if (!match) return "Receipt";
  return match[1].replace(/Master Card/i, "Mastercard").replace(/Amex/i, "American Express");
}

function detectMerchant(lines: string[], provider?: string): string {
  const candidates = lines.slice(0, 12).flatMap((source, index) => {
    const line = source.replace(/^\s*(?:welcome to|bienvenue chez|bienvenido a|willkommen bei)\s+/i, "").trim();
    if (provider && line.toLowerCase().includes(provider.toLowerCase())) return [];
    if (!/\p{L}/u.test(line) || line.length > 80) return [];
    if (/\b(receipt|invoice|transaction|order|date|time|tel|phone|tax id|vat|gst|www\.|https?|cashier|register|terminal|store #|thank you|merci)\b/i.test(line)
      || totalWords.test(line)
      || extractAmounts(line).length
      || /^\s*\d+[\s-]+\d+/.test(line)
      || /\b(?:street|st\.?|road|rd\.?|avenue|ave\.?|boulevard|blvd\.?|drive|dr\.?)\b.*\d/i.test(line)) return [];
    const letters = [...line].filter((character) => /\p{L}/u.test(character));
    const uppercaseRatio = letters.length ? letters.filter((character) => character === character.toUpperCase()).length / letters.length : 0;
    const score = 100 - index * 7 + Math.min(18, letters.length / 2) + (uppercaseRatio > 0.8 ? 9 : 0);
    return [{ line, score }];
  });
  return candidates.sort((left, right) => right.score - left.score)[0]?.line || provider || "Receipt";
}

function extractLineItems(lines: string[], receiptBarcodes: string[], receiptPluNumbers: string[]): ReceiptLineItem[] {
  return lines.flatMap((line) => {
    if (nonItemWords.test(line) || totalWords.test(line)) return [];
    const amountMatches = [...line.matchAll(new RegExp(amountPattern.source, "g"))];
    if (!amountMatches.length || !/\p{L}/u.test(line)) return [];
    const lastAmount = amountMatches[amountMatches.length - 1];
    const totalPrice = parseLocalizedNumber(lastAmount[0]);
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) return [];
    const quantityMatch = line.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|lb|lbs|oz|l|ml|ea|pc|pcs)?\s*(?:x|×|@)\s*/i)
      || line.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|lb|lbs|oz|l|ml)\b/i);
    const quantity = quantityMatch ? parseLocalizedNumber(quantityMatch[1]) : undefined;
    const unit = quantityMatch?.[2]?.toLowerCase();
    const linePlu = findLinePlu(line, receiptPluNumbers);
    const lineBarcode = receiptBarcodes.find((barcode) => line.includes(barcode));
    let name = line.slice(0, lastAmount.index).replace(/[$€£¥₹₩₽₺₴₫฿₪₱]/g, " ");
    name = name
      .replace(/\b(?:USD|EUR|GBP|CAD|AUD|NZD|JPY|CNY|INR|KRW|BRL|MXN|CHF|PLN|SEK|NOK|DKK|RUB|TRY|UAH|VND|THB|ILS|PHP|ZAR|AED)\b/gi, " ")
      .replace(/\b(?:PLU|UPC|EAN|GTIN|BARCODE|SKU|ITEM)\s*#?\s*[A-Z0-9-]+\b/gi, " ")
      .replace(/^\s*\d{4,14}\s+/, "")
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|lb|lbs|oz|l|ml|ea|pc|pcs)?\s*(?:x|×|@)\s*/gi, " ")
      .replace(new RegExp(amountPattern.source, "g"), " ")
      .replace(/\s+/g, " ")
      .replace(/[-*:]+$/, "")
      .trim();
    if (!name || name.length > 100) return [];
    const priorAmount = amountMatches.length > 1 ? parseLocalizedNumber(amountMatches[amountMatches.length - 2][0]) : undefined;
    return [{ name, quantity, unit, unitPrice: quantity ? priorAmount : undefined, totalPrice, plu: linePlu, barcode: lineBarcode }];
  }).slice(0, 100);
}

function extractPluNumbers(lines: string[]): string[] {
  const results: string[] = [];
  lines.forEach((line) => {
    for (const match of line.matchAll(/(?:\bPLU\b|price\s*look[- ]?up|produce(?:\s+code)?|c[oó]digo\s+plu|code\s+plu)[^\d]{0,8}(\d{4,5})\b/gi)) results.push(match[1]);
    const leading = line.match(/^\s*(\d{4,5})\s+\p{L}.*(?:[.,]\d{2})\s*$/u);
    if (leading) results.push(leading[1]);
  });
  return unique(results);
}

function findLinePlu(line: string, receiptPluNumbers: string[]): string | undefined {
  return receiptPluNumbers.find((plu) => new RegExp(`(?:^|\\D)${plu}(?:\\D|$)`).test(line));
}

function extractBarcodes(text: string): string[] {
  const labeled = [...text.matchAll(/\b(?:barcode|upc|ean|gtin)\s*#?\s*[: -]?\s*([a-z0-9-]{6,32})\b/gi)].map((match) => match[1]);
  const gtins = [...text.matchAll(/\b\d{8,14}\b/g)].map((match) => match[0]).filter(isValidGtin);
  return unique([...labeled, ...gtins].map(normalizeCode));
}

function isValidGtin(value: string): boolean {
  if (![8, 12, 13, 14].includes(value.length) || !/^\d+$/.test(value)) return false;
  const digits = value.split("").map(Number);
  const check = digits.pop();
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

function inferCategory(text: string, items: ReceiptLineItem[]): string {
  const names = items.map((item) => item.name).join(" ");
  const haystack = `${text} ${names}`.toLowerCase();
  if (/restaurant|cafe|coffee|server|table|tip|gratuity|restaurante|ristorante|café/.test(haystack)) return "Restaurants";
  if (/pharmacy|drug|prescription|rx\b|apotheke|farmacia|pharmacie/.test(haystack)) return "Healthcare";
  if (/fuel|gasoline|diesel|gallon|petrol|pump|essence|benzine/.test(haystack)) return "Fuel";
  if (items.length || /grocery|market|supermarket|produce|mercado|épicerie|lebensmittel/.test(haystack)) return "Groceries";
  return "Shopping";
}

function normalizeCode(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
