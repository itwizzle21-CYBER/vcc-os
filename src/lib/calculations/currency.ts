export function toNumber(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = String(value).replace(/[$,\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function isBlankRow(cells: Record<string, string>): boolean {
  return Object.values(cells).every((value) => !String(value || "").trim());
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function weekBounds(dateText: string): { start: string; end: string } {
  const date = dateText ? new Date(`${dateText}T12:00:00`) : new Date();
  if (Number.isNaN(date.getTime())) return { start: "", end: "" };
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}
