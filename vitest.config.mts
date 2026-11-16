import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      // `server-only` throws outside a React Server Component build; tests run in plain Node.
      "server-only": path.resolve(import.meta.dirname, "tests/empty.ts"),
      "@": path.resolve(import.meta.dirname),
    },
  },
});
