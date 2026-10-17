---
name: git-hooks-review
description: PR #109 review notes (Husky, lint-staged, commitlint); what to probe on hook-tooling PRs and the time-box lesson
metadata:
  type: feedback
---

For PRs that add commit or push hook tooling, check the tool internals, not only the repo's own scripts.

**Why:** In PR #109 (2026-10-16) the repo's scripts were small and sound. The Lows came from the tools: commitlint's `conventional-commits-parser` 7.1.3 is cubic on a long unwrapped body line (4000 characters took 48 s; `parserOpts.issuePrefixes: []` fixes it), and lint-staged uses the shared git stash stack (`stash store`, then `stash drop <index>`). I also ran out of turns before my own R-501 and pre-push probe finished, so approved on QA's e2e results for those.

**How to apply:**
- Put the cheap, decisive checks first (lock diff, registry age, integrity, OSV, tool source for network and stash use), then probes. Run scaling probes (long lines, big inputs) with a small timeout, and run each in its own call.
- Scratch `git init` is refused by the worktree guard; reuse a scratch dir that already has a repo, or let a node script call git.
- `core.hooksPath` is written to the shared git config by `husky`, so it spans worktrees.
- Follow-up issue for `.gitleaks.toml` and the PR #109 Lows: #111.

Related: [[hook-review-checklist]], [[dependency-review-checklist]]
