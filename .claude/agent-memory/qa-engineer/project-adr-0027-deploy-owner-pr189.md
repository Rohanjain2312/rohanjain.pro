---
name: project-adr-0027-deploy-owner-pr189
description: PR #189 (ADR-0027 status-data branch) was CHANGES REQUESTED at 3ccfe7f for an unnamed Phase 7 deploy workflow that conflicts with ADR-0016 and 10-cicd 10.2. Re-check when the deploy owner is decided.
metadata:
  type: project
---

ADR-0027 and docs/spec/06-architecture.md 5.7 say "the Phase 7 deploy workflow" (or "the deploy workflow") copies status.json from the status-data branch into public/ before the build. They do not name it. The spec set disagrees on where production deploy runs: docs/adr/0016 point 5 and Consequences, and docs/spec/10-cicd.md 10.2, put the production build and deploy in the private applications repo with deploy.yml in this repo for previews only. docs/spec/06-architecture.md line 33 and docs/spec/11-phases.md line 65 say deploy.yml in this repo.

**Why:** the footer status (F-10) fails silently when status.json is missing, so a wrong workflow owner would drop the status line in production with no error.
**How to apply:** when ADR-0027 or the deploy workflow lands, confirm the named owner matches ADR-0016 (or that ADR-0016 and 10-cicd 10.2 were amended). Also check the status.yml write path: the main ruleset targets only ~DEFAULT_BRANCH (ruleset 25204664), so status-data is not covered; that part of the ADR holds.

Outcome: CHANGES REQUESTED posted on PR #189 at head 3ccfe7f (Medium deploy owner; Lows on ADR-0027 Alternatives section and the false "10-cicd.md updated" consequence, routed to #163). Out of scope and not re-opened: docs/security/threat-model.md lines 76, 140, 283 still describe the retired bot PR. See [[feedback-r705-issue-before-body]] and [[docs-review-checks]].
