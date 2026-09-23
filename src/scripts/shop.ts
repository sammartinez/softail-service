/* The Shop screen.

   Parts and tools are prerendered catalogues, so those two are painted by
   setting attributes. The buy list is built here, because which lines exist
   depends entirely on what Sam has picked. */

import { rt } from "@lib/runtime";
import { state, save } from "@lib/state";
import { buyLines, storePlan, clearPick } from "@lib/shop";
import { money, esc } from "@lib/format";
import { CHECK } from "@lib/icons";
import { $, all, one, show, press, text } from "./dom";

export function paintParts(): void {
  all("#filters [data-s]").forEach(b =>
    press(b, (b as HTMLElement).dataset.s === state().store));

  const store = state().store;
  let anyVisible = false;

  rt().parts.forEach((g, gi) => {
    const section = one<HTMLElement>(`[data-partgroup="${gi}"]`);
    if (!section) return;
    let shown = 0;
    g.items.forEach(it => {
      const rowEl = one(`[data-id="${CSS.escape(it.id)}"]`, section)?.closest(".check") as HTMLElement | null;
      if (!rowEl) return;
      const atStore = store === "All" || it.where.some(w => w.s === store);
      rowEl.hidden = !atStore;
      if (atStore) shown++;
    });
    section.hidden = shown === 0;
    if (shown) anyVisible = true;

    const picked = g.pick ? g.items.find(it => state().have[it.id]) : undefined;
    show(one(`[data-pickcard="${gi}"]`), !!picked);
    if (picked) {
      text(one(`[data-pickname="${gi}"]`), picked.name);
      show(one(`[data-picklinked="${gi}"]`), !!state().linked[picked.id]);
    }

    g.items.forEach(it => {
      const box = one(`[data-id="${CSS.escape(it.id)}"]`);
      if (!box) return;
      const checked = !!state().have[it.id];
      press(box, checked);
      box.innerHTML = checked ? CHECK : "";
      /* Pick-one: once something in this category is chosen, the rest are
         locked until it is unpicked or "Change" is tapped. */
      const locked = !!(g.pick && picked && !checked);
      (box as HTMLButtonElement).disabled = locked;
      if (locked) box.setAttribute("aria-disabled", "true");
      else box.removeAttribute("aria-disabled");
    });
  });

  show(one("[data-noparts]"), !anyVisible);
}

export function paintTools(): void {
  all<HTMLElement>("[data-tool]").forEach(box => {
    const on = !!state().tools[box.dataset.tool!];
    press(box, on);
    box.innerHTML = on ? CHECK : "";
  });
}

export function renderBuyList(): void {
  const host = $("shopList");
  if (!host) return;
  const lines = buyLines();

  let h = '<div class="card"><div class="rowline"><h2 style="margin:0">Buy list</h2>' +
    (lines.length ? '<span class="small muted">' + lines.filter(l => state().bought[l.key]).length +
      " of " + lines.length + " in cart</span>" : "") + "</div>";

  if (!lines.length) {
    h += '<p class="hint" style="margin:8px 0 0">Nothing picked yet. Choose a product for each fluid on the Parts tab and it lands here with quantities.</p>' +
      '<div class="btnrow"><button class="btn" data-shopgo="parts">Pick parts</button></div></div>';
    host.innerHTML = h;
    return;
  }

  let total = 0, priced = 0;
  h += lines.map(l => {
    const b = !!state().bought[l.key];
    const p = state().prices[l.key];
    const each = Number(p);
    if (p && Number.isFinite(each)) { total += each * l.qty; priced++; }
    return '<div class="check">' +
      '<button class="box" data-buy="' + esc(l.key) + '" aria-pressed="' + b + '" aria-label="In cart: ' + esc(l.name) + '">' + (b ? CHECK : "") + "</button>" +
      '<div class="grow"><div style="font-weight:600;line-height:1.3">' + esc(l.name) + "</div>" +
      '<div class="xs muted">' + esc(l.cats.join(", ")) + " · " + l.qty + (l.unit ? " " + l.unit : "") + (l.pn ? " · " + esc(l.pn) : "") + "</div>" +
      (l.where && l.where.length ? '<div class="chips">' + l.where.map(w => w.u
        ? '<a class="chip plain" href="' + esc(w.u) + '" target="_blank" rel="noopener">' + esc(w.t) + "</a>"
        : '<span class="chip plain">' + esc(w.t) + "</span>").join("") + "</div>" : "") +
      (rt().hints[l.key] ? '<div class="xs muted" style="margin-top:4px">' + esc(rt().hints[l.key]) + "</div>" : "") +
      "</div>" +
      '<label class="pricecell xs muted"><span style="display:block">' + esc(l.per) + "</span>" +
      '<input class="money" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" data-price="' + esc(l.key) + '" value="' + (p != null ? esc(p) : "") + '" aria-label="Price for ' + esc(l.name) + '"></label>' +
      "</div>";
  }).join("");

  h += '<div class="rowline" style="border-top:1px solid var(--line);padding-top:12px;margin-top:8px">' +
    '<span class="small muted">' + (priced ? "Total of " + priced + " priced line" + (priced > 1 ? "s" : "") : "Type prices to total it up") + "</span>" +
    '<span id="buyTotal" style="font-family:var(--cond);font-size:24px;font-weight:700">' + (priced ? money(total) : "\u2014") + "</span></div>";

  /* Where to go: one local store if one covers the lot, then the rest. */
  const plan = storePlan(lines);
  h += '<hr class="rule">';
  if (plan.covers.length) {
    h += '<p class="small" style="margin:0"><b>One stop:</b> ' + esc(plan.covers.join(" or ")) +
      (plan.noLocal.length ? " carries everything except the lines below.</p>" : " carries everything on this list.</p>");
  } else if (plan.localLines.length) {
    h += '<p class="small" style="margin:0">No single parts store carries all of this. Check the links on each line.</p>';
  }
  if (plan.dealer.length) {
    h += '<p class="small muted" style="margin:6px 0 0"><b>From the dealer:</b> ' + esc(plan.dealer.map(l => l.name).join(", ")) + "</p>";
  }
  if (plan.online.length) {
    h += '<p class="small muted" style="margin:6px 0 0"><b>Order online:</b> ' + esc(plan.online.map(l => l.name).join(", ")) + "</p>";
  }
  h += "</div>";

  const toolsLeft = rt().toolIds.filter(id => !state().tools[id]).length;
  if (toolsLeft) {
    h += '<p class="hint">' + toolsLeft + " tool" + (toolsLeft > 1 ? "s" : "") +
      ' not checked off yet. <button class="btn link" data-shopgo="tools">Open tools</button></p>';
  }
  host.innerHTML = h;
}

export function paintShop(): void {
  all("#shopSeg [data-shop]").forEach(b =>
    press(b, (b as HTMLElement).dataset.shop === state().shop));
  show($("shopList"), state().shop === "list");
  show($("shopParts"), state().shop === "parts");
  show($("shopTools"), state().shop === "tools");
  if (state().shop === "list") renderBuyList();
  else if (state().shop === "parts") paintParts();
  else paintTools();
}

export function setStore(s: string): void {
  state().store = s;
  save();
  paintParts();
}

export function clearGroup(gi: number): void {
  const g = rt().parts[gi];
  if (!g) return;
  clearPick(g);
  paintParts();
}

/** Re-totals without rebuilding: the field Sam is typing in must not move. */
export function retotal(): void {
  const box = $("buyTotal");
  if (!box) return;
  let total = 0, priced = 0;
  buyLines().forEach(l => {
    const n = Number(state().prices[l.key]);
    if (state().prices[l.key] && Number.isFinite(n)) { total += n * l.qty; priced++; }
  });
  box.textContent = priced ? money(total) : "\u2014";
}
