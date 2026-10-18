// Reads status.json at build time. public/status.json is copied from the status-data branch by the
// production workflow (ADR-0027); it is not committed. A missing or unreadable file means no status line.
import { existsSync, readFileSync } from 'node:fs';
import { parseStatus, type Status } from './status.ts';

// The path is a fixed repo path or a test fixture, never user input.
/* eslint-disable security/detect-non-literal-fs-filename */
export function loadStatusFile(path = 'public/status.json'): Status | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return parseStatus(JSON.parse(readFileSync(path, 'utf8')));
  } catch {
    return undefined;
  }
}
/* eslint-enable security/detect-non-literal-fs-filename */
