/* Bike, maintenance schedule and job procedures.
   Source: Clymer "Harley-Davidson Softail 2000-2005" service manual, Chapter Three
   (Lubrication, Maintenance and Tune-up) unless a job says otherwise.
   Everything here is paraphrased into task steps; no manual text is reproduced.
   Page numbers are the manual's printed page numbers. */

import type {
  Bike,
  Interval,
  ScheduleItem,
  Spot,
  Job,
} from "./types";

export const BIKE: Bike = {
  year: 2003,
  code: "FLSTC",
  name: "Heritage Softail Classic",
  engine: "Twin Cam 88B",
  note: "FLSTCI is the fuel-injected version of the same bike. Set fuel system in Settings so the app shows the right jobs."
};

/* Interval keys used by SCHEDULE and JOBS. miles: 0 = every ride. */
export const INTERVALS: Interval[] = [
  { k: "ride",  label: "Every ride",        short: "Ride",   miles: 0 },
  { k: "i500",  label: "Initial 500 mi",    short: "500",    miles: 500,   once: true },
  { k: "m2500", label: "Every 2,500 mi",    short: "2.5k",   miles: 2500 },
  { k: "m5000", label: "Every 5,000 mi",    short: "5k",     miles: 5000 },
  { k: "m10k",  label: "Every 10,000 mi",   short: "10k",    miles: 10000 },
  { k: "m20k",  label: "Every 20,000 mi",   short: "20k",    miles: 20000 }
];

/* Maintenance and lubrication schedule, Table 1 (p. 90-91).
   Each item lists every interval it appears under. job: id in JOBS, or null
   when the manual covers it only as a look-and-see check. */
export const SCHEDULE: ScheduleItem[] = [
  { id: "tires",        label: "Tire condition and pressure",            at: ["ride", "i500", "m5000"], job: "tires" },
  { id: "rims",         label: "Wheel rim condition",                    at: ["ride"], job: "tires" },
  { id: "lights",       label: "Lights and horn",                        at: ["ride"], job: "preride" },
  { id: "oil-level",    label: "Engine oil level",                       at: ["ride"], job: "engine-level" },
  { id: "brake-fluid",  label: "Brake fluid level and condition",        at: ["ride", "i500", "m5000"], job: "brake-fluid" },
  { id: "brakes-op",    label: "Front and rear brake operation",         at: ["ride"], job: "preride" },
  { id: "throttle-op",  label: "Throttle operation",                     at: ["ride", "m2500", "m5000"], job: "throttle-cables" },
  { id: "clutch-op",    label: "Clutch lever operation; adjust if needed",at: ["ride", "i500", "m5000"], job: "clutch-adj" },
  { id: "fuel-level",   label: "Fuel level",                             at: ["ride"], job: null },
  { id: "fuel-leaks",   label: "Fuel system for leaks",                  at: ["ride", "i500", "m2500", "m5000"], job: null },

  { id: "engine-oil",   label: "Change engine oil and filter",           at: ["i500", "m5000"], job: "engine-oil" },
  { id: "battery",      label: "Battery condition; clean cable connections",at: ["i500", "m5000"], job: "battery" },
  { id: "brake-pads",   label: "Front and rear brake pads and discs for wear",at: ["i500", "m5000"], job: "brake-pads" },
  { id: "primary-chain",label: "Primary chain deflection; adjust if needed",at: ["i500", "m5000"], job: "primary-chain" },
  { id: "belt-tension", label: "Drive belt tension; adjust if needed",    at: ["i500", "m2500", "m5000"], job: "drive-belt" },
  { id: "primary-oil",  label: "Change primary chaincase lubricant",     at: ["i500", "m5000"], job: "primary-oil" },
  { id: "trans-oil",    label: "Change transmission lubricant",          at: ["i500", "m5000"], job: "trans-oil" },
  { id: "belt-cond",    label: "Drive belt and sprocket condition",      at: ["i500", "m5000"], job: "drive-belt" },
  { id: "plugs-insp",   label: "Inspect spark plugs",                    at: ["i500", "m5000"], job: "spark-plugs" },
  { id: "air-filter",   label: "Inspect air filter; clean or replace",   at: ["i500", "m2500", "m5000"], job: "air-filter" },
  { id: "lever-pivots", label: "Lubricate front brake and clutch lever pivot pins",at: ["i500", "m5000"], job: "lube-points" },
  { id: "clutch-cable", label: "Lubricate clutch cable if necessary",    at: ["i500", "m5000"], job: "cables-lube" },
  { id: "throttle-cbl", label: "Throttle cable operation",               at: ["i500", "m5000"], job: "throttle-cables" },
  { id: "enrichener",   label: "Enrichener (choke) cable operation",     at: ["i500", "m2500", "m5000"], job: "enrichener", carbOnly: true },
  { id: "idle",         label: "Engine idle speed; adjust if needed",    at: ["i500", "m5000"], job: "idle-speed", carbOnly: true },
  { id: "switches",     label: "Electrical switches and equipment",      at: ["i500", "m2500", "m5000"], job: "preride" },
  { id: "line-leaks",   label: "Oil and brake lines for leakage",        at: ["i500", "m2500", "m5000"], job: "brake-lines" },
  { id: "fasteners",    label: "All fasteners for tightness",            at: ["i500", "m5000"], job: "fasteners" },
  { id: "road-test",    label: "Road test",                              at: ["i500", "m2500", "m5000"], job: null },

  { id: "trans-level",  label: "Transmission lubricant level",           at: ["m2500"], job: "trans-level" },

  { id: "spokes",       label: "Wire wheel spoke nipple tightness",      at: ["m5000"], job: "tires" },
  { id: "steering-adj", label: "Steering head bearing adjustment",       at: ["m5000"], job: null },

  { id: "plugs-new",    label: "Replace spark plugs",                    at: ["m10k"], job: "spark-plugs" },
  { id: "compression",  label: "Compression test",                       at: ["m10k"], job: "compression" },
  { id: "steering-lube",label: "Lubricate steering head bearings",       at: ["m10k"], job: "lube-points" },
  { id: "swingarm",     label: "Lubricate rear swing arm bearings",      at: ["m10k"], job: "lube-points" },
  { id: "mounts",       label: "Inspect engine mounts for wear or damage",at: ["m10k"], job: "fasteners" },

  { id: "fork-oil",     label: "Change front fork oil",                  at: ["m20k"], job: "fork-oil" },
  { id: "tank-filter",  label: "Inspect fuel tank filter; replace if needed",at: ["m20k"], job: null },
  { id: "valve-screen", label: "Inspect fuel supply valve filter screen",at: ["m20k"], job: null, carbOnly: true }
];

/* Numbered locations on the bike diagram. */
export const SPOTS: Spot[] = [
  { id: "fill",       n: 1,  name: "Oil tank filler cap and dipstick", where: "Right side of the oil tank, under the seat." },
  { id: "tankdrain",  n: 2,  name: "Oil tank drain plug",              where: "On the drain line fitting at the lower rear right of the frame." },
  { id: "filter",     n: 3,  name: "Oil filter",                       where: "Front of the engine, low, just behind the frame downtube." },
  { id: "tdip",       n: 4,  name: "Transmission filler cap/dipstick", where: "Forward part of the clutch release cover, right side of the transmission." },
  { id: "tdrain",     n: 5,  name: "Transmission drain plug",          where: "Underside of the transmission between the shocks. Hidden from view, so feel for it." },
  { id: "ccover",     n: 6,  name: "Clutch inspection cover",          where: "Round cover on the primary, left side." },
  { id: "pdrain",     n: 7,  name: "Primary drain plug",               where: "Bottom of the primary chaincase, left side." },
  { id: "aircleaner", n: 8,  name: "Air filter",                       where: "Right side of the engine, between the cylinders." },
  { id: "plugs",      n: 9,  name: "Spark plugs",                      where: "One per cylinder head, recessed. Reach the front one from the right, the rear from the right or left." },
  { id: "battery",    n: 10, name: "Battery",                          where: "Under the seat, in the frame tray. Negative terminal faces the right side of the frame." },
  { id: "pchain",     n: 11, name: "Primary chain inspection cover",   where: "Upper left face of the primary cover. Two different screw lengths." },
  { id: "belt",       n: 12, name: "Drive belt and rear axle adjusters",where: "Left side lower run of the belt; adjusters at the rear of each swing arm leg." },
  { id: "forkdrain",  n: 13, name: "Fork drain screws",                where: "Low on the outside of each fork slider." },
  { id: "fmaster",    n: 14, name: "Front master cylinder",            where: "Right handlebar. Sight glass in the top cover." },
  { id: "rmaster",    n: 15, name: "Rear master cylinder",             where: "Right side behind the front exhaust pipe. Sight glass in the top cover." },
  { id: "steerhead",  n: 16, name: "Steering head grease fitting",     where: "Right side of the steering head." },
  { id: "jiffy",      n: 17, name: "Jiffy stand pivot",                where: "Left side, at the frame rail." }
];

/* Job procedures. Fields:
   id, title, group, at (interval keys), mins (rough time), lede, page,
   warm (needs a warm-up ride), upright (must be held straight up, not on the jiffy stand),
   fuel ("carb" or "efi" to limit the job to one fuel system),
   steps[]: t title, b body, c[] spec chips, w warning, tl[] tool ids, loc spot id,
            tm [seconds, label] for a countdown timer. */
export const JOBS: Job[] = [

/* ---------------- Fluids ---------------- */
{
  id: "engine-oil", title: "Engine oil and filter", group: "Fluids",
  at: ["i500", "m5000"], mins: 40, cap: "3.5 qt", page: "Manual p. 65-67",
  lede: "3.5 qt of 20W-50 with a new filter. Do this with the transmission and primary in one session while everything is warm.",
  warm: true,
  steps: [
    { t: "Warm-up ride", b: "Ride about ten minutes so the oil is hot and carries the suspended crud out with it. Shut off and let the oil settle back into the tank.", tm: [600, "Warm-up ride"], w: "Everything you are about to touch will be hot." },
    { t: "Pull the filler cap", b: "Clean around the oil tank filler cap first, then pull it out. The tank drains faster vented.", loc: "fill", tl: ["rags"] },
    { t: "Drain the oil tank", b: "Pan under the drain line plug at the lower rear right of the frame. Remove the plug and its O-ring and let it drain all the way.", loc: "tankdrain", tl: ["s58", "hex", "pan"], w: "Work quickly and carefully around the plug so you don't get hot oil on your arms." },
    { t: "Plug it back in temporarily", b: "Thread the drain plug back in finger-tight, then move the pan under the front of the crankcase and the filter.", loc: "tankdrain" },
    { t: "Remove the old filter", b: "Socket-type filter wrench, counterclockwise. Pull it off quickly, tip the remaining oil into the pan, and seal it in a bag.", loc: "filter", tl: ["fwrench", "bag"] },
    { t: "Clean the mount", b: "Wipe the oil off the top of the left crankcase half, then clean the sealing surface with contact cleaner so the new gasket seats dry.", loc: "filter", tl: ["cleaner", "rags"] },
    { t: "Install the new filter", b: "Coat the new gasket with clean oil. Spin it on by hand until the gasket touches, then another half to three-quarter turn by hand.", c: ["Hand tight only"], loc: "filter", w: "No wrench on the way in. Overtightening distorts the gasket." },
    { t: "Final drain plug", b: "Take the plug back out, wipe the sealing surface on the frame rail, fit a new O-ring lubed with clean oil, and torque it.", c: ["14-21 ft-lb"], loc: "tankdrain", tl: ["tqft", "s58"] },
    { t: "Refill", b: "Pour the oil into the tank, then push the filler cap down until it bottoms.", c: ["3.5 qt", "20W-50"], loc: "fill", tl: ["funnel"], w: "Don't overfill. Hot oil will push the filler cap out of an overfull tank." },
    { t: "Check the level", b: "Run the engine one minute, shut it off, and check the dipstick. If it reads anywhere in the safe range, leave it alone. Do not top up to the upper groove after a filter change. Then look for leaks at the filter and the plug.", tm: [60, "Engine run"], loc: "fill" },
    { t: "Recycle the old oil", b: "Most auto parts stores take used oil and filters. Don't mix other fluids into the jug.", tl: ["jugs"] }
  ]
},
{
  id: "trans-oil", title: "Transmission oil", group: "Fluids",
  at: ["i500", "m5000"], mins: 25, cap: "20-24 oz", page: "Manual p. 67-68",
  lede: "20-24 oz of transmission lube. Bike held straight up, not on the jiffy stand.",
  warm: true, upright: true,
  steps: [
    { t: "Warm it up", b: "Ride about ten minutes and shift through all five gears so the lube is hot. Shut off and let it settle.", tm: [600, "Warm-up ride"] },
    { t: "Hold it upright", b: "Level ground, helper or a jack holding the bike straight up. Levels read wrong on the jiffy stand.", tl: ["helper"] },
    { t: "Remove the dipstick", b: "Clean around the filler cap/dipstick on the forward part of the clutch release cover, then unscrew it.", loc: "tdip", tl: ["hex"] },
    { t: "Drain", b: "The plug is on the underside of the transmission case, between the shocks, and you can't see it. Feel for it from below. Pan underneath, then pull the plug and O-ring.", loc: "tdrain", tl: ["s58", "hex", "ratchet", "pan"] },
    { t: "Read the plug", b: "It's magnetic. Fuzz is normal; chips or flakes are not. Wipe it clean and replace the O-ring if it's flattened or nicked.", loc: "tdrain" },
    { t: "Reinstall the plug", b: "Plug and O-ring back in, then torque it.", c: ["14-21 ft-lb"], loc: "tdrain", tl: ["tqft"] },
    { t: "Refill", b: "Measure it out first, then pour it in through the dipstick hole.", c: ["20-24 oz"], loc: "tdip", tl: ["lfunnel", "cup"], w: "Transmission-rated fluid only, and make sure you're pouring into the transmission filler hole." },
    { t: "Check the level", b: "Rest the dipstick on the top thread without screwing it in, then pull it. The level should sit between the two marks. Then screw the cap in and tighten it.", loc: "tdip" },
    { t: "Ride and recheck", b: "Ride until it's warm again, shut off, and check the drain plug for seepage." }
  ]
},
{
  id: "primary-oil", title: "Primary chaincase oil", group: "Fluids",
  at: ["i500", "m5000"], mins: 30, cap: "26 oz", page: "Manual p. 69",
  lede: "26 oz of primary lube, poured through the clutch opening. Bike held straight up.",
  warm: true, upright: true,
  steps: [
    { t: "Warm it up", b: "Ride about ten minutes through all five gears, then shut off and let it settle.", tm: [600, "Warm-up ride"] },
    { t: "Drain", b: "Pan under the chaincase, pull the drain plug, and give it at least ten minutes to come out.", c: ["Drain 10 min"], loc: "pdrain", tl: ["t40", "pan"], tm: [600, "Primary drain"] },
    { t: "Read the plug", b: "It's magnetic. Chips or flakes here point at clutch or drive wear. Wipe it clean and check that it isn't damaged.", loc: "pdrain" },
    { t: "Reinstall the plug", b: "The manual gives no torque for the 2003 primary drain plug, only the 2005 figure below. It's a fine thread in aluminum that strips easily, so snug is the target, not tight.", c: ["Snug", "2005 spec: 36-60 in-lb"], loc: "pdrain", w: "Don't reach for the torque wrench and chase the 2005 number on a 2003 plug unless you know yours matches." },
    { t: "Open the clutch cover", b: "Remove the clutch inspection cover screws, the cover, and its quad ring.", loc: "ccover", tl: ["t27"], w: "These screws round off easily. Use a sharp bit and push in hard as you turn." },
    { t: "Refill", b: "Measure it out, then pour through the clutch opening until the level is even with the bottom of the opening, at the bottom of the diaphragm spring.", c: ["26 oz"], loc: "ccover", tl: ["cup", "funnel", "light"], w: "Don't overfill, and use primary-rated fluid only." },
    { t: "Close up", b: "Quad ring on, cover on, then torque the screws.", c: ["84-108 in-lb"], loc: "ccover", tl: ["tqin", "t27"] },
    { t: "Ride and recheck", b: "Ride until warm, shut off, and check the drain plug for seepage." }
  ]
},
{
  id: "fork-oil", title: "Front fork oil", group: "Fluids",
  at: ["m20k"], mins: 90, cap: "12.9 oz per leg", page: "Manual p. 69-70",
  lede: "12.9 oz per leg on the FLSTC. This is the routine change, not a fork rebuild.",
  steps: [
    { t: "Pull the fork tube caps", b: "Remove the cap, spacer and oil seal from the top of each fork tube plug. The cap is not under spring pressure.", tl: ["skt6"], w: "Six-point socket only. A twelve-point will round the cap corners." },
    { t: "Drain one leg", b: "Pan beside the fork leg, then remove the drain screw and washer from the slider.", loc: "forkdrain", tl: ["pan"] },
    { t: "Pump it out", b: "Straddle the bike, hold the front brake, and push the fork down and release, over and over, to force out as much oil as will come.", w: "Keep fork oil off the brake pads and disc." },
    { t: "Do the other leg", b: "Same again on the opposite fork tube. Replace either drain screw washer if it's damaged." },
    { t: "Close the drains", b: "Drain screw and washer back into each slider, then torque.", c: ["52-78 in-lb"], loc: "forkdrain", tl: ["tqin"] },
    { t: "Refill each leg", b: "Slide a clear tube slightly smaller than the fork plug opening into the tube so air can escape, put a funnel on it, and pour in the measured oil.", c: ["12.9 oz per leg", "Type E fork oil"], tl: ["cup", "funnel"] },
    { t: "Caps back on", b: "Cap, spacer and oil seal onto each fork tube, then torque the caps.", c: ["40-60 ft-lb"], tl: ["tqft", "skt6"] },
    { t: "Road test", b: "Ride it and check both sliders for leaks." }
  ]
},
{
  id: "brake-fluid", title: "Brake fluid", group: "Fluids",
  at: ["ride", "i500", "m5000"], mins: 10, page: "Manual p. 76-77",
  lede: "DOT 5 silicone only. Check both sight glasses; a dark purple glass means full.",
  steps: [
    { t: "Front reservoir", b: "Turn the bars straight ahead so the master cylinder sits level, then look at the sight glass in the top cover. Dark purple is full. Light or clear means it's low.", loc: "fmaster" },
    { t: "Rear reservoir", b: "Hold the bike so the rear master cylinder is level and read its sight glass the same way. The front exhaust pipe makes this one awkward to reach.", loc: "rmaster" },
    { t: "Check the fluid colour", b: "DOT 5 is purple. Amber or clear fluid in the glass means someone has put DOT 5.1 or DOT 4 in it, which attacks the silicone system's seals. Sort that out before riding.", w: "Never mix DOT 5 with DOT 4 or DOT 5.1." },
    { t: "Top up if low", b: "Clean the cover before you open it. Lift the cover and diaphragm out, add fresh DOT 5 to level, then reinstall the diaphragm and cover and tighten the screws.", c: ["DOT 5 silicone"], w: "Brake fluid ruins paint and plastic. Wash any spill off immediately with soap and water." },
    { t: "If it went dry", b: "If the level dropped far enough to let air into the system, bleed the brakes before riding. That's a Chapter Thirteen job." },
    { t: "Fluid change", b: "The manual gives no mileage interval for changing brake fluid. It changes the fluid through the bleeding procedure: keep pushing fresh fluid in at the master cylinder until what leaves the caliper runs clean and bubble-free.", c: ["No interval in the manual"] }
  ]
},

/* ---------------- Checks ---------------- */
{
  id: "preride", title: "Pre-ride inspection", group: "Checks",
  at: ["ride"], mins: 5, page: "Manual p. 62-63",
  lede: "The walk-around before you roll out. Two minutes if nothing's wrong.",
  steps: [
    { t: "Tires and rims", b: "Pressure cold, tread, cuts, anything stuck in them. Rims for cracks or dents." },
    { t: "Lights and horn", b: "Ignition on: front brake lever light, rear pedal light, headlight high and low, tail light, all four turn signals, horn." },
    { t: "Look for leaks", b: "Under the engine, transmission and primary. Fresh wet oil means find it before you ride." },
    { t: "Engine oil level", b: "Check the dipstick if the bike has been sitting or the last ride was long." },
    { t: "Brake fluid", b: "Both sight glasses dark purple." },
    { t: "Brakes", b: "Both brakes should come up firm with no sponginess." },
    { t: "Clutch", b: "Lever pulls smoothly and the clutch releases." },
    { t: "Throttle", b: "Opens smoothly and snaps shut on its own, at full left lock, straight ahead, and full right lock." },
    { t: "Suspension", b: "Front and rear should feel solid with no looseness or clunk." },
    { t: "Exhaust and fuel", b: "Exhaust for leaks or damage, fuel lines for seepage, and enough fuel in the tank." },
    { t: "Drive belt", b: "A quick look at belt tension and condition." }
  ]
},
{
  id: "engine-level", title: "Engine oil level check", group: "Checks",
  at: ["ride"], mins: 5, page: "Manual p. 64",
  lede: "Hot engine, bike upright, read the dipstick in the oil tank filler cap.",
  warm: true, upright: true,
  steps: [
    { t: "Warm the engine", b: "Run it about ten minutes or ride until it's at operating temperature, then shut it off and give the oil a moment to drain back to the tank.", tm: [600, "Warm up"] },
    { t: "Hold it upright", b: "Level ground, bike straight up. On the jiffy stand the reading is wrong.", tl: ["helper"] },
    { t: "Read the dipstick", b: "Wipe around the filler cap, pull it, wipe the dipstick, push the cap all the way back in until it bottoms, then pull it and read.", loc: "fill", tl: ["rags"] },
    { t: "Judge the level", b: "It should read at the upper groove. At or below the ADD QUART mark, add oil. Anywhere in the safe range after a fresh oil and filter change is fine, and should be left alone.", c: ["20W-50"] },
    { t: "Check the cap O-ring", b: "Look at the filler cap O-ring for cracks or flat spots and replace it if it's tired. Then push the cap down until it bottoms.", w: "Don't overfill. Hot oil pushes the cap out of an overfull tank." }
  ]
},
{
  id: "trans-level", title: "Transmission level check", group: "Checks",
  at: ["m2500"], mins: 10, page: "Manual p. 67",
  lede: "Between the two dipstick marks, with the bike held straight up.",
  warm: true, upright: true,
  steps: [
    { t: "Warm it up", b: "Ride about ten minutes through all five gears, then shut off and let it settle.", tm: [600, "Warm-up ride"] },
    { t: "Hold it upright", b: "Level ground, helper or jack. Not the jiffy stand.", tl: ["helper"] },
    { t: "Open the dipstick", b: "Clean around the filler cap/dipstick on the clutch release cover, then unscrew it.", loc: "tdip" },
    { t: "Read it", b: "Wipe the dipstick, put it back in resting on the top thread without screwing it down, then pull it. The level belongs between the two marks.", loc: "tdip" },
    { t: "Top up if low", b: "Add transmission lube only, never engine oil unless the bottle is rated for transmissions too. Don't overfill.", c: ["20-24 oz total"], tl: ["lfunnel"] },
    { t: "Close up", b: "Check the filler cap O-ring, then install the cap and tighten it securely. Wipe up any spill on the cover." }
  ]
},
{
  id: "primary-level", title: "Primary level check", group: "Checks",
  at: ["m5000"], mins: 15, page: "Manual p. 68",
  lede: "Level with the bottom of the clutch opening, bike straight up.",
  upright: true,
  steps: [
    { t: "Hold it upright", b: "Level ground, bike held straight up. Not the jiffy stand.", tl: ["helper"] },
    { t: "Open the clutch cover", b: "Remove the inspection cover screws, cover and quad ring.", loc: "ccover", tl: ["t27"] },
    { t: "Read the level", b: "Correct is even with the bottom of the clutch opening, which is the bottom of the clutch diaphragm spring. A flashlight helps.", tl: ["light"] },
    { t: "Top up if low", b: "Primary chaincase lubricant only, added through the opening.", c: ["26 oz total"] },
    { t: "Close up", b: "Quad ring on, cover on, screws torqued.", c: ["84-108 in-lb"], tl: ["tqin", "t27"] }
  ]
},
{
  id: "tires", title: "Tires and wheels", group: "Checks",
  at: ["ride", "i500", "m5000"], mins: 10, page: "Manual p. 63, 405",
  lede: "Cold pressures: 30 psi front, 36 psi rear solo, 40 psi rear two-up.",
  steps: [
    { t: "Check pressure cold", b: "Measure before you ride, not after. Front 30 psi. Rear 36 psi riding solo, 40 psi with a passenger. These are for original-equipment tires; aftermarket tires may want something different.", c: ["F 30 psi", "R 36 psi solo", "R 40 psi 2-up"], tl: ["gauge"] },
    { t: "Put the caps back", b: "Valve caps keep grit out of the stems, which is what causes slow leaks and false readings." },
    { t: "Tread depth", b: "Replace at less than 1/16 in. of tread on original-equipment tires.", c: ["Min 1/16 in."] },
    { t: "Look the tires over", b: "Cuts, embedded nails or stones, sidewall splits, ply or tread separation, flat-spotting from a skid. Mark a nail's spot with crayon before you pull it so you can find the hole. Replace the tire for a puncture or split over 1/4 in." },
    { t: "Spokes", b: "The Heritage runs laced wheels. Check for loose or damaged spokes; the schedule wants a spoke nipple tightness check every 5,000 miles." },
    { t: "Rims", b: "Check both rims for cracks and dents. A damaged rim makes the bike handle badly." }
  ]
},
{
  id: "brake-pads", title: "Brake pads and discs", group: "Checks",
  at: ["i500", "m5000"], mins: 10, page: "Manual p. 75, 77",
  lede: "Minimum pad thickness on this bike is 0.04 in. of friction material.",
  steps: [
    { t: "Look at the pads", b: "You can see both front and rear pads without pulling the calipers. Check for cracks, chunks missing, or oil on the friction material." },
    { t: "Measure", b: "Measure the friction material, not the backing plate, with a ruler. Replace the pads at or below the limit.", c: ["Min 0.04 in."], tl: ["ruler"] },
    { t: "Inspect the discs", b: "Both discs for scoring, cracks, bluing or warping. Measure disc thickness if they look thin or the brakes chatter." },
    { t: "Replace in pairs", b: "Pad replacement is a Chapter Thirteen job. Do both pads in a caliper at once." }
  ]
},
{
  id: "brake-lines", title: "Brake and oil lines", group: "Checks",
  at: ["i500", "m2500", "m5000"], mins: 5, page: "Manual p. 77, 81",
  lede: "A leak check, not a teardown.",
  steps: [
    { t: "Brake lines", b: "Follow each line from master cylinder to caliper. Any weeping at a fitting means tighten it and then bleed that brake." },
    { t: "Oil lines", b: "Check the feed, return and vent lines at the oil tank and at the crankcase. Each uses a special connector. Replace a damaged line rather than patching it." },
    { t: "Fuel lines", b: "Tank to carburetor or injection module, plus the crossover line between the tank halves. Check clamps and fittings.", w: "A cracked fuel line onto a hot pipe is how bikes burn." },
    { t: "Exhaust", b: "Check the fittings, including any crossover or interconnect tube, for leaks. Snug the bolts and replace gaskets that have blown out." }
  ]
},
{
  id: "battery", title: "Battery", group: "Checks",
  at: ["i500", "m5000"], mins: 20, page: "Manual p. 319-321",
  lede: "Sealed maintenance-free 12 V, 19 Ah, 270 CCA. Nothing to top up, but the terminals still corrode.",
  steps: [
    { t: "Disarm the alarm first", b: "If the bike has the TSSM security system, disarm it before you disconnect anything or the siren goes off.", w: "Negative cable comes off first, goes back on last." },
    { t: "Get to it", b: "The battery sits under the seat. Remove the seat, then disconnect the negative cable at the frame, then the positive.", loc: "battery" },
    { t: "Read the voltage", b: "Digital voltmeter across the terminals with nothing running. 13.0-13.2 V at 68F is fully charged. 12.5 V or below is undercharged and needs a charger.", c: ["Full 13.0-13.2 V"], tl: ["dmm"] },
    { t: "Inspect the case", b: "Cracks, warping, discolouration or a raised top all mean the battery has been cooked by overcharging. Replace it.", w: "Wear eye protection. A cracked case can leak electrolyte, which burns skin and eyes. Neutralize spills with baking soda and water." },
    { t: "Clean the connections", b: "Wire brush and a baking soda and water solution on corroded terminals and cable ends, rinse with clean water, dry.", tl: ["rags"] },
    { t: "Grease and reassemble", b: "Thin coat of dielectric grease on the terminals, positive cable on first, then negative, then the seat. Never remove the sealing bar on top of the battery.", tl: ["dgrease"] },
    { t: "Charge it if it's low", b: "Use a charger with regulated output. An unregulated charger cooks a sealed battery. Roughly: 3 A charger takes about 3.5 hours from 50%, 6 A about 1.75 hours, 10 A about an hour." },
    { t: "Check for a parasitic draw", b: "If the battery keeps going flat while parked, measure the current draw with everything off. More than 5.5 mA means something is feeding on it.", c: ["Max draw 5.5 mA"], tl: ["dmm"] }
  ]
},
{
  id: "fasteners", title: "Fastener and mount check", group: "Checks",
  at: ["i500", "m5000", "m10k"], mins: 20, page: "Manual p. 81",
  lede: "Vibration backs things out. Walk the bike with a wrench.",
  steps: [
    { t: "Skip the head bolts", b: "Cylinder head bolts have their own tightening procedure in Chapter Four. Putting a wrench on them here will warp a head or blow a gasket.", w: "Do not check cylinder head bolts as part of this." },
    { t: "Engine and frame mounts", b: "Engine mounting hardware and the stabilizer link. Loose mounts are the usual cause of new vibration." },
    { t: "Covers", b: "Engine and primary covers." },
    { t: "Front end", b: "Handlebar clamps and front fork hardware." },
    { t: "Controls", b: "Gearshift lever, brake lever and brake pedal." },
    { t: "Drive", b: "Sprocket bolts and nuts." },
    { t: "Exhaust and lights", b: "Exhaust hardware and lighting equipment mounts." },
    { t: "Suspension", b: "Rear shock mounting bolts and nuts, plus a look at the shocks for oil leakage or dead bushings. Swing arm pivot bolt tightness at the same time." }
  ]
},
{
  id: "align", title: "Vehicle alignment", group: "Checks",
  at: [], mins: 45, page: "Manual p. 74-75",
  lede: "Worth doing after belt adjustment or if the bike tracks crooked. Needs two straightedges and a helper.",
  steps: [
    { t: "Set up", b: "Support the bike on a floor jack with the rear wheel off the ground. A bike stand gets in the way of the straightedges. Tires and rims need to be true first, and the front wheel centered in the fork.", tl: ["jack", "helper"] },
    { t: "Straightedges on the rear tire", b: "On the FLSTC, lay one girder-type straightedge tight against the left side of the rear tire and have your helper hold it there." },
    { t: "Block the front wheel straight", b: "Front wheel pointed straight ahead and blocked in that position." },
    { t: "Measure", b: "Measure from the straightedge to the left side of the front rim at the front and rear of the rim, then do the same at the rear rim. Subtract the rear measurement from the front.", tl: ["ruler"] },
    { t: "Compare", b: "The FLSTC horizontal offset spec is 0.359 in., and your result should land within 0.250 in. of it.", c: ["FLSTC 0.359 in.", "Tolerance 0.250 in."] },
    { t: "If it's out", b: "On laced wheels check the rim offset spec first and have the wheel trued if it's off. Then check that the rear axle sits the same distance from the swing arm pivot on both sides." },
    { t: "Vertical check", b: "Inclinometer flat on the front disc, then on the rear disc, without moving the bike. More than half a degree apart suggests a bent frame, fork or swing arm, which is a job for a frame shop.", c: ["Max 0.5 degree"] }
  ]
},

/* ---------------- Tune-up ---------------- */
{
  id: "air-filter", title: "Air filter", group: "Tune-up",
  at: ["i500", "m2500", "m5000"], mins: 30, page: "Manual p. 82-83",
  lede: "Paper and wire element. Wash it, dry it completely, put it back.",
  steps: [
    { t: "Open the cover", b: "Remove the air filter cover screw and the cover.", loc: "aircleaner", tl: ["hexset"] },
    { t: "Remove the element", b: "Take out the Torx screws and bracket, then ease the element off the backplate and unhook the two breather hoses from the hollow bolts.", loc: "aircleaner", tl: ["t27"] },
    { t: "Wash it", b: "Lukewarm water and mild detergent in a pan. Work the element back and forth, then rinse until no detergent is left.", w: "Never clean it in gasoline or solvent, and never knock it against anything to shake the dirt out." },
    { t: "Hold it to the light", b: "Look through the pores for dirt and oil. Wash again if they're still blocked. An element soaked with oil or chemicals is done; replace it." },
    { t: "Blow it out", b: "Gentle compressed air from the inside surface outward only. Blowing from the outside drives the dirt deeper into the element." },
    { t: "Dry completely", b: "Air will not pass through a damp filter. Let it dry fully before it goes back on. Don't dry it with high pressure air.", tm: [1800, "Drying"] },
    { t: "Clean the hoses and housing", b: "Wash the breather hoses in the same solution, pipe cleaner them if they're gunked, and wipe out the cover and backplate with a damp rag." },
    { t: "Check the seals", b: "Inspect the backplate gasket, the breather hoses and the seal ring in the cover. Replace anything hard, torn or deteriorated." },
    { t: "Reassemble", b: "Element flat side down, breather hoses reattached, bracket and Torx screws torqued.", c: ["20-40 in-lb"], tl: ["tqin", "t27"] },
    { t: "Cover on", b: "A drop of blue threadlocker on the cover screw, then torque it.", c: ["36-60 in-lb"], tl: ["tqin", "loctite"] }
  ]
},
{
  id: "spark-plugs", title: "Spark plugs", group: "Tune-up",
  at: ["i500", "m5000", "m10k"], mins: 30, page: "Manual p. 86-87",
  lede: "Inspect at 5,000, replace at 10,000. H-D 6R12, gapped 0.038-0.043 in.",
  steps: [
    { t: "Clean around them", b: "Blow the dirt off the base of each plug first. Grit that falls into the cylinder does real damage.", loc: "plugs" },
    { t: "Pull the caps", b: "Grab the plug lead, twist it side to side to break the seal, and pull the cap off. Twist the cap itself if it's stuck on.", loc: "plugs" },
    { t: "Remove the plugs", b: "Rubber-insert spark plug socket, since the plugs are recessed. Mark which cylinder each one came from.", tl: ["plugskt", "ratchet"] },
    { t: "Read them", b: "Light tan or gray with clean electrodes is right. Dry black soot is a rich mixture, clogged filter or too-cold a plug. Wet black oil means rings, guides or seals. Check for cracked porcelain and eroded electrodes." },
    { t: "Inspect the caps and leads", b: "Damaged or hardened caps and secondary wires get replaced as an assembly, and the front and rear are different part numbers." },
    { t: "Gap the new plugs", b: "Wire feeler gauge between the electrodes: a slight drag is right. Bend the side electrode with a gapping tool if it's off.", c: ["0.038-0.043 in."], tl: ["gapper"] },
    { t: "Antiseize, then hand start", b: "A light coat of antiseize on the threads, never engine oil. Screw each plug in by hand until it seats. If it takes any force, back it out and start again, because the aluminum head is easy to cross-thread.", tl: ["antiseize"] },
    { t: "Torque", b: "Tighten to spec. Overtightening just crushes the gasket and kills its seal.", c: ["11-18 ft-lb"], tl: ["tqft", "plugskt"] },
    { t: "Caps back on", b: "Right cap to right plug, twisted slightly both ways so you know it's seated." }
  ]
},
{
  id: "compression", title: "Compression test", group: "Tune-up",
  at: ["m10k"], mins: 30, page: "Manual p. 84-86",
  lede: "Standard is 90 psi. What matters is that the two cylinders are within 10% of each other.",
  steps: [
    { t: "Before you start", b: "Battery fully charged so it cranks at proper speed, and the head bolts correctly tightened per Chapter Four." },
    { t: "Warm the engine", b: "Run it to operating temperature, then shut it off.", tm: [600, "Warm up"] },
    { t: "Remove both plugs", b: "Pull both spark plugs and reinstall them in their caps, resting against the heads so they're grounded.", loc: "plugs", tl: ["plugskt"] },
    { t: "Fit the tester", b: "Screw the compression tester into one cylinder per its instructions.", tl: ["comptester"] },
    { t: "Crank it", b: "Throttle held wide open, choke fully off on a carbureted bike, and crank until the gauge stops climbing. Record the number.", c: ["Standard 90 psi"] },
    { t: "Do the other cylinder", b: "Same again on the second cylinder, then record that number too." },
    { t: "Compare", b: "Under 10% apart means rings and valves are healthy. More than that means worn or broken rings, leaky valves, or a blown head gasket.", c: ["Max 10% spread"] },
    { t: "Wet test if one is low", b: "Squirt about a teaspoon of engine oil into the low cylinder, turn the engine once to spread it, and retest. A big jump means rings. No change means valves." },
    { t: "Put it back together", b: "Plugs back in and torqued, caps on.", c: ["11-18 ft-lb"] }
  ]
},
{
  id: "idle-speed", title: "Idle speed", group: "Tune-up",
  at: ["i500", "m5000"], mins: 15, page: "Manual p. 89", fuel: "carb",
  lede: "Carbureted bikes only: 950-1050 rpm. EFI idle is set by the ECM and needs a dealer Scanalyzer.",
  warm: true,
  steps: [
    { t: "Warm the engine", b: "Full operating temperature, or the idle you set will be wrong once it heats up.", tm: [600, "Warm up"] },
    { t: "Choke fully off", b: "Push the enrichener knob all the way in." },
    { t: "Hook up a tachometer", b: "Connect a portable tach per its instructions.", tl: ["tach"] },
    { t: "Set the idle", b: "With the engine idling, compare the reading to spec and adjust with the carburetor throttle stop screw.", c: ["950-1050 rpm"] },
    { t: "Check it returns", b: "Blip the throttle a couple of times and let it shut. Idle should come straight back to where you set it. Readjust if it doesn't." },
    { t: "Note on mixture", b: "The idle mixture is set and sealed at the factory and is not adjustable." }
  ]
},

/* ---------------- Adjustments ---------------- */
{
  id: "primary-chain", title: "Primary chain adjustment", group: "Adjust",
  at: ["i500", "m5000"], mins: 45, page: "Manual p. 72",
  lede: "Cold free play 5/8 to 7/8 in. Hot 3/8 to 5/8 in. Measure at the chain's tightest point.",
  steps: [
    { t: "Disarm and disconnect", b: "Disarm the TSSM security system if fitted, then disconnect the negative battery cable.", w: "Disconnecting the battery with the alarm armed sets the siren off." },
    { t: "Get the rear wheel up", b: "Support the bike on a stand or floor jack with the rear wheel off the ground.", tl: ["jack"] },
    { t: "Open the inspection cover", b: "Remove the primary chain inspection cover and gasket. Note where each screw came from, because there are two different lengths.", loc: "pchain", tl: ["t27"] },
    { t: "Find the tight spot", b: "Turn the chain and watch for the tightest point. That's where you measure." },
    { t: "Measure free play", b: "At the upper chain run, midway between the sprockets. Cold engine wants 5/8 to 7/8 in. Hot wants 3/8 to 5/8 in.", c: ["Cold 5/8-7/8 in.", "Hot 3/8-5/8 in."], tl: ["ruler"] },
    { t: "Adjust if needed", b: "Loosen the chain adjuster shoe nut, move the shoe up or down, then torque the nut and measure again.", c: ["21-29 ft-lb"], tl: ["tqft"] },
    { t: "Close up", b: "New gasket, cover on, screws torqued into the right holes.", c: ["84-108 in-lb"], loc: "pchain", tl: ["tqin", "t27"] },
    { t: "Back on the ground", b: "Lower the bike and reconnect the battery, negative last." }
  ]
},
{
  id: "drive-belt", title: "Drive belt deflection", group: "Adjust",
  at: ["i500", "m2500", "m5000"], mins: 45, page: "Manual p. 73-74",
  lede: "5/16 to 3/8 in. of deflection under 10 lb of push, measured cold with a rider on the seat.",
  steps: [
    { t: "Belt cold", b: "Check deflection with the belt cold, not after a ride." },
    { t: "Clear the way", b: "Remove the left saddlebag if fitted, then the bolts and nuts holding the drive chain guard, and take the guard off.", loc: "belt" },
    { t: "Find the tight spot", b: "Rear wheel off the ground, turn it and find the belt's tightest point, then position that point on the lower belt run midway between the sprockets.", tl: ["jack"] },
    { t: "Back on the ground, loaded", b: "Both wheels down and a helper sitting on the seat facing forward. The measurement is meaningless unloaded.", tl: ["helper"] },
    { t: "Measure", b: "Push the middle of the upper belt strand with 10 lb of force and measure how far it moves at that same point. A belt tension gauge makes this repeatable.", c: ["5/16-3/8 in. at 10 lb"], tl: ["belttool"] },
    { t: "Adjust if needed", b: "Pull the chrome trim caps, remove the spring clip on the left, loosen the rear axle nut, then loosen the jam nut on each axle adjuster.", tl: ["ratchet"] },
    { t: "Turn both adjusters equally", b: "Same number of turns each side, or you'll pull the rear wheel out of alignment. Recheck deflection, then tighten both jam nuts." },
    { t: "Check axle position", b: "Confirm the rear axle sits correctly in the swing arm on both sides before you torque anything down." },
    { t: "Torque the axle", b: "Torque the rear axle nut, then fit the spring clip through the nut and axle. Nudge the nut slightly tighter if you need to line up the slots.", c: ["60-65 ft-lb"], tl: ["tqft"] },
    { t: "Inspect the belt", b: "While you're there, check the belt for cracks, missing teeth, cuts, or stones wedged in it, and check both sprockets for wear." }
  ]
},
{
  id: "clutch-adj", title: "Clutch adjustment", group: "Adjust",
  at: ["i500", "m5000"], mins: 30, page: "Manual p. 77-78",
  lede: "Cold engine only. Free play at the lever ends up 1/16 to 1/8 in.",
  steps: [
    { t: "Engine cold", b: "The adjuster clearance grows as the engine heats up. Adjust it hot and you'll end up with a slipping clutch.", w: "Cold engine. No exceptions." },
    { t: "Open the clutch cover", b: "Remove the clutch mechanism inspection cover and quad ring.", loc: "ccover", tl: ["t27"] },
    { t: "Free the cable adjuster", b: "Remove the clamp and slide the rubber boot off the in-line cable adjuster." },
    { t: "Slacken the cable", b: "Loosen the adjuster locknut and back the adjuster off for maximum cable slack." },
    { t: "Check the perch", b: "Make sure the cable seats squarely in its perch at the handlebar." },
    { t: "Seat the adjusting screw", b: "At the clutch mechanism, loosen the adjusting screw locknut and turn the screw clockwise until it just seats lightly." },
    { t: "Set the balls", b: "Squeeze the clutch lever three times to seat the balls in the ramp release mechanism behind the transmission side cover." },
    { t: "Back it off and lock it", b: "Back the adjusting screw out half to one full turn counterclockwise, hold it there, and torque the locknut.", c: ["Out 1/2 to 1 turn", "72-120 in-lb"], tl: ["tqin"] },
    { t: "Set the balls again", b: "Squeeze the lever to its limit three more times." },
    { t: "Set free play", b: "At the in-line adjuster, turn it away from the locknut until the slack at the hand lever disappears, then pull the cable sheath away from the lever and set the gap.", c: ["1/16-1/8 in."] },
    { t: "Lock and close", b: "Tighten the in-line locknut, slide the boot back over, then quad ring, cover and torqued screws.", c: ["84-108 in-lb"], tl: ["tqin", "t27"] }
  ]
},
{
  id: "throttle-cables", title: "Throttle cables", group: "Adjust",
  at: ["ride", "i500", "m2500", "m5000"], mins: 45, page: "Manual p. 79-80",
  lede: "Two cables: the front one at the grip is throttle, the rear one is idle.",
  steps: [
    { t: "Inspect first", b: "Run your eye along both cables from grip to carburetor or injection module for kinks and chafe. The grip should turn smoothly closed to open with the bars centered, full left and full right." },
    { t: "Get access", b: "Remove the air filter and backing plate, then roll the rubber boots off the adjusters.", tl: ["t27", "hexset"] },
    { t: "Slacken both", b: "At the handlebar, loosen both adjuster locknuts and turn both adjusters clockwise as far as they go to add slack." },
    { t: "Set the throttle cable", b: "Wheel straight ahead. Hold the throttle wide open and turn the throttle cable adjuster counterclockwise until the throttle cam stop just touches its stop on the carburetor or throttle body. Tighten that locknut and let go of the grip." },
    { t: "Set the idle cable", b: "Turn the front wheel to full right lock and hold it there. Turn the idle cable adjuster until the lower end of the idle cable just contacts the spring in the cable guide or support sleeve, then tighten its locknut." },
    { t: "Reassemble", b: "Backing plate and air filter back on." },
    { t: "Test in neutral", b: "Neutral, start it, and rev it several times. It should drop straight back to idle. If it hangs, loosen the idle cable locknut and turn that adjuster clockwise a little." },
    { t: "Test the steering", b: "Let it idle and turn the bars side to side without touching the throttle. If the idle rises, the cables are routed wrong or damaged. Shut it off and recheck.", w: "Don't ride until the throttle snaps shut on its own at every steering position. A cable that pulls when you turn will hold the throttle open." },
    { t: "Boots back", b: "Roll the rubber boots back over both adjusters." }
  ]
},
{
  id: "enrichener", title: "Enrichener (choke) cable", group: "Adjust",
  at: ["i500", "m2500", "m5000"], mins: 15, page: "Manual p. 80-81", fuel: "carb",
  lede: "Carbureted bikes only. The knob should stay where you put it without creeping.",
  steps: [
    { t: "Check the feel", b: "The knob should move fully open to fully closed without binding, and stay put at either end.", w: "Do not lubricate this cable or its conduit. It needs the friction to hold position." },
    { t: "Free the cable", b: "Loosen the hex nut behind the mounting bracket and slip the cable out of the bracket slot." },
    { t: "Reduce or add resistance", b: "Hold the cable across its flats with a wrench. Counterclockwise on the plastic knurled nut reduces resistance until the knob slides freely; clockwise increases it.", tl: ["wrench"] },
    { t: "Dial it in", b: "Keep going clockwise until the knob stays put when pulled all the way out, but still moves without roughness." },
    { t: "Reinstall", b: "Cable back into the bracket slot with the star washer between the bracket and the hex nut, then tighten the hex nut securely." },
    { t: "Recheck", b: "Work the knob again and readjust if it creeps." }
  ]
},

/* ---------------- Lubrication ---------------- */
{
  id: "cables-lube", title: "Control cable lubrication", group: "Lube",
  at: ["i500", "m5000"], mins: 30, page: "Manual p. 70",
  lede: "Only for non-nylon-lined cables. Poor lubrication is what breaks cables.",
  steps: [
    { t: "Check what you have", b: "Nylon-lined cables run dry. Oiling one swells the liner against the sheath and ruins it. If the cables have been replaced with nylon-lined ones, stop here and follow the maker's instructions.", w: "Never lubricate the enrichener cable, and never use chain lube on any control cable." },
    { t: "Disconnect the cable ends", b: "Clutch cable ends per Chapter Five, throttle cable ends per Chapter Seven." },
    { t: "Fit the lubricator", b: "Clamp a cable lubricator tool on per its instructions and put a rag at the far end to catch the overflow.", tl: ["cablelube"] },
    { t: "Lubricate", b: "Hold the lubricant button down until it runs out of the far end. If it squirts out around the tool, the clamp isn't seated; reposition it." },
    { t: "Watch for a blockage", b: "If nothing comes out the far end, the cable is frayed, kinked or damaged. Replace it rather than forcing more lube in." },
    { t: "Reconnect and adjust", b: "Wipe both ends, remove the tool, reconnect the cable ends, then readjust the clutch or throttle." }
  ]
},
{
  id: "lube-points", title: "Grease and lube points", group: "Lube",
  at: ["i500", "m5000", "m10k"], mins: 30, page: "Manual p. 71",
  lede: "The small stuff that gets skipped: pivots, bearings and the jiffy stand.",
  steps: [
    { t: "Front brake lever pivot", b: "Check the pivot pin for lubricant. If it's dry, a drop of light oil.", tl: ["oiler"] },
    { t: "Clutch lever pivot", b: "Same: light oil on the pivot pin." },
    { t: "Throttle grip", b: "Graphite where the grip contacts the handlebar. Grip removal is in Chapter Seven.", tl: ["graphite"] },
    { t: "Rear brake pedal", b: "Waterproof grease on the pedal fitting, then work the pedal to check it moves freely.", tl: ["wgrease"] },
    { t: "Steering head bearings", b: "Every 10,000 miles. Wipe the grease fitting on the right side of the steering head clean, then pump grease in until it flows out at the top and bottom of the head. Wipe off the excess.", c: ["Every 10,000 mi"], loc: "steerhead", tl: ["gun"] },
    { t: "Swing arm bearings", b: "Every 10,000 miles, per Chapter Twelve.", c: ["Every 10,000 mi"] },
    { t: "Jiffy stand", b: "Rear wheel supported, wipe the pivot clean, and work the stand back and forth checking for stiffness. If the leg stop is packed with mud, pull the bolt, lockwasher and washer, remove the pivot post, and clean everything in solvent.", loc: "jiffy", tl: ["jack"] },
    { t: "Jiffy stand reassembly", b: "Aerosol anti-seize on the leg stop and pivot, worked in by moving the stand. Leg stop goes back with the DOWN mark facing down, then washer, lockwasher and bolt torqued.", c: ["144-180 in-lb"], tl: ["tqin", "antiseize"], w: "Make sure the stand locks properly in both positions before you ride." }
  ]
},

/* ---------------- Seasonal ---------------- */
{
  id: "storage", title: "Winter storage", group: "Season",
  at: [], mins: 90, page: "Manual p. 26-27",
  lede: "Dry, insulated space out of sunlight. Everything below is the minimum.",
  steps: [
    { t: "Wash it", b: "All the dirt, mud and road salt off, and let it dry." },
    { t: "Fresh oil in", b: "Warm it up, then change the engine oil and the transmission oil regardless of how few miles are on them. Acids in used oil eat bearings over a winter." },
    { t: "Deal with the fuel", b: "The manual's approach is to drain the tank and run the engine until the lines and carburetor or injection module are dry." },
    { t: "Fog the cylinders", b: "Pull the spark plugs, put a teaspoon of engine oil in each cylinder, cover the holes with a rag, and turn the engine over slowly to spread it. Plugs back in.", tl: ["plugskt"] },
    { t: "Pull the battery", b: "Take it out and store it somewhere cool and dry. Put it on a maintainer if you have one.", loc: "battery" },
    { t: "Cover the openings", b: "Block the exhaust outlets and the intake so nothing nests in them." },
    { t: "Drop the tire pressure", b: "Reduce normal pressure by about 20%, then get the wheels off the ground on a stand or blocks. If you can't lift it, put plywood between the tires and the floor and leave them at full pressure instead." },
    { t: "Protect the rubber", b: "Protectant on plastic and rubber parts including the tires, following the product's own instructions." },
    { t: "Waking it up", b: "Reverse all of it: battery in and charged, fresh fuel, plugs out and crank to clear the oil if you fogged it, tire pressures back up, then a full pre-ride inspection before the first ride." }
  ]
}
];
