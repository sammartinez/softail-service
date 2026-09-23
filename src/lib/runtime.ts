/* The slice of the data the *browser* needs.

   The prose — step bodies, spec tables, troubleshooting, part notes — is
   rendered into HTML at build time, so shipping it to the client as well would
   send every word twice. The first build did exactly that: 77 KB of script,
   most of it step bodies already present in the markup above it.

   So the client gets this projection instead, injected as one JSON blob by
   index.astro. Nothing here imports the data files, which is what keeps them
   out of the client bundle — `rt()` throws rather than falling back, because a
   silent fallback would quietly pull all 84 KB back in. */

import type { Fuel, IntervalKey, Interval, StoreName, Qty } from "@data/types";

export interface RtStep {
  /** [seconds, label] — the timer bar needs the label. */
  tm?: [number, string];
}

export interface RtJob {
  id: string;
  title: string;
  group: string;
  at: IntervalKey[];
  mins: number;
  fuel?: Fuel;
  /** Only what the counters and timers need, never the text. */
  steps: RtStep[];
}

export interface RtWhere { s: StoreName; t: string; u?: string }
export interface RtItem { id: string; name: string; pn: string; where: RtWhere[] }
export interface RtPartGroup { cat: string; pick?: boolean; jobs: string[]; items: RtItem[] }

export interface Runtime {
  jobs: RtJob[];
  intervals: Interval[];
  parts: RtPartGroup[];
  /** Ids only — the names and uses are already in the markup. */
  toolIds: string[];
  toolNames: Record<string, string>;
  merge: Record<string, string>;
  links: Record<string, string[]>;
  qty: Record<string, Qty>;
  itemQty: Record<string, Qty>;
  hints: Record<string, string>;
  local: readonly string[];
  stores: readonly string[];
}

let RT: Runtime | null = null;

export const setRuntime = (r: Runtime): void => { RT = r; };

export const rt = (): Runtime => {
  if (!RT) throw new Error("runtime data was never set — call setRuntime() first");
  return RT;
};
