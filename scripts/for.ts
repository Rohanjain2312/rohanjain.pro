// Usage: npm run for -- --company "Acme" --role "ML Engineer" --jd ./posting.txt [--expires 90] [--out <dir>]
//        npm run for -- --list-expired [--out <dir>]
// Runs the fit-check engine on a job description and writes only the result to
// <APPLICATIONS_DIR>/<slug>.json (ADR-0016). The job description is read, analyzed and discarded:
// it is never written, logged or echoed in an error (R-501, R-502).
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { buildResult } from '../src/lib/applications/build.ts';
import { resolveApplicationsDir } from '../src/lib/applications/dir.ts';
import { DEFAULT_EXPIRY_DAYS, MAX_EXPIRY_DAYS } from '../src/lib/applications/expiry.ts';
import { listExpired } from '../src/lib/applications/list-expired.ts';
import { writeResult } from '../src/lib/applications/write.ts';
import { loadEvidence, loadRawContent } from '../src/lib/content/load.ts';
import { skillsSchema } from '../src/lib/content/schemas.ts';
import { analyze, extras } from '../src/lib/fitcheck/index.ts';

const MAX_JD_BYTES = 2_000_000;
// \p{C}: control, format (zero-width, bidi), private-use and unassigned characters. Plus line and paragraph separators.
const CONTROL = /[\p{C}\u2028\u2029]/u;
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fail(message: string): never {
  console.error(`for: ${message}`);
  process.exit(1);
}

function main(): void {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        company: { type: 'string' },
        role: { type: 'string' },
        jd: { type: 'string' },
        expires: { type: 'string' },
        out: { type: 'string' },
        'list-expired': { type: 'boolean' },
      },
      strict: true,
      allowPositionals: false,
    }));
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'bad arguments');
  }

  let dir: string;
  try {
    dir = resolveApplicationsDir({ out: values.out, env: process.env, repoRoot });
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'bad output directory');
  }

  if (values['list-expired']) {
    try {
      const { expired, invalid } = listExpired(dir, new Date());
      for (const n of expired) console.log(`expired ${n}`);
      for (const n of invalid) console.log(`invalid ${n}`);
      console.log(`${expired.length} expired, ${invalid.length} invalid. Nothing was deleted.`);
    } catch {
      fail('could not read the applications directory.');
    }
    return;
  }

  const company = values.company?.trim();
  const role = values.role?.trim();
  if (!company || !role || !values.jd) {
    return fail('--company, --role and --jd are required.');
  }
  if (CONTROL.test(company) || CONTROL.test(role)) {
    return fail('--company and --role must not contain control characters.');
  }
  let days = DEFAULT_EXPIRY_DAYS;
  if (values.expires !== undefined) {
    days = Number(values.expires);
    if (!/^\d+$/.test(values.expires) || days < 1 || days > MAX_EXPIRY_DAYS) {
      return fail(`--expires must be a whole number of days from 1 to ${MAX_EXPIRY_DAYS}.`);
    }
  }

  let text: string;
  try {
    const path = resolve(values.jd);
    const st = statSync(path);
    if (!st.isFile()) return fail('the job description must be a regular file.');
    if (st.size > MAX_JD_BYTES) return fail('the job description file is too large.');
    text = readFileSync(path, 'utf8');
  } catch {
    return fail('could not read the job description file.');
  }
  if (text.trim() === '') return fail('the job description file is empty.');

  let result;
  try {
    const contentDir = join(repoRoot, 'src', 'content');
    const raw = loadRawContent(contentDir, {});
    const skills = skillsSchema.parse(raw.skills);
    result = buildResult(
      analyze(text, skills, extras, loadEvidence(contentDir)),
      { company, role, expiresInDays: days },
      new Date(),
    );
  } catch (e) {
    // Never print the error object's input. Zod issues carry paths and messages only.
    const where = e instanceof Error ? e.name : 'error';
    return fail(
      `could not build the result (${where}). Check --company and --role length (200 max).`,
    );
  }
  text = '';

  let slug: string | undefined;
  try {
    slug = writeResult(dir, company, result);
  } catch {
    return fail('could not write the result file.');
  }
  if (!slug) return fail('could not write the result file.');
  console.log(`${slug}  ${result.verdict.label}  expires ${result.expires}`);
  console.log(`page: /for/${slug}`);
}

main();
