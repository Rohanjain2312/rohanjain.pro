---
name: feedback-amendment-vs-main-runbook
description: When a docs PR amends an ADR to match fixes still open in another PR, compare the amendment with the runbook on main, not with the other PR's head (PR #278).
metadata:
  type: feedback
---

Rule: a docs-only amendment is only "consistent" with a file if that file is consistent on main. A review finding in another open PR does not make the file correct.

PR #278 amended ADR-0032 to account-wide Pages scope to match PR #276's head. Main's `docs/runbooks/launch.md` still said "for the one Pages project" (section 1.3 step 3 and section 5), and `.github/templates/production-deploy.yml` line 10 said the same. The acceptance criterion named main, so the check failed. PR #276's head also left step 1.3 unfixed.

**Why:** the Supervisor's brief asked for consistency with main and with the #276 findings. Those two sources differed, and I only saw the difference by reading main's file directly.

**How to apply:** for an ADR or needs-client amendment, `git show <main-sha>:<runbook>` and grep the scope words (Pages project, Zone ID, Account ID) on main and at the other PR's head. If they disagree, say so as a Medium with the sequencing fix (land the other PR's runbook fix first, then re-review).

Related: [[feedback-medium-fix-check-all-sources]], [[feedback-residual-headings-after-fix]].
