import { defineConfig } from "vitest/config";

// TODO: We need to find a better way to handle tests that involve process.exit

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["**/*.test.ts", "src/types.ts", "src/types.d.ts"],
    },
  },
});
