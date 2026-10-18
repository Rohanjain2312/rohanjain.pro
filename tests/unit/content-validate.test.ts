import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applicationsDir, ContentParseError, loadRawContent } from '../../src/lib/content/load.ts';
import { validateContent, type RawContent } from '../../src/lib/content/validate.ts';
import { validApplication, validContent } from './content-fixtures.ts';

const clone = (): any => structuredClone(validContent());

describe('validateContent', () => {
  it('passes valid data and empty input', () => {
    expect(validateContent(validContent())).toEqual([]);
    expect(validateContent({})).toEqual([]);
  });

  it('accepts the Goldman Sachs and IEEE evidence IDs', () => {
    const d = clone();
    d.skills[0].evidence = ['goldman', 'ieee'];
    d.evidence = ['goldman', 'ieee'].map((id) => ({
      id,
      name: id,
      proofClaimIds: ['fake-claim-a'],
    }));
    expect(validateContent(d)).toEqual([]);
  });

  const defects: [string, (d: any) => void, string, string][] = [
    ['schema error', (d) => (d.claims[0].verifiedOn = 'bad'), 'claims.json', '0.verifiedOn'],
    ['duplicate claim id', (d) => d.claims.push(d.claims[0]), 'claims.json', '2.id'],
    ['duplicate project id', (d) => d.projects.push(d.projects[0]), 'projects.json', '1.id'],
    ['duplicate skill', (d) => d.skills.push(d.skills[0]), 'skills.json', '1.name'],
    ['duplicate figure', (d) => d.figures.push(d.figures[0]), 'figures.json', '2.id'],
    [
      'project headline claim',
      (d) => (d.projects[0].headlineClaimId = 'nope'),
      'projects.json',
      '0.headlineClaimId',
    ],
    [
      'project context claim',
      (d) => (d.projects[0].contextClaimIds = ['nope']),
      'projects.json',
      '0.contextClaimIds.0',
    ],
    ['figure project', (d) => (d.figures[0].projectId = 'nope'), 'figures.json', '0.projectId'],
    ['figure claim', (d) => (d.figures[0].claimIds = ['nope']), 'figures.json', '0.claimIds.0'],
    ['skill evidence', (d) => (d.skills[0].evidence = ['nope']), 'skills.json', '0.evidence.0'],
    [
      'resume experience claim',
      (d) => (d.resume.experience[0].bullets[0].claimIds = ['nope']),
      'resume.json',
      'experience.0.bullets.0.claimIds.0',
    ],
    [
      'resume project id',
      (d) => (d.resume.projects[0].projectId = 'nope'),
      'resume.json',
      'projects.0.projectId',
    ],
    [
      'resume project claim',
      (d) => (d.resume.projects[0].bullets[0].claimIds = ['nope']),
      'resume.json',
      'projects.0.bullets.0.claimIds.0',
    ],
    [
      'application file name',
      (d) => {
        d.applications['fakeco.json'] = d.applications['fakeco-abc234.json'];
        delete d.applications['fakeco-abc234.json'];
      },
      'applications/fakeco.json',
      '(file name)',
    ],
    [
      'application dates',
      (d) => (d.applications['fakeco-abc234.json'].expires = '1999-01-01'),
      'applications/fakeco-abc234.json',
      'expires',
    ],
    [
      'application extra field',
      (d) => (d.applications['fakeco-abc234.json'].jd = 'text'),
      'applications/fakeco-abc234.json',
      '(root)',
    ],
  ];
  it.each(defects)('reports %s', (_n, mutate, file, field) => {
    const d = clone();
    mutate(d);
    const problems = validateContent(d as RawContent);
    expect(problems.some((p) => p.file === file && p.field === field)).toBe(true);
  });

  it('skips reference checks for files that are absent', () => {
    const d = clone();
    delete d.claims;
    d.projects[0].headlineClaimId = 'anything';
    expect(validateContent(d)).toEqual([]);
  });
});

describe('loading and CLI', () => {
  const dirs: string[] = [];
  const temp = () => {
    const d = mkdtempSync(join(tmpdir(), 'content-'));
    dirs.push(d);
    return d;
  };
  afterEach(() => {
    while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
  });
  const write = (dir: string, d: any) => {
    for (const k of [
      'claims',
      'projects',
      'skills',
      'roles',
      'figures',
      'resume',
      'site',
      'evidence',
    ]) {
      writeFileSync(join(dir, `${k}.json`), JSON.stringify(d[k]));
    }
  };
  const cli = (...args: string[]) =>
    spawnSync('node', ['scripts/validate-content.ts', ...args], {
      encoding: 'utf8',
      env: { ...process.env, APPLICATIONS_DIR: '' },
    });

  it('applications collection is empty when the directory does not exist', () => {
    const dir = temp();
    expect(applicationsDir(dir, {})).toBeUndefined();
    expect(loadRawContent(dir, {}).applications).toEqual({});
    expect(applicationsDir(dir, { APPLICATIONS_DIR: join(dir, 'missing') })).toBeUndefined();
  });

  it('loads applications from APPLICATIONS_DIR', () => {
    const dir = temp();
    const apps = temp();
    writeFileSync(join(apps, 'fakeco-abc234.json'), JSON.stringify(validApplication()));
    writeFileSync(join(apps, 'ignored.txt'), 'x');
    const raw = loadRawContent(dir, { APPLICATIONS_DIR: apps });
    expect(Object.keys(raw.applications!)).toEqual(['fakeco-abc234.json']);
  });

  it('throws a named error on invalid JSON', () => {
    const dir = temp();
    writeFileSync(join(dir, 'claims.json'), '{');
    expect(() => loadRawContent(dir, {})).toThrow(ContentParseError);
  });

  it('CLI passes valid data', () => {
    const dir = temp();
    write(dir, validContent());
    mkdirSync(join(dir, 'applications'));
    const r = cli('--dir', dir, '--strict');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('OK');
  });

  it('CLI names file and field for a defect', () => {
    const dir = temp();
    const d = clone();
    d.figures[0].projectId = 'nope';
    write(dir, d);
    const r = cli('--dir', dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('figures.json: 0.projectId');
  });

  it('CLI fails on invalid JSON and on missing files with --strict', () => {
    const dir = temp();
    writeFileSync(join(dir, 'site.json'), 'nope');
    const bad = cli('--dir', dir);
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain('site.json');
    const missing = cli('--dir', temp(), '--strict');
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('claims.json: (file): file is missing');
    expect(cli('--dir', temp()).status).toBe(0);
  });
});
