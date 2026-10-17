# Phase 1 retro

Date: 2026-10-17. Short record (ADR-0024).

## Went well
- Machine checks caught real defects: check-claims, the action pin policy and the claims log all failed on the seeded audit PR.
- Reviewers caught every seeded defect in their area.
- Combining same-owner issues in one PR cut review rounds.

## Went badly
- Too much effort went into process tooling. Phase 1 used about 120 issue and PR numbers; one hook PR (#136) took five QA rounds over regex variants.
- Every Low became its own issue.
- The Supervisor told App/Data to replace client-decided claim values with repo values (PR #165), against R-302. It was reverted in PR #172.
- Removing a reviewer's worktree early made that agent impossible to resume.

## One process change
ADR-0024: product first, bigger slices, bounded single-round reviews, one Low backlog per phase, and a pipeline of two PRs. Also: before acting on a claim mismatch, read the claim's `source` and R-302; only repo-only claims get corrected to the repo.
