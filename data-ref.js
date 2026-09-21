/* Reference data: specifications, torques, troubleshooting, diagnostic codes,
   parts and tools.
   Specs and torques are transcribed from the Clymer "Harley-Davidson Softail
   2000-2005" manual tables, for the 2003 FLSTC unless a row says otherwise.
   Troubleshooting lists are condensed from Chapter Two.
   Part picks and store links were found by web search in September 2026 and are
   not from the manual; stock and prices change. */

const SPECS = [
  { group: "Capacities", src: "Table 4, p. 92", rows: [
    ["Engine oil, refill with filter", "3.5 U.S. qt (3.3 L)"],
    ["Primary chaincase", "26 U.S. oz (768 ml)"],
    ["Transmission, oil change", "20-24 U.S. oz (591-709 ml)"],
    ["Transmission, dry rebuild", "24 U.S. oz (709 ml)"],
    ["Front fork, per leg (FLSTC)", "12.9 U.S. oz, level 4.72 in. (119.9 mm)"],
    ["Fuel tank, total", "5.0 U.S. gal (18.9 L)"],
    ["Fuel tank, reserve", "0.9 U.S. gal (3.4 L)"]
  ]},
  { group: "Fluids", src: "Tables 3 and 5, p. 91-92", rows: [
    ["Engine oil, above 40F", "HD360 20W-50 multi-grade"],
    ["Engine oil, below 40F", "HD360 10W-40 multi-grade"],
    ["Engine oil, above 60F", "HD360 SAE 50 regular heavy"],
    ["Engine oil, above 80F", "HD360 SAE 60 extra heavy"],
    ["Oil service rating", "API SF or SG motorcycle oil"],
    ["Transmission", "H-D Transmission Lubricant or equivalent"],
    ["Primary chaincase", "H-D Primary Chaincase Lubricant or equivalent"],
    ["Brake fluid", "DOT 5 silicone only"],
    ["Front fork oil", "H-D Type E or equivalent"],
    ["Fuel", "91 pump octane or higher"],
    ["Oil filter", "Premium 10 micron synthetic media"]
  ], notes: [
    "Do not use SH or SJ rated automotive oil. Its friction modifiers can damage the engine and make the wet clutch slip.",
    "Oil additives are not recommended; they can cause clutch slippage.",
    "Always use the same brand at every change.",
    "Never put DOT 4 or DOT 5.1 in this bike. DOT 5 is purple, DOT 5.1 is amber or clear, and mixing them destroys the seals."
  ]},
  { group: "Tune-up", src: "Table 8, p. 93", rows: [
    ["Engine compression", "90 psi (620 kPa), max 10% spread between cylinders"],
    ["Spark plug", "H-D No. 6R12"],
    ["Spark plug gap", "0.038-0.043 in. (0.97-1.09 mm)"],
    ["Idle speed, carbureted", "950-1050 rpm"],
    ["Idle speed, EFI", "Not adjustable"],
    ["Ignition timing", "Not adjustable"],
    ["Drive belt deflection", "5/16-3/8 in. (8-10 mm) at 10 lb"],
    ["Clutch cable free play", "1/16-1/8 in. (1.6-3.2 mm)"],
    ["Brake pad minimum thickness", "0.04 in. (1.02 mm)"],
    ["Primary chain free play, cold", "5/8-7/8 in. (15.9-22.3 mm)"],
    ["Primary chain free play, hot", "3/8-5/8 in. (9.5-15.9 mm)"],
    ["Tire tread minimum", "1/16 in. (1.6 mm)"]
  ], notes: [
    "Harley-Davidson recommends no substitute for the 6R12 spark plug."
  ]},
  { group: "Tire pressure, cold", src: "Table 2, p. 91", rows: [
    ["Front, rider only", "30 psi (207 kPa)"],
    ["Front, rider and passenger", "30 psi (207 kPa)"],
    ["Rear, rider only", "36 psi (248 kPa)"],
    ["Rear, rider and passenger", "40 psi (275 kPa)"]
  ], notes: ["For original-equipment tires. Aftermarket tires may call for different pressures."] },
  { group: "Engine", src: "Chapter Four Table 1, p. 199", rows: [
    ["Type", "Twin Cam 88B, air-cooled 45-degree OHV V-twin, counterbalanced"],
    ["Bore and stroke", "3.75 x 4.00 in. (95.25 x 101.6 mm)"],
    ["Displacement", "88 cu in. (1450 cc)"],
    ["Compression ratio", "9.0:1"],
    ["Torque", "82 ft-lb (111 N-m) at 3000 rpm"],
    ["Max sustained engine speed", "5600 rpm"],
    ["Engine and transmission weight", "204 lb (92.5 kg)"]
  ]},
  { group: "Electrical", src: "Chapter Eight Table 1, p. 377", rows: [
    ["Battery", "12 V, 19 Ah, 270 CCA, sealed maintenance-free"],
    ["Battery fully charged", "13.0-13.2 V at 68F"],
    ["Battery needs charging", "12.5 V or below"],
    ["Maximum parasitic draw", "5.5 mA"],
    ["Alternator AC output, carbureted", "16-20 V per 1000 rpm"],
    ["Alternator AC output, EFI", "19-26 V per 1000 rpm"],
    ["Stator coil resistance", "0.1-0.3 ohm"],
    ["Regulator output at 3600 rpm", "14.3-14.7 V at 75F"],
    ["Ignition coil primary", "0.5-0.7 ohm"],
    ["Ignition coil secondary", "5500-7500 ohms"],
    ["Circuit breaker", "30 amp"],
    ["Fuses", "15 amp each: ignition, lighting, accessory, instrument, security"]
  ]},
  { group: "Bulbs", src: "Chapter Eight Table 4, p. 378", rows: [
    ["Headlamp, FLST models", "40/60 W"],
    ["Position lamp", "4 W"],
    ["Passing lamps", "30 W"],
    ["Tail lamp", "7 W"],
    ["Stop lamp", "27 W"],
    ["License plate lamp, FLST", "4.2 W"],
    ["Front turn signal / running light", "27/7 W x2"],
    ["Rear turn signal", "27 W x2"],
    ["Fender tip lamp, FLSTC", "1 W"]
  ]},
  { group: "Dimensions, FLSTC", src: "Chapter One Tables 2-4, p. 27-29", rows: [
    ["Wheelbase", "64.5 in. (1638.3 mm)"],
    ["Overall length", "94.5 in. (2400.3 mm)"],
    ["Overall width", "37.5 in. (952.5 mm)"],
    ["Overall height", "57.8 in. (1468.1 mm)"],
    ["Saddle height", "25.4 in. (645.2 mm)"],
    ["Road clearance", "5.1 in. (129.5 mm)"],
    ["Dry weight", "695.6 lb (315.5 kg)"],
    ["GVWR", "1160 lb (526.1 kg)"],
    ["Front axle weight rating", "430 lb (195 kg)"],
    ["Rear axle weight rating", "730 lb (331.1 kg)"]
  ]},
  { group: "Alignment", src: "Tables 9-10, p. 93", rows: [
    ["Horizontal wheel offset, FLSTC", "0.359 in. (9.12 mm), within 0.250 in."],
    ["Vertical alignment", "Front and rear disc within 0.5 degree"],
    ["Wheel runout, laced", "0.031 in. (0.79 mm) lateral and radial"],
    ["Wheel end play service limit", "0.002 in. (0.051 mm)"]
  ]}
];

/* Torque specifications. Anything a home maintenance job actually touches.
   grp groups them in the UI; jobs[] links a spec to the jobs that use it. */
const TORQUES = [
  { grp: "Fluids",  item: "Oil tank drain plug (on frame rail)", v: "14-21 ft-lb", nm: "19-29 N-m", jobs: ["engine-oil"] },
  { grp: "Fluids",  item: "Transmission drain plug", v: "14-21 ft-lb", nm: "19-28 N-m", jobs: ["trans-oil"] },
  { grp: "Fluids",  item: "Crankcase oil plug", v: "120-144 in-lb", nm: "14-16 N-m", jobs: [] },
  { grp: "Fluids",  item: "Oil filter", v: "Hand tight, 1/2 to 3/4 turn past gasket contact", nm: "", jobs: ["engine-oil"] },
  { grp: "Fluids",  item: "Primary chaincase drain plug", v: "No 2003 spec; 36-60 in-lb for 2005", nm: "4-7 N-m", note: "The manual lists this only for 2005. On a 2003, snug it and stop.", jobs: ["primary-oil"] },
  { grp: "Primary", item: "Clutch inspection cover screws", v: "84-108 in-lb", nm: "9.5-12 N-m", jobs: ["primary-oil", "primary-level", "clutch-adj"] },
  { grp: "Primary", item: "Primary chain inspection cover screws", v: "84-108 in-lb", nm: "9.5-12.2 N-m", jobs: ["primary-chain"] },
  { grp: "Primary", item: "Primary chain adjuster shoe nut", v: "21-29 ft-lb", nm: "29-39 N-m", jobs: ["primary-chain"] },
  { grp: "Primary", item: "Clutch adjusting screw locknut", v: "72-120 in-lb", nm: "8-14 N-m", jobs: ["clutch-adj"] },
  { grp: "Primary", item: "Primary chaincase cover bolts", v: "108-120 in-lb", nm: "12-14 N-m", jobs: [] },
  { grp: "Primary", item: "Diaphragm spring bolts", v: "90-108 in-lb", nm: "10-12 N-m", jobs: [] },
  { grp: "Tune-up", item: "Spark plug", v: "11-18 ft-lb", nm: "15-24 N-m", jobs: ["spark-plugs", "compression"] },
  { grp: "Tune-up", item: "Air filter backplate screws", v: "20-40 in-lb", nm: "2-4 N-m", jobs: ["air-filter"] },
  { grp: "Tune-up", item: "Air filter cover screw", v: "36-60 in-lb", nm: "4-7 N-m", jobs: ["air-filter"] },
  { grp: "Chassis", item: "Front axle nut (FLSTC)", v: "50-55 ft-lb", nm: "68-75 N-m", jobs: [] },
  { grp: "Chassis", item: "Rear axle nut", v: "60-65 ft-lb", nm: "81-88 N-m", jobs: ["drive-belt"] },
  { grp: "Chassis", item: "Fork tube cap", v: "40-60 ft-lb", nm: "54-81 N-m", jobs: ["fork-oil"] },
  { grp: "Chassis", item: "Fork drain screw (all but FXSTD)", v: "52-78 in-lb", nm: "6-9 N-m", jobs: ["fork-oil"] },
  { grp: "Chassis", item: "Jiffy stand leg stop bolt", v: "144-180 in-lb", nm: "16-20 N-m", jobs: ["lube-points"] },
  { grp: "Chassis", item: "Front brake disc bolts", v: "16-24 ft-lb", nm: "22-32 N-m", jobs: [] },
  { grp: "Chassis", item: "Rear brake disc bolts", v: "30-45 ft-lb", nm: "41-61 N-m", jobs: [] },
  { grp: "Chassis", item: "Driven sprocket bolts", v: "55-60 ft-lb", nm: "75-81 N-m", jobs: [] }
];

/* Troubleshooting, condensed from Chapter Two. */
const TROUBLE = [
  { q: "Engine will not crank", causes: [
    "Ignition switch off, or a faulty switch",
    "Engine run switch off, or a defective run switch",
    "Discharged or dead battery",
    "Loose or corroded battery and starter cables (the solenoid chatters)",
    "Defective starter motor or solenoid",
    "Defective starter shaft pinion gear, or a slipping overrunning clutch",
    "Seized piston, seized crankshaft bearings or a broken rod"
  ]},
  { q: "Engine cranks but will not start", causes: [
    "Do the spark test first: pull a plug, ground it against the head, crank, and look for a crisp blue spark",
    "Good spark points at fuel: obstructed line or filter, failed fuel pump on EFI, flooded engine, low compression, or ignition timing",
    "Fouled spark plugs",
    "Enrichener (choke) out of adjustment on a carbureted bike",
    "Intake manifold air leak, or a plugged fuel tank filler cap",
    "Contaminated or stale fuel",
    "Defective ignition module or coil, or damaged coil wires",
    "Engine oil too heavy for the temperature",
    "Loose ignition sensor or module connector"
  ], warn: "Do not do the spark test on a flooded engine; the spark can light fuel coming out of the plug hole." },
  { q: "Engine runs but misfires", causes: [
    "Fouled or wrongly gapped plugs",
    "Damaged spark plug cables",
    "Incorrect ignition timing or defective ignition components",
    "Obstructed fuel line, fuel shutoff valve or fuel filter",
    "Clogged carburetor jets, or a failing fuel pump on EFI",
    "Loose battery connection, damaged wiring or connectors",
    "Water or contaminants in the fuel",
    "Weak or damaged valve springs, damaged valve, or incorrect valve timing"
  ]},
  { q: "Spark plugs keep fouling", causes: [
    "Badly contaminated air filter",
    "Wrong spark plug heat range",
    "Rich fuel mixture or incorrect float level",
    "Worn or damaged piston rings",
    "Worn valve guide oil seals or excessive stem-to-guide clearance"
  ]},
  { q: "Engine noises", causes: [
    "Knock or ping under acceleration: low octane or poor fuel, too-hot plug heat range, carbon buildup, or a defective ignition module",
    "Slap or rattle at low speed: piston-to-cylinder clearance, bent rod, or worn piston pin",
    "Knock on deceleration: rod bearing clearance",
    "Persistent knock with vibration: main bearings, then loose engine mounts, cracked frame, leaking head gasket",
    "On-off squeal: compression leaking past the head gasket or spark plug",
    "Valve train noise: bent pushrod, bad lifter, sticking valve, worn cam, damaged rocker arm"
  ]},
  { q: "Oil light stays on above idle", causes: [
    "Check the oil level in the tank first",
    "Oil not returning to the tank: clogged or damaged return line, or a damaged oil pump",
    "Below freezing, ice and sludge can block the oil feed pipe",
    "If the light never comes on with the ignition on and engine stopped, suspect the bulb or the oil pressure switch"
  ], warn: "An oil light on above idle means stop riding and find out why." },
  { q: "Burning oil or smoking", causes: [
    "Oil tank overfilled",
    "Restricted oil filter",
    "Worn valve guides or guide seals",
    "Worn or damaged piston rings",
    "Leaking cylinder head surfaces"
  ]},
  { q: "Oil leaks", causes: [
    "Clogged air filter breather hose",
    "Restricted or damaged oil return or vent line to the tank",
    "Oil tank overfilled",
    "Restricted oil filter",
    "Loose engine parts or damaged gasket surfaces"
  ]},
  { q: "Clutch slips", causes: [
    "Clutch out of adjustment (start here, and adjust cold)",
    "Worn friction plates",
    "Weak or damaged diaphragm spring",
    "Damaged pressure plate",
    "Oil additives or the wrong oil in the primary"
  ]},
  { q: "Clutch drags or will not release", causes: [
    "Clutch out of adjustment",
    "Warped clutch plates",
    "Worn or damaged clutch shell or hub",
    "Worn or misassembled ball and ramp release mechanism",
    "Incorrect primary chain alignment",
    "Weak or damaged diaphragm spring"
  ]},
  { q: "Clutch chatters or is noisy", causes: ["Usually worn or warped clutch plates"] },
  { q: "Hard shifting", causes: [
    "Clutch drag, so check clutch adjustment first",
    "Worn or damaged shift forks",
    "Worn shifter clutch dogs",
    "Weak or damaged shifter return spring"
  ]},
  { q: "Jumps out of gear", causes: [
    "Worn or damaged shifter parts",
    "Shifter rod or shifter drum out of adjustment",
    "Badly worn gears or shift forks"
  ]},
  { q: "Excessive vibration", causes: [
    "Loose engine mounting hardware is the usual cause",
    "Loose, worn or damaged engine stabilizer link",
    "Balancer system out of alignment or damaged",
    "Severely worn primary chain, or tight links in it",
    "Unbalanced, damaged or bent wheel, or a bad tire",
    "Loose or worn steering head bearings, loose swing arm pivot shaft nut",
    "Cracked or broken frame"
  ]},
  { q: "Wobbly or irregular steering", causes: [
    "Loose axle nuts",
    "Loose or worn steering head bearings",
    "Excessive wheel bearing play",
    "Laced wheel out of alignment, or an unbalanced wheel",
    "Incorrect wheel alignment",
    "Tire not seated properly on the rim",
    "Bent steering stem or frame at the neck",
    "Too much weight on the front end from non-standard equipment"
  ]},
  { q: "Stiff steering", causes: [
    "Low front tire pressure",
    "Loose or worn steering head bearings",
    "Bent or damaged steering stem or frame"
  ]},
  { q: "Harsh or poor fork action", causes: [
    "Wrong fork springs, or the wrong fork oil viscosity",
    "Too much fork oil, or contaminated oil",
    "Leaking fork seals",
    "Worn or bent fork tubes",
    "Too much front end load from non-standard equipment"
  ]},
  { q: "Poor rear shock action", causes: [
    "Damper unit leaking",
    "Shocks adjusted incorrectly for the load",
    "Loose mounting hardware",
    "Overloaded or unevenly loaded"
  ]},
  { q: "Weak brakes", causes: [
    "Worn brake pads or discs",
    "Air in the hydraulic system",
    "Glazed or contaminated pads",
    "Low fluid level, or a leaking line or hose",
    "Leaking or damaged master cylinder primary cup seal",
    "Brake drag causing heat and fade"
  ]},
  { q: "Spongy brake lever", causes: ["Air in the hydraulic system. Bleed the brakes."] },
  { q: "Brakes squeal or chatter", causes: [
    "Pad thickness and disc condition",
    "Caliper anti-rattle springs missing or damaged",
    "Dirt on the pads",
    "Warped or loose disc",
    "Loose caliper mounting bolts or axle nut",
    "Worn wheel bearings or a damaged hub"
  ]},
  { q: "Brakes drag", causes: [
    "Insufficient pedal or lever free play",
    "Worn, loose or missing caliper parts",
    "Excessive disc runout"
  ]},
  { q: "Bulbs keep burning out", causes: [
    "Excessive vibration",
    "Loose connections causing current surges",
    "Wrong bulb type fitted",
    "Most light and ignition faults are loose or corroded ground connections; check those before replacing parts"
  ]}
];

/* Engine management diagnostic trouble codes, Chapter Two Table 3, p. 61.
   Codes are read by counting check-engine light flashes. Clearing them needs a dealer. */
const DTC = [
  ["11", "Throttle position sensor", "efi"],
  ["12", "MAP sensor", "carb"],
  ["13", "Barometric pressure sensor", "efi"],
  ["14", "Engine temperature sensor", "efi"],
  ["15", "Intake air temperature sensor", "efi"],
  ["16", "Battery positive voltage", ""],
  ["23", "Front cylinder fuel injector", "efi"],
  ["24", "Front cylinder ignition coil", ""],
  ["25", "Rear cylinder ignition coil", ""],
  ["32", "Rear cylinder fuel injector", "efi"],
  ["33", "Fuel pump relay", "efi"],
  ["34", "Loss of idle speed control", ""],
  ["41", "Crankshaft position sensor", ""],
  ["43", "VSS sensor low", ""],
  ["44", "Bank angle sensor", ""],
  ["52", "RAM error or failure", ""],
  ["53", "ROM error or failure", ""],
  ["54", "EPROM error or failure", ""],
  ["55", "Ignition module failure", ""],
  ["56", "Camshaft and crankshaft position sensor timing or signal error", ""]
];

const DTC_HOWTO = {
  carb: [
    "Remove the seat and lift the data link connector off its bracket, then pull the protective cover.",
    "Jumper pins 1 (light green/red) and 2 (black) with 18-gauge wire and two Deutsch sockets.",
    "Turn the ignition on. After about eight seconds the check engine light gives a ready signal: six rapid flashes.",
    "Two-second pause, then it flashes the first digit, pause, then the second digit. Two flashes then five flashes is code 25.",
    "Another ready signal means another code follows. When the codes start repeating, you have them all.",
    "Ignition off, remove the jumper, refit the cover and the seat."
  ],
  efi: [
    "Remove the seat, lift the data link connector off its bracket and pull the protective cover.",
    "The light flashes codes the same way: a six-flash ready signal, then each code as first digit, pause, second digit.",
    "When the sequence repeats, every stored code has been shown."
  ],
  note: "Retrieval is all you get at home. Clearing codes and testing further needs Harley-Davidson equipment."
};

/* ---------- Parts ---------- */
const STORES = ["All", "AutoZone", "O'Reilly", "NAPA", "Dealer", "Online"];
const LOCAL = ["AutoZone", "O'Reilly", "NAPA"];

const PARTS = [
 { cat: "Oil filter", pick: true, jobs: ["engine-oil"], items: [
  { id: "kn171c", name: "K&N KN-171C (chrome)", pn: "Replaces H-D 63731-99 / 63798-99", tag: "Top pick", note: "Synthetic media, matching the manual's spec, and a 17 mm nut welded on the end for easy removal.", where: [
   { s: "AutoZone", t: "AutoZone, $19.99", u: "https://www.autozone.com/p/k-n-engine-oil-filter-kn-171c/594232" },
   { s: "O'Reilly", t: "O'Reilly", u: "https://www.oreillyauto.com/detail/c/k-n-engineering/k-n-engineering-engine-oil-filter/kan0/kn171c" }] },
  { id: "kn171b", name: "K&N KN-171B (black)", pn: "Same filter, black can", note: "Ask the counter or order online if the store only stocks chrome.", where: [
   { s: "Online", t: "Amazon", u: "https://www.amazon.com/KN-171B-Harley-Davidson-Performance-Filter/dp/B000FGI6E6" }] },
  { id: "napa1215", name: "NAPA Gold 1215 (black) or 1225 (chrome)", pn: "Cross-references the Harley filter", tag: "Budget", note: "Right thread (3/4-16) and size. Cellulose media, so it's a step below the manual's synthetic spec. Often order-only.", where: [
   { s: "NAPA", t: "NAPA", u: "https://www.napaonline.com/en/p/FIL1215" }] },
  { id: "hiflo", name: "Hiflofiltro HF171C / HF171B", pn: "Replaces 63731-99 / 63798-99", note: "Common online alternative.", where: [
   { s: "Online", t: "Amazon", u: "https://www.amazon.com/Filter-HF171C-Chrome-Harley-Davidson-Replaces/dp/B07NDHTVNK" }] },
  { id: "hdfilter", name: "Harley-Davidson OEM filter", pn: "63731-99A black / 63798-99 chrome", note: "The factory part.", where: [{ s: "Dealer", t: "Harley dealer" }] }] },

 { cat: "Engine oil (4 qt)", pick: true, jobs: ["engine-oil"], items: [
  { id: "mobil", name: "Mobil 1 V-Twin 20W-50 full synthetic", pn: "AutoZone 112630, O'Reilly 12050, NAPA MOB 112630", tag: "Works in all three", note: "Mobil rates it for the engine, transmission, and primary chaincase, including wet clutches. Buy 6 qt to do everything.", where: [
   { s: "AutoZone", t: "AutoZone", u: "https://www.autozone.com/p/mobil-1-motor-oil-112630/153232" },
   { s: "O'Reilly", t: "O'Reilly", u: "https://www.oreillyauto.com/detail/c/1-v-twin/mobil-1-v-twin-synthetic-motorcycle-motor-oil-20w-50-1-quart/mobi/12050" },
   { s: "NAPA", t: "NAPA", u: "https://www.napaonline.com/en/p/MOB112630" }] },
  { id: "castrol", name: "Castrol Power1 V-Twin 4T 20W-50 full synthetic", pn: "NAPA CAS 080", tag: "Works in all three", note: "Designed for V-twin engines, transmissions, and primary chaincases.", where: [
   { s: "NAPA", t: "NAPA", u: "https://www.napaonline.com/en/p/CAS080" }] },
  { id: "lucas2050", name: "Lucas Motorcycle Synthetic 20W-50", pn: "Full synthetic", note: "Lucas lists it for engines, primaries, and transmissions.", where: [
   { s: "AutoZone", t: "AutoZone", u: "https://www.autozone.com/motor-oil-and-transmission-fluid/engine-oil/p/lucas-oil-products-motorcycle-full-synthetic-engine-oil-20w-50-1-quart/712727_0_0" }] },
  { id: "valv", name: "Valvoline 4-Stroke Motorcycle 20W-50", pn: "Conventional, VAL 798152", tag: "Budget", note: "Motorcycle-specific conventional oil for the engine.", where: [
   { s: "AutoZone", t: "AutoZone", u: "https://www.autozone.com/p/valvoline-motor-oil-798152/365427" },
   { s: "NAPA", t: "NAPA", u: "https://www.napaonline.com/en/p/VAL798152" }] },
  { id: "hd360", name: "H-D 360 20W-50 or SYN3", pn: "Factory oil", note: "What the manual specifies.", where: [{ s: "Dealer", t: "Harley dealer" }] }] },

 { cat: "Transmission (1 qt)", pick: true, jobs: ["trans-oil"], items: [
  { id: "t-mobil", name: "Mobil 1 V-Twin 20W-50", pn: "Same bottle as the engine oil", note: "Simplest route if you're using it everywhere.", where: [
   { s: "AutoZone", t: "AutoZone", u: "https://www.autozone.com/p/mobil-1-motor-oil-112630/153232" },
   { s: "O'Reilly", t: "O'Reilly", u: "https://www.oreillyauto.com/detail/c/1-v-twin/mobil-1-v-twin-synthetic-motorcycle-motor-oil-20w-50-1-quart/mobi/12050" },
   { s: "NAPA", t: "NAPA", u: "https://www.napaonline.com/en/p/MOB112630" }] },
  { id: "lucas140", name: "Lucas Synthetic 75W-140 V-Twin Gear Oil", pn: "Lucas 10791", note: "Gear oil built for V-twin transmissions.", where: [
   { s: "O'Reilly", t: "O'Reilly", u: "https://www.oreillyauto.com/detail/c/lucas-oil-products/lucas-synthetic-gear-oil-75w-140-1-quart/luc0/10791" }] },
  { id: "redline", name: "Red Line V-Twin Transmission Oil", pn: "Red Line 42804", note: "Covers Twin Cam transmissions; known for quieting the shift clunk.", where: [
   { s: "O'Reilly", t: "O'Reilly", u: "https://www.oreillyauto.com/detail/c/red-line-synthetic-oil/red-line-synthetic-transmission-fluid-v-twin-1-quart/rl00/42804" }] },
  { id: "hdtrans", name: "H-D Formula+ transmission and primary lube", pn: "Factory lube", note: "The manual's spec.", where: [{ s: "Dealer", t: "Harley dealer" }] }] },

 { cat: "Primary chaincase (1 qt)", pick: true, jobs: ["primary-oil"], items: [
  { id: "p-mobil", name: "Mobil 1 V-Twin 20W-50", pn: "Same bottle as the engine oil", note: "Rated for wet clutches.", where: [
   { s: "AutoZone", t: "AutoZone", u: "https://www.autozone.com/p/mobil-1-motor-oil-112630/153232" },
   { s: "O'Reilly", t: "O'Reilly", u: "https://www.oreillyauto.com/detail/c/1-v-twin/mobil-1-v-twin-synthetic-motorcycle-motor-oil-20w-50-1-quart/mobi/12050" },
   { s: "NAPA", t: "NAPA", u: "https://www.napaonline.com/en/p/MOB112630" }] },
  { id: "lucasprim", name: "Lucas Primary Chaincase Oil", pn: "Lucas 10790", note: "Made to carry heat off the clutch plates.", where: [
   { s: "O'Reilly", t: "O'Reilly", u: "https://www.oreillyauto.com/detail/c/lucas-oil-products/chemicals---fluids/grease---lube/chain-oil/2bda52bc5996/lucas-oil-products-chaincase-oil/luc0/10790" }] },
  { id: "p-castrol", name: "Castrol Power1 V-Twin 20W-50", pn: "NAPA CAS 080", note: "Rated for primary chaincases.", where: [
   { s: "NAPA", t: "NAPA", u: "https://www.napaonline.com/en/p/CAS080" }] },
  { id: "hdprim", name: "H-D primary chaincase lube or Formula+", pn: "Factory lube", note: "The manual's spec.", where: [{ s: "Dealer", t: "Harley dealer" }] }] },

 { cat: "Seals", jobs: ["engine-oil", "trans-oil", "primary-oil"], items: [
  { id: "oring", name: "Drain plug O-rings (buy 2+)", pn: "H-D 11105", tag: "Replace every change", note: "Fits the engine and transmission drain plugs on your '03. On 1999-2006 Twin Cams the primary plug is different.", where: [
   { s: "Dealer", t: "Harley dealer" },
   { s: "Online", t: "Amazon multipack", u: "https://www.amazon.com/50-Pack-Harley-Davidson-Ring/dp/B01DUTU9FS" }] },
  { id: "quad", name: "Clutch inspection cover quad ring", pn: "Reuse if it's in good shape", note: "Swap it if it's flattened, cracked, or leaking.", where: [{ s: "Dealer", t: "Harley dealer" }] },
  { id: "pchaingask", name: "Primary chain inspection cover gasket", pn: "Ask the counter for your year", note: "The manual calls for a new gasket every time that cover comes off for a chain adjustment.", where: [{ s: "Dealer", t: "Harley dealer" }] },
  { id: "caporing", name: "Oil filler cap O-ring", pn: "Ask the counter", note: "Cheap, and a cracked one weeps oil down the tank.", where: [{ s: "Dealer", t: "Harley dealer" }] }] },

 { cat: "Tune-up", jobs: ["spark-plugs", "air-filter"], items: [
  { id: "plugs6r12", name: "Spark plugs, H-D 6R12 (pair)", pn: "H-D No. 6R12", tag: "Manual spec", note: "The manual says not to substitute another plug. Gap them to 0.038-0.043 in. even if they come pre-gapped.", where: [{ s: "Dealer", t: "Harley dealer" }] },
  { id: "airelem", name: "Air filter element", pn: "Bring your year and fuel system to the counter", note: "The paper element washes and reuses. Buy one only when yours is torn, deteriorated, or won't come clean. K&N and Screamin' Eagle equivalents exist.", where: [{ s: "Dealer", t: "Harley dealer" }, { s: "Online", t: "Online" }] },
  { id: "antiseize", name: "Anti-seize compound", pn: "Any brand", note: "Light coat on spark plug threads. Never engine oil.", where: [{ s: "AutoZone", t: "Any parts store" }, { s: "O'Reilly", t: "Any parts store" }, { s: "NAPA", t: "Any parts store" }] },
  { id: "loctiteblue", name: "Blue threadlocker", pn: "ThreeBond TB1342 or equivalent", note: "One drop on the air filter cover screw.", where: [{ s: "AutoZone", t: "Any parts store" }, { s: "O'Reilly", t: "Any parts store" }, { s: "NAPA", t: "Any parts store" }] }] },

 { cat: "Other fluids", jobs: ["brake-fluid", "fork-oil", "lube-points"], items: [
  { id: "dot5", name: "DOT 5 silicone brake fluid", pn: "Must say DOT 5 SILICONE", tag: "Never DOT 4 or 5.1", note: "DOT 5 is purple. DOT 5.1 is amber or clear and is a completely different, incompatible fluid despite the name.", where: [{ s: "AutoZone", t: "Any parts store" }, { s: "O'Reilly", t: "Any parts store" }, { s: "NAPA", t: "Any parts store" }, { s: "Dealer", t: "Harley dealer" }] },
  { id: "forkoil", name: "Fork oil, H-D Type E or equivalent", pn: "About 26 oz for both legs", note: "12.9 oz per leg on the FLSTC. Type E equivalents are widely sold.", where: [{ s: "Dealer", t: "Harley dealer" }, { s: "Online", t: "Online" }] },
  { id: "wgrease", name: "Waterproof grease", pn: "Any marine or chassis grease", note: "Rear brake pedal fitting and the steering head grease fitting.", where: [{ s: "AutoZone", t: "Any parts store" }, { s: "O'Reilly", t: "Any parts store" }, { s: "NAPA", t: "Any parts store" }] },
  { id: "cableluboil", name: "Cable lubricant", pn: "Aerosol cable lube", note: "Only for non-nylon-lined cables. Not chain lube, and never on the enrichener cable.", where: [{ s: "AutoZone", t: "Any parts store" }, { s: "O'Reilly", t: "Any parts store" }] },
  { id: "dgrease", name: "Dielectric grease", pn: "Any brand", note: "Battery terminals, to slow corrosion.", where: [{ s: "AutoZone", t: "Any parts store" }, { s: "O'Reilly", t: "Any parts store" }, { s: "NAPA", t: "Any parts store" }] }] }
];

/* Same product picked in more than one category collapses into one shopping line. */
const LINKS = { mobil: ["t-mobil", "p-mobil"] };
const MERGE = { "t-mobil": "mobil", "p-mobil": "mobil", "p-castrol": "castrol" };
const QTY = { "Oil filter": [1, "", "each"], "Engine oil (4 qt)": [4, "qt", "per qt"], "Transmission (1 qt)": [1, "qt", "per qt"], "Primary chaincase (1 qt)": [1, "qt", "per qt"] };
const ITEMQTY = { oring: [2, "", "each"], quad: [1, "", "each"], plugs6r12: [2, "", "each"] };
const HINTS = { kn171c: "AutoZone listed it at $19.99." };

/* ---------- Tools ---------- */
const TOOLS = [
 { cat: "Sockets and bits", items: [
  { id: "ratchet", name: "3/8 in. drive ratchet and a short extension", use: "Drives most of this. The extension reaches the transmission plug between the shocks." },
  { id: "s58", name: "5/8 in. socket", use: "Engine oil tank drain plug and transmission drain plug.", tag: "Confirm fit" },
  { id: "hex", name: "1/4 in. and 3/8 in. hex bit sockets", use: "Some drain plugs take a 1/4 in. hex. A 3/8 in. hex opens the transmission dipstick cap on some bikes.", tag: "Confirm fit" },
  { id: "hexset", name: "Hex key set", use: "Air filter cover screw and assorted covers.", tag: "Confirm fit" },
  { id: "t40", name: "T40 Torx bit", use: "Primary chaincase drain plug.", tag: "Confirm fit" },
  { id: "t27", name: "T27 Torx bit", use: "Clutch and primary chain inspection cover screws, air filter bracket. Buy a good bit; these strip easily.", tag: "Confirm fit" },
  { id: "skt6", name: "Six-point socket for the fork caps", use: "Fork tube caps only. A twelve-point rounds the corners." },
  { id: "plugskt", name: "Spark plug socket with rubber insert", use: "The plugs are recessed in the heads and need the insert to come out." },
  { id: "fwrench", name: "Oil filter wrench", use: "Cap-style wrench for Harley filters, or a 17 mm socket if you use the K&N with the end nut." },
  { id: "wrench", name: "Open-end wrench set", use: "Cable adjuster flats, jam nuts, assorted." }] },
 { cat: "Torque and measuring", items: [
  { id: "tqft", name: "Torque wrench, ft-lb (3/8 in. drive)", use: "Drain plugs at 14-21 ft-lb, spark plugs at 11-18 ft-lb, rear axle at 60-65 ft-lb." },
  { id: "tqin", name: "Torque wrench, in-lb (1/4 in. drive)", use: "Inspection covers at 84-108 in-lb and air filter screws. Most ft-lb wrenches won't read this low.", tag: "Loaner option" },
  { id: "gauge", name: "Tire pressure gauge", use: "Read pressures cold. Worth keeping one on the bike." },
  { id: "ruler", name: "Steel ruler or caliper", use: "Brake pad thickness, primary chain free play, belt deflection, tread depth." },
  { id: "gapper", name: "Wire feeler gauge and gapping tool", use: "Spark plug gap, 0.038-0.043 in. Wire gauges read a used plug correctly; flat gauges don't." },
  { id: "dmm", name: "Digital multimeter", use: "Battery voltage and parasitic draw." },
  { id: "comptester", name: "Compression tester", use: "Every 10,000 miles. Auto parts stores usually loan these." },
  { id: "tach", name: "Portable tachometer", use: "Setting idle speed on a carbureted bike.", tag: "Carb only" },
  { id: "belttool", name: "Belt tension gauge", use: "H-D HD-35381 or equivalent. You can do it by feel with 10 lb of push, but the gauge repeats." },
  { id: "cablelube", name: "Cable lubricator tool", use: "Clamps onto a cable so lube goes through it instead of over it." }] },
 { cat: "Fluids handling", items: [
  { id: "pan", name: "Drain pan, 6 qt or larger", use: "About 5 qt comes out across all three fluids." },
  { id: "funnel", name: "Wide funnel", use: "Oil tank and primary." },
  { id: "lfunnel", name: "Long-neck or flexible funnel", use: "Transmission dipstick hole." },
  { id: "cup", name: "Measuring cup or marked bottle", use: "Oil comes in 32 oz quarts; you need 20-24 oz for the transmission and 26 oz for the primary." },
  { id: "jugs", name: "Empty jugs for used oil", use: "Most parts stores take used oil and filters. Call first." },
  { id: "oiler", name: "Small oil can", use: "Lever pivot pins." },
  { id: "gun", name: "Grease gun", use: "Steering head grease fitting." },
  { id: "graphite", name: "Graphite lubricant", use: "Where the throttle grip meets the handlebar." }] },
 { cat: "Supplies", items: [
  { id: "cleaner", name: "Contact or brake cleaner", use: "Cleaning the filter mount before the new filter goes on." },
  { id: "rags", name: "Rags or shop towels", use: "Plugs, sealing surfaces, spills." },
  { id: "gloves", name: "Nitrile gloves", use: "The manual warns to get oil off skin promptly." },
  { id: "bag", name: "Zip-top bag", use: "Seal the old filter in it." },
  { id: "light", name: "Flashlight or headlamp", use: "Reading the primary level through the clutch opening and finding the transmission drain plug." },
  { id: "loctite", name: "Blue threadlocker", use: "One drop on the air filter cover screw." },
  { id: "antiseize", name: "Anti-seize compound", use: "Spark plug threads, jiffy stand pivot." },
  { id: "dgrease", name: "Dielectric grease", use: "Battery terminals." },
  { id: "wgrease", name: "Waterproof grease", use: "Rear brake pedal fitting." }] },
 { cat: "Holding the bike", items: [
  { id: "helper", name: "A helper", use: "The manual asks for an assistant to hold the bike straight up for fluid levels, and to sit on it for belt deflection." },
  { id: "jack", name: "Motorcycle jack or lift", use: "Rear wheel off the ground for belt, primary chain and jiffy stand work." }] }
];
