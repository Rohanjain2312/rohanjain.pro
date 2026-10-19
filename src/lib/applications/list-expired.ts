// Lists expired result files for `npm run for -- --list-expired`. Node only: it reads the disk.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isExpired } from './expiry.ts';
import { applicationResultSchema } from './schema.ts';

export interface ExpiredReport {
  /** File names (not paths) of valid results whose expiry has passed. */
  expired: string[];
  /** File names that are not valid results. Listed so they are noticed; never touched. */
  invalid: string[];
}

/** Lists expired result files. It never deletes or rewrites anything. */
export function listExpired(dir: string, now: Date): ExpiredReport {
  const report: ExpiredReport = { expired: [], invalid: [] };
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- dir is the directory the client chose.
  const names = readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort();
  for (const name of names) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- name comes from readdirSync of that directory.
      const text = readFileSync(join(dir, name), 'utf8');
      const parsed = applicationResultSchema.safeParse(JSON.parse(text));
      if (!parsed.success) report.invalid.push(name);
      else if (isExpired(parsed.data, now)) report.expired.push(name);
    } catch {
      report.invalid.push(name);
    }
  }
  return report;
}
