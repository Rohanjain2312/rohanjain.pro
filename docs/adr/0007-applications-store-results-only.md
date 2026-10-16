# ADR-0007: Per-application pages store results only

Status: accepted, amended by ADR-0016 · Date: 2026-10-15 · Issue: #4

## Context
Rohan wants a personalized page per application. Job descriptions may be confidential and are not his to publish. The repo is public.

## Decision
`npm run for` reads a local posting file, runs the fit-check engine and writes only the result (`company`, `roleTitle`, dates, verdict, proven skills, gaps, evidence rows, role family) to `<slug>.json` in `APPLICATIONS_DIR`, a private repo outside this one (ADR-0016). The posting text is discarded. `postings/` and `*.jd.txt` are git-ignored and blocked by hooks (R-501); the schema rejects extra fields (R-502). Slugs have a random suffix, pages are `noindex, nofollow` and excluded from the sitemap (R-503). Pages expire.

## Consequences
- Nothing confidential from a posting reaches the repo or the site.
- Pages are excluded from the sitemap and search indexes, and their slugs cannot be guessed. The list of applications stays private because result files live only in the private repo (ADR-0016).

## Alternatives
- Storing the posting for reproducibility: privacy and copyright risk in a public repo.
- Predictable slugs: enumerable.
