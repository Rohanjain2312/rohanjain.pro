#!/usr/bin/env node
// SessionStart (startup, resume, clear, compact). Enforces R-009 and re-injects essentials after compaction. Warns on R-115.
import { join } from 'node:path';
import { readInput, projectDir, currentBranch, git, readIfExists } from './lib.mjs';

const input = readInput();
const dir = projectDir(input);
const src = input.source || 'startup';
const lines = [];

lines.push('You are the Supervisor for rohanjain.pro (CLAUDE.md). R-009: before any other work, invoke the session-protocol skill.');
lines.push('Hard rules are enforced by hooks and CI; a blocked action names its rule ID in docs/rules.md. Fix the cause, never work around a check.');

if (process.env.CLAUDE_CODE_SUBAGENT_MODEL_FORCE) lines.push('WARNING R-115: CLAUDE_CODE_SUBAGENT_MODEL_FORCE is set, so reviewer models are overridden. Unset it and log this in docs/needs-client.md.');

const branch = currentBranch(dir);
const dirty = git(['status', '--porcelain'], dir).split('\n').filter(Boolean);
lines.push(`Git: branch ${branch || 'unknown'}, ${dirty.length} changed file(s) in the main folder.`);

if (src === 'compact') {
  const snap = readIfExists(join(dir, '.claude', 'state', 'last-compact.json'));
  if (snap) lines.push('Snapshot taken just before compaction:\n' + snap.slice(0, 1500));
  lines.push('After compaction: re-read docs/status.md, re-invoke the skill you were following, and remember path rules in .claude/rules/ reload only when you touch matching files.');
}

const status = readIfExists(join(dir, 'docs', 'status.md'));
if (status) lines.push('docs/status.md (first 40 lines):\n' + status.split('\n').slice(0, 40).join('\n'));
else lines.push('docs/status.md does not exist yet: this is Phase 0. Read plan.md.');

const needs = readIfExists(join(dir, 'docs', 'needs-client.md'));
const open = (needs.match(/^- \[ \]/gm) || []).length;
if (open) lines.push(`${open} open item(s) in docs/needs-client.md.`);

process.stdout.write(lines.join('\n\n') + '\n');
