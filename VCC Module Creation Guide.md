# VCC Module Creation Guide

This guide explains how to create new modules for VCC Life Command Center. Each module is completely independent and can be developed, tested, and deployed without affecting other parts of the application.

## Module Anatomy

A complete VCC module consists of:

1. **Backend Module** (`server/modules/{moduleName}/`)
   - `schema.ts` - Type definitions and interfaces
   - `db.ts` - Database queries
   - `router.ts` - tRPC procedures
   - `calculations.ts` - Business logic
   - `index.ts` - Module definition and exports
   - `__tests__/` - Unit tests

2. **Frontend Module** (`client/src/modules/{moduleName}/`)
   - `pages/` - Page components
   - `components/` - Reusable components
   - `hooks/` - Custom React hooks
   - `types.ts` - TypeScript types
   - `index.ts` - Module definition and exports

3. **Module Registration**
   - Register in `server/_core/moduleLoader.ts`
   - Register in `client/src/modules/loader.ts`

---

## Step-by-Step: Creating a New Module

### Step 1: Create Directory Structure

```bash
mkdir -p server/modules/mymodule/{__tests__}
mkdir -p client/src/modules/mymodule/{pages,components,hooks}
```

### Step 2: Define Backend Schema (server/modules/mymodule/schema.ts)

```typescript
import { myTable, InsertMyTable, MyTable } from "../../../drizzle/schema";

export { myTable };
export type { InsertMyTable, MyTable };

export interface MyModuleInput {
  name: string;
  value: string;
  // ... other fields
}

export interface MyModuleSummary {
  totalCount: number;
  activeCount: number;
  // ... other summary fields
}
```

### Step 3: Create Database Queries (server/modules/mymodule/db.ts)

```typescript
import { getDb } from "../../db";
import { myTable } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { MyTable, InsertMyTable, MyModuleSummary } from "./schema";

export async function getByUser(userId: number): Promise<MyTable[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(myTable).where(eq(myTable.userId, userId));
}

export async function getById(userId: number, id: number): Promise<MyTable | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(myTable)
    .where(and(eq(myTable.userId, userId), eq(myTable.id, id)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function create(userId: number, data: Omit<InsertMyTable, "userId">): Promise<MyTable> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const newItem: InsertMyTable = { ...data, userId };
  const result = await db.insert(myTable).values(newItem);
  const id = result[0].insertId;
  const created = await getById(userId, id);
  if (!created) throw new Error("Failed to create item");
  return created;
}

export async function update(
  userId: number,
  id: number,
  data: Partial<Omit<InsertMyTable, "userId" | "id">>
): Promise<MyTable> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(myTable)
    .set(data)
    .where(and(eq(myTable.userId, userId), eq(myTable.id, id)));
  
  const updated = await getById(userId, id);
  if (!updated) throw new Error("Failed to update item");
  return updated;
}

export async function delete_(userId: number, id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(myTable)
    .where(and(eq(myTable.userId, userId), eq(myTable.id, id)));
  
  return true;
}

export async function getSummary(userId: number): Promise<MyModuleSummary> {
  const items = await getByUser(userId);
  // Calculate summary metrics
  return {
    totalCount: items.length,
    activeCount: items.filter(i => i.status === 'active').length,
  };
}
```

### Step 4: Create Business Logic (server/modules/mymodule/calculations.ts)

```typescript
import type { MyTable } from "./schema";

export function calculateMetric(items: MyTable[]): string {
  const total = items.reduce((sum, item) => sum + parseFloat(item.value), 0);
  return total.toFixed(2);
}

export function filterByStatus(items: MyTable[], status: string): MyTable[] {
  return items.filter(item => item.status === status);
}

// Add more calculation functions as needed
```

### Step 5: Create tRPC Router (server/modules/mymodule/router.ts)

```typescript
import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import * as db from "./db";
import * as calculations from "./calculations";

const inputSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
  // ... other fields
});

export const mymoduleRouter = router({
  // Standard CRUD operations
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getByUser(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getById(ctx.user.id, input.id);
    }),

  create: protectedProcedure
    .input(inputSchema)
    .mutation(async ({ ctx, input }) => {
      return db.create(ctx.user.id, input as any);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), ...inputSchema.shape }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.update(ctx.user.id, id, data as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await db.delete_(ctx.user.id, input.id);
      return { success };
    }),

  // Module-specific query
  summary: protectedProcedure.query(async ({ ctx }) => {
    return db.getSummary(ctx.user.id);
  }),

  // Add more procedures as needed
});
```

### Step 6: Create Module Definition (server/modules/mymodule/index.ts)

```typescript
import { ModuleDefinition } from "../registry";
import { mymoduleRouter } from "./router";
import * as calculations from "./calculations";

export const mymoduleModule: ModuleDefinition = {
  id: "mymodule",
  name: "My Module",
  description: "Description of what this module does",
  enabled: true,
  router: mymoduleRouter,
  dashboardWidget: {
    component: "MyModuleCard",
    queries: ["mymodule.summary"],
    refreshInterval: 300000, // 5 minutes
    priority: 3,
    size: "medium",
  },
  calculations: {
    calculateMetric: (data: any) => calculations.calculateMetric(data),
    filterByStatus: (data: any) => calculations.filterByStatus(data, "active"),
  },
};

export * from "./schema";
export * from "./db";
export * from "./router";
```

### Step 7: Create Unit Tests (server/modules/mymodule/__tests__/mymodule.test.ts)

```typescript
import { describe, it, expect } from "vitest";
import * as calculations from "../calculations";
import type { MyTable } from "../schema";

describe("My Module - Calculations", () => {
  const mockItems: MyTable[] = [
    {
      id: 1,
      userId: 1,
      name: "Item 1",
      value: "100.00",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // ... more mock items
  ];

  describe("calculateMetric", () => {
    it("should calculate total correctly", () => {
      const result = calculations.calculateMetric(mockItems);
      expect(result).toBe("100.00");
    });
  });

  describe("filterByStatus", () => {
    it("should filter items by status", () => {
      const filtered = calculations.filterByStatus(mockItems, "active");
      expect(filtered).toHaveLength(1);
    });
  });
});
```

Run tests with:
```bash
pnpm test -- server/modules/mymodule/__tests__/mymodule.test.ts
```

### Step 8: Create Frontend Pages (client/src/modules/mymodule/pages/MyModulePage.tsx)

```typescript
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function MyModulePage() {
  const { data: items, isLoading } = trpc.mymodule.list.useQuery();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Module</h1>
        <Button onClick={() => setIsOpen(true)}>Add Item</Button>
      </div>

      <div className="grid gap-4">
        {items?.map((item) => (
          <div key={item.id} className="p-4 border rounded-lg">
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 9: Create Frontend Components (client/src/modules/mymodule/components/MyModuleCard.tsx)

```typescript
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";

export default function MyModuleCard() {
  const { data: summary } = trpc.mymodule.summary.useQuery();

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">My Module</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-bold">{summary?.totalCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Active:</span>
          <span className="font-bold">{summary?.activeCount}</span>
        </div>
      </div>
    </Card>
  );
}
```

### Step 10: Create Frontend Module Definition (client/src/modules/mymodule/index.ts)

```typescript
import { FrontendModuleDefinition } from "../registry";
import MyModulePage from "./pages/MyModulePage";
import MyModuleCard from "./components/MyModuleCard";
import { Zap } from "lucide-react";

export const mymoduleModule: FrontendModuleDefinition = {
  id: "mymodule",
  name: "My Module",
  description: "Description of what this module does",
  enabled: true,
  pages: [
    {
      path: "/mymodule",
      component: MyModulePage,
      label: "My Module",
    },
  ],
  dashboardWidget: MyModuleCard,
  icon: Zap,
  priority: 3,
};
```

### Step 11: Register Backend Module (server/_core/moduleLoader.ts)

```typescript
import { mymoduleModule } from "../modules/mymodule";

export function loadModules() {
  moduleRegistry.register(billsModule);
  moduleRegistry.register(debtModule);
  // ... other modules
  moduleRegistry.register(mymoduleModule); // Add this line
  
  console.log(`[Module Loader] Loaded ${moduleRegistry.getModuleCount()} modules`);
}
```

### Step 12: Register Frontend Module (client/src/modules/loader.ts)

```typescript
import { mymoduleModule } from "./mymodule";

export function loadFrontendModules() {
  frontendModuleRegistry.register(billsModule);
  frontendModuleRegistry.register(debtModule);
  // ... other modules
  frontendModuleRegistry.register(mymoduleModule); // Add this line
  
  console.log(`[Frontend Module Loader] Loaded ${frontendModuleRegistry.getModuleCount()} modules`);
}
```

---

## Module Checklist

- [ ] Create directory structure
- [ ] Define schema and types
- [ ] Implement database queries
- [ ] Implement calculations
- [ ] Create tRPC router
- [ ] Create module definition
- [ ] Write unit tests (all tests passing)
- [ ] Create frontend pages
- [ ] Create frontend components
- [ ] Create frontend module definition
- [ ] Register backend module
- [ ] Register frontend module
- [ ] Test module in dashboard
- [ ] Test module routes
- [ ] Document module features

---

## Best Practices

### Database Queries
- Always scope queries to `userId` for security
- Use consistent naming: `getByUser`, `getById`, `create`, `update`, `delete_`, `getSummary`
- Return early if database is unavailable
- Handle errors gracefully

### Calculations
- Keep calculations pure (no side effects)
- Use consistent naming conventions
- Document complex logic with comments
- Write unit tests for all calculations

### tRPC Procedures
- Use `protectedProcedure` for all user-specific data
- Validate input with Zod schemas
- Include `summary` procedure for dashboard
- Follow standard CRUD naming: `list`, `get`, `create`, `update`, `delete`

### Frontend Components
- Use shadcn/ui components for consistency
- Implement loading states
- Handle errors gracefully
- Use React hooks for data fetching

### Testing
- Write tests for all calculations
- Test edge cases
- Use descriptive test names
- Aim for 80%+ code coverage

---

## Module Lifecycle

1. **Development** - Build and test module independently
2. **Registration** - Register in module loaders
3. **Integration** - Module automatically appears in dashboard and navigation
4. **Deployment** - Deploy with confidence knowing other modules are unaffected
5. **Maintenance** - Update module without touching other code
6. **Deprecation** - Disable module via configuration if needed

---

## Disabling a Module

To temporarily disable a module without removing it:

```typescript
// In server/modules/mymodule/index.ts
export const mymoduleModule: ModuleDefinition = {
  // ...
  enabled: false, // Set to false to disable
  // ...
};
```

The module will be:
- Hidden from navigation
- Excluded from dashboard
- Not available in tRPC router
- Still present in codebase for future re-enablement

---

## Common Patterns

### Pagination
```typescript
list: protectedProcedure
  .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
  .query(async ({ ctx, input }) => {
    return db.getByUserPaginated(ctx.user.id, input.page, input.limit);
  }),
```

### Filtering
```typescript
filtered: protectedProcedure
  .input(z.object({ status: z.string() }))
  .query(async ({ ctx, input }) => {
    const items = await db.getByUser(ctx.user.id);
    return items.filter(item => item.status === input.status);
  }),
```

### Aggregation
```typescript
stats: protectedProcedure.query(async ({ ctx }) => {
  const items = await db.getByUser(ctx.user.id);
  return {
    total: items.length,
    byStatus: groupBy(items, 'status'),
  };
}),
```

---

## Troubleshooting

**Module not appearing in navigation:**
- Check `enabled: true` in module definition
- Verify module is registered in loaders
- Check browser console for errors

**Dashboard widget not showing:**
- Verify `dashboardWidget` is defined in module definition
- Check component name matches
- Verify `summary` procedure exists

**Tests failing:**
- Check mock data matches schema
- Verify calculations handle edge cases
- Run tests in isolation: `pnpm test -- path/to/test.ts`

---

## Support

For questions or issues creating modules, refer to existing modules like `bills` for examples.
