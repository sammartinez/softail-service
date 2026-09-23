/* Formatting and small lookups. Lifted unchanged from the vanilla app.js. */

import { rt } from "./runtime";
import type { RtItem, RtJob, RtPartGroup } from "./runtime";

export const esc = (s: unknown): string =>
  String(s == null ? "" : s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export const today = (): string => new Date().toISOString().slice(0, 10);

export const miles = (n: number | string): string =>
  Number(n).toLocaleString("en-US") + " mi";

export const money = (n: number): string => "$" + n.toFixed(2);

export const fmtTime = (s: number): string => {
  const t = Math.max(0, Math.ceil(s));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
};

export const fmtDate = (d: string): string => {
  const p = String(d).split("-");
  return p.length === 3
    ? new Date(+p[0]!, +p[1]! - 1, +p[2]!).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : d;
};

/** "Engine oil (4 qt)" -> "Engine oil" */
export const shortCat = (c: string): string => c.replace(/ \(.*\)/, "");

export const jobById = (id: string): RtJob | undefined => rt().jobs.find(j => j.id === id);

export const toolName = (id: string): string => rt().toolNames[id] ?? id;

export const findItem = (id: string): RtItem | undefined => {
  for (const g of rt().parts) for (const it of g.items) if (it.id === id) return it;
  return undefined;
};

export const groupOf = (id: string): RtPartGroup | undefined =>
  rt().parts.find(g => g.items.some(it => it.id === id));
