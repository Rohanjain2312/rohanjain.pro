---
name: escaped-hook-path-traversal
description: Escaped defect from PR #2 review; guard-write R-112 bypass via '..' in absolute worktree paths, found at PR #35 (issue #51). Probe path normalization on every owners.json or hook review.
metadata:
  type: feedback
---

When a PR changes `owners.json`, `lib.mjs` or any guard hook, probe R-112 with `..` in absolute worktree paths, not only with plain paths.

**Why:** The PR #2 review probed guard-bash but missed that `repoRel()` returns the worktree regex capture unnormalized. `<wt>/docs/security/../../.claude/hooks/owners.json` passed R-112 for any role. Found 2026-10-15 at PR #35, issue #51 (Low: hooks load from the main checkout, so PR review is the backstop).

**How to apply:**
- Write probes as a node script in the scratchpad that spawns the hook with synthetic PreToolUse JSON (`agent_type`, `cwd`, `tool_input.file_path`). Inline shell loops trip the worktree guard.
- Cases: own path, another role's path, `own/../../.claude/hooks/x`, a sibling-prefix dir (`role-x/`), relative vs absolute, worktree cwd vs main cwd.
- Also check guard-read for each new owned path. The Reader Advocate's R-210 allowlist did not include its own memory folder.

Related: [[review-checklist-repo-settings]]
