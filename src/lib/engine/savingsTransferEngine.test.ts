import { describe, expect, it } from "vitest";
import { computeFinancialState } from "./financialEngine";
import { createZeroData } from "../storage/defaultData";
import { applySavingsTransfer, syncTransactionEndpointLabels, syncTransactionTransfers, transactionEndpointOptions } from "./savingsTransferEngine";

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

  it("moves money between two Money Snapshot accounts", () => {
    const data = createZeroData();
    data.sections.money = [
      { id: "checking", cells: { label: "Checking", section: "cash", amount: "100" } },
      { id: "cash-app", cells: { label: "Cash App", section: "cash", amount: "25" } },
    ];

    const next = syncTransactionTransfers(data, [{
      id: "account-transfer",
      cells: { type: "transfer", amount: "40", date: "2026-07-22", account: "Checking", transferDestination: "Cash App" },
    }]);

    expect(next.sections.money.find((row) => row.id === "checking")?.cells.amount).toBe("60.00");
    expect(next.sections.money.find((row) => row.id === "cash-app")?.cells.amount).toBe("65.00");
    expect(next.sections.transactions[0].cells).toMatchObject({
      category: "Transfers",
      transferSourceId: "checking",
      transferDestinationId: "cash-app",
      balanceApplied: "yes",
    });
  });

  it("moves money between two savings vaults", () => {
    const data = createZeroData();
    data.sections.savings = [
      { id: "emergency", cells: { name: "Emergency", balance: "100" } },
      { id: "travel", cells: { name: "Travel", balance: "25" } },
    ];

    const next = syncTransactionTransfers(data, [{
      id: "vault-transfer",
      cells: { type: "transfer", amount: "30", date: "2026-07-22", account: "Emergency", transferDestination: "Travel" },
    }]);

    expect(next.sections.savings.find((row) => row.id === "emergency")?.cells.balance).toBe("70.00");
    expect(next.sections.savings.find((row) => row.id === "travel")?.cells.balance).toBe("55.00");
    expect(next.sections.transactions[0].cells).toMatchObject({
      transferSourceId: "emergency",
      transferDestinationId: "travel",
      balanceApplied: "yes",
    });
  });

  it("keeps applied transactions linked by account id after the account is renamed", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "checking", cells: { label: "Checking", section: "cash", amount: "100" } }];
    const expense = { id: "expense", cells: { type: "expense", amount: "20", date: "2026-07-22", account: "Checking" } };

    const applied = syncTransactionTransfers(data, [expense]);
    const renamed = {
      ...applied,
      sections: {
        ...applied.sections,
        money: applied.sections.money.map((row) => row.id === "checking"
          ? { ...row, cells: { ...row.cells, label: "Primary Checking" } }
          : row),
      },
    };
    const resynced = syncTransactionTransfers(renamed, renamed.sections.transactions);

    expect(resynced.sections.money[0].cells.amount).toBe("80.00");
    expect(resynced.sections.transactions[0].cells).toMatchObject({
      account: "Primary Checking",
      balanceEndpointId: "checking",
    });
  });

  it("clears transfer-only fields when a transaction changes to an expense", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "checking", cells: { label: "Checking", section: "cash", amount: "100" } }];
    data.sections.savings = [{ id: "vault", cells: { name: "Emergency", balance: "0" } }];
    const transfer = { id: "move", cells: { type: "transfer", amount: "25", date: "2026-07-22", account: "Checking", transferDestination: "Emergency" } };

    const applied = syncTransactionTransfers(data, [transfer]);
    const changed = syncTransactionTransfers(applied, [{
      ...applied.sections.transactions[0],
      cells: { ...applied.sections.transactions[0].cells, type: "expense", amount: "10" },
    }]);

    expect(changed.sections.money[0].cells.amount).toBe("90.00");
    expect(changed.sections.savings[0].cells.balance).toBe("0.00");
    expect(changed.sections.transactions[0].cells).toMatchObject({
      type: "expense",
      transferDestination: "",
    });
    expect(changed.sections.transactions[0].cells.transferSourceId).toBeUndefined();
    expect(changed.sections.transactions[0].cells.transferDestinationId).toBeUndefined();
  });

  it("applies cash income and expenses to the selected account and dashboard totals", () => {
    const data = createZeroData();
    const today = new Date();
    const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
    const income = { id: "cash-income", cells: { description: "Cash work", type: "income", amount: "125", date, account: "Cash" } };

    const paid = syncTransactionTransfers(data, [income]);
    expect(paid.sections.money.find((row) => row.cells.label === "Cash")?.cells.amount).toBe("125.00");
    expect(paid.sections.transactions[0].cells).toMatchObject({ balanceEffect: "income", balanceApplied: "yes" });
    expect(computeFinancialState(paid)).toMatchObject({ totalCash: 125, cashOnHand: 125, weeklyIncome: 125, receivedIncome: 125 });

    const expense = { id: "cash-expense", cells: { description: "Cash purchase", type: "expense", amount: "25", date, account: "Cash" } };
    const spent = syncTransactionTransfers(paid, [paid.sections.transactions[0], expense]);
    expect(spent.sections.money.find((row) => row.cells.label === "Cash")?.cells.amount).toBe("100.00");
    expect(computeFinancialState(spent).weeklySpending).toBe(25);
  });

  it("applies income and expenses to every selected account or vault", () => {
    const endpointRows = [
      { kind: "money", id: "checking", label: "Checking", balance: 100 },
      { kind: "money", id: "cash", label: "Cash", balance: 100 },
      { kind: "savings", id: "emergency", label: "Emergency", balance: 100 },
      { kind: "savings", id: "travel", label: "Travel", balance: 100 },
    ] as const;

    for (const endpoint of endpointRows) {
      const data = createZeroData();
      data.sections.money = endpointRows
        .filter((item) => item.kind === "money")
        .map((item) => ({ id: item.id, cells: { label: item.label, section: "cash", amount: String(item.balance) } }));
      data.sections.savings = endpointRows
        .filter((item) => item.kind === "savings")
        .map((item) => ({ id: item.id, cells: { name: item.label, balance: String(item.balance) } }));

      const income = syncTransactionTransfers(data, [{
        id: `income-${endpoint.id}`,
        cells: { type: "income", amount: "25", date: "2026-07-22", account: endpoint.label },
      }]);
      const incomeBalance = endpoint.kind === "money"
        ? income.sections.money.find((row) => row.id === endpoint.id)?.cells.amount
        : income.sections.savings.find((row) => row.id === endpoint.id)?.cells.balance;
      expect(incomeBalance, `income into ${endpoint.label}`).toBe("125.00");

      const expense = syncTransactionTransfers(data, [{
        id: `expense-${endpoint.id}`,
        cells: { type: "expense", amount: "25", date: "2026-07-22", account: endpoint.label },
      }]);
      const expenseBalance = endpoint.kind === "money"
        ? expense.sections.money.find((row) => row.id === endpoint.id)?.cells.amount
        : expense.sections.savings.find((row) => row.id === endpoint.id)?.cells.balance;
      expect(expenseBalance, `expense from ${endpoint.label}`).toBe("75.00");
    }
  });

  it("moves transfers accurately between every account and vault pairing", () => {
    const endpoints = [
      { kind: "money", id: "checking", label: "Checking" },
      { kind: "money", id: "cash", label: "Cash" },
      { kind: "savings", id: "emergency", label: "Emergency" },
      { kind: "savings", id: "travel", label: "Travel" },
    ] as const;

    for (const source of endpoints) {
      for (const destination of endpoints) {
        if (source.id === destination.id) continue;
        const data = createZeroData();
        data.sections.money = endpoints
          .filter((item) => item.kind === "money")
          .map((item) => ({ id: item.id, cells: { label: item.label, section: "cash", amount: "100" } }));
        data.sections.savings = endpoints
          .filter((item) => item.kind === "savings")
          .map((item) => ({ id: item.id, cells: { name: item.label, balance: "100" } }));

        const next = syncTransactionTransfers(data, [{
          id: `transfer-${source.id}-${destination.id}`,
          cells: { type: "transfer", amount: "25", date: "2026-07-22", account: source.label, transferDestination: destination.label },
        }]);
        const balanceOf = (id: string, kind: "money" | "savings") => kind === "money"
          ? next.sections.money.find((row) => row.id === id)?.cells.amount
          : next.sections.savings.find((row) => row.id === id)?.cells.balance;

        expect(balanceOf(source.id, source.kind), `${source.label} source`).toBe("75.00");
        expect(balanceOf(destination.id, destination.kind), `${destination.label} destination`).toBe("125.00");
        const combined = [...next.sections.money.map((row) => Number(row.cells.amount)), ...next.sections.savings.map((row) => Number(row.cells.balance))]
          .reduce((sum, value) => sum + value, 0);
        expect(combined, `${source.label} to ${destination.label} total`).toBe(400);
      }
    }
  });

  it("keeps an applied transaction attached to its account id when labels collide after a rename", () => {
    const data = createZeroData();
    data.sections.money = [
      { id: "primary", cells: { label: "Checking", section: "cash", amount: "100" } },
      { id: "secondary", cells: { label: "Spending", section: "cash", amount: "100" } },
    ];
    const applied = syncTransactionTransfers(data, [{
      id: "linked-expense",
      cells: { type: "expense", amount: "20", date: "2026-07-22", account: "Checking" },
    }]);
    const renamed = {
      ...applied,
      sections: {
        ...applied.sections,
        money: applied.sections.money.map((row) => row.id === "primary"
          ? { ...row, cells: { ...row.cells, label: "Primary" } }
          : { ...row, cells: { ...row.cells, label: "Checking" } }),
      },
    };

    const resynced = syncTransactionTransfers(renamed, renamed.sections.transactions);

    expect(resynced.sections.money.find((row) => row.id === "primary")?.cells.amount).toBe("80.00");
    expect(resynced.sections.money.find((row) => row.id === "secondary")?.cells.amount).toBe("100.00");
    expect(resynced.sections.transactions[0].cells).toMatchObject({
      account: "Primary",
      balanceEndpointId: "primary",
    });
  });

  it("keeps transaction and paycheck labels aligned when a linked account is renamed", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "checking", cells: { label: "Checking", section: "cash", amount: "100" } }];
    data.paycheckHistory = [{
      id: "paycheck-1",
      incomeSource: "Work",
      depositAccountId: "checking",
      depositAccountLabel: "Checking",
      borrowedRepayments: [],
      payDate: "2026-07-22",
      income: "100",
      spotMe: "0",
      myPay: "0",
      remaining: "100",
      weekStart: "2026-07-19",
      weekEnd: "2026-07-25",
      locked: true,
    }];
    const applied = syncTransactionTransfers(data, [{
      id: "linked-income",
      cells: { type: "income", amount: "25", date: "2026-07-22", account: "Checking" },
    }]);
    const renamed = {
      ...applied,
      sections: {
        ...applied.sections,
        money: [{ ...applied.sections.money[0], cells: { ...applied.sections.money[0].cells, label: "Primary Checking" } }],
      },
    };

    const aligned = syncTransactionEndpointLabels(renamed);

    expect(aligned.sections.money[0].cells.amount).toBe("125.00");
    expect(aligned.sections.transactions[0].cells.account).toBe("Primary Checking");
    expect(aligned.paycheckHistory[0].depositAccountLabel).toBe("Primary Checking");
  });
});
