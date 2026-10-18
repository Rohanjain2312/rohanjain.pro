# ADR-0032: Cloudflare token scope for deploys

Status: accepted · 2026-10-18 · Supervisor (R-004), from the Security review of PR #254 (issue #259)

## Context
The Phase 7 runbook (PR #254) defined one broad Cloudflare token (Pages, DNS, Zone Settings, DNSSEC, Web Analytics edit) and stored it as the deploy secret. The deploy job runs `wrangler` with that token, and wrangler's dependencies resolve from the registry at deploy time. A bad release there could control the domain, not only the Pages project. `docs/spec/08-security.md` says the deploy token has Pages edit only. CLAUDE.md allows the client one API token.

## Decision
- The client creates one setup token from a prepared link. It is used once, from the client's Terminal, by a prepared command. It is never stored in GitHub.
- That command applies DNS, DNSSEC, CAA, email-hardening records and Web Analytics, then creates a second token with Pages edit only for the one Pages project, and stores that second token and the account ID as the GitHub secrets with `gh secret set`.
- The client revokes the setup token after launch. Claude Code gives the exact steps.
- The `production` environment allows deployment from `main` only.
- Unverified (R-005): the Cloudflare permission names needed to create a token from a token. Phase 7 checks this first. If a token cannot create another token, the fallback is a second prepared link and a second token, and `docs/needs-client.md` and CLAUDE.md item 3 are updated in the same change.

## Consequences
- A compromised deploy job can change the Pages project only.
- The client still creates one token and runs prepared commands.
- DNS changes after launch need a new setup token.
- Rotating the 90-day deploy token also needs a token made by the client, because the deploy token cannot create tokens. Claude Code prepares the steps; the rotation runbook is written in Phase 7.
