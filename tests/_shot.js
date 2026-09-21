/* Renders "Where everything is" to a standalone HTML file so the diagram can
   actually be looked at — jsdom does no layout, so the suite can check that a
   marker exists but not that it landed on the right lump of metal.

     node tests/_shot.js /tmp/map.html
     open /tmp/map.html

   Pass a viewBox as the third argument to zoom in on part of the bike, e.g.
   "150 82 120 110" for the engine and tank. */
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const SCRIPTS = ["data-jobs.js", "data-ref.js", "app.js"];

const html = read("index.html").replace(/<link[^>]*fonts\.(googleapis|gstatic)[^>]*>/g, "");
const dom = new JSDOM(html, { url: "http://localhost:3000/", runScripts: "outside-only", pretendToBeVisual: true });
const w = dom.window;
w.matchMedia = () => ({ matches: false, addEventListener() { }, removeEventListener() { } });
w.scrollTo = () => { };
w.confirm = () => true;
w.Element.prototype.scrollIntoView = function () { };
w.eval(SCRIPTS.map(read).join("\n;\n") + "\n;Object.assign(window,{renderMap});");
w.renderMap();

let map = w.document.getElementById("map").innerHTML;
if (process.argv[3]) map = map.replace(/viewBox="[^"]*"/g, 'viewBox="' + process.argv[3] + '"');
const out = '<!doctype html><meta charset="utf-8"><title>Diagram</title>' +
  '<link rel="stylesheet" href="' + path.join(ROOT, "styles.css") + '">' +
  '<body style="margin:0;padding:12px;background:#fff;max-width:900px">' +
  '<div id="map">' + map + '</div>' +
  '<ul class="legend" id="legend">' + w.document.getElementById("legend").innerHTML + '</ul>';
fs.writeFileSync(process.argv[2] || path.join(ROOT, "map-preview.html"), out);
console.log("wrote " + (process.argv[2] || "map-preview.html"));
process.exit(0);
