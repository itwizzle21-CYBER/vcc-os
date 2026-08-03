import type { SpreadsheetRow } from "../types/app";
import { toNumber } from "../calculations/currency";

export const inventoryCategories = [
  "Grocery",
  "Canned Food",
  "Frozen Food",
  "Beverages",
  "Health & Medical",
  "Personal Care",
  "Beauty & Grooming",
  "Cleaning",
  "Paper & Disposable",
  "Laundry",
  "Baby & Family",
  "Pet Supplies",
  "Automotive",
  "Hardware & Tools",
  "Electronics",
  "Office & School",
  "Apparel",
  "Home & Kitchen",
  "Furniture",
  "Outdoor & Garden",
  "Sports & Fitness",
  "Travel",
  "Seasonal & Holiday",
  "Emergency Supplies",
  "General Merchandise",
];

export interface RankedInventoryRow {
  row: SpreadsheetRow;
  item: string;
  category: string;
  qty: number;
  minNeeded: number;
  shortage: number;
  unitCost: number;
  refillCost: number;
  alert: "Critical" | "Low";
  score: number;
  costEfficiencyScore: number;
  plannedQty: number;
  plannedCost: number;
  fullyFunded: boolean;
  budgetRemainingAfter: number;
  reason: string;
}

const categoryKeywords: Array<{ category: string; words: string[] }> = [
  { category: "Health & Medical", words: ["acetaminophen", "ibuprofen", "tylenol", "advil", "medicine", "medication", "vitamin", "supplement", "peroxide", "alcohol swab", "bandage", "gauze", "first aid", "prescription", "thermometer", "cough drops", "cold medicine", "allergy", "antacid", "pain relief", "heating pad"] },
  { category: "Beauty & Grooming", words: ["vaseline", "lotion", "cocoa butter", "face wash", "cleanser", "moisturizer", "brush", "comb", "edge control", "conditioner", "hair oil", "makeup", "mascara", "foundation", "lip balm", "chapstick", "sunscreen", "perfume", "cologne"] },
  { category: "Personal Care", words: ["soap", "bar soap", "toothpaste", "toothbrush", "mouthwash", "floss", "deodorant", "body wash", "shampoo", "razor", "shaving cream", "feminine", "tampon", "pads", "hand sanitizer", "cotton swab"] },
  { category: "Canned Food", words: ["canned", "beans", "tuna", "soup", "corn", "peas", "tomato sauce", "canned chicken", "spam", "chili can"] },
  { category: "Frozen Food", words: ["frozen", "frozen pizza", "frozen vegetables", "ice cream", "popsicle", "frozen meal", "freezer"] },
  { category: "Beverages", words: ["water", "bottled water", "juice", "milk", "soda", "sparkling water", "coffee", "tea", "energy drink", "sports drink", "gatorade", "creamer"] },
  { category: "Laundry", words: ["laundry", "detergent", "dryer sheets", "fabric softener", "bleach pen", "stain remover", "washing powder", "pods"] },
  { category: "Paper & Disposable", words: ["toilet paper", "tissue", "kleenex", "paper towel", "paper plates", "plates", "cups", "napkin", "plastic fork", "plastic spoon", "trash bag", "garbage bag", "foil", "parchment", "ziploc", "storage bag"] },
  { category: "Cleaning", words: ["bleach", "cleaner", "disinfectant", "wipes", "clorox", "lysol", "mop", "broom", "duster", "dish soap", "dishwasher", "sponge", "scrub", "glass cleaner", "toilet cleaner", "air freshener"] },
  { category: "Baby & Family", words: ["diaper", "wipes baby", "formula", "baby", "toddler", "pacifier", "bottle", "stroller", "kids", "child"] },
  { category: "Pet Supplies", words: ["pet", "dog", "cat", "litter", "leash", "collar", "dog food", "cat food", "pet food", "treats", "aquarium", "bird seed"] },
  { category: "Automotive", words: ["motor oil", "coolant", "tire", "gasoline", "windshield fluid", "wiper", "car wash", "brake fluid", "jumper cable", "air freshener car"] },
  { category: "Hardware & Tools", words: ["hammer", "screwdriver", "drill", "wrench", "pliers", "nail", "screw", "anchor", "tape measure", "level", "glue", "duct tape", "paint brush", "light bulb"] },
  { category: "Electronics", words: ["battery", "charger", "charging cable", "usb", "hdmi", "cable", "headphone", "earbuds", "phone", "tablet", "computer", "laptop", "keyboard", "mouse", "monitor", "router"] },
  { category: "Office & School", words: ["printer paper", "copy paper", "pen", "pencil", "marker", "highlighter", "notebook", "binder", "printer", "folder", "envelope", "stamp", "calculator", "backpack"] },
  { category: "Apparel", words: ["shirt", "pants", "jeans", "sock", "shoe", "coat", "jacket", "glove", "hat", "underwear", "bra", "uniform", "belt"] },
  { category: "Home & Kitchen", words: ["dish", "plate", "bowl", "pan", "pot", "utensil", "spatula", "knife", "cutting board", "towel", "bath towel", "pillow", "blanket", "sheet", "curtain", "rug", "storage bin"] },
  { category: "Furniture", words: ["chair", "table", "desk", "sofa", "couch", "shelf", "dresser", "bed frame", "mattress", "nightstand", "bookcase"] },
  { category: "Outdoor & Garden", words: ["garden", "soil", "seed", "plant", "hose", "grill", "charcoal", "propane", "lawn", "mulch", "fertilizer", "pesticide", "rake", "shovel"] },
  { category: "Sports & Fitness", words: ["weight", "dumbbell", "yoga", "ball", "fitness", "exercise", "resistance band", "protein powder", "water bottle", "bike helmet"] },
  { category: "Travel", words: ["luggage", "suitcase", "passport", "travel", "toiletry bag", "neck pillow", "adapter", "travel size"] },
  { category: "Emergency Supplies", words: ["flashlight", "radio", "emergency", "fire extinguisher", "smoke detector", "carbon monoxide", "battery pack", "lantern", "water jug", "survival"] },
  { category: "Seasonal & Holiday", words: ["heater", "space heater", "fan", "christmas", "halloween", "summer", "holiday", "ornament", "wrapping paper", "gift bag", "snow shovel", "ice melt"] },
  { category: "Grocery", words: ["bread", "rice", "eggs", "cereal", "oatmeal", "pasta", "noodles", "snacks", "chips", "crackers", "fruit", "vegetable", "meat", "chicken", "beef", "pork", "fish", "cheese", "yogurt", "butter", "flour", "sugar", "seasoning", "sauce", "oil", "peanut butter"] },
];

export function categorizeItem(item: string): string {
  const normalized = item.toLowerCase();
  const match = categoryKeywords
    .flatMap((group) => group.words.map((word) => ({ category: group.category, word })))
    .sort((a, b) => b.word.length - a.word.length)
    .find(({ word }) => normalized.includes(word));
  return match?.category || "General Merchandise";
}

export function getInventoryAlert(qtyText: string, minText: string): "Clear" | "Critical" | "Low" | "Stocked" {
  if (!qtyText.trim() && !minText.trim()) return "Clear";
  const qty = toNumber(qtyText);
  const min = toNumber(minText);
  if (qty <= 0 && min > 0) return "Critical";
  if (qty < min) return "Low";
  return "Stocked";
}

export function clampInventoryQuantity(value: string | undefined): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return toNumber(trimmed) < 0 ? "0" : trimmed;
}

export function normalizeInventoryRow(row: SpreadsheetRow): SpreadsheetRow {
  const item = row.cells.item || row.cells.name || "";
  const qty = clampInventoryQuantity(row.cells.qty || row.cells.quantity);
  const minNeeded = clampInventoryQuantity(row.cells.minNeeded || row.cells.min || row.cells.minimum);
  const cost = row.cells.cost || row.cells.estimatedCost || "";
  return {
    id: row.id,
    cells: {
      item,
      category: item.trim() ? categorizeItem(item) : "",
      qty,
      minNeeded,
      cost,
      alert: getInventoryAlert(qty, minNeeded),
      notes: row.cells.notes || "",
    },
  };
}

export function rankInventoryRows(rows: SpreadsheetRow[], availableNonSavingsCash = Number.POSITIVE_INFINITY): RankedInventoryRow[] {
  const candidates = rows
    .map(normalizeInventoryRow)
    .filter((row) => row.cells.item.trim() && (row.cells.alert === "Critical" || row.cells.alert === "Low"))
    .map((row) => {
      const qty = toNumber(row.cells.qty);
      const minNeeded = toNumber(row.cells.minNeeded);
      const shortage = Math.max(0, minNeeded - qty);
      const unitCost = Math.max(0, toNumber(row.cells.cost));
      const shortageRatio = minNeeded > 0 ? Math.min(1, shortage / minNeeded) : 0;
      const alert = row.cells.alert as "Critical" | "Low";
      const needScore = Math.min(90, Math.round(
        (alert === "Critical" ? 70 : 45)
        + (shortageRatio * 20)
      ));
      const item = row.cells.item;

      return {
        row,
        item,
        category: row.cells.category || "General Merchandise",
        qty,
        minNeeded,
        shortage,
        unitCost,
        refillCost: shortage * unitCost,
        alert,
        needScore,
      };
    });

  const knownUnitCosts = candidates.map((item) => item.unitCost).filter((cost) => cost > 0);
  const lowestUnitCost = knownUnitCosts.length > 0 ? Math.min(...knownUnitCosts) : 0;
  const ranked = candidates
    .map((item) => {
      const costEfficiencyScore = item.unitCost > 0 && lowestUnitCost > 0
        ? Math.max(1, Math.round(10 * (lowestUnitCost / item.unitCost)))
        : 0;
      return {
        ...item,
        costEfficiencyScore,
        score: Math.min(100, item.needScore + costEfficiencyScore),
      };
    })
    .sort((a, b) => {
      const severity = Number(b.alert === "Critical") - Number(a.alert === "Critical");
      return severity || b.score - a.score || a.unitCost - b.unitCost || b.shortage - a.shortage || a.item.localeCompare(b.item);
    });

  let remainingBudget = Number.isFinite(availableNonSavingsCash)
    ? Math.max(0, availableNonSavingsCash)
    : Number.POSITIVE_INFINITY;
  const planned = ranked.map((item) => {
    const affordableQty = item.unitCost > 0
      ? Number.isFinite(remainingBudget)
        ? Math.max(0, Math.floor((remainingBudget + Number.EPSILON) / item.unitCost))
        : item.shortage
      : 0;
    const plannedQty = Math.min(item.shortage, affordableQty);
    const plannedCost = plannedQty * item.unitCost;
    if (Number.isFinite(remainingBudget)) remainingBudget = Math.max(0, remainingBudget - plannedCost);
    const fullyFunded = plannedQty >= item.shortage && item.shortage > 0;
    const reason = inventoryRouteReason(item.item, item.qty, item.shortage, item.unitCost, plannedQty, plannedCost, fullyFunded);

    return {
      ...item,
      plannedQty,
      plannedCost,
      fullyFunded,
      budgetRemainingAfter: remainingBudget,
      reason,
    };
  });

  return planned.sort((a, b) => {
    const actionable = Number(b.plannedQty > 0) - Number(a.plannedQty > 0);
    const severity = Number(b.alert === "Critical") - Number(a.alert === "Critical");
    return actionable || severity || b.score - a.score || a.unitCost - b.unitCost || a.item.localeCompare(b.item);
  });
}

function inventoryRouteReason(
  item: string,
  qty: number,
  shortage: number,
  unitCost: number,
  plannedQty: number,
  plannedCost: number,
  fullyFunded: boolean,
): string {
  if (unitCost <= 0) return `${item} needs a cost before it can be placed on the funded route.`;
  if (plannedQty <= 0) return `${item} is ${shortage} below minimum, but current non-savings cash cannot cover one unit.`;
  if (!fullyFunded) return `Buy ${plannedQty} ${item} now for ${formatInventoryCost(plannedCost)}; ${shortage - plannedQty} will remain below minimum.`;
  if (qty <= 0) return `Buy ${plannedQty} ${item} for ${formatInventoryCost(plannedCost)} to restore this out-of-stock item.`;
  return `Buy ${plannedQty} ${item} for ${formatInventoryCost(plannedCost)} to reach its minimum.`;
}

function formatInventoryCost(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}
