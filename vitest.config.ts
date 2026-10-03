import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["brain/**/*.test.ts"],
    environment: "node",
  },
});
