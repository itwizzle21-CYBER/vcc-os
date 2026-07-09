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

const categoryKeywords: Array<{ category: string; words: string[] }> = [
  { category: "Health & Medical", words: ["tylenol", "medicine", "vitamin", "peroxide", "bandage", "first aid", "prescription"] },
  { category: "Beauty & Grooming", words: ["vaseline", "lotion", "cocoa butter", "face wash", "brush", "comb", "edge control", "conditioner", "hair oil", "makeup"] },
  { category: "Personal Care", words: ["soap", "toothpaste", "deodorant", "body wash", "shampoo", "razor"] },
  { category: "Canned Food", words: ["beans", "tuna", "soup", "corn", "canned chicken"] },
  { category: "Frozen Food", words: ["meat", "chicken", "frozen pizza", "frozen vegetables"] },
  { category: "Beverages", words: ["water", "juice", "milk", "soda", "coffee", "tea"] },
  { category: "Laundry", words: ["detergent", "dryer sheets", "fabric softener"] },
  { category: "Paper & Disposable", words: ["toilet paper", "tissue", "paper towel", "plates", "napkin"] },
  { category: "Cleaning", words: ["bleach", "cleaner", "disinfectant", "wipes", "mop", "broom"] },
  { category: "Baby & Family", words: ["diaper", "formula", "baby", "toddler"] },
  { category: "Pet Supplies", words: ["pet", "dog", "cat", "litter", "leash"] },
  { category: "Automotive", words: ["motor oil", "coolant", "tire", "gasoline", "windshield fluid"] },
  { category: "Hardware & Tools", words: ["hammer", "screwdriver", "drill", "wrench", "nail", "screw"] },
  { category: "Electronics", words: ["battery", "charger", "cable", "headphone", "phone", "computer"] },
  { category: "Office & School", words: ["paper", "pen", "pencil", "notebook", "printer", "folder"] },
  { category: "Apparel", words: ["shirt", "pants", "sock", "shoe", "coat", "glove"] },
  { category: "Home & Kitchen", words: ["dish", "pan", "pot", "utensil", "towel", "pillow", "blanket"] },
  { category: "Furniture", words: ["chair", "table", "desk", "sofa", "shelf"] },
  { category: "Outdoor & Garden", words: ["garden", "soil", "seed", "hose", "grill", "lawn"] },
  { category: "Sports & Fitness", words: ["weight", "yoga", "ball", "fitness", "exercise"] },
  { category: "Travel", words: ["luggage", "suitcase", "passport", "travel"] },
  { category: "Emergency Supplies", words: ["flashlight", "radio", "emergency", "fire extinguisher"] },
  { category: "Seasonal & Holiday", words: ["heater", "fan", "christmas", "halloween", "summer", "holiday"] },
  { category: "Grocery", words: ["bread", "rice", "eggs", "cereal", "noodles", "snacks", "fruit", "vegetable"] },
];

export function categorizeItem(item: string): string {
  const normalized = item.toLowerCase();
  const match = categoryKeywords.find((group) => group.words.some((word) => normalized.includes(word)));
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

export function normalizeInventoryRow(row: SpreadsheetRow): SpreadsheetRow {
  const item = row.cells.item || row.cells.name || "";
  const qty = row.cells.qty || row.cells.quantity || "";
  const minNeeded = row.cells.minNeeded || row.cells.min || row.cells.minimum || "";
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
