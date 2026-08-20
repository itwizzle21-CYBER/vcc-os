import { describe, expect, it } from "vitest";
import { createZeroData } from "../storage/defaultData";
import type { SpreadsheetRow } from "../types/app";
import {
  applyBillRowsEvent,
  deleteBillEvent,
  deleteTransactionEvent,
  restoreDeletedBillEvent,
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
});
