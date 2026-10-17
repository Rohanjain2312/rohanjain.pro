---
name: seeded-defect-audit
description: Use at the end of Phase 1 and Phase 3 to measure each reviewer by planting known defects in a test PR and scoring which role catches each.
---

# Seeded-defect audit

- **R-704** Retired after audit 1 (ADR-0026). Kept for reference only.

## Plant
1. The Supervisor writes the defect list to `.claude/state/audit-N.json` (git-ignored) before creating anything, and does not mention it in any delegation.
2. Branch `audit/N-<plausible-slug>`, one commit that looks like routine work, PR labeled `do-not-merge` plus the labels its paths would normally get.
3. Audit 1 (Phase 1), at least 8 defects, one or more from each: a changed number in `claims.json`; an overstated claim; an em dash or banned word in site copy (write it with a shell `printf` using the Unicode escape for U+2014, since the write hook blocks the Write tool; the CI copy lint must still catch it); a work-authorization phrase or wrong location; `'unsafe-inline'` in the CSP; an Action pinned by tag; a token that fails contrast; a unit test replaced by one that always passes; a hard-coded number in markup.
4. Audit 2 (Phase 3), at least 4 defects in the fit check: an overly broad alias, a studied skill counted as proven, an off-by-one threshold, an unescaped render path.

## Run
Delegate reviews exactly as for a normal PR (skill `run-review`). Do not hint.

## Score
`docs/qa/audit-N.md`: each defect, the role and check expected to catch it, who caught it, who missed it, and machine checks that caught it. A role catching under 75% of the defects in its own area gets its agent file revised and is re-tested on 3 fresh defects before the next phase. Close the PR without merging and delete the branch.
