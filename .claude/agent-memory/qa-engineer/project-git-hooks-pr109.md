---
name: git-hooks-pr109
description: Known gaps in the Husky hooks from PR #109 (head be10a57) and how to probe hooks end to end
metadata:
  type: project
---

PR #109 (git hooks, issue #12) was approved with Low follow-ups at be10a57:

- R-501 check in `.husky/checks/pre-commit.mjs` is case sensitive (`Postings/`, `X.JD.TXT` pass).
- commitlint default ignores let `Merge `, `Revert "` and `fixup!` headers skip R-105 and R-106.
- gitleaks never ran (binary absent, `.gitleaks.toml` not yet written by Security). Args unverified against a real binary.
- `hooks:test` needs a git work tree: in a `git archive` export, 4 commit-msg tests fail ("Could not find git root"). Run `git init -q .` in the export first.

**Why:** hooks guard star rules R-101, R-106, R-501, so bypass forms matter.
**How to apply:** when `.gitleaks.toml` or CI (#13) lands, confirm gitleaks runs for real and that CI does not rely on hooks. For any hook change, probe with real `git commit` and `git push` against a scratch repo plus bare remote (copy `.husky`, symlink `node_modules`, run `npm run prepare`), not only the builder's tests. The scratch test must avoid case-insensitive filesystem collisions (macOS) between mixed-case file names. See [[project-qa-tooling-gaps]] and [[reference_review_mechanics]].
