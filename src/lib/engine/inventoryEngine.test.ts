import { describe, expect, it } from "vitest";
import { categorizeItem, clampInventoryQuantity, normalizeInventoryRow } from "./inventoryEngine";

describe("inventory engine", () => {
  it("categorizes common retail inventory items", () => {
    expect(categorizeItem("Costco toilet paper")).toBe("Paper & Disposable");
    expect(categorizeItem("Walmart pharmacy ibuprofen")).toBe("Health & Medical");
    expect(categorizeItem("Target dish soap")).toBe("Cleaning");
    expect(categorizeItem("Home Depot light bulb")).toBe("Hardware & Tools");
    expect(categorizeItem("Best Buy USB charger")).toBe("Electronics");
    expect(categorizeItem("Chewy dog food")).toBe("Pet Supplies");
    expect(categorizeItem("Aldi eggs")).toBe("Grocery");
  });

  it("locks normalized inventory category from the item name", () => {
    const row = normalizeInventoryRow({
      id: "inv-1",
      cells: {
        item: "laundry detergent pods",
        category: "Wrong",
        qty: "1",
        minNeeded: "2",
        cost: "$12.00",
        alert: "",
        notes: "",
      },
    });

    expect(row.cells.category).toBe("Laundry");
    expect(row.cells.alert).toBe("Low");
  });

  it("never allows inventory quantities or minimums below zero", () => {
    expect(clampInventoryQuantity("-3")).toBe("0");
    expect(clampInventoryQuantity("2.5")).toBe("2.5");
    expect(clampInventoryQuantity("")).toBe("");

    const row = normalizeInventoryRow({
      id: "inv-negative",
      cells: { item: "Rice", qty: "-4", minNeeded: "-1", cost: "$5.00" },
    });

    expect(row.cells.qty).toBe("0");
    expect(row.cells.minNeeded).toBe("0");
    expect(row.cells.alert).toBe("Stocked");
  });
});
