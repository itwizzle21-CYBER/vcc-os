import type { SpreadsheetRow } from "../types/app";
import { toNumber } from "../calculations/currency";

export const inventoryCategories = [
  "Food",
  "Canned Food",
  "Frozen Food",
  "Drinks",
  "Medical",
  "Hygiene",
  "Hair Products",
  "Skin Care",
  "Cleaning Supplies",
  "Paper Goods",
  "Laundry",
  "Baby/Kids",
  "Car",
  "Tools",
  "Batteries/Electronics",
  "Seasonal",
  "Clothing",
  "Household",
  "Emergency",
  "Other",
];

const categoryKeywords: Array<{ category: string; words: string[] }> = [
  { category: "Medical", words: ["tylenol", "peroxide", "bandage", "first aid"] },
  { category: "Skin Care", words: ["vaseline", "lotion", "cocoa butter", "face wash"] },
  { category: "Hair Products", words: ["brush", "comb", "edge control", "conditioner", "hair oil"] },
  { category: "Hygiene", words: ["soap", "toothpaste", "deodorant", "body wash", "shampoo"] },
  { category: "Canned Food", words: ["beans", "tuna", "soup", "corn", "canned chicken"] },
  { category: "Frozen Food", words: ["meat", "chicken", "frozen pizza", "frozen vegetables"] },
  { category: "Drinks", words: ["water", "juice", "milk", "soda"] },
  { category: "Laundry", words: ["detergent", "dryer sheets", "fabric softener"] },
  { category: "Paper Goods", words: ["toilet paper", "tissue", "paper towel", "plates"] },
  { category: "Cleaning Supplies", words: ["bleach", "cleaner", "disinfectant", "wipes"] },
  { category: "Car", words: ["oil", "coolant", "tire", "gas", "windshield fluid"] },
  { category: "Seasonal", words: ["heater", "fan", "gloves", "coats", "christmas", "summer"] },
  { category: "Food", words: ["bread", "rice", "eggs", "cereal", "noodles", "snacks"] },
];

export function categorizeItem(item: string): string {
  const normalized = item.toLowerCase();
  const match = categoryKeywords.find((group) => group.words.some((word) => normalized.includes(word)));
  return match?.category || "Other";
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
