# Phase 7 plan: Production launch

**Goal:** `rohanjain.pro` live on Cloudflare Pages from the private applications repo, with DNS, DNSSEC, headers, analytics and a deploy pipeline. Meets the Phase 7 gate in `docs/spec/11-phases.md`.

## Slices (all done 2026-10-19)
| Slice | Issue | Owners | Scope |
|---|---|---|---|
| Setup command | #275, #279, #281 | Platform, Security | `.github/scripts/launch-setup.mjs`: token link, DNS, DNSSEC, Pages project and domains, Web Analytics, deploy token, `production` environment |
| Deploy setup | #284 | Platform | `.github/scripts/launch-deploy-setup.mjs`: deploy variables and workflow in the private repo |
| Headers | #283 | Security, QA | HSTS and the Web Analytics beacon in `public/_headers` |
| Contact links | #293, #298 | Frontend, QA | `email_off` markers so Cloudflare does not rewrite `mailto:` links |
| Privacy copy | #287 | Frontend | Cloudflare Web Analytics disclosed on `/privacy` |
| Client decisions | #270, #294 | Supervisor | ADR-0034 (no Firefox), ADR-0035 (no real validation, `www` kept) |

## Order
Setup run by the client, deploy of `v0.9.1`, live checks, fixes, `v1.0.0`, `v1.0.1`.

## Risks
- The Cloudflare permission names for the setup token were unverified; the form accepted all five.
- The first real deploy was the first test of wrangler with install scripts disabled: green.
- Cloudflare features that rewrite pages (email obfuscation) can break the strict CSP; found by the live Lighthouse run and fixed in code.
