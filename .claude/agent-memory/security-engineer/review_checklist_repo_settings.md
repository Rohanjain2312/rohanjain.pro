---
name: review-checklist-repo-settings
description: What to verify when reviewing PRs that record or change GitHub repo settings, CODEOWNERS, or templates; drift and gaps seen in PR #36
metadata:
  type: feedback
---

When a PR records live repo settings, re-run every `gh api` call at review time and compare field by field. Do not trust the PR's own "verified with gh api" claim.

**Why:** In PR #36 (2026-10-15), the Supervisor created milestones one minute after the builder's commit, so the runbook was already stale at review. The runbook also called a rule "paused" when it had been removed from the ruleset.

**How to apply:**
- Compare the commit time (`git show -s --format=%cI`) with the `created_at`/`updated_at` of milestones, labels and rulesets.
- For CODEOWNERS, diff it against `.claude/hooks/owners.json` role by role, including `!` exclusions. The platform-owned `scripts/*.mjs` gate scripts were missed under `/scripts/`. Also run `gh api repos/.../codeowners/errors?ref=<branch>`.
- Check Actions settings too: `actions/permissions` (sha_pinning_required, allowed_actions), `actions/permissions/workflow`, and `fork-pr-contributor-approval`.
- Environment quirks: gitleaks is not installed locally, so secret checks are grep-only until CI has gitleaks. The worktree guard rejects compound shell lines that mix git with other tools, so run git commands as plain separate calls. `gh pr edit` is broken on gh 2.63.2, so add labels with `gh api -X POST .../issues/<n>/labels`.

Related: [[signed-commits-paused]]
