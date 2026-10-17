---
name: stop-hook-review-pr106
description: PR #106 (Stop hook memory exception) review: lib.mjs git() trims output, which breaks porcelain parsing; probe tracked-file edits, renames, quoting
metadata:
  type: feedback
---

When a hook parses `git status --porcelain`, probe tracked-file edits, not only new untracked files.

**Why:** PR #106 (head 8502ed9, 2026-10-16) tests passed with untracked memory files only. `git()` in `lib.mjs` calls `.trim()`, so the first line ` M path` loses its leading space and `slice(3)` cuts the path's first character. An unstaged edit of an existing `MEMORY.md` (tracked on main for every role) still blocked, so issue #104 criterion 1 failed in the common case. Also: a staged rename out of memory shows as `R  old -> new` and passes `startsWith`; paths with spaces are quoted.

**How to apply:**
- Probe script in the scratchpad: scratch repo with tracked memory files, spawn the hook with synthetic SubagentStop JSON. Cases: unstaged edit, staged edit, delete, new file, edit plus new, rename out, sibling-prefix dir, space in name, symlink, supervisor, missing `agent_type`.
- Preferred fix: `--porcelain=v1 -z --no-renames`, no trim.
- Outcome: head 326f982 fixed it with `-z --no-renames` and added tracked-edit tests; the 12-case probe passed and I approved (second review the same day). A first review that found a real defect and a one-round fix is the expected pattern for hook PRs.
- Rated Low (fail closed) but blocking on the acceptance criterion; no issue opened.

Related: [[hook-review-checklist]], [[escaped-defects]]
