import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/*/test/**/*.test.ts",
      "apps/sync/test/**/*.test.ts",
      "apps/web/src/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**", "apps/sync/src/**"],
      thresholds: { lines: 85, functions: 85, statements: 85, branches: 75 },
    },
  },
});
