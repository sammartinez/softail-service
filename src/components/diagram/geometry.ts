/* Bike diagram geometry, first lifted from the vanilla app.js, then redrawn
   over a side-on photo of a 2003 FLSTC so the shapes and the parts sit where
   they sit on the bike. The photo was a tracing reference only; it isn't kept.

   These are pure functions of their arguments and constants evaluated once. */


export interface Mark {
  id: string;
  x: number;
  y: number;
  /** Which side the marker belongs on: r, l, or b for both. */
  s: "r" | "l" | "b";
  /** Points to run leader lines to, where a part is buried or badges collide. */
  t?: [number, number][];
}

/* The bike is drawn once facing right — stand on the right of a bike and its
   front wheel is on your right — then mirrored for the left-side view, so every
   part is positioned once and the two sides can't drift apart.

   Scale is 3.1 units to the inch off a 2003 FLSTC: ground at y=200, rear axle
   at x=104 and front axle at x=304, which is the 64.5 in. wheelbase. Tyre
   radius 39.5 is a 16 in. rim on an MT90. The photo, scaled so its axles land
   on those two points, agreed on the tyre size to within a unit, and put the
   rest where it is now: crank centre at about (213, 164), the V centred over
   it with the oval air cleaner at (216, 131), the frame downtube nearly
   vertical at x=252 just behind the fork, the pillion 34 in. up at y=95 and
   the rider's seat 29 in. at y=109. Mirroring is about x=200, so the viewBox
   spans 44 to 356 to frame both views identically.

   Parts that come off before you work on anything — saddlebag, windshield —
   and the ones out of sight under the seat are drawn dashed. */
export const DW = 400;

/* Symmetric about the mirror line (44 + 356 = DW), so both views frame the
   bike identically. A test pins this. Tall enough for the windshield top. */
export const VIEWBOX = "44 14 312 194";

const LINE = 'stroke="#64748B" stroke-width="1.5"';

/* One laced 16 in. wheel with a whitewall, centred on the axle line. */
function wheel(cx: number): string {
  let sp = "";
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, c = Math.cos(a), s = Math.sin(a);
    sp += "M" + (cx + 7 * c).toFixed(1) + " " + (161 + 7 * s).toFixed(1) +
      "L" + (cx + 22 * c).toFixed(1) + " " + (161 + 22 * s).toFixed(1);
  }
  return '<circle cx="' + cx + '" cy="161" r="35" fill="none" stroke="#475569" stroke-width="9"/>' +
    '<circle cx="' + cx + '" cy="161" r="30" fill="#fff"/>' +
    '<circle cx="' + cx + '" cy="161" r="23" fill="#F8FAFC" stroke="#64748B" stroke-width="2"/>' +
    '<path d="' + sp + '" fill="none" stroke="#94A3B8" stroke-width="1.3"/>' +
    '<circle cx="' + cx + '" cy="161" r="6.5" fill="#E2E8F0" ' + LINE + '/>';
}

/* A valanced fender: the band of steel between radius ri and ro, wrapped from
   angle a1 to a2 measured the usual way, 0 straight ahead and 90 straight up. */
function fender(cx: number, ri: number, ro: number, a1: number, a2: number): string {
  const p = (r: number, a: number) => (cx + r * Math.cos(a * Math.PI / 180)).toFixed(1) + " " + (161 - r * Math.sin(a * Math.PI / 180)).toFixed(1);
  const big = a2 - a1 > 180 ? 1 : 0;
  return '<path d="M' + p(ro, a1) + "A" + ro + " " + ro + " 0 " + big + " 0 " + p(ro, a2) +
    "L" + p(ri, a2) + "A" + ri + " " + ri + " 0 " + big + " 1 " + p(ri, a1) +
    'Z" fill="#E2E8F0" ' + LINE + '/>';
}

/* One finned cylinder and its rocker box, leaned off vertical by deg about
   its base at (x, 145). The rocker boxes tuck just under the tank, as on the
   bike; the tank is drawn after them so its edge stays clean. */
function cyl(x: number, deg: number): string {
  let fins = "";
  for (let y = 128; y <= 144; y += 4) fins += "M" + (x - 12) + " " + y + "h24";
  return '<g transform="rotate(' + deg + ' ' + x + ' 145)">' +
    '<rect x="' + (x - 12) + '" y="124" width="24" height="22" fill="#F1F5F9" ' + LINE + '/>' +
    '<path d="' + fins + '" fill="none" stroke="#64748B" stroke-width="1" opacity="0.6"/>' +
    '<rect x="' + (x - 17) + '" y="112" width="34" height="13" rx="3" fill="#E2E8F0" ' + LINE + '/>' +
    '</g>';
}

/* A frame tube: a dark casing with a lighter core, so tubing reads as tubing
   instead of as a flat bar the same colour as everything it runs past. */
function tube(d: string, w: number): string {
  return '<path d="' + d + '" fill="none" stroke="#64748B" stroke-width="' + (w + 2) + '" stroke-linecap="round"/>' +
    '<path d="' + d + '" fill="none" stroke="#DDE4EC" stroke-width="' + w + '" stroke-linecap="round"/>';
}

/* Front of the crankcase, low, just behind the downtube. Drawn on both sides:
   the manual's text puts the filter on the left and its photos on the right,
   so it's marked on both. */
export const FILTER = '<g transform="rotate(-20 242 163)"><rect x="235" y="153" width="14" height="20" rx="5" fill="#CBD5E1" ' + LINE + '/></g>';

/* Everything you see from either side. */
export const BASE =
  '<ellipse cx="200" cy="203" rx="148" ry="4" fill="#E2E8F0"/>' +
  wheel(104) + wheel(304) +
  /* valanced fenders: the rear wraps back to the tail light, the front skirt
     comes down low behind the tyre */
  fender(104, 42, 51, 34, 202) + fender(304, 41, 47, 30, 200) +
  '<rect x="52" y="124" width="10" height="7" rx="2" fill="#CBD5E1" ' + LINE + '/>' +
  /* frame: backbone, seat post, downtube into the cradle, fender rail */
  tube("M250 84L160 114", 6) +
  tube("M160 114L154 176", 5) +
  tube("M252 84C253 112 253 146 250 168C248 176 244 179 236 180L150 181", 5) +
  tube("M160 118L98 128", 4) +
  /* swing arm */
  '<path d="M158 178L158 166L104 155L104 167Z" fill="#CBD5E1" ' + LINE + '/>' +
  /* crankcase and the 45-degree V over it */
  '<rect x="188" y="144" width="60" height="30" rx="10" fill="#F8FAFC" ' + LINE + '/>' +
  cyl(203, -22.5) + cyl(223, 22.5) +
  /* fuel tank, tall at the front, with the dash console and filler cap */
  '<path d="M190 116C191 106 202 94 220 85C230 80 238 76 244 77L251 82C253 94 253 106 251 114C232 119 206 119 190 116Z" fill="#fff" ' + LINE + '/>' +
  '<path d="M226 83L243 78L247 84L230 90Z" fill="#CBD5E1" stroke="#64748B" stroke-width="1.2"/>' +
  '<circle cx="218" cy="89" r="4" fill="#F1F5F9" stroke="#64748B" stroke-width="1.2"/>' +
  /* two-up seat: the pillion up high, the rider's dish, and the studded skirt
     hanging down over the frame */
  '<path d="M96 100C96 95 101 93 110 94L132 95C139 96 142 102 148 106C158 110 172 110 184 107L192 113C186 118 176 121 166 123L162 136C150 140 140 134 134 124L130 111L100 110C97 108 96 104 96 100Z" fill="#CBD5E1" ' + LINE + '/>' +
  /* passenger backrest: pad on an upright that bolts to the fender */
  tube("M91 88L95 112", 3) +
  '<rect x="80" y="61" width="16" height="28" rx="6" transform="rotate(-6 88 75)" fill="#CBD5E1" ' + LINE + '/>' +
  /* oil tank and battery, both out of sight under the seat */
  '<rect x="120" y="122" width="56" height="30" rx="8" fill="none" stroke="#64748B" stroke-width="1.4" stroke-dasharray="4 3"/>' +
  '<rect x="146" y="127" width="24" height="18" rx="2" fill="#F1F5F9" stroke="#64748B" stroke-width="1.3" stroke-dasharray="3 2"/>' +
  '<path d="M151 127v-3M165 127v-3" stroke="#64748B" stroke-width="2.4" stroke-linecap="round"/>' +
  '<circle cx="173" cy="126" r="4" fill="#E2E8F0" stroke="#64748B" stroke-width="1.3" stroke-dasharray="3 2"/>' +
  /* steering head, fork tubes and sliders, triple tree */
  tube("M247 76L256 96", 9) +
  tube("M254 84L304 161", 6) +
  tube("M282 128L302 158", 10) +
  tube("M244 80L262 74", 4) +
  /* headlamp, handlebar and mirror */
  '<ellipse cx="280" cy="88" rx="10" ry="12" fill="#fff" ' + LINE + '/>' +
  '<ellipse cx="282" cy="88" rx="5" ry="8" fill="#F1F5F9" stroke="#64748B" stroke-width="1.2"/>' +
  '<path d="M262 90L272 90" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>' +
  tube("M250 78L246 60C244 52 240 50 232 52", 4) +
  '<path d="M231 52L217 55" stroke="#64748B" stroke-width="7" stroke-linecap="round"/>' +
  '<path d="M240 51L235 40" stroke="#64748B" stroke-width="1.6"/>' +
  '<ellipse cx="234" cy="36" rx="3" ry="5" fill="#E2E8F0" stroke="#64748B" stroke-width="1.3"/>' +
  /* rider and passenger floorboards */
  '<rect x="234" y="174" width="32" height="6" rx="3" fill="#7E8EA5"/>' +
  '<rect x="128" y="176" width="22" height="5" rx="2.5" fill="#7E8EA5"/>' +
  /* windshield and saddlebag: dashed, they come off first */
  '<path d="M256 96L266 98" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>' +
  '<path d="M253 98C249 72 245 44 243 18L251 18C258 44 267 66 277 88L272 101Z" fill="#F8FAFC" fill-opacity="0.7" stroke="#64748B" stroke-width="1.4" stroke-dasharray="5 4"/>' +
  '<path d="M58 118C58 115 62 113 68 113L124 113C128 113 130 116 129 121L126 150C125 156 120 159 112 159L78 159C65 159 57 150 56 140Z" fill="none" stroke="#64748B" stroke-width="1.4" stroke-dasharray="5 4"/>' +
  '<path d="M57 127L129 126" fill="none" stroke="#64748B" stroke-width="1.2" stroke-dasharray="4 3"/>';

/* Right side: transmission, cam chest, exhaust, air cleaner. */
export const SIDE_R =
  /* transmission, with the clutch release cover and its filler cap forward */
  '<rect x="156" y="148" width="36" height="26" rx="6" fill="#fff" ' + LINE + '/>' +
  '<rect x="168" y="155" width="24" height="15" rx="6" fill="#E2E8F0" ' + LINE + '/>' +
  '<circle cx="186" cy="159" r="3.5" fill="#CBD5E1" stroke="#64748B" stroke-width="1.2"/>' +
  '<circle cx="214" cy="161" r="9" fill="#E2E8F0" ' + LINE + '/>' +
  /* the oil tank drain line runs down inboard of the exhaust */
  '<path d="M148 152C148 166 146 176 146 186" fill="none" stroke="#64748B" stroke-width="3"/>' +
  '<circle cx="146" cy="187" r="4" fill="#CBD5E1" stroke="#64748B" stroke-width="1.3"/>' +
  /* rear master cylinder, tucked behind the front pipe, and the brake pedal */
  '<rect x="223" y="148" width="11" height="15" rx="3" fill="#CBD5E1" ' + LINE + '/>' +
  '<path d="M230 164L258 170" stroke="#64748B" stroke-width="3" stroke-linecap="round"/>' +
  FILTER +
  /* front and rear headers into the long staggered duals */
  tube("M186 136C181 148 176 156 166 162C160 165 154 167 146 169", 6) +
  tube("M244 134C246 144 236 158 226 170C224 173 222 175 218 176", 6) +
  '<rect x="62" y="165" width="90" height="10" rx="5" fill="#fff" ' + LINE + '/>' +
  '<rect x="134" y="172" width="94" height="10" rx="5" fill="#fff" ' + LINE + '/>' +
  '<path d="M70 170h74M142 177h78" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/>' +
  /* front master cylinder, inboard of the right grip */
  '<rect x="228" y="52" width="10" height="7" rx="2" fill="#CBD5E1" stroke="#64748B" stroke-width="1.4"/>' +
  /* the oval air cleaner sits in the V, between and just below the heads */
  '<ellipse cx="216" cy="131" rx="16" ry="10.5" fill="#fff" ' + LINE + '/>' +
  '<ellipse cx="216" cy="131" rx="8" ry="5" fill="#F1F5F9" stroke="#64748B" stroke-width="1.2"/>';

/* Left side: primary, belt, shifter, jiffy stand. */
export const SIDE_L =
  /* rear pulley and the two runs of the drive belt, back to the transmission */
  '<circle cx="104" cy="161" r="16" fill="none" stroke="#64748B" stroke-width="3"/>' +
  '<path d="M160 154L104 145M160 172L104 177" stroke="#64748B" stroke-width="4" stroke-linecap="round"/>' +
  /* primary chaincase from the crank back to the clutch, with the round clutch
     inspection cover and the chain inspection cover on its upper face */
  '<rect x="150" y="146" width="84" height="36" rx="18" fill="#E2E8F0" ' + LINE + '/>' +
  '<circle cx="170" cy="164" r="12" fill="#F1F5F9" ' + LINE + '/>' +
  '<circle cx="170" cy="164" r="7" fill="none" stroke="#64748B" stroke-width="1" opacity="0.65"/>' +
  '<rect x="194" y="149" width="24" height="13" rx="4" fill="#F1F5F9" ' + LINE + '/>' +
  FILTER +
  /* heel-toe shifter over the floorboard, and the jiffy stand off the frame rail */
  '<path d="M214 178L252 170" fill="none" stroke="#64748B" stroke-width="3.5" stroke-linecap="round"/>' +
  '<rect x="246" y="165" width="12" height="5" rx="2.5" fill="#7E8EA5"/>' +
  '<path d="M222 181L232 197" stroke="#64748B" stroke-width="5" stroke-linecap="round"/>';

/* Numbered markers. x,y is the badge; t are the points it leads to, used where
   a part is buried or two markers would otherwise sit on top of each other.
   s is the side: r, l, or b for both. Left-side x is mirrored at render. */
export const MARKS: Mark[] = [
  { id: "fill", x: 146, y: 84, s: "r", t: [[173, 126]] },
  { id: "tankdrain", x: 124, y: 195, s: "r", t: [[146, 187]] },
  { id: "filter", x: 264, y: 192, s: "b", t: [[243, 166]] },
  { id: "tdip", x: 186, y: 159, s: "r" },
  { id: "tdrain", x: 162, y: 195, s: "r", t: [[174, 174]] },
  { id: "ccover", x: 170, y: 164, s: "l" },
  { id: "pdrain", x: 186, y: 194, s: "l", t: [[190, 182]] },
  { id: "aircleaner", x: 216, y: 131, s: "r" },
  { id: "plugs", x: 180, y: 66, s: "r", t: [[236, 128], [192, 128]] },
  { id: "battery", x: 116, y: 78, s: "r", t: [[158, 136]] },
  { id: "pchain", x: 206, y: 155, s: "l" },
  { id: "belt", x: 128, y: 174, s: "l" },
  { id: "forkdrain", x: 297, y: 150, s: "b" },
  { id: "fmaster", x: 210, y: 36, s: "r", t: [[233, 55]] },
  { id: "rmaster", x: 212, y: 194, s: "r", t: [[228, 156]] },
  { id: "steerhead", x: 264, y: 112, s: "r", t: [[252, 88]] },
  { id: "jiffy", x: 238, y: 195, s: "l", t: [[227, 189]] }
];
