import { describe, it, expect } from "vitest";
import * as calculations from "../calculations";
import type { Inventory } from "../../../../drizzle/schema";

describe("Inventory Calculations", () => {
  const mockItem: Inventory = {
    id: 1,
    userId: 1,
    name: "Milk",
    category: "Groceries",
    currentQuantity: 2,
    minimumQuantity: 4,
    status: "Low",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("calculateStatus", () => {
    it("should return Critical when quantity is 25% or less of minimum", () => {
      expect(calculations.calculateStatus(1, 4)).toBe("Critical");
      expect(calculations.calculateStatus(2, 8)).toBe("Critical");
    });

    it("should return Low when quantity is between 25% and 50% of minimum", () => {
      expect(calculations.calculateStatus(2, 4)).toBe("Low");
      expect(calculations.calculateStatus(3, 8)).toBe("Low");
    });

    it("should return Good when quantity is above 50% of minimum", () => {
      expect(calculations.calculateStatus(3, 4)).toBe("Good");
      expect(calculations.calculateStatus(5, 8)).toBe("Good");
    });
  });

  describe("calculateStockPercentage", () => {
    it("should calculate percentage correctly", () => {
      expect(calculations.calculateStockPercentage(2, 4)).toBe(50);
      expect(calculations.calculateStockPercentage(1, 4)).toBe(25);
      expect(calculations.calculateStockPercentage(4, 4)).toBe(100);
    });
  });

  describe("calculateTotalRestockCost", () => {
    it("should calculate total restock cost for multiple items", () => {
      const items: Inventory[] = [
        { ...mockItem, currentQuantity: 1, minimumQuantity: 5 },
        { ...mockItem, currentQuantity: 0, minimumQuantity: 3 },
      ];
      const cost = calculations.calculateTotalRestockCost(items);
      // (5-1)*10 + (3-0)*10 = 40 + 30 = 70
      expect(cost).toBe(70);
    });
  });

  describe("estimateDaysUntilEmpty", () => {
    it("should estimate days until empty correctly", () => {
      expect(calculations.estimateDaysUntilEmpty(10, 1)).toBe(10);
      expect(calculations.estimateDaysUntilEmpty(10, 2)).toBe(5);
      expect(calculations.estimateDaysUntilEmpty(10, 0.5)).toBe(20);
    });

    it("should return Infinity for zero or negative daily usage", () => {
      expect(calculations.estimateDaysUntilEmpty(10, 0)).toBe(Infinity);
      expect(calculations.estimateDaysUntilEmpty(10, -1)).toBe(Infinity);
    });
  });

  describe("calculatePriorityScore", () => {
    it("should give high priority to critical items", () => {
      const critical = { ...mockItem, currentQuantity: 1, minimumQuantity: 4 };
      const score = calculations.calculatePriorityScore(critical);
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should give medium priority to low stock items", () => {
      const lowStock = { ...mockItem, currentQuantity: 2, minimumQuantity: 4 };
      const score = calculations.calculatePriorityScore(lowStock);
      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThan(80);
    });

    it("should give low priority to good stock items", () => {
      const good = { ...mockItem, currentQuantity: 3, minimumQuantity: 4 };
      const score = calculations.calculatePriorityScore(good);
      expect(score).toBeLessThan(40);
    });
  });

  describe("getCategoryStats", () => {
    it("should calculate category statistics correctly", () => {
      const items: Inventory[] = [
        { ...mockItem, category: "Groceries", currentQuantity: 1, minimumQuantity: 4 },
        { ...mockItem, category: "Groceries", currentQuantity: 2, minimumQuantity: 4 },
        { ...mockItem, category: "Hygiene", currentQuantity: 3, minimumQuantity: 4 },
      ];

      const stats = calculations.getCategoryStats(items);

      expect(stats["Groceries"].total).toBe(2);
      expect(stats["Groceries"].critical).toBe(1);
      expect(stats["Groceries"].low).toBe(1);

      expect(stats["Hygiene"].total).toBe(1);
      expect(stats["Hygiene"].critical).toBe(0);
      expect(stats["Hygiene"].low).toBe(0);
    });
  });
});
