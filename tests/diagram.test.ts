/* The bike diagram's geometry.

   Ported from the jsdom suite's Diagram group, which stopped running when the
   package went ESM. The drawing is pure strings, so these read geometry.ts
   directly. jsdom does no layout either way: these prove the frame and the
   markers add up, not that a marker landed on the right lump of metal — look
   at the drawing for that. */

import { describe, it, expect } from "vitest";
import { SPOTS } from "../src/data/jobs";
import { MARKS, DW, VIEWBOX, SIDE_R, SIDE_L } from "../src/components/diagram/geometry";

const vb = VIEWBOX.split(" ").map(Number);
const inside = (x: number, y: number) =>
  x >= vb[0] + 11 && x <= vb[0] + vb[2] - 11 && y >= vb[1] + 11 && y <= vb[1] + vb[3] - 11;
const onSide = (side: "r" | "l") => MARKS.filter(m => m.s === side || m.s === "b");

describe("diagram frame", () => {
  it("the viewBox is centred on the mirror line, so neither side is cropped", () => {
    expect(vb[0] + vb[0] + vb[2]).toBe(DW);
  });

  it("frames the whole bike, windshield top to ground", () => {
    expect(vb[1]).toBeLessThanOrEqual(18);
    expect(vb[1] + vb[3]).toBeGreaterThanOrEqual(203);
  });

  it("each side draws its own parts", () => {
    expect(SIDE_R).not.toBe(SIDE_L);
    expect(SIDE_R).toMatch(/<ellipse cx="216" cy="131"/);
    expect(SIDE_L).not.toMatch(/<ellipse cx="216" cy="131"/);
  });
});

describe("diagram markers", () => {
  it("every location is marked", () => {
    SPOTS.forEach(s => expect(MARKS.some(m => m.id === s.id), `${s.n} ${s.name}`).toBe(true));
  });

  it.each(MARKS)("$id is a real location inside the frame on both sides", m => {
    expect(SPOTS.some(s => s.id === m.id)).toBe(true);
    expect(["r", "l", "b"]).toContain(m.s);
    expect(inside(m.x, m.y) && inside(DW - m.x, m.y)).toBe(true);
    (m.t || []).forEach(p => expect(inside(p[0], p[1]), `leads to ${p}`).toBe(true));
  });

  /* A buried number is a number you can't tap and can't read. */
  it.each(["r", "l"] as const)("no two badges overlap on the %s side", side => {
    const on = onSide(side);
    on.forEach((a, i) => on.slice(i + 1).forEach(b => {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      expect(d, `${a.id} and ${b.id} are ${d.toFixed(1)} apart`).toBeGreaterThanOrEqual(22);
    }));
  });

  it("left-side parts are only on the left, right-side parts only on the right", () => {
    ["ccover", "pdrain", "pchain", "belt", "jiffy"].forEach(id =>
      expect(onSide("r").some(m => m.id === id), id).toBe(false));
    ["aircleaner", "plugs", "battery", "fmaster", "rmaster", "fill", "tdip"].forEach(id =>
      expect(onSide("l").some(m => m.id === id), id).toBe(false));
  });
});
