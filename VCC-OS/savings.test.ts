import { describe, it, expect } from "vitest";
import * as calculations from "../calculations";

describe("Savings Module", () => {
  describe("Calculations", () => {
    const mockGoal = {
      id: 1,
      name: "Emergency Fund" as const,
      currentAmount: 8500,
      goalAmount: 15000,
      priority: "high" as const,
      targetDate: new Date(2027, 5, 30),
    };

    it("should calculate goal percentage", () => {
      const percentage = calculations.calculateGoalPercentage(mockGoal);
      expect(percentage).toBeCloseTo(56.67, 1);
    });

    it("should calculate remaining amount", () => {
      const remaining = calculations.calculateRemainingAmount(mockGoal);
      expect(remaining).toBe(6500);
    });

    it("should calculate months remaining", () => {
      const months = calculations.calculateMonthsRemaining(mockGoal, 500);
      expect(months).toBe(13);
    });

    it("should handle zero contribution", () => {
      const months = calculations.calculateMonthsRemaining(mockGoal, 0);
      expect(months).toBeNull();
    });

    it("should handle completed goal", () => {
      const completedGoal = { ...mockGoal, currentAmount: 15000 };
      const remaining = calculations.calculateRemainingAmount(completedGoal);
      expect(remaining).toBe(0);

      const months = calculations.calculateMonthsRemaining(completedGoal, 500);
      expect(months).toBe(0);
    });

    it("should rank goals by priority", () => {
      const goals = [
        { ...mockGoal, id: 1, priority: "low" as const },
        { ...mockGoal, id: 2, priority: "high" as const },
        { ...mockGoal, id: 3, priority: "medium" as const },
      ];

      const ranked = calculations.rankGoalsByPriority(goals);
      const priorities = ranked.map((g) => g.priority);
      expect(priorities).toContain("high");
      expect(priorities).toContain("medium");
      expect(priorities).toContain("low");
    });

    it("should get milestones for a goal", () => {
      const milestones = calculations.getMilestones(mockGoal);
      expect(milestones).toHaveLength(4);
      expect(milestones[0].percentage).toBe(25);
      expect(milestones[1].percentage).toBe(50);
      expect(milestones[2].percentage).toBe(75);
      expect(milestones[3].percentage).toBe(100);
    });

    it("should calculate savings velocity", () => {
      const velocity = calculations.calculateSavingsVelocity(mockGoal, 500);
      // Should return a string describing time to completion
      expect(typeof velocity).toBe("string");
      expect(velocity.length).toBeGreaterThan(0);
    });

    it("should suggest savings allocation", () => {
      const goals = [
        { ...mockGoal, id: 1, currentAmount: 8500, goalAmount: 15000 },
        { ...mockGoal, id: 2, name: "Move Out Fund", currentAmount: 12300, goalAmount: 25000 },
      ];

      const allocation = calculations.suggestSavingsAllocation(goals, 1000);
      expect(allocation).toHaveLength(2);
      expect(allocation[0].suggestedAmount).toBeGreaterThan(0);
    });

    it("should calculate required monthly contribution", () => {
      const goals = [
        { ...mockGoal, id: 1, currentAmount: 8500, goalAmount: 15000, targetDate: new Date(2027, 5, 30) },
      ];

      const required = calculations.calculateRequiredMonthlyContribution(goals);
      expect(required).toBeGreaterThan(0);
    });
  });

  describe("Goal Completion", () => {
    it("should handle completed goals", () => {
      const completedGoal = {
        id: 1,
        name: "Emergency Fund" as const,
        currentAmount: 15000,
        goalAmount: 15000,
        priority: "high" as const,
      };

      const percentage = calculations.calculateGoalPercentage(completedGoal);
      expect(percentage).toBe(100);

      const remaining = calculations.calculateRemainingAmount(completedGoal);
      expect(remaining).toBe(0);
    });

    it("should handle overfunded goals", () => {
      const overfundedGoal = {
        id: 1,
        name: "Emergency Fund" as const,
        currentAmount: 20000,
        goalAmount: 15000,
        priority: "high" as const,
      };

      const percentage = calculations.calculateGoalPercentage(overfundedGoal);
      expect(percentage).toBe(100);
    });
  });
});
