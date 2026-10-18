// Reads content files from disk. The applications directory is optional (ADR-0016).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { EvidenceItem } from '../fitcheck/types.ts';
import { buildEvidence } from './evidence.ts';
import type { RawContent } from './validate.ts';

const SINGLE = [
  'claims',
  'projects',
  'skills',
  'roles',
  'figures',
  'resume',
  'site',
  'evidence',
] as const;

export class ContentParseError extends Error {
  readonly file: string;
  constructor(file: string, detail: string) {
    super(`${file}: invalid JSON: ${detail}`);
    this.file = file;
  }
}

function readJson(path: string, label: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new ContentParseError(label, e instanceof Error ? e.message : String(e));
  }
}

/** Directory holding application results, or undefined when it does not exist. */
export function applicationsDir(
  contentDir: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const configured = env['APPLICATIONS_DIR'];
  const dir = configured ? resolve(configured) : join(contentDir, 'applications');
  return existsSync(dir) ? dir : undefined;
}

export function loadRawContent(
  contentDir: string,
  env: NodeJS.ProcessEnv = process.env,
): RawContent {
  const raw: Record<string, unknown> = {};
  for (const key of SINGLE) {
    const path = join(contentDir, `${key}.json`);
    if (existsSync(path)) raw[key] = readJson(path, `${key}.json`);
  }
  const applications: Record<string, unknown> = {};
  const appDir = applicationsDir(contentDir, env);
  if (appDir) {
    for (const name of readdirSync(appDir)
      .filter((n) => n.endsWith('.json'))
      .sort()) {
      applications[name] = readJson(join(appDir, name), `applications/${name}`);
    }
  }
  return { ...raw, applications };
}

/** Evidence items for `analyze`, built from evidence.json, projects.json and claims.json. */
export function loadEvidence(contentDir: string): EvidenceItem[] {
  const raw = loadRawContent(contentDir, {});
  return buildEvidence(raw.evidence, raw.projects, raw.claims);
}
