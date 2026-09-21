/* Softail Service. Vanilla JS, no build step, no framework.
   Data comes from data-jobs.js and data-ref.js. */

/* ---------------- helpers ---------------- */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const today = () => new Date().toISOString().slice(0, 10);
const miles = n => Number(n).toLocaleString("en-US") + " mi";
const money = n => "$" + n.toFixed(2);
const fmtTime = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const fmtDate = d => { const p = String(d).split("-"); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : d; };
const jobById = id => JOBS.find(j => j.id === id);
const toolById = id => { for (const g of TOOLS) for (const t of g.items) if (t.id === id) return t; return null; };
const findItem = id => { for (const g of PARTS) for (const it of g.items) if (it.id === id) return it; return null; };
const groupOf = id => PARTS.find(g => g.items.some(it => it.id === id));
const shortCat = c => c.replace(/ \(.*\)/, "");

const CHECK = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>';
const PIN = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>';
const CLOCK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4"/></svg>';
const WRENCH = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';

/* ---------------- state ---------------- */
const KEY = "hd-maint-v1", OLDKEY = "softail-oil-v1";
const BLANK = () => ({ v: 2, odo: "", fuel: "carb", done: {}, have: {}, linked: {}, bought: {}, prices: {}, tools: {}, timers: {}, log: [], job: null, jgroup: "All", shop: "list", ref: "specs", store: "All", view: "due" });
let state = BLANK();

/* The saved fields that decide which panel is on screen. They live up here
   because repair() checks against them, and repair() runs on load before
   anything else. A value outside these lists hides every panel on that
   screen, which is how a hand-edited backup turned Reference into a bare
   segmented control over empty space. */
const VIEWS = { due: "What's due", jobs: "Jobs", shop: "Parts and tools", log: "Service log", ref: "Reference" };
const GROUPS = ["All", "Fluids", "Checks", "Tune-up", "Adjust", "Lube", "Season"];
const TABS = {
  view: Object.keys(VIEWS),
  shop: ["list", "parts", "tools"],
  ref: ["specs", "torque", "fix", "codes"],
  jgroup: GROUPS,
  store: STORES
};

function repair(s) {
  const b = BLANK();
  if (!s || typeof s !== "object") return b;
  const out = Object.assign(b, s);
  ["done", "have", "linked", "bought", "prices", "tools", "timers"].forEach(k => {
    if (!out[k] || typeof out[k] !== "object" || Array.isArray(out[k])) out[k] = {};
  });
  if (!Array.isArray(out.log)) out.log = [];
  out.log = out.log.filter(e => e && typeof e === "object").map(e => ({
    id: e.id || Date.now() + Math.random(),
    date: e.date || today(),
    miles: Number(e.miles) || 0,
    jobs: Array.isArray(e.jobs) ? e.jobs.filter(j => jobById(j)) : [],
    parts: Array.isArray(e.parts) ? e.parts : [],
    notes: e.notes || ""
  }));
  if (out.fuel !== "efi") out.fuel = "carb";
  /* `out` is `b` — Object.assign mutates its target — so the fallbacks have to
     come from a second blank, not from `b`, which now holds the saved values. */
  const def = BLANK();
  Object.keys(TABS).forEach(k => { if (TABS[k].indexOf(out[k]) < 0) out[k] = def[k]; });
  // one pick per pick-one category
  PARTS.forEach(g => { if (!g.pick) return; let f = false; g.items.forEach(it => { if (out.have[it.id]) { if (f) delete out.have[it.id]; else f = true; } }); });
  return out;
}

/* Old oil-change app's saved data, if it was served from this same address. */
function migrate(old) {
  const s = BLANK();
  ["have", "linked", "bought", "prices", "tools", "odo"].forEach(k => { if (old[k]) s[k] = old[k]; });
  if (Array.isArray(old.log)) s.log = old.log.map(e => {
    const txt = (Array.isArray(e.done) ? e.done.join(" ") : "").toLowerCase();
    const jobs = [];
    if (/engine|oil and filter/.test(txt)) jobs.push("engine-oil");
    if (/trans/.test(txt)) jobs.push("trans-oil");
    if (/primary/.test(txt)) jobs.push("primary-oil");
    return { id: e.id, date: e.date, miles: e.miles, jobs, parts: e.parts || [], notes: e.notes || "" };
  });
  s.migrated = true;
  return s;
}

(function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { }
  if (raw) { state = repair(raw); return; }
  let old = null;
  try { old = JSON.parse(localStorage.getItem(OLDKEY) || "null"); } catch (e) { }
  state = repair(old ? migrate(old) : null);
})();

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { } }

/* ---------------- audio, vibration, wake lock ---------------- */
let actx = null, wake = null; const fired = {};
function ensureAudio() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (e) { } }
function beep() {
  try {
    if (actx) [0, .35, .7].forEach(t => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
      const s = actx.currentTime + t;
      g.gain.setValueAtTime(.0001, s); g.gain.exponentialRampToValueAtTime(.3, s + .02); g.gain.exponentialRampToValueAtTime(.0001, s + .25);
      o.start(s); o.stop(s + .3);
    });
  } catch (e) { }
  try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (e) { }
}
async function syncWake() {
  const any = Object.values(state.timers).some(end => end > Date.now());
  try {
    if (any && !wake && navigator.wakeLock) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); }
    else if (!any && wake) { await wake.release(); wake = null; }
  } catch (e) { }
}
Object.entries(state.timers).forEach(([k, end]) => { if (end <= Date.now()) fired[k] = true; });
document.addEventListener("pointerdown", ensureAudio, { once: true });
document.addEventListener("keydown", ensureAudio, { once: true });

/* ---------------- job / schedule maths ---------------- */
const intervalOf = k => (INTERVALS.find(i => i.k === k) || {}).miles || 0;

function jobInterval(job) {
  const rec = job.at.filter(k => k !== "ride" && k !== "i500").map(intervalOf).filter(Boolean);
  if (rec.length) return Math.min.apply(null, rec);
  return job.at.includes("i500") ? 500 : 0;
}
function applies(job) { return !job.fuel || job.fuel === state.fuel; }
/* A job with no mileage interval is either a pre-ride check or genuinely
   as-needed. Calling a pre-ride check "as needed" reads as optional. */
function intervalLabel(job) {
  const m = jobInterval(job);
  if (m) return "every " + miles(m);
  return job.at.indexOf("ride") > -1 ? "every ride" : "as needed";
}
function activeJobs() { return JOBS.filter(applies); }

function lastDone(jobId) {
  let best = null;
  state.log.forEach(e => { if (e.jobs.indexOf(jobId) > -1 && (!best || e.miles > best.miles)) best = e; });
  return best;
}
/* status: now | soon | ok | never | asneeded */
function dueStatus(job) {
  const every = jobInterval(job);
  if (!every) return { s: "asneeded", every: 0 };
  const odo = Number(state.odo);
  const last = lastDone(job.id);
  if (!last) return { s: "never", every: every, last: null };
  const next = last.miles + every;
  if (!state.odo || !Number.isFinite(odo)) return { s: "ok", every: every, last: last, next: next, left: null };
  const left = next - odo;
  const window = Math.max(250, Math.round(every * 0.1));
  return { s: left <= 0 ? "now" : left <= window ? "soon" : "ok", every: every, last: last, next: next, left: left };
}
function dueText(d) {
  if (d.s === "never") return "Never logged. Due every " + miles(d.every) + ".";
  if (d.left === null) return "Last done at " + miles(d.last.miles) + ". Enter your odometer above.";
  if (d.s === "now") return d.left === 0 ? "Due now." : "Overdue by " + miles(-d.left) + ".";
  return "In " + miles(d.left) + ", at " + miles(d.next) + ".";
}

/* ---------------- view switching ---------------- */
function setView(v) {
  state.view = v;
  Object.keys(VIEWS).forEach(k => { $("view-" + k).hidden = k !== v; });
  $("viewTitle").textContent = state.job && v === "jobs" ? (jobById(state.job) || {}).title || VIEWS[v] : VIEWS[v];
  document.querySelectorAll("nav.bar button").forEach(b => {
    if (b.dataset.view === v) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  save();
}
document.querySelector("nav.bar").addEventListener("click", e => {
  const b = e.target.closest("button[data-view]"); if (!b) return;
  if (b.dataset.view === "jobs") state.job = null;
  setView(b.dataset.view); renderAll();
  window.scrollTo({ top: 0, behavior: "auto" });
});

/* ---------------- header ---------------- */
function renderHeader() {
  $("bikeLine").textContent = BIKE.year + " " + BIKE.name + " · " + BIKE.engine + " · " + (state.fuel === "efi" ? "EFI" : "Carb");
  const o = $("odoLine");
  if (state.odo) {
    const n = activeJobs().filter(j => dueStatus(j).s === "now").length;
    o.innerHTML = "<b>" + esc(miles(state.odo)) + "</b> <span>" + (n ? n + " job" + (n > 1 ? "s" : "") + " due" : "nothing overdue") + "</span>";
  } else o.innerHTML = "<span>Add your odometer to see what's due</span>";
}

/* ---------------- DUE ---------------- */
function dueRow(job, d) {
  const cls = d.s === "now" || d.s === "never" ? "now" : d.s === "soon" ? "soon" : "ok";
  /* No border here: .duerow draws its own left-inset hairline as a
     pseudo-element, which an inline `border:0` cannot flatten. */
  return '<button class="duerow ' + cls + '" data-job="' + job.id + '" style="width:100%;text-align:left;border:0;background:none">' +
    '<span class="dot"></span><span class="grow"><span class="lbl">' + esc(job.title) + '</span>' +
    '<span class="when">' + esc(dueText(d)) + '</span></span>' +
    '<span class="xs muted nowrap">' + (job.mins ? job.mins + " min" : "") + '</span></button>';
}
function renderDue() {
  if (document.activeElement !== $("odoNow")) $("odoNow").value = state.odo || "";
  const jobs = activeJobs().map(j => ({ j: j, d: dueStatus(j) }));
  const bucket = s => jobs.filter(x => s.indexOf(x.d.s) > -1).sort((a, b) => (a.d.left == null ? -1e9 : a.d.left) - (b.d.left == null ? -1e9 : b.d.left));

  const now = bucket(["now"]), never = bucket(["never"]), soon = bucket(["soon"]), ok = bucket(["ok"]);
  const any = bucket(["asneeded"]).filter(x => x.j.at.indexOf("ride") < 0);

  /* "Overdue" and "we have no idea" are different things, so they get
     different cards. Everything reads as never logged on a fresh install. */
  let h = "";
  if (now.length) h += '<div class="card"><h2 style="margin-top:0">Due now<span class="badge" style="margin-left:8px">' + now.length + '</span></h2>' + now.map(x => dueRow(x.j, x.d)).join("") + '</div>';
  else if (state.odo && state.log.length) h += '<div class="card"><h2 style="margin-top:0">Due now</h2><p class="hint" style="margin:0">Nothing overdue.</p></div>';
  if (never.length) {
    const open = state.log.length === 0;
    h += '<details class="acc"' + (open ? " open" : "") + '><summary>Not logged yet (' + never.length + ')</summary><div class="body">' +
      '<p class="hint" style="margin-top:0">' + (state.log.length
        ? 'These have no entry in your log, so the app can\'t tell when they were last done.'
        : 'Nothing is logged yet, so everything lands here. Log what you already know — even a rough mileage for the last oil change — and the Due list starts working.') + '</p>' +
      never.map(x => dueRow(x.j, x.d)).join("") +
      '<div class="btnrow"><button class="btn" data-jump-log="1">Open the log</button></div></div></details>';
  }
  $("dueNow").innerHTML = h;

  $("dueSoon").innerHTML = soon.length
    ? '<div class="card"><h2 style="margin-top:0">Coming up</h2>' + soon.map(x => dueRow(x.j, x.d)).join("") + '</div>' : "";

  $("dueRest").innerHTML =
    (ok.length ? '<details class="acc"><summary>Not due yet (' + ok.length + ')</summary><div class="body">' + ok.map(x => dueRow(x.j, x.d)).join("") + '</div></details>' : "") +
    (any.length ? '<details class="acc"><summary>As needed (' + any.length + ')</summary><div class="body">' + any.map(x => dueRow(x.j, x.d)).join("") + '</div></details>' : "");

  const ride = activeJobs().filter(j => j.at.indexOf("ride") > -1);
  $("dueRide").innerHTML = ride.map(j =>
    '<button class="duerow ok" data-job="' + j.id + '" style="width:100%;text-align:left;border:0;background:none">' +
    '<span class="dot"></span><span class="grow"><span class="lbl">' + esc(j.title) + '</span>' +
    '<span class="when">' + esc(j.lede) + '</span></span></button>').join("");

  renderHeader();
}
$("view-due").addEventListener("click", e => {
  if (e.target.closest("[data-jump-log]")) { setView("log"); renderLog(); window.scrollTo({ top: 0, behavior: "auto" }); return; }
  const b = e.target.closest("[data-job]"); if (!b) return;
  openJob(b.dataset.job);
});
$("odoNow").addEventListener("input", () => {
  const v = $("odoNow").value.trim();
  state.odo = v === "" ? "" : String(Math.max(0, Math.floor(Number(v) || 0)));
  save(); renderDue();
});

/* ---------------- bike diagram ---------------- */
/* The bike is drawn once facing right — stand on the right of a bike and its
   front wheel is on your right — then mirrored for the left-side view, so every
   part is positioned once and the two sides can't drift apart.

   Scale is 3.1 units to the inch off a 2003 FLSTC: ground at y=200, rear axle
   at x=104 and front axle at x=304, which is the 64.5 in. wheelbase. Tyre
   radius 39.5 is a 16 in. rim on an MT90. Crank centre sits at (186, 166),
   11 in. up; the cylinders are the 45-degree V either side of it; seat top is
   27 in. at y=116. Mirroring is about x=200, so the viewBox spans 44 to 356 to
   frame both views identically.

   Parts that come off before you work on anything — saddlebag, windshield —
   and the ones out of sight under the seat are drawn dashed. */
let spot = null;
const DW = 400;

/* One laced 16 in. wheel with a whitewall, centred on the axle line. */
function wheel(cx) {
  let sp = "";
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, c = Math.cos(a), s = Math.sin(a);
    sp += "M" + (cx + 7 * c).toFixed(1) + " " + (161 + 7 * s).toFixed(1) +
      "L" + (cx + 22 * c).toFixed(1) + " " + (161 + 22 * s).toFixed(1);
  }
  return '<circle cx="' + cx + '" cy="161" r="35" fill="none" stroke="#475569" stroke-width="9"/>' +
    '<circle cx="' + cx + '" cy="161" r="30" fill="#fff"/>' +
    '<circle cx="' + cx + '" cy="161" r="23" fill="#F8FAFC" stroke="#64748B" stroke-width="2"/>' +
    '<path d="' + sp + '" fill="none" stroke="#94A3B8" stroke-width="1.3"/>' +
    '<circle cx="' + cx + '" cy="161" r="6.5" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>';
}

/* A valanced fender: the band of steel between radius ri and ro, wrapped from
   angle a1 to a2 measured the usual way, 0 straight ahead and 90 straight up. */
function fender(cx, ri, ro, a1, a2) {
  const p = (r, a) => (cx + r * Math.cos(a * Math.PI / 180)).toFixed(1) + " " + (161 - r * Math.sin(a * Math.PI / 180)).toFixed(1);
  const big = a2 - a1 > 180 ? 1 : 0;
  return '<path d="M' + p(ro, a1) + "A" + ro + " " + ro + " 0 " + big + " 0 " + p(ro, a2) +
    "L" + p(ri, a2) + "A" + ri + " " + ri + " 0 " + big + " 1 " + p(ri, a1) +
    'Z" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>';
}

/* One finned cylinder and its rocker box, leaned off vertical by deg. Kept
   short enough that both rocker boxes stay clear of the tank's lower edge —
   on the bike they tuck just under it, and a buried one can't be pointed at. */
function cyl(x, deg) {
  let fins = "";
  for (let y = 130; y <= 146; y += 4) fins += "M" + (x - 12) + " " + y + "h24";
  return '<g transform="rotate(' + deg + ' ' + x + ' 147)">' +
    '<rect x="' + (x - 12) + '" y="126" width="24" height="22" fill="#F1F5F9" stroke="#64748B" stroke-width="1.5"/>' +
    '<path d="' + fins + '" fill="none" stroke="#64748B" stroke-width="1" opacity="0.6"/>' +
    '<rect x="' + (x - 17) + '" y="114" width="34" height="13" rx="3" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>' +
    '</g>';
}

/* A frame tube: a dark casing with a lighter core, so tubing reads as tubing
   instead of as a flat bar the same colour as everything it runs past. */
function tube(d, w) {
  return '<path d="' + d + '" fill="none" stroke="#64748B" stroke-width="' + (w + 2) + '" stroke-linecap="round"/>' +
    '<path d="' + d + '" fill="none" stroke="#DDE4EC" stroke-width="' + w + '" stroke-linecap="round"/>';
}

/* Front of the crankcase. Drawn on both sides: the manual's text puts the
   filter on the left and its photos on the right, so it's marked on both. */
const FILTER = '<g transform="rotate(-24 228 168)"><rect x="219" y="156" width="18" height="24" rx="6" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5"/></g>';

/* Everything you see from either side. */
const BASE =
  '<ellipse cx="200" cy="203" rx="148" ry="4" fill="#E2E8F0"/>' +
  wheel(104) + wheel(304) +
  /* valanced fenders, deep skirts front and rear */
  fender(104, 42, 50, 4, 190) + fender(304, 41, 48, -12, 182) +
  /* frame: backbone, seat post, front downtube into the cradle, fender rail */
  tube("M268 106L150 122", 6) +
  tube("M150 122L142 178", 5) +
  tube("M264 112C256 140 250 162 240 178L134 182", 5) +
  tube("M152 126L106 140", 4) +
  /* swing arm */
  '<path d="M152 182L152 168L104 155L104 167Z" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5"/>' +
  /* crankcase and the 45-degree V */
  '<rect x="152" y="146" width="68" height="36" rx="10" fill="#F8FAFC" stroke="#64748B" stroke-width="1.5"/>' +
  cyl(180, -22.5) + cyl(192, 22.5) +
  /* fuel tank with the dash console on top */
  '<path d="M176 104C196 90 230 88 248 95C253 101 250 108 241 112C220 119 192 120 178 116C170 113 170 108 176 104Z" fill="#fff" stroke="#64748B" stroke-width="1.5"/>' +
  '<ellipse cx="212" cy="94" rx="15" ry="3.5" fill="#CBD5E1"/>' +
  '<circle cx="214" cy="91" r="4.5" fill="#F1F5F9" stroke="#64748B" stroke-width="1.2"/>' +
  /* two-up seat: rider dish then the pillion over the fender */
  '<path d="M178 118C168 129 152 134 138 133C126 132 116 121 108 117C102 119 102 129 110 133C134 141 166 133 179 125Z" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5"/>' +
  /* oil tank and battery, both out of sight under the seat */
  '<rect x="110" y="118" width="52" height="34" rx="8" fill="none" stroke="#64748B" stroke-width="1.4" stroke-dasharray="4 3"/>' +
  '<rect x="134" y="126" width="24" height="19" rx="2" fill="#F1F5F9" stroke="#64748B" stroke-width="1.3" stroke-dasharray="3 2"/>' +
  '<path d="M139 126v-3M153 126v-3" stroke="#64748B" stroke-width="2.4" stroke-linecap="round"/>' +
  '<circle cx="157" cy="119" r="4.5" fill="#E2E8F0" stroke="#64748B" stroke-width="1.3" stroke-dasharray="3 2"/>' +
  /* steering head, fork tubes and sliders, triple trees */
  tube("M262 94L274 118", 9) +
  tube("M266 98L304 159", 6) +
  tube("M288 133L304 159", 11) +
  tube("M257 104L275 92", 5) +
  tube("M253 94L271 82", 4) +
  /* headlamp, passing lamp, handlebar */
  '<circle cx="284" cy="92" r="11" fill="#fff" stroke="#64748B" stroke-width="1.5"/>' +
  '<path d="M282 118L270 114" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>' +
  '<circle cx="290" cy="120" r="6" fill="#fff" stroke="#64748B" stroke-width="1.5"/>' +
  tube("M262 88L259 74C255 65 246 63 236 68", 4) +
  '<path d="M240 66L224 73" stroke="#64748B" stroke-width="7" stroke-linecap="round"/>' +
  /* rider and passenger floorboards */
  '<rect x="204" y="177" width="28" height="6" rx="3" fill="#7E8EA5"/>' +
  '<rect x="140" y="180" width="24" height="6" rx="3" fill="#7E8EA5"/>' +
  /* windshield and saddlebag: dashed, they come off first */
  '<path d="M258 100L270 106M292 102L278 110" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>' +
  '<path d="M256 102C248 82 246 62 250 48L284 52C283 66 288 82 294 102Z" fill="#F8FAFC" fill-opacity="0.7" stroke="#64748B" stroke-width="1.4" stroke-dasharray="5 4"/>' +
  '<path d="M68 126C68 122 72 120 78 120L130 118C136 118 139 121 139 126L137 152C137 158 131 162 123 162L83 162C75 162 68 157 68 150Z" fill="none" stroke="#64748B" stroke-width="1.4" stroke-dasharray="5 4"/>' +
  '<path d="M70 133L138 130" fill="none" stroke="#64748B" stroke-width="1.2" stroke-dasharray="4 3"/>';

/* Right side: transmission, cam chest, exhaust, air cleaner. */
const SIDE_R =
  '<rect x="116" y="148" width="42" height="32" rx="7" fill="#fff" stroke="#64748B" stroke-width="1.5"/>' +
  '<circle cx="150" cy="155" r="7" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>' +
  '<circle cx="204" cy="164" r="14" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>' +
  /* the oil tank drain line runs down inboard of the exhaust */
  '<path d="M130 150C130 168 128 180 128 190" fill="none" stroke="#64748B" stroke-width="3"/>' +
  /* front and rear headers into staggered shorty duals */
  tube("M214 122C230 134 232 150 224 160C218 166 208 167 198 166", 6) +
  tube("M170 126C158 142 156 160 162 172C166 179 172 181 178 180", 6) +
  '<rect x="98" y="160" width="88" height="13" rx="6.5" fill="#fff" stroke="#64748B" stroke-width="1.5"/>' +
  '<rect x="86" y="174" width="86" height="13" rx="6.5" fill="#fff" stroke="#64748B" stroke-width="1.5"/>' +
  '<path d="M108 166h68M96 180h66" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/>' +
  '<circle cx="128" cy="191" r="4" fill="#CBD5E1" stroke="#64748B" stroke-width="1.3"/>' +
  /* rear master cylinder and brake pedal */
  '<rect x="190" y="158" width="12" height="17" rx="3" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5"/>' +
  '<path d="M196 175L214 181" stroke="#64748B" stroke-width="3" stroke-linecap="round"/>' +
  /* front master cylinder, inboard of the right grip */
  '<g transform="rotate(-24 248 66)"><rect x="240" y="60" width="17" height="12" rx="3" fill="#CBD5E1" stroke="#64748B" stroke-width="1.4"/></g>' +
  /* the air cleaner sits in the V, between and just below the heads */
  '<circle cx="198" cy="134" r="13" fill="#fff" stroke="#64748B" stroke-width="1.5"/>' +
  '<circle cx="198" cy="134" r="7" fill="#F1F5F9" stroke="#64748B" stroke-width="1.2"/>' +
  FILTER;

/* Left side: primary, belt, shifter, jiffy stand. */
const SIDE_L =
  '<rect x="118" y="144" width="84" height="44" rx="22" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>' +
  '<circle cx="160" cy="170" r="14" fill="#F1F5F9" stroke="#64748B" stroke-width="1.5"/>' +
  '<circle cx="160" cy="170" r="8" fill="none" stroke="#64748B" stroke-width="1" opacity="0.65"/>' +
  '<rect x="170" y="146" width="26" height="16" rx="4" fill="#F1F5F9" stroke="#64748B" stroke-width="1.5"/>' +
  /* rear pulley and the two runs of the drive belt */
  '<circle cx="104" cy="161" r="16" fill="none" stroke="#64748B" stroke-width="3"/>' +
  '<path d="M120 152L104 145M120 176L104 177" stroke="#64748B" stroke-width="4" stroke-linecap="round"/>' +
  /* shift lever and jiffy stand */
  '<path d="M176 190L212 186" fill="none" stroke="#64748B" stroke-width="3.5" stroke-linecap="round"/>' +
  '<rect x="206" y="181" width="14" height="5" rx="2.5" fill="#7E8EA5"/>' +
  '<path d="M196 180L206 197" stroke="#64748B" stroke-width="5" stroke-linecap="round"/>' +
  FILTER;

/* Numbered markers. x,y is the badge; t are the points it leads to, used where
   a part is buried or two markers would otherwise sit on top of each other.
   s is the side: r, l, or b for both. Left-side x is mirrored at render. */
const MARKS = [
  { id: "fill", x: 140, y: 100, s: "r", t: [[157, 119]] },
  { id: "tankdrain", x: 106, y: 192, s: "r", t: [[128, 191]] },
  { id: "filter", x: 246, y: 178, s: "b", t: [[230, 170]] },
  { id: "tdip", x: 151, y: 152, s: "r" },
  { id: "tdrain", x: 158, y: 192, s: "r", t: [[140, 182]] },
  { id: "ccover", x: 164, y: 168, s: "l" },
  { id: "pdrain", x: 150, y: 190, s: "l" },
  { id: "aircleaner", x: 198, y: 134, s: "r" },
  { id: "plugs", x: 186, y: 74, s: "r", t: [[214, 129], [160, 128]] },
  { id: "battery", x: 112, y: 100, s: "r", t: [[146, 135]] },
  { id: "pchain", x: 182, y: 152, s: "l" },
  { id: "belt", x: 118, y: 176, s: "l" },
  { id: "forkdrain", x: 296, y: 146, s: "b" },
  { id: "fmaster", x: 230, y: 44, s: "r", t: [[248, 66]] },
  { id: "rmaster", x: 196, y: 166, s: "r" },
  { id: "steerhead", x: 268, y: 106, s: "r" },
  { id: "jiffy", x: 200, y: 190, s: "l" }
];

function bikeSVG(side) {
  const left = side === "left", mx = v => left ? DW - v : v;
  const marks = MARKS.filter(m => m.s === "b" || m.s === (left ? "l" : "r")).map(m => {
    const sp = SPOTS.find(s => s.id === m.id);
    if (!sp) return "";
    const on = spot === m.id, dim = spot && !on, x = mx(m.x), y = m.y;
    const lead = (m.t || []).map(p => {
      const d = "M" + x + " " + y + "L" + mx(p[0]) + " " + p[1];
      return '<path d="' + d + '" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="' + d + '" stroke="#B45309" stroke-width="1.8" stroke-linecap="round"/>' +
        '<circle cx="' + mx(p[0]) + '" cy="' + p[1] + '" r="3.6" fill="#B45309" stroke="#fff" stroke-width="1.6"/>';
    }).join("");
    return '<g data-spot="' + sp.id + '" role="button" tabindex="0" aria-label="' + sp.n + ', ' + esc(sp.name) + '" style="cursor:pointer;opacity:' + (dim ? .35 : 1) + '">' +
      lead +
      (on ? '<circle cx="' + x + '" cy="' + y + '" r="18" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2"/>' : "") +
      '<circle cx="' + x + '" cy="' + y + '" r="15" fill="transparent"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="11" fill="' + (on ? "#D97706" : "#F59E0B") + '" stroke="#fff" stroke-width="2"/>' +
      '<text x="' + x + '" y="' + (y + 4.5) + '" text-anchor="middle" font-family="Barlow, sans-serif" font-weight="700" font-size="13" fill="#fff">' + sp.n + '</text></g>';
  }).join("");
  return '<figure class="diag"><svg viewBox="44 28 312 180" role="img" aria-label="' + (left ? "Left" : "Right") + ' side of the bike with numbered service points">' +
    '<g' + (left ? ' transform="translate(' + DW + ',0) scale(-1,1)"' : "") + '>' + BASE + (left ? SIDE_L : SIDE_R) + '</g>' + marks + '</svg>' +
    '<figcaption>' + (left ? "Left side, front of bike at left" : "Right side, front of bike at right") + '</figcaption></figure>';
}
function renderMap() {
  $("map").innerHTML = bikeSVG("right") + bikeSVG("left");
  $("legend").innerHTML = SPOTS.map(s =>
    '<li><button data-spot="' + s.id + '" aria-pressed="' + (spot === s.id) + '">' +
    '<span class="n">' + s.n + '</span><span class="grow"><span class="nm">' + esc(s.name) + '</span>' +
    '<span class="wh">' + esc(s.where) + '</span></span></button></li>').join("");
}
function onSpot(e) {
  const t = e.target.closest("[data-spot]"); if (!t) return;
  spot = spot === t.dataset.spot ? null : t.dataset.spot; renderMap();
}
$("map").addEventListener("click", onSpot);
$("legend").addEventListener("click", onSpot);
$("map").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-spot]")) { e.preventDefault(); onSpot(e); } });
function showSpot(id) { spot = id; $("mapBox").open = true; renderMap(); $("mapBox").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }

/* ---------------- timers ---------------- */
function timerHTML(key, sec, label) {
  const end = state.timers[key], now = Date.now();
  if (!end) return '<button class="tbtn" data-act="tstart" data-key="' + key + '" data-sec="' + sec + '">' + CLOCK + 'Start ' + fmtTime(sec) + ' timer</button>';
  if (end > now) return '<span style="display:inline-flex;align-items:center;gap:10px"><span class="tbtn run">' + CLOCK + '<span data-tleft="' + key + '">' + fmtTime((end - now) / 1000) + '</span></span>' +
    '<button class="btn link" data-act="tcancel" data-key="' + key + '">Cancel</button></span>';
  return '<span style="display:inline-flex;align-items:center;gap:10px"><span class="tbtn up">Time\'s up</span>' +
    '<button class="btn link" data-act="tcancel" data-key="' + key + '">Reset</button></span>';
}
function timerLabel(key) {
  const p = key.split(":"), j = jobById(p[0]);
  if (!j) return "Timer";
  const st = j.steps[+p[1]];
  return st && st.tm ? st.tm[1] : "Timer";
}
function renderTimerBar() {
  const runs = Object.entries(state.timers).filter(([k, e]) => e > Date.now()).sort((a, b) => a[1] - b[1]);
  const ups = Object.entries(state.timers).filter(([k, e]) => e <= Date.now());
  const pick = runs[0] || ups[0];
  const bar = $("timerBar");
  if (!pick) { bar.hidden = true; bar.innerHTML = ""; return; }
  const [key, end] = pick, up = end <= Date.now();
  bar.hidden = false;
  bar.innerHTML = '<div class="inner' + (up ? " up" : "") + '">' +
    '<span class="t" data-bartime>' + (up ? "Done" : fmtTime((end - Date.now()) / 1000)) + '</span>' +
    '<span class="lbl">' + esc(timerLabel(key)) + (runs.length + ups.length > 1 ? " +" + (runs.length + ups.length - 1) : "") + '</span>' +
    '<button class="btn sm" data-act="tcancel" data-key="' + esc(key) + '">' + (up ? "Clear" : "Cancel") + '</button></div>';
}
function tick() {
  const now = Date.now();
  let changed = false;
  Object.entries(state.timers).forEach(([k, end]) => {
    if (end <= now && !fired[k]) { fired[k] = true; beep(); changed = true; }
  });
  document.querySelectorAll("[data-tleft]").forEach(el => {
    const k = el.dataset.tleft;
    if (state.timers[k] > now) el.textContent = fmtTime((state.timers[k] - now) / 1000);
  });
  const bt = document.querySelector("[data-bartime]");
  if (bt) {
    const runs = Object.entries(state.timers).filter(([k, e]) => e > now).sort((a, b) => a[1] - b[1]);
    if (runs.length) bt.textContent = fmtTime((runs[0][1] - now) / 1000);
    else if (bt.textContent !== "Done") { renderTimerBar(); }
  }
  if (changed) { renderJob(); renderTimerBar(); syncWake(); }
}
setInterval(tick, 1000);

/* ---------------- JOBS ---------------- */
function jobProgress(j) { return j.steps.filter((_, i) => state.done[j.id + ":" + i]).length; }

function renderJobSeg() {
  $("jobSeg").innerHTML = GROUPS.map(g =>
    '<button data-g="' + g + '" aria-pressed="' + (state.jgroup === g) + '">' + g + '</button>').join("");
}
function renderJobList() {
  const list = activeJobs().filter(j => state.jgroup === "All" || j.group === state.jgroup);
  $("jobList").innerHTML = list.map(j => {
    const n = jobProgress(j), total = j.steps.length, d = dueStatus(j);
    const tag = d.s === "now" || d.s === "never" ? '<span class="chip overdue">Due</span>' : d.s === "soon" ? '<span class="chip">Soon</span>' : "";
    return '<button class="card" data-open="' + j.id + '" style="display:block;width:100%;text-align:left">' +
      '<span style="font-family:var(--cond);font-size:22px;font-weight:700;display:block;line-height:1.15">' + esc(j.title) + '</span>' +
      '<span class="small muted" style="display:block">' + esc(j.lede) + '</span>' +
      '<span class="chips">' + tag +
      (j.mins ? '<span class="chip plain">' + j.mins + ' min</span>' : "") +
      (j.cap ? '<span class="chip plain">' + esc(j.cap) + '</span>' : "") +
      '<span class="chip plain">' + intervalLabel(j) + '</span>' +
      (n ? '<span class="chip ' + (n === total ? "ok" : "") + '">' + n + ' of ' + total + ' done</span>' : "") +
      '</span></button>';
  }).join("") || '<p class="hint" style="margin-top:16px">No jobs in this group for your bike.</p>';
}
$("jobSeg").addEventListener("click", e => {
  const b = e.target.closest("[data-g]"); if (!b) return;
  state.jgroup = b.dataset.g; save(); renderJobSeg(); renderJobList();
});
$("jobList").addEventListener("click", e => {
  const b = e.target.closest("[data-open]"); if (!b) return;
  openJob(b.dataset.open);
});
function openJob(id) {
  if (!jobById(id)) return;
  state.job = id; save();
  setView("jobs"); renderJob();
  window.scrollTo({ top: 0, behavior: "auto" });
}
$("jobBack").onclick = () => { state.job = null; save(); renderJob(); setView("jobs"); };

function renderJob() {
  const showDetail = !!state.job;
  $("jobDetail").hidden = !showDetail;
  $("jobList").hidden = showDetail;
  $("jobSeg").hidden = showDetail;
  $("mapBox").hidden = false;
  if (!showDetail) { renderJobSeg(); renderJobList(); return; }

  const j = jobById(state.job);
  if (!j) { state.job = null; return renderJob(); }
  /* Only own the heading while the Jobs view is the one on screen: renderAll()
     runs every renderer, and this used to leave a job title above the Specs tab. */
  if (state.view === "jobs") $("viewTitle").textContent = j.title;

  const d = dueStatus(j), n = jobProgress(j), total = j.steps.length;
  let h = '<div class="card"><p class="small muted" style="margin:0">' + esc(j.group) + (j.page ? ' · ' + esc(j.page) : "") + '</p>' +
    '<p style="margin-top:4px">' + esc(j.lede) + '</p><div class="chips">' +
    (j.mins ? '<span class="chip plain">about ' + j.mins + ' min</span>' : "") +
    '<span class="chip plain">' + intervalLabel(j) + '</span>' +
    (j.cap ? '<span class="chip">' + esc(j.cap) + '</span>' : "") +
    (j.warm ? '<span class="chip">Warm it up first</span>' : "") +
    (j.upright ? '<span class="chip">Hold it upright</span>' : "") +
    '</div>';
  if (d.s !== "asneeded") h += '<p class="small ' + (d.s === "now" || d.s === "never" ? "" : "muted") + '" style="margin:10px 0 0">' +
    (d.s === "now" || d.s === "never" ? "<b>" + esc(dueText(d)) + "</b>" : esc(dueText(d))) + '</p>';
  h += '<div class="btnrow"><button class="btn sm" data-jump="log">Log this job</button>' +
    (n ? '<button class="btn sm" data-clearsteps="1">Clear checkmarks</button>' : "") + '</div></div>';

  /* what you need */
  const toolIds = []; const seen = {};
  j.steps.forEach(st => (st.tl || []).forEach(t => { if (!seen[t]) { seen[t] = 1; toolIds.push(t); } }));
  const partGroups = PARTS.filter(g => (g.jobs || []).indexOf(j.id) > -1);
  if (toolIds.length || partGroups.length) {
    h += '<details class="acc"><summary>What you need</summary><div class="body">';
    if (partGroups.length) {
      h += '<h3 style="margin-top:0">Parts and fluids</h3><ul class="small">' +
        partGroups.map(g => {
          const picked = g.items.find(it => state.have[it.id]);
          return '<li>' + esc(shortCat(g.cat)) + (picked ? ' — <b>' + esc(picked.name) + '</b>' : ' <span class="muted">(nothing picked yet)</span>') + '</li>';
        }).join("") + '</ul>';
    }
    if (toolIds.length) {
      h += '<h3>Tools</h3><ul class="small">' + toolIds.map(t => {
        const tool = toolById(t);
        return '<li>' + (tool ? esc(tool.name) : esc(t)) + (state.tools[t] ? ' <span class="chip ok xs">have it</span>' : "") + '</li>';
      }).join("") + '</ul>';
    }
    h += '<div class="btnrow"><button class="btn sm" data-jump="shop">Open parts and tools</button></div></div></details>';
  }

  /* steps */
  h += '<div class="card"><div class="rowline"><h2 style="margin:0">Steps</h2><span class="small muted">' + n + ' of ' + total + '</span></div>';
  h += j.steps.map((st, i) => {
    const k = j.id + ":" + i, done = !!state.done[k], next = !done && i === j.steps.findIndex((_, x) => !state.done[j.id + ":" + x]);
    let extras = "";
    if (st.c && st.c.length) extras += '<span class="chips">' + st.c.map(c => '<span class="chip">' + esc(c) + '</span>').join("") + '</span>';
    if (st.tl && st.tl.length) extras += '<span class="chips">' + st.tl.map(t => { const tool = toolById(t); return '<span class="chip plain">' + WRENCH + esc(tool ? tool.name : t) + '</span>'; }).join("") + '</span>';
    if (st.w) extras += '<span class="warn"><b>Careful:</b><span>' + esc(st.w) + '</span></span>';
    let btns = "";
    if (st.loc) btns += '<button class="btn sm" data-act="where" data-loc="' + st.loc + '">' + PIN + 'Show where</button>';
    if (st.tm) btns += timerHTML(k, st.tm[0], st.tm[1]);
    if (btns) extras += '<span class="btnrow" style="margin-top:9px">' + btns + '</span>';
    return '<div class="step' + (done ? " done" : next ? " next" : "") + '" data-toggle="' + k + '">' +
      '<button class="num" role="checkbox" aria-checked="' + done + '" aria-label="Step ' + (i + 1) + ': ' + esc(st.t) + '">' + (done ? CHECK : i + 1) + '</button>' +
      '<div class="grow"><div class="t">' + esc(st.t) + '</div><div class="b">' + esc(st.b) + '</div>' + extras + '</div></div>';
  }).join("");
  h += '</div>';

  if (n === total) h += '<div class="card" style="border-color:var(--green-line);background:var(--green-bg)">' +
    '<p style="margin:0;font-weight:700;color:var(--green-ink)">All steps ticked</p>' +
    '<p class="small" style="color:var(--green-ink);margin:4px 0 0">Log it so the next due date is right.</p>' +
    '<div class="btnrow"><button class="btn go" data-jump="log">Log this job</button></div></div>';

  $("jobBody").innerHTML = h;
  renderTimerBar();
}

$("jobBody").addEventListener("click", e => {
  const act = e.target.closest("[data-act]");
  if (act) {
    const a = act.dataset.act;
    if (a === "where") { showSpot(act.dataset.loc); return; }
    if (a === "tstart") { ensureAudio(); const k = act.dataset.key; state.timers[k] = Date.now() + (+act.dataset.sec) * 1000; delete fired[k]; save(); renderJob(); renderTimerBar(); syncWake(); return; }
    if (a === "tcancel") { const k = act.dataset.key; delete state.timers[k]; delete fired[k]; save(); renderJob(); renderTimerBar(); syncWake(); return; }
  }
  const jump = e.target.closest("[data-jump]");
  if (jump) {
    if (jump.dataset.jump === "log") { prefillLog(state.job); setView("log"); renderLog(); window.scrollTo({ top: 0, behavior: "auto" }); }
    else { setView("shop"); renderShop(); window.scrollTo({ top: 0, behavior: "auto" }); }
    return;
  }
  if (e.target.closest("[data-clearsteps]")) {
    const j = jobById(state.job);
    j.steps.forEach((_, i) => { delete state.done[j.id + ":" + i]; });
    save(); renderJob(); return;
  }
  const row = e.target.closest("[data-toggle]");
  if (row) {
    const k = row.dataset.toggle;
    if (state.done[k]) delete state.done[k]; else state.done[k] = true;
    save(); renderJob(); renderDue();
  }
});
$("timerBar").addEventListener("click", e => {
  const b = e.target.closest("[data-act='tcancel']"); if (!b) return;
  const k = b.dataset.key; delete state.timers[k]; delete fired[k];
  save(); renderJob(); renderTimerBar(); syncWake();
});

/* ---------------- SHOP: buy list, parts, tools ---------------- */
function buyLines() {
  const picked = [];
  PARTS.forEach(g => g.items.forEach(it => { if (state.have[it.id]) picked.push({ g: g, it: it }); }));
  const lines = {};
  picked.forEach(p => {
    /* One bottle, one line. MERGE points every listing of a product at the
       one entry that names it in full, whether or not that entry is itself
       picked — otherwise Mobil 1 in the transmission and Mobil 1 in the
       primary come out as two separate 1 qt lines with the same name. */
    const key = MERGE[p.it.id] || p.it.id;
    const base = findItem(key) || p.it;
    const q = ITEMQTY[p.it.id] || QTY[p.g.cat] || [1, "", "each"];
    if (!lines[key]) lines[key] = { key: key, name: base.name, pn: base.pn, where: base.where || [], qty: 0, unit: q[1], per: q[2], cats: [] };
    lines[key].qty += q[0];
    lines[key].cats.push(shortCat(p.g.cat));
  });
  return Object.values(lines);
}
function storePlan(lines) {
  /* Split the list into what a chain parts store can supply and what it can't,
     then look for one store that covers the first half. */
  const noLocal = lines.filter(l => !(l.where || []).some(w => LOCAL.indexOf(w.s) > -1));
  const localLines = lines.filter(l => noLocal.indexOf(l) < 0);
  const covers = LOCAL.filter(s => localLines.length && localLines.every(l => (l.where || []).some(w => w.s === s)));
  const dealer = noLocal.filter(l => (l.where || []).some(w => w.s === "Dealer"));
  const online = noLocal.filter(l => dealer.indexOf(l) < 0);
  return { covers: covers, dealer: dealer, online: online, localLines: localLines, noLocal: noLocal };
}
function renderBuyList() {
  const lines = buyLines();
  let h = '<div class="card"><div class="rowline"><h2 style="margin:0">Buy list</h2>' +
    (lines.length ? '<span class="small muted">' + lines.filter(l => state.bought[l.key]).length + ' of ' + lines.length + ' in cart</span>' : "") + '</div>';
  if (!lines.length) {
    h += '<p class="hint" style="margin:8px 0 0">Nothing picked yet. Choose a product for each fluid on the Parts tab and it lands here with quantities.</p>' +
      '<div class="btnrow"><button class="btn" data-shopgo="parts">Pick parts</button></div></div>';
    $("shopList").innerHTML = h;
    return;
  }
  let total = 0, priced = 0;
  h += lines.map(l => {
    const b = !!state.bought[l.key], p = state.prices[l.key];
    const each = Number(p);
    if (p && Number.isFinite(each)) { total += each * l.qty; priced++; }
    return '<div class="check">' +
      '<button class="box" data-buy="' + esc(l.key) + '" aria-pressed="' + b + '" aria-label="In cart: ' + esc(l.name) + '">' + (b ? CHECK : "") + '</button>' +
      '<div class="grow"><div style="font-weight:600;line-height:1.3">' + esc(l.name) + '</div>' +
      '<div class="xs muted">' + esc(l.cats.join(", ")) + ' · ' + l.qty + (l.unit ? " " + l.unit : "") + (l.pn ? ' · ' + esc(l.pn) : "") + '</div>' +
      (l.where && l.where.length ? '<div class="chips">' + l.where.map(w => w.u
        ? '<a class="chip plain" href="' + esc(w.u) + '" target="_blank" rel="noopener">' + esc(w.t) + '</a>'
        : '<span class="chip plain">' + esc(w.t) + '</span>').join("") + '</div>' : "") +
      (HINTS[l.key] ? '<div class="xs muted" style="margin-top:4px">' + esc(HINTS[l.key]) + '</div>' : "") +
      '</div>' +
      '<label class="pricecell xs muted"><span style="display:block">' + esc(l.per) + '</span>' +
      '<input class="money" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" data-price="' + esc(l.key) + '" value="' + (p != null ? esc(p) : "") + '" aria-label="Price for ' + esc(l.name) + '"></label>' +
      '</div>';
  }).join("");
  h += '<div class="rowline" style="border-top:1px solid var(--line);padding-top:12px;margin-top:8px">' +
    '<span class="small muted">' + (priced ? "Total of " + priced + " priced line" + (priced > 1 ? "s" : "") : "Type prices to total it up") + '</span>' +
    '<span id="buyTotal" style="font-family:var(--cond);font-size:24px;font-weight:700">' + (priced ? money(total) : "—") + '</span></div>';

  const plan = storePlan(lines);
  h += '<hr class="rule">';
  if (plan.covers.length) h += '<p class="small" style="margin:0"><b>One stop:</b> ' + esc(plan.covers.join(" or ")) +
    (plan.noLocal.length ? ' carries everything except the lines below.</p>' : ' carries everything on this list.</p>');
  else if (plan.localLines.length) h += '<p class="small" style="margin:0">No single parts store carries all of this. Check the links on each line.</p>';
  if (plan.dealer.length) h += '<p class="small muted" style="margin:6px 0 0"><b>From the dealer:</b> ' + esc(plan.dealer.map(l => l.name).join(", ")) + '</p>';
  if (plan.online.length) h += '<p class="small muted" style="margin:6px 0 0"><b>Order online:</b> ' + esc(plan.online.map(l => l.name).join(", ")) + '</p>';
  h += '</div>';

  const toolsLeft = TOOLS.reduce((a, g) => a + g.items.filter(t => !state.tools[t.id]).length, 0);
  if (toolsLeft) h += '<p class="hint">' + toolsLeft + ' tool' + (toolsLeft > 1 ? "s" : "") + ' not checked off yet. <button class="btn link" data-shopgo="tools">Open tools</button></p>';
  $("shopList").innerHTML = h;
}
function renderParts() {
  $("filters").innerHTML = STORES.map(s =>
    '<button data-s="' + esc(s) + '" aria-pressed="' + (state.store === s) + '">' + esc(s) + '</button>').join("");
  let h = "";
  PARTS.forEach((g, gi) => {
    const items = g.items.filter(it => state.store === "All" || (it.where || []).some(w => w.s === state.store));
    if (!items.length) return;
    h += '<section class="cardgroup"><h2>' + esc(g.cat) + '</h2>';
    const picked = g.pick ? g.items.find(it => state.have[it.id]) : null;
    if (picked) h += '<div class="card" style="margin-top:0;border-color:var(--green-line);background:var(--green-bg)"><div class="rowline">' +
      '<span class="small grow" style="color:var(--green-ink)"><b>Your pick:</b> ' + esc(picked.name) +
      (state.linked[picked.id] ? '<span class="xs" style="display:block">Matched to your engine oil</span>' : "") + '</span>' +
      '<button class="btn sm" data-clear="' + gi + '">Change</button></div></div>';
    h += '<div class="card" style="margin-top:8px">' + items.map(it => {
      const checked = !!state.have[it.id], locked = g.pick && picked && !checked;
      return '<div class="check">' +
        '<button class="box" data-id="' + it.id + '" aria-pressed="' + checked + '" ' + (locked ? 'disabled aria-disabled="true"' : "") +
        ' aria-label="' + esc(it.name) + '">' + (checked ? CHECK : "") + '</button>' +
        '<div class="grow"><div style="font-weight:600;line-height:1.3">' + esc(it.name) +
        (it.tag ? ' <span class="chip">' + esc(it.tag) + '</span>' : "") + '</div>' +
        (it.pn ? '<div class="xs muted">' + esc(it.pn) + '</div>' : "") +
        (it.note ? '<div class="small" style="margin-top:3px">' + esc(it.note) + '</div>' : "") +
        (it.where && it.where.length ? '<div class="chips">' + it.where.map(w => w.u
          ? '<a class="chip plain" href="' + esc(w.u) + '" target="_blank" rel="noopener">' + esc(w.t) + '</a>'
          : '<span class="chip plain">' + esc(w.t) + '</span>').join("") + '</div>' : "") +
        '</div></div>';
    }).join("") + '</div></section>';
  });
  $("parts").innerHTML = h || '<p class="hint" style="margin-top:16px">Nothing in this category at that store.</p>';
}
function renderTools() {
  $("tools").innerHTML = TOOLS.map(g => '<section class="cardgroup"><h2>' + esc(g.cat) + '</h2><div class="card" style="margin-top:8px">' +
    g.items.map(t => {
      const on = !!state.tools[t.id];
      return '<div class="check"><button class="box" data-tool="' + t.id + '" aria-pressed="' + on + '" aria-label="' + esc(t.name) + '">' + (on ? CHECK : "") + '</button>' +
        '<div class="grow"><div style="font-weight:600;line-height:1.3">' + esc(t.name) +
        (t.tag ? ' <span class="chip">' + esc(t.tag) + '</span>' : "") + '</div>' +
        '<div class="small muted">' + esc(t.use) + '</div></div></div>';
    }).join("") + '</div></section>').join("");
}
function renderShop() {
  document.querySelectorAll("#shopSeg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.shop === state.shop)));
  $("shopList").hidden = state.shop !== "list";
  $("shopParts").hidden = state.shop !== "parts";
  $("shopTools").hidden = state.shop !== "tools";
  if (state.shop === "list") renderBuyList();
  if (state.shop === "parts") renderParts();
  if (state.shop === "tools") renderTools();
}
$("shopSeg").addEventListener("click", e => {
  const b = e.target.closest("[data-shop]"); if (!b) return;
  state.shop = b.dataset.shop; save(); renderShop();
});
$("view-shop").addEventListener("click", e => {
  const go = e.target.closest("[data-shopgo]");
  if (go) { state.shop = go.dataset.shopgo; save(); renderShop(); window.scrollTo({ top: 0, behavior: "auto" }); return; }
  const f = e.target.closest("[data-s]");
  if (f) { state.store = f.dataset.s; save(); renderParts(); return; }
  const buy = e.target.closest("[data-buy]");
  if (buy) { const k = buy.dataset.buy; if (state.bought[k]) delete state.bought[k]; else state.bought[k] = true; save(); renderBuyList(); return; }
  const clr = e.target.closest("[data-clear]");
  if (clr) { clearPick(PARTS[+clr.dataset.clear]); return; }
  const pick = e.target.closest("[data-id]");
  if (pick && !pick.disabled) { togglePick(pick.dataset.id); return; }
  const tool = e.target.closest("[data-tool]");
  if (tool) { const k = tool.dataset.tool; if (state.tools[k]) delete state.tools[k]; else state.tools[k] = true; save(); renderTools(); return; }
});
$("view-shop").addEventListener("input", e => {
  const p = e.target.closest("[data-price]"); if (!p) return;
  const v = p.value.trim();
  if (v === "") delete state.prices[p.dataset.price]; else state.prices[p.dataset.price] = v;
  save();
  /* update the total without rebuilding the row the user is typing in */
  const lines = buyLines(); let total = 0, priced = 0;
  lines.forEach(l => { const n = Number(state.prices[l.key]); if (state.prices[l.key] && Number.isFinite(n)) { total += n * l.qty; priced++; } });
  const box = $("buyTotal");
  if (box) box.textContent = priced ? money(total) : "—";
});

/* Drop what a pick auto-filled elsewhere, but only the categories still
   flagged as auto-filled — one the user has since chosen by hand is theirs. */
function unlink(id) {
  (LINKS[id] || []).forEach(l => { if (state.linked[l]) { delete state.have[l]; delete state.linked[l]; } });
}
function togglePick(id) {
  const g = groupOf(id);
  if (state.have[id]) {
    delete state.have[id]; delete state.linked[id];
    unlink(id);
  } else {
    /* Replacing the pick in a pick-one category has to drop the old pick's
       auto-fills too, or the transmission and primary go on claiming they are
       matched to an engine oil that is no longer chosen. */
    if (g.pick) g.items.forEach(it => {
      if (state.have[it.id]) unlink(it.id);
      delete state.have[it.id]; delete state.linked[it.id];
    });
    state.have[id] = true;
    (LINKS[id] || []).forEach(l => {
      const lg = groupOf(l);
      if (lg && !lg.items.some(it => state.have[it.id])) { state.have[l] = true; state.linked[l] = true; }
    });
  }
  save(); renderParts();
}
function clearPick(g) {
  g.items.forEach(it => {
    if (state.have[it.id]) { unlink(it.id); delete state.have[it.id]; }
    delete state.linked[it.id];
  });
  save(); renderParts();
}
$("resetTools").onclick = () => { state.tools = {}; save(); renderTools(); };

/* ---------------- LOG ---------------- */
let justLogged = false, logPrefill = null;
function prefillLog(jobId) { logPrefill = jobId; }
/* Only the categories that belong to the jobs being logged. Recording every
   current pick put the engine oil and brake fluid on a tire-pressure check. */
function partsUsed(jobIds) {
  const out = [];
  PARTS.forEach(g => {
    if (!(g.jobs || []).some(id => jobIds.indexOf(id) > -1)) return;
    g.items.forEach(it => { if (state.have[it.id] && out.indexOf(it.name) < 0) out.push(it.name); });
  });
  return out;
}
function renderLogForm() {
  const byGroup = {};
  activeJobs().forEach(j => { (byGroup[j.group] = byGroup[j.group] || []).push(j); });
  $("fItems").innerHTML = Object.keys(byGroup).map(g =>
    '<div style="margin-top:10px"><p class="xs muted" style="margin:0 0 2px">' + esc(g) + '</p>' +
    byGroup[g].map(j => {
      const on = logPrefill === j.id;
      return '<label style="display:flex;gap:9px;align-items:center;padding:6px 0;font-size:15.5px">' +
        '<input type="checkbox" class="fJob" value="' + j.id + '"' + (on ? " checked" : "") + ' style="width:20px;height:20px;flex:0 0 auto">' +
        '<span>' + esc(j.title) + '</span></label>';
    }).join("") + '</div>').join("");
  logPrefill = null;
}
function renderLog() {
  const sorted = [...state.log].sort((a, b) => b.miles - a.miles || String(b.date).localeCompare(String(a.date)));
  $("logSaved").innerHTML = justLogged
    ? '<div class="card" style="border-color:var(--green-line);background:var(--green-bg)"><p style="margin:0;font-weight:700;color:var(--green-ink)">Logged</p>' +
    '<p class="small" style="margin:4px 0 0;color:var(--green-ink)">Clear the checklists so they are ready for next time?</p>' +
    '<div class="btnrow"><button class="btn go" data-fresh="1">Start fresh</button></div></div>' : "";
  if (!$("fDate").value) $("fDate").value = today();
  if (!$("fOdo").value && state.odo) $("fOdo").value = state.odo;
  renderLogForm();
  $("fuelSel").value = state.fuel;
  $("history").innerHTML = sorted.length ? sorted.map(en =>
    '<div class="card"><div class="rowline"><span style="font-family:var(--cond);font-size:23px;font-weight:700">' + esc(miles(en.miles)) + '</span>' +
    '<span class="xs muted">' + esc(fmtDate(en.date)) + '</span></div>' +
    '<p class="small" style="margin:4px 0 0">' + esc(en.jobs.map(id => (jobById(id) || {}).title || id).join(", ") || "No jobs recorded") + '</p>' +
    (en.parts && en.parts.length ? '<p class="xs muted" style="margin:4px 0 0">' + esc(en.parts.join(", ")) + '</p>' : "") +
    (en.notes ? '<p class="small" style="margin:8px 0 0;background:var(--tint);border-radius:10px;padding:8px 11px">' + esc(en.notes) + '</p>' : "") +
    '<div class="btnrow"><button class="btn sm" data-del="' + esc(String(en.id)) + '">Delete</button></div></div>').join("")
    : '<p class="hint">Nothing logged yet. Save a service here and the Due screen starts working.</p>';
  renderHeader();
}
$("history").addEventListener("click", e => {
  const b = e.target.closest("[data-del]"); if (!b) return;
  if (confirm("Delete this log entry?")) { state.log = state.log.filter(x => String(x.id) !== b.dataset.del); save(); renderLog(); renderDue(); }
});
$("logSaved").addEventListener("click", e => { if (e.target.closest("[data-fresh]")) startFresh(); });
$("fSave").onclick = () => {
  const raw = $("fOdo").value.trim(), m = Number(raw);
  const jobs = [...document.querySelectorAll(".fJob:checked")].map(c => c.value);
  const err = $("fErr");
  if (!raw || !Number.isInteger(m) || m < 0 || m > 999999) { err.textContent = "Enter the odometer reading in whole miles."; err.hidden = false; return; }
  if (!jobs.length) { err.textContent = "Tick at least one job you did."; err.hidden = false; return; }
  err.hidden = true;
  state.log.push({ id: Date.now(), date: $("fDate").value || today(), miles: m, jobs: jobs, parts: partsUsed(jobs), notes: $("fNote").value.trim() });
  /* Back-filling an old service must not wind the current odometer backwards. */
  if (!state.odo || m > Number(state.odo)) state.odo = String(m);
  save();
  $("fOdo").value = ""; $("fNote").value = ""; $("fDate").value = today();
  justLogged = true; renderLog(); renderDue();
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
};
$("fuelSel").addEventListener("change", () => { state.fuel = $("fuelSel").value === "efi" ? "efi" : "carb"; save(); renderAll(); });
function startFresh() {
  state.done = {}; state.timers = {}; state.tools = {}; state.bought = {};
  Object.keys(fired).forEach(k => delete fired[k]);
  justLogged = false; save(); renderAll(); syncWake();
}
$("freshBtn").onclick = () => { if (confirm("Clear step checkmarks, timers, tool checks and cart checks? Parts picks, prices and the log are kept.")) startFresh(); };

/* backup */
$("expBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "softail-service-" + today() + ".json";
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  $("ioMsg").textContent = "Backup saved to your downloads.";
};
$("impBtn").onclick = () => $("impFile").click();
$("impFile").addEventListener("change", () => {
  const f = $("impFile").files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      state = repair(JSON.parse(r.result));
      save(); renderAll();
      $("ioMsg").textContent = "Backup restored.";
    } catch (e) { $("ioMsg").textContent = "That file could not be read as a backup."; }
  };
  r.readAsText(f);
  $("impFile").value = "";
});

/* ---------------- REFERENCE ---------------- */
function renderRef() {
  document.querySelectorAll("#refSeg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.ref === state.ref)));
  $("refSpecs").hidden = state.ref !== "specs";
  $("refTorque").hidden = state.ref !== "torque";
  $("refFix").hidden = state.ref !== "fix";
  $("refCodes").hidden = state.ref !== "codes";

  if (!$("refSpecs").innerHTML) {
    $("refSpecs").innerHTML = SPECS.map(g =>
      '<div class="card"><div class="rowline"><h2 style="margin:0">' + esc(g.group) + '</h2><span class="xs muted">' + esc(g.src) + '</span></div>' +
      '<table class="spectable">' + g.rows.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>').join("") + '</table>' +
      (g.notes ? g.notes.map(n => '<p class="note"><span>' + esc(n) + '</span></p>').join("") : "") + '</div>').join("");
  }
  if (!$("refTorque").innerHTML) {
    const grps = [];
    TORQUES.forEach(t => { if (grps.indexOf(t.grp) < 0) grps.push(t.grp); });
    $("refTorque").innerHTML =
      '<p class="hint" style="margin-top:14px">Figures for the 2003 FLSTC. Anything not listed here is in the manual’s chapter tables.</p>' +
      grps.map(g => '<div class="card"><h2 style="margin-top:0">' + esc(g) + '</h2><table class="spectable">' +
        TORQUES.filter(t => t.grp === g).map(t =>
          '<tr><td>' + esc(t.item) + (t.note ? '<span class="xs" style="display:block">' + esc(t.note) + '</span>' : "") + '</td>' +
          '<td>' + esc(t.v) + (t.nm ? '<span class="xs muted" style="display:block;font-weight:400">' + esc(t.nm) + '</span>' : "") + '</td></tr>').join("") +
        '</table></div>').join("");
  }
  if (!$("refFix").innerHTML) {
    $("refFix").innerHTML = '<p class="hint" style="margin-top:14px">Condensed from the manual’s troubleshooting chapter. Work top to bottom; the cheap causes are listed first.</p>' +
      TROUBLE.map(t => '<details class="acc"><summary>' + esc(t.q) + '</summary><div class="body">' +
        (t.warn ? '<p class="warn"><span>' + esc(t.warn) + '</span></p>' : "") +
        '<ul class="small">' + t.causes.map(c => '<li>' + esc(c) + '</li>').join("") + '</ul></div></details>').join("");
  }
  if (!$("refCodes").innerHTML) {
    const how = DTC_HOWTO[state.fuel] || DTC_HOWTO.carb;
    $("refCodes").innerHTML = '<div class="card"><h2 style="margin-top:0">Reading the codes</h2>' +
      '<ol class="small">' + how.map(s => '<li>' + esc(s) + '</li>').join("") + '</ol>' +
      '<p class="note"><span>' + esc(DTC_HOWTO.note) + '</span></p></div>' +
      '<div class="card"><h2 style="margin-top:0">Code list</h2><table class="spectable">' +
      DTC.filter(c => !c[2] || c[2] === state.fuel).map(c =>
        '<tr><td style="font-variant-numeric:tabular-nums;font-weight:700;color:var(--ink)">' + esc(c[0]) + '</td><td style="text-align:left;font-weight:400">' + esc(c[1]) + '</td></tr>').join("") +
      '</table></div>';
  }
}
$("refSeg").addEventListener("click", e => {
  const b = e.target.closest("[data-ref]"); if (!b) return;
  state.ref = b.dataset.ref; save(); renderRef();
});

/* ---------------- boot ---------------- */
function renderAll() {
  renderDue();
  renderMap();
  renderJob();
  renderShop();
  renderLog();
  $("refCodes").innerHTML = "";
  renderRef();
  renderTimerBar();
  renderHeader();
}
setView(state.view); /* repair() has already guaranteed this is a real view */
renderAll();
syncWake();
document.addEventListener("visibilitychange", () => { if (!document.hidden) { syncWake(); renderTimerBar(); } });

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
}
