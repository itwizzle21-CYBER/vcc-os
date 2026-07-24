import { describe, expect, it } from "vitest";
import { createZeroData } from "../storage/defaultData";
import { computeFinancialState } from "./financialEngine";
import { depositAccountOptions, eligibleDepositAccounts, lockPaycheckWeek } from "./paycheckPlannerEngine";
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

  it("offers common deposit accounts and creates the selected Money Snapshot account on lock", () => {
    const data = createZeroData();
    expect(depositAccountOptions(data).map((option) => option.label)).toEqual(["Chime", "Apple Cash", "Wise", "Cash App", "Cash on Hand"]);
    data.paycheckPlanner = {
      incomeSource: "Client work",
      depositAccountId: "money-account-wise",
      paycheckAmount: "400",
      payDate: "2026-07-22",
      weekStart: "2026-07-19",
      weekEnd: "2026-07-25",
      spotMeRepayment: "0",
      myPayRepayment: "0",
      depositApplied: false,
      locked: false,
    };

    const next = lockPaycheckWeek(data);
    expect(next.sections.money).toContainEqual(expect.objectContaining({
      id: "money-account-wise",
      cells: expect.objectContaining({ label: "Wise", amount: "400.00", section: "cash" }),
    }));
    expect(next.sections.transactions[0].cells.account).toBe("Wise");
  });

  it("treats an existing Cash row as Cash on Hand without offering a duplicate", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "wallet", cells: { label: "Cash", section: "cash", amount: "40" } }];

    const cashOptions = depositAccountOptions(data).filter((option) => option.label === "Cash on Hand");
    expect(cashOptions).toEqual([{ id: "wallet", label: "Cash on Hand", balance: 40, isNew: false }]);
  });

  it("links common account name variants without showing duplicate suggested accounts", () => {
    const data = createZeroData();
    data.sections.money = [
      { id: "chime-checking", cells: { label: "Chime Checking", section: "cash", amount: "125" } },
      { id: "apple-card", cells: { label: "Apple Cash Card", section: "cash", amount: "50" } },
    ];

    const options = depositAccountOptions(data);
    expect(options.filter((option) => option.label.toLowerCase().includes("chime"))).toEqual([
      { id: "chime-checking", label: "Chime Checking", balance: 125, isNew: false },
    ]);
    expect(options.filter((option) => option.label.toLowerCase().includes("apple cash"))).toEqual([
      { id: "apple-card", label: "Apple Cash Card", balance: 50, isNew: false },
    ]);
  });

  it("applies a sourced paycheck to one account and carries it into a savings transfer without double-counting", () => {
    const data = createZeroData();
    data.sections.money = [
      { id: "chime", cells: { label: "Chime Card", section: "cash", amount: "100.00" } },
      { id: "borrowed", cells: { label: "SpotMe / MyPay", section: "borrowed", amount: "150.00" } },
    ];
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
    expect(locked.sections.money.find((row) => row.id === "chime")?.cells.amount).toBe("950.00");
    expect(locked.sections.money.find((row) => row.id === "borrowed")?.cells.amount).toBe("0.00");
    expect(locked.paycheckHistory[0]).toMatchObject({ incomeSource: "Acme Payroll", depositAccountId: "chime", remaining: "850.00" });
    expect(locked.sections.transactions[0]).toMatchObject({ cells: { type: "income", account: "Chime Card", balanceApplied: "yes" } });
    expect(computeFinancialState(locked).totalCash).toBe(1000);
    expect(computeFinancialState(locked).receivedIncome).toBe(1000);
    expect(computeFinancialState(locked).borrowedMoney).toBe(0);

    const transferred = applySavingsTransfer(locked, {
      sourceId: "chime",
      destinationId: "emergency",
      amount: 200,
      date: "2026-07-22",
      transferId: "savings-transfer",
    });
    const state = computeFinancialState(transferred);
    expect(transferred.sections.money.find((row) => row.id === "chime")?.cells.amount).toBe("750.00");
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

  it("recalculates borrowed-money repayments when a paycheck is re-locked", () => {
    const data = createZeroData();
    data.sections.money = [
      { id: "checking", cells: { label: "Checking", section: "cash", amount: "0" } },
      { id: "spotme", cells: { label: "SpotMe", section: "borrowed", amount: "100" } },
    ];
    data.paycheckPlanner = {
      incomeSource: "Work",
      depositAccountId: "checking",
      paycheckAmount: "500",
      payDate: "2026-07-22",
      weekStart: "2026-07-19",
      weekEnd: "2026-07-25",
      spotMeRepayment: "50",
      myPayRepayment: "0",
      depositApplied: false,
      locked: false,
    };

    const first = lockPaycheckWeek(data);
    first.paycheckPlanner = { ...first.paycheckPlanner, spotMeRepayment: "100", locked: false };
    const second = lockPaycheckWeek(first);

    expect(second.sections.money.find((row) => row.id === "checking")?.cells.amount).toBe("400.00");
    expect(second.sections.money.find((row) => row.id === "spotme")?.cells.amount).toBe("0.00");
    expect(second.paycheckHistory[0].borrowedRepayments).toEqual([{ rowId: "spotme", label: "SpotMe", amount: 100 }]);
  });

  it("rejects negative repayments and impossible paycheck dates", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "checking", cells: { label: "Checking", section: "cash", amount: "0" } }];
    data.paycheckPlanner = {
      incomeSource: "Work",
      depositAccountId: "checking",
      paycheckAmount: "500",
      payDate: "2026-07-22",
      weekStart: "2026-07-19",
      weekEnd: "2026-07-25",
      spotMeRepayment: "-10",
      myPayRepayment: "0",
      depositApplied: false,
      locked: false,
    };

    expect(() => lockPaycheckWeek(data)).toThrow("cannot be negative");
    data.paycheckPlanner.spotMeRepayment = "0";
    data.paycheckPlanner.payDate = "2026-02-30";
    expect(() => lockPaycheckWeek(data)).toThrow("valid paycheck date");
  });
});
