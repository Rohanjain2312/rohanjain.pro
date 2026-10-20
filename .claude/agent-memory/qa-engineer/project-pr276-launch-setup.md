---
name: project-pr276-launch-setup
description: PR #276 launch-setup script review: round 1 CHANGES REQUESTED at 55880fb, round 2 APPROVED at 5e0ebcb; what the Lows on #233 hold.
metadata:
  type: project
---

Round 1 (55880fbb, 2026-10-19), CHANGES REQUESTED, three Mediums: stale "one Pages project" wording (runbook 1.3.3, template, ADR-0032); client steps did not ask for Account ID and Zone ID; `ghSecretSet` untested (mutant adding `--body value` to the gh argv survived).
Round 2 (5e0ebcbc), APPROVED, `approved:qa` added. All three fixed; the argv mutant and an env mutant now fail the new test. Verify OK at head.
Lows on #233 (comments 6274105320, 6274290231): ADR-0032 and needs-client item 11 still stale (Supervisor-owned); new apex SPF skip untested; request-body secret assertion missing; never-deletes not asserted.

**Why:** a fix to a runbook line did not cover the ADR or template that carried the same claim; the one code path a mock bypasses hid the named risk.
**How to apply:** when a Medium names a wording, grep the whole tree for it, and note files the builder cannot edit (R-112) as owner-named Lows. Mutate the real function behind any mocked seam. Use a real detached worktree for verify; `git archive` exports fail hook tests. See [[feedback-spec-change-sweep]], [[feedback-named-stale-lines]].

## PR #280 (environment creation, round 1 at 50e0b6c)
CHANGES REQUESTED for one Medium: runbook section 5 run-order line 101 still said "section 2 creates it first" after the script took over. Mutations (15) were mostly killed; the read-back after POST is untested (Low on #233). Recheck: that line, and a read-back test.
Round 2 at 1e27205: APPROVED, approved:qa added. Medium (runbook line 101) and Low (read-back test) fixed; mutation killed; verify OK.
