import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getBillsByUser, getUpcomingBills, getOverdueBills } from "../db";
import { bills, InsertBill } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";

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
    return getBillsByUser(ctx.user.id);
  }),

  upcoming: protectedProcedure
    .input(z.object({ days: z.number().default(7) }))
    .query(async ({ ctx, input }) => {
      return getUpcomingBills(ctx.user.id, input.days);
    }),

  overdue: protectedProcedure.query(async ({ ctx }) => {
    return getOverdueBills(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db
        .select()
        .from(bills)
        .where(and(eq(bills.id, input.id), eq(bills.userId, ctx.user.id)))
        .limit(1);
      return result.length > 0 ? result[0] : null;
    }),

  create: protectedProcedure
    .input(billInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const newBill: InsertBill = {
        userId: ctx.user.id,
        name: input.name,
        amount: input.amount,
        dueDate: new Date(input.dueDate),
        status: input.status,
        isRecurring: input.isRecurring,
        frequency: input.frequency,
        lastPaidDate: input.lastPaidDate ? new Date(input.lastPaidDate) : undefined,
      };

      const result = await db.insert(bills).values(newBill);
      return { id: result[0].insertId, ...newBill };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        ...billInputSchema.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;
      const updatePayload = {
        ...updateData,
        dueDate: new Date(updateData.dueDate),
        lastPaidDate: updateData.lastPaidDate ? new Date(updateData.lastPaidDate) : undefined,
      };
      
      await db
        .update(bills)
        .set(updatePayload)
        .where(and(eq(bills.id, id), eq(bills.userId, ctx.user.id)));

      return { id, ...updatePayload };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(bills)
        .where(and(eq(bills.id, input.id), eq(bills.userId, ctx.user.id)));

      return { success: true };
    }),
});
