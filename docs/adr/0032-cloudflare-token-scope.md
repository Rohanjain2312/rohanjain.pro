# ADR-0032: Cloudflare token scope for deploys

Status: accepted · 2026-10-18, amended 2026-10-19 (see Amendment) · Supervisor (R-004), from the Security review of PR #254 (issue #259)

## Context
The Phase 7 runbook (PR #254) defined one broad Cloudflare token (Pages, DNS, Zone Settings, DNSSEC, Web Analytics edit) and stored it as the deploy secret. The deploy job runs `wrangler` with that token, and wrangler's dependencies resolve from the registry at deploy time. A bad release there could control the domain, not only the Pages project. `docs/spec/08-security.md` says the deploy token has Pages edit only. CLAUDE.md allows the client one API token.

## Decision
- The client creates one setup token from a prepared link. It is used once, from the client's Terminal, by a prepared command. It is never stored in GitHub.
- That command creates the Pages project and its custom domains, applies DNS, DNSSEC, CAA, email-hardening records and Web Analytics, then creates a second token with Pages edit only, and stores that second token and the account ID as the GitHub secrets with `gh secret set`.
- The client deletes the setup token as soon as the setup run has succeeded (done 2026-10-19), not after launch. Claude Code gives the exact steps.
- The `production` environment allows deployment from `main` only.
- Unverified (R-005): the Cloudflare permission names needed to create a token from a token. Phase 7 checks this first. If a token cannot create another token, the fallback is a second prepared link and a second token, and `docs/needs-client.md` and CLAUDE.md item 3 are updated in the same change.

## Consequences
- A compromised deploy job can change Cloudflare Pages in this account only. Cloudflare does not document limiting a Pages token to one project (amended 2026-10-19, PR #276 reviews); with one Pages project in the account the effect is the same today. The deploy token cannot change DNS, zone settings or other products.
- The client still creates one token and runs prepared commands.
- DNS changes after launch need a new setup token.
- Rotating the 90-day deploy token also needs a token made by the client, because the deploy token cannot create tokens. Claude Code prepares the steps; the rotation runbook is written in Phase 7.

## Amendment 2026-10-19
The setup token also needs Pages edit so the command can create the Pages project and attach `rohanjain.pro` and `www`. The deploy token is scoped to Pages for the account, not to one project, because the Cloudflare documentation lists no per-project scope. The account must hold no other Pages project besides this site's, or the deploy token reaches it too. Re-check both points at launch (R-005).
