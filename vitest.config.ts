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
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    /* Node 25 ships localStorage on by default and warns on every run when it
       has no backing file. These tests never touch it. */
    execArgv: ["--no-experimental-webstorage"],
  },
});
