/* Buy list, store planning and the pick-one rules. Lifted from app.js with
   only the render calls stripped out — the callers re-render now. */

import { PARTS, LOCAL, MERGE, QTY, ITEMQTY, LINKS } from "@data/ref";
import type { PartGroup, Where } from "@data/types";
import { findItem, groupOf, shortCat } from "./format";
import { state, save } from "./state";

export interface BuyLine {
  key: string;
  name: string;
  pn: string;
  where: Where[];
  qty: number;
  unit: string;
  per: string;
  /** Which categories contributed this line, for the "counts for" note. */
  cats: string[];
}

export function buyLines(): BuyLine[] {
  const picked: { g: PartGroup; it: PartGroup["items"][number] }[] = [];
  PARTS.forEach(g => g.items.forEach(it => { if (state().have[it.id]) picked.push({ g, it }); }));
  const lines: Record<string, BuyLine> = {};
  picked.forEach(p => {
    /* One bottle, one line. MERGE points every listing of a product at the one
       entry that names it in full, whether or not that entry is itself picked —
       otherwise Mobil 1 in the transmission and Mobil 1 in the primary come out
       as two separate 1 qt lines with the same name. */
    const key = MERGE[p.it.id] || p.it.id;
    const base = findItem(key) || p.it;
    const q = ITEMQTY[p.it.id] || QTY[p.g.cat] || [1, "", "each"];
    if (!lines[key]) {
      lines[key] = {
        key, name: base.name, pn: base.pn, where: base.where || [],
        qty: 0, unit: q[1], per: q[2], cats: [],
      };
    }
    lines[key]!.qty += q[0];
    lines[key]!.cats.push(shortCat(p.g.cat));
  });
  return Object.values(lines);
}

export interface StorePlan {
  covers: string[];
  dealer: BuyLine[];
  online: BuyLine[];
  localLines: BuyLine[];
  noLocal: BuyLine[];
}

export function storePlan(lines: BuyLine[]): StorePlan {
  /* Split the list into what a chain parts store can supply and what it can't,
     then look for one store that covers the first half. */
  const noLocal = lines.filter(l => !(l.where || []).some(w => LOCAL.indexOf(w.s) > -1));
  const localLines = lines.filter(l => noLocal.indexOf(l) < 0);
  const covers = LOCAL.filter(s =>
    localLines.length && localLines.every(l => (l.where || []).some(w => w.s === s)));
  const dealer = noLocal.filter(l => (l.where || []).some(w => w.s === "Dealer"));
  const online = noLocal.filter(l => dealer.indexOf(l) < 0);
  return { covers: covers as string[], dealer, online, localLines, noLocal };
}

/* Drop what a pick auto-filled elsewhere, but only the categories still
   flagged as auto-filled — one the user has since chosen by hand is theirs. */
export function unlink(id: string): void {
  (LINKS[id] || []).forEach(l => {
    if (state().linked[l]) { delete state().have[l]; delete state().linked[l]; }
  });
}

export function togglePick(id: string): void {
  const g = groupOf(id);
  if (state().have[id]) {
    delete state().have[id];
    delete state().linked[id];
    unlink(id);
  } else {
    /* Replacing the pick in a pick-one category has to drop the old pick's
       auto-fills too, or the transmission and primary go on claiming they are
       matched to an engine oil that is no longer chosen. */
    if (g?.pick) {
      g.items.forEach(it => {
        if (state().have[it.id]) unlink(it.id);
        delete state().have[it.id];
        delete state().linked[it.id];
      });
    }
    state().have[id] = true;
    (LINKS[id] || []).forEach(l => {
      const lg = groupOf(l);
      if (lg && !lg.items.some(it => state().have[it.id])) {
        state().have[l] = true;
        state().linked[l] = true;
      }
    });
  }
  save();
}

export function clearPick(g: PartGroup): void {
  g.items.forEach(it => {
    if (state().have[it.id]) { unlink(it.id); delete state().have[it.id]; }
    delete state().linked[it.id];
  });
  save();
}

/* Only the categories that belong to the jobs being logged. Recording every
   current pick put the engine oil and brake fluid on a tire-pressure check. */
export function partsUsed(jobIds: string[]): string[] {
  const out: string[] = [];
  PARTS.forEach(g => {
    if (!(g.jobs || []).some(id => jobIds.indexOf(id) > -1)) return;
    g.items.forEach(it => {
      if (state().have[it.id] && out.indexOf(it.name) < 0) out.push(it.name);
    });
  });
  return out;
}
