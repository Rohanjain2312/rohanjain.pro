---
name: workflow-review-checklist
description: Checks for PRs that add GitHub Actions workflows or release tooling (PR #134 review, issue #150); token exposure to third-party code, release-please defaults, repo Actions settings
metadata:
  type: feedback
---

For a PR that adds workflows, check these beyond SHA pins and `permissions:`.

**Why:** In PR #134 (2026-10-16) pins and scopes were clean, but the real problems were behavioral: a job-level `GH_TOKEN` (contents: write) shared with `npx` third-party code (#150), release-please tags that would be `rohanjain-pro-v0.1.0`, the Actions setting `can_approve_pull_request_reviews: false` blocking PR creation, and a generated `CHANGELOG.md` that fails `prettier --check` on main.

**How to apply:**
- Where is the write token in `env`? Job-level env reaches every step, including `npx`, `npm ci` and third-party actions. Require step-level env or a split job.
- Read the tool source for defaults the config does not set. release-please with a config file: `include-component-in-tag` defaults true (action input is ignored). Use `npm pack <tool>` in the scratchpad and read it.
- Live `gh api repos/.../actions/permissions/workflow`: `can_approve_pull_request_reviews` must be true for any `GITHUB_TOKEN` PR creator. PRs from `GITHUB_TOKEN` do not trigger CI or the review gate.
- Generated files (CHANGELOG.md, SBOM) against `.prettierignore`, `format:check`, docs lint. Test with the main checkout's `node_modules/.bin/prettier --no-config --check`.
- Tags and releases: tag ruleset and immutable releases are off; spec §10.3 deploys from release tags.
- `node .github/scripts/ci-checks.mjs pins` on the exported head confirms the repo's own R-504 check.

Related: [[dependency-review-checklist]], [[review-checklist-repo-settings]]
