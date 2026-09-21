/* Runs src/data/schema.ts outside Astro, so a data break can be checked
   without a full build. `npm run build` runs the same check. */
import fs from "node:fs";
import * as esbuild from "esbuild";
esbuild.buildSync({
  entryPoints: ["src/data/schema.ts"], bundle: true, format: "esm",
  outfile: ".schema-check.tmp.mjs", external: ["astro/zod"], platform: "node",
});
const mod = await import("./.schema-check.tmp.mjs");
fs.unlinkSync(".schema-check.tmp.mjs");
try {
  mod.check();
  console.log("schema: all structures and cross-references valid");
} catch (e) {
  const where = i => (i.path || []).join(" > ");
  console.log("schema FAILED:");
  (e.issues || [{ message: e.message, path: [] }]).slice(0, 10)
    .forEach(i => console.log("  " + where(i) + "  —  " + i.message));
  process.exit(1);
}
