import { describe, expect, it } from "vitest";
import { createZeroData } from "../storage/defaultData";
import type { SpreadsheetRow } from "../types/app";
import {
  applyBillRowsEvent,
  deleteBillEvent,
  deleteTransactionEvent,
  deleteTransactionWithSnapshotEvent,
  payBillEvent,
  restoreDeletedBillEvent,
  restoreDeletedTransactionEvent,
} from "./financialEventEngine";

function row(id: string, cells: Record<string, string>): SpreadsheetRow {
  return { id, cells };
}

function bill(status: string, paymentAccount = ""): SpreadsheetRow {
  return row("phone", {
    name: "Phone",
    category: "Utilities",
    amount: "25.00",
    dueDate: "2026-08-08",
    status,
    paymentAccount,
    paidDate: status === "paid" ? "2026-08-08" : "",
  });
}

describe("canonical financial events", () => {
  it("marks a bill paid, creates exactly one linked transaction, and updates its account", () => {
    const data = createZeroData();
    data.sections.money = [row("chime", { label: "Chime", section: "cash", amount: "100.00" })];
    data.sections.bills = [bill("unpaid")];

    const paid = applyBillRowsEvent(data, [bill("paid", "Chime")]);

    expect(paid.sections.money[0].cells.amount).toBe("75.00");
    expect(paid.sections.transactions).toHaveLength(1);
    expect(paid.sections.transactions[0]).toMatchObject({
      id: "bill-payment-phone",
      cells: {
        billId: "phone",
        financialEventType: "bill_payment",
        account: "Chime",
        balanceApplied: "yes",
      },
    });
  });

  it("records a bill payment from either UI through one idempotent canonical event", () => {
    const data = createZeroData();
    data.sections.money = [row("chime", { label: "Chime", section: "cash", amount: "100.00" })];
    data.sections.bills = [bill("overdue")];

    const paid = payBillEvent(data, { billId: "phone", paymentAccount: "Chime", paidDate: "2026-08-08" });
    const retried = payBillEvent(paid, { billId: "phone", paymentAccount: "Chime", paidDate: "2026-08-08" });

    expect(paid.sections.bills[0].cells).toMatchObject({ status: "paid", paymentAccount: "Chime", paidDate: "2026-08-08" });
    expect(paid.sections.transactions[0].cells).toMatchObject({ transactionKind: "bill_payment", billId: "phone" });
    expect(retried.sections.money[0].cells.amount).toBe("75.00");
    expect(retried.sections.transactions).toHaveLength(1);
  });

  it("rejects incomplete payment requests without changing the source data", () => {
    const data = createZeroData();
    data.sections.bills = [bill("overdue")];

    expect(() => payBillEvent(data, { billId: "phone", paymentAccount: "", paidDate: "2026-08-08" })).toThrow(/Choose the account/);
    expect(() => payBillEvent(data, { billId: "phone", paymentAccount: "Chime", paidDate: "2026-02-30" })).toThrow(/valid paid date/);
    expect(data.sections.bills[0].cells.status).toBe("overdue");
  });

  it("is idempotent when an already-paid bill is saved again", () => {
    const data = createZeroData();
    data.sections.money = [row("chime", { label: "Chime", section: "cash", amount: "100.00" })];
    data.sections.bills = [bill("unpaid")];
    const first = applyBillRowsEvent(data, [bill("paid", "Chime")]);

    const second = applyBillRowsEvent(first, first.sections.bills);

    expect(second.sections.transactions).toHaveLength(1);
    expect(second.sections.money[0].cells.amount).toBe("75.00");
  });

  it("rejects a newly-paid bill without a paying account", () => {
    const data = createZeroData();
    data.sections.bills = [bill("unpaid")];

    expect(() => applyBillRowsEvent(data, [bill("paid")])).toThrow(/Choose the account/);
  });

  it("lets a valid bill payment proceed when an unrelated legacy paid row lacks evidence", () => {
    const data = createZeroData();
    data.sections.money = [row("chime", { label: "Chime", section: "cash", amount: "100.00" })];
    data.sections.bills = [
      row("legacy-gym", {
        name: "gym membership",
        amount: "10.00",
        dueDate: "2026-08-01",
        status: "paid",
        paymentAccount: "",
        paidDate: "",
      }),
      bill("overdue"),
    ];

    const paid = payBillEvent(data, { billId: "phone", paymentAccount: "Chime", paidDate: "2026-08-08" });

    expect(paid.sections.money[0].cells.amount).toBe("75.00");
    expect(paid.sections.transactions).toHaveLength(1);
    expect(paid.sections.transactions[0].cells.billId).toBe("phone");
    expect(paid.sections.bills.find((candidate) => candidate.id === "legacy-gym")?.cells).toMatchObject({
      status: "paid",
      paymentAccount: "",
      paidDate: "",
    });
  });

  it("lets a bill payment proceed when unrelated applied transfer history no longer matches available cash", () => {
    const data = createZeroData();
    data.sections.money = [
      row("cash-app", { label: "Cash App", section: "cash", amount: "-50.00" }),
      row("chime", { label: "Chime", section: "cash", amount: "200.00" }),
    ];
    data.sections.transactions = [row("legacy-transfer", {
      type: "transfer",
      amount: "100.00",
      date: "2026-07-01",
      account: "Cash App",
      transferDestination: "Chime",
      transferSourceId: "cash-app",
      transferDestinationId: "chime",
      balanceApplied: "yes",
      balanceApplication: "transaction-editor",
    })];
    data.sections.bills = [bill("overdue")];

    const paid = payBillEvent(data, {
      billId: "phone",
      paymentAccount: "Chime",
      paidDate: "2026-08-26",
    });

    expect(paid.sections.money.find((candidate) => candidate.id === "cash-app")?.cells.amount).toBe("-50.00");
    expect(paid.sections.money.find((candidate) => candidate.id === "chime")?.cells.amount).toBe("175.00");
    expect(paid.sections.transactions).toHaveLength(2);
    expect(paid.sections.transactions.find((candidate) => candidate.cells.billId === "phone")?.cells).toMatchObject({
      type: "expense",
      amount: "-25.00",
      account: "Chime",
      balanceApplied: "yes",
    });
  });

  it("creates one canonical transaction when repairing a legacy paid row with complete evidence", () => {
    const data = createZeroData();
    data.sections.money = [row("chime", { label: "Chime", section: "cash", amount: "100.00" })];
    data.sections.bills = [row("legacy-gym", {
      name: "gym membership",
      amount: "10.00",
      dueDate: "2026-08-01",
      status: "paid",
      paymentAccount: "",
      paidDate: "",
    })];

    const repaired = payBillEvent(data, {
      billId: "legacy-gym",
      paymentAccount: "Chime",
      paidDate: "2026-08-08",
    });
    const retried = payBillEvent(repaired, {
      billId: "legacy-gym",
      paymentAccount: "Chime",
      paidDate: "2026-08-08",
    });

    expect(repaired.sections.money[0].cells.amount).toBe("90.00");
    expect(repaired.sections.transactions).toHaveLength(1);
    expect(repaired.sections.transactions[0].cells.billId).toBe("legacy-gym");
    expect(retried.sections.money[0].cells.amount).toBe("90.00");
    expect(retried.sections.transactions).toHaveLength(1);
  });

  it("deleting a linked bill transaction restores the balance and reopens the bill", () => {
    const data = createZeroData();
    data.sections.money = [row("chime", { label: "Chime", section: "cash", amount: "100.00" })];
    data.sections.bills = [bill("unpaid")];
    const paid = applyBillRowsEvent(data, [bill("paid", "Chime")]);

    const deleted = deleteTransactionEvent(paid, "bill-payment-phone");

    expect(deleted.sections.transactions).toEqual([]);
    expect(deleted.sections.money[0].cells.amount).toBe("100.00");
    expect(deleted.sections.bills[0].cells).toMatchObject({
      status: "unpaid",
      paymentAccount: "",
      paidDate: "",
    });
  });

  it("deletes a paid bill and its linked payment atomically, then restores both exactly", () => {
    const data = createZeroData();
    data.sections.money = [row("chime", { label: "Chime", section: "cash", amount: "100.00" })];
    data.sections.bills = [bill("unpaid")];
    const paid = applyBillRowsEvent(data, [bill("paid", "Chime")]);
    const originalBill = paid.sections.bills[0];
    const originalTransaction = paid.sections.transactions[0];

    const deleted = deleteBillEvent(paid, "phone");

    expect(deleted.data.sections.bills).toEqual([]);
    expect(deleted.data.sections.transactions).toEqual([]);
    expect(deleted.data.sections.money[0].cells.amount).toBe("100.00");
    expect(deleted.snapshot).not.toBeNull();

    const restored = restoreDeletedBillEvent(deleted.data, deleted.snapshot!);

    expect(restored.sections.bills[0]).toEqual(originalBill);
    expect(restored.sections.transactions[0]).toMatchObject(originalTransaction);
    expect(restored.sections.money[0].cells.amount).toBe("75.00");
    expect(restoreDeletedBillEvent(restored, deleted.snapshot!)).toEqual(restored);
  });

  it("deleting an ordinary applied transaction reverses its account effect", () => {
    const data = createZeroData();
    data.sections.money = [row("cash", { label: "Cash", section: "cash", amount: "40.00" })];
    data.sections.transactions = [row("groceries", {
      description: "Groceries",
      type: "expense",
      amount: "-10.00",
      date: "2026-08-08",
      account: "Cash",
      balanceEndpointId: "cash",
      balanceEffect: "expense",
      balanceApplied: "yes",
      balanceApplication: "transaction-editor",
    })];

    const deleted = deleteTransactionEvent(data, "groceries");

    expect(deleted.sections.money[0].cells.amount).toBe("50.00");
    expect(deleted.sections.transactions).toEqual([]);
  });

  it("restores an ordinary deleted transaction at its original position with the exact balance effect", () => {
    const data = createZeroData();
    data.sections.money = [row("cash", { label: "Cash", section: "cash", amount: "40.00" })];
    data.sections.transactions = [
      row("before", { description: "Before", type: "income", amount: "1.00" }),
      row("groceries", {
        description: "Groceries",
        type: "expense",
        amount: "-10.00",
        date: "2026-08-08",
        account: "Cash",
        balanceEndpointId: "cash",
        balanceEffect: "expense",
        balanceApplied: "yes",
        balanceApplication: "transaction-editor",
      }),
      row("after", { description: "After", type: "income", amount: "1.00" }),
    ];

    const deleted = deleteTransactionWithSnapshotEvent(data, "groceries");
    expect(deleted.data.sections.money[0].cells.amount).toBe("50.00");
    expect(deleted.snapshot).not.toBeNull();

    const restored = restoreDeletedTransactionEvent(deleted.data, deleted.snapshot!);
    expect(restored.sections.transactions.map((transaction) => transaction.id)).toEqual(["before", "groceries", "after"]);
    expect(restored.sections.money[0].cells.amount).toBe("40.00");
    expect(restoreDeletedTransactionEvent(restored, deleted.snapshot!)).toEqual(restored);
  });

  it("restores a deleted bill-payment transaction and its complete bill evidence", () => {
    const data = createZeroData();
    data.sections.money = [row("chime", { label: "Chime", section: "cash", amount: "100.00" })];
    data.sections.bills = [bill("unpaid")];
    const paid = payBillEvent(data, { billId: "phone", paymentAccount: "Chime", paidDate: "2026-08-08" });

    const deleted = deleteTransactionWithSnapshotEvent(paid, "bill-payment-phone");
    expect(deleted.data.sections.bills[0].cells).toMatchObject({ status: "unpaid", paymentAccount: "", paidDate: "" });
    expect(deleted.data.sections.money[0].cells.amount).toBe("100.00");

    const restored = restoreDeletedTransactionEvent(deleted.data, deleted.snapshot!);
    expect(restored.sections.bills[0]).toEqual(paid.sections.bills[0]);
    expect(restored.sections.transactions[0]).toMatchObject(paid.sections.transactions[0]);
    expect(restored.sections.money[0].cells.amount).toBe("75.00");
  });
});
