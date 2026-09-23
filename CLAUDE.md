# Softail Service

Maintenance web app for Sam's 2003 Harley-Davidson Heritage Softail Classic
(FLSTC, Twin Cam 88B). Phone-first, used in the garage with oily hands: large
tap targets, everything saves automatically, and it works with no signal.

It grew out of an oil-change-only app (`~/Downloads/softail-oil-app`, still
there, untouched). This version covers the whole of the service manual's routine
maintenance. That older app was published as a claude.ai artifact at
https://claude.ai/artifact/CVZJYhKg558rckA8SWWpe2 — edits here do not update it.

## Files

- `index.html` — shell markup only. No inline script.
- `styles.css` — the whole design system by hand. No framework.
- `data-jobs.js` — `BIKE`, `INTERVALS`, `SCHEDULE`, `SPOTS`, `JOBS`.
- `data-ref.js` — `SPECS`, `TORQUES`, `TROUBLE`, `DTC`, `PARTS`, `TOOLS`, and the
  shopping-list config maps (`LINKS`, `MERGE`, `QTY`, `ITEMQTY`, `HINTS`).
- `app.js` — state, due maths, rendering, event delegation.
- `sw.js`, `manifest.webmanifest`, `icon*.png|svg` — offline and install.
- `public/icon.svg` (home screen) and `public/favicon.svg` (browser tab) are
  the source; the icon is a 45° V-twin in the accent blue, and the tab version
  drops the fins because they blur at 16px. `npm run icons` rebuilds every PNG
  from them (`icons.mjs`), then bump `CACHE` in `sw.js`.
- `tests/suite.js` — 1217 jsdom checks.
- `tests/_shot.js` — writes the diagram to an HTML file so it can be looked at.

## Hosting

GitHub Pages, repo `softail-service`, so the app lives at
`<user>.github.io/softail-service/`. `base` in `astro.config.mjs` must match the
repo name. `.github/workflows/deploy.yml` tests, builds and publishes on every
push to main (repo Settings → Pages → Source: GitHub Actions). Locally, `npm run
dev` and `npm run preview` also serve under `/softail-service/`.

## Stack

Vanilla JS, plain CSS, no build step, no CDN. Scripts are ordinary `<script>`
tags (not modules) so the app also opens straight from the filesystem. The only
remote request is Google Fonts (Barlow, Barlow Condensed), which degrades to the
system stack offline and is cached by the service worker after one online load.

Light theme only, by Sam's request. Don't add dark mode.

## Responsive layout

Phone first: everything outside a media query is the small-screen layout, so the
garage view is the one with the least chance of breaking. The breakpoints widen
that layout rather than replacing it.

| Width | What changes |
| --- | --- |
| under 360px | smaller type, tighter gutters, smaller step boxes |
| 600px | 720px column, two-column log checklist, odometer and date side by side |
| 760px | two-up card grids, both sides of the bike side by side, two-column legend |
| 900px | the bottom bar becomes a fixed 224px side rail with labels; prose capped at 860px |
| 1000px | the Due screen splits into a sticky odometer column and the due list |
| 1280px | three job columns, three-column log checklist |
| 1700px | four job columns |

Short landscape phones get a slimmer nav; that block is scoped under 900px and
sits *after* the width breakpoints, because otherwise `min-width:600px` wins the
type size. Landscape also pads the gutters out to `env(safe-area-inset-*)`.

The grids hang off container ids (`#jobList`, `#refSpecs`, `#parts`, ...). `#parts`
and `#tools` render each heading-plus-card pair inside a `.cardgroup` section so
the pair stays together in a grid cell. `[hidden]{display:none!important}` is
what stops a hidden view's grid rule from un-hiding it, so keep the `!important`.

Empty render targets (`#dueNow:empty` and friends) are collapsed; otherwise they
still occupy a grid row and its gap, which reads as a mystery hole.

Chips are `flex:0 1 auto` with `min-width:0`. Inside `.chips` (which wraps) a
chip moves to the next line before giving up any width, so short labels keep
their natural size and a long one wraps instead of overflowing a narrow column.
Don't set `white-space:nowrap` on them again — that was what pushed a long store
label out of a two-column grid cell at 900px. Keep store labels short and put
the explanation in the item's `note`.

## Accessibility

Audited with axe-core in Chrome across every view (September 2026): no
violations. The rules that keep it that way:

- Contrast. White text never sits on Apple's systemBlue, systemGreen or
  systemOrange (2.2 to 4.0:1). Fills behind white text use `--accent`
  (#0071E3), `--green` (green-700) or, for diagram badges, amber-700/800; the
  running timer puts dark digits on orange. `--muted` is gray-600, because
  gray-500 is 4.3:1 on the grouped grey. Checkbox-like edges use `--edge`.
- The diagram SVGs are `role="group"`, not `img`. `img` hides the marker
  buttons inside it from screen readers.
- When a tap hides the control that had focus (opening a job, jumping to the
  log or shop), focus moves to `#viewTitle`; "All jobs" returns it to the card.
- `#announce` is the one live region for timers: it says when one finishes.
  The countdown itself must not be live, or it talks every second.
- `#logSaved` is a live region, so only replace its markup when it changes.

## Why no Tailwind any more

The old app used the Tailwind Play CDN, which compiles CSS in the browser on
every load. That meant a ~3 MB download and no offline support — exactly wrong
for a garage. `styles.css` replaces it. If you add markup, use the existing
classes rather than reaching for a framework.

## How the data is shaped

A **job** is one procedure: `{id, title, group, at[], mins, lede, page, warm,
upright, fuel, steps[]}`. A step is `{t, b, c[], w, tl[], loc, tm}` — title, body,
spec chips, warning, tool ids, diagram location id, `[seconds, label]` timer.
Step keys in saved state are `jobId:index`.

`at[]` holds interval keys from `INTERVALS`. `jobInterval()` takes the smallest
recurring one; `[]` means "as needed". `fuel: "carb"` or `"efi"` hides a job on
the other kind of bike.

`SCHEDULE` is the manual's Table 1 transcribed, with each item listing every
interval it appears under and pointing at a job where one exists. It is the
record of what the manual actually asks for; the Due screen is computed from
`JOBS`, so keep the two consistent when you add something.

## The bike diagram

`bikeSVG()` draws the bike once facing right — stand on the right of a bike and
its front wheel is on your right — and mirrors that one drawing for the left
view, so a part is positioned once and the two sides can't drift apart. The
scale is 3.1 units to the inch off a 2003 FLSTC: ground at y=200, rear axle at
x=104 and front at x=304, which is the 64.5 in. wheelbase; tyre radius 39.5 is a
16 in. rim on an MT90. The rest was traced (September 2026) off a side-on
catalogue photo of a 2003 Heritage scaled so its axles land on those two points:
crank at about (213, 164) with the oval air cleaner at (216, 131), downtube
nearly vertical at x=252, pillion top y=95, rider's seat y=109. Keep new parts
on that grid and they land where they land on the bike. The photo was a
reference only and is deliberately not in the repo. The drawing lives in
`src/components/diagram/geometry.ts`; the root `app.js` copy is the old one.

Mirroring is `translate(DW,0) scale(-1,1)` about x=200, so the viewBox has to be
symmetric about it — `44 14 312 194`, because 44 + 356 = `DW`; it's tall enough
for the windshield. `tests/diagram.test.ts` checks that, otherwise one side
quietly crops.

`BASE` is what you see from either side, `SIDE_R` and `SIDE_L` what only one
side has: air cleaner, exhaust and transmission on the right; primary, belt and
jiffy stand on the left. Mirroring the whole drawing used to put the mufflers
and the air cleaner on the left, which is the wrong bike.

`MARKS` positions the numbered badges in drawing coordinates, with `s` for the
side and an optional `t` list of points to run leader lines to, used where a
part is buried (the battery) or where two badges would sit on top of each other.
Left-side x is `DW - x` at render, so a badge is placed once. Tests check that
every badge stays inside the frame on both sides and that no two on one side
come within 22 units of each other — a buried number can't be read or tapped.

Parts drawn dashed are the ones that come off before you start (saddlebag,
windshield) and the ones you can't see (oil tank and battery under the seat).
Frame tubes go through `tube()`, which strokes a dark casing under a lighter
core; a flat stroke the same grey as everything else reads as a blob.

`tests/_shot.js` writes the diagram to a standalone HTML file — jsdom does no
layout, so the suite can prove a marker exists but not that it landed on the
right lump of metal. Look at it after moving anything.

## Saved state

`localStorage` under `hd-maint-v1`: `odo`, `fuel`, `done`, `have`, `linked`,
`bought`, `prices`, `tools`, `timers` (end timestamps), `log`, plus the current
`view`/`job`/`jgroup`/`shop`/`ref`/`store`. `repair()` fixes missing or wrong-typed
fields on load, so older saved data keeps working. The six tab fields are checked
against `TABS` and reset when they hold a value no panel answers to — otherwise a
hand-edited backup hides every panel on that screen. `TABS`, `VIEWS` and `GROUPS`
sit at the top of `app.js` because `repair()` runs before anything else.

On first run with no `hd-maint-v1`, `migrate()` imports the old oil-change app's
`softail-oil-v1` data if it's on the same origin — picks, prices, tools,
odometer, and its log entries mapped onto the new job ids. Existing data always
wins over the old key.

localStorage is tied to the address the app is served from, so **Log → Settings
and backup** has JSON export/import. That was the fix for the old app's biggest
gap.

## Behaviour decisions (agreed with Sam)

- Oil filter, engine oil, transmission and primary are pick-one: choosing one
  disables the others in that category until it's unselected or "Change" is
  tapped. Seals, tune-up parts and tools are normal multi-select.
- Picking Mobil 1 V-Twin for the engine auto-fills transmission and primary only
  when those are empty. Auto-fills are tracked in `state.linked`, and unpicking
  the engine clears only those.
- The buy list merges same-product picks, sums quantities, and splits the list
  into what a chain store can supply versus dealer-only and online-only. Prices
  are typed in by hand. `MERGE` collapses a product onto the entry that names it
  in full whether or not that entry is picked, so Mobil 1 in the transmission and
  Mobil 1 in the primary is one 2 qt line, not two 1 qt lines reading the same.
- A log entry records only the parts for the jobs it covers, matched through
  `PARTS[].jobs`. Recording every current pick put the engine oil and the brake
  fluid on a tire-pressure check.
- Timers store end times. The one-second tick updates the countdown text in
  place — do not rebuild the timer buttons each tick, that ate taps in the old
  app. There's a test guarding it.
- Tapping anywhere on a step row toggles it; the number box is the real checkbox
  for accessibility.
- Due status: `now` past the interval, `soon` within the larger of 250 miles or
  10% of the interval, `never` if it was never logged. With no odometer entered,
  nothing is forced due.
- Start fresh clears steps, timers, tool checks and cart checks; it keeps parts
  picks, prices and the log.

## Where the facts come from

Everything in `SPECS`, `TORQUES`, `TROUBLE`, `DTC` and the job steps comes from
the Clymer *Softail 2000-2005* manual, for a 2003 FLSTC. Sam has the PDF. Spec
groups carry a `src` naming the manual table; jobs carry a `page`. Steps are
paraphrased into task form — don't paste manual text, and don't copy its photos
or any Harley logos into the app.

Two things the manual itself is awkward about, already handled in the data:

- **Primary drain plug torque.** The manual gives one only for 2005 (36-60 in-lb).
  For a 2003 it says "tighten securely", and the plug strips easily, so the app
  says snug and shows the 2005 figure as context only.
- **Oil filter location.** The text says front left, the photos show it from the
  right. The diagram marks it at the front on both sides.

Tool sizes (5/8 in. socket, 1/4 and 3/8 in. hex, T40, T27) are from owner guides,
not the manual, so the app tells the user to test-fit. Part numbers and store
links were found by web search in September 2026; stock and prices change. Never
invent a part number or a store URL — list the spec instead and send Sam to the
counter.

Keep these rules: no automotive oils, no plain engine oil in the transmission or
primary unless the product is rated for them, DOT 5 silicone brake fluid only,
and never put a wrench on the cylinder head bolts as part of a fastener check.

## Open work

0. Verify the responsive work on real hardware. It was checked at 320, 360, 480,
   600, 768, 900, 1024, 1366 and 1920 px wide with no horizontal overflow on any
   view or any of the 27 jobs, but that was an emulated viewport, not a phone.
1. Replace the SVG schematic in "Where everything is" with Sam's own photos
   (right side, left side, optional primary close-up). About 1200 px wide, JPEG
   under 200 KB. Position markers as percentage-coordinate overlays and keep the
   existing `SPOTS` ids and step `loc` values so "Show where" keeps working.
   The drawing is good enough to work from in the meantime.
2. Verify on a real phone what jsdom can't: the timer beep, vibration (iPhones
   don't support the web vibration API), the screen staying awake during timers,
   install-to-home-screen, and offline after a reload.
3. Check the hidden markers against the real bike. The visible parts were
   placed off a photo; the ones it can't show still sit by reasoning from the
   manual's text: the oil tank drain line, the transmission drain, the oil
   filter, the rear master cylinder, and the whole left side (the photo was of
   the right).
4. The app does not yet track time-based service (brake fluid by age, storage in
   the autumn). Everything is mileage-driven. Worth adding if Sam wants it.

## Testing

`npm install` once, then `npm test`. The suite strips the font link, evaluates
the three scripts as one (the browser shares top-level `const` across script
tags; `eval` doesn't) and re-exports the symbols it pokes at. jsdom 24 has no
`matchMedia`, so it's stubbed. Add a check for every behaviour change.

The suite also lints `styles.css` against `app.js` for class collisions. A
modifier like `chip due` silently picked up the layout of the standalone `.due`
row rule twice during the build (and `chip spec` picked up the `.spec` table's
`width:100%`), which jsdom cannot see because it does no layout. Modifier names
must not match a standalone class that sets display, width, padding, border,
flex or position.

It also checks that every `/*` in `styles.css` is closed. An unclosed one leaves
the brace count even, so the brace check cannot see it — that is how the
`@media print` block sat commented out and dead.

If a shell file changes, bump `CACHE` in `sw.js` or phones keep serving the old
copy. The worker is network-first and revalidates with `cache: "no-cache"`, so
edits reach the phone on the next load; offline falls back to the precache.
