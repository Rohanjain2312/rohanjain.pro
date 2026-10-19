#!/usr/bin/env node
// Phase 7 deploy setup, run by the client with their own gh (issue #284, docs/runbooks/launch.md section 4).
// No Cloudflare token and no secret is involved. It sets two repository variables on the private applications repo
// and adds .github/workflows/deploy.yml there from .github/templates/production-deploy.yml.
//
//   node .github/scripts/launch-deploy-setup.mjs --dry-run     print the calls, change nothing
//   node .github/scripts/launch-deploy-setup.mjs [--tag v0.9.1] apply
//
// Safe to re-run: variables are set to the same value; the workflow file is skipped when identical and the run
// stops, changing nothing, when the file exists and differs. Nothing is ever deleted.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SetupError, ghApiRun, ghCheck } from './launch-setup.mjs';

export const PUBLIC_REPO = 'Rohanjain2312/rohanjain.pro';
export const PRIVATE_REPO = 'Rohanjain2312/rohanjain.pro-applications';
export const DEFAULT_TAG = 'v0.9.1';
export const DEFAULT_PROJECT = 'rohanjain-pro';
export const WORKFLOW_PATH = '.github/workflows/deploy.yml';
const tagPattern = /^v\d+\.\d+\.\d+$/;
const projectPattern = /^[a-z0-9][a-z0-9-]{0,57}$/;

// `gh variable set NAME --body VALUE --repo R` (https://cli.github.com/manual/gh_variable_set). Values are not secret.
export function ghVariableSet(name, value, { repo, spawnSyncFn = spawnSync } = {}) {
  try {
    return (
      spawnSyncFn('gh', ['variable', 'set', name, '--body', value, '--repo', repo], {
        stdio: 'ignore',
      }).status === 0
    );
  } catch {
    return false;
  }
}

export function runDeploySetup({
  template,
  tag = DEFAULT_TAG,
  project = DEFAULT_PROJECT,
  repo = PRIVATE_REPO,
  publicRepo = PUBLIC_REPO,
  dryRun = false,
  log = console.log,
  ghApi = ghApiRun,
  check = ghCheck,
  setVar = ghVariableSet,
}) {
  const file = `repos/${repo}/contents/${WORKFLOW_PATH}`;
  const putBody = JSON.stringify({
    message: 'ci: add the production deploy workflow',
    content: Buffer.from(template).toString('base64'),
  });
  if (dryRun) {
    log('[dry-run] gh --version');
    log(`[dry-run] gh api repos/${publicRepo}/releases/tags/${tag} (the release must exist)`);
    log(`[dry-run] gh api ${file} (read; stop if it exists and differs)`);
    log(`[dry-run] gh variable set SITE_TAG --body ${tag} --repo ${repo}`);
    log(`[dry-run] gh variable set CF_PAGES_PROJECT --body ${project} --repo ${repo}`);
    log(`[dry-run] gh api -X PUT ${file} --input - (only if absent; ${putBody.length} bytes)`);
    return { changed: [] };
  }
  if (!check(['--version'])) {
    throw new SetupError(
      'The gh command is not installed or not on PATH. Install it and run gh auth login.',
    );
  }
  // Read-only checks first, so a stop leaves nothing half done.
  if (ghApi([`repos/${publicRepo}/releases/tags/${tag}`]).status !== 0) {
    throw new SetupError(
      `No published release ${tag} in ${publicRepo}. The Supervisor publishes it first (docs/runbooks/launch.md section 4). Nothing was changed.`,
    );
  }
  const current = ghApi([file]);
  let exists = false;
  if (current.status === 0) {
    exists = true;
    let existing;
    try {
      existing = Buffer.from(
        JSON.parse(current.stdout).content.replace(/\n/g, ''),
        'base64',
      ).toString();
    } catch {
      throw new SetupError(`${WORKFLOW_PATH} exists but could not be read. Nothing was changed.`);
    }
    if (existing !== template) {
      throw new SetupError(
        `${WORKFLOW_PATH} already exists in ${repo} and differs from the template. Nothing was changed. Claude Code reviews the difference.`,
      );
    }
  } else if (!/HTTP 404/.test(current.stderr)) {
    throw new SetupError(
      `${repo} could not be read (gh not signed in, or no access). Nothing was changed.`,
    );
  }

  const changed = [];
  for (const [name, value] of [
    ['SITE_TAG', tag],
    ['CF_PAGES_PROJECT', project],
  ]) {
    if (!setVar(name, value, { repo }))
      throw new SetupError(`Could not set the variable ${name}. Run again.`);
    changed.push(name);
    log(`set variable ${name}`);
  }
  if (exists) {
    log(`skip (identical) ${WORKFLOW_PATH}`);
  } else {
    const put = ghApi(['-X', 'PUT', file, '--input', '-'], { input: putBody });
    if (put.status !== 0) {
      throw new SetupError(
        `Could not add ${WORKFLOW_PATH} (the gh sign-in may need the workflow scope: gh auth refresh -s workflow). The variables are set. Run again.`,
      );
    }
    changed.push(WORKFLOW_PATH);
    log(`added ${WORKFLOW_PATH}`);
  }
  log('Done.');
  return { changed };
}

export function parseArgs(argv) {
  const out = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--tag' || a === '--project') {
      const v = argv[++i];
      const pattern = a === '--tag' ? tagPattern : projectPattern;
      if (v === undefined || !pattern.test(v)) throw new SetupError(`${a} needs a valid value.`);
      out[a.slice(2)] = v;
    } else {
      throw new SetupError('Unexpected argument. Allowed: --dry-run, --tag, --project.');
    }
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const template = readFileSync(
      fileURLToPath(new URL('../templates/production-deploy.yml', import.meta.url)),
      'utf8',
    );
    runDeploySetup({ template, ...args });
  } catch (err) {
    console.error(err instanceof SetupError ? err.message : `Unexpected error (${err.name}).`);
    process.exit(1);
  }
}
