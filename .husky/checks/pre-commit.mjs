#!/usr/bin/env node
// Pre-commit checks that lint-staged does not do: job-description block (R-501) and gitleaks on staged changes.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export function blockedPaths(paths) {
  return paths.filter((p) => /(^|\/)postings\//.test(p) || /\.jd\.txt$/.test(p));
}

const staged = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], {
  encoding: 'utf8',
})
  .stdout.split('\0')
  .filter(Boolean);

const bad = blockedPaths(staged);
if (bad.length) {
  console.error(
    `R-501: job description files must never be committed:\n  ${bad.join('\n  ')}\nUnstage them with "git restore --staged <path>".`,
  );
  process.exit(1);
}

const probe = spawnSync('gitleaks', ['version'], { encoding: 'utf8' });
if (probe.error) {
  console.warn(
    'notice: gitleaks is not on PATH, so the local secret scan was skipped. CI still runs it (R-508).',
  );
} else {
  const args = ['git', '--staged', '--redact', '--no-banner'];
  if (existsSync('.gitleaks.toml')) args.push('--config', '.gitleaks.toml');
  const r = spawnSync('gitleaks', args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(
      'R-508: gitleaks found a possible secret in the staged changes. Remove it and stage again.',
    );
    process.exit(1);
  }
}
