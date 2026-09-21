/* Saved state: shape, repair, migration, persistence.

   The app keeps one module-level state object rather than passing it around,
   the same as the vanilla build. Callers mutate fields through `state()`;
   only a backup import replaces the whole object, via `setState()`.
   Everything here is pure apart from load/save, so it tests without a DOM. */

import { PARTS, STORES } from "@data/ref";
import { today, jobById } from "./format";
import type { Fuel } from "@data/types";

export const KEY = "hd-maint-v1";
export const OLDKEY = "softail-oil-v1";

export interface LogEntry {
  id: number | string;
  date: string;
  miles: number;
  jobs: string[];
  parts: string[];
  notes: string;
}

export interface State {
  v: number;
  odo: string;
  fuel: Fuel;
  done: Record<string, boolean>;
  have: Record<string, boolean>;
  linked: Record<string, boolean>;
  bought: Record<string, boolean>;
  prices: Record<string, number>;
  tools: Record<string, boolean>;
  /** Timer end timestamps, keyed `jobId:stepIndex`. */
  timers: Record<string, number>;
  log: LogEntry[];
  job: string | null;
  jgroup: string;
  shop: string;
  ref: string;
  store: string;
  view: string;
  migrated?: boolean;
}

export const BLANK = (): State => ({
  v: 2, odo: "", fuel: "carb", done: {}, have: {}, linked: {}, bought: {},
  prices: {}, tools: {}, timers: {}, log: [], job: null, jgroup: "All",
  shop: "list", ref: "specs", store: "All", view: "due",
});

export const VIEWS: Record<string, string> = {
  due: "What's due", jobs: "Jobs", shop: "Parts and tools",
  log: "Service log", ref: "Reference",
};

export const GROUPS = ["All", "Fluids", "Checks", "Tune-up", "Adjust", "Lube", "Season"];

/* The saved fields that decide which panel is on screen. A value outside these
   lists hides every panel on that screen, which is how a hand-edited backup
   turned Reference into a bare segmented control over empty space. */
export const TABS: Record<string, readonly string[]> = {
  view: Object.keys(VIEWS),
  shop: ["list", "parts", "tools"],
  ref: ["specs", "torque", "fix", "codes"],
  jgroup: GROUPS,
  store: STORES,
};

export function repair(s: unknown): State {
  const b = BLANK();
  if (!s || typeof s !== "object") return b;
  const out = Object.assign(b, s) as State & Record<string, unknown>;
  (["done", "have", "linked", "bought", "prices", "tools", "timers"] as const).forEach(k => {
    const v = out[k];
    if (!v || typeof v !== "object" || Array.isArray(v)) (out as any)[k] = {};
  });
  if (!Array.isArray(out.log)) out.log = [];
  out.log = out.log
    .filter((e): e is LogEntry => !!e && typeof e === "object")
    .map(e => ({
      id: e.id || Date.now() + Math.random(),
      date: e.date || today(),
      miles: Number(e.miles) || 0,
      jobs: Array.isArray(e.jobs) ? e.jobs.filter(j => jobById(j)) : [],
      parts: Array.isArray(e.parts) ? e.parts : [],
      notes: e.notes || "",
    }));
  if (out.fuel !== "efi") out.fuel = "carb";
  /* `out` is `b` — Object.assign mutates its target — so the fallbacks have to
     come from a second blank, not from `b`, which now holds the saved values. */
  const def = BLANK() as unknown as Record<string, unknown>;
  Object.keys(TABS).forEach(k => {
    if (TABS[k]!.indexOf(out[k] as string) < 0) (out as any)[k] = def[k];
  });
  /* One pick per pick-one category. */
  PARTS.forEach(g => {
    if (!g.pick) return;
    let f = false;
    g.items.forEach(it => {
      if (out.have[it.id]) { if (f) delete out.have[it.id]; else f = true; }
    });
  });
  return out;
}

/** Old oil-change app's saved data, if it was served from this same address. */
export function migrate(old: Record<string, any>): State {
  const s = BLANK();
  (["have", "linked", "bought", "prices", "tools", "odo"] as const).forEach(k => {
    if (old[k]) (s as any)[k] = old[k];
  });
  if (Array.isArray(old.log)) {
    s.log = old.log.map((e: any) => {
      const txt = (Array.isArray(e.done) ? e.done.join(" ") : "").toLowerCase();
      const jobs: string[] = [];
      if (/engine|oil and filter/.test(txt)) jobs.push("engine-oil");
      if (/trans/.test(txt)) jobs.push("trans-oil");
      if (/primary/.test(txt)) jobs.push("primary-oil");
      return { id: e.id, date: e.date, miles: e.miles, jobs, parts: e.parts || [], notes: e.notes || "" };
    });
  }
  s.migrated = true;
  return s;
}

let current: State = BLANK();

/** The live state object. Mutate its fields directly; it is a singleton. */
export const state = (): State => current;

/** Replaces the whole object — only a backup import needs this. */
export const setState = (s: State): void => { current = s; };

/** Reads localStorage, falling back to the old oil-change app's key once. */
export function load(): State {
  let raw: unknown = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { /* ignore */ }
  if (raw) { current = repair(raw); return current; }
  let old: any = null;
  try { old = JSON.parse(localStorage.getItem(OLDKEY) || "null"); } catch { /* ignore */ }
  current = repair(old ? migrate(old) : null);
  return current;
}

export function save(): void {
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* quota, private mode */ }
}
