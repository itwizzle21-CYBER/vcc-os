import { isValidIsoDate } from "../calculations/currency";
import type { SpreadsheetRow } from "../types/app";

export type RecurringBillFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export interface RecurringBillDetails {
  frequency: RecurringBillFrequency;
  dueDate: string;
}

export function configureRecurringBill(rows: SpreadsheetRow[], rowId: string, details: RecurringBillDetails): SpreadsheetRow[] {
  const target = rows.find((row) => row.id === rowId);
  if (!target) throw new Error("Choose a bill before setting its recurring schedule.");
  if (!isValidIsoDate(details.dueDate)) throw new Error("Choose a valid next due date.");
  if (!isRecurringFrequency(details.frequency)) throw new Error("Choose how often this bill repeats.");

  const seriesId = target.cells.recurrenceSeriesId || target.id;
  const withoutUnpaidGenerated = rows.filter((row) => {
    if (row.id === target.id) return true;
    return !(row.cells.recurrenceSeriesId === seriesId && row.cells.recurrenceGenerated === "yes" && !isPaid(row));
  });
  const configured = withoutUnpaidGenerated.map((row) => row.id === target.id
    ? {
      ...row,
      cells: {
        ...row.cells,
        dueDate: details.dueDate,
        recurring: "Yes",
        recurrenceFrequency: details.frequency,
        recurrenceSeriesId: seriesId,
        recurrenceGenerated: "",
      },
    }
    : row);

  return syncRecurringBillOccurrences(configured);
}

export function disableRecurringBill(rows: SpreadsheetRow[], rowId: string): SpreadsheetRow[] {
  const target = rows.find((row) => row.id === rowId);
  if (!target) return rows;
  const seriesId = target.cells.recurrenceSeriesId || target.id;
  return rows.map((row) => row.id === target.id || row.cells.recurrenceSeriesId === seriesId
    ? {
      ...row,
      cells: {
        ...row.cells,
        recurring: "No",
        recurrenceFrequency: "",
      },
    }
    : row);
}

export function syncRecurringBillOccurrences(rows: SpreadsheetRow[]): SpreadsheetRow[] {
  const nextRows = [...rows];
  const roots = rows.filter((row) => isRecurring(row) && row.cells.recurrenceGenerated !== "yes" && isRecurringFrequency(row.cells.recurrenceFrequency));

  for (const root of roots) {
    const seriesId = root.cells.recurrenceSeriesId || root.id;
    const seriesRows = nextRows.filter((row) => row.id === root.id || row.cells.recurrenceSeriesId === seriesId);
    if (seriesRows.some((row) => row.cells.recurrenceGenerated === "yes" && !isPaid(row))) continue;

    const latest = [...seriesRows]
      .filter((row) => isValidIsoDate(row.cells.dueDate))
      .sort((left, right) => right.cells.dueDate.localeCompare(left.cells.dueDate))[0];
    const baseDate = latest?.cells.dueDate || root.cells.dueDate;
    if (!isValidIsoDate(baseDate)) continue;
    const dueDate = nextRecurringDate(baseDate, root.cells.recurrenceFrequency as RecurringBillFrequency);
    const id = recurringOccurrenceId(seriesId, dueDate);
    if (nextRows.some((row) => row.id === id)) continue;

    nextRows.push({
      id,
      cells: {
        ...(latest?.cells || root.cells),
        dueDate,
        status: "unpaid",
        recurring: "Yes",
        recurrenceFrequency: root.cells.recurrenceFrequency,
        recurrenceSeriesId: seriesId,
        recurrenceGenerated: "yes",
        notes: latest?.cells.notes || root.cells.notes || `Recurring ${frequencyLabel(root.cells.recurrenceFrequency)} bill.`,
      },
    });
  }

  return nextRows;
}

export function recurringSeriesRoots(rows: SpreadsheetRow[]): SpreadsheetRow[] {
  return rows.filter((row) => isRecurring(row) && row.cells.recurrenceGenerated !== "yes" && isRecurringFrequency(row.cells.recurrenceFrequency));
}

export function frequencyLabel(value: string | undefined): string {
  return ({ weekly: "Weekly", biweekly: "Every 2 weeks", monthly: "Monthly", quarterly: "Every 3 months", yearly: "Yearly" } as Record<string, string>)[String(value || "")] || "Monthly";
}

function nextRecurringDate(value: string, frequency: RecurringBillFrequency): string {
  const [year, month, day] = value.split("-").map(Number);
  if (frequency === "weekly" || frequency === "biweekly") {
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + (frequency === "weekly" ? 7 : 14));
    return date.toISOString().slice(0, 10);
  }
  const months = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return [targetYear, String(targetMonth + 1).padStart(2, "0"), String(Math.min(day, lastDay)).padStart(2, "0")].join("-");
}

function recurringOccurrenceId(seriesId: string, dueDate: string): string {
  return `bill-recurring-${seriesId.replace(/[^a-z0-9-]/gi, "-")}-${dueDate}`;
}

function isRecurring(row: SpreadsheetRow): boolean {
  return ["yes", "y", "true", "on", "1"].includes(String(row.cells.recurring || "").trim().toLowerCase());
}

function isPaid(row: SpreadsheetRow): boolean {
  return ["paid", "complete", "completed", "done"].includes(String(row.cells.status || "").trim().toLowerCase());
}

function isRecurringFrequency(value: string | undefined): value is RecurringBillFrequency {
  return ["weekly", "biweekly", "monthly", "quarterly", "yearly"].includes(String(value || ""));
}
