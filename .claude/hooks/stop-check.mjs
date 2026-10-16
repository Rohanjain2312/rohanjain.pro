#!/usr/bin/env node
// Stop and SubagentStop. Enforces R-803 (and reminds of R-802): no ending with uncommitted work.
// A subagent may end with changes only under its own .claude/agent-memory/<role>/; the Supervisor collects them (#104).
import { readInput, roleOf, git } from './lib.mjs';

const input = readInput();
if (input.stop_hook_active) process.exit(0);
const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const role = roleOf(input);
const sub = role !== 'supervisor';
const paths = git(['status', '--porcelain', '--untracked-files=all'], cwd).split('\n').filter(Boolean).map((l) => l.slice(3)).filter((p) => !p.includes('.claude/state/'));
const ownMemory = `.claude/agent-memory/${role}/`;
const dirty = sub ? paths.filter((p) => !p.startsWith(ownMemory)) : paths;
if (dirty.length) {
  const next = sub
    ? 'Commit to your issue branch and push, or push a draft PR, then report to the Supervisor (it updates docs/status.md). Memory notes in your own agent-memory folder may stay uncommitted; the Supervisor collects them.'
    : 'Commit to your issue branch and push, or push a draft PR, then update docs/status.md (R-802).';
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: `R-803: ${dirty.length} uncommitted change(s) (${dirty.slice(0, 5).join(', ')}). ${next}`,
  }));
}
process.exit(0);
