/* Icons and the files that name them.

   A missing icon is quiet: the tab shows a blank, the home-screen icon falls
   back to a screenshot, and a missing file in the service worker's SHELL list
   fails the whole install (addAll is all-or-nothing), so nothing works offline.
   These check that every name points at a real file in public/. */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const pub = (f: string) => path.join(root, "public", f);
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8");

describe("icons", () => {
  it("every manifest icon exists, and one is maskable", () => {
    const man = JSON.parse(read("public/manifest.webmanifest"));
    for (const i of man.icons) expect(fs.existsSync(pub(i.src)), i.src).toBe(true);
    expect(man.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
  });

  it("every icon the page head links exists", () => {
    const links = [...read("src/layouts/App.astro").matchAll(/rel="(?:icon|apple-touch-icon)" href=\{base \+ "([^"]+)"\}/g)].map(m => m[1]!);
    expect(links).toContain("favicon.svg");
    for (const f of links) expect(fs.existsSync(pub(f)), f).toBe(true);
  });

  it("every file the service worker precaches exists", () => {
    const shell = read("public/sw.js").match(/const SHELL = \[([\s\S]*?)\]/)![1]!;
    const files = [...shell.matchAll(/"\.\/([^"]*)"/g)].map(m => m[1]!).filter(Boolean);
    expect(files).toContain("favicon.svg");
    for (const f of files) expect(fs.existsSync(pub(f)), f).toBe(true);
  });

  it("the PNGs were regenerated from the SVGs at the sizes their names say", () => {
    const size = (f: string) => {
      const b = fs.readFileSync(pub(f));
      return [b.readUInt32BE(16), b.readUInt32BE(20)];
    };
    expect(size("favicon-32.png")).toEqual([32, 32]);
    expect(size("icon-180.png")).toEqual([180, 180]);
    expect(size("icon-512.png")).toEqual([512, 512]);
    expect(size("icon-512-maskable.png")).toEqual([512, 512]);
  });
});
