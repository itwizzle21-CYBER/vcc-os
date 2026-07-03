import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import * as db from "./db";
import * as calculations from "./calculations";
import type { BillInput } from "./schema";

const billInputSchema = z.object({
  name: z.string().min(1, "Bill name is required"),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)), "Amount must be a number"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  status: z.enum(["pending", "paid", "overdue"]),
  isRecurring: z.boolean(),
  frequency: z.string().optional(),
  lastPaidDate: z.string().optional(),
});

export const billsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getBillsByUser(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getBillById(ctx.user.id, input.id);
    }),

  create: protectedProcedure
    .input(billInputSchema)
    .mutation(async ({ ctx, input }) => {
      const billData = {
        name: input.name,
        amount: input.amount,
        dueDate: new Date(input.dueDate),
        status: input.status,
        isRecurring: input.isRecurring,
        frequency: input.frequency,
        lastPaidDate: input.lastPaidDate ? new Date(input.lastPaidDate) : undefined,
      };
      return db.createBill(ctx.user.id, billData as any);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        ...billInputSchema.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const billData = {
        name: updateData.name,
        amount: updateData.amount,
        dueDate: new Date(updateData.dueDate),
        status: updateData.status,
        isRecurring: updateData.isRecurring,
        frequency: updateData.frequency,
        lastPaidDate: updateData.lastPaidDate ? new Date(updateData.lastPaidDate) : undefined,
      };
      return db.updateBill(ctx.user.id, id, billData as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await db.deleteBill(ctx.user.id, input.id);
      return { success };
    }),

  summary: protectedProcedure.query(async ({ ctx }) => {
    return db.getBillSummary(ctx.user.id);
  }),

  upcoming: protectedProcedure
    .input(z.object({ days: z.number().default(7) }))
    .query(async ({ ctx, input }) => {
      const allBills = await db.getBillsByUser(ctx.user.id);
      return calculations.calculateBillsDueInDays(allBills, input.days);
    }),

  overdue: protectedProcedure.query(async ({ ctx }) => {
    const allBills = await db.getBillsByUser(ctx.user.id);
    return calculations.calculateOverdueBills(allBills);
  }),

  thisMonth: protectedProcedure.query(async ({ ctx }) => {
    const allBills = await db.getBillsByUser(ctx.user.id);
    return calculations.calculateTotalBillsThisMonth(allBills);
  }),

  paidThisMonth: protectedProcedure.query(async ({ ctx }) => {
    const allBills = await db.getBillsByUser(ctx.user.id);
    return calculations.calculatePaidThisMonth(allBills);
  }),
});
