import { describe, expect, it } from "vitest";
import { createZeroData } from "../storage/defaultData";
import { computeDecisionEngine } from "./decisionEngine";
import { computeFinancialState } from "./financialEngine";

describe("decision engine mission lifecycle", () => {
  it("shows borrowed money while active, briefly completes it, then removes it from the stack", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "spotme", cells: { label: "SpotMe", section: "borrowed", amount: "50" } }];

    const active = computeDecisionEngine(computeFinancialState(data), data);
    expect(active.missionStack.find((mission) => mission.id === "clear-borrowed-money")).toMatchObject({ completed: false, target: "$50.00 left" });
    expect(active.priorityAlerts.some((alert) => alert.title.includes("Borrowed money"))).toBe(true);

    data.sections.money[0].cells.amount = "0";
    const completed = computeDecisionEngine(computeFinancialState(data), data, ["clear-borrowed-money"]);
    expect(completed.missionStack.find((mission) => mission.id === "clear-borrowed-money")).toMatchObject({ completed: true, target: "Cleared" });
    expect(completed.priorityAlerts.some((alert) => alert.title.includes("Borrowed money"))).toBe(false);

    const removed = computeDecisionEngine(computeFinancialState(data), data);
    expect(removed.missionStack.some((mission) => mission.id === "clear-borrowed-money")).toBe(false);
  });
});
