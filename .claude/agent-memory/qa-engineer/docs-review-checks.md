---
name: docs-review-checks
description: Checks to run on any README, CONTRIBUTING, LICENSE or docs PR before approving. Copy and claim checks that caught real issues.
metadata:
  type: feedback
---

For docs PRs, run these in addition to the link and copy checks in the issue's test plan:

1. Verify stamp: the SHA the PR body cites for `npm run verify` must equal the head SHA. Fix commits after a stamp make it stale. (R-110)
2. Privacy and stack claims: compare each one with docs/adr/ (ADR-0008 is cookieless analytics after launch, not "no tracking"). A claim stronger than its source is a finding (R-005, R-302).
3. Present tense about unbuilt features: check each "the site does X" line against docs/status.md and what exists in src/ at head. Planned features need "will" or a planned label.
4. Licence scope: every category in LICENSE section 2 must match what README and CONTRIBUTING say is reserved. Literal "all written copy" also covers repo prose.
5. Rule IDs cited in prose: each must exist in docs/rules.md and say what the prose says. A rule with an exception (R-102) must not be stated as absolute.
6. DoD summaries: compare with the full list in docs/spec/03-workflow.md.
7. Install steps: run each npm script the README lists, in order, on a scratch copy at head. Run `npm run verify` steps individually when the scratch copy is not a git repo, because the verify script stamps the state file only in a git repo.

**Why:** PR #84 round 1 caught present-tense feature claims and a narrow LICENSE carve-out, but missed the "no tracking" claim that conflicts with ADR-0008 (see [[escaped-defects]]).
**How to apply:** use with the run-review skill, before writing the Checked list.
