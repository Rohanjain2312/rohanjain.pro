# Phase 1 demo: Foundations

Date: 2026-10-17. Short record (ADR-0024).

## What shipped
- Astro scaffold, strict TypeScript, `npm run verify`, git hooks (#10, #11, #12).
- CI with every Phase 1 gate (#13, #16), PR process checks and required checks (#14, #42): the `main` ruleset now requires 11 checks, including review-gate, with no bypass.
- Security workflows: CodeQL, Scorecard, Dependabot (#15); gate-time releases with an SBOM (#173, ADR-0025).
- `_headers` with a full CSP, emulated in local preview (#17, #18), and a Playwright headers test that fails on inline code (#29).
- Design spec, tokens, base styles and self-hosted fonts; an empty styled page builds (#19, #20, #21).
- Content schemas and data: `claims.json`, `skills.json`, `roles.json`, `site.json`, `resume.json` (#22 to #25); copy lint (#27); claims check on built pages (#26, #151).
- QA verified all 92 claims against their sources (#28, #170): 0 mismatches, 1 unsourced (`med-prompts`, logged for the client).
- Seeded-defect audit 1: QA 6/6, Security 2/2, Design 1/1 (#31).

## Screenshot
The page is still the empty styled shell from #21 ("Rohan Jain", "Page in progress"); Phase 2 builds the content pages.
