import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bills, debt, savings, inventory, goals, trading, transactions, aiBriefingCache } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Bills queries
export async function getBillsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bills).where(eq(bills.userId, userId)).orderBy(desc(bills.dueDate));
}

export async function getUpcomingBills(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(bills).where(eq(bills.userId, userId));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return result.filter(b => {
    const dueDate = typeof b.dueDate === 'string' ? new Date(b.dueDate) : b.dueDate;
    return dueDate >= today && dueDate <= futureDate;
  }).sort((a, b) => {
    const aDate = typeof a.dueDate === 'string' ? new Date(a.dueDate) : a.dueDate;
    const bDate = typeof b.dueDate === 'string' ? new Date(b.dueDate) : b.dueDate;
    return aDate.getTime() - bDate.getTime();
  });
}

export async function getOverdueBills(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(bills).where(
    and(
      eq(bills.userId, userId),
      eq(bills.status, 'pending')
    )
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return result.filter(b => {
    const dueDate = typeof b.dueDate === 'string' ? new Date(b.dueDate) : b.dueDate;
    return dueDate < today;
  }).sort((a, b) => {
    const aDate = typeof a.dueDate === 'string' ? new Date(a.dueDate) : a.dueDate;
    const bDate = typeof b.dueDate === 'string' ? new Date(b.dueDate) : b.dueDate;
    return aDate.getTime() - bDate.getTime();
  });
}

// Debt queries
export async function getDebtByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(debt).where(eq(debt.userId, userId)).orderBy(desc(debt.currentBalance));
}

export async function getTotalDebt(userId: number) {
  const db = await getDb();
  if (!db) return '0';
  const result = await db.select().from(debt).where(
    and(
      eq(debt.userId, userId),
      eq(debt.status, 'active')
    )
  );
  const total = result.reduce((sum, d) => sum + parseFloat(d.currentBalance), 0);
  return total.toFixed(2);
}

// Savings queries
export async function getSavingsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savings).where(eq(savings.userId, userId)).orderBy(desc(savings.currentAmount));
}

// Inventory queries
export async function getInventoryByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventory).where(eq(inventory.userId, userId)).orderBy(asc(inventory.status));
}

export async function getCriticalInventory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventory).where(
    and(
      eq(inventory.userId, userId),
      eq(inventory.status, 'Critical')
    )
  ).orderBy(asc(inventory.minimumQuantity));
}

// Goals queries
export async function getGoalsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.currentProgress));
}

// Trading queries
export async function getTradingByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trading).where(eq(trading.userId, userId));
}

// Transactions queries
export async function getTransactionsByUser(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(transactions).where(eq(transactions.userId, userId));
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return result.filter(t => {
      const txDate = typeof t.transactionDate === 'string' ? new Date(t.transactionDate) : t.transactionDate;
      return txDate >= start && txDate <= end;
    }).sort((a, b) => {
      const aDate = typeof a.transactionDate === 'string' ? new Date(a.transactionDate) : a.transactionDate;
      const bDate = typeof b.transactionDate === 'string' ? new Date(b.transactionDate) : b.transactionDate;
      return bDate.getTime() - aDate.getTime();
    });
  }
  return result.sort((a, b) => {
    const aDate = typeof a.transactionDate === 'string' ? new Date(a.transactionDate) : a.transactionDate;
    const bDate = typeof b.transactionDate === 'string' ? new Date(b.transactionDate) : b.transactionDate;
    return bDate.getTime() - aDate.getTime();
  });
}

export async function getTotalIncome(userId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return '0';
  const result = await db.select().from(transactions).where(
    and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'income')
    )
  );
  const start = new Date(startDate);
  const end = new Date(endDate);
  const filtered = result.filter(t => {
    const txDate = typeof t.transactionDate === 'string' ? new Date(t.transactionDate) : t.transactionDate;
    return txDate >= start && txDate <= end;
  });
  const total = filtered.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  return total.toFixed(2);
}

export async function getTotalExpense(userId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return '0';
  const result = await db.select().from(transactions).where(
    and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'expense')
    )
  );
  const start = new Date(startDate);
  const end = new Date(endDate);
  const filtered = result.filter(t => {
    const txDate = typeof t.transactionDate === 'string' ? new Date(t.transactionDate) : t.transactionDate;
    return txDate >= start && txDate <= end;
  });
  const total = filtered.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  return total.toFixed(2);
}

// AI Briefing Cache queries
export async function getAIBriefing(userId: number, briefingType: 'daily' | 'weekly') {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const result = await db.select().from(aiBriefingCache).where(
    and(
      eq(aiBriefingCache.userId, userId),
      eq(aiBriefingCache.briefingType, briefingType),
      gte(aiBriefingCache.generatedAt, now)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function cacheAIBriefing(userId: number, briefingType: 'daily' | 'weekly', content: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiBriefingCache).values({
    userId,
    briefingType,
    content,
    expiresAt,
  });
}
