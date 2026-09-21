# Softail Service

Phone-first maintenance app for a 2003 Harley-Davidson Heritage Softail Classic
(FLSTC, Twin Cam 88B), built from the Clymer *Softail 2000-2005* service manual.

- **Due** — type your odometer, see what the manual's schedule says is due now,
  soon, or later. Driven by the service log, not by guesswork.
- **Jobs** — 27 step-by-step procedures with torques, capacities, warnings,
  countdown timers, and a diagram of where everything is on the bike.
- **Shop** — parts picker, a buy list that merges the same oil across the engine,
  transmission and primary, works out which single store carries everything, and
  a tool checklist.
- **Log** — record what you did at what mileage; it feeds the Due screen.
- **Specs** — capacities, fluids, tune-up figures, torque tables, a symptom
  troubleshooter, and the engine management trouble codes.

Works offline once loaded, installs to the home screen, and lays itself out for
whatever you open it on — one column on a phone, two on a tablet, and a side nav
with up to four card columns on a desktop.

## Running it

    npm install
    npm test          # 1217 jsdom checks
    npm run serve     # open the printed URL on your phone (same Wi-Fi)

Opening `index.html` straight from Finder works too, but the service worker
(and therefore offline mode) only registers over http, so use `npm run serve`
for the garage. On the phone, use Share → Add to Home Screen.

## Backing up

Saved data lives in the browser's localStorage, which is tied to the address the
app is served from. Moving the app to a new address starts empty. Export a
backup from **Log → Settings and backup** first, then import it on the other
side.

## Where the numbers come from

Capacities, torques, intervals, specs, procedures and troubleshooting come from
the Clymer manual, for the 2003 FLSTC. Every spec table cites the manual table
it came from, and every job cites its pages. Steps are shortened for garage use;
the manual is the authority.

Tool sizes and the part picks with store links are **not** from the manual — they
come from owner guides and a web search, so test-fit tools and confirm parts at
the counter.

See `CLAUDE.md` for how the code is organised and what has been decided so far.
