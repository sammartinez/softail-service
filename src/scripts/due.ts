/* The Due screen.

   This one stays a builder. Which bucket a job lands in, and whether a bucket
   exists at all, depends on the odometer and the log — there is no prerendered
   shape for "three jobs overdue". The rows are small, so it is cheap.

   The every-ride walk-around is prerendered in index.astro; it needs nothing
   from state. */

import { activeJobs, dueStatus, dueText } from "@lib/due";
import { state } from "@lib/state";
import { miles, esc } from "@lib/format";
import type { RtJob } from "@lib/runtime";
import type { Due } from "@lib/due";
import { $, text } from "./dom";

/* No border here: .duerow draws its own left-inset hairline as a
   pseudo-element, which an inline `border:0` cannot flatten. */
const row = (job: RtJob, d: Due) =>
  '<button class="duerow ' + (d.s === "now" || d.s === "never" ? "now" : d.s === "soon" ? "soon" : "ok") +
  '" data-job="' + job.id + '" style="width:100%;text-align:left;border:0;background:none">' +
  '<span class="dot"></span><span class="grow"><span class="lbl">' + esc(job.title) + "</span>" +
  '<span class="when">' + esc(dueText(d)) + "</span></span>" +
  '<span class="xs muted nowrap">' + (job.mins ? job.mins + " min" : "") + "</span></button>";

export function renderDue(): void {
  const odoInput = $("odoNow") as HTMLInputElement | null;
  if (odoInput && document.activeElement !== odoInput) odoInput.value = state().odo || "";

  const jobs = activeJobs().map(j => ({ j, d: dueStatus(j) }));
  const bucket = (codes: string[]) =>
    jobs.filter(x => codes.indexOf(x.d.s) > -1)
      .sort((a, b) => (a.d.left == null ? -1e9 : a.d.left) - (b.d.left == null ? -1e9 : b.d.left));

  const now = bucket(["now"]), never = bucket(["never"]);
  const soon = bucket(["soon"]), ok = bucket(["ok"]);
  const any = bucket(["asneeded"]).filter(x => x.j.at.indexOf("ride") < 0);

  /* "Overdue" and "we have no idea" are different things, so they get
     different cards. Everything reads as never logged on a fresh install. */
  let h = "";
  if (now.length) {
    h += '<div class="card"><h2 style="margin-top:0">Due now<span class="badge" style="margin-left:8px">' +
      now.length + "</span></h2>" + now.map(x => row(x.j, x.d)).join("") + "</div>";
  } else if (state().odo && state().log.length) {
    h += '<div class="card"><h2 style="margin-top:0">Due now</h2><p class="hint" style="margin:0">Nothing overdue.</p></div>';
  }
  if (never.length) {
    const open = state().log.length === 0;
    h += '<details class="acc"' + (open ? " open" : "") + "><summary>Not logged yet (" +
      never.length + ')</summary><div class="body">' +
      '<p class="hint" style="margin-top:0">' + (state().log.length
        ? "These have no entry in your log, so the app can't tell when they were last done."
        : "Nothing is logged yet, so everything lands here. Log what you already know — even a rough mileage for the last oil change — and the Due list starts working.") +
      "</p>" + never.map(x => row(x.j, x.d)).join("") +
      '<div class="btnrow"><button class="btn" data-jump-log="1">Open the log</button></div></div></details>';
  }
  $("dueNow")!.innerHTML = h;

  $("dueSoon")!.innerHTML = soon.length
    ? '<div class="card"><h2 style="margin-top:0">Coming up</h2>' + soon.map(x => row(x.j, x.d)).join("") + "</div>"
    : "";

  $("dueRest")!.innerHTML =
    (ok.length ? '<details class="acc"><summary>Not due yet (' + ok.length + ')</summary><div class="body">' + ok.map(x => row(x.j, x.d)).join("") + "</div></details>" : "") +
    (any.length ? '<details class="acc"><summary>As needed (' + any.length + ')</summary><div class="body">' + any.map(x => row(x.j, x.d)).join("") + "</div></details>" : "");

  renderHeader();
}

export function renderHeader(): void {
  text($("fuelLabel"), state().fuel === "efi" ? "EFI" : "Carb");
  const o = $("odoLine");
  if (!o) return;
  if (!state().odo) {
    o.innerHTML = "<span>Add your odometer to see what's due</span>";
    return;
  }
  const n = activeJobs().filter(j => dueStatus(j).s === "now").length;
  o.innerHTML = "<b>" + esc(miles(state().odo)) + "</b> <span>" +
    (n ? n + " job" + (n > 1 ? "s" : "") + " due" : "nothing overdue") + "</span>";
}
