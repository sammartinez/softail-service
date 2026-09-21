/* Build-time validation of the data files.

   The types in types.ts check field shapes. This checks the things a type
   system can't: that every cross-reference actually resolves, and that every
   id space is free of duplicates. `check()` runs from the page frontmatter, so
   a broken reference fails `astro build` instead of shipping a step whose
   "Show where" button points at a diagram marker that doesn't exist.

   The vanilla build caught some of this in the jsdom suite. Catching it at
   build is strictly better: it can't be skipped, and it names the offender. */

import { z } from "astro/zod";
import { BIKE, INTERVALS, SCHEDULE, SPOTS, JOBS } from "./jobs";
import {
  SPECS, TORQUES, TROUBLE, DTC, DTC_HOWTO, STORES, LOCAL,
  PARTS, LINKS, MERGE, QTY, ITEMQTY, HINTS, TOOLS,
} from "./ref";

/* ---- id spaces, gathered once ---- */
const intervalKeys = INTERVALS.map(i => i.k);
const jobIds = JOBS.map(j => j.id);
const spotIds = SPOTS.map(s => s.id);
const toolIds = TOOLS.flatMap(g => g.items.map(t => t.id));
const partIds = PARTS.flatMap(g => g.items.map(i => i.id));
const partCats = PARTS.map(g => g.cat);
/* "All" is a UI filter sentinel and never appears as a where[].s value. */
const storeNames = STORES.filter(s => s !== "All");

/* superRefine rather than refine: it is the form that still lets the message
   name the offending value in Zod 4, and "loc: \"tankdranI\" does not exist"
   is the whole point of validating here instead of in a test. */
const oneOf = (space: string[], what: string) =>
  z.string().superRefine((v, ctx) => {
    if (!space.includes(v)) {
      ctx.addIssue({ code: "custom", message: `${what}: "${v}" does not exist` });
    }
  });

const unique = <T,>(rows: T[], key: (r: T) => string | number, what: string) => {
  const seen = new Map<string | number, number>();
  const dupes: string[] = [];
  rows.forEach(r => {
    const k = key(r);
    seen.set(k, (seen.get(k) ?? 0) + 1);
    if (seen.get(k) === 2) dupes.push(String(k));
  });
  if (dupes.length) throw new Error(`duplicate ${what}: ${dupes.join(", ")}`);
};

/* ---- schemas ---- */
const intervalKey = oneOf(intervalKeys, "interval key");
const jobId = oneOf(jobIds, "job id");

const stepSchema = z.object({
  t: z.string().min(1),
  b: z.string().min(1),
  c: z.array(z.string()).optional(),
  w: z.string().min(1).optional(),
  tl: z.array(oneOf(toolIds, "tool id")).optional(),
  loc: oneOf(spotIds, "diagram location").optional(),
  tm: z.tuple([z.number().positive(), z.string().min(1)]).optional(),
}).strict();

const jobSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  group: z.enum(["Fluids", "Checks", "Tune-up", "Adjust", "Lube", "Season"]),
  at: z.array(intervalKey),
  mins: z.number().positive(),
  cap: z.string().optional(),
  page: z.string().min(1),
  lede: z.string().min(1),
  warm: z.boolean().optional(),
  upright: z.boolean().optional(),
  fuel: z.enum(["carb", "efi"]).optional(),
  steps: z.array(stepSchema).min(1),
}).strict();

const scheduleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  at: z.array(intervalKey).min(1),
  /* Required but nullable: six items have no job written for them yet. */
  job: jobId.nullable(),
  carbOnly: z.boolean().optional(),
}).strict();

const spotSchema = z.object({
  id: z.string().min(1),
  n: z.number().int().positive(),
  name: z.string().min(1),
  where: z.string().min(1),
}).strict();

const whereSchema = z.object({
  s: oneOf(storeNames, "store name"),
  t: z.string().min(1),
  u: z.string().url().optional(),
}).strict();

const partsSchema = z.object({
  cat: z.string().min(1),
  pick: z.boolean().optional(),
  jobs: z.array(jobId).min(1),
  items: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    pn: z.string().min(1),
    tag: z.string().optional(),
    note: z.string().min(1),
    where: z.array(whereSchema).min(1),
  }).strict()).min(1),
}).strict();

const toolsSchema = z.object({
  cat: z.string().min(1),
  items: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    use: z.string().min(1),
    tag: z.string().optional(),
  }).strict()).min(1),
}).strict();

const qty = z.tuple([z.number().positive(), z.string(), z.string().min(1)]);

let checked = false;

/** Validates every structure and cross-reference. Throws on the first problem.
    Idempotent, so importing it from several pages costs nothing. */
export function check(): void {
  if (checked) return;

  z.object({
    year: z.number().int(), code: z.string(), name: z.string(),
    engine: z.string(), note: z.string(),
  }).strict().parse(BIKE);

  z.array(z.object({
    k: z.string(), label: z.string(), short: z.string(),
    miles: z.number().int().nonnegative(), once: z.boolean().optional(),
  }).strict()).parse(INTERVALS);

  z.array(jobSchema).parse(JOBS);
  z.array(scheduleSchema).parse(SCHEDULE);
  z.array(spotSchema).parse(SPOTS);
  z.array(partsSchema).parse(PARTS);
  z.array(toolsSchema).parse(TOOLS);

  z.array(z.object({
    group: z.string(), src: z.string(),
    rows: z.array(z.tuple([z.string(), z.string()])).min(1),
    notes: z.array(z.string()).optional(),
  }).strict()).parse(SPECS);

  z.array(z.object({
    grp: z.enum(["Fluids", "Primary", "Tune-up", "Chassis"]),
    item: z.string().min(1),
    v: z.string().min(1),
    /* Required but may be empty: the oil filter is hand tight, no Nm figure. */
    nm: z.string(),
    jobs: z.array(jobId),
    note: z.string().optional(),
  }).strict()).parse(TORQUES);

  z.array(z.object({
    q: z.string().min(1),
    causes: z.array(z.string()).min(1),
    warn: z.string().optional(),
  }).strict()).parse(TROUBLE);

  z.array(z.tuple([z.string().min(1), z.string().min(1), z.enum(["", "carb", "efi"])])).parse(DTC);
  z.object({
    carb: z.array(z.string()).min(1),
    efi: z.array(z.string()).min(1),
    note: z.string(),
  }).strict().parse(DTC_HOWTO);

  /* The config maps: keys and values point into the parts id space. */
  const partId = oneOf(partIds, "part id");
  z.record(partId, z.array(partId)).parse(LINKS);
  z.record(partId, partId).parse(MERGE);
  z.record(oneOf(partCats, "part category"), qty).parse(QTY);
  z.record(partId, qty).parse(ITEMQTY);
  z.record(partId, z.string().min(1)).parse(HINTS);

  z.array(oneOf(STORES as unknown as string[], "store")).parse(LOCAL);

  /* Uniqueness, which a schema alone can't see. */
  unique(JOBS, j => j.id, "job id");
  unique(SCHEDULE, s => s.id, "schedule id");
  unique(SPOTS, s => s.id, "diagram spot id");
  unique(SPOTS, s => s.n, "diagram number");
  unique(INTERVALS, i => i.k, "interval key");
  unique(PARTS, g => g.cat, "part category");
  unique(SPECS, g => g.group, "spec group");
  unique(TOOLS, g => g.cat, "tool category");
  unique(TOOLS.flatMap(g => g.items), t => t.id, "tool id");
  unique(PARTS.flatMap(g => g.items), i => i.id, "part id");

  /* The diagram numbers are a dense 1..n run; a gap means a missing marker. */
  const ns = SPOTS.map(s => s.n).sort((a, b) => a - b);
  ns.forEach((n, i) => {
    if (n !== i + 1) throw new Error(`diagram numbering is not 1..${ns.length}: found ${n} at position ${i + 1}`);
  });

  checked = true;
}
