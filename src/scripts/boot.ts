/* Wiring. Loads saved state, paints the prerendered markup to match it, and
   hangs the delegated listeners.

   init() is exported rather than run on import so tests can seed localStorage
   first — the app repairs and migrates saved data at startup, and the old
   suite relied on being able to set that up before anything ran. */

import { setRuntime } from "@lib/runtime";
import type { Runtime } from "@lib/runtime";
import { state, save, load, VIEWS, TABS } from "@lib/state";
import { togglePick } from "@lib/shop";
import { jobById } from "@lib/format";
import { $, all, one, show, press, text, reduceMotion } from "./dom";
import { renderDue, renderHeader } from "./due";
import { paintJobList, paintJobDetail, openJob, closeJob, setGroup, toggleStep, clearSteps } from "./jobs";
import { paintShop, paintParts, paintTools, renderBuyList, setStore, clearGroup, retotal } from "./shop";
import { renderLog, saveEntry, deleteEntry, startFresh, exportBackup, importBackup, prefillLog, scrollTop } from "./log";
import { tick, paintTimers, startTimer, cancelTimer, syncWake, seedFired, clearFired, ensureAudio } from "./timers";

let spot: string | null = null;

/* ---- diagram ---- */
function paintSpot(): void {
  const map = $("map");
  map?.classList.toggle("dim", !!spot);
  all("#map [data-spot]").forEach(g =>
    g.classList.toggle("sel", (g as HTMLElement).dataset.spot === spot));
  all("#map [data-spot], #legend [data-spot]").forEach(b =>
    press(b, (b as HTMLElement).dataset.spot === spot));
}

function toggleSpot(id: string): void {
  spot = spot === id ? null : id;
  paintSpot();
}

function showSpot(id: string): void {
  spot = id;
  const box = $("mapBox") as HTMLDetailsElement | null;
  if (box) box.open = true;
  paintSpot();
  box?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
}

/* ---- views ---- */
export function setView(v: string): void {
  if (TABS.view.indexOf(v) < 0) v = "due";
  state().view = v;
  Object.keys(VIEWS).forEach(k => show($("view-" + k), k === v));
  const open = state().job;
  const job = v === "jobs" && open ? jobById(open) : null;
  text($("viewTitle"), job ? job.title : VIEWS[v]!);
  document.title = (job ? job.title : VIEWS[v]!) + " · Softail Service";
  all("nav.bar [data-view]").forEach(b => {
    if ((b as HTMLElement).dataset.view === v) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  save();
}

/** Repaints every screen. Cheap now — it sets attributes, it doesn't rebuild. */
export function renderAll(): void {
  document.documentElement.dataset.fuel = state().fuel;
  renderDue();
  paintJobList();
  paintJobDetail();
  paintShop();
  renderLog();
  paintRef();
  renderHeader();
  paintTimers();
}

function paintRef(): void {
  all("#refSeg [data-ref]").forEach(b => press(b, (b as HTMLElement).dataset.ref === state().ref));
  show($("refSpecs"), state().ref === "specs");
  show($("refTorque"), state().ref === "torque");
  show($("refFix"), state().ref === "fix");
  show($("refCodes"), state().ref === "codes");
}

const closest = (e: Event, sel: string) =>
  (e.target as Element | null)?.closest(sel) as HTMLElement | null;

export function init(): void {
  /* The data slice is injected as JSON by index.astro rather than imported,
     which is what keeps the 84 KB of job prose out of this bundle — it is
     already in the markup above. */
  const blob = document.getElementById("appdata")?.textContent;
  if (!blob) throw new Error("#appdata is missing — the page did not inject the runtime slice");
  setRuntime(JSON.parse(blob) as Runtime);

  load();
  seedFired();

  /* ---- nav ---- */
  one("nav.bar")?.addEventListener("click", e => {
    const b = closest(e, "[data-view]");
    if (!b) return;
    state().job = null;
    setView(b.dataset.view!);
    renderAll();
    window.scrollTo({ top: 0, behavior: "auto" });
  });

  /* ---- due ---- */
  $("view-due")?.addEventListener("click", e => {
    if (closest(e, "[data-jump-log]")) { setView("log"); renderAll(); focusTitle(); return; }
    const j = closest(e, "[data-job]");
    if (j) { openJob(j.dataset.job!); setView("jobs"); scrollTopInstant(); focusTitle(); }
  });
  $("odoNow")?.addEventListener("input", () => {
    state().odo = ($("odoNow") as HTMLInputElement).value.trim();
    save();
    renderDue();
    paintJobList();
  });

  /* ---- jobs ---- */
  $("jobSeg")?.addEventListener("click", e => {
    const b = closest(e, "[data-g]");
    if (b) setGroup(b.dataset.g!);
  });
  $("jobList")?.addEventListener("click", e => {
    const b = closest(e, "[data-open]");
    if (b) { openJob(b.dataset.open!); setView("jobs"); scrollTopInstant(); focusTitle(); }
  });
  $("jobBack")?.addEventListener("click", () => {
    const was = state().job;
    closeJob();
    setView("jobs");
    /* back to the card that was opened, so a keyboard user keeps their place */
    (one(`#jobList [data-open="${CSS.escape(was || "")}"]`) as HTMLElement | null)?.focus();
  });

  $("jobBody")?.addEventListener("click", e => {
    const where = closest(e, "[data-act='where']");
    if (where) { showSpot(where.dataset.loc!); return; }

    const start = closest(e, "[data-act='tstart']");
    if (start) { startTimer(start.dataset.key!, Number(start.dataset.sec)); return; }

    const cancel = closest(e, "[data-act='tcancel']");
    if (cancel) { cancelTimer(cancel.dataset.key!); return; }

    const jump = closest(e, "[data-jump]");
    if (jump) {
      if (jump.dataset.jump === "log") { prefillLog(state().job!); setView("log"); renderLog(); }
      else { setView("shop"); paintShop(); }
      scrollTopInstant();
      focusTitle();
      return;
    }

    if (closest(e, "[data-clearsteps]")) { clearSteps(state().job!); return; }

    const step = closest(e, "[data-toggle]");
    if (step) toggleStep(step.dataset.toggle!);
  });

  $("timerBar")?.addEventListener("click", e => {
    const b = closest(e, "[data-act='tcancel']");
    if (b) cancelTimer(b.dataset.key!);
  });

  /* ---- diagram ---- */
  const onSpot = (e: Event) => {
    const t = closest(e, "[data-spot]");
    if (t) toggleSpot(t.dataset.spot!);
  };
  $("map")?.addEventListener("click", onSpot);
  $("legend")?.addEventListener("click", onSpot);
  $("map")?.addEventListener("keydown", e => {
    const k = (e as KeyboardEvent).key;
    if ((k === "Enter" || k === " ") && closest(e, "[data-spot]")) { e.preventDefault(); onSpot(e); }
  });

  /* ---- shop ---- */
  $("shopSeg")?.addEventListener("click", e => {
    const b = closest(e, "[data-shop]");
    if (!b) return;
    state().shop = b.dataset.shop!;
    save();
    paintShop();
  });
  $("view-shop")?.addEventListener("click", e => {
    const go = closest(e, "[data-shopgo]");
    if (go) { state().shop = go.dataset.shopgo!; save(); paintShop(); return; }

    const s = closest(e, "[data-s]");
    if (s) { setStore(s.dataset.s!); return; }

    const buy = closest(e, "[data-buy]");
    if (buy) {
      const k = buy.dataset.buy!;
      if (state().bought[k]) delete state().bought[k]; else state().bought[k] = true;
      save();
      renderBuyList();
      return;
    }

    const clear = closest(e, "[data-clear]");
    if (clear) { clearGroup(Number(clear.dataset.clear)); return; }

    const pick = closest(e, "[data-id]");
    if (pick) { togglePick(pick.dataset.id!); paintParts(); return; }

    const tool = closest(e, "[data-tool]");
    if (tool) {
      const id = tool.dataset.tool!;
      if (state().tools[id]) delete state().tools[id]; else state().tools[id] = true;
      save();
      paintTools();
    }
  });
  $("view-shop")?.addEventListener("input", e => {
    const p = closest(e, "[data-price]") as HTMLInputElement | null;
    if (!p) return;
    const v = p.value.trim();
    if (v === "") delete state().prices[p.dataset.price!];
    else state().prices[p.dataset.price!] = v as unknown as number;
    save();
    retotal();
  });
  $("resetTools")?.addEventListener("click", () => {
    state().tools = {};
    save();
    paintTools();
  });

  /* ---- log ---- */
  $("history")?.addEventListener("click", e => {
    const b = closest(e, "[data-del]");
    if (!b) return;
    if (confirm("Delete this log entry?")) { deleteEntry(b.dataset.del!); renderLog(); renderDue(); }
  });
  $("logSaved")?.addEventListener("click", e => {
    if (closest(e, "[data-fresh]")) { startFresh(); clearFired(); renderAll(); syncWake(); }
  });
  $("fSave")?.addEventListener("click", () => {
    if (!saveEntry()) return;
    renderLog();
    renderDue();
    paintJobList();
    scrollTop();
  });
  $("fuelSel")?.addEventListener("change", () => {
    state().fuel = ($("fuelSel") as HTMLSelectElement).value === "efi" ? "efi" : "carb";
    save();
    renderAll();
  });
  $("freshBtn")?.addEventListener("click", () => {
    if (confirm("Clear step checkmarks, timers, tool checks and cart checks? Parts picks, prices and the log are kept.")) {
      startFresh();
      clearFired();
      renderAll();
      syncWake();
    }
  });
  $("expBtn")?.addEventListener("click", exportBackup);
  $("impBtn")?.addEventListener("click", () => ($("impFile") as HTMLInputElement).click());
  $("impFile")?.addEventListener("change", () => {
    const input = $("impFile") as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    importBackup(f, renderAll);
    input.value = "";
  });

  /* ---- reference ---- */
  $("refSeg")?.addEventListener("click", e => {
    const b = closest(e, "[data-ref]");
    if (!b) return;
    state().ref = b.dataset.ref!;
    save();
    paintRef();
  });

  /* ---- audio needs a gesture before it can play ---- */
  document.addEventListener("pointerdown", ensureAudio, { once: true });
  document.addEventListener("keydown", ensureAudio, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { syncWake(); paintTimers(); }
  });

  setView(state().view);
  renderAll();
  syncWake();
  setInterval(tick, 1000);

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register(import.meta.env.BASE_URL.replace(/\/?$/, "/") + "sw.js").catch(() => {}));
  }
}

const scrollTopInstant = () => window.scrollTo({ top: 0, behavior: "auto" });

/* After a tap that hides the control it came from, focus would drop to <body>
   and a screen reader would say nothing about the new screen. The title is
   where the new screen starts. */
const focusTitle = () => $("viewTitle")?.focus({ preventScroll: true });

/* Handed to the tests, which drive the clock by hand rather than waiting. */
export { tick, state, spot as selectedSpot };
