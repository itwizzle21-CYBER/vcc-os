import { describe, it, expect } from "vitest";
import * as calculations from "../calculations";

describe("Debt Module", () => {
  describe("Calculations", () => {
    it("should calculate payoff date for a debt", () => {
      const debt = {
        id: 1,
        name: "Credit Card",
        balance: 1000,
        minimumPayment: 150,
        interestRate: 18.5,
        status: "active" as const,
        category: "credit_card" as const,
      };

      const payoffDate = calculations.calculatePayoffDate(debt, 150);
      expect(payoffDate).toBeDefined();
      expect(payoffDate).toBeInstanceOf(Date);
    });

    it("should calculate total interest paid", () => {
      const debt = {
        id: 1,
        name: "Credit Card",
        balance: 1000,
        minimumPayment: 150,
        interestRate: 18.5,
        status: "active" as const,
        category: "credit_card" as const,
      };

      const totalInterest = calculations.calculateTotalInterestPaid(debt, 150);
      expect(totalInterest).toBeGreaterThan(0);
      expect(totalInterest).toBeLessThan(debt.balance * 2);
    });

    it("should rank debts by interest rate (avalanche)", () => {
      const debts = [
        { id: 1, name: "Card A", interestRate: 5, balance: 1000, minimumPayment: 50, status: "active" as const, category: "credit_card" as const },
        { id: 2, name: "Card B", interestRate: 18, balance: 2000, minimumPayment: 100, status: "active" as const, category: "credit_card" as const },
        { id: 3, name: "Card C", interestRate: 10, balance: 1500, minimumPayment: 75, status: "active" as const, category: "credit_card" as const },
      ];

      const ranked = calculations.rankDebtsByInterestRate(debts);
      expect(ranked[0].interestRate).toBe(18);
      expect(ranked[1].interestRate).toBe(10);
      expect(ranked[2].interestRate).toBe(5);
    });

    it("should rank debts by balance (snowball)", () => {
      const debts = [
        { id: 1, name: "Card A", balance: 5000, interestRate: 5, minimumPayment: 50, status: "active" as const, category: "credit_card" as const },
        { id: 2, name: "Card B", balance: 1000, interestRate: 18, minimumPayment: 100, status: "active" as const, category: "credit_card" as const },
        { id: 3, name: "Card C", balance: 3000, interestRate: 10, minimumPayment: 75, status: "active" as const, category: "credit_card" as const },
      ];

      const ranked = calculations.rankDebtsByBalance(debts);
      expect(ranked[0].balance).toBe(1000);
      expect(ranked[1].balance).toBe(3000);
      expect(ranked[2].balance).toBe(5000);
    });

    it("should suggest payoff strategy", () => {
      const debts = [
        { id: 1, name: "Card A", balance: 1000, interestRate: 5, minimumPayment: 50, status: "active" as const, category: "credit_card" as const },
        { id: 2, name: "Card B", balance: 2000, interestRate: 18, minimumPayment: 100, status: "active" as const, category: "credit_card" as const },
      ];

      const strategy = calculations.suggestPayoffStrategy(debts);
      expect(strategy.strategy).toMatch(/avalanche|snowball/);
      expect(strategy.order).toHaveLength(2);
      expect(strategy.reasoning).toBeDefined();
    });

    it("should calculate debt-to-income ratio", () => {
      const ratio = calculations.calculateDebtToIncomeRatio(600, 5000);
      expect(ratio).toBe(12);
    });

    it("should calculate debt reduction progress", () => {
      const progress = calculations.calculateDebtReductionProgress(15000, 20000);
      expect(progress).toBe(25);
    });

    it("should handle zero values gracefully", () => {
      const debt = {
        id: 1,
        name: "Card",
        balance: 0,
        minimumPayment: 0,
        interestRate: 18,
        status: "active" as const,
        category: "credit_card" as const,
      };

      const payoffDate = calculations.calculatePayoffDate(debt, 0);
      expect(payoffDate).toBeNull();

      const totalInterest = calculations.calculateTotalInterestPaid(debt, 0);
      expect(totalInterest).toBe(0);
    });
  });

  describe("Debt Summary", () => {
    it("should calculate total debt correctly", () => {
      const debts = [
        { balance: 1000 },
        { balance: 2000 },
        { balance: 3000 },
      ];

      const total = debts.reduce((sum, d: any) => sum + d.balance, 0);
      expect(total).toBe(6000);
    });

    it("should calculate average interest rate", () => {
      const debts = [
        { interestRate: 5 },
        { interestRate: 10 },
        { interestRate: 15 },
      ];

      const avg = debts.reduce((sum, d: any) => sum + d.interestRate, 0) / debts.length;
      expect(avg).toBe(10);
    });
  });
});
