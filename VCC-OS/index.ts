import { ModuleDefinition } from "../registry";
import { billsRouter } from "./router";
import * as calculations from "./calculations";

export const billsModule: ModuleDefinition = {
  id: "bills",
  name: "Bills",
  description: "Track recurring and one-time bills with payment status and reminders",
  enabled: true,
  router: billsRouter,
  dashboardWidget: {
    component: "BillsCard",
    queries: ["bills.summary"],
    refreshInterval: 300000, // 5 minutes
    priority: 2,
    size: "medium",
  },
  calculations: {
    calculateTotalBillsThisMonth: (data: any) => calculations.calculateTotalBillsThisMonth(data),
    calculateBillsDueInDays: (data: any) => calculations.calculateBillsDueInDays(data, 7),
    calculateOverdueBills: (data: any) => calculations.calculateOverdueBills(data),
    calculatePaidThisMonth: (data: any) => calculations.calculatePaidThisMonth(data),
    getNextDueDate: (data: any) => calculations.getNextDueDate(data),
  }
};

export * from "./schema";
export * from "./db";
export * from "./router";
