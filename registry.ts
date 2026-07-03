import type { AppRouter } from "../routers";

type Router = any;

export interface DashboardWidgetConfig {
  component: string;
  queries: string[];
  refreshInterval?: number;
  priority?: number;
  size?: "small" | "medium" | "large";
  permissions?: string[];
}

export interface ModuleCalculations {
  [key: string]: (data: any) => any;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  router: Router;
  dashboardWidget?: DashboardWidgetConfig;
  calculations?: ModuleCalculations;
}

export class ModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map();

  register(module: ModuleDefinition): void {
    if (this.modules.has(module.id)) {
      console.warn(`Module ${module.id} is already registered. Overwriting.`);
    }
    this.modules.set(module.id, module);
  }

  getModule(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  getEnabledModules(): ModuleDefinition[] {
    return Array.from(this.modules.values()).filter((m) => m.enabled);
  }

  getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  getModuleRouter(id: string): Router | undefined {
    return this.getModule(id)?.router;
  }

  getDashboardWidgets(): ModuleDefinition[] {
    return this.getEnabledModules().filter((m) => m.dashboardWidget);
  }

  getModuleCalculations(id: string): ModuleCalculations | undefined {
    return this.getModule(id)?.calculations;
  }

  isModuleEnabled(id: string): boolean {
    const module = this.getModule(id);
    return module?.enabled ?? false;
  }

  enableModule(id: string): void {
    const module = this.getModule(id);
    if (module) {
      module.enabled = true;
    }
  }

  disableModule(id: string): void {
    const module = this.getModule(id);
    if (module) {
      module.enabled = false;
    }
  }

  getModuleCount(): number {
    return this.modules.size;
  }

  getEnabledModuleCount(): number {
    return this.getEnabledModules().length;
  }

  listModules(): string[] {
    return Array.from(this.modules.keys());
  }

  listEnabledModules(): string[] {
    return this.getEnabledModules().map((m) => m.id);
  }
}

export const moduleRegistry = new ModuleRegistry();
