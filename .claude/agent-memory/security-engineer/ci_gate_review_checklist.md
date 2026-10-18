---
name: ci-gate-review-checklist
description: What to probe when reviewing PR-process workflows and the review-gate script (PR #135, 2026-10-16): self-edited YAML, parser leniency, labeler gaps, 3000-file cap, CodeQL alerts
metadata:
  type: feedback
---

For PRs that add or change `review-gate`, `labeler`, `pr-hygiene`, `branch-name` or `.github/scripts/pr-process.mjs`, run these checks. I approved PR #135 with 8 Low findings (issue #159).

- The script and `labeler.json` load from `base.sha`, but `pull_request` takes the workflow YAML from the merge ref. A PR can no-op its own `review-gate.yml`. The ruleset has 0 approvals and no code-owner review, so only the Supervisor stops it. Check that docs do not claim "a PR cannot weaken its own check" without this limit.
- Import the exported functions in a scratchpad probe and feed synthetic comments: no evidence, 2 checks with "none", omitted Findings, 7-char head, CHANGES REQUESTED from a non-required role, stale label, other author, fenced review, casual `REVIEW:` comment.
- Probe the labeler with every path in the issue plus neighbours (`.yaml` spelling, `.github/actions/**`, `_redirects`, `_routes.json`, `functions/`, `.nvmrc`, `.gitleaksignore`, renames via `previous_filename`).
- Look for the GitHub API caps: 3000 files per PR, missing `patch` on large diffs. Compare against `pr.changed_files`.
- Look for printed PR-derived text (file names can hold newlines and `::` workflow commands).
- Read the PR check list: `gh pr view <n> --json statusCheckRollup` and `gh api repos/.../pulls/<n>/comments`. CodeQL ran on PR #135 and raised a High alert (`js/incomplete-multi-character-sanitization`) that I rated Low by impact. CodeQL is not a required check.
- Verify action SHAs with `gh api repos/<owner>/<repo>/git/ref/tags/<tag>`.
- Re-run the ruleset jq on the live ruleset; do not run the PUT. Check that every required context is a real job name.
- The gate does not re-run on comments, so say "re-run review-gate before merge" in the review when a CHANGES REQUESTED could land late.

PR #182 (ADR-0026, lean gates, approved 2026-10-17, Lows 182-L1 and L2 on #163):
- `globToRegExp` has no `s` flag, so a path with a newline matches no glob, not even `**`. Probe newline paths and a trailing newline.
- When a rule is retired, grep the old rule IDs across `.claude/`, `docs/spec/` and `docs/security/`; run-review R-205, `.claude/rules/ci.md`, qa-engineer.md and the threat model still described the old controls. Threat-model rows are mine to fix.
- Paths still outside the labeler: `.github/actions/**`, `_redirects`, `_routes.json`, `functions/`, `wrangler.toml`, `astro.config.*`.

**Why:** the gate checks the shape of a review, not its truth, and every agent shares one account, so leniency in the parser is the main weakness.

**How to apply:** start from the criteria, then probe leniency, then trust boundaries. Related: [[severity-calibration]], [[hook-review-checklist]].
