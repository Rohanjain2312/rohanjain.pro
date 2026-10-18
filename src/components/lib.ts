// Pure helpers for the page components. No Astro imports, so Vitest can run them.
// Numbers never get typed into markup (R-301): copy files hold templates such as
// "{{loan-v1-tools}}" and these functions fill them from claims.json.

export type ClaimLike = { id: string; value: number | string; display: string };
export type ClaimMap = ReadonlyMap<string, ClaimLike>;

export function claimMap(claims: readonly ClaimLike[]): ClaimMap {
  return new Map(claims.map((c) => [c.id, c]));
}

export function claimOf(claims: ClaimMap, id: string): ClaimLike {
  const c = claims.get(id);
  if (!c) throw new Error(`Unknown claim id "${id}". Add it to src/content/claims.json.`);
  return c;
}

const SLOT = /\{\{([a-z0-9-]+)(\.value)?\}\}/g;

/** "{{id}}" becomes the claim's display text, "{{id.value}}" its raw value. An unknown id throws. */
export function fill(template: string, claims: ClaimMap): string {
  return template.replace(SLOT, (_m, id: string, raw: string | undefined) => {
    const c = claimOf(claims, id);
    return raw ? String(c.value) : c.display;
  });
}

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export type Start = {
  year: number;
  /** 1 to 12, or 0 when the range has no month (a plain year). */
  month: number;
  /** "Nov 2025", or "2021" when there is no month. */
  label: string;
  /** "2025-11", or "2021". */
  iso: string;
};

/**
 * Start of a date range in the content's form: "Oct 2026", "Nov to Dec 2025", "Jan 2021 to Jun 2024".
 * The year comes from the start when it has one, otherwise from the end.
 */
export function startOf(range: string): Start {
  const [left = '', right = ''] = range.split(' to ');
  const year = Number(/\d{4}/.exec(left)?.[0] ?? /\d{4}/.exec(right)?.[0]);
  if (!Number.isInteger(year)) throw new Error(`No year in date range "${range}".`);
  const mon = /^[A-Z][a-z]{2}/.exec(left.trim())?.[0];
  const month = mon ? MONTHS.indexOf(mon as (typeof MONTHS)[number]) + 1 : 0;
  if (mon && month === 0) throw new Error(`Unknown month "${mon}" in date range "${range}".`);
  if (month === 0) return { year, month, label: String(year), iso: String(year) };
  return {
    year,
    month,
    label: `${MONTHS[month - 1]} ${year}`,
    iso: `${year}-${String(month).padStart(2, '0')}`,
  };
}

export function compareStart(a: Start, b: Start): number {
  return a.year - b.year || a.month - b.month;
}

/** "Aug 2024 to May 2026" becomes "2024 to 2026". A single year stays as it is. */
export function yearSpan(range: string): string {
  const years = range.match(/\d{4}/g) ?? [];
  if (years.length === 0) throw new Error(`No year in date range "${range}".`);
  const first = years[0] as string;
  const last = years[years.length - 1] as string;
  return first === last ? first : `${first} to ${last}`;
}

/** "+1 240 495 9682" becomes "(240) 495-9682". Throws on anything that is not a 10-digit US number. */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  const n = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (n.length !== 10) throw new Error(`Cannot format phone "${phone}".`);
  return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
}

export function telHref(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return `tel:+${d.length === 10 ? `1${d}` : d}`;
}

/** Link text for an e-mail address with a break opportunity after the "@" (design spec 5.2). */
export function splitEmail(email: string): [string, string] {
  const at = email.indexOf('@');
  if (at < 1) throw new Error(`Not an e-mail address: "${email}".`);
  return [email.slice(0, at + 1), email.slice(at + 1)];
}

/** Width of a bar as a percent of its axis, rounded to two decimals and clamped to 0..100. */
export function barPercent(value: number, axisMax: number): number {
  if (!(axisMax > 0)) throw new Error('axisMax must be positive.');
  const pct = Math.round((value / axisMax) * 10000) / 100;
  return Math.min(100, Math.max(0, pct));
}

/** Lowercase first letter, for the availability phrase inside the eyebrow ("Available now" to "available now"). */
export function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
