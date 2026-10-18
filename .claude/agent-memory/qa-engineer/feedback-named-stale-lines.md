---
name: feedback-named-stale-lines
description: A PR that says it fixes a named list of stale lines (for example 182-L2 to L4) can pass CI while fixing only a few. Grep every named location at head.
metadata:
  type: feedback
---

When a PR claims to fix a list of stale lines from earlier reviews, check each named file and line at the PR head with grep. Do not rely on the diff summary or on CI.

**Why:** PR #185 (Phase 2 plan, head dd8591c) was asked to fix 182-L2 to L4 on #163. Its diff touched 4 of about 14 named locations. CI and docs:lint passed because the stale text is valid Markdown and cites real rule IDs. Only grep against the named list caught it.

**How to apply:** Extract the named files and phrases from the issue or backlog line. Run `grep -n` on each at the head tree (`git archive <literal-sha> | tar -x -C <scratch>`). List each as fixed or still stale in the Checked section. A count of fixed items is not evidence. Stale text that tells agents to run retired gates is Medium, because it changes agent behaviour. See [[defects-escaped-review]] and [[docs-review-checks]].
