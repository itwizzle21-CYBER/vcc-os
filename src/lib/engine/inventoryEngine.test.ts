import { describe, expect, it } from "vitest";
import { categorizeItem, clampInventoryQuantity, normalizeInventoryRow, rankInventoryRows } from "./inventoryEngine";

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

  it("ranks inventory decisions by stock severity and shortage", () => {
    const ranked = rankInventoryRows([
      { id: "low", cells: { item: "Eggs", qty: "1", minNeeded: "2", cost: "5" } },
      { id: "critical-small", cells: { item: "Milk", qty: "0", minNeeded: "1", cost: "4" } },
      { id: "critical-large", cells: { item: "Rice", qty: "0", minNeeded: "4", cost: "3" } },
      { id: "stocked", cells: { item: "Bread", qty: "2", minNeeded: "1", cost: "3" } },
    ]);

    expect(ranked.map((item) => item.row.id)).toEqual(["critical-large", "critical-small", "low"]);
    expect(ranked[0]).toMatchObject({ alert: "Critical", shortage: 4, refillCost: 12, score: 100 });
    expect(ranked[0].reason).toContain("out-of-stock");
  });

  it("builds the most cost-efficient route within non-savings cash", () => {
    const ranked = rankInventoryRows([
      { id: "expensive-critical", cells: { item: "Medicine", qty: "0", minNeeded: "1", cost: "10" } },
      { id: "cheap-critical", cells: { item: "Water", qty: "0", minNeeded: "1", cost: "2" } },
      { id: "cheap-low", cells: { item: "Rice", qty: "1", minNeeded: "2", cost: "1" } },
    ], 3);

    expect(ranked.map((item) => item.row.id)).toEqual(["cheap-critical", "cheap-low", "expensive-critical"]);
    expect(ranked.reduce((sum, item) => sum + item.plannedCost, 0)).toBe(3);
    expect(ranked[0]).toMatchObject({ plannedQty: 1, plannedCost: 2, fullyFunded: true });
    expect(ranked[2]).toMatchObject({ plannedQty: 0, plannedCost: 0, fullyFunded: false });
    expect(ranked[2].reason).toContain("non-savings cash");
  });
});
