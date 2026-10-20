---
name: feedback-client-step-state-vs-runbook
description: When a needs-client item reports a client step as done early, check the runbook, ADR and handoff for the old "do it after launch" wording. PR #290 (2026-10-19) found the setup token line contradicting launch.md section 1 step 6.
metadata:
  type: feedback
---

A needs-client item that reports a step as done can contradict the runbook, the ADR and the handoff, which still give the old instruction. On PR #290 the item said the setup token was deleted on 2026-10-19, while launch.md section 1 step 6, section 5, ADR-0032 and docs/handoff.md line 35 still said "revoke after launch".

**Why:** the client-facing text and the process docs are written in different PRs. A status change in one place does not update the other. The repo cannot show the Cloudflare state, so the only check is text against text.

**How to apply:** for a PR that changes a client step's state, `git grep -n -i "<step term>"` over docs, CLAUDE.md and plan.md at the head. Each hit should agree with the new state. Report the disagreeing hits by file and line. Say in Checked that the external state is client-reported and was not verified. Related: [[feedback-named-stale-lines]], [[feedback-retired-process-sweep]].

Also seen on PR #290: a git call with a shell variable in the path (`git -C "$TMPDIR/..." worktree add`) was refused by the worktree guard. Use literal absolute paths. See [[worktree-git-guard]].
