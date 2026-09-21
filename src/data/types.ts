/* Shapes for the two data files. The data itself is unchanged from the vanilla
   build — these types describe what was already there.

   Ids are plain string aliases rather than branded types on purpose. They
   document which id space a field points into, and schema.ts does the real
   cross-reference checking at build time. Branding them would mean casting
   every one of the 200-odd literals in the data files for no extra safety. */

/* Beware: part ids and tool ids are SEPARATE namespaces that happen to
   overlap — `antiseize`, `dgrease` and `wgrease` exist in both. Never
   collapse PartId and ToolId into one type. */
export type JobId = string;
export type SpotId = string;
export type ToolId = string;
export type PartId = string;
export type PartCat = string;

export type IntervalKey = "ride" | "i500" | "m2500" | "m5000" | "m10k" | "m20k";
export type JobGroup = "Fluids" | "Checks" | "Tune-up" | "Adjust" | "Lube" | "Season";

/* Which fuel system a thing applies to. Absent on a job, or "" in a DTC row,
   means "both" — the app treats a missing value as no restriction. */
export type Fuel = "carb" | "efi";

export type StoreName = "AutoZone" | "O'Reilly" | "NAPA" | "Dealer" | "Online";

export interface Bike {
  year: number;
  code: string;
  name: string;
  engine: string;
  note: string;
}

export interface Interval {
  k: IntervalKey;
  label: string;
  short: string;
  /** 0 means "every ride". */
  miles: number;
  /** Break-in service, done once. Data-only today; nothing reads it. */
  once?: boolean;
}

/** The manual's Table 1, transcribed. The Due screen is computed from JOBS,
    not from here — this is the record of what the manual actually asks for. */
export interface ScheduleItem {
  id: string;
  label: string;
  at: IntervalKey[];
  /** Required but nullable: 6 items have no job written yet. */
  job: JobId | null;
  carbOnly?: boolean;
}

/** A numbered location on the bike diagram. */
export interface Spot {
  id: SpotId;
  /** Diagram number, a dense 1..n sequence. */
  n: number;
  name: string;
  where: string;
}

export interface Step {
  /** Title. */
  t: string;
  /** Body. */
  b: string;
  /** Spec chips. Display strings, not a cross-reference to TORQUES. */
  c?: string[];
  /** Warning. */
  w?: string;
  /** Tool ids. */
  tl?: ToolId[];
  /** Diagram location. */
  loc?: SpotId;
  /** [seconds, label] for a countdown timer. */
  tm?: [number, string];
}

export interface Job {
  id: JobId;
  title: string;
  group: JobGroup;
  /** Interval keys. Empty means "as needed". */
  at: IntervalKey[];
  mins: number;
  cap?: string;
  page: string;
  lede: string;
  /** Needs a warm-up ride first. */
  warm?: boolean;
  /** Must be held straight up, not on the jiffy stand. */
  upright?: boolean;
  /** Limits the job to one fuel system; absent means both. */
  fuel?: Fuel;
  steps: Step[];
}

export interface SpecGroup {
  group: string;
  /** The manual table this came from. */
  src: string;
  rows: [string, string][];
  notes?: string[];
}

export interface Torque {
  grp: "Fluids" | "Primary" | "Tune-up" | "Chassis";
  item: string;
  /** Imperial. */
  v: string;
  /** Metric. Required, but empty on the oil filter (hand tight). */
  nm: string;
  jobs: JobId[];
  note?: string;
}

export interface Trouble {
  q: string;
  causes: string[];
  warn?: string;
}

/** [code, description, fuel] where "" means it applies to both systems. */
export type DtcRow = [string, string, "" | Fuel];

export interface DtcHowto {
  carb: string[];
  efi: string[];
  note: string;
}

export interface Where {
  s: StoreName;
  /** Display label. Keep it short — long ones broke the two-column grid. */
  t: string;
  u?: string;
}

export interface PartItem {
  id: PartId;
  name: string;
  pn: string;
  tag?: string;
  note: string;
  where: Where[];
}

export interface PartGroup {
  cat: PartCat;
  /** Pick-one category: choosing one disables the others. */
  pick?: boolean;
  jobs: JobId[];
  items: PartItem[];
}

export interface Tool {
  id: ToolId;
  name: string;
  use: string;
  tag?: string;
}

export interface ToolGroup {
  cat: string;
  items: Tool[];
}

/** [quantity, unit, display suffix] */
export type Qty = [number, string, string];
