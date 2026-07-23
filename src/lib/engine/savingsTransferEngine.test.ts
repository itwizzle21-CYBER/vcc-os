import { describe, expect, it } from "vitest";
import { computeFinancialState } from "./financialEngine";
import { createZeroData } from "../storage/defaultData";
import { applySavingsTransfer, syncTransactionTransfers, transactionEndpointOptions } from "./savingsTransferEngine";

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

  it("offers the named accounts and savings vaults as transaction dropdown endpoints", () => {
    const data = createZeroData();
    data.sections.savings = [{ id: "vault", cells: { name: "Emergency Vault", balance: "25" } }];

    const values = transactionEndpointOptions(data).map((option) => option.value);
    expect(values).toEqual(expect.arrayContaining(["Chime", "Apple Cash", "Wise", "Cash App", "Cash", "Emergency Vault"]));
  });

  it("applies, reverses, and removes a transaction-page transfer without double-counting balances", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "checking", cells: { label: "Chime", section: "cash", amount: "100" } }];
    data.sections.savings = [{ id: "vault", cells: { name: "Emergency Vault", balance: "25" } }];
    const transfer = { id: "manual-transfer", cells: { type: "transfer", amount: "40", date: "2026-07-22", account: "Chime", transferDestination: "Emergency Vault" } };

    const applied = syncTransactionTransfers(data, [transfer]);
    expect(applied.sections.money[0].cells.amount).toBe("60.00");
    expect(applied.sections.savings[0].cells.balance).toBe("65.00");
    expect(applied.sections.transactions[0].cells).toMatchObject({ transferSourceId: "checking", transferDestinationId: "vault", balanceApplied: "yes" });

    const swapping = syncTransactionTransfers(applied, [{ ...applied.sections.transactions[0], cells: { ...applied.sections.transactions[0].cells, amount: "10", account: "Emergency Vault" } }]);
    expect(swapping.sections.money[0].cells.amount).toBe("100.00");
    expect(swapping.sections.savings[0].cells.balance).toBe("25.00");
    expect(swapping.sections.transactions[0].cells.transferValidation).toContain("different places");

    const reversed = syncTransactionTransfers(swapping, [{ ...swapping.sections.transactions[0], cells: { ...swapping.sections.transactions[0].cells, transferDestination: "Chime" } }]);
    expect(reversed.sections.money[0].cells.amount).toBe("110.00");
    expect(reversed.sections.savings[0].cells.balance).toBe("15.00");

    const removed = syncTransactionTransfers(reversed, []);
    expect(removed.sections.money[0].cells.amount).toBe("100.00");
    expect(removed.sections.savings[0].cells.balance).toBe("25.00");
  });

  it("can move money from a vault into a newly selected account", () => {
    const data = createZeroData();
    data.sections.savings = [{ id: "vault", cells: { name: "Emergency Vault", balance: "50" } }];

    const next = syncTransactionTransfers(data, [{ id: "vault-withdrawal", cells: { type: "transfer", amount: "20", date: "2026-07-22", account: "Emergency Vault", transferDestination: "Apple Cash" } }]);
    expect(next.sections.savings[0].cells.balance).toBe("30.00");
    expect(next.sections.money.find((row) => row.cells.label === "Apple Cash")?.cells.amount).toBe("20.00");
  });

  it("applies cash income and expenses to the selected account and dashboard totals", () => {
    const data = createZeroData();
    const today = new Date();
    const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
    const income = { id: "cash-income", cells: { description: "Cash work", type: "income", amount: "125", date, account: "Cash" } };

    const paid = syncTransactionTransfers(data, [income]);
    expect(paid.sections.money.find((row) => row.cells.label === "Cash")?.cells.amount).toBe("125.00");
    expect(paid.sections.transactions[0].cells).toMatchObject({ balanceEffect: "income", balanceApplied: "yes" });
    expect(computeFinancialState(paid)).toMatchObject({ totalCash: 125, weeklyIncome: 125, receivedIncome: 125 });

    const expense = { id: "cash-expense", cells: { description: "Cash purchase", type: "expense", amount: "25", date, account: "Cash" } };
    const spent = syncTransactionTransfers(paid, [paid.sections.transactions[0], expense]);
    expect(spent.sections.money.find((row) => row.cells.label === "Cash")?.cells.amount).toBe("100.00");
    expect(computeFinancialState(spent).weeklySpending).toBe(25);
  });
});
