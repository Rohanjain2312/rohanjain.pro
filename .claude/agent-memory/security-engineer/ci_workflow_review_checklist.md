---
name: ci-workflow-review-checklist
description: Checks for CI workflow and gate-script PRs (PR #125): live run logs first, SHA-to-tag, OSV vs audit, control builds, test flags in gate CLIs
metadata:
  type: feedback
---

For a PR that adds workflows or gate scripts, do these in order.

1. Read the PR's own CI run at the head SHA (`gh pr checks`, `gh run view <id> --log`) before anything else. In PR #125 the `security` job was already red: OSV-Scanner flagged dev-only `braces` GHSA-vfj7-8cjw-p6xm (no fix). The PR body only said "may flag".
2. Resolve every pinned SHA to its tag with `gh api repos/<o>/<r>/git/ref/tags/<tag>`. An annotated tag (osv-scanner-action) needs a second call to `git/tags/<sha>`.
3. `npm audit` and OSV disagree on scope. Run `npm audit --omit=dev` (prod gate) and an OSV querybatch over the lock. A report-only `|| echo` step is an unrecorded risk acceptance; only an ADR accepts a risk (R-511).
4. Prove build-config claims with a control build: probe page with scoped style, script, small asset; build with and without the option; grep dist for `<style`, inline script and `data:`.
5. Gate CLIs: look for test flags (`--gh-fixture`, `--next-gate`, env repo override) that switch off the check, and for NaN date comparisons that fail open.
6. Regex-based YAML checks miss `uses :`, flow mappings and quoted keys; check whether a server-side control (`sha_pinning_required`) backs them before rating.

**Why:** PR #125 review (2026-10-16) found these. Ruling: a time-boxed OSV waiver for a Low dev-only advisory is acceptable only with an expiring `.github/osv-scanner.toml` ignore by ID, an ADR and a `docs/needs-client.md` entry.

**How to apply:** run step 1 first; it can settle the verdict before any local work. Related: [[dependency-review-checklist]], [[severity-calibration]].
