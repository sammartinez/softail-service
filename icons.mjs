/* Rebuilds the PNG icons from public/icon.svg and public/favicon.svg.
   Run `npm run icons` after editing either SVG, then bump CACHE in sw.js.

   Three variants of the one drawing:
     - icon-512.png         as drawn, rounded corners (manifest "any")
     - icon-180.png         full-bleed square: iOS rounds the corners itself and
                            fills anything transparent with black
     - icon-512-maskable    full-bleed, the mark shrunk to fit the 80% safe
                            circle Android crops to
   favicon-32.png is the fallback for browsers without SVG favicons.

   sharp comes with Astro, so this needs nothing extra installed. */
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const sharp = createRequire(import.meta.url)("sharp");
const dir = new URL("./public/", import.meta.url);
const icon = fs.readFileSync(new URL("icon.svg", dir), "utf8");
const fav = fs.readFileSync(new URL("favicon.svg", dir), "utf8");

const square = (svg) => svg.replace(/(<rect width="512" height="512") rx="\d+"/, "$1");
const safe = (svg) => svg.replace("scale(1.25)", "scale(1)");
if (square(icon) === icon || safe(icon) === icon) {
  throw new Error("icon.svg no longer has the background rx or the scale(1.25) these variants edit");
}

const out = [
  ["icon-512.png", icon, 512],
  ["icon-180.png", square(icon), 180],
  ["icon-512-maskable.png", safe(square(icon)), 512],
  ["favicon-32.png", fav, 32],
];

for (const [name, svg, size] of out) {
  /* Render at 4x and scale down, so small sizes are antialiased cleanly. */
  const vb = Number(svg.match(/viewBox="0 0 (\d+)/)[1]);
  await sharp(Buffer.from(svg), { density: 72 * (size * 4) / vb })
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(name, dir)));
  console.log("wrote public/" + name);
}
