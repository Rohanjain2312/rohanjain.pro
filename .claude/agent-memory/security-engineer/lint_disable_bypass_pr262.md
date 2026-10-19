---
name: lint-disable-bypass-pr262
description: PR #262 review 2026-10-18: ESLint local disable-rule bypasses (self-listing, quoted config keys), probe method, status.yml same-day failure
metadata:
  type: feedback
---

PR #262 (#247 lint and CI follow-ups) got CHANGES REQUESTED at 243c9a4 for one Low that left criterion 95-L1 unmet.

**Why:** A custom ESLint rule that reports disable comments is suppressed by the very comment it inspects. The author knew about blanket `/* eslint-disable */` and added a text scan, but the scan missed: a disable listing `local/no-protected-disable` next to the project rule, `/* eslint "rule": "off" */` with quoted keys, and a two-comment pair. The issue's own fix was `linterOptions.noInlineConfig: true`.

**How to apply:**
- For any "reject disable comments" control, probe with `new ESLint({cwd}).lintText(code, {filePath})` from a scratchpad script (the Write hook blocks files in the worktree; symlink `node_modules` into the worktree and remove it after). Try: self-listing, quoted config keys, `eslint-disable-line` with two rules, Astro HTML comments.
- Prefer a config-level exemption (a `files:` block that drops one selector) over a comment plus a file-wide rule-off.
- Check the last scheduled `status.yml` run: a same-day manual run makes `git commit` fail with "nothing to commit" (run 39122027735). Logs of a failed run are at `gh api repos/.../actions/jobs/<id>/logs`.
- `.claude/**` is intentionally outside Security review paths (ADR-0026).

Related: [[ci-workflow-review-checklist]], [[severity-calibration]]
