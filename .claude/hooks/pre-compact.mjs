#!/usr/bin/env node
// PreCompact (manual, auto): saves a working-state snapshot that session-start.mjs re-injects after compaction.
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { readInput, projectDir, currentBranch, headSha, git } from './lib.mjs';

const input = readInput();
const dir = projectDir(input);
const snap = {
  savedAt: new Date().toISOString(),
  trigger: input.trigger || input.matcher || 'unknown',
  branch: currentBranch(dir),
  head: headSha(dir).slice(0, 12),
  changedFiles: git(['status', '--porcelain'], dir).split('\n').filter(Boolean).slice(0, 30),
  worktrees: git(['worktree', 'list', '--porcelain'], dir).split('\n').filter((l) => l.startsWith('branch ')).map((l) => l.slice(7)).slice(0, 20),
};
try {
  mkdirSync(join(dir, '.claude', 'state'), { recursive: true });
  writeFileSync(join(dir, '.claude', 'state', 'last-compact.json'), JSON.stringify(snap, null, 2));
} catch { /* never block compaction */ }
process.exit(0);
