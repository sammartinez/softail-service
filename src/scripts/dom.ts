/* Small DOM helpers shared by the client scripts. */

export const $ = (id: string) => document.getElementById(id);

export const all = <T extends Element = Element>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

export const one = <T extends Element = Element>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);

/** Sets `hidden` from a boolean, the way the vanilla app did everywhere. */
export const show = (el: Element | null, on: boolean) => {
  if (el) (el as HTMLElement).hidden = !on;
};

export const press = (el: Element | null, on: boolean) => {
  el?.setAttribute("aria-pressed", String(on));
};

export const text = (el: Element | null, s: string) => {
  if (el && el.textContent !== s) el.textContent = s;
};

export const reduceMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export const esc = (s: unknown): string =>
  String(s == null ? "" : s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
