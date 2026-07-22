import { describe, expect, it } from "vitest";
import { createZeroData } from "../storage/defaultData";
import { computeFinancialState } from "./financialEngine";
import { eligibleDepositAccounts, lockPaycheckWeek } from "./paycheckPlannerEngine";
import { applySavingsTransfer } from "./savingsTransferEngine";

describe("connected paycheck planner", () => {
  it("shares eligible cash accounts with savings transfers without excluding credit-union checking", () => {
    const data = createZeroData();
    data.sections.money = [
      { id: "credit-union", cells: { label: "Credit Union Checking", section: "cash", amount: "100" } },
      { id: "credit-card", cells: { label: "Credit Card", section: "credit", amount: "100" } },
    ];

    expect(eligibleDepositAccounts(data).map((row) => row.id)).toEqual(["credit-union"]);
  });

  it("applies a sourced paycheck to one account and carries it into a savings transfer without double-counting", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "chime", cells: { label: "Chime Card", section: "cash", amount: "100.00" } }];
    data.sections.savings = [{ id: "emergency", cells: { name: "Emergency Fund", balance: "50.00", protected: "Yes" } }];
    data.paycheckPlanner = {
      incomeSource: "Acme Payroll",
      depositAccountId: "chime",
      paycheckAmount: "1000.00",
      payDate: "2026-07-22",
      weekStart: "2026-07-19",
      weekEnd: "2026-07-25",
      spotMeRepayment: "100.00",
      myPayRepayment: "50.00",
      depositApplied: false,
      locked: false,
    };

    const locked = lockPaycheckWeek(data);
    expect(locked.sections.money[0].cells.amount).toBe("950.00");
    expect(locked.paycheckHistory[0]).toMatchObject({ incomeSource: "Acme Payroll", depositAccountId: "chime", remaining: "850.00" });
    expect(locked.sections.transactions[0]).toMatchObject({ cells: { type: "income", account: "Chime Card", balanceApplied: "yes" } });
    expect(computeFinancialState(locked).totalCash).toBe(1000);
    expect(computeFinancialState(locked).receivedIncome).toBe(1000);

    const transferred = applySavingsTransfer(locked, {
      sourceId: "chime",
      destinationId: "emergency",
      amount: 200,
      date: "2026-07-22",
      transferId: "savings-transfer",
    });
    const state = computeFinancialState(transferred);
    expect(transferred.sections.money[0].cells.amount).toBe("750.00");
    expect(transferred.sections.savings[0].cells.balance).toBe("250.00");
    expect(transferred.sections.transactions).toHaveLength(2);
    expect(state.totalCash).toBe(1000);
    expect(state.spendableCash).toBe(750);
    expect(state.protectedSavings).toBe(250);
  });

  it("replaces a re-locked paycheck without applying its deposit twice", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "checking", cells: { label: "Checking", section: "cash", amount: "0" } }];
    data.paycheckPlanner = {
      incomeSource: "Work",
      depositAccountId: "checking",
      paycheckAmount: "500",
      payDate: "2026-07-22",
      weekStart: "2026-07-19",
      weekEnd: "2026-07-25",
      spotMeRepayment: "0",
      myPayRepayment: "0",
      depositApplied: false,
      locked: false,
    };

    const first = lockPaycheckWeek(data);
    first.paycheckPlanner = { ...first.paycheckPlanner, paycheckAmount: "600", locked: false };
    const second = lockPaycheckWeek(first);

    expect(second.sections.money[0].cells.amount).toBe("600.00");
    expect(second.paycheckHistory).toHaveLength(1);
    expect(second.sections.transactions).toHaveLength(1);
  });
});
