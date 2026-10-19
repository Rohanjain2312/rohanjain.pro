# ADR-0035: drop the real 5-second test and recruiter ratings; keep `www` serving the site

Status: accepted · 2026-10-19 · Supervisor (R-004), from the client's instruction in chat

## Context
`docs/needs-client.md` listed two optional items: the real 5-second test and recruiter fit ratings (skill `external-validation`). The client said they are not required. Separately, `www.rohanjain.pro` serves the same site as the apex. A redirect needs a Cloudflare Redirect Rule (a file-based redirect cannot do it, runbook section 4), which would add a permission to a token or a dashboard step for the client.

## Decision
- The real 5-second test and the recruiter ratings are dropped. The Reader Advocate's simulated 5-second test and the golden-set rubric stand as the validation. The Phase 7 gate and runbook section 7 are reworded.
- `www` keeps serving the site. Both hosts return the same page with `<link rel="canonical" href="https://rohanjain.pro/">` and `og:url` on the apex, so search engines treat the apex as the one address. No Redirect Rule is added.

## Consequences
- No client action remains for validation or the redirect.
- If a redirect is wanted later, add one Redirect Rule with a new setup token that has the rules permission; the recipe and the unverified permission key are in runbook section 4.
- The `external-validation` skill stays in the repo for reference; nobody is asked to run it.

## Alternatives
- Redirect Rule now: one more permission on a token and more review, for little gain given the canonical tags.
- Run the real tests: the client declined.
