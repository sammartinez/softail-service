/* Countdown timers, the timer bar, the beep and the screen wake lock.

   Timers store end timestamps, so a countdown survives a reload and a tab
   switch. The one-second tick updates the countdown text in place — it never
   rebuilds the buttons, which is what ate taps in the old oil-change app.

   Prerendering all three timer states makes that stronger than it was: the
   button under a thumb is never replaced, only shown or hidden. */

import { fmtTime, jobById } from "@lib/format";
import { state, save } from "@lib/state";
import { $, all, one, show, text, esc } from "./dom";

let actx: AudioContext | null = null;
let wake: WakeLockSentinel | null = null;
const fired: Record<string, boolean> = {};

export function ensureAudio(): void {
  try {
    actx = actx || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
  } catch { /* no audio in this browser */ }
}

function beep(): void {
  try {
    ensureAudio();
    if (actx) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.connect(g); g.connect(actx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, actx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.6);
      o.start(); o.stop(actx.currentTime + 0.62);
    }
  } catch { /* ignore */ }
  /* iPhones don't support the vibration API; Android does. */
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* ignore */ }
}

/** Holds the screen awake while any timer runs, and lets go when none do. */
export async function syncWake(): Promise<void> {
  const any = Object.values(state().timers).some(e => e > Date.now());
  try {
    if (any && !wake && navigator.wakeLock) {
      wake = await navigator.wakeLock.request("screen");
      wake.addEventListener("release", () => { wake = null; });
    }
    if (!any && wake) { await wake.release(); wake = null; }
  } catch { /* denied, or the tab is hidden */ }
}

/** Shows whichever of a step timer's three prerendered states applies. */
function paintOne(key: string): void {
  const end = state().timers[key];
  const now = Date.now();
  show(one(`[data-timer-idle="${CSS.escape(key)}"]`), !end);
  show(one(`[data-timer-run="${CSS.escape(key)}"]`), !!end && end > now);
  show(one(`[data-timer-up="${CSS.escape(key)}"]`), !!end && end <= now);
  if (end && end > now) text(one(`[data-tleft="${CSS.escape(key)}"]`), fmtTime((end - now) / 1000));
}

export function paintTimers(): void {
  all<HTMLElement>("[data-timer-idle]").forEach(el => paintOne(el.dataset.timerIdle!));
  renderTimerBar();
}

function timerLabel(key: string): string {
  const [id, i] = key.split(":");
  const j = jobById(id!);
  const st = j?.steps[Number(i)];
  return st?.tm ? st.tm[1] : "Timer";
}

/* The bar is genuinely dynamic — which timer it shows depends on which is
   closest to done — so it stays a small builder. */
export function renderTimerBar(): void {
  const bar = $("timerBar");
  if (!bar) return;
  const now = Date.now();
  const runs = Object.entries(state().timers).filter(([, e]) => e > now).sort((a, b) => a[1] - b[1]);
  const ups = Object.entries(state().timers).filter(([, e]) => e <= now);
  const pick = runs[0] || ups[0];
  if (!pick) { bar.hidden = true; bar.innerHTML = ""; return; }
  const [key, end] = pick;
  const up = end <= now;
  const extra = runs.length + ups.length - 1;
  bar.hidden = false;
  bar.innerHTML =
    '<div class="inner' + (up ? " up" : "") + '">' +
    '<span class="t" data-bartime>' + (up ? "Done" : fmtTime((end - now) / 1000)) + "</span>" +
    '<span class="lbl">' + esc(timerLabel(key)) + (extra > 0 ? " +" + extra : "") + "</span>" +
    '<button class="btn sm" data-act="tcancel" data-key="' + esc(key) + '">' + (up ? "Clear" : "Cancel") + "</button></div>";
}

/** One second of clock. Text only — never rebuild the buttons. */
export function tick(): void {
  const now = Date.now();
  let rang = false;
  Object.entries(state().timers).forEach(([k, end]) => {
    if (end <= now && !fired[k]) { fired[k] = true; beep(); rang = true; }
  });
  all<HTMLElement>("[data-tleft]").forEach(el => {
    const k = el.dataset.tleft!;
    const end = state().timers[k];
    if (end && end > now) el.textContent = fmtTime((end - now) / 1000);
  });
  const bt = one("[data-bartime]");
  if (bt) {
    const runs = Object.entries(state().timers).filter(([, e]) => e > now).sort((a, b) => a[1] - b[1]);
    if (runs.length) bt.textContent = fmtTime((runs[0]![1] - now) / 1000);
    else if (bt.textContent !== "Done") renderTimerBar();
  }
  if (rang) { paintTimers(); syncWake(); }
}

export function startTimer(key: string, sec: number): void {
  state().timers[key] = Date.now() + sec * 1000;
  delete fired[key];
  ensureAudio();
  save();
  paintTimers();
  syncWake();
}

export function cancelTimer(key: string): void {
  delete state().timers[key];
  delete fired[key];
  save();
  paintTimers();
  syncWake();
}

/** Marks already-expired timers as rung, so a reload doesn't beep at you. */
export function seedFired(): void {
  Object.entries(state().timers).forEach(([k, e]) => { if (e <= Date.now()) fired[k] = true; });
}

export const clearFired = () => Object.keys(fired).forEach(k => delete fired[k]);
