# Phases and gates

Intent and gate criteria for each phase. Tasks are created as GitHub Issues at the start of each phase (skill `phase-gate`); they are not listed here (R-805).

Each phase ends with an automated gate run by the Supervisor: all CI checks green on `main`, acceptance criteria verified, the gate record written with evidence for each criterion (ADR-0026 retired demo records and per-phase Security reviews; the design check and the Reader Advocate checks listed under each phase still apply). **If the gate passes, the Supervisor starts the next phase in the same session if usage allows (skill `session-protocol`), otherwise it stops cleanly and the next session continues.** No client sign-off is needed at any gate.

### Phase 0: Inception and governance
Owner: Supervisor (all roles)
- Verify the local folder is a clone of `Rohanjain2312/rohanjain.pro` with `origin` set. Configure the repo with `gh`: description, topics, homepage `https://rohanjain.pro`, ruleset, security features, labels, issue templates, PR template, CODEOWNERS.
- Set up commit signing.
- Already in the folder from the client: `plan.md`, `CLAUDE.md`, `.claude/` (agents, rules, skills, hooks, settings), `docs/` (rules, spec, status, needs-client), `scripts/lint-docs.mjs`, `reference/`, `.gitignore`. Verify `node .claude/hooks/test-hooks.mjs` and `node scripts/lint-docs.mjs` pass, then commit all of it in the first PR (branch `supervisor/1-bootstrap`). Do not modify `reference/`.
- Write ADRs 0001 to 0012 and create the full issue backlog for Phase 1 (later phases are created at their start).
- Security drafts the threat model; Design Lead drafts the design spec outline.
**Gate:** Phase 1 backlog complete with acceptance criteria; ADRs written; threat model and design outline committed.

### Phase 1: Foundations
Owners: Platform (pipeline), Design Lead + Frontend (tokens, spec), App/Data (content), Security (headers)
- Astro scaffold, TypeScript strict, tooling, pre-commit hooks, `npm run verify`.
- CI with all gates wired.
- `_headers` with full CSP, emulated in local preview.
- Design spec complete; tokens, base styles, self-hosted fonts.
- Content collections and schemas; `claims.json` from `docs/spec/05-evidence-ledger.md` §4.4; `skills.json` from reference; `resume.json` from the résumé docx; `site.json`.
- QA verifies every claim in `claims.json` against its source.
**Gate:** green pipeline; empty styled page builds; headers verified locally; content validation passing; claims verified by QA; seeded-defect audit 1 scored, and any role below 75% retrained and re-tested.

### Phase 2: Core pages (with Phase 5 folded in, ADR-0026)
Owners: Frontend (UI), App/Data (wiring)
- Hero, results strip, production section with both folds, selected work, more projects, background fold, contact (with phone), footer, 404, privacy page.
- Static and content-driven; claims check passing.
**Gate:** design review passes the anti-slop checklist at 390/768/1280 px; Reader Advocate's simulated 5-second test passes; zero axe violations; Lighthouse budgets met locally; claims check and copy lint green. The real 5-second test packet is ready in `docs/needs-client.md` (does not block).

### Phase 3: Fit check and brief
Owners: App/Data (engine and golden set), Frontend (UI), Design Lead (brief layout)
- Engine per `docs/spec/06-architecture.md` §5.4; golden set per `docs/spec/09-quality.md` §9.4; ReDoS test.
- UI: samples, textarea, optional fields, verdict, evidence rows, gaps, brief with print stylesheet.
**Gate:** golden tests and alias audit pass; property tests pass; mutation score at or above threshold; XSS payload tests pass; brief prints to one page in Chromium and WebKit; keyboard-only flow works. The fit-rating packet is ready in `docs/needs-client.md` (does not block).

### Phase 4: Résumé, PDFs and per-application pages
Owners: Frontend (dialog), App/Data (PDF generator, `/for` generator), Design Lead (PDF layout)
- Accessible résumé dialog with three tabs; no-JS fallback.
- Résumé PDFs generated at build, ATS-friendly, claims-checked.
- `npm run for` generator and `/for/[slug]` page, expiry, noindex, random slugs, JD never stored. Create one sample application page from a golden posting to prove the flow. (R-501, R-503)
**Gate:** PDFs pass text extraction and claims check; generator tested end to end; enumeration and noindex tests pass.

### Phase 5: Figures, demos and status (built inside Phase 2, ADR-0026)
Owners: Frontend + Design Lead (figures UI), App/Data (figures data), Platform (status workflow)
- Figures fold with timeline and tiles; optimized images; alt text from `figures.json`.
- Click-to-load demo embeds with sandbox and fallback.
- Daily status workflow and footer status.
**Gate:** CSP still passes with embeds; images within budget; status workflow runs successfully via manual dispatch.

### Phase 6: Hardening and local release candidate
Owners: Security (lead), all roles
- Full local security assessment (`docs/spec/08-security.md` §8.9).
- Accessibility audit; performance tuning; SEO (OG image, JSON-LD, sitemap, robots, canonical with the future domain).
- Cross-browser runs in Playwright (Chromium, Firefox, WebKit, mobile emulation).
- Phase 7 fully prepared: `deploy.yml`, Cloudflare config, DNS record plan, launch runbook, and the client's short launch steps in `docs/needs-client.md`.
- Tag `v0.9.0` (release candidate). Write `docs/handoff.md`: how to run locally, what is done, what launch needs.
- Fold in any real 5-second or fit-rating results received; failures become issues and are fixed here.
**Gate:** zero open Critical/High/Medium findings; all budgets met; release candidate tagged. **The build stops here until the client completes the Phase 7 steps.**

### Phase 7: Production launch (after the client buys the domain)
Owners: Platform (execution), Supervisor, Security
- Client steps (the only manual part, listed in `docs/needs-client.md`): create a free Cloudflare account and add `rohanjain.pro`; at Porkbun, replace the nameservers with the two Cloudflare nameservers shown; create a Cloudflare API token from a provided template link and paste it into one `gh secret set` command Claude Code prepares.
- Claude Code then: connects DNS records, enables DNSSEC, CAA, email-hardening records, deploys via `deploy.yml`, enables analytics, verifies headers with external scanners, runs production smoke tests, tags `v1.0.0`.
**Gate:** smoke tests green; headers A+; analytics receiving data; the real 5-second test has passed (skill `external-validation`), or its failures are fixed and re-tested.

### Phase 8: Operate
Owner: Platform with Supervisor
- Weekly dependency updates (automated), monthly security review, quarterly content check against repos.
- After 30 stable days: submit HSTS preload.
- Reply-rate tracking (skill `external-validation`); the Reader Advocate reports monthly from `npm run apps -- report`.
