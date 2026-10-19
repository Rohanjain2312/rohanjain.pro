---
name: docs-review-checks
description: Checks to run on any README, CONTRIBUTING, LICENSE or docs PR before approving. Copy and claim checks that caught real issues.
metadata:
  type: feedback
---

For docs PRs, run these in addition to the link and copy checks in the issue's test plan:

1. Verify stamp: the SHA the PR body cites for `npm run verify` must equal the head SHA. Fix commits after a stamp make it stale. (R-110)
2. Privacy, stack and enforcement claims: compare each one with docs/adr/ (ADR-0008 is cookieless analytics after launch, not "no tracking"; ADR-0018 says hooks are tripwires, not a boundary, so "enforced by hooks" overstates it). A claim stronger than its source is a finding (R-005, R-302). Check the strength words: "no", "never", "all", "enforced", "guaranteed", "blocks".
3. Present tense about unbuilt features: check each "the site does X" line against docs/status.md and what exists in src/ at head. Planned features need "will" or a planned label.
4. Licence scope: every category in LICENSE section 2 must match what README and CONTRIBUTING say is reserved. Literal "all written copy" also covers repo prose.
5. Rule IDs cited in prose: each must exist in docs/rules.md and say what the prose says. A rule with an exception (R-102) must not be stated as absolute.
6. DoD summaries: compare with the full list in docs/spec/03-workflow.md.
8. Retired mechanisms: when an ADR replaces a design, grep the whole source set (docs/spec, docs/adr, docs/security/threat-model.md) for the old mechanism's words (for example "bot PR", "daily PR", "auto-merge", the old file path). Check threat-model table rows and numbered mitigations too, not only the prose. A re-review scoped to one line still needs this grep (see [[escaped-defects]], PR #189).
7. Install steps: run each npm script the README lists, in order, on a scratch copy at head. Run `npm run verify` steps individually when the scratch copy is not a git repo, because the verify script reads HEAD through git and cannot produce a real stamp outside one.

**Why:** PR #84 round 1 caught present-tense feature claims and a narrow LICENSE carve-out, but missed the "no tracking" claim that conflicts with ADR-0008. Rounds 1 and 2 also missed the "enforced by hooks" claim that conflicts with ADR-0018 (see [[escaped-defects]]).
**How to apply:** use with the run-review skill, before writing the Checked list.
8. Skill-vs-artifact (for example the 5-second packet against skill `external-validation`): list every sentence of the skill section, including tool lines such as "a free form (Google Forms with timed image links)". A packet that names none of the required tools does not match, even if the audience, sizes and pass rule match. Check the gate row's "following skill X" claim against the same list.
9. Lows: before writing "logged on #N", grep issue N for the item, comments included. A Low that is not in the issue is not logged. On PR #261 the tracker issue had a bare body and the Lows were in its comments, and five struck-box pointers were false. See [[feedback-tracker-pointer-and-tick-evidence]].
10. Closing a checklist: each ticked "done" needs its artifact checked at head, and "partly done" does not count as fixed. Check any ADR "Context" sentence against the rows it cites (PR #261: rows named as holding older repo values held résumé values).
