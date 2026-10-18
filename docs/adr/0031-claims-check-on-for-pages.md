# ADR-0031: claims check on /for pages in the production build

Status: accepted · 2026-10-18 · Supervisor (R-004)

## Context
Issue #221. The private production build (ADR-0016) renders `/for/<slug>` pages from result files. The counts line ('9 proven · 1 to ramp up') comes from the fit-check result, not from `src/content/claims.json`, so the claims check (R-301, part of `npm run build`) could fail that build. The proof text on those pages is different: it is built from claim display text (`src/lib/content/evidence.ts`), and a result file can freeze that text for up to 90 days.

## Decision
- Only the counts line is exempt from the numeric claims match. Its numbers are engine output bounded by the result schema.
- Proof text on `/for` pages stays under the claims check. A result file whose proof text no longer matches `claims.json` fails the build and must be regenerated.
- How the check tells the counts line from other text (a marker element or an allowlisted pattern) is decided in the Phase 7 deploy workflow plan and tested in the private repo with a fixture result (acceptance of #221).

## Consequences
- The public repo has no `/for` pages, so its check is unchanged.
- Platform's deploy template (PR #254) builds in GitHub Actions and uploads `dist`. The job needs Chromium (`npm run browsers:install`) for the three résumé PDFs.
- A stale result file blocks a deploy until it is regenerated. That is intended.
- Revisit if a `/for` page shows any other number that is not engine output.
