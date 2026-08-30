import { describe, expect, it } from "vitest";
import { createZeroData } from "../storage/defaultData";
import { computeDecisionEngine } from "./decisionEngine";
import { computeFinancialState } from "./financialEngine";

describe("decision engine mission lifecycle", () => {
  it("shows borrowed money while active, briefly completes it, then removes it from the stack", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "mypay", cells: { label: "MyPay Advance", section: "borrowed", amount: "50" } }];

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

  it("keeps due-today bills aligned across the mission, alert, and recommendation", () => {
    const data = createZeroData();
    const today = new Date();
    const todayLocal = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
    data.sections.money = [{ id: "cash", cells: { label: "Checking", section: "cash", amount: "200" } }];
    data.sections.bills = [{ id: "today", cells: { name: "Phone", amount: "20", dueDate: todayLocal, status: "unpaid" } }];

    const decision = computeDecisionEngine(computeFinancialState(data), data);
    expect(decision.todayMission.title).toBe("Clear today's bills");
    expect(decision.priorityAlerts.some((alert) => alert.title === "Bill due today")).toBe(true);
    expect(decision.recommendedMove).toContain("today’s bills");
  });

  it("derives all five semantic mission states from canonical VCC data", () => {
    const referenceDate = new Date("2026-08-29T12:00:00");
    const withCash = () => {
      const data = createZeroData();
      data.sections.money = [{ id: "cash", cells: { label: "Checking", section: "cash", amount: "1000" } }];
      return data;
    };

    const criticalData = createZeroData();
    criticalData.sections.bills = [{ id: "late", cells: { name: "Rent", amount: "900", dueDate: "2026-08-28", status: "unpaid" } }];
    const critical = computeDecisionEngine(computeFinancialState(criticalData, referenceDate), criticalData);
    expect(critical.todayMission).toMatchObject({ state: "critical", id: "stabilize-overdue-bills", workflowHref: "/bills?mission=overdue" });
    expect(critical.todayMission.metrics).toEqual(expect.arrayContaining([expect.objectContaining({ value: "$900.00", label: "Total overdue" })]));
    expect(critical.todayMission.spendableSafe.available).toBe(false);

    const warningData = withCash();
    warningData.sections.bills = [{ id: "soon", cells: { name: "Phone", amount: "120", dueDate: "2026-09-02", status: "unpaid" } }];
    const warning = computeDecisionEngine(computeFinancialState(warningData, referenceDate), warningData);
    expect(warning.todayMission).toMatchObject({ state: "warning", id: "prepare-upcoming-bills", workflowHref: "/bills?mission=upcoming" });

    const goodData = withCash();
    const good = computeDecisionEngine(computeFinancialState(goodData, referenceDate), goodData);
    expect(good.todayMission).toMatchObject({ state: "good", id: "hold-week-steady" });

    const infoData = createZeroData();
    const info = computeDecisionEngine(computeFinancialState(infoData, referenceDate), infoData);
    expect(info.todayMission).toMatchObject({ state: "info", id: "complete-financial-setup" });
    expect(info.todayMission.spendableSafe).toMatchObject({ available: false });

    const successData = withCash();
    successData.sections.goals = [{ id: "goal", cells: { name: "Emergency goal", current: "500", target: "500" } }];
    const success = computeDecisionEngine(computeFinancialState(successData, referenceDate), successData);
    expect(success.todayMission).toMatchObject({ state: "success", id: "acknowledge-goal-milestone", href: "/goals" });
  });

  it("recalculates the primary mission when its underlying condition is resolved", () => {
    const referenceDate = new Date("2026-08-29T12:00:00");
    const data = createZeroData();
    data.sections.money = [{ id: "cash", cells: { label: "Checking", section: "cash", amount: "1000" } }];
    data.sections.bills = [{ id: "late", cells: { name: "Rent", amount: "900", dueDate: "2026-08-28", status: "unpaid" } }];

    expect(computeDecisionEngine(computeFinancialState(data, referenceDate), data).todayMission.state).toBe("critical");

    data.sections.bills = [];
    const recalculated = computeDecisionEngine(computeFinancialState(data, referenceDate), data);
    expect(recalculated.todayMission).toMatchObject({ state: "good", id: "hold-week-steady" });
    expect(recalculated.todayMission.title).not.toBe("Stabilize overdue bills");
  });

  it("ranks the dashboard stack across the overall system", () => {
    const data = createZeroData();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayLocal = [yesterday.getFullYear(), String(yesterday.getMonth() + 1).padStart(2, "0"), String(yesterday.getDate()).padStart(2, "0")].join("-");
    data.sections.bills = [{ id: "late", cells: { name: "Rent", amount: "900", dueDate: yesterdayLocal, status: "unpaid" } }];
    data.sections.money = [{ id: "overdrawn", cells: { label: "Checking", section: "cash", amount: "-25" } }];
    data.sections.inventory = [{ id: "food", cells: { item: "Rice", qty: "0", minNeeded: "2", cost: "5" } }];
    data.sections.debt = [{ id: "card", cells: { name: "Credit card", balance: "500", minimum: "25" } }];

    const decision = computeDecisionEngine(computeFinancialState(data), data);

    expect(decision.missionStack.map((mission) => mission.id)).toEqual(expect.arrayContaining([
      "stabilize-overdue-bills",
      "cover-account-deficit",
      "restock-buy-next",
      "maintain-debt-progress",
    ]));
    expect(decision.missionStack[0]).toMatchObject({
      title: decision.todayMission.title,
      priority: "Critical",
      href: "/bills",
    });
  });
});
