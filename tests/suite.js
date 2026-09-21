/* jsdom test suite. Run with `npm test`. Exits non-zero on any failure.
   Adds no network: the font link is stripped and the scripts are evaluated by hand. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const SCRIPTS = ["data-jobs.js", "data-ref.js", "app.js"];

const EXPOSE = `
Object.defineProperties(window, {
  state: { get: () => state, configurable: true },
  spot:  { get: () => spot, set: v => { spot = v; }, configurable: true }
});
Object.assign(window, {
  BIKE, JOBS, SCHEDULE, SPOTS, INTERVALS, TOOLS, PARTS, STORES, MERGE, LINKS, QTY, ITEMQTY,
  SPECS, TORQUES, TROUBLE, DTC, DTC_HOWTO,
  jobById, toolById, findItem, groupOf, jobInterval, applies, activeJobs, lastDone,
  dueStatus, dueText, intervalLabel, buyLines, storePlan, togglePick,
  renderAll, renderDue, renderJob, renderMap, renderShop, renderParts, renderTools,
  renderBuyList, renderLog, renderRef, renderTimerBar, renderHeader,
  openJob, setView, startFresh, prefillLog, tick, miles, fmtTime,
  MARKS, DW
});
`;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL  " + m); } };
const eq = (a, b, m) => ok(a === b, m + "  [got " + JSON.stringify(a) + ", want " + JSON.stringify(b) + "]");
const group = t => console.log("\n" + t);

function boot(seed) {
  const html = read("index.html").replace(/<link[^>]*fonts\.(googleapis|gstatic)[^>]*>/g, "");
  const dom = new JSDOM(html, { url: "http://localhost:3000/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  /* jsdom 24 has no matchMedia, no AudioContext and no wakeLock; the app guards
     the last two itself, so only matchMedia needs a stand-in. */
  w.matchMedia = () => ({ matches: false, media: "", onchange: null, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { }, dispatchEvent() { return false; } });
  w.scrollTo = () => { };
  w.confirm = () => true;
  w.alert = () => { };
  w.Element.prototype.scrollIntoView = function () { };
  if (seed) seed(w.localStorage);
  /* The browser shares top-level `const` across separate <script> tags; eval does
     not, so the three files are evaluated as one and the symbols the tests poke
     at are re-exported onto the window. `state` and `spot` get live getters
     because the app reassigns them. */
  w.eval(SCRIPTS.map(read).join("\n;\n") + "\n;" + EXPOSE);
  w.$ = id => w.document.getElementById(id);
  return w;
}
const txt = (w, id) => w.$(id).textContent;
const click = (w, el) => { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); };

/* ---------------------------------------------------------------- */
group("Files and shell");
(() => {
  ["index.html", "styles.css", "app.js", "data-jobs.js", "data-ref.js", "sw.js", "manifest.webmanifest", "icon.svg", "README.md"].forEach(f => {
    ok(fs.existsSync(path.join(ROOT, f)), f + " exists");
  });
  const html = read("index.html");
  ok(!/cdn\.tailwindcss|cdnjs|jsdelivr/.test(html), "no script CDNs (the app must work with no signal)");
  ok(/<link rel="manifest"/.test(html), "manifest is linked");
  ["view-due", "view-jobs", "view-shop", "view-log", "view-ref"].forEach(v => ok(html.includes('id="' + v + '"'), v + " section present"));
  const man = JSON.parse(read("manifest.webmanifest"));
  ok(man.icons.some(i => i.purpose === "maskable"), "manifest has a maskable icon");
  man.icons.forEach(i => ok(fs.existsSync(path.join(ROOT, i.src)), "icon file " + i.src + " exists"));
  const sw = read("sw.js");
  ["index.html", "styles.css", "app.js", "data-jobs.js", "data-ref.js"].forEach(f => ok(sw.includes(f), "service worker precaches " + f));
})();

/* ---------------------------------------------------------------- */
group("Data integrity");
(() => {
  const w = boot();
  const { JOBS, SCHEDULE, SPOTS, TOOLS, PARTS, INTERVALS, TORQUES, SPECS, TROUBLE, DTC } = w;

  ok(JOBS.length >= 25, "at least 25 jobs (" + JOBS.length + ")");
  const ids = JOBS.map(j => j.id);
  eq(new Set(ids).size, ids.length, "job ids are unique");
  JOBS.forEach(j => {
    ok(!!j.title && !!j.lede && !!j.group, j.id + " has title, lede and group");
    ok(Array.isArray(j.steps) && j.steps.length > 2, j.id + " has real steps");
    j.steps.forEach((s, i) => {
      ok(!!s.t && !!s.b, j.id + " step " + i + " has a title and body");
      (s.tl || []).forEach(t => ok(!!w.toolById(t), j.id + " step " + i + " tool id '" + t + "' resolves"));
      if (s.loc) ok(SPOTS.some(p => p.id === s.loc), j.id + " step " + i + " location '" + s.loc + "' resolves");
      if (s.tm) ok(typeof s.tm[0] === "number" && s.tm[0] > 0 && !!s.tm[1], j.id + " step " + i + " timer is well formed");
    });
    j.at.forEach(k => ok(INTERVALS.some(i => i.k === k), j.id + " interval key '" + k + "' is known"));
  });

  SCHEDULE.forEach(s => {
    ok(!!s.label, "schedule item " + s.id + " has a label");
    if (s.job) ok(ids.indexOf(s.job) > -1, "schedule item " + s.id + " points at a real job");
    s.at.forEach(k => ok(INTERVALS.some(i => i.k === k), "schedule " + s.id + " interval '" + k + "' is known"));
  });

  const spotNums = SPOTS.map(s => s.n);
  eq(new Set(spotNums).size, spotNums.length, "diagram numbers are unique");
  eq(Math.min.apply(null, spotNums), 1, "diagram numbering starts at 1");

  const toolIds = [];
  TOOLS.forEach(g => g.items.forEach(t => toolIds.push(t.id)));
  PARTS.forEach(g => g.items.forEach(it => {
    ok(!!it.name, "part " + it.id + " has a name");
    ok(Array.isArray(it.where) && it.where.length, "part " + it.id + " says where to get it");
  }));
  Object.keys(w.MERGE).forEach(k => ok(!!w.findItem(k) && !!w.findItem(w.MERGE[k]), "merge pair " + k + " resolves"));
  Object.keys(w.LINKS).forEach(k => {
    ok(!!w.findItem(k), "link source " + k + " resolves");
    w.LINKS[k].forEach(t => ok(!!w.findItem(t), "link target " + t + " resolves"));
  });
  (PARTS.filter(g => g.jobs) || []).forEach(g => g.jobs.forEach(j => ok(ids.indexOf(j) > -1, "part group '" + g.cat + "' points at real job " + j)));
  TORQUES.forEach(t => (t.jobs || []).forEach(j => ok(ids.indexOf(j) > -1, "torque '" + t.item + "' points at real job " + j)));

  ok(SPECS.length >= 6, "spec tables present");
  ok(TROUBLE.length >= 15, "troubleshooting entries present");
  ok(DTC.length >= 18, "diagnostic codes present");
})();

/* ---------------------------------------------------------------- */
group("Manual figures");
(() => {
  const w = boot();
  const flat = w.SPECS.reduce((a, g) => a.concat(g.rows.map(r => r[0] + " = " + r[1])), []).join(" | ");
  [
    ["3.5 U.S. qt", "engine oil capacity"],
    ["26 U.S. oz", "primary capacity"],
    ["20-24 U.S. oz", "transmission capacity"],
    ["12.9 U.S. oz", "fork oil capacity"],
    ["0.038-0.043 in.", "spark plug gap"],
    ["950-1050 rpm", "carb idle speed"],
    ["5/16-3/8 in.", "belt deflection"],
    ["1/16-1/8 in.", "clutch free play"],
    ["90 psi", "compression"],
    ["30 psi", "front tire pressure"],
    ["36 psi", "rear tire pressure solo"],
    ["40 psi", "rear tire pressure two-up"],
    ["DOT 5 silicone", "brake fluid"],
    ["6R12", "spark plug type"],
    ["0.04 in.", "brake pad minimum"]
  ].forEach(([v, what]) => ok(flat.indexOf(v) > -1, "spec tables carry the " + what + " figure (" + v + ")"));

  const tq = w.TORQUES.map(t => t.item + " = " + t.v).join(" | ");
  [
    ["Oil tank drain plug", "14-21 ft-lb"],
    ["Transmission drain plug", "14-21 ft-lb"],
    ["Clutch inspection cover screws", "84-108 in-lb"],
    ["Spark plug", "11-18 ft-lb"],
    ["Rear axle nut", "60-65 ft-lb"],
    ["Fork tube cap", "40-60 ft-lb"],
    ["Primary chain adjuster shoe nut", "21-29 ft-lb"],
    ["Clutch adjusting screw locknut", "72-120 in-lb"],
    ["Air filter cover screw", "36-60 in-lb"],
    ["Jiffy stand leg stop bolt", "144-180 in-lb"]
  ].forEach(([item, v]) => {
    const row = w.TORQUES.find(x => x.item.indexOf(item) === 0);
    ok(!!row && row.v === v, "torque table: " + item + " is " + v);
  });

  const prim = w.TORQUES.find(t => /Primary chaincase drain plug/.test(t.item));
  ok(/2003/.test(prim.v) && /2005/.test(prim.v), "primary drain plug torque says the 2003 figure does not exist");

  /* safety rules that must never quietly disappear */
  const all = JSON.stringify(w.JOBS) + JSON.stringify(w.SPECS);
  ok(/jiffy stand/i.test(all), "the jiffy-stand warning survives");
  ok(/DOT 5\.1/.test(all), "the DOT 5.1 warning survives");
  ok(/SH and SJ|automotive oil/i.test(all), "the automotive-oil warning survives");
  ok(/cylinder head bolts/i.test(all), "the cylinder-head-bolt warning survives");
})();

/* ---------------------------------------------------------------- */
group("Due maths");
(() => {
  const w = boot();
  const oil = w.jobById("engine-oil");
  eq(w.jobInterval(oil), 5000, "engine oil recurs every 5,000 miles");
  eq(w.jobInterval(w.jobById("trans-level")), 2500, "transmission level check recurs every 2,500");
  eq(w.jobInterval(w.jobById("fork-oil")), 20000, "fork oil recurs every 20,000");
  eq(w.jobInterval(w.jobById("storage")), 0, "storage has no mileage interval");

  /* wording: a pre-ride check is not "as needed" */
  eq(w.intervalLabel(oil), "every 5,000 mi", "a mileage job says its interval");
  eq(w.intervalLabel(w.jobById("preride")), "every ride", "a pre-ride check says every ride");
  eq(w.intervalLabel(w.jobById("engine-level")), "every ride", "so does the oil level check");
  eq(w.intervalLabel(w.jobById("storage")), "as needed", "storage really is as needed");

  eq(w.dueStatus(oil).s, "never", "never logged reads as never");

  w.state.odo = "38000";
  w.state.log = [{ id: 1, date: "2026-01-01", miles: 35000, jobs: ["engine-oil"], parts: [], notes: "" }];
  eq(w.dueStatus(oil).s, "ok", "3,000 miles in is not due");
  eq(w.dueStatus(oil).left, 2000, "2,000 miles to go");

  w.state.odo = "39900";
  eq(w.dueStatus(oil).s, "soon", "within the 500-mile window reads as soon");

  w.state.odo = "40000";
  eq(w.dueStatus(oil).s, "now", "at the interval it is due");
  ok(/Due now/.test(w.dueText(w.dueStatus(oil))), "due-now wording");

  w.state.odo = "41200";
  eq(w.dueStatus(oil).s, "now", "past the interval it is still due");
  ok(/Overdue by 1,200 mi/.test(w.dueText(w.dueStatus(oil))), "overdue distance is spelled out");

  /* the newest log entry wins, not the last one typed */
  w.state.log.push({ id: 2, date: "2025-01-01", miles: 30000, jobs: ["engine-oil"], parts: [], notes: "" });
  eq(w.lastDone("engine-oil").miles, 35000, "highest odometer counts as last done");

  w.state.odo = "";
  eq(w.dueStatus(oil).s, "ok", "with no odometer nothing is forced due");
})();

/* ---------------------------------------------------------------- */
group("Due screen");
(() => {
  const w = boot();
  w.$("odoNow").value = "40000";
  w.$("odoNow").dispatchEvent(new w.Event("input", { bubbles: true }));
  eq(w.state.odo, "40000", "odometer is saved as you type");
  ok(txt(w, "odoLine").indexOf("40,000 mi") > -1, "header shows the odometer");
  ok(txt(w, "dueNow").indexOf("Never logged") > -1, "unlogged jobs show as never logged");
  ok(w.$("dueRide").children.length > 0, "the every-ride list is populated");
  ok(txt(w, "dueRide").indexOf("Pre-ride inspection") > -1, "pre-ride inspection is in the every-ride list");
  /* and is not repeated in the as-needed bucket */
  ok(txt(w, "dueRest").indexOf("Pre-ride inspection") < 0, "pre-ride checks are not also listed as needed");
  ok(txt(w, "dueRest").indexOf("Winter storage") > -1, "genuinely as-needed jobs still are");

  /* tapping a due row opens that job */
  const row = w.$("dueNow").querySelector("[data-job]");
  click(w, row);
  eq(w.state.view, "jobs", "tapping a due row switches to Jobs");
  ok(!!w.state.job, "a job is opened");
  eq(w.$("view-jobs").hidden, false, "jobs view is visible");
  eq(w.$("view-due").hidden, true, "due view is hidden");
})();

/* ---------------------------------------------------------------- */
group("Jobs and steps");
(() => {
  const w = boot();
  w.openJob("engine-oil");
  const body = txt(w, "jobBody");
  ok(body.indexOf("3.5 qt") > -1, "engine oil job shows the capacity");
  ok(body.indexOf("14-21 ft-lb") > -1, "engine oil job shows the drain plug torque");
  ok(body.indexOf("Hand tight only") > -1, "filter is called out as hand tight");
  ok(body.indexOf("Manual p. 65-67") > -1, "job cites its manual pages");

  const steps = w.$("jobBody").querySelectorAll("[data-toggle]");
  eq(steps.length, w.jobById("engine-oil").steps.length, "every step renders a row");
  click(w, steps[0]);
  ok(!!w.state.done["engine-oil:0"], "tapping a step row ticks it");
  eq(w.$("jobBody").querySelector("[data-toggle] .num").getAttribute("aria-checked"), "true", "the number box reports checked");
  click(w, w.$("jobBody").querySelectorAll("[data-toggle]")[0]);
  ok(!w.state.done["engine-oil:0"], "tapping again unticks it");

  /* every step ticked offers the log */
  const j = w.jobById("engine-oil");
  j.steps.forEach((_, i) => { w.state.done["engine-oil:" + i] = true; });
  w.renderJob();
  ok(txt(w, "jobBody").indexOf("All steps ticked") > -1, "finishing a job offers to log it");

  /* clear checkmarks */
  click(w, w.$("jobBody").querySelector("[data-clearsteps]"));
  eq(Object.keys(w.state.done).length, 0, "clear checkmarks empties that job");

  /* group filter */
  w.state.job = null; w.renderJob();
  const seg = w.$("jobSeg").querySelector('[data-g="Fluids"]');
  click(w, seg);
  eq(w.state.jgroup, "Fluids", "group filter sticks");
  const cards = w.$("jobList").querySelectorAll("[data-open]");
  ok(cards.length === w.JOBS.filter(x => x.group === "Fluids" && w.applies(x)).length, "only fluids jobs are listed");

  /* back button */
  w.openJob("trans-oil");
  click(w, w.$("jobBack"));
  eq(w.state.job, null, "back returns to the job list");
  eq(w.$("jobList").hidden, false, "job list is visible again");
})();

/* ---------------------------------------------------------------- */
group("Fuel system filter");
(() => {
  const w = boot();
  eq(w.state.fuel, "carb", "carbureted is the default");
  ok(w.activeJobs().some(j => j.id === "idle-speed"), "carb bikes see the idle speed job");
  ok(w.activeJobs().some(j => j.id === "enrichener"), "carb bikes see the choke cable job");
  w.$("fuelSel").value = "efi";
  w.$("fuelSel").dispatchEvent(new w.Event("change", { bubbles: true }));
  eq(w.state.fuel, "efi", "switching to EFI sticks");
  ok(!w.activeJobs().some(j => j.id === "idle-speed"), "EFI bikes do not see the idle speed job");
  ok(!w.activeJobs().some(j => j.id === "enrichener"), "EFI bikes do not see the choke cable job");
  ok(txt(w, "bikeLine").indexOf("EFI") > -1, "header names the fuel system");
  w.state.ref = "codes"; w.$("refCodes").innerHTML = ""; w.renderRef();
  ok(txt(w, "refCodes").indexOf("Front cylinder fuel injector") > -1, "EFI-only codes show on an EFI bike");
})();

/* ---------------------------------------------------------------- */
group("Timers");
(() => {
  const w = boot();
  w.openJob("primary-oil");
  const start = w.$("jobBody").querySelector('[data-act="tstart"]');
  ok(!!start, "a job with a timer offers to start one");
  click(w, start);
  const keys = Object.keys(w.state.timers);
  eq(keys.length, 1, "starting a timer records one end time");
  ok(w.state.timers[keys[0]] > Date.now(), "the end time is in the future");
  eq(w.$("timerBar").hidden, false, "the timer bar appears");
  const started = w.jobById("primary-oil").steps[+keys[0].split(":")[1]];
  ok(txt(w, "timerBar").indexOf(started.tm[1]) > -1, "the bar names the timer that was started");

  /* counting down must not rebuild the buttons, or taps get eaten */
  const before = w.$("jobBody").innerHTML;
  w.tick();
  eq(w.$("jobBody").innerHTML === before, true, "a tick does not rebuild the step list");

  click(w, w.$("jobBody").querySelector('[data-act="tcancel"]'));
  eq(Object.keys(w.state.timers).length, 0, "cancel clears the timer");
  eq(w.$("timerBar").hidden, true, "the bar goes away");

  /* an expired timer reads as done, not as a fresh countdown */
  w.state.timers["primary-oil:1"] = Date.now() - 1000;
  w.renderJob(); w.renderTimerBar();
  ok(txt(w, "jobBody").indexOf("Time's up") > -1, "an expired timer says time's up");
})();

/* ---------------------------------------------------------------- */
group("Parts picking");
(() => {
  const w = boot();
  w.state.shop = "parts"; w.renderShop();
  const pick = id => click(w, w.$("parts").querySelector('[data-id="' + id + '"]'));

  pick("kn171c");
  ok(!!w.state.have.kn171c, "filter pick sticks");
  const others = w.$("parts").querySelectorAll('[data-id="napa1215"]')[0];
  eq(others.disabled, true, "the other filters lock out while one is picked");

  pick("mobil");
  ok(!!w.state.have["t-mobil"] && !!w.state.have["p-mobil"], "Mobil 1 fills the transmission and primary too");
  ok(!!w.state.linked["t-mobil"], "the auto-filled picks are tracked as linked");

  /* an explicit choice must not be overwritten */
  w.state.have = {}; w.state.linked = {}; w.renderParts();
  pick("redline");
  pick("mobil");
  ok(!!w.state.have.redline, "an explicit transmission pick survives picking Mobil 1");
  ok(!w.state.have["t-mobil"], "Mobil 1 does not overwrite it");
  ok(!!w.state.have["p-mobil"], "but it still fills the empty primary");

  /* unpicking the engine oil clears only what it filled */
  w.state.have = {}; w.state.linked = {}; w.renderParts();
  pick("mobil"); pick("mobil");
  eq(Object.keys(w.state.have).length, 0, "unpicking the engine oil clears its linked picks");

  /* The lock is what stops a swap being a half-swap: with Mobil 1 picked
     there is no way to tap another engine oil, so the only route out is
     Change, which has to take the auto-fills with it. */
  w.state.have = {}; w.state.linked = {}; w.renderParts();
  pick("mobil");
  eq(w.$("parts").querySelector('[data-id="castrol"]').disabled, true, "another engine oil cannot be tapped while one is picked");
  pick("castrol");
  ok(!w.state.have.castrol, "and tapping it does nothing");
  /* data-clear carries the PARTS index; 1 is the engine oil. The transmission
     and primary have their own Change buttons showing, from the auto-fill. */
  click(w, w.$("parts").querySelector('[data-clear="1"]'));
  eq(Object.keys(w.state.have).length, 0, "Change on the engine oil clears what it auto-filled");
  eq(Object.keys(w.state.linked).length, 0, "and nothing is left flagged as matched");
  ok(txt(w, "parts").indexOf("Matched to your engine oil") < 0, "no category still claims a match");

  /* togglePick's replacement branch is unreachable while the lock holds, but
     it is the one place that would stage a swap, so it has to unlink too. */
  w.state.have = {}; w.state.linked = {}; w.renderParts();
  w.togglePick("mobil"); w.togglePick("castrol");
  ok(!!w.state.have.castrol && !w.state.have.mobil, "replacing a pick swaps it");
  ok(!w.state.have["t-mobil"] && !w.state.have["p-mobil"], "and drops the old pick's auto-fills");

  /* a hand-picked category is the user's, whichever way the engine oil goes */
  w.state.have = {}; w.state.linked = {}; w.renderParts();
  w.togglePick("redline"); w.togglePick("mobil"); w.togglePick("castrol");
  ok(!!w.state.have.redline, "an explicit transmission pick survives the swap");
  ok(!w.state.have["p-mobil"], "but the auto-filled primary does not");

  /* Change button */
  w.state.have = {}; w.renderParts();
  pick("kn171c");
  click(w, w.$("parts").querySelector("[data-clear]"));
  ok(!w.state.have.kn171c, "Change clears the pick");

  /* store filter */
  click(w, w.$("filters").querySelector('[data-s="NAPA"]'));
  eq(w.state.store, "NAPA", "store filter sticks");
  ok(txt(w, "parts").indexOf("NAPA") > -1, "NAPA parts are listed");
})();

/* ---------------------------------------------------------------- */
group("Buy list");
(() => {
  const w = boot();
  w.state.shop = "list"; w.renderShop();
  ok(txt(w, "shopList").indexOf("Nothing picked yet") > -1, "empty buy list explains itself");

  w.state.have = { kn171c: true, mobil: true, "t-mobil": true, "p-mobil": true, oring: true };
  w.state.linked = { "t-mobil": true, "p-mobil": true };
  const lines = w.buyLines();
  const mobil = lines.find(l => l.key === "mobil");
  ok(!!mobil, "the same oil in three places becomes one line");
  eq(mobil.qty, 6, "quantities add up to 6 quarts");
  eq(lines.find(l => l.key === "oring").qty, 2, "two O-rings");
  eq(lines.length, 3, "filter, oil and O-rings are three lines");

  w.renderBuyList();
  const body = txt(w, "shopList");
  ok(body.indexOf("K&N KN-171C") > -1, "the filter is listed");
  ok(body.indexOf("From the dealer") > -1, "items no parts store carries are called out");

  /* cart ticks */
  click(w, w.$("shopList").querySelector('[data-buy="mobil"]'));
  ok(!!w.state.bought.mobil, "ticking a line puts it in the cart");
  ok(txt(w, "shopList").indexOf("1 of 3 in cart") > -1, "the cart count is shown");

  /* prices */
  const inp = w.$("shopList").querySelector('[data-price="mobil"]');
  inp.value = "10.00";
  inp.dispatchEvent(new w.Event("input", { bubbles: true }));
  eq(w.state.prices.mobil, "10.00", "the price is saved");
  eq(w.$("buyTotal").textContent, "$60.00", "6 quarts at $10 totals $60");

  /* store coverage */
  const plan = w.storePlan(w.buyLines());
  ok(Array.isArray(plan.covers), "a store plan is worked out");
  ok(plan.dealer.length >= 1, "the O-rings count as dealer only");

  /* The same bottle is one line even when the category that names it in full
     is not itself picked: two 1 qt Mobil 1 lines used to read as two products. */
  const w2 = boot();
  w2.state.have = { "t-mobil": true, "p-mobil": true };
  const same = w2.buyLines();
  eq(same.length, 1, "Mobil 1 in the transmission and the primary is one line");
  eq(same[0].qty, 2, "and two quarts of it");
  eq(same[0].cats.join(", "), "Transmission, Primary chaincase", "the line says which categories it covers");
  w2.state.have = { "p-castrol": true };
  eq(w2.buyLines()[0].key, "castrol", "the primary Castrol merges onto the Castrol line too");
})();

/* ---------------------------------------------------------------- */
group("Tools");
(() => {
  const w = boot();
  w.state.shop = "tools"; w.renderShop();
  const t = w.$("tools").querySelector('[data-tool="t27"]');
  ok(!!t, "the T27 bit is listed");
  click(w, t);
  ok(!!w.state.tools.t27, "checking a tool sticks");
  click(w, w.$("resetTools"));
  eq(Object.keys(w.state.tools).length, 0, "clearing empties the tool checks");
  ok(txt(w, "tools").indexOf("Confirm fit") > -1, "tool sizes are flagged to test-fit");
})();

/* ---------------------------------------------------------------- */
group("Service log");
(() => {
  const w = boot();
  w.setView("log"); w.renderLog();
  ok(txt(w, "history").indexOf("Nothing logged yet") > -1, "an empty log says so");

  /* validation */
  w.$("fOdo").value = "";
  click(w, w.$("fSave"));
  eq(w.$("fErr").hidden, false, "a missing odometer is rejected");
  eq(w.state.log.length, 0, "and nothing is saved");

  w.$("fOdo").value = "40000";
  click(w, w.$("fSave"));
  ok(/at least one job/.test(w.$("fErr").textContent), "saving with no job ticked is rejected");

  w.$("fOdo").value = "40000";
  w.$("fNote").value = "Drain plugs clean";
  w.$("fItems").querySelector('input[value="engine-oil"]').checked = true;
  w.$("fItems").querySelector('input[value="trans-oil"]').checked = true;
  click(w, w.$("fSave"));
  eq(w.state.log.length, 1, "a valid entry saves");
  eq(w.state.log[0].miles, 40000, "the odometer is recorded");
  eq(w.state.log[0].jobs.length, 2, "both jobs are recorded");
  eq(w.state.odo, "40000", "logging updates the current odometer");

  /* back-filling an older service must not wind the odometer backwards */
  w.$("fOdo").value = "22000";
  w.$("fItems").querySelector('input[value="primary-oil"]').checked = true;
  click(w, w.$("fSave"));
  eq(w.state.odo, "40000", "logging an older service leaves the current odometer alone");
  eq(w.state.log.length, 2, "the older entry is still saved");
  w.state.log = w.state.log.filter(e => e.miles === 40000);
  w.renderLog();
  ok(txt(w, "history").indexOf("40,000 mi") > -1, "the entry appears in history");
  ok(txt(w, "history").indexOf("Drain plugs clean") > -1, "notes are kept");
  ok(txt(w, "logSaved").indexOf("Logged") > -1, "a confirmation is shown");

  /* the log drives the due screen */
  w.state.odo = "42000"; w.renderDue();
  eq(w.dueStatus(w.jobById("engine-oil")).s, "ok", "a logged oil change is no longer due");
  eq(w.dueStatus(w.jobById("primary-oil")).s, "never", "an unlogged job still reads as never");

  /* opening the log from a job pre-ticks it */
  w.prefillLog("primary-oil"); w.renderLog();
  eq(w.$("fItems").querySelector('input[value="primary-oil"]').checked, true, "logging from a job pre-ticks that job");

  /* delete */
  click(w, w.$("history").querySelector("[data-del]"));
  eq(w.state.log.length, 0, "an entry can be deleted");

  /* An entry records the parts for the jobs it covers, not every current pick.
     A tire check used to come out listing the engine oil and the brake fluid. */
  const w2 = boot();
  w2.setView("log");
  w2.state.have = { kn171c: true, mobil: true, "t-mobil": true, "p-mobil": true, dot5: true };
  w2.renderLog();
  w2.$("fOdo").value = "31000";
  w2.$("fItems").querySelector('input[value="tires"]').checked = true;
  click(w2, w2.$("fSave"));
  eq(w2.state.log[0].parts.length, 0, "a tire check records no parts");

  w2.renderLog();
  w2.$("fOdo").value = "32000";
  w2.$("fItems").querySelector('input[value="engine-oil"]').checked = true;
  click(w2, w2.$("fSave"));
  const oil = w2.state.log.find(e => e.miles === 32000).parts;
  ok(oil.indexOf("K&N KN-171C (chrome)") > -1, "an oil change records the filter");
  ok(oil.some(p => /Mobil 1/.test(p)), "and the engine oil");
  ok(oil.indexOf("DOT 5 silicone brake fluid") < 0, "but not the brake fluid");
})();

/* ---------------------------------------------------------------- */
group("Start fresh and backup");
(() => {
  const w = boot();
  w.state.done = { "engine-oil:0": true };
  w.state.timers = { "engine-oil:0": Date.now() + 9999 };
  w.state.tools = { t27: true };
  w.state.bought = { mobil: true };
  w.state.have = { kn171c: true };
  w.state.prices = { kn171c: "19.99" };
  w.state.log = [{ id: 1, date: "2026-01-01", miles: 30000, jobs: ["engine-oil"], parts: [], notes: "" }];
  w.startFresh();
  eq(Object.keys(w.state.done).length, 0, "start fresh clears step checkmarks");
  eq(Object.keys(w.state.timers).length, 0, "start fresh clears timers");
  eq(Object.keys(w.state.tools).length, 0, "start fresh clears tool checks");
  eq(Object.keys(w.state.bought).length, 0, "start fresh clears cart checks");
  ok(!!w.state.have.kn171c, "start fresh keeps parts picks");
  eq(w.state.prices.kn171c, "19.99", "start fresh keeps prices");
  eq(w.state.log.length, 1, "start fresh keeps the service log");

  /* saved state survives a reload */
  const saved = w.localStorage.getItem("hd-maint-v1");
  ok(!!saved && JSON.parse(saved).log.length === 1, "state is written to localStorage");
  const w2 = boot(ls => ls.setItem("hd-maint-v1", saved));
  eq(w2.state.log.length, 1, "state reloads");
  eq(w2.state.have.kn171c, true, "picks reload");

  /* damaged saved data must not brick the app */
  const w3 = boot(ls => ls.setItem("hd-maint-v1", JSON.stringify({ done: "nope", log: "nope", have: null, fuel: "diesel" })));
  eq(typeof w3.state.done, "object", "a bad done field is repaired");
  ok(Array.isArray(w3.state.log), "a bad log field is repaired");
  eq(w3.state.fuel, "carb", "an unknown fuel system falls back to carb");
  const w4 = boot(ls => ls.setItem("hd-maint-v1", "{{not json"));
  eq(w4.state.log.length, 0, "unparseable saved data starts clean");

  /* A tab field holding something no panel answers to hid every panel on that
     screen, leaving a bare segmented control over nothing. */
  const w5 = boot(ls => ls.setItem("hd-maint-v1", JSON.stringify({
    view: "bogus", shop: "bogus", ref: "bogus", jgroup: "bogus", store: "bogus"
  })));
  eq(w5.state.view, "due", "an unknown view falls back to What's due");
  eq(w5.state.shop, "list", "an unknown shop tab falls back to the buy list");
  eq(w5.state.ref, "specs", "an unknown reference tab falls back to specs");
  eq(w5.state.jgroup, "All", "an unknown job group falls back to All");
  eq(w5.state.store, "All", "an unknown store filter falls back to All");
  eq(w5.$("shopList").hidden, false, "the buy list is actually on screen");
  eq(w5.$("refSpecs").hidden, false, "and so is the spec table");
})();

/* ---------------------------------------------------------------- */
group("Migration from the oil-change app");
(() => {
  const old = {
    have: { kn171c: true, mobil: true }, tools: { t27: true }, prices: { kn171c: "19.99" }, odo: "35000",
    log: [{ id: 7, date: "2026-03-02", miles: 35000, done: ["Engine oil and filter", "Transmission", "Primary"], parts: ["K&N KN-171C"], notes: "all three" }]
  };
  const w = boot(ls => ls.setItem("softail-oil-v1", JSON.stringify(old)));
  eq(w.state.odo, "35000", "the old odometer carries over");
  ok(!!w.state.have.kn171c, "old parts picks carry over");
  eq(w.state.prices.kn171c, "19.99", "old prices carry over");
  eq(w.state.log.length, 1, "the old log carries over");
  eq(w.state.log[0].jobs.length, 3, "old free-text jobs map onto the new job ids");
  ok(w.state.log[0].jobs.indexOf("engine-oil") > -1, "engine oil is recognised");
  ok(w.state.log[0].jobs.indexOf("primary-oil") > -1, "primary is recognised");
  eq(w.dueStatus(w.jobById("engine-oil")).next, 40000, "the migrated log drives the next due mileage");

  /* new data must win over the old app's data */
  const w2 = boot(ls => {
    ls.setItem("softail-oil-v1", JSON.stringify(old));
    ls.setItem("hd-maint-v1", JSON.stringify({ v: 2, odo: "50000", log: [] }));
  });
  eq(w2.state.odo, "50000", "existing app data is not overwritten by the old app's");
})();

/* ---------------------------------------------------------------- */
group("Reference screens");
(() => {
  const w = boot();
  w.setView("ref"); w.renderRef();
  ok(txt(w, "refSpecs").indexOf("3.5 U.S. qt") > -1, "specs render");
  ok(txt(w, "refSpecs").indexOf("Table 4") > -1, "specs cite their manual table");

  click(w, w.$("refSeg").querySelector('[data-ref="torque"]'));
  eq(w.state.ref, "torque", "the torque tab opens");
  eq(w.$("refTorque").hidden, false, "torque is visible");
  eq(w.$("refSpecs").hidden, true, "specs are hidden");
  ok(txt(w, "refTorque").indexOf("14-21 ft-lb") > -1, "torque figures render");
  ok(txt(w, "refTorque").indexOf("19-29 N-m") > -1, "newton-metres render too");

  click(w, w.$("refSeg").querySelector('[data-ref="fix"]'));
  ok(txt(w, "refFix").indexOf("Engine will not crank") > -1, "symptoms render");
  ok(txt(w, "refFix").indexOf("Clutch slips") > -1, "clutch symptoms render");

  click(w, w.$("refSeg").querySelector('[data-ref="codes"]'));
  ok(txt(w, "refCodes").indexOf("Rear cylinder ignition coil") > -1, "code 25 is listed");
  ok(txt(w, "refCodes").indexOf("six rapid flashes") > -1, "how to read the codes is explained");
  ok(txt(w, "refCodes").indexOf("Harley-Davidson equipment") > -1, "it says clearing codes needs a dealer");
})();

/* ---------------------------------------------------------------- */
group("Diagram");
(() => {
  const w = boot();
  w.renderMap();
  const svgs = w.$("map").querySelectorAll("svg");
  eq(svgs.length, 2, "both sides of the bike are drawn");
  eq(w.$("legend").children.length, w.SPOTS.length, "every location is in the legend");
  const marked = new Set();
  w.$("map").querySelectorAll("[data-spot]").forEach(g => marked.add(g.dataset.spot));
  w.SPOTS.forEach(s => ok(marked.has(s.id), "location " + s.n + " (" + s.name + ") is marked on the diagram"));

  /* The two views are one drawing mirrored about DW/2, and the viewBox is the
     band that mirrors onto itself, so both sides frame the bike identically. */
  const vb = svgs[0].getAttribute("viewBox").split(" ").map(Number);
  eq(svgs[1].getAttribute("viewBox"), svgs[0].getAttribute("viewBox"), "both sides use the same viewBox");
  eq(vb[0] + vb[0] + vb[2], w.DW, "the viewBox is centred on the mirror line, so neither side is cropped");
  eq(svgs[0].querySelector("g").getAttribute("transform"), null, "the right side is the drawing as authored");
  ok(/scale\(-1,1\)/.test(svgs[1].querySelector("g").getAttribute("transform") || ""), "the left side is the mirror of it");

  /* Marker placement. Nothing may point off the edge of the drawing, and two
     badges on one side must not sit on top of each other — a buried number is
     a number you can't tap and can't read. */
  const inside = (x, y) => x >= vb[0] + 11 && x <= vb[0] + vb[2] - 11 && y >= vb[1] + 11 && y <= vb[1] + vb[3] - 11;
  w.MARKS.forEach(m => {
    ok(w.SPOTS.some(s => s.id === m.id), "marker " + m.id + " is a real location");
    ok(["r", "l", "b"].includes(m.s), "marker " + m.id + " names a side");
    ok(inside(m.x, m.y) && inside(w.DW - m.x, m.y), "marker " + m.id + " sits inside the frame on both sides");
    (m.t || []).forEach(p => ok(inside(p[0], p[1]), "marker " + m.id + " leads to a point inside the frame"));
  });
  ["r", "l"].forEach(side => {
    const on = w.MARKS.filter(m => m.s === side || m.s === "b");
    on.forEach((a, i) => on.slice(i + 1).forEach(b => {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      ok(d >= 22, "markers " + a.id + " and " + b.id + " don't overlap on the " + side + " side  [" + d.toFixed(1) + " apart]");
    }));
  });
  eq(w.MARKS.filter(m => m.s === "l" || m.s === "b").length, svgs[1].querySelectorAll("[data-spot]").length, "the left view draws its markers and no others");
  ["ccover", "pdrain", "pchain", "belt", "jiffy"].forEach(id =>
    ok(!svgs[0].querySelector('[data-spot="' + id + '"]'), id + " is a left-side part, so it isn't marked on the right"));
  ["aircleaner", "plugs", "battery", "fmaster", "rmaster"].forEach(id =>
    ok(!svgs[1].querySelector('[data-spot="' + id + '"]'), id + " is a right-side part, so it isn't marked on the left"));

  const first = w.$("legend").querySelector("[data-spot]");
  click(w, first);
  ok(!!w.spot, "tapping the legend highlights a location");
  click(w, w.$("legend").querySelector("[data-spot]"));
  eq(w.spot, null, "tapping it again clears the highlight");

  /* Show where from a step */
  w.openJob("engine-oil");
  const where = w.$("jobBody").querySelector('[data-act="where"]');
  ok(!!where, "steps with a location offer Show where");
  click(w, where);
  ok(!!w.spot, "Show where highlights the location");
  eq(w.$("mapBox").open, true, "and opens the diagram");
})();

/* ---------------------------------------------------------------- */
group("Navigation and accessibility");
(() => {
  const w = boot();
  const nav = w.document.querySelectorAll("nav.bar button");
  eq(nav.length, 5, "five nav buttons");
  ["due", "jobs", "shop", "log", "ref"].forEach(v => {
    click(w, w.document.querySelector('nav.bar [data-view="' + v + '"]'));
    eq(w.state.view, v, "nav opens " + v);
    eq(w.$("view-" + v).hidden, false, v + " section is shown");
    eq(w.document.querySelector('nav.bar [data-view="' + v + '"]').getAttribute("aria-current"), "page", v + " button marks itself current");
    const otherHidden = ["due", "jobs", "shop", "log", "ref"].filter(x => x !== v).every(x => w.$("view-" + x).hidden);
    ok(otherHidden, "only " + v + " is visible");
  });

  /* an open job must not leave its title over another view */
  w.openJob("engine-oil");
  eq(txt(w, "viewTitle"), "Engine oil and filter", "an open job names the screen");
  click(w, w.document.querySelector('nav.bar [data-view="ref"]'));
  eq(txt(w, "viewTitle"), "Reference", "switching tabs with a job open renames the screen");
  click(w, w.document.querySelector('nav.bar [data-view="due"]'));
  eq(txt(w, "viewTitle"), "What's due", "and again on the due screen");

  w.openJob("engine-oil");
  const box = w.$("jobBody").querySelector(".num");
  eq(box.getAttribute("role"), "checkbox", "step number boxes are real checkboxes");
  ok(!!box.getAttribute("aria-label"), "step checkboxes are labelled");
  w.$("map").querySelectorAll("[data-spot]").forEach(g => ok(!!g.getAttribute("aria-label"), "diagram markers are labelled"));
  const html = read("index.html");
  ok(/lang="en"/.test(html), "the page declares a language");
  ok(/viewport-fit=cover/.test(html), "the viewport handles the notch");
})();

/* ---------------------------------------------------------------- */
group("CSS class collisions");
(() => {
  /* Twice now a modifier like `chip due` has been silently restyled by a
     standalone rule of the same name (`.due` for the due-list row, `.spec` for
     the spec table). jsdom does no layout, so a lint is the only guard. */
  const css = read("styles.css");
  const LAYOUT = /(^|;)\s*(display|width|height|padding|margin|border(?!-color)|flex|position|float|grid)\b/;
  const standalone = new Map();
  css.replace(/([^{}@]+)\{([^}]*)\}/g, (m, sel, body) => {
    sel.split(",").forEach(s => {
      const hit = /^\s*\.([A-Za-z0-9_-]+)\s*$/.exec(s);
      if (hit && LAYOUT.test(body)) standalone.set(hit[1], body.trim().slice(0, 60));
    });
    return m;
  });
  ok(standalone.size > 0, "the linter found standalone class rules to check against");

  const BASES = ["chip", "btn", "duerow", "step", "check", "stick", "tbtn", "box", "card", "seg", "pills", "warn", "note"];
  const clashes = [];
  (read("app.js").match(/class="[^"$]+"/g) || []).forEach(attr => {
    const names = attr.slice(7, -1).trim().split(/\s+/);
    const base = names.find(n => BASES.indexOf(n) > -1);
    if (!base) return;
    names.forEach(n => {
      if (n !== base && BASES.indexOf(n) < 0 && standalone.has(n)) clashes.push(base + " + " + n + "  (." + n + " sets: " + standalone.get(n) + ")");
    });
  });
  ok(clashes.length === 0, "no modifier class is also a standalone layout rule: " + clashes.join("; "));

  /* the two that actually bit us stay renamed */
  ok(!/\.chip\.due\b/.test(css), ".chip.due is gone (it collided with the due-row class)");
  ok(!/(^|\n)\.spec\{/.test(css), "the bare .spec table class is gone (it collided with the chip modifier)");
  ok(/\.duerow\{/.test(css) && /\.chip\.overdue\{/.test(css), "the renamed classes are in place");
})();

/* ---------------------------------------------------------------- */
group("Responsive layout");
(() => {
  const css = read("styles.css");
  const html = read("index.html");

  /* the hooks the media queries hang off must exist in the markup */
  ok(/<p class="brand"/.test(html), "the nav has a brand line for the desktop rail");
  ok(/aria-hidden="true"/.test((html.match(/<p class="brand"[^>]*>/) || [""])[0]), "the brand line is hidden from screen readers");
  ok(/id="odoCard"/.test(html), "the odometer card is addressable");
  ok(/id="rideCard"/.test(html), "the every-ride card is addressable");
  ok(/<div class="fieldrow">[\s\S]*?id="fOdo"[\s\S]*?id="fDate"[\s\S]*?<\/div>\s*<\/div>/.test(html), "odometer and date share a field row");

  const w = boot();
  /* label/input pairing must survive the field-row wrapper */
  ["fOdo", "fDate", "odoNow", "fNote"].forEach(id => {
    const lbl = w.document.querySelector('label[for="' + id + '"]');
    ok(!!lbl && !!w.$(id), "the " + id + " field still has its label");
  });

  /* parts and tools wrap each heading+card pair so they can be gridded */
  w.state.shop = "parts"; w.renderShop();
  eq(w.$("parts").querySelectorAll(".cardgroup").length, w.PARTS.length, "every parts category is one group");
  w.$("parts").querySelectorAll(".cardgroup").forEach(sec => {
    ok(!!sec.querySelector("h2") && !!sec.querySelector(".card"), "a parts group holds its heading and its card");
  });
  w.state.shop = "tools"; w.renderShop();
  eq(w.$("tools").querySelectorAll(".cardgroup").length, w.TOOLS.length, "every tool category is one group");

  /* the breakpoints themselves */
  [359, 600, 760, 900, 1000, 1280].forEach(bp => {
    ok(css.indexOf("width:" + bp + "px") > -1, "there is a rule for " + bp + "px");
  });
  ok(/max-height:520px\) and \(orientation:landscape\)/.test(css), "a phone on its side gets a shorter nav");
  ok(/@media \(orientation:landscape\)[\s\S]{0,200}env\(safe-area-inset-left\)/.test(css), "landscape keeps clear of the notch");

  /* the side rail actually replaces the bottom bar */
  const rail = css.slice(css.indexOf("@media (min-width:900px)"));
  ok(/border-top:0/.test(rail), "the rail drops the bottom border");
  ok(/border-right:1px solid var\(--line\)/.test(rail), "the rail gets a right border");
  ok(/padding-left:calc\(224px/.test(rail), "the page leaves room for the rail");
  ok(/\.timerbar\{left:calc\(224px/.test(rail), "the timer bar clears the rail");
  ok(/nav\.bar \.brand\{[^}]*display:block/.test(rail), "the brand line shows on the rail");

  /* hidden views must stay hidden even where a media query makes them grids */
  ok(/\[hidden\]\{display:none!important\}/.test(css), "[hidden] still wins over the grid rules");
  ["jobList", "refTorque", "refCodes", "refFix"].forEach(id => {
    ok(css.indexOf("#" + id) > -1, "#" + id + " has a responsive rule");
  });

  /* balanced braces: an unclosed media query silently eats the rest of the file */
  eq((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length, "stylesheet braces balance");

  /* Balanced comments, for the same reason. Braces alone cannot catch this:
     a `/*` with no closing pair swallows whole rules while leaving the brace
     count even, which is exactly how the print block sat dead. */
  eq((css.match(/\/\*/g) || []).length, (css.match(/\*\//g) || []).length, "stylesheet comments are all closed");
  const live = css.replace(/\/\*[\s\S]*?\*\//g, "");
  ok(/@media print\{/.test(live), "the print rules are not commented out");
  ok(/@media print\{[^}]*nav\.bar[^}]*display:none/.test(live), "printing drops the nav bar");

  /* the service worker must be re-versioned whenever the shell changes */
  ok(/const CACHE = "softail-service-v[2-9]\d*"/.test(read("sw.js")), "the cache name was bumped past v1");
})();

/* ---------------------------------------------------------------- */
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
