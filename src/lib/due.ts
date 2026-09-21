/* Job and schedule maths. Lifted unchanged from app.js.

   These read the state singleton for the odometer, the log and the fuel
   system, so they stay together rather than becoming pure functions of their
   arguments — the call sites all want "given what Sam has saved". */

import { INTERVALS, JOBS } from "@data/jobs";
import type { Job } from "@data/types";
import { miles } from "./format";
import { state, type LogEntry } from "./state";

export type DueCode = "now" | "soon" | "ok" | "never" | "asneeded";

export interface Due {
  s: DueCode;
  every: number;
  last?: LogEntry | null;
  next?: number;
  left?: number | null;
}

const intervalOf = (k: string): number => INTERVALS.find(i => i.k === k)?.miles || 0;

/** The smallest recurring interval. Break-in (500) only counts if it's alone. */
export function jobInterval(job: Job): number {
  const rec = job.at.filter(k => k !== "ride" && k !== "i500").map(intervalOf).filter(Boolean);
  if (rec.length) return Math.min.apply(null, rec);
  return job.at.includes("i500") ? 500 : 0;
}

export const applies = (job: Job): boolean => !job.fuel || job.fuel === state().fuel;

/* A job with no mileage interval is either a pre-ride check or genuinely
   as-needed. Calling a pre-ride check "as needed" reads as optional. */
export function intervalLabel(job: Job): string {
  const m = jobInterval(job);
  if (m) return "every " + miles(m);
  return job.at.indexOf("ride") > -1 ? "every ride" : "as needed";
}

export const activeJobs = (): Job[] => JOBS.filter(applies);

/* for-of rather than forEach: TypeScript can't follow an assignment made
   inside a callback, and narrows `best` to never. */
export function lastDone(jobId: string): LogEntry | null {
  let best: LogEntry | null = null;
  for (const e of state().log) {
    if (e.jobs.indexOf(jobId) > -1 && (best === null || e.miles > best.miles)) best = e;
  }
  return best;
}

export function dueStatus(job: Job): Due {
  const every = jobInterval(job);
  if (!every) return { s: "asneeded", every: 0 };
  const odo = Number(state().odo);
  const last = lastDone(job.id);
  if (!last) return { s: "never", every, last: null };
  const next = last.miles + every;
  /* With no odometer entered, nothing is forced due. */
  if (!state().odo || !Number.isFinite(odo)) return { s: "ok", every, last, next, left: null };
  const left = next - odo;
  const window = Math.max(250, Math.round(every * 0.1));
  return { s: left <= 0 ? "now" : left <= window ? "soon" : "ok", every, last, next, left };
}

export function dueText(d: Due): string {
  if (d.s === "never") return "Never logged. Due every " + miles(d.every) + ".";
  if (d.left === null) return "Last done at " + miles(d.last!.miles) + ". Enter your odometer above.";
  if (d.s === "now") return d.left === 0 ? "Due now." : "Overdue by " + miles(-d.left!) + ".";
  return "In " + miles(d.left!) + ", at " + miles(d.next!) + ".";
}
