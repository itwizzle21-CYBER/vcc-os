# VCC Life Command Center - Modular Architecture

## System Overview

VCC is built as a **modular, plugin-based system** where each feature (Bills, Debt, Savings, Inventory, Goals, Trading, Analytics) is a self-contained module that can be independently developed, tested, deployed, and extended without affecting other modules.

### Core Principles

1. **Module Independence:** Each module has its own schema, router, components, and utilities
2. **Plugin Registry:** Central registry discovers and loads modules dynamically
3. **Shared Infrastructure:** Core services (auth, database, AI, storage) are shared across modules
4. **Extensibility:** New modules can be added by following a standard template
5. **Zero Coupling:** Modules communicate only through well-defined APIs (tRPC procedures)
6. **Dashboard Integration:** CEO Dashboard aggregates data from all enabled modules

---

## Module Structure

Each module follows this standardized structure:

```
server/modules/
├── bills/
│   ├── schema.ts          # Drizzle schema (bills table)
│   ├── db.ts              # Database queries
│   ├── router.ts          # tRPC procedures
│   ├── types.ts           # TypeScript types
│   ├── calculations.ts    # Business logic
│   ├── index.ts           # Module export
│   └── __tests__/
│       └── bills.test.ts   # Unit tests
├── debt/
│   ├── schema.ts
│   ├── db.ts
│   ├── router.ts
│   ├── types.ts
│   ├── calculations.ts
│   ├── index.ts
│   └── __tests__/
├── savings/
├── inventory/
├── goals/
├── trading/
└── analytics/

client/src/modules/
├── bills/
│   ├── pages/
│   │   ├── BillsPage.tsx
│   │   └── BillDetailsPage.tsx
│   ├── components/
│   │   ├── BillForm.tsx
│   │   ├── BillsList.tsx
│   │   └── BillsCard.tsx
│   ├── hooks/
│   │   └── useBills.ts
│   ├── types.ts
│   └── index.ts
├── debt/
├── savings/
├── inventory/
├── goals/
├── trading/
└── analytics/
```

---

## Module Registry System

### Backend Module Registry

```typescript
// server/modules/registry.ts
interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schema: Record<string, any>;
  router: Router;
  dashboardWidget?: {
    component: string;
    queries: string[];
    refreshInterval?: number;
  };
  calculations?: {
    [key: string]: Function;
  };
}

class ModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map();
  
  register(module: ModuleDefinition): void {
    this.modules.set(module.id, module);
  }
  
  getModule(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }
  
  getEnabledModules(): ModuleDefinition[] {
    return Array.from(this.modules.values()).filter(m => m.enabled);
  }
  
  getModuleRouter(id: string): Router | undefined {
    return this.getModule(id)?.router;
  }
  
  getDashboardWidgets(): ModuleDefinition[] {
    return this.getEnabledModules().filter(m => m.dashboardWidget);
  }
}

export const moduleRegistry = new ModuleRegistry();
```

### Frontend Module Registry

```typescript
// client/src/modules/registry.ts
interface FrontendModuleDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  pages: Array<{
    path: string;
    component: React.ComponentType;
    label: string;
  }>;
  dashboardWidget?: React.ComponentType;
  icon?: React.ComponentType;
}

class FrontendModuleRegistry {
  private modules: Map<string, FrontendModuleDefinition> = new Map();
  
  register(module: FrontendModuleDefinition): void {
    this.modules.set(module.id, module);
  }
  
  getRoutes(): Array<{ path: string; component: React.ComponentType }> {
    const routes: Array<{ path: string; component: React.ComponentType }> = [];
    for (const module of this.modules.values()) {
      if (module.enabled) {
        routes.push(...module.pages);
      }
    }
    return routes;
  }
  
  getNavigation(): Array<{ label: string; path: string; icon?: React.ComponentType }> {
    const nav: Array<{ label: string; path: string; icon?: React.ComponentType }> = [];
    for (const module of this.modules.values()) {
      if (module.enabled && module.pages.length > 0) {
        nav.push({
          label: module.name,
          path: module.pages[0].path,
          icon: module.icon,
        });
      }
    }
    return nav;
  }
  
  getDashboardWidgets(): Array<{ id: string; component: React.ComponentType }> {
    const widgets: Array<{ id: string; component: React.ComponentType }> = [];
    for (const module of this.modules.values()) {
      if (module.enabled && module.dashboardWidget) {
        widgets.push({
          id: module.id,
          component: module.dashboardWidget,
        });
      }
    }
    return widgets;
  }
}

export const frontendModuleRegistry = new FrontendModuleRegistry();
```

---

## Module Template

### Creating a New Module

#### 1. Backend Module (server/modules/newfeature/index.ts)

```typescript
import { ModuleDefinition } from "../../modules/registry";
import { newfeatureRouter } from "./router";
import * as schema from "./schema";

export const newfeatureModule: ModuleDefinition = {
  id: "newfeature",
  name: "New Feature",
  description: "Description of the new feature",
  enabled: true,
  schema,
  router: newfeatureRouter,
  dashboardWidget: {
    component: "NewFeatureCard",
    queries: ["newfeature.summary"],
    refreshInterval: 300000, // 5 minutes
  },
  calculations: {
    calculateMetric: (data) => {
      // Custom calculation logic
      return result;
    },
  },
};
```

#### 2. Backend Router (server/modules/newfeature/router.ts)

```typescript
import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import * as db from "./db";

export const newfeatureRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return db.getByUser(ctx.user.id);
  }),
  
  create: protectedProcedure
    .input(z.object({ /* input schema */ }))
    .mutation(({ ctx, input }) => {
      return db.create(ctx.user.id, input);
    }),
  
  summary: protectedProcedure.query(({ ctx }) => {
    return db.getSummary(ctx.user.id);
  }),
});
```

#### 3. Frontend Module (client/src/modules/newfeature/index.ts)

```typescript
import { FrontendModuleDefinition } from "../registry";
import NewFeaturePage from "./pages/NewFeaturePage";
import NewFeatureCard from "./components/NewFeatureCard";
import { NewFeatureIcon } from "lucide-react";

export const newfeatureModule: FrontendModuleDefinition = {
  id: "newfeature",
  name: "New Feature",
  description: "Description of the new feature",
  enabled: true,
  pages: [
    {
      path: "/newfeature",
      component: NewFeaturePage,
      label: "New Feature",
    },
  ],
  dashboardWidget: NewFeatureCard,
  icon: NewFeatureIcon,
};
```

---

## Core Infrastructure

### Module Loader (server/_core/moduleLoader.ts)

```typescript
import { moduleRegistry } from "../modules/registry";
import { billsModule } from "../modules/bills";
import { debtModule } from "../modules/debt";
import { savingsModule } from "../modules/savings";
import { inventoryModule } from "../modules/inventory";
import { goalsModule } from "../modules/goals";
import { tradingModule } from "../modules/trading";
import { analyticsModule } from "../modules/analytics";

export function loadModules() {
  // Register all available modules
  moduleRegistry.register(billsModule);
  moduleRegistry.register(debtModule);
  moduleRegistry.register(savingsModule);
  moduleRegistry.register(inventoryModule);
  moduleRegistry.register(goalsModule);
  moduleRegistry.register(tradingModule);
  moduleRegistry.register(analyticsModule);
}

export function getModuleRouters() {
  const routers: Record<string, any> = {};
  for (const module of moduleRegistry.getEnabledModules()) {
    routers[module.id] = module.router;
  }
  return routers;
}
```

### Dynamic Router Composition (server/routers.ts)

```typescript
import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { getModuleRouters } from "./_core/moduleLoader";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  dashboard: dashboardRouter,
  ...getModuleRouters(), // Dynamically include all module routers
});
```

### Frontend Module Loader (client/src/modules/loader.ts)

```typescript
import { frontendModuleRegistry } from "./registry";
import { billsModule } from "./bills";
import { debtModule } from "./debt";
import { savingsModule } from "./savings";
import { inventoryModule } from "./inventory";
import { goalsModule } from "./goals";
import { tradingModule } from "./trading";
import { analyticsModule } from "./analytics";

export function loadFrontendModules() {
  frontendModuleRegistry.register(billsModule);
  frontendModuleRegistry.register(debtModule);
  frontendModuleRegistry.register(savingsModule);
  frontendModuleRegistry.register(inventoryModule);
  frontendModuleRegistry.register(goalsModule);
  frontendModuleRegistry.register(tradingModule);
  frontendModuleRegistry.register(analyticsModule);
}

export function getModuleRoutes() {
  return frontendModuleRegistry.getRoutes();
}

export function getModuleNavigation() {
  return frontendModuleRegistry.getNavigation();
}

export function getDashboardWidgets() {
  return frontendModuleRegistry.getDashboardWidgets();
}
```

---

## Data Flow

### Dashboard Data Aggregation

1. **CEO Dashboard requests data** via `trpc.dashboard.getFullSnapshot()`
2. **Dashboard router** queries each enabled module's `summary` procedure
3. **Each module** returns its key metrics independently
4. **Dashboard aggregates** all responses into a single view
5. **Frontend renders** dashboard with all module widgets

### Module Communication

Modules communicate **only through tRPC procedures**, never directly:

```typescript
// ✅ Correct: Module A calls Module B through tRPC
const debtSummary = await trpc.debt.summary.useQuery();

// ❌ Wrong: Direct module imports
import { getDebtData } from "../debt/db";
```

---

## Adding a New Module

### Step-by-Step Guide

1. **Create module directory structure:**
   ```bash
   mkdir -p server/modules/mymodule/{__tests__}
   mkdir -p client/src/modules/mymodule/{pages,components,hooks}
   ```

2. **Define database schema** (server/modules/mymodule/schema.ts)
   - Add table definition to Drizzle
   - Run migration

3. **Create database queries** (server/modules/mymodule/db.ts)
   - Implement query helpers
   - Follow naming convention: `getByUser`, `create`, `update`, `delete`, `getSummary`

4. **Build tRPC router** (server/modules/mymodule/router.ts)
   - Implement standard procedures: `list`, `get`, `create`, `update`, `delete`, `summary`
   - Add module-specific procedures as needed

5. **Create module definition** (server/modules/mymodule/index.ts)
   - Export `ModuleDefinition` with all metadata
   - Include dashboard widget config if applicable

6. **Register module** in server/_core/moduleLoader.ts
   - Import and register in `loadModules()`

7. **Build frontend components** (client/src/modules/mymodule/)
   - Create page components
   - Create dashboard widget
   - Implement hooks for data fetching

8. **Create frontend module definition** (client/src/modules/mymodule/index.ts)
   - Export `FrontendModuleDefinition`
   - Define routes and dashboard widget

9. **Register frontend module** in client/src/modules/loader.ts
   - Import and register in `loadFrontendModules()`

10. **Write tests** (server/modules/mymodule/__tests__/)
    - Test database queries
    - Test router procedures
    - Test calculations

---

## Extensibility Points

### Module Hooks

Modules can hook into system events:

```typescript
interface ModuleHooks {
  onUserCreated?: (userId: number) => Promise<void>;
  onDataSync?: () => Promise<void>;
  onDashboardRefresh?: () => Promise<void>;
  onAIBriefingGeneration?: (data: any) => Promise<string>;
}
```

### Custom Calculations

Each module can register custom calculations used by dashboard:

```typescript
const calculations = {
  calculateMetric: (data) => {
    // Custom logic
    return result;
  },
  predictTrend: (historicalData) => {
    // ML logic
    return prediction;
  },
};
```

### Dashboard Widget Configuration

Modules can customize their dashboard presence:

```typescript
dashboardWidget: {
  component: "ModuleCard",
  queries: ["module.summary", "module.alerts"],
  refreshInterval: 300000,
  priority: 1, // Display order
  size: "medium", // small, medium, large
  permissions: ["user", "admin"],
}
```

---

## Benefits of Modular Architecture

| Benefit | Description |
|---------|-------------|
| **Independent Development** | Teams can work on modules in parallel |
| **Easy Testing** | Each module can be tested independently |
| **Simple Deployment** | New modules can be deployed without touching existing code |
| **Scalability** | Add unlimited modules without performance impact |
| **Maintainability** | Clear separation of concerns |
| **Reusability** | Modules can be shared across projects |
| **Feature Flags** | Enable/disable modules via configuration |
| **Performance** | Load only enabled modules |

---

## Configuration

### Module Configuration (config/modules.json)

```json
{
  "modules": {
    "bills": { "enabled": true, "priority": 1 },
    "debt": { "enabled": true, "priority": 2 },
    "savings": { "enabled": true, "priority": 3 },
    "inventory": { "enabled": true, "priority": 4 },
    "goals": { "enabled": true, "priority": 5 },
    "trading": { "enabled": true, "priority": 6 },
    "analytics": { "enabled": true, "priority": 7 },
    "futureModule": { "enabled": false, "priority": 8 }
  }
}
```

---

## Future Enhancements

- **Module Marketplace:** Share and install community modules
- **Hot Reloading:** Update modules without server restart
- **Module Versioning:** Support multiple versions of same module
- **Dependency Management:** Declare module dependencies
- **Performance Monitoring:** Track module performance metrics
- **Module Permissions:** Fine-grained access control per module
