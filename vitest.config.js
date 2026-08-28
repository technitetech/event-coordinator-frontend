import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.js"],
    exclude: ["node_modules", ".next", "lib/__tests__/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["lib/**/*.js", "app/**/*.js", "app/**/*.jsx"],
      exclude: ["lib/__tests__/**", "__tests__/**", "node_modules/**", ".next/**"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
    setupFiles: ["__tests__/setup.js"],
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "."),
    },
  },
});
