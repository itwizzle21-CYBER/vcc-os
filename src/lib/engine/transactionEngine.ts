import { toNumber } from "../calculations/currency";
import type { SpreadsheetRow } from "../types/app";

export type TransactionType = "income" | "expense" | "transfer";
export type TransactionPeriod = "week" | "lastweek" | "month" | "lastmonth";

export function transactionMatchesPeriod(dateText: string, period: TransactionPeriod, referenceDate = new Date()): boolean {
  if (!dateText) return false;
  const date = new Date(`${dateText}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const today = startOfDay(referenceDate);
  if (period === "month" || period === "lastmonth") {
    const monthOffset = period === "lastmonth" ? -1 : 0;
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return date.getFullYear() === targetMonth.getFullYear() && date.getMonth() === targetMonth.getMonth();
  }

  const thisWeekStart = startOfWeek(today);
  const rangeStart = new Date(thisWeekStart);
  if (period === "lastweek") rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 7);
  return date >= rangeStart && date < rangeEnd;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

const categoryRules: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Income",
    keywords: ["paycheck", "payroll", "salary", "wage", "direct deposit", "bonus", "commission", "income", "adp", "gusto", "workday payroll", "stripe payout", "square payout"],
  },
  {
    category: "Transfers",
    keywords: ["transfer", "zelle", "venmo", "cash app", "cashapp", "paypal", "move money", "ach transfer", "wire transfer", "revolut", "wise", "remitly", "western union", "moneygram"],
  },
  {
    category: "Housing",
    keywords: ["rent", "mortgage", "apartment", "landlord", "property tax", "hoa", "air conditioning repair", "plumber", "plumbing", "electrician", "roofing", "locksmith", "pest control"],
  },
  {
    category: "Utilities",
    keywords: ["electric", "electricity", "power bill", "water bill", "gas bill", "natural gas", "utility", "internet", "wifi", "broadband", "phone bill", "mobile bill", "sewer", "trash", "waste management", "comcast", "xfinity", "spectrum", "verizon", "at&t", "tmobile", "t-mobile"],
  },
  {
    category: "Healthcare",
    keywords: ["doctor", "medical", "pharmacy", "chemist", "cvs", "walgreens", "rite aid", "boots", "hospital", "clinic", "urgent care", "dental", "dentist", "orthodont", "vision", "optical", "therapy", "prescription", "medicine", "health", "walmart pharmacy", "target pharmacy"],
  },
  {
    category: "Groceries",
    keywords: ["grocery", "groceries", "supermarket", "hypermarket", "market", "food market", "fresh market", "milk", "bread", "eggs", "meat", "produce", "vegetables", "fruit", "dairy", "aldi", "lidl", "kroger", "whole foods", "trader joe", "food lion", "publix", "safeway", "albertsons", "meijer", "heb", "h-e-b", "tesco", "sainsbury", "asda", "morrisons", "waitrose", "carrefour", "auchan", "metro market", "rewe", "edeka", "mercadona", "dia supermarket", "coles", "woolworths", "loblaws", "sobeys", "no frills", "superstore", "costco grocery", "sam's club grocery", "walmart grocery", "target grocery"],
  },
  {
    category: "Restaurants",
    keywords: ["restaurant", "coffee", "cafe", "cafeteria", "bakery", "diner", "bar and grill", "doordash", "uber eats", "ubereats", "grubhub", "deliveroo", "just eat", "mcdonald", "burger king", "wendy", "kfc", "popeyes", "chipotle", "taco bell", "pizza hut", "dominos", "domino's", "subway", "panera", "starbucks", "dunkin", "costa coffee", "tim hortons", "pret a manger", "nando"],
  },
  {
    category: "Transportation",
    keywords: ["uber trip", "lyft", "taxi", "cab", "transit", "metro", "subway fare", "bus fare", "train fare", "rail", "parking", "toll", "rideshare", "lime ride", "bird scooter", "bolt ride", "grab ride", "didi ride", "octopus card", "oyster card"],
  },
  {
    category: "Fuel",
    keywords: ["fuel", "gas station", "petrol", "diesel", "shell", "exxon", "mobil", "chevron", "bp", "circle k", "speedway", "wawa fuel", "quiktrip", "qt gas", "racetrac", "marathon petroleum", "texaco", "esso", "totalenergies", "arco", "sunoco", "valero"],
  },
  {
    category: "Travel",
    keywords: ["hotel", "motel", "resort", "airline", "flight", "airbnb", "booking.com", "expedia", "priceline", "kayak", "vrbo", "rental car", "hertz", "avis", "enterprise rent", "budget rent", "national car", "alamo", "delta air", "united air", "american airlines", "southwest", "jetblue", "ryanair", "easyjet", "emirates", "qatar airways", "air france", "lufthansa"],
  },
  {
    category: "Insurance",
    keywords: ["insurance", "geico", "progressive", "state farm", "allstate", "liberty mutual", "farmers insurance", "usaa insurance", "premium", "policy payment"],
  },
  {
    category: "Debt Payments",
    keywords: ["credit card", "card payment", "loan", "minimum payment", "debt", "lender", "student loan", "auto loan", "car payment", "affirm", "klarna", "afterpay", "capital one payment", "chase card payment", "discover payment", "amex payment"],
  },
  {
    category: "Savings",
    keywords: ["savings", "emergency fund", "hysa", "vault", "set aside", "rainy day", "sinking fund"],
  },
  {
    category: "Investments",
    keywords: ["investment", "brokerage", "robinhood", "fidelity", "vanguard", "charles schwab", "etrade", "e-trade", "stock", "crypto", "coinbase", "kraken", "binance", "wealthfront", "betterment"],
  },
  {
    category: "Education",
    keywords: ["tuition", "school", "college", "university", "course", "class", "bookstore", "textbook", "student", "udemy", "coursera", "skillshare", "khan academy"],
  },
  {
    category: "Childcare",
    keywords: ["childcare", "daycare", "nursery", "babysit", "school lunch", "kids club", "child support"],
  },
  {
    category: "Pets",
    keywords: ["pet", "veterinary", "vet ", "animal hospital", "chewy", "petco", "petsmart", "pet supplies", "dog food", "cat food", "grooming pet"],
  },
  {
    category: "Subscriptions",
    keywords: ["subscription", "netflix", "spotify", "hulu", "disney+", "disney plus", "youtube premium", "apple.com/bill", "icloud", "patreon", "prime membership", "amazon prime", "paramount+", "peacock", "max.com", "hbo max", "audible", "notion", "dropbox", "google storage", "microsoft 365", "adobe creative", "canva pro"],
  },
  {
    category: "Entertainment",
    keywords: ["movie", "cinema", "theater", "concert", "bowling", "arcade", "game", "xbox", "playstation", "steam", "nintendo", "twitch", "ticketmaster", "stubhub", "eventbrite", "amc theatres", "regal cinemas"],
  },
  {
    category: "Personal Care",
    keywords: ["haircut", "salon", "barber", "nails", "spa", "beauty", "cosmetics", "makeup", "skincare", "gym", "fitness", "planet fitness", "la fitness", "anytime fitness", "sephora", "ulta", "bath & body works", "body shop"],
  },
  {
    category: "Shopping",
    keywords: ["amazon", "target", "walmart", "costco", "sam's club", "best buy", "ikea", "home depot", "lowes", "lowe's", "menards", "wayfair", "ebay", "etsy", "aliexpress", "temu", "shein", "department store", "discount store", "general merchandise", "clothing", "apparel", "shoes", "sneakers", "nike", "adidas", "zara", "h&m", "uniqlo", "gap", "old navy", "macys", "macy's", "nordstrom", "kohls", "kohl's", "tj maxx", "marshalls", "ross store", "primark", "marks and spencer", "john lewis", "fnac", "decathlon", "office depot", "staples"],
  },
  {
    category: "Taxes",
    keywords: ["tax", "irs", "state tax", "federal tax", "hmrc", "cra tax", "ato tax", "tax payment"],
  },
  {
    category: "Fees",
    keywords: ["fee", "overdraft", "atm", "service charge", "late fee", "maintenance fee", "foreign transaction fee", "interest charge"],
  },
  {
    category: "Gifts & Donations",
    keywords: ["gift", "donation", "charity", "church", "nonprofit", "gofundme", "red cross", "unicef", "tithe"],
  },
  {
    category: "Business",
    keywords: ["business", "office", "software", "domain", "hosting", "supplies", "invoice", "saas", "github", "vercel", "aws", "azure", "google cloud", "openai", "quickbooks", "shopify", "mailchimp"],
  },
];

export function identifyTransactionCategory(row: SpreadsheetRow): string {
  const explicitCategory = String(row.cells.category || "").trim();
  if (explicitCategory && explicitCategory !== "Uncategorized") return explicitCategory;

  const haystack = [
    row.cells.description,
    row.cells.account,
    row.cells.notes,
    row.cells.type,
  ]
    .join(" ")
    .toLowerCase();

  const rule = categoryRules.find((item) => item.keywords.some((keyword) => haystack.includes(keyword)));
  if (rule) return rule.category;
  if (transactionType(row) === "income") return "Income";
  if (transactionType(row) === "transfer") return "Transfers";
  return "Uncategorized";
}

export function transactionType(row: SpreadsheetRow): TransactionType {
  const explicitType = String(row.cells.type || "").trim().toLowerCase();
  if (includesAny(explicitType, ["transfer", "move"])) return "transfer";
  if (includesAny(explicitType, ["expense", "debit", "purchase", "payment", "outflow"])) return "expense";
  if (includesAny(explicitType, ["income", "credit", "deposit", "refund", "inflow"])) return "income";

  const category = String(row.cells.category || "").trim().toLowerCase();
  if (category.includes("transfer")) return "transfer";
  if (includesAny(category, ["income", "paycheck", "salary", "bonus", "refund"])) return "income";
  if (category && category !== "uncategorized") return "expense";
  return toNumber(row.cells.amount) > 0 ? "income" : "expense";
}

export function signedTransactionAmount(row: SpreadsheetRow): number {
  const rawAmount = toNumber(row.cells.amount);
  const magnitude = Math.abs(rawAmount);
  const type = transactionType(row);

  if (type === "income") return magnitude;
  if (type === "expense") return -magnitude;
  return rawAmount;
}

function includesAny(value: string, values: string[]): boolean {
  return values.some((candidate) => value.includes(candidate));
}
