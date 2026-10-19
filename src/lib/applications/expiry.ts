// Expiry rules for application results (docs/spec/06-architecture.md section 5.5).
// Pure date rules only, so pages can import them. File listing is in list-expired.ts.
// `expires` is a UTC calendar date. A result is expired from the start of that day.
import type { ApplicationResult } from './schema.ts';

export const DEFAULT_EXPIRY_DAYS = 90;
export const MAX_EXPIRY_DAYS = 365;

export function utcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDate(d);
}

export function isExpired(result: Pick<ApplicationResult, 'expires'>, now: Date): boolean {
  return utcDate(now) >= result.expires;
}
