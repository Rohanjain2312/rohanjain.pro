---
name: pr254-deploy-template-review
description: PR #254 review (2026-10-18): production deploy template clean on pins and permissions, but Cloudflare token scope in the runbook was Medium (#259)
metadata:
  type: project
---

PR #254 (head c53ebd5): `.github/templates/production-deploy.yml` and `docs/runbooks/launch.md`. Verdict CHANGES REQUESTED for one Medium, issue #259. Lows went on #233.

**Why:** the workflow itself was sound (SHAs match tags, secrets only in the deploy step, write job runs no repo code, tag regex before checkout). The problem was in the runbook: one broad Cloudflare token (Pages + DNS + zone + DNSSEC + analytics) stored as the deploy secret and given to `npx wrangler`, whose transitive deps resolve live. Spec 08 line 49 says Pages edit only. The runbook also had no mechanism for the agent to use a token that only lives in a GitHub secret.

**How to apply:** on re-review check that #259 is resolved by narrowing the stored token, or by a lockfile-installed wrangler plus an ADR and a `docs/needs-client.md` entry, and that `production` has a main-only branch policy. For any deploy workflow, ask what third-party code sees the deploy token, and compare the token scope with spec 08 line 49. Wrangler 4.149.0 was published 2026-10-08 (cooldown met).

Related: [[workflow-review-checklist]], [[review-stale-status]]
