---
name: project-pr254-production-deploy-template
description: PR #254 production deploy template and launch runbook, approved at c53ebd5 with 8 Lows on #233; recheck items and probe recipe
metadata:
  type: project
---

PR #254 (issue #231, template `.github/templates/production-deploy.yml`, `docs/runbooks/launch.md`) approved 2026-10-18 at c53ebd57 with no Medium. Lows 1 to 8 posted on #233.

Non-obvious points for later reviews:
- `.github/scripts/ci-checks.mjs pins` scans only `.github/workflows` and `.github/actions`. A template under `.github/templates` is never read, so "passed pins" is vacuous. Grep `uses:` for 40-char SHAs by hand.
- Actions `run` steps use `bash -e` with no pipefail unless `shell: bash` is set. A `cmd | sed > file` step masks the failure of `cmd`. Probe with `bash -e` and `bash -eo pipefail`.
- Cloudflare Pages deployments keep hash URLs, so deleting a /for file does not take old deployments down (production behavior unconfirmed).
- Runbook section 7 orders "set SITE_TAG, deploy, then publish v1.0.0": the tag does not exist before publish.
- Phase 7 rechecks: ADR for the token scope (spec 08 says Pages edit only), the claims-check counts-line mechanism (ADR-0031 leaves it to the Phase 7 plan), preview deploy.yml omission recorded in a durable doc before the Phase 6 gate.

**Why:** a deploy template cannot be run here, so review is by reading plus probing each shell form against real scripts.
**How to apply:** on the Phase 7 copy into the private repo, re-run the pin grep, the pipefail probe, and the SITE_TAG ordering read. See [[reference-tooling-gotchas]].
