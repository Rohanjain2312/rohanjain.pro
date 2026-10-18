# Phase 4 plan: Résumé, PDFs and per-application pages

**Goal:** a résumé dialog and ATS-friendly PDFs for the three roles, and a private per-application page flow (`npm run for`, `/for/<slug>`). Meets the Phase 4 gate in `docs/spec/11-phases.md`. ADR-0026: three PRs, one combined review each.

## PRs
| PR | Issue | Owners | Scope |
|---|---|---|---|
| A | #212 | App/Data | `npm run for` generator: result schema (R-502), random slug (R-503), expiry, JD read-analyze-discard (R-501); sample application from a synthetic golden posting in a temp directory; end-to-end tests |
| B | #213 | Frontend, App/Data (PDF script), Design Lead (PDF layout) | Résumé dialog with three tabs and a no-JS fallback; `scripts/resume-pdf.ts` and `/print/resume/[role]`; PDFs in `public/resume/`; `/for/[slug]` page and expiry notice; noindex and sitemap exclusion; `X-Robots-Tag` in `public/_headers` (Security review) |
| C | #214 | Platform, Security | Narrow Supervisor-only hook exception to create the private repo `Rohanjain2312/rohanjain.pro-applications` (ADR-0016); then the Supervisor creates it |

Carried Phase 3 Lows that matter here: the `external-validation` skill gets a fallback line for the missing résumé PDF; once the PDFs exist, the recruiter rating packet can use them (`docs/validation/phase-3-rating-packet.md`).

## Order
1. PR A and PR C start together (disjoint files). PR B starts once PR A's result schema is on `main` (the `/for` page reads it); the résumé dialog and PDF script do not depend on PR A and may start first.
2. At most two PRs in review (ADR-0024). Security reviews PR B's `_headers` change and PR C (hook change).
3. Gate record `docs/gates/phase-4.md`, `node scripts/phase-gate.mjs 4`, release `v0.4.0`.

## Risks
- Job-description text must never reach the repo, logs or result files: schema rejects extra fields, tests assert the CLI writes nothing under the repo tree (R-501, R-502).
- PDF text must pass the claims check (R-301) and extraction (ATS): Playwright print of a dedicated route, text-selectable fonts.
- `/for` pages must not be enumerable: random slug, no listing, noindex, no sitemap entry (R-503).
- Creating the private repo is an outward-facing action on the client's account: private only, exact name, recorded in `docs/status.md`.
