import { toNumber } from "../calculations/currency";
import type { SpreadsheetRow } from "../types/app";
import { normalizeInventoryRow } from "./inventoryEngine";

const INVENTORY_MERGE_NOTE = "Duplicate inventory records were merged conservatively; original values are preserved in merge evidence.";

export function canonicalizeAccountRows(rows: SpreadsheetRow[]): SpreadsheetRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const label = normalizeKey(row.cells.label);
    if (!label) return true;
    const exactKey = JSON.stringify({
      label,
      amount: cents(row.cells.amount),
      section: normalizeKey(row.cells.section),
      weekStart: row.cells.weekStart || "",
      weekEnd: row.cells.weekEnd || "",
      notes: normalizeText(row.cells.notes),
    });
    if (seen.has(exactKey)) return false;
    seen.add(exactKey);
    return true;
  });
}

export function canonicalizeInventoryRows(rows: SpreadsheetRow[]): SpreadsheetRow[] {
  const normalized = rows.map(normalizeInventoryRow);
  const groups = new Map<string, SpreadsheetRow[]>();
  const order: string[] = [];

  normalized.forEach((row) => {
    const key = normalizeKey(row.cells.item) || `__blank__:${row.id}`;
    if (!groups.has(key)) order.push(key);
    groups.set(key, [...(groups.get(key) || []), row]);
  });

  return order.map((key) => mergeInventoryGroup(groups.get(key) || []));
}

function mergeInventoryGroup(rows: SpreadsheetRow[]): SpreadsheetRow {
  const first = rows[0];
  if (rows.length <= 1) return first;

  const evidence = rows.flatMap((row) => readEvidence(row) || [{ id: row.id, cells: row.cells }]);
  const notes = [...new Set(rows
    .flatMap((row) => String(row.cells.notes || "").split(" | "))
    .map((note) => note.trim())
    .filter((note) => note && note !== INVENTORY_MERGE_NOTE))];
  notes.push(INVENTORY_MERGE_NOTE);
  const quantities = rows.map((row) => Math.max(0, toNumber(row.cells.qty)));
  const minimums = rows.map((row) => Math.max(0, toNumber(row.cells.minNeeded)));
  const costs = rows.map((row) => Math.max(0, toNumber(row.cells.cost)));

  return normalizeInventoryRow({
    ...first,
    cells: {
      ...first.cells,
      qty: String(Math.min(...quantities)),
      minNeeded: String(Math.max(...minimums)),
      cost: Math.max(...costs).toFixed(2),
      notes: notes.join(" | "),
      duplicateMergeEvidence: JSON.stringify(evidence),
    },
  });
}

function readEvidence(row: SpreadsheetRow): Array<{ id: string; cells: Record<string, string> }> | null {
  if (!row.cells.duplicateMergeEvidence) return null;
  try {
    const parsed = JSON.parse(row.cells.duplicateMergeEvidence);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeKey(value: string | undefined): string {
  return String(value || "").trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeText(value: string | undefined): string {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function cents(value: string | undefined): number {
  return Math.round(toNumber(value) * 100);
}
