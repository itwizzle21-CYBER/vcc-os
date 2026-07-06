import { describe, expect, it } from "vitest";
import {
  createMoneySnapshot,
  createPriorityAlerts,
  createTodayMission,
  rankBills,
  type DecisionBill,
} from "./decisionEngine";

const today = new Date("2026-07-06T12:00:00");

const bills: DecisionBill[] = [
  {
    id: 1,
    name: "Electric",
    amount: 180,
    dueDate: "2026-07-06",
    status: "pending",
    impact: "critical",
  },
  {
    id: 2,
    name: "Streaming",
    amount: 19,
    dueDate: "2026-07-04",
    status: "pending",
    impact: "low",
  },
  {
    id: 3,
    name: "Rent",
    amount: 1200,
    dueDate: "2026-07-09",
    status: "pending",
    impact: "critical",
  },
];

describe("decision engine", () => {
  it("ranks bills by urgency, due date, and impact", () => {
    const ranked = rankBills(bills, today);

    expect(ranked[0].name).toBe("Electric");
    expect(ranked[0].score).toBeGreaterThan(ranked[2].score);
  });

  it("generates a single mission and recommended move", () => {
    const mission = createTodayMission(bills, today);

    expect(mission.title).toBe("Pay Electric");
    expect(mission.recommendedMove).toContain("Electric");
    expect(mission.supportingTasks).toHaveLength(2);
  });

  it("clarifies cash after bills in the money snapshot", () => {
    const snapshot = createMoneySnapshot(
      {
        cash: 2000,
        savings: 6000,
        investments: 4000,
        totalLiabilities: 3000,
        monthlyIncome: 5200,
        monthlyExpenses: 3100,
      },
      bills,
      today
    );

    expect(snapshot.dueBillsTotal).toBe("$1,399.00");
    expect(snapshot.cashAfterDueBills).toBe("$601.00");
  });

  it("turns the highest ranked obligations into priority alerts", () => {
    const alerts = createPriorityAlerts(bills, today);

    expect(alerts[0].type).toBe("warning");
    expect(alerts[0].message).toContain("Decision score");
  });
});
