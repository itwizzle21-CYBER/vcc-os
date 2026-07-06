# VCC Life Command Center - System Documentation

**Version:** 1.0.0  
**Last Updated:** June 2026  
**Status:** Foundation Complete, Modular Architecture Ready

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Completed Modules](#completed-modules)
4. [Module Development Guide](#module-development-guide)
5. [Dashboard Integration](#dashboard-integration)
6. [Database Schema](#database-schema)
7. [Testing Strategy](#testing-strategy)
8. [Deployment & GitHub Export](#deployment--github-export)
9. [Future Roadmap](#future-roadmap)

---

## System Overview

VCC Life Command Center is a comprehensive personal finance and life management application built on a **modular, scalable architecture**. The system provides executives and entrepreneurs with a unified dashboard for managing money, goals, trading, and daily priorities.

### Core Principles

- **Modularity**: Each feature is completely independent and can be added/removed without affecting others
- **Scalability**: Designed for long-term expansion with predictable development patterns
- **Type Safety**: Full TypeScript throughout backend and frontend
- **Testing First**: All modules include comprehensive vitest tests
- **Dark Mode**: Premium, polished UI inspired by Notion, Linear, and executive dashboards

### Key Statistics

- **8 Planned Modules**: Bills, Debt, Savings, Inventory, Goals, Trading, Analytics, AI Command Center
- **3 Completed Modules**: Bills, Debt, Savings (fully tested and integrated)
- **CEO Dashboard**: Central hub aggregating all module data with 6 key widgets
- **32+ Tests**: Passing vitest tests across all modules
- **Zero External Dependencies**: All business logic contained within the app

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                    CEO Dashboard                         │
│  (Aggregates data from all modules)                      │
└─────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
   ┌─────────┐         ┌─────────┐        ┌──────────┐
   │  Bills  │         │  Debt   │        │ Savings  │
   │ Module  │         │ Module  │        │ Module   │
   └─────────┘         └─────────┘        └──────────┘
        ↓                   ↓                   ↓
   ┌─────────────────────────────────────────────────┐
   │         Modular Backend (tRPC Routers)          │
   │  - Bills Router    - Debt Router                │
   │  - Savings Router  - Inventory Router (ready)   │
   │  - Goals Router (ready) - Trading Router (ready)│
   └─────────────────────────────────────────────────┘
        ↓
   ┌─────────────────────────────────────────────────┐
   │      Database Layer (Drizzle ORM + MySQL)       │
   │  - users, bills, debt, savings, inventory       │
   │  - goals, trading, transactions, aiBriefingCache│
   └─────────────────────────────────────────────────┘
```

### Module Structure

Each module follows a consistent pattern:

```
server/modules/{moduleName}/
├── schema.ts          # Drizzle table definitions & types
├── db.ts              # Database query helpers
├── calculations.ts    # Business logic & calculations
├── router.ts          # tRPC procedures (public/protected)
├── index.ts           # Module registration
└── __tests__/
    └── {module}.test.ts  # Comprehensive vitest tests

client/src/modules/{moduleName}/
├── pages/
│   └── {ModuleName}Page.tsx    # Full-page view
├── components/
│   ├── {Module}Card.tsx        # Dashboard widget
│   ├── {Module}Form.tsx        # Add/edit form
│   └── {Module}List.tsx        # List/table view
├── hooks/
│   └── use{Module}.ts          # Custom hooks
├── __tests__/
│   └── {Module}.test.tsx       # Component tests
└── index.ts                    # Module registration
```

### Module Registration Flow

1. **Backend Registration** (`server/_core/moduleLoader.ts`)
   - Imports module from `server/modules/{name}/index.ts`
   - Registers router in `appRouter`
   - Automatically available at `/api/trpc/{module}.*`

2. **Frontend Registration** (`client/src/modules/loader.ts`)
   - Imports module from `client/src/modules/{name}/index.ts`
   - Registers routes in App.tsx
   - Adds navigation entry automatically
   - Dashboard widget appears on home screen

---

## Completed Modules

### 1. Bills Module ✓

**Purpose**: Track recurring and one-time bills with automatic status tracking.

**Features**:
- Add, edit, delete bills
- Recurring bill support (daily, weekly, monthly, yearly)
- Automatic status tracking (pending, paid, overdue)
- Views: Upcoming, Overdue, Next 7 Days, Paid This Month
- Dashboard integration with alerts

**Database Schema**:
```sql
CREATE TABLE bills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  dueDate DATE NOT NULL,
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  isRecurring BOOLEAN DEFAULT FALSE,
  frequency VARCHAR(50),
  lastPaidDate DATE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP
);
```

**tRPC Procedures**:
- `bills.list()` - Get all bills with filtering
- `bills.upcoming()` - Get bills due in next 7 days
- `bills.overdue()` - Get overdue bills
- `bills.create(data)` - Create new bill
- `bills.update(id, data)` - Update bill
- `bills.delete(id)` - Delete bill
- `bills.markPaid(id)` - Mark bill as paid

**Tests**: 10 passing tests covering CRUD, filtering, and calculations

---

### 2. Debt Module ✓

**Purpose**: Track debts and calculate payoff strategies.

**Features**:
- Track debt name, balance, minimum payment, interest rate
- Automatic debt-to-income ratio calculation
- Payoff strategy recommendations (avalanche/snowball)
- Progress tracking and visualization
- Dashboard integration with alerts

**Database Schema**:
```sql
CREATE TABLE debt (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  currentBalance DECIMAL(10,2) NOT NULL,
  minimumPayment DECIMAL(10,2),
  interestRate DECIMAL(5,2),
  status ENUM('active', 'paid_off', 'paused') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP
);
```

**tRPC Procedures**:
- `debt.list()` - Get all debts
- `debt.statistics()` - Get total debt, DTI ratio, payoff timeline
- `debt.create(data)` - Create new debt
- `debt.update(id, data)` - Update debt
- `debt.delete(id)` - Delete debt
- `debt.payoff(id, amount)` - Record payment

**Tests**: 10 passing tests covering calculations and payoff strategies

---

### 3. Savings Module ✓

**Purpose**: Track savings goals with three predefined categories.

**Features**:
- Three named goals: Emergency Fund, Move Out Fund, Vehicle Fund
- Support for custom goals
- Contribution tracking and history
- Estimated completion date calculation
- Goal prioritization by velocity
- Dashboard integration with progress

**Database Schema**:
```sql
CREATE TABLE savings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  currentAmount DECIMAL(10,2) NOT NULL DEFAULT '0',
  goalAmount DECIMAL(10,2) NOT NULL,
  category ENUM('Emergency Fund', 'Move Out Fund', 'Vehicle Fund', 'Custom') DEFAULT 'Custom',
  targetDate DATE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP
);
```

**tRPC Procedures**:
- `savings.list()` - Get all savings goals
- `savings.statistics()` - Get total saved, combined goal, completion percentage
- `savings.create(data)` - Create new goal
- `savings.update(id, data)` - Update goal
- `savings.delete(id)` - Delete goal
- `savings.contribute(id, amount)` - Add contribution

**Tests**: 12 passing tests covering goal calculations and prioritization

---

## Module Development Guide

### Quick Start: Building a New Module

Follow this step-by-step guide to add a new module (e.g., "Inventory").

#### Step 1: Create Backend Module Structure

```bash
mkdir -p server/modules/inventory/{__tests__}
```

#### Step 2: Define Database Schema

Create `server/modules/inventory/schema.ts`:

```typescript
import { int, mysqlTable, varchar, decimal, timestamp } from "drizzle-orm/mysql-core";
import { z } from "zod";

export const inventoryItems = mysqlTable("inventory_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

// Validation schema
export const createInventorySchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(0),
});
```

#### Step 3: Create Database Queries

Create `server/modules/inventory/db.ts`:

```typescript
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { inventoryItems } from "./schema";
import type { InsertInventoryItem, InventoryItem } from "./schema";

async function getDb() {
  // Get database connection
}

export async function getAllItems(): Promise<InventoryItem[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventoryItems);
}

export async function createItem(item: InsertInventoryItem): Promise<InventoryItem | undefined> {
  // Implementation
}

// Add more query helpers as needed
```

#### Step 4: Add Business Logic

Create `server/modules/inventory/calculations.ts`:

```typescript
import type { InventoryItem } from "./schema";

export function calculateTotalValue(items: InventoryItem[]): number {
  return items.reduce((sum, item) => sum + Number(item.quantity), 0);
}

// Add more calculations as needed
```

#### Step 5: Create tRPC Router

Create `server/modules/inventory/router.ts`:

```typescript
import { router, publicProcedure, protectedProcedure } from "../../_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { createInventorySchema } from "./schema";

export const inventoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getAllItems();
  }),

  create: protectedProcedure
    .input(createInventorySchema)
    .mutation(async ({ input, ctx }) => {
      return await db.createItem({
        ...input,
        userId: ctx.user.id,
      });
    }),

  // Add more procedures
});
```

#### Step 6: Create Module Index

Create `server/modules/inventory/index.ts`:

```typescript
import { inventoryRouter } from "./router";

export const inventoryModule = {
  name: "inventory",
  router: inventoryRouter,
  description: "Inventory management module",
};
```

#### Step 7: Register Backend Module

Update `server/_core/moduleLoader.ts`:

```typescript
import { inventoryModule } from "../modules/inventory";

const modules = [
  billsModule,
  debtModule,
  savingsModule,
  inventoryModule, // Add this
];
```

#### Step 8: Create Frontend Module

Create `client/src/modules/inventory/index.ts`:

```typescript
import { Package } from "lucide-react";
import InventoryPage from "./pages/InventoryPage";
import InventoryCard from "./components/InventoryCard";

export const inventoryModule = {
  name: "inventory",
  label: "Inventory",
  icon: Package,
  path: "/inventory",
  page: InventoryPage,
  dashboardWidget: InventoryCard,
};
```

#### Step 9: Create Frontend Pages

Create `client/src/modules/inventory/pages/InventoryPage.tsx`:

```typescript
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";

export default function InventoryPage() {
  const { data, isLoading } = trpc.inventory.list.useQuery();

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory</h1>
      {/* Render inventory items */}
    </div>
  );
}
```

#### Step 10: Create Dashboard Widget

Create `client/src/modules/inventory/components/InventoryCard.tsx`:

```typescript
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";

export default function InventoryCard() {
  const { data } = trpc.inventory.list.useQuery();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Inventory</h3>
      {/* Render summary */}
    </Card>
  );
}
```

#### Step 11: Register Frontend Module

Update `client/src/modules/loader.ts`:

```typescript
import { inventoryModule } from "./inventory";

export const modules = [
  billsModule,
  debtModule,
  savingsModule,
  inventoryModule, // Add this
];
```

#### Step 12: Write Tests

Create `server/modules/inventory/__tests__/inventory.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import * as calculations from "../calculations";

describe("Inventory Calculations", () => {
  it("should calculate total value correctly", () => {
    const items = [
      { quantity: 10 },
      { quantity: 20 },
    ];
    expect(calculations.calculateTotalValue(items as any)).toBe(30);
  });
});
```

#### Step 13: Run Tests

```bash
pnpm test
```

#### Step 14: Save Checkpoint

```bash
# In the Manus UI, call webdev_save_checkpoint with a description
```

---

## Dashboard Integration

### How Modules Appear on Dashboard

1. **Automatic Registration**: When a module is registered in `client/src/modules/loader.ts`, it automatically appears in the dashboard widget area.

2. **Widget Props**: Each module's `dashboardWidget` component receives:
   ```typescript
   interface DashboardWidgetProps {
     data?: any; // Module-specific data
     isLoading?: boolean;
     error?: Error;
   }
   ```

3. **Real-Time Updates**: Widgets use tRPC queries that automatically refetch when data changes:
   ```typescript
   const { data, isLoading } = trpc.{module}.list.useQuery();
   ```

4. **Dashboard Layout**: The CEO Dashboard automatically arranges widgets in a responsive grid:
   ```
   ┌─────────────────────────────────────────┐
   │ Daily Briefing │ Today's Mission        │
   ├─────────────────────────────────────────┤
   │ Money Snapshot │ Priority Alerts        │
   ├─────────────────────────────────────────┤
   │ Buy Next       │ Goal Progress          │
   ├─────────────────────────────────────────┤
   │ Bills Card     │ Debt Card              │
   ├─────────────────────────────────────────┤
   │ Savings Card   │ [Next Module Card]     │
   └─────────────────────────────────────────┘
   ```

### Adding Custom Dashboard Data

To add custom data to the dashboard:

1. Create a `getDashboardData()` function in your module's router:
   ```typescript
   dashboard: publicProcedure.query(async ({ ctx }) => {
     return {
       summary: await db.getSummary(),
       alerts: await db.getAlerts(),
       stats: await db.getStats(),
     };
   }),
   ```

2. Update the dashboard page to fetch this data:
   ```typescript
   const { data: billsData } = trpc.bills.dashboard.useQuery();
   const { data: debtData } = trpc.debt.dashboard.useQuery();
   ```

---

## Database Schema

### Complete Schema Overview

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User accounts & auth | id, openId, email, role, createdAt |
| `bills` | Bill tracking | id, userId, name, amount, dueDate, status, isRecurring |
| `debt` | Debt tracking | id, userId, name, currentBalance, minimumPayment, interestRate |
| `savings` | Savings goals | id, userId, name, currentAmount, goalAmount, category, targetDate |
| `inventory` | Inventory items | id, userId, name, currentQuantity, minimumQuantity, category, status |
| `goals` | Life goals | id, userId, name, category, currentProgress, targetValue, targetDate, milestones |
| `trading` | Trading accounts | id, userId, accountName, dailyPnL, weeklyPnL, monthlyPnL, winRate, isLockedOut |
| `transactions` | Cash flow | id, userId, type, amount, category, description, transactionDate |
| `aiBriefingCache` | AI briefings | id, userId, briefingType, content, generatedAt, expiresAt |

### Adding New Tables

1. Update `drizzle/schema.ts`:
   ```typescript
   export const myTable = mysqlTable("my_table", {
     id: int("id").autoincrement().primaryKey(),
     // ... columns
   });
   ```

2. Generate migration:
   ```bash
   pnpm drizzle-kit generate
   ```

3. Review and apply migration:
   ```bash
   # Use webdev_execute_sql to apply the migration
   ```

---

## Testing Strategy

### Test Pyramid

```
        ▲
       / \
      /   \  E2E Tests (UI flows)
     /─────\
    /       \  Integration Tests (API + DB)
   /─────────\
  /           \ Unit Tests (Functions, Calculations)
 /─────────────\
```

### Writing Tests

**Unit Tests** (Calculations):
```typescript
import { describe, it, expect } from "vitest";
import { calculatePayoffDate } from "../calculations";

describe("Debt Calculations", () => {
  it("should calculate payoff date correctly", () => {
    const result = calculatePayoffDate(10000, 500, 0.05);
    expect(result).toBeGreaterThan(0);
  });
});
```

**Integration Tests** (Database + Router):
```typescript
import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";

describe("Bills Router", () => {
  it("should create and retrieve a bill", async () => {
    const caller = appRouter.createCaller(mockContext);
    const bill = await caller.bills.create({
      name: "Electric",
      amount: 100,
      dueDate: new Date(),
    });
    expect(bill.name).toBe("Electric");
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test bills.test.ts

# Run with coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

---

## Deployment & GitHub Export

### Prerequisites

- GitHub account
- Git installed locally
- SSH key configured for GitHub

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create repository: `vcc-command-center`
3. Choose "Private" (recommended)
4. Do NOT initialize with README (we have one)

### Step 2: Export from Manus

1. Open VCC project in Manus
2. Click **Management UI** (top right)
3. Go to **Code** panel
4. Click **More** (⋯) → **GitHub**
5. Select GitHub owner and repository name
6. Click **Export**

### Step 3: Verify Export

```bash
git clone git@github.com:{username}/vcc-command-center.git
cd vcc-command-center
git log --oneline | head -5
```

### Step 4: Local Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

### Step 5: Deploy to Production

**Option A: Manus Hosting** (Recommended)
1. In Manus Management UI, click **Publish**
2. Choose domain or custom domain
3. Click **Deploy**

**Option B: External Hosting** (Railway, Render, etc.)
```bash
# Build for production
pnpm build

# Deploy dist/ folder
# Follow hosting provider's instructions
```

---

## Future Roadmap

### Phase 2: Remaining Modules (Ready to Build)

| Module | Status | Est. Effort | Priority |
|--------|--------|------------|----------|
| **Inventory** | Schema ready, DB queries ready | 4-6 hours | High |
| **Goals** | Schema ready | 4-6 hours | High |
| **Trading** | Schema ready | 6-8 hours | High |
| **Analytics** | Planned | 4-6 hours | Medium |
| **AI Command Center** | Planned | 6-8 hours | Medium |

### Phase 3: Advanced Features

- Real-time notifications
- Mobile app (React Native)
- API integrations (Stripe, Plaid, etc.)
- Advanced reporting & exports
- Multi-user collaboration
- Custom alerts & automations

### Phase 4: Enterprise Features

- Role-based access control (RBAC)
- Audit logging
- Data encryption
- Compliance certifications
- White-label deployment

---

## Support & Troubleshooting

### Common Issues

**Q: TypeScript errors after adding new module**
A: Run `pnpm check` and ensure all imports are correct. Check that module is registered in both `server/_core/moduleLoader.ts` and `client/src/modules/loader.ts`.

**Q: Dashboard widget not appearing**
A: Verify module is exported from `client/src/modules/{name}/index.ts` with `dashboardWidget` property. Check browser console for errors.

**Q: Database migration fails**
A: Run `pnpm drizzle-kit generate` to create migration, then review SQL before applying with `webdev_execute_sql`.

**Q: Tests failing**
A: Run `pnpm test --watch` to debug. Check mock data and ensure database connection is available.

### Getting Help

- Check `MODULE_CREATION_GUIDE.md` for module development
- Review existing modules (Bills, Debt, Savings) as examples
- Check test files for usage examples
- Review tRPC documentation: https://trpc.io

---

## Contributing Guidelines

### Code Style

- Use TypeScript for all code
- Follow ESLint configuration
- Format with Prettier: `pnpm format`
- Use camelCase for variables/functions, PascalCase for components/classes

### Commit Messages

```
feat: Add Inventory module
fix: Correct debt calculation
docs: Update module creation guide
test: Add Inventory tests
```

### Pull Request Process

1. Create feature branch: `git checkout -b feat/inventory-module`
2. Make changes and commit
3. Run tests: `pnpm test`
4. Push and create PR
5. Wait for review and merge

---

**Last Updated:** June 2026  
**Maintained By:** Manus AI  
**License:** MIT
