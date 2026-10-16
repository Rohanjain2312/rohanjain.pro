---
name: feedback-r705-issue-before-body
description: Write acceptance checks from the issue and spec before opening the PR body. The PR body is the builder's report. Use a field list that leaves out body.
metadata:
  type: feedback
---

Read the issue (`gh issue view <n>`) and the spec sections it names first. Only then open the PR, and do not print the body. Use `gh pr view <n> --json headRefOid,labels,files,title,state` with no `body` field.

**Why:** On PR #108 (tokens, issue #20) my first `gh pr view` printed the full builder body, with its contrast table, clamp values and "decision to check" text, before I had written any tests. R-705 says QA writes acceptance tests without reading the builder's report. I still recomputed every number from the token file, and the review named the exposure in its Checked list.

**How to apply:** Step 1, `gh issue view`. Step 2, read the spec sections. Step 3, write the test list in the scratchpad. Step 4, fetch the PR fields without the body. If the body shows up anyway, say so in the handback and recompute each number instead of copying it. See [[review-mechanics]] and [[docs-review-checks]].
