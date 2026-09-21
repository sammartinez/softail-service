/* Data integrity and the manual's figures.

   Ported from the jsdom suite. These never needed a DOM — they only ever read
   the data — so here they import the modules directly and need no boot at all.

   src/data/schema.ts checks most of the cross-references at build time now.
   These stay because a failing test names the thing and the reason, and
   because the manual-figure checks are not shape checks at all: they are pins
   on numbers a person would have to look up in the Clymer again. */

import { describe, it, expect } from "vitest";
import { JOBS, SCHEDULE, SPOTS, INTERVALS } from "../src/data/jobs";
import { SPECS, TORQUES, TROUBLE, DTC, PARTS, TOOLS, MERGE, LINKS } from "../src/data/ref";
import { toolById, findItem } from "../src/lib/format";
import { check } from "../src/data/schema";

const jobIds = JOBS.map(j => j.id);

describe("schema", () => {
  it("every structure and cross-reference validates", () => {
    expect(() => check()).not.toThrow();
  });
});

describe("jobs", () => {
  it("has at least 25 jobs with unique ids", () => {
    expect(JOBS.length).toBeGreaterThanOrEqual(25);
    expect(new Set(jobIds).size).toBe(jobIds.length);
  });

  it.each(JOBS)("$id is complete and its references resolve", j => {
    expect(j.title && j.lede && j.group).toBeTruthy();
    expect(j.steps.length).toBeGreaterThan(2);
    j.steps.forEach((s, i) => {
      expect(s.t, `${j.id} step ${i} title`).toBeTruthy();
      expect(s.b, `${j.id} step ${i} body`).toBeTruthy();
      (s.tl || []).forEach(t =>
        expect(toolById(t), `${j.id} step ${i} tool '${t}'`).toBeTruthy());
      if (s.loc) {
        expect(SPOTS.some(p => p.id === s.loc), `${j.id} step ${i} location '${s.loc}'`).toBe(true);
      }
      if (s.tm) {
        expect(typeof s.tm[0] === "number" && s.tm[0] > 0 && !!s.tm[1],
          `${j.id} step ${i} timer`).toBe(true);
      }
    });
    j.at.forEach(k =>
      expect(INTERVALS.some(i => i.k === k), `${j.id} interval '${k}'`).toBe(true));
  });
});

describe("schedule", () => {
  it.each(SCHEDULE)("$id is labelled and resolves", s => {
    expect(s.label).toBeTruthy();
    if (s.job) expect(jobIds).toContain(s.job);
    s.at.forEach(k => expect(INTERVALS.some(i => i.k === k), `${s.id} interval '${k}'`).toBe(true));
  });
});

describe("diagram spots", () => {
  it("numbers are unique and start at 1", () => {
    const ns = SPOTS.map(s => s.n);
    expect(new Set(ns).size).toBe(ns.length);
    expect(Math.min(...ns)).toBe(1);
  });
});

describe("parts and tools", () => {
  it.each(PARTS.flatMap(g => g.items))("part $id has a name and somewhere to buy it", it_ => {
    expect(it_.name).toBeTruthy();
    expect(it_.where.length).toBeGreaterThan(0);
  });

  it("MERGE and LINKS pairs resolve", () => {
    Object.keys(MERGE).forEach(k => {
      expect(findItem(k), `merge source ${k}`).toBeTruthy();
      expect(findItem(MERGE[k]!), `merge target ${MERGE[k]}`).toBeTruthy();
    });
    Object.keys(LINKS).forEach(k => {
      expect(findItem(k), `link source ${k}`).toBeTruthy();
      LINKS[k]!.forEach(t => expect(findItem(t), `link target ${t}`).toBeTruthy());
    });
  });

  it("part groups and torques point at real jobs", () => {
    PARTS.forEach(g => g.jobs.forEach(j =>
      expect(jobIds, `part group '${g.cat}'`).toContain(j)));
    TORQUES.forEach(t => (t.jobs || []).forEach(j =>
      expect(jobIds, `torque '${t.item}'`).toContain(j)));
  });

  it("part ids and tool ids stay separate namespaces", () => {
    /* antiseize, dgrease and wgrease exist in both. If a refactor ever merged
       them, a step's tool chip would start resolving to a product listing. */
    const partIds = new Set(PARTS.flatMap(g => g.items.map(i => i.id)));
    const toolIds = TOOLS.flatMap(g => g.items.map(t => t.id));
    const overlap = toolIds.filter(t => partIds.has(t));
    expect(overlap.sort()).toEqual(["antiseize", "dgrease", "wgrease"]);
  });
});

describe("reference tables", () => {
  it("are all present", () => {
    expect(SPECS.length).toBeGreaterThanOrEqual(6);
    expect(TROUBLE.length).toBeGreaterThanOrEqual(15);
    expect(DTC.length).toBeGreaterThanOrEqual(18);
  });
});

/* ---- the manual's own figures ---------------------------------------- */

const flatSpecs = SPECS.flatMap(g => g.rows.map(r => r[0] + " = " + r[1])).join(" | ");

describe("figures from the Clymer manual", () => {
  it.each([
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
    ["0.04 in.", "brake pad minimum"],
  ])("spec tables carry %s (%s)", v => {
    expect(flatSpecs).toContain(v);
  });

  it.each([
    ["Oil tank drain plug", "14-21 ft-lb"],
    ["Transmission drain plug", "14-21 ft-lb"],
    ["Clutch inspection cover screws", "84-108 in-lb"],
    ["Spark plug", "11-18 ft-lb"],
    ["Rear axle nut", "60-65 ft-lb"],
    ["Fork tube cap", "40-60 ft-lb"],
    ["Primary chain adjuster shoe nut", "21-29 ft-lb"],
    ["Clutch adjusting screw locknut", "72-120 in-lb"],
    ["Air filter cover screw", "36-60 in-lb"],
    ["Jiffy stand leg stop bolt", "144-180 in-lb"],
  ])("torque table: %s is %s", (item, v) => {
    const row = TORQUES.find(x => x.item.indexOf(item) === 0);
    expect(row, `no torque row starting "${item}"`).toBeTruthy();
    expect(row!.v).toBe(v);
  });

  it("the primary drain plug still says the 2003 figure does not exist", () => {
    /* The manual gives a torque only for 2005. For a 2003 it says "tighten
       securely", and the plug strips easily. */
    const prim = TORQUES.find(t => /Primary chaincase drain plug/.test(t.item));
    expect(prim).toBeTruthy();
    expect(prim!.v).toMatch(/2003/);
    expect(prim!.v).toMatch(/2005/);
  });
});

describe("safety rules that must never quietly disappear", () => {
  const all = JSON.stringify(JOBS) + JSON.stringify(SPECS);
  it.each([
    [/jiffy stand/i, "the jiffy-stand warning"],
    [/DOT 5\.1/, "the DOT 5.1 warning"],
    [/SH and SJ|automotive oil/i, "the automotive-oil warning"],
    [/cylinder head bolts/i, "the cylinder-head-bolt warning"],
  ])("%s survives", re => {
    expect(all).toMatch(re as RegExp);
  });
});
