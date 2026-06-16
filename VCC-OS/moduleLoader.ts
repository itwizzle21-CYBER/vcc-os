import { moduleRegistry } from "../modules/registry";
import { billsModule } from "../modules/bills";
import { dashboardModule } from "../modules/dashboard";

export function loadModules() {
  // Register all available modules
  moduleRegistry.register(dashboardModule);
  moduleRegistry.register(billsModule);
  // More modules will be registered here as they are created
  // moduleRegistry.register(debtModule);
  // moduleRegistry.register(savingsModule);
  // etc.
  
  console.log(`[Module Loader] Loaded ${moduleRegistry.getModuleCount()} modules`);
  console.log(`[Module Loader] Enabled modules: ${moduleRegistry.listEnabledModules().join(", ")}`);
}

export function getModuleRouters() {
  const routers: Record<string, any> = {};
  for (const module of moduleRegistry.getEnabledModules()) {
    routers[module.id] = module.router;
  }
  if (Object.keys(routers).length === 0) {
    console.warn("[Module Loader] No enabled modules found. Check module registration.");
  }
  return routers;
}

export function getEnabledModuleIds(): string[] {
  return moduleRegistry.listEnabledModules();
}

export function isModuleEnabled(moduleId: string): boolean {
  return moduleRegistry.isModuleEnabled(moduleId);
}
