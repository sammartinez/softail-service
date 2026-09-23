/* The Log screen: history, saving an entry, backup, start fresh.

   The job checklist is prerendered; only the tick for a job Sam jumped here
   from is set. History stays a builder — it is entirely his saved entries. */

import { state, save, repair, setState, BLANK } from "@lib/state";
import { partsUsed } from "@lib/shop";
import { miles, fmtDate, today, jobById, esc } from "@lib/format";
import { $, all, one, show, text, reduceMotion } from "./dom";

let justLogged = false;
/* #logSaved is a live region: only replace its markup when it changes, or
   every repaint would read "Logged" out again. */
let savedHtml = "";
let logPrefill: string | null = null;

export const prefillLog = (jobId: string) => { logPrefill = jobId; };

export function renderLog(): void {
  const sorted = [...state().log].sort(
    (a, b) => b.miles - a.miles || String(b.date).localeCompare(String(a.date)));

  const saved = justLogged
    ? '<div class="card" style="border-color:var(--green-line);background:var(--green-bg)"><p style="margin:0;font-weight:700;color:var(--green-ink)">Logged</p>' +
      '<p class="small" style="margin:4px 0 0;color:var(--green-ink)">Clear the checklists so they are ready for next time?</p>' +
      '<div class="btnrow"><button class="btn go" data-fresh="1">Start fresh</button></div></div>'
    : "";
  if (saved !== savedHtml) { $("logSaved")!.innerHTML = saved; savedHtml = saved; }

  const fDate = $("fDate") as HTMLInputElement;
  const fOdo = $("fOdo") as HTMLInputElement;
  if (!fDate.value) fDate.value = today();
  if (!fOdo.value && state().odo) fOdo.value = state().odo;

  /* The checklist is static markup; only the prefill tick is ours to set. */
  all<HTMLInputElement>(".fJob").forEach(c => {
    c.checked = logPrefill === c.value;
  });
  logPrefill = null;

  (
$("fuelSel") as HTMLSelectElement).value = state().fuel;

  $("history")!.innerHTML = sorted.length
    ? sorted.map(en =>
        '<div class="card"><div class="rowline"><span style="font-family:var(--cond);font-size:23px;font-weight:700">' +
        esc(miles(en.miles)) + "</span>" +
        '<span class="xs muted">' + esc(fmtDate(en.date)) + "</span></div>" +
        '<p class="small" style="margin:4px 0 0">' +
        esc(en.jobs.map(id => jobById(id)?.title || id).join(", ") || "No jobs recorded") + "</p>" +
        (en.parts?.length ? '<p class="xs muted" style="margin:4px 0 0">' + esc(en.parts.join(", ")) + "</p>" : "") +
        (en.notes ? '<p class="small" style="margin:8px 0 0;background:var(--tint);border-radius:10px;padding:8px 11px">' + esc(en.notes) + "</p>" : "") +
        '<div class="btnrow"><button class="btn sm" data-del="' + esc(String(en.id)) + '">Delete</button></div></div>')
        .join("")
    : '<p class="hint">Nothing logged yet. Save a service here and the Due screen starts working.</p>';
}

/** Returns true when the entry saved, so the caller can re-render. */
export function saveEntry(): boolean {
  const fOdo = $("fOdo") as HTMLInputElement;
  const raw = fOdo.value.trim();
  const m = Number(raw);
  const jobs = all<HTMLInputElement>(".fJob:checked").map(c => c.value);
  const err = $("fErr")!;
  /* Unhide before writing the text, so the alert role announces it, and put
     focus on what needs fixing. */
  const fail = (msg: string, at: HTMLElement | null) => {
    err.hidden = false;
    err.textContent = msg;
    at?.focus();
    return false;
  };
  const badOdo = !raw || !Number.isInteger(m) || m < 0 || m > 999999;
  fOdo.setAttribute("aria-invalid", String(badOdo));
  if (badOdo) return fail("Enter the odometer reading in whole miles.", fOdo);
  if (!jobs.length) {
    const first = all<HTMLInputElement>(".fJob").find(c => c.offsetParent !== null) || one<HTMLInputElement>(".fJob");
    return fail("Tick at least one job you did.", first);
  }
  err.hidden = true;
  state().log.push({
    id: Date.now(),
    date: ($("fDate") as HTMLInputElement).value || today(),
    miles: m,
    jobs,
    parts: partsUsed(jobs),
    notes: ($("fNote") as HTMLTextAreaElement).value.trim(),
  });
  /* Back-filling an old service must not wind the current odometer backwards. */
  if (!state().odo || m > Number(state().odo)) state().odo = String(m);
  save();
  fOdo.value = "";
  ($("fNote") as HTMLTextAreaElement).value = "";
  ($("fDate") as HTMLInputElement).value = today();
  justLogged = true;
  return true;
}

export function deleteEntry(id: string): void {
  state().log = state().log.filter(x => String(x.id) !== id);
  save();
}

export function startFresh(): void {
  state().done = {};
  state().timers = {};
  state().tools = {};
  state().bought = {};
  justLogged = false;
  save();
}

export function exportBackup(): void {
  const blob = new Blob([JSON.stringify(state(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "softail-service-" + today() + ".json";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  text($("ioMsg"), "Backup saved to your downloads.");
}

export function importBackup(file: File, done: () => void): void {
  const r = new FileReader();
  r.onload = () => {
    try {
      setState(repair(JSON.parse(String(r.result))));
      save();
      text($("ioMsg"), "Backup restored.");
      done();
    } catch {
      text($("ioMsg"), "That file could not be read as a backup.");
    }
  };
  r.readAsText(file);
}

export const scrollTop = () =>
  window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
