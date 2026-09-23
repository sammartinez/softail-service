/* Writes "Where everything is" to a standalone HTML file so the diagram can
   actually be looked at — tests can check that a marker exists but not that
   it landed on the right lump of metal.

     npm run build
     node tests/_shot.mjs            # writes map-preview.html (gitignored)
     open map-preview.html

   Takes the diagram from the built page, so build first. Pass an output path
   and a viewBox to zoom in on part of the bike, e.g.
     node tests/_shot.mjs /tmp/map.html "150 82 120 110"   # engine and tank */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const page = path.join(ROOT, "dist", "index.html");
if (!fs.existsSync(page)) {
  console.error("dist/index.html is missing — run `npm run build` first.");
  process.exit(1);
}

const doc = new JSDOM(fs.readFileSync(page, "utf8")).window.document;
let map = doc.getElementById("map").outerHTML;
if (process.argv[3]) map = map.replace(/viewBox="[^"]*"/g, `viewBox="${process.argv[3]}"`);

/* the page's stylesheets, pointed at the files in dist/ */
const css = [...doc.querySelectorAll('link[rel="stylesheet"]')]
  .map(l => path.join(ROOT, "dist", l.getAttribute("href").replace(/^\/softail-service\//, "")))
  .map(f => `<link rel="stylesheet" href="${f}">`).join("");

const out = process.argv[2] || path.join(ROOT, "map-preview.html");
fs.writeFileSync(out, '<!doctype html><meta charset="utf-8"><title>Diagram</title>' + css +
  '<body style="margin:0;padding:12px;background:#fff;max-width:900px">' +
  map + doc.getElementById("legend").outerHTML);
console.log("wrote " + path.relative(process.cwd(), out));
