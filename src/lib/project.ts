/* Builds the browser's data slice from the full data files.

   Imported only at build time (by index.astro) and by the tests. Keeping it in
   its own module is what stops the data files reaching the client bundle:
   nothing the browser loads imports this file. */

import { JOBS, INTERVALS } from "@data/jobs";
import { PARTS, TOOLS, MERGE, LINKS, QTY, ITEMQTY, HINTS, LOCAL, STORES } from "@data/ref";
import type { Runtime } from "./runtime";

export function projectRuntime(): Runtime {
  return {
    jobs: JOBS.map(j => ({
      id: j.id,
      title: j.title,
      group: j.group,
      at: j.at,
      mins: j.mins,
      ...(j.fuel ? { fuel: j.fuel } : {}),
      /* One entry per step so the counters are right, carrying only a timer
         label where there is one. */
      steps: j.steps.map(s => (s.tm ? { tm: s.tm } : {})),
    })),
    intervals: INTERVALS,
    parts: PARTS.map(g => ({
      cat: g.cat,
      ...(g.pick ? { pick: g.pick } : {}),
      jobs: g.jobs,
      items: g.items.map(it => ({ id: it.id, name: it.name, pn: it.pn, where: it.where })),
    })),
    toolIds: TOOLS.flatMap(g => g.items.map(t => t.id)),
    toolNames: Object.fromEntries(TOOLS.flatMap(g => g.items.map(t => [t.id, t.name]))),
    merge: MERGE,
    links: LINKS,
    qty: QTY,
    itemQty: ITEMQTY,
    hints: HINTS,
    local: LOCAL,
    stores: STORES,
  };
}
