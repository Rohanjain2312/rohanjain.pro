/* eslint-disable security/detect-non-literal-fs-filename -- Node-side code reads paths it builds; no browser code imports this. */
// Expiry rules for application results (docs/spec/06-architecture.md section 5.5).
// `expires` is a UTC calendar date. A result is expired from the start of that day.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applicationResultSchema, type ApplicationResult } from './schema.ts';

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

export interface ExpiredReport {
  /** File names (not paths) of valid results whose expiry has passed. */
  expired: string[];
  /** File names that are not valid results. Listed so they are noticed; never touched. */
  invalid: string[];
}

/** Lists expired result files. It never deletes or rewrites anything. */
export function listExpired(dir: string, now: Date): ExpiredReport {
  const report: ExpiredReport = { expired: [], invalid: [] };
  const names = readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort();
  for (const name of names) {
    try {
      const parsed = applicationResultSchema.safeParse(
        JSON.parse(readFileSync(join(dir, name), 'utf8')),
      );
      if (!parsed.success) report.invalid.push(name);
      else if (isExpired(parsed.data, now)) report.expired.push(name);
    } catch {
      report.invalid.push(name);
    }
  }
  return report;
}
