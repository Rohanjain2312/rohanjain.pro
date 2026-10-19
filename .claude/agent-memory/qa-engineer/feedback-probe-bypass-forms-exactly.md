---
name: feedback-probe-bypass-forms-exactly
description: When a record describes a hook bypass form, probe the exact shell form (real newline vs $'\n' escape, attached flag vs spaced) before accepting the row. PR #237 round 2.
metadata:
  type: feedback
---

A bypass row that says "multi-line body" or "attached flags" is only accurate if the probe uses the form that actually bypasses. On PR #237 (round 2, head 7e93def) the 232-L6 row said a `REVIEW:` line "inside a multi-line comment body" bypasses guard-bash. The probe showed real newlines are denied (R-203); only the `$'...\n...'` escape passes. The Controls row was right and the L6 row was wider than the evidence.

**Why:** A Medium row becomes the fix scope. A fixer who reads "multi-line body" writes a test for real newlines, which already passes, and misses the escape form.

**How to apply:** run each form named in a bypass row through the hook from the exported head with synthetic JSON (`agent_type` set to the probing role). Build newlines with `String.fromCharCode(10)` in the probe script, not in a shell string. Record the exact denied or allowed form in Checked. Diff the `.claude/hooks` directory between the reviewed SHA and the new head; if identical, the old probe results carry over. See [[feedback-rereview-negative-control]] and [[project-pr218-for-cli]].
