/* styles.css lints, ported from the old jsdom suite.

   Neither jsdom nor Vitest does layout, so these are the only guard against
   the stylesheet failures that already happened once: a modifier class picking
   up a standalone rule's layout, and a comment left open that silently ate the
   print block. */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8");
const css = read("src/styles/styles.css");
const live = css.replace(/\/\*[\s\S]*?\*\//g, "");

/* every .astro and .ts file under src/, where class names get written */
const sources = (dir: string): string[] =>
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? sources(path.join(dir, e.name))
      : /\.(astro|ts)$/.test(e.name) ? [read(path.join(dir, e.name))] : []);

describe("CSS class collisions", () => {
  /* Twice a modifier like `chip due` was silently restyled by a standalone
     rule of the same name (`.due` for the due-list row, `.spec` for the spec
     table). */
  const LAYOUT = /(^|;)\s*(display|width|height|padding|margin|border(?!-color)|flex|position|float|grid)\b/;
  const standalone = new Map<string, string>();
  live.replace(/([^{}@]+)\{([^}]*)\}/g, (m, sel: string, body: string) => {
    sel.split(",").forEach(s => {
      const hit = /^\s*\.([A-Za-z0-9_-]+)\s*$/.exec(s);
      if (hit && LAYOUT.test(body)) standalone.set(hit[1]!, body.trim().slice(0, 60));
    });
    return m;
  });
  const BASES = ["chip", "btn", "duerow", "step", "check", "stick", "tbtn", "box", "card", "seg", "pills", "warn", "note"];

  it("finds standalone class rules to check against", () => {
    expect(standalone.size).toBeGreaterThan(0);
  });

  it("no modifier class is also a standalone layout rule", () => {
    /* class="…" in markup, plus "chip overdue"-style strings in the scripts */
    const lists = sources("src").flatMap(src => [
      ...[...src.matchAll(/class="([^"$]+)"/g)].map(m => m[1]!),
      ...[...src.matchAll(new RegExp(`"((?:${BASES.join("|")})(?: [\\w-]+)+)"`, "g"))].map(m => m[1]!),
    ]);
    expect(lists.length).toBeGreaterThan(20);
    const clashes: string[] = [];
    lists.forEach(list => {
      const names = list.trim().split(/\s+/);
      const base = names.find(n => BASES.includes(n));
      if (!base) return;
      names.forEach(n => {
        if (n !== base && !BASES.includes(n) && standalone.has(n)) {
          clashes.push(`${base} + ${n}  (.${n} sets: ${standalone.get(n)})`);
        }
      });
    });
    expect(clashes).toEqual([]);
  });

  it("the two that bit us stay renamed", () => {
    expect(css).not.toMatch(/\.chip\.due\b/);
    expect(css).not.toMatch(/(^|\n)\.spec\{/);
    expect(css).toMatch(/\.duerow\{/);
    expect(css).toMatch(/\.chip\.overdue\{/);
  });
});

describe("stylesheet structure", () => {
  it("braces balance: an unclosed media query eats the rest of the file", () => {
    expect((css.match(/\{/g) || []).length).toBe((css.match(/\}/g) || []).length);
  });

  it("comments are all closed: braces alone can't catch an open /*", () => {
    expect((css.match(/\/\*/g) || []).length).toBe((css.match(/\*\//g) || []).length);
  });

  it("the print rules are live, not commented out", () => {
    expect(live).toMatch(/@media print\{[^}]*nav\.bar[^}]*display:none/);
  });

  it("[hidden] still wins over the grid rules", () => {
    expect(css).toContain("[hidden]{display:none!important}");
  });

  it("has every breakpoint CLAUDE.md lists", () => {
    [359, 600, 760, 900, 1000, 1280, 1700].forEach(bp => expect(css).toContain(`width:${bp}px`));
    expect(css).toMatch(/max-height:520px\) and \(orientation:landscape\)/);
  });

  it("the side rail replaces the bottom bar at 900px", () => {
    const rail = css.slice(css.indexOf("@media (min-width:900px)"));
    expect(rail).toMatch(/padding-left:calc\(224px/);
    expect(rail).toMatch(/\.timerbar\{left:calc\(224px/);
    expect(rail).toMatch(/nav\.bar \.brand\{[^}]*display:block/);
  });
});
