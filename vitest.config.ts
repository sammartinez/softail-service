import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@data": r("./src/data"),
      "@lib": r("./src/lib"),
      "@components": r("./src/components"),
    },
  },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
