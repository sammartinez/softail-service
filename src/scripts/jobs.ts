/* The Jobs screen.

   Everything here is prerendered, so this file sets attributes rather than
   building markup: which detail is open, which steps are ticked, the counters,
   the due lines and the chips. */

import { rt } from "@lib/runtime";
import { state, save, GROUPS } from "@lib/state";
import { dueStatus, dueText, applies } from "@lib/due";
import { jobById, shortCat } from "@lib/format";
import { CHECK } from "@lib/icons";
import { $, all, one, show, press, text } from "./dom";
import { paintTimers } from "./timers";

const progress = (id: string) =>
  (jobById(id)?.steps ?? []).filter((_, i) => state().done[`${id}:${i}`]).length;

export function paintJobList(): void {
  const g = state().jgroup;
  let visible = 0;
  all<HTMLElement>("#jobList [data-open]").forEach(card => {
    const job = jobById(card.dataset.open!)!;
    /* The fuel filter is CSS, so only the group filter is decided here. */
    const inGroup = g === "All" || job.group === g;
    card.hidden = !inGroup;
    if (inGroup && applies(job)) visible++;

    const d = dueStatus(job);
    const chip = one(`[data-duechip="${job.id}"]`, card);
    if (chip) {
      const due = d.s === "now" || d.s === "never";
      const soon = d.s === "soon";
      show(chip, due || soon);
      chip.className = due ? "chip overdue" : "chip";
      text(chip, due ? "Due" : "Soon");
    }
    const n = progress(job.id);
    const total = job.steps.length;
    const prog = one(`[data-progress="${job.id}"]`, card);
    if (prog) {
      show(prog, n > 0);
      prog.className = n === total ? "chip ok" : "chip";
      text(prog, `${n} of ${total} done`);
    }
  });
  show(one("[data-nojobs]"), visible === 0);
  all("#jobSeg [data-g]").forEach(b => press(b, (b as HTMLElement).dataset.g === g));
}

export function paintJobDetail(): void {
  const open = state().job;
  show($("jobDetail"), !!open);
  show($("jobList"), !open);
  show($("jobSeg"), !open);

  all<HTMLElement>("[data-job-detail]").forEach(el => {
    el.hidden = el.dataset.jobDetail !== open;
  });
  if (!open) return;

  const job = jobById(open);
  if (!job) { state().job = null; save(); paintJobDetail(); return; }

  /* Only own the heading while Jobs is the view on screen, or a job title
     ends up above the Specs tab. */
  if (state().view === "jobs") text($("viewTitle"), job.title);

  const root = one(`[data-job-detail="${job.id}"]`);
  if (!root) return;

  const d = dueStatus(job);
  const due = one(`[data-due="${job.id}"]`, root);
  if (due) {
    show(due, d.s !== "asneeded");
    const urgent = d.s === "now" || d.s === "never";
    due.className = urgent ? "small" : "small muted";
    due.innerHTML = "";
    const t = document.createTextNode(dueText(d));
    if (urgent) { const b = document.createElement("b"); b.appendChild(t); due.appendChild(b); }
    else due.appendChild(t);
  }

  const n = progress(job.id);
  const total = job.steps.length;
  text(one(`[data-count="${job.id}"]`, root), `${n} of ${total}`);
  show(one("[data-clearsteps]", root), n > 0);
  show(one("[data-allticked]", root), n === total);

  job.steps.forEach((_, i) => {
    const key = `${job.id}:${i}`;
    const el = one(`[data-toggle="${CSS.escape(key)}"]`, root);
    if (!el) return;
    const done = !!state().done[key];
    const next = !done && i === job.steps.findIndex((_, x) => !state().done[`${job.id}:${x}`]);
    el.className = "step" + (done ? " done" : next ? " next" : "");
    const box = one(".num", el);
    if (box) {
      box.setAttribute("aria-checked", String(done));
      if (done) box.innerHTML = CHECK;
      else box.textContent = String(i + 1);
    }
  });

  /* What you need: the picked product per category, and the tools ticked. */
  rt().parts.filter(g => (g.jobs || []).indexOf(job.id) > -1).forEach(g => {
    const slot = one(`[data-pick="${CSS.escape(g.cat)}"]`, root);
    if (!slot) return;
    const picked = g.items.find(it => state().have[it.id]);
    slot.innerHTML = "";
    if (picked) {
      slot.appendChild(document.createTextNode(" — "));
      const b = document.createElement("b");
      b.textContent = picked.name;
      slot.appendChild(b);
    } else {
      const s = document.createElement("span");
      s.className = "muted";
      s.textContent = "(nothing picked yet)";
      slot.appendChild(document.createTextNode(" "));
      slot.appendChild(s);
    }
  });
  all<HTMLElement>("[data-havetool]", root).forEach(el => {
    show(el, !!state().tools[el.dataset.havetool!]);
  });

  paintTimers();
}

export function openJob(id: string): void {
  if (!jobById(id)) return;
  state().job = id;
  save();
  paintJobDetail();
}

export function closeJob(): void {
  state().job = null;
  save();
  text($("viewTitle"), "Jobs");
  paintJobList();
  paintJobDetail();
}

export function setGroup(g: string): void {
  if (GROUPS.indexOf(g) < 0) return;
  state().jgroup = g;
  save();
  paintJobList();
}

export function toggleStep(key: string): void {
  if (state().done[key]) delete state().done[key];
  else state().done[key] = true;
  save();
  paintJobDetail();
  paintJobList();
}

export function clearSteps(jobId: string): void {
  const job = jobById(jobId);
  if (!job) return;
  job.steps.forEach((_, i) => delete state().done[`${jobId}:${i}`]);
  save();
  paintJobDetail();
  paintJobList();
}
