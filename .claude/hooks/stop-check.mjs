#!/usr/bin/env node
// Stop and SubagentStop. Enforces R-803 (and reminds of R-802): no ending with uncommitted work.
import { readInput, git } from './lib.mjs';

const input = readInput();
if (input.stop_hook_active) process.exit(0);
const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const dirty = git(['status', '--porcelain'], cwd).split('\n').filter(Boolean).filter((l) => !l.includes('.claude/state/'));
if (dirty.length) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: `R-803: ${dirty.length} uncommitted change(s) (${dirty.slice(0, 5).map((l) => l.slice(3)).join(', ')}). Commit to your issue branch and push, or push a draft PR, then update docs/status.md (R-802).`,
  }));
}
process.exit(0);
