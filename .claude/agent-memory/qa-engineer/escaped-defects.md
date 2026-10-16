---
name: escaped-defects
description: Log of defects that got past a QA review and were found later. Read before every review.
metadata:
  type: project
---

Log of defects that passed a QA review and were found later, plus the defects a QA round caught in a builder's first pass.

## PR #84 (README, CONTRIBUTING, LICENSE, issue #30)
- Escaped round 1 (head 596bc7a, QA CHANGES REQUESTED). Round 2 (head 775a73a) found it: README said "no tracking at runtime", but ADR-0008 accepts cookieless Cloudflare Web Analytics after launch. The stronger claim was not caught because round 1 did not compare README privacy and stack claims with the ADRs.
- Caught by round 1, fixed at 775a73a: unbuilt features and CI written in present tense; LICENSE carve-out covering only src/content/ and not .astro text; CONTRIBUTING attributing the test-plan clause to R-104.
- Still open at round 2: LICENSE says "all written copy" is reserved, but README reserves only "site content and résumé text". The repo's prose scope is undecided.
- Still open: PR body cites a verify stamp (596bc7a) that does not match head.

**Why:** doc PRs contain many claims. The builder's self-check and the first QA pass both focused on copy and links, and missed claims that conflict with ADRs.
**How to apply:** for any docs PR, compare each privacy, stack, licence and "what the site does" claim with docs/adr/ and docs/spec/ and record the result. See [[docs-review-checks]].
