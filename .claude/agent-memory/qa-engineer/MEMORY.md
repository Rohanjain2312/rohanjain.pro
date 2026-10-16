# QA Engineer memory

- [Escaped defects](escaped-defects.md): defects that passed QA review and were found later. Read before every review.
- [Docs review checks](docs-review-checks.md): checks for README, CONTRIBUTING, LICENSE and docs PRs, including claim-vs-ADR comparison.
- [Recruiter copy must be present-tense true](feedback-recruiter-copy-present-tense.md): README and site copy describe only what exists at the reviewed head (PR #84)
- [Keep scratch out of the worktree](feedback-worktree-verify-hygiene.md): dirty tree blocks the verify stamp; split git commands for the guard
- [Worktree git guard](worktree-git-guard.md): which git and shell forms the worktree guard accepts for QA checks.
- [Review mechanics](reference_review_mechanics.md): label name approved:qa, clean-clone verification, sandbox command limits
- [QA gaps at Phase 1 start](project-qa-gaps-2026-10-16.md): lychee, lint-copy and CI absent; manual checks needed until #13 and lint-copy land
- [Lint gate bypasses (PR #85)](project-lint-gate-gaps-pr85.md): known R-405/R-401/R-608 bypass forms to hand-check until fixed
- [QA tooling gaps](project-qa-tooling-gaps.md): lychee (#13) and copy lint (#27) are not run yet; substitutes, owners and verify limits.
