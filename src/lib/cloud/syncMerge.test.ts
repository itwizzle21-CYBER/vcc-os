import { describe, expect, it } from "vitest";
import { createZeroData } from "../storage/defaultData";
import type { AppData, SpreadsheetRow } from "../types/app";
import { mergeAppData, mergeAppDataWithReport } from "./syncMerge";

function row(id: string, description: string, amount: string, notes = ""): SpreadsheetRow {
  return { id, cells: { description, amount, notes } };
}

function withTransactions(...rows: SpreadsheetRow[]): AppData {
  const data = createZeroData();
  data.sections.transactions = rows;
  return data;
}

describe("two-way VCC data merge", () => {
  it("keeps rows added independently on desktop and phone", () => {
    const base = withTransactions(row("existing", "Existing", "10"));
    const desktop = withTransactions(row("existing", "Existing", "10"), row("desktop", "Desktop", "20"));
    const phone = withTransactions(row("existing", "Existing", "10"), row("phone", "Phone", "30"));

    const merged = mergeAppData(base, desktop, phone);

    expect(merged.sections.transactions.map((item) => item.id)).toEqual(["existing", "phone", "desktop"]);
  });

  it("combines independent edits to different cells in the same row", () => {
    const base = withTransactions(row("shared", "Lunch", "10", ""));
    const desktop = withTransactions(row("shared", "Lunch", "12", ""));
    const phone = withTransactions(row("shared", "Lunch", "10", "receipt scanned"));

    const merged = mergeAppData(base, desktop, phone);

    expect(merged.sections.transactions[0].cells).toMatchObject({ amount: "12", notes: "receipt scanned" });
  });

  it("preserves a deletion when the other device did not edit that row", () => {
    const base = withTransactions(row("deleted", "Old", "10"), row("kept", "Keep", "20"));
    const desktop = withTransactions(row("kept", "Keep", "20"));
    const phone = withTransactions(row("deleted", "Old", "10"), row("kept", "Keep", "25"));

    const merged = mergeAppData(base, desktop, phone);

    expect(merged.sections.transactions.map((item) => item.id)).toEqual(["kept"]);
    expect(merged.sections.transactions[0].cells.amount).toBe("25");
  });

  it("keeps a remotely edited row instead of losing it to a concurrent deletion", () => {
    const base = withTransactions(row("shared", "Old", "10"));
    const desktop = withTransactions();
    const phone = withTransactions(row("shared", "Updated", "10"));

    const merged = mergeAppData(base, desktop, phone);

    expect(merged.sections.transactions[0].cells.description).toBe("Updated");
  });

  it("uses the newer cloud value and reports a same-field conflict", () => {
    const base = withTransactions(row("shared", "Lunch", "10"));
    const desktop = withTransactions(row("shared", "Lunch", "12"));
    const phone = withTransactions(row("shared", "Lunch", "15"));

    const result = mergeAppDataWithReport(base, desktop, phone);

    expect(result.data.sections.transactions[0].cells.amount).toBe("15");
    expect(result.conflicts).toEqual([
      { path: "sections.transactions[id=shared].cells.amount", resolution: "remote" },
    ]);
  });

  it("reports each independently conflicting field without flagging compatible edits", () => {
    const base = withTransactions(row("shared", "Lunch", "10", ""));
    const desktop = withTransactions(row("shared", "Desktop lunch", "12", "receipt"));
    const phone = withTransactions(row("shared", "Mobile lunch", "15", ""));

    const result = mergeAppDataWithReport(base, desktop, phone);

    expect(result.data.sections.transactions[0].cells).toMatchObject({
      description: "Mobile lunch",
      amount: "15",
      notes: "receipt",
    });
    expect(result.conflicts.map(({ path }) => path)).toEqual([
      "sections.transactions[id=shared].cells.description",
      "sections.transactions[id=shared].cells.amount",
    ]);
  });
});
