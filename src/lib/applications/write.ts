// Writes one result file. Never overwrites: an existing slug is retried with a new suffix.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ApplicationResult } from './schema.ts';
import { makeSlug } from './slug.ts';

/** Returns the slug written, or undefined after `attempts` collisions. Other errors are thrown. */
export function writeResult(
  dir: string,
  company: string,
  result: ApplicationResult,
  bytes?: (n: number) => Uint8Array,
  attempts = 5,
): string | undefined {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- dir is the directory the client chose.
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < attempts; i++) {
    const slug = makeSlug(company, bytes);
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- the name is dir plus a generated slug.
      writeFileSync(join(dir, `${slug}.json`), `${JSON.stringify(result, null, 2)}\n`, {
        flag: 'wx',
      });
      return slug;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
    }
  }
  return undefined;
}
