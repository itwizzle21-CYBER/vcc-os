import { describe, it, expect } from "vitest";
import * as vehicleCalculations from "../vehicleCalculations";
import type { Debt } from "../schema";

describe("Vehicle Debt Calculations", () => {
  const mockVehicleDebt: Debt = {
    id: 4,
    name: "2022 Honda Civic",
    balance: 18500,
    minimumPayment: 450,
    interestRate: 5.2,
    status: "active",
    category: "auto_loan",
    dueDate: new Date(2026, 5, 10),
    isVehicleDebt: true,
    vehicleYear: 2022,
    vehicleMake: "Honda",
    vehicleModel: "Civic",
    weeklyPaymentAmount: 110,
    nextDueDate: new Date(2026, 5, 10),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("calculatePayoffProgress", () => {
    it("should calculate progress percentage correctly", () => {
      expect(vehicleCalculations.calculatePayoffProgress(10000, 20000)).toBe(50);
      expect(vehicleCalculations.calculatePayoffProgress(5000, 20000)).toBe(75);
      expect(vehicleCalculations.calculatePayoffProgress(20000, 20000)).toBe(0);
    });

    it("should handle zero original balance", () => {
      expect(vehicleCalculations.calculatePayoffProgress(0, 0)).toBe(0);
    });

    it("should clamp progress between 0 and 100", () => {
      expect(vehicleCalculations.calculatePayoffProgress(-1000, 20000)).toBe(0);
      expect(vehicleCalculations.calculatePayoffProgress(25000, 20000)).toBe(100);
    });
  });

  describe("calculatePayoffEstimate", () => {
    it("should calculate payoff weeks correctly", () => {
      const result = vehicleCalculations.calculatePayoffEstimate(18500, 110, 5.2);
      expect(result.weeks).toBeGreaterThan(0);
      expect(result.estimatedDate).toBeInstanceOf(Date);
    });

    it("should return Infinity for zero payment", () => {
      const result = vehicleCalculations.calculatePayoffEstimate(18500, 0, 5.2);
      expect(result.weeks).toBe(Infinity);
    });

    it("should return Infinity for negative payment", () => {
      const result = vehicleCalculations.calculatePayoffEstimate(18500, -50, 5.2);
      expect(result.weeks).toBe(Infinity);
    });
  });

  describe("calculateDaysUntilDue", () => {
    it("should calculate days until due correctly", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const days = vehicleCalculations.calculateDaysUntilDue(futureDate);
      expect(days).toBeGreaterThanOrEqual(4);
      expect(days).toBeLessThanOrEqual(6);
    });

    it("should return 0 for undefined date", () => {
      expect(vehicleCalculations.calculateDaysUntilDue(undefined)).toBe(0);
    });

    it("should return 0 for today", () => {
      const today = new Date();
      const days = vehicleCalculations.calculateDaysUntilDue(today);
      expect(days).toBeLessThanOrEqual(1);
    });
  });

  describe("getPaymentStatus", () => {
    it("should return overdue for past dates", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(vehicleCalculations.getPaymentStatus(pastDate)).toBe("overdue");
    });

    it("should return due_soon for dates within 3 days", () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 2);
      expect(vehicleCalculations.getPaymentStatus(soonDate)).toBe("due_soon");
    });

    it("should return on_track for dates more than 3 days away", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      expect(vehicleCalculations.getPaymentStatus(futureDate)).toBe("on_track");
    });
  });

  describe("calculateMonthlyEquivalent", () => {
    it("should calculate monthly equivalent from weekly payment", () => {
      const monthly = vehicleCalculations.calculateMonthlyEquivalent(110);
      expect(monthly).toBeCloseTo(476.67, 1);
    });

    it("should handle zero payment", () => {
      expect(vehicleCalculations.calculateMonthlyEquivalent(0)).toBe(0);
    });
  });

  describe("calculateAnnualPayment", () => {
    it("should calculate annual payment from weekly payment", () => {
      const annual = vehicleCalculations.calculateAnnualPayment(110);
      expect(annual).toBe(5720);
    });

    it("should handle zero payment", () => {
      expect(vehicleCalculations.calculateAnnualPayment(0)).toBe(0);
    });
  });

  describe("getVehicleDebtSummary", () => {
    it("should return null for non-vehicle debt", () => {
      const nonVehicle: Debt = { ...mockVehicleDebt, isVehicleDebt: false };
      expect(vehicleCalculations.getVehicleDebtSummary(nonVehicle)).toBeNull();
    });

    it("should return summary for vehicle debt", () => {
      const summary = vehicleCalculations.getVehicleDebtSummary(mockVehicleDebt);
      expect(summary).not.toBeNull();
      expect(summary?.vehicleDisplay).toBe("2022 Honda Civic");
      expect(summary?.weeklyPayment).toBe(110);
      expect(summary?.currentBalance).toBe(18500);
      expect(summary?.interestRate).toBe(5.2);
    });

    it("should include all required fields in summary", () => {
      const summary = vehicleCalculations.getVehicleDebtSummary(mockVehicleDebt);
      expect(summary).toHaveProperty("vehicleDisplay");
      expect(summary).toHaveProperty("payoffProgress");
      expect(summary).toHaveProperty("payoffWeeks");
      expect(summary).toHaveProperty("estimatedPayoffDate");
      expect(summary).toHaveProperty("daysUntilDue");
      expect(summary).toHaveProperty("paymentStatus");
      expect(summary).toHaveProperty("monthlyEquivalent");
      expect(summary).toHaveProperty("annualPayment");
    });
  });
});
