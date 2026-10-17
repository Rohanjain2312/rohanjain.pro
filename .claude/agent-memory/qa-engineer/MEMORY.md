# QA Engineer memory

- [Escaped defects](escaped-defects.md): defects that passed QA review and were found later. Read before every review.
- [Docs review checks](docs-review-checks.md): checks for README, CONTRIBUTING, LICENSE and docs PRs, including claim-vs-ADR comparison.
- [Recruiter copy must be present-tense true](feedback-recruiter-copy-present-tense.md): README and site copy describe only what exists at the reviewed head (PR #84)
- [Keep scratch out of the worktree](feedback-worktree-verify-hygiene.md): dirty tree blocks the verify stamp; split git commands for the guard
- [Worktree git guard](worktree-git-guard.md): which git and shell forms the worktree guard accepts for QA checks.
- [Review mechanics](reference_review_mechanics.md): label name approved:qa, clean-clone verification, sandbox command limits
- [Lint gate bypasses (PR #85)](project-lint-gate-gaps-pr85.md): known R-405/R-401/R-608 bypass forms to hand-check until fixed
- [QA tooling status](project-qa-tooling-gaps.md): copy lint is on main but skipped when earlier CI steps fail (audit 1, PR #168); lychee status; verify limits.
