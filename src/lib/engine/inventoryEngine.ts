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
