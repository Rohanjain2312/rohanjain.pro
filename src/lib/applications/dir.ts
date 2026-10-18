/* eslint-disable security/detect-non-literal-fs-filename -- Node-side code reads paths it builds; no browser code imports this. */
// Where result files go (ADR-0016). The directory must be outside this repo's work tree.
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, isAbsolute, sep } from 'node:path';

export class ApplicationsDirError extends Error {}

/** realpath of the deepest existing ancestor, with the missing tail appended. Resolves symlinks. */
function realish(p: string): string {
  let cur = resolve(p);
  const tail: string[] = [];
  while (!existsSync(cur)) {
    tail.unshift(basename(cur));
    const up = dirname(cur);
    if (up === cur) break;
    cur = up;
  }
  return join(realpathSync.native(cur), ...tail);
}

function git(args: string[], cwd: string): string | undefined {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

/** Roots to refuse: this checkout and the main checkout (agent worktrees live inside it). */
export function repoRoots(repoRoot: string): string[] {
  const roots = [realish(repoRoot)];
  const common = git(['rev-parse', '--path-format=absolute', '--git-common-dir'], repoRoot);
  if (common) roots.push(realish(dirname(common)));
  return roots;
}

const FOLD_CASE = process.platform === 'darwin' || process.platform === 'win32';
const fold = (p: string): string => (FOLD_CASE ? p.toLowerCase() : p);

/** True when child is parent or below it. Case-insensitive on macOS and Windows. */
export function isInside(child: string, parent: string): boolean {
  const rel = relative(fold(parent), fold(child));
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
}

/** The default from ADR-0016: `rohanjain.pro-applications/applications` next to the main checkout. */
export function defaultApplicationsDir(repoRoot: string): string | undefined {
  const common = git(['rev-parse', '--path-format=absolute', '--git-common-dir'], repoRoot);
  if (!common) return undefined;
  return join(dirname(dirname(common)), 'rohanjain.pro-applications', 'applications');
}

/** Picks --out, then APPLICATIONS_DIR, then the default. Throws if it is inside the repo tree. */
export function resolveApplicationsDir(opts: {
  out?: string | undefined;
  env: NodeJS.ProcessEnv;
  repoRoot: string;
}): string {
  const chosen = opts.out || opts.env['APPLICATIONS_DIR'] || defaultApplicationsDir(opts.repoRoot);
  if (!chosen) {
    throw new ApplicationsDirError(
      'No output directory. Set APPLICATIONS_DIR or pass --out <dir>.',
    );
  }
  const dir = realish(chosen);
  for (const root of repoRoots(opts.repoRoot)) {
    if (isInside(dir, root) || isInside(root, dir)) {
      throw new ApplicationsDirError(
        'Refusing to write inside the repo tree (ADR-0016). Point APPLICATIONS_DIR or --out at a private directory outside it.',
      );
    }
  }
  return dir;
}
