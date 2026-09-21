/* Due maths, the buy list and the pick-one rules.

   Ported from the jsdom suite's "Due maths", "Buy list" and "Parts picking"
   groups, minus the parts that clicked on DOM. The state singleton is reset
   between tests rather than rebooting a whole window. */

import { describe, it, expect, beforeEach } from "vitest";
import { jobById } from "../src/lib/format";
import { jobInterval, intervalLabel, dueStatus, dueText, lastDone, activeJobs } from "../src/lib/due";
import { buyLines, storePlan, togglePick, partsUsed } from "../src/lib/shop";
import { BLANK, repair, migrate, setState, state, TABS } from "../src/lib/state";

const job = (id: string) => jobById(id)!;

beforeEach(() => setState(BLANK()));

describe("intervals", () => {
  it("takes the smallest recurring interval", () => {
    expect(jobInterval(job("engine-oil"))).toBe(5000);
    expect(jobInterval(job("trans-level"))).toBe(2500);
    expect(jobInterval(job("fork-oil"))).toBe(20000);
    expect(jobInterval(job("storage"))).toBe(0);
  });

  it("does not call a pre-ride check 'as needed'", () => {
    expect(intervalLabel(job("engine-oil"))).toBe("every 5,000 mi");
    expect(intervalLabel(job("preride"))).toBe("every ride");
    expect(intervalLabel(job("engine-level"))).toBe("every ride");
    expect(intervalLabel(job("storage"))).toBe("as needed");
  });
});

describe("due status", () => {
  const oil = () => job("engine-oil");

  it("reads as never before anything is logged", () => {
    expect(dueStatus(oil()).s).toBe("never");
  });

  it("walks from ok to soon to now as the odometer climbs", () => {
    state().log = [{ id: 1, date: "2026-01-01", miles: 35000, jobs: ["engine-oil"], parts: [], notes: "" }];

    state().odo = "38000";
    expect(dueStatus(oil()).s).toBe("ok");
    expect(dueStatus(oil()).left).toBe(2000);

    state().odo = "39900";
    expect(dueStatus(oil()).s).toBe("soon");

    state().odo = "40000";
    expect(dueStatus(oil()).s).toBe("now");
    expect(dueText(dueStatus(oil()))).toMatch(/Due now/);

    state().odo = "41200";
    expect(dueStatus(oil()).s).toBe("now");
    expect(dueText(dueStatus(oil()))).toMatch(/Overdue by 1,200 mi/);
  });

  it("counts the highest odometer as last done, not the last typed", () => {
    state().log = [
      { id: 1, date: "2026-01-01", miles: 35000, jobs: ["engine-oil"], parts: [], notes: "" },
      { id: 2, date: "2025-01-01", miles: 30000, jobs: ["engine-oil"], parts: [], notes: "" },
    ];
    expect(lastDone("engine-oil")!.miles).toBe(35000);
  });

  it("forces nothing due with no odometer entered", () => {
    state().log = [{ id: 1, date: "2026-01-01", miles: 35000, jobs: ["engine-oil"], parts: [], notes: "" }];
    state().odo = "";
    expect(dueStatus(oil()).s).toBe("ok");
  });
});

describe("fuel system filter", () => {
  it("hides carb-only jobs on an EFI bike", () => {
    state().fuel = "carb";
    const carb = activeJobs().map(j => j.id);
    state().fuel = "efi";
    const efi = activeJobs().map(j => j.id);
    expect(carb).toContain("idle-speed");
    expect(efi).not.toContain("idle-speed");
    expect(efi.length).toBeLessThan(carb.length);
  });
});

describe("buy list", () => {
  it("is empty until something is picked", () => {
    expect(buyLines()).toHaveLength(0);
  });

  it("merges the same product across categories into one line", () => {
    /* Mobil 1 in the transmission and Mobil 1 in the primary is one 2 qt line,
       not two 1 qt lines reading the same. */
    togglePick("mobil");
    const lines = buyLines();
    const mobil = lines.filter(l => l.key === "mobil");
    expect(mobil).toHaveLength(1);
    expect(mobil[0]!.qty).toBeGreaterThan(1);
    expect(mobil[0]!.cats.length).toBeGreaterThan(1);
  });

  it("auto-fills transmission and primary from the engine pick, and clears them again", () => {
    togglePick("mobil");
    expect(state().have["t-mobil"]).toBe(true);
    expect(state().linked["t-mobil"]).toBe(true);
    togglePick("mobil");
    expect(state().have["t-mobil"]).toBeUndefined();
    expect(state().have["mobil"]).toBeUndefined();
  });

  it("keeps one pick per pick-one category", () => {
    togglePick("mobil");
    togglePick("castrol");
    expect(state().have["mobil"]).toBeUndefined();
    expect(state().have["castrol"]).toBe(true);
  });

  it("splits the list into local, dealer and online", () => {
    togglePick("mobil");
    const plan = storePlan(buyLines());
    expect(plan.localLines.length + plan.noLocal.length).toBe(buyLines().length);
    expect(plan.dealer.every(l => !plan.online.includes(l))).toBe(true);
  });
});

describe("parts recorded against a log entry", () => {
  it("only covers the jobs being logged", () => {
    /* Recording every current pick put the engine oil and the brake fluid on a
       tire-pressure check. */
    togglePick("mobil");
    const onOil = partsUsed(["engine-oil"]);
    const onTires = partsUsed(["tires"]);
    expect(onOil.length).toBeGreaterThan(0);
    expect(onTires).toHaveLength(0);
  });
});

describe("repair", () => {
  it("rebuilds a blank state from junk", () => {
    const s = repair(null);
    expect(s.fuel).toBe("carb");
    expect(s.log).toEqual([]);
    expect(s.view).toBe("due");
  });

  it("fixes wrong-typed containers instead of throwing", () => {
    const s = repair({ done: "nope", have: [], log: "nope", prices: 7 });
    expect(s.done).toEqual({});
    expect(s.have).toEqual({});
    expect(s.prices).toEqual({});
    expect(s.log).toEqual([]);
  });

  it("resets a tab field that answers to no panel", () => {
    /* A hand-edited backup with view:"banana" used to hide every panel. */
    const s = repair({ view: "banana", ref: "nope", shop: "nope", jgroup: "nope", store: "nope" });
    expect(TABS.view).toContain(s.view);
    expect(TABS.ref).toContain(s.ref);
    expect(TABS.shop).toContain(s.shop);
    expect(TABS.jgroup).toContain(s.jgroup);
    expect(TABS.store).toContain(s.store);
  });

  it("drops log entries pointing at jobs that no longer exist", () => {
    const s = repair({ log: [{ id: 1, date: "2026-01-01", miles: 100, jobs: ["engine-oil", "ghost-job"], parts: [], notes: "" }] });
    expect(s.log[0]!.jobs).toEqual(["engine-oil"]);
  });

  it("keeps only one pick in a pick-one category", () => {
    const s = repair({ have: { mobil: true, castrol: true } });
    const picked = ["mobil", "castrol"].filter(id => s.have[id]);
    expect(picked).toHaveLength(1);
  });
});

describe("migration from the oil-change app", () => {
  it("maps its log entries onto the new job ids", () => {
    const s = migrate({
      odo: "35000",
      have: { mobil: true },
      log: [{ id: 1, date: "2026-01-01", miles: 30000, done: ["Engine oil and filter", "Primary"], parts: [], notes: "x" }],
    });
    expect(s.odo).toBe("35000");
    expect(s.have["mobil"]).toBe(true);
    expect(s.log[0]!.jobs).toContain("engine-oil");
    expect(s.log[0]!.jobs).toContain("primary-oil");
    expect(s.migrated).toBe(true);
  });
});
