import type { Bill } from "./schema";

export function calculateTotalBillsThisMonth(bills: Bill[]): string {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthBills = bills.filter((b) => {
    const dueDate = typeof b.dueDate === "string" ? new Date(b.dueDate) : b.dueDate;
    return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
  });

  const total = thisMonthBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  return total.toFixed(2);
}

export function calculateBillsDueInDays(bills: Bill[], days: number): Bill[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return bills.filter((b) => {
    const dueDate = typeof b.dueDate === "string" ? new Date(b.dueDate) : b.dueDate;
    return dueDate >= now && dueDate <= futureDate && b.status === "pending";
  });
}

export function calculateOverdueBills(bills: Bill[]): Bill[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return bills.filter((b) => {
    const dueDate = typeof b.dueDate === "string" ? new Date(b.dueDate) : b.dueDate;
    return dueDate < now && b.status === "pending";
  });
}

export function calculatePaidThisMonth(bills: Bill[]): string {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const paidBills = bills.filter((b) => {
    if (b.status !== "paid" || !b.lastPaidDate) return false;
    const paidDate = typeof b.lastPaidDate === "string" ? new Date(b.lastPaidDate) : b.lastPaidDate;
    return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
  });

  const total = paidBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  return total.toFixed(2);
}

export function getNextDueDate(bills: Bill[]): Date | null {
  const pendingBills = bills.filter((b) => b.status === "pending");
  if (pendingBills.length === 0) return null;

  const sorted = pendingBills.sort((a, b) => {
    const aDate = typeof a.dueDate === "string" ? new Date(a.dueDate) : a.dueDate;
    const bDate = typeof b.dueDate === "string" ? new Date(b.dueDate) : b.dueDate;
    return aDate.getTime() - bDate.getTime();
  });

  const nextDate = typeof sorted[0].dueDate === "string" ? new Date(sorted[0].dueDate) : sorted[0].dueDate;
  return nextDate;
}
