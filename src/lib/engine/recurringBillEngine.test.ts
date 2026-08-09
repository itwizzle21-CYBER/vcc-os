import { describe, expect, it } from "vitest";
import type { SpreadsheetRow } from "../types/app";
import { configureRecurringBill, disableRecurringBill, syncRecurringBillOccurrences } from "./recurringBillEngine";

function bill(): SpreadsheetRow {
  return { id: "internet", cells: { name: "Internet", amount: "80", dueDate: "2026-01-31", status: "unpaid" } };
}

describe("recurring bill engine", () => {
  it("creates one upcoming occurrence in the normal bills list", () => {
    const rows = configureRecurringBill([bill()], "internet", { frequency: "monthly", dueDate: "2026-01-31" });
    expect(rows).toHaveLength(2);
    expect(rows[0].cells).toMatchObject({ recurring: "Yes", recurrenceFrequency: "monthly" });
    expect(rows[1]).toMatchObject({
      id: "bill-recurring-internet-2026-02-28",
      cells: { name: "Internet", dueDate: "2026-02-28", status: "unpaid", recurring: "Yes", recurrenceGenerated: "yes" },
    });
  });

  it("creates the following occurrence only after the upcoming bill is paid", () => {
    const rows = configureRecurringBill([bill()], "internet", { frequency: "monthly", dueDate: "2026-01-31" });
    const unchanged = syncRecurringBillOccurrences(rows);
    expect(unchanged).toHaveLength(2);
    const paid = rows.map((row) => row.cells.recurrenceGenerated === "yes"
      ? { ...row, cells: { ...row.cells, status: "paid", paymentAccount: "Chime", paidDate: "2026-02-28" } }
      : row);
    const advanced = syncRecurringBillOccurrences(paid);
    expect(advanced.map((row) => row.cells.dueDate)).toEqual(["2026-01-31", "2026-02-28", "2026-03-28"]);
    expect(advanced[2].cells).toMatchObject({ paymentAccount: "", paidDate: "" });
  });

  it("keeps variable bill edits and starts the next occurrence from the latest values", () => {
    const rows = configureRecurringBill([bill()], "internet", { frequency: "monthly", dueDate: "2026-01-31" });
    const editedAndPaid = rows.map((row) => row.cells.recurrenceGenerated === "yes"
      ? { ...row, cells: { ...row.cells, amount: "96.42", category: "Utilities - variable", notes: "Usage adjusted", status: "paid" } }
      : row);

    const advanced = syncRecurringBillOccurrences(editedAndPaid);

    expect(advanced[1].cells).toMatchObject({ amount: "96.42", status: "paid" });
    expect(advanced[2].cells).toMatchObject({
      amount: "96.42",
      category: "Utilities - variable",
      notes: "Usage adjusted",
      status: "unpaid",
      dueDate: "2026-03-28",
    });
  });

  it("stops the series without deleting existing bill records", () => {
    const rows = configureRecurringBill([bill()], "internet", { frequency: "weekly", dueDate: "2026-07-01" });
    const stopped = disableRecurringBill(rows, "internet");
    expect(stopped).toHaveLength(2);
    expect(stopped.every((row) => row.cells.recurring === "No")).toBe(true);
    expect(syncRecurringBillOccurrences(stopped)).toHaveLength(2);
  });

  it("rejects invalid recurrence dates", () => {
    expect(() => configureRecurringBill([bill()], "internet", { frequency: "monthly", dueDate: "2026-02-30" })).toThrow("valid next due date");
  });
});
