import { frontendModuleRegistry } from "./registry";
import { billsModule } from "./bills";
import { debtModule } from "./debt";
import { savingsModule } from "./savings";
import { inventoryModule } from "./inventory";

export function loadFrontendModules() {
  // Register all available modules
  frontendModuleRegistry.register(billsModule);
  frontendModuleRegistry.register(debtModule);
  frontendModuleRegistry.register(savingsModule);
  frontendModuleRegistry.register(inventoryModule);
  // More modules will be registered here as they are created
  // frontendModuleRegistry.register(savingsModule);
  // etc.

  console.log(
    `[Frontend Module Loader] Loaded ${frontendModuleRegistry.getModuleCount()} modules`
  );
  console.log(
    `[Frontend Module Loader] Enabled modules: ${frontendModuleRegistry.listEnabledModules().join(", ")}`
  );
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

export function getEnabledModuleIds(): string[] {
  return frontendModuleRegistry.listEnabledModules();
}

export function isModuleEnabled(moduleId: string): boolean {
  return frontendModuleRegistry.isModuleEnabled(moduleId);
}
