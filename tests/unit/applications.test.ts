import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applicationResultSchema,
  buildResult,
  isExpired,
  kebab,
  listExpired,
  makeSlug,
  randomSuffix,
  SLUG_PATTERN,
} from '../../src/lib/applications/index.ts';
import { addDays } from '../../src/lib/applications/expiry.ts';
import { resolveApplicationsDir } from '../../src/lib/applications/dir.ts';
import { sampleStrong } from '../../src/lib/fitcheck/samples.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const tmps: string[] = [];
const tmp = (): string => {
  const d = mkdtempSync(join(tmpdir(), 'for-test-'));
  tmps.push(d);
  return d;
};
afterEach(() => {
  while (tmps.length) rmSync(tmps.pop()!, { recursive: true, force: true });
});

function valid(): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(
      buildResult(
        sampleStrong,
        { company: 'FakeCo', role: 'Fake Engineer', expiresInDays: 90 },
        new Date('2000-01-01T12:00:00Z'),
      ),
    ),
  );
}

describe('slug', () => {
  it('has the form <company-kebab>-<6 base32 chars>', () => {
    const slug = makeSlug('Acme Corp, Inc.');
    expect(slug).toMatch(/^acme-corp-inc-[a-z2-7]{6}$/);
    expect(slug).toMatch(SLUG_PATTERN);
  });
  it('is unique across many draws', () => {
    const seen = new Set(Array.from({ length: 2000 }, () => makeSlug('Acme')));
    expect(seen.size).toBe(2000);
  });
  it('maps bytes to the base32 alphabet without bias', () => {
    expect(randomSuffix(() => Uint8Array.from([0, 1, 25, 26, 31, 32]))).toBe('abz27a');
    expect(randomSuffix(() => Uint8Array.from([255, 255, 255, 255, 255, 255]))).toBe('777777');
  });
  it.each([
    ['Acme', 'acme'],
    ['  --Acme  &  Sons--  ', 'acme-sons'],
    ['Café Zürich', 'cafe-zurich'],
    ['日本語', 'application'],
    ['', 'application'],
    ['   ', 'application'],
    ['!!!', 'application'],
    ['ＡＣＭＥ', 'acme'],
    ['A'.repeat(500), 'a'.repeat(40)],
  ])('kebab(%j) is %j', (input, expected) => {
    expect(kebab(input)).toBe(expected);
  });
  it('cuts long names without a trailing dash and still matches the pattern', () => {
    const slug = makeSlug(`${'word '.repeat(40)}`);
    expect(slug).toMatch(SLUG_PATTERN);
    expect(slug.length).toBeLessThanOrEqual(40 + 7);
    expect(makeSlug('x'.repeat(10) + ' ' + 'y'.repeat(29) + ' tail')).toMatch(SLUG_PATTERN);
  });
  it('always matches the pattern for odd input', () => {
    for (const name of ['', '-', '😀', 'a/b\\c', '../..', 'Ünï-cødé', '\u0000']) {
      expect(makeSlug(name)).toMatch(SLUG_PATTERN);
    }
  });
});

describe('result schema (R-502)', () => {
  it('accepts a built result', () => {
    expect(applicationResultSchema.safeParse(valid()).success).toBe(true);
  });
  it('rejects an extra field at the root, in verdict, counts and rows', () => {
    const base = valid() as any;
    expect(applicationResultSchema.safeParse({ ...base, jd: 'text' }).success).toBe(false);
    expect(
      applicationResultSchema.safeParse({ ...base, verdict: { ...base.verdict, why: 'x' } })
        .success,
    ).toBe(false);
    expect(
      applicationResultSchema.safeParse({ ...base, counts: { ...base.counts, raw: 1 } }).success,
    ).toBe(false);
    const rows = [{ ...base.evidenceRows[0], excerpt: 'text' }];
    expect(applicationResultSchema.safeParse({ ...base, evidenceRows: rows }).success).toBe(false);
  });
  it('rejects long strings, bad dates, bad verdicts and expiry before creation', () => {
    const base = valid() as any;
    expect(applicationResultSchema.safeParse({ ...base, role: 'x'.repeat(201) }).success).toBe(
      false,
    );
    expect(applicationResultSchema.safeParse({ ...base, gaps: ['x'.repeat(201)] }).success).toBe(
      false,
    );
    expect(applicationResultSchema.safeParse({ ...base, created: '2000-13-40' }).success).toBe(
      false,
    );
    expect(applicationResultSchema.safeParse({ ...base, expires: base.created }).success).toBe(
      false,
    );
    expect(
      applicationResultSchema.safeParse({ ...base, verdict: { label: 'Great', key: 'strong' } })
        .success,
    ).toBe(false);
  });
  it('copies only curated Report fields', () => {
    const r = valid() as any;
    expect(Object.keys(r).sort()).toEqual(
      ['company', 'counts', 'created', 'evidenceRows', 'expires', 'gaps', 'role', 'verdict'].sort(),
    );
    expect(r.counts).toEqual({ proven: sampleStrong.provenCount, gaps: sampleStrong.gapCount });
    expect(r.gaps).toEqual(sampleStrong.gaps);
  });
});

describe('expiry', () => {
  it('defaults to 90 days and honours a custom span', () => {
    expect(valid()['expires']).toBe('2000-03-31');
    const r = buildResult(
      sampleStrong,
      { company: 'A', role: 'B', expiresInDays: 7 },
      new Date('2000-01-01T00:00:00Z'),
    );
    expect(r.expires).toBe('2000-01-08');
    expect(addDays('2000-02-28', 2)).toBe('2000-03-01');
  });
  it('is expired from the start of the expiry day (UTC)', () => {
    const r = { expires: '2000-03-31' };
    expect(isExpired(r, new Date('2000-03-30T23:59:59Z'))).toBe(false);
    expect(isExpired(r, new Date('2000-03-31T00:00:00Z'))).toBe(true);
    expect(isExpired(r, new Date('2001-01-01T00:00:00Z'))).toBe(true);
  });
  it('lists expired and invalid files without deleting any', () => {
    const dir = tmp();
    const old = valid();
    const fresh = { ...valid(), created: '2999-01-01', expires: '2999-04-01' };
    writeFileSync(join(dir, 'old-aaaaaa.json'), JSON.stringify(old));
    writeFileSync(join(dir, 'fresh-bbbbbb.json'), JSON.stringify(fresh));
    writeFileSync(join(dir, 'bad-cccccc.json'), '{"jd":"x"}');
    writeFileSync(join(dir, 'broken-dddddd.json'), '{');
    writeFileSync(join(dir, 'notes.txt'), 'x');
    const report = listExpired(dir, new Date('2026-10-18T00:00:00Z'));
    expect(report).toEqual({
      expired: ['old-aaaaaa.json'],
      invalid: ['bad-cccccc.json', 'broken-dddddd.json'],
    });
    expect(readdirSync(dir)).toHaveLength(5);
  });
});

describe('output directory (ADR-0016)', () => {
  it('prefers --out, then APPLICATIONS_DIR', () => {
    const a = tmp();
    const b = tmp();
    expect(resolveApplicationsDir({ out: a, env: { APPLICATIONS_DIR: b }, repoRoot })).toContain(
      a.split('/').pop()!,
    );
    expect(resolveApplicationsDir({ env: { APPLICATIONS_DIR: b }, repoRoot })).toContain(
      b.split('/').pop()!,
    );
  });
  it('refuses the repo, its subdirectories, its parents and symlinks into it', () => {
    const link = join(tmp(), 'link');
    symlinkSync(join(repoRoot, 'src'), link);
    for (const bad of [
      repoRoot,
      join(repoRoot, 'src', 'content', 'applications'),
      join(repoRoot, 'new-dir-that-does-not-exist'),
      resolve(repoRoot, '..'),
      join(link, 'content'),
    ]) {
      expect(() => resolveApplicationsDir({ out: bad, env: {}, repoRoot })).toThrow(/repo tree/);
    }
  });
});

// A synthetic posting: a requirement list from tests/fixtures/golden (read only) plus a canary
// sentence. The file lives in a temp directory and is never committed.
const CANARY = 'Zebra-canary-7731 unique sentence about our fictional benefits plan';
function syntheticText(): string {
  const golden = JSON.parse(
    readFileSync(join(repoRoot, 'tests/fixtures/golden/ai-01.json'), 'utf8'),
  );
  return [...golden.requirements, CANARY].join('\n');
}

function snapshot(): string {
  const out: string[] = [];
  const skip = new Set([
    'node_modules',
    '.git',
    '.astro',
    'dist',
    'coverage',
    '.stryker-tmp',
    'reports',
    'test-results',
    'playwright-report',
    '.claude',
    '.shots',
  ]);
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      if (skip.has(name)) continue;
      const p = join(dir, name);
      const st = statSync(p);
      out.push(`${p}:${st.isDirectory() ? 'd' : st.size + ':' + st.mtimeMs}`);
      if (st.isDirectory()) walk(p);
    }
  };
  walk(repoRoot);
  return out.join('\n');
}

function runFor(args: string[], env: Record<string, string>) {
  return spawnSync(process.execPath, ['scripts/for.ts', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, APPLICATIONS_DIR: '', ...env },
  });
}

describe('npm run for (end to end)', () => {
  it('writes one result to APPLICATIONS_DIR and nothing under the repo tree', () => {
    const work = tmp();
    const jd = join(work, 'posting.txt');
    writeFileSync(jd, syntheticText());
    const dir = join(work, 'apps');
    const before = snapshot();
    const r = runFor(['--company', 'Fake Co', '--role', 'AI Engineer', '--jd', jd], {
      APPLICATIONS_DIR: dir,
    });
    expect(r.status, r.stderr).toBe(0);
    expect(snapshot()).toBe(before);

    const files = readdirSync(dir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^fake-co-[a-z2-7]{6}\.json$/);
    const raw = readFileSync(join(dir, files[0]!), 'utf8');
    const result = applicationResultSchema.parse(JSON.parse(raw));
    expect(result.company).toBe('Fake Co');
    expect(result.role).toBe('AI Engineer');
    expect(result.expires).toBe(addDays(result.created, 90));
    expect(result.counts.proven).toBeGreaterThan(0);
    expect(r.stdout).toContain(files[0]!.replace('.json', ''));
  });

  it('keeps the job description out of the file, stdout and stderr (R-501, R-502)', () => {
    const work = tmp();
    const jd = join(work, 'posting.txt');
    const text = syntheticText();
    writeFileSync(jd, text);
    const dir = join(work, 'apps');
    const ok = runFor(
      ['--company', 'Fake Co', '--role', 'AI Engineer', '--jd', jd, '--expires', '30'],
      {
        APPLICATIONS_DIR: dir,
      },
    );
    const bad = runFor(['--company', 'x'.repeat(300), '--role', 'AI Engineer', '--jd', jd], {
      APPLICATIONS_DIR: dir,
    });
    expect(bad.status).toBe(1);
    expect(readdirSync(dir)).toHaveLength(1);
    const file = readFileSync(join(dir, readdirSync(dir)[0]!), 'utf8');
    const haystacks = [file, ok.stdout, ok.stderr, bad.stdout, bad.stderr];
    for (const line of text.split('\n')) {
      for (const h of haystacks) expect(h).not.toContain(line);
    }
    for (const h of haystacks) expect(h).not.toContain('Zebra-canary');
  });

  it('refuses an output directory inside the repo and writes nothing', () => {
    const work = tmp();
    const jd = join(work, 'posting.txt');
    writeFileSync(jd, syntheticText());
    const before = snapshot();
    const r = runFor(
      [
        '--company',
        'Fake Co',
        '--role',
        'AI Engineer',
        '--jd',
        jd,
        '--out',
        join(repoRoot, 'src', 'content', 'applications'),
      ],
      {},
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/repo tree/);
    expect(snapshot()).toBe(before);
  });

  it('rejects missing arguments, a bad --expires and an empty file', () => {
    const work = tmp();
    const jd = join(work, 'posting.txt');
    const empty = join(work, 'empty.txt');
    writeFileSync(jd, syntheticText());
    writeFileSync(empty, '  \n');
    const env = { APPLICATIONS_DIR: join(work, 'apps') };
    expect(runFor(['--company', 'A'], env).status).toBe(1);
    expect(
      runFor(['--company', 'A', '--role', 'B', '--jd', jd, '--expires', '0'], env).status,
    ).toBe(1);
    expect(
      runFor(['--company', 'A', '--role', 'B', '--jd', jd, '--expires', 'x'], env).status,
    ).toBe(1);
    expect(runFor(['--company', 'A', '--role', 'B', '--jd', empty], env).status).toBe(1);
    expect(
      runFor(['--company', 'A', '--role', 'B', '--jd', join(work, 'missing.txt')], env).status,
    ).toBe(1);
    expect(runFor(['--bogus'], env).status).toBe(1);
  });

  it('lists expired files without deleting them', () => {
    const dir = tmp();
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'old-aaaaaa.json'), JSON.stringify(valid()));
    const r = runFor(['--list-expired'], { APPLICATIONS_DIR: dir });
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('expired old-aaaaaa.json');
    expect(readdirSync(dir)).toEqual(['old-aaaaaa.json']);
  });
});
