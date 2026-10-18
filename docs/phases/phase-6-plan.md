# Phase 6 plan: Hardening and local release candidate

**Goal:** a release candidate (`v0.9.0`) that meets every budget and has no open Critical, High or Medium finding, plus everything Phase 7 needs prepared. Meets the Phase 6 gate in `docs/spec/11-phases.md`. ADR-0026: three PRs and one Security assessment, one combined review each.

## Slices
| Slice | Issue | Owners | Scope |
|---|---|---|---|
| A | #229 | Frontend, Design Lead | SEO (title, description, canonical with the future domain, Open Graph and Twitter cards, `sitemap.xml`, `robots.txt`, JSON-LD `Person`), real favicon and OG image (#203), accessibility audit and fixes, performance tuning with LCP headroom |
| B | #230 | QA, Platform | Playwright projects for Chromium, Firefox, WebKit and mobile emulation; Lighthouse budgets in CI or a pinned repo command; triage of every Low backlog (#163, #190, #195, #215) and CodeQL alerts 14 and 15 |
| C | #231 | Platform, Security | Phase 7 preparation: preview `deploy.yml`, the production workflow for the private repo (status-data fetch, Chromium, `/for` claims handling per #221, build in Actions and upload `dist`), Cloudflare and DNS plan, launch runbook, client launch steps, `docs/handoff.md` |
| S | #232 | Security | Local security assessment (`docs/spec/08-security.md` 8.9): CSP evaluator, headers, ZAP baseline, dependency and secret scans, XSS, ReDoS, clickjacking, `/for` enumeration, noindex, PDF metadata, agent-memory and hook review; record in `docs/security/reviews/phase-6.md` |

Real 5-second and fit-rating results, if the client has sent any, are folded in here; failures become issues and are fixed in this phase. None have been received.

## Order
1. A, B and S start together (disjoint files); C starts once the headers and build shape are settled by A (its workflow reads the build). One PR in review while the next builds (ADR-0024).
2. Security reviews every workflow and header change in A to C (ADR-0026) and writes the Phase 6 assessment last, against the merged tree.
3. Gate record `docs/gates/phase-6.md`, `node scripts/phase-gate.mjs 6`, release `v0.9.0` (release candidate). The build stops here until the client completes the Phase 7 steps.

## Risks
- The local security assessment may find Mediums: they block the gate and get fix PRs.
- Cross-browser runs may expose WebKit or Firefox differences (the brief print check on WebKit is layout-only today): report honestly, fix or record.
- The production workflow lives in a private repo this repo cannot test end to end: use a fixture result and a dry run; record what only the first real deploy can prove.
- Launch steps for the client must stay within the client-only list in `CLAUDE.md`.
