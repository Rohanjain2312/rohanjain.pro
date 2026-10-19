---
name: guard-bash-probe-pr237
description: Recipe for probing guard-bash.mjs with synthetic PreToolUse JSON, and the forms that passed on head 83bbb96 (absolute path, attached flags, multi-line REVIEW body)
metadata:
  type: project
---

Probe recipe (worked in the QA worktree, 2026-10-18):
- Write each probe as a JSON file with the Write tool in the scratchpad (`qa237/probe-*.json`): `{"agent_type":"qa-engineer","tool_name":"Bash","tool_input":{"command":"..."},"cwd":"<export dir>"}`. Set `agent_type`, because `roleOf` falls back to supervisor without it, and a supervisor-role probe hides the R-203 and R-111 checks.
- Run `node <export>/.claude/hooks/guard-bash.mjs < probe.json` from the export of the head. No output means allow. A deny prints `permissionDecision: deny`.
- Controls first: `gh auth token` must deny (R-509) and plain `gh pr merge` must deny (R-111). If a control passes, the harness is wrong.

Allowed at head 83bbb96 (the hook is the same on main 5974732 for this path):
- `/opt/homebrew/bin/gh pr merge` (absolute path skips the `verb === 'gh'` branch).
- `gh api ... -flabels[]=approved:supervisor` (attached short flag; the plain `-f` form is denied R-203).
- `gh pr comment` with a multi-line body: a REVIEW line with no Reviewer line is allowed, and so is a `Reviewer: supervisor` block sent by qa-engineer. A single-line body is denied (R-202). The tokenizer or `bodyOf` path for newline bodies was not traced; only the behaviour was.

Why it matters: review-gate (`.github/scripts/pr-process.mjs`, `parseReviews`) takes REVIEW blocks from the owner account and needs the matching approved label. The three allowed forms together reach a merge. See [[escaped-defects]] (PR #237).

**Why:** the security record rated this Low and the ADR it cited says wrappers do not hide tripwires.
**How to apply:** rerun these probes on any change to `.claude/hooks/guard-bash.mjs` or `.github/scripts/pr-process.mjs`, and on any security record that rates guard-bash gaps.
