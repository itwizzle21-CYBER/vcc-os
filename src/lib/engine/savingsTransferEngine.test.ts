import { describe, expect, it } from "vitest";
import { computeFinancialState } from "./financialEngine";
import { createZeroData } from "../storage/defaultData";
import { applySavingsTransfer } from "./savingsTransferEngine";

describe("savings transfer engine", () => {
  it("updates the source, savings vault, and transactions as one transfer without changing total cash", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "debit-card", cells: { label: "Chime Card", section: "cash", amount: "500.00" } }];
    data.sections.savings = [{ id: "emergency", cells: { name: "Emergency Fund", balance: "100.00", protected: "Yes" } }];

    const next = applySavingsTransfer(data, {
      sourceId: "debit-card",
      destinationId: "emergency",
      amount: 75,
      date: "2026-07-21",
      transferId: "transfer-1",
    });

    expect(next.sections.money[0].cells.amount).toBe("425.00");
    expect(next.sections.savings[0].cells.balance).toBe("175.00");
    expect(next.sections.transactions[0]).toMatchObject({
      id: "transfer-1",
      cells: {
        type: "transfer",
        category: "Savings",
        amount: "-75.00",
        account: "Chime Card",
        transferSourceId: "debit-card",
        transferDestinationId: "emergency",
        balanceApplied: "yes",
      },
    });

    const state = computeFinancialState(next);
    expect(state.totalCash).toBe(600);
    expect(state.spendableCash).toBe(425);
    expect(state.protectedSavings).toBe(175);
    expect(state.weeklySpending).toBe(0);
  });

  it("rejects a transfer that exceeds the selected source balance", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "card", cells: { label: "Debit Card", section: "cash", amount: "40" } }];
    data.sections.savings = [{ id: "vault", cells: { name: "Savings", balance: "0" } }];

    expect(() => applySavingsTransfer(data, {
      sourceId: "card",
      destinationId: "vault",
      amount: 50,
      date: "2026-07-21",
    })).toThrow("exceeds the Debit Card balance");
  });

  it("treats a repeated transfer id as an idempotent retry", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "checking", cells: { label: "Checking", section: "cash", amount: "100" } }];
    data.sections.savings = [{ id: "vault", cells: { name: "Savings", balance: "0" } }];
    const first = applySavingsTransfer(data, { sourceId: "checking", destinationId: "vault", amount: 25, date: "2026-07-21", transferId: "retry-key" });
    const retried = applySavingsTransfer(first, { sourceId: "checking", destinationId: "vault", amount: 25, date: "2026-07-21", transferId: "retry-key" });

    expect(retried).toBe(first);
    expect(retried.sections.money[0].cells.amount).toBe("75.00");
    expect(retried.sections.savings[0].cells.balance).toBe("25.00");
  });

  it("rejects borrowed sources and impossible calendar dates", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "spotme", cells: { label: "SpotMe", section: "borrowed", amount: "100" } }];
    data.sections.savings = [{ id: "vault", cells: { name: "Savings", balance: "0" } }];

    expect(() => applySavingsTransfer(data, { sourceId: "spotme", destinationId: "vault", amount: 25, date: "2026-07-21" })).toThrow("cash, checking, or debit");
    data.sections.money[0] = { id: "checking", cells: { label: "Checking", section: "cash", amount: "100" } };
    expect(() => applySavingsTransfer(data, { sourceId: "checking", destinationId: "vault", amount: 25, date: "2026-02-30" })).toThrow("valid transfer date");
  });
});
