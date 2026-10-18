# ADR-0031: claims check skips /for pages in the production build

Status: accepted · 2026-10-18 · Supervisor (R-004)

## Context
Issue #221. The private production build (ADR-0016) renders `/for/<slug>` pages from result files. Their counts line and proof text come from the fit-check result, not from `src/content/claims.json`. The claims check (R-301, part of `npm run build`) could fail that build. Two options: exempt `/for/*` from the numeric match, or make the generator emit text with no numbers.

## Decision
The claims check runs on `dist` without the `for/` folder. Numbers on `/for` pages are engine output and are bounded by the result schema, so they are not claims about Rohan. All other pages keep the full check.

## Consequences
- The public repo has no `/for` pages, so its check is unchanged.
- Platform's deploy template (PR #254) builds in GitHub Actions and uploads `dist`. The job needs Chromium (`npm run browsers:install`) for the three résumé PDFs.
- The private repo tests this with a fixture result (acceptance of #221).
- Revisit if a `/for` page ever shows a number that is not engine output.
