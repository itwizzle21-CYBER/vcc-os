import { defineConfig } from "vitest/config";

// Deliberately separate from the normal regression suite: these assertions
// express unresolved product contracts, and the readiness gate must stay red
// until the corresponding application fixes land.
export default defineConfig({
  test: { include: ["tests/audit/**/*.audit.ts"], reporters: ["verbose"] },
});
