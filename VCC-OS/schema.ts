import { bills as billsTable, InsertBill, Bill } from "../../../drizzle/schema";

export { billsTable as bills };
export type { InsertBill, Bill };

export type BillStatus = "pending" | "paid" | "overdue";

export interface BillInput {
  name: string;
  amount: string;
  dueDate: string;
  status: BillStatus;
  isRecurring: boolean;
  frequency?: string;
  lastPaidDate?: string;
}

export interface BillSummary {
  totalBills: number;
  upcomingBills: number;
  overdueBills: number;
  totalAmountDue: string;
  nextDueDate?: string;
}
