# ADR-0016: Keep per-application data out of the public repo

Status: accepted · Date: 2026-10-15 · Issue: #44 · Amends: ADR-0007

## Context
ADR-0007 stores `/for` results in `src/content/applications/<slug>.json`. The repo is public, so anyone could list every company Rohan applied to, each verdict and each gap, and git history keeps them after cleanup. Random slugs and `noindex` stop search engines, not someone reading the repo (threat model TM-1).

## Decision
- Application result files never enter the public repo. `src/content/applications/` holds only a `.gitkeep`; everything else in it is git-ignored, blocked by the guard-bash hook on `git add` (R-501), and rejected by a CI check that fails if git tracks any other file there.
- `npm run for` writes result files to a private directory outside the repo, set by `APPLICATIONS_DIR` (default `../rohanjain.pro-applications/applications`). That directory is a private GitHub repo, `Rohanjain2312/rohanjain.pro-applications`, created in Phase 4.
- The content loader reads `APPLICATIONS_DIR` when it exists; otherwise the collection is empty. Public CI builds and tests use fixtures in `tests/fixtures/applications/`.
- The Phase 7 deploy job checks out the private repo with a read-only deploy key stored as an Actions secret, then builds. No other workflow can read that secret.
- Slugs keep their random suffix and pages keep `noindex, nofollow` and stay out of the sitemap (R-503); these limit discovery of the live pages.

## Consequences
- The public repo shows how `/for` pages work, not where Rohan applied.
- Creating the private repo and adding its deploy key need commands the hooks block for everyone (#45). Phase 4 adds a narrow Supervisor-only exception for exactly that repo, with Security review.
- Local builds without the private checkout simply have no `/for` pages.

## Alternatives
- Trim fields in the public files: company names and slugs still leak.
- Encrypt the files in the public repo: key handling in CI adds risk for little gain over a private repo.
- Accept the risk: exposes the client's job search to anyone who opens the repo.
