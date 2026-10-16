# ADR-0016: Keep per-application data out of the public repo

Status: accepted · Date: 2026-10-15 · Issues: #44, #62 · Amends: ADR-0007

## Context
ADR-0007 stores `/for` results in `src/content/applications/<slug>.json`. The repo is public, so anyone could list every company Rohan applied to, each verdict and each gap, and git history keeps them after cleanup. Random slugs and `noindex` stop search engines, not someone reading the repo (threat model TM-1). Anything a workflow in this public repo does with that data is also public: logs, artifacts, and any repository secret, which every workflow on every branch can read (#62).

## Decision
1. **Storage.** Result files never enter this repo. They live in a private repo, `Rohanjain2312/rohanjain.pro-applications`, created in Phase 4. `src/content/applications/` here holds only `.gitkeep`.
2. **Blocking.** `.gitignore` ignores `src/content/applications/*` except `.gitkeep` (#10); guard-bash denies `git add`, `git stage` and `git mv` into that directory (R-501); a CI check fails if git tracks any other file there (#13). The `/for` generator lands only after #10 and #13.
3. **Generator.** `npm run for` writes to `APPLICATIONS_DIR`. The default is `rohanjain.pro-applications/applications` next to the main checkout, resolved from `git rev-parse --git-common-dir`, so agent worktrees resolve to the same place. The generator refuses any path inside this repo's work tree.
4. **Loader.** The content loader reads `APPLICATIONS_DIR` when it exists, else the collection is empty. Tests and public CI builds use `tests/fixtures/applications/` (#22).
5. **Production build, deploy and cleanup run in the private repo.** Its workflow checks out this repo at the release tag, adds the result files, builds, deploys to Cloudflare Pages and removes expired files. Its logs, artifacts and secrets are private. This repo holds no secret that can read application data.
6. **This repo's workflows never see application data.** CI builds, uploaded artifacts and PR preview deploys use fixtures only.
7. Slugs keep their random suffix, pages keep `noindex, nofollow` and stay out of the sitemap (R-503); these limit discovery of the live pages.

## Amendment to ADR-0007
- Decision: "`npm run for` writes only the result ... to `<slug>.json` in `APPLICATIONS_DIR`, a private repo outside this one (ADR-0016)."
- Consequences: "Pages cannot be enumerated or found through search." becomes "Pages are excluded from the sitemap and search indexes, and their slugs cannot be guessed. The list of applications stays private because result files live only in the private repo (ADR-0016)."

## Consequences
- The public repo shows how `/for` pages work, not where Rohan applied.
- Phase 7 deploys from the private repo; `deploy.yml` in this repo builds previews only. `docs/spec/10-cicd.md` §10.2 matches.
- Creating the private repo needs a command the hooks block for everyone (#45). Phase 4 adds a narrow Supervisor-only exception for exactly that repo, with Security review.
- A person with a `/for` link sees that one page (accepted, the link is shared deliberately).

## Alternatives
- Deploy from this repo with an environment secret limited to release tags, no route logging and no artifact: more rules to keep exactly right, and still one public workflow away from exposure.
- Trim fields in public files: company names and slugs still leak.
- Encrypt files in the public repo: key handling in CI adds risk for little gain.
- Accept the risk: exposes the client's job search to anyone who opens the repo.
