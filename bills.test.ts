import { describe, it, expect } from "vitest";
import * as calculations from "../calculations";
import type { Bill } from "../schema";

describe("Bills Module - Calculations", () => {
  const mockBills: Bill[] = [
    {
      id: 1,
      userId: 1,
      name: "Electric Bill",
      amount: "150.00",
      dueDate: new Date("2026-06-15"),
      status: "pending",
      isRecurring: true,
      frequency: "monthly",
      lastPaidDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      userId: 1,
      name: "Internet Bill",
      amount: "80.00",
      dueDate: new Date("2026-06-10"),
      status: "pending",
      isRecurring: true,
      frequency: "monthly",
      lastPaidDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      userId: 1,
      name: "Water Bill",
      amount: "50.00",
      dueDate: new Date("2026-05-20"),
      status: "pending",
      isRecurring: true,
      frequency: "monthly",
      lastPaidDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      userId: 1,
      name: "Phone Bill",
      amount: "60.00",
      dueDate: new Date("2026-06-05"),
      status: "paid",
      isRecurring: true,
      frequency: "monthly",
      lastPaidDate: new Date("2026-06-05"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe("calculateOverdueBills", () => {
    it("should identify bills with due date before today and pending status", () => {
      const overdue = calculations.calculateOverdueBills(mockBills);
      expect(overdue).toHaveLength(1);
      expect(overdue[0].name).toBe("Water Bill");
    });

    it("should not include paid bills", () => {
      const overdue = calculations.calculateOverdueBills(mockBills);
      const hasPhone = overdue.some((b) => b.name === "Phone Bill");
      expect(hasPhone).toBe(false);
    });
  });

  describe("calculateBillsDueInDays", () => {
    it("should return bills due within specified days", () => {
      const upcoming = calculations.calculateBillsDueInDays(mockBills, 7);
      expect(upcoming.length).toBeGreaterThan(0);
      expect(upcoming.some((b) => b.name === "Internet Bill")).toBe(true);
    });

    it("should not include overdue bills", () => {
      const upcoming = calculations.calculateBillsDueInDays(mockBills, 7);
      const hasWater = upcoming.some((b) => b.name === "Water Bill");
      expect(hasWater).toBe(false);
    });

    it("should not include paid bills", () => {
      const upcoming = calculations.calculateBillsDueInDays(mockBills, 30);
      const hasPhone = upcoming.some((b) => b.name === "Phone Bill");
      expect(hasPhone).toBe(false);
    });
  });

  describe("calculateTotalBillsThisMonth", () => {
    it("should sum bills due this month", () => {
      const total = calculations.calculateTotalBillsThisMonth(mockBills);
      const expectedTotal = (150.0 + 80.0 + 60.0).toFixed(2);
      expect(total).toBe(expectedTotal);
    });
  });

  describe("calculatePaidThisMonth", () => {
    it("should sum paid bills from this month", () => {
      const total = calculations.calculatePaidThisMonth(mockBills);
      expect(total).toBe("60.00");
    });
  });

  describe("getNextDueDate", () => {
    it("should return the earliest pending bill due date", () => {
      const nextDate = calculations.getNextDueDate(mockBills);
      expect(nextDate).toBeTruthy();
      // Internet Bill (10th) is pending, so it should be the next due date
      const pendingBills = mockBills.filter((b) => b.status === "pending");
      const sorted = pendingBills.sort((a, b) => {
        const aDate = typeof a.dueDate === "string" ? new Date(a.dueDate) : a.dueDate;
        const bDate = typeof b.dueDate === "string" ? new Date(b.dueDate) : b.dueDate;
        return aDate.getTime() - bDate.getTime();
      });
      expect(nextDate?.getDate()).toBe(sorted[0].dueDate.getDate());
    });

    it("should return null if no pending bills", () => {
      const noPendingBills = mockBills.filter((b) => b.status === "paid");
      const nextDate = calculations.getNextDueDate(noPendingBills);
      expect(nextDate).toBeNull();
    });
  });
});
