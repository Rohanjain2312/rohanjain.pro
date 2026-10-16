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
- Still open at round 2: LICENSE says "all written copy" is reserved, but README reserves only "site content and résumé text". The repo's prose scope is undecided. Resolved at cd0f7fb by ADR-0019 (copy reserved by location; repo docs MIT).
- Still open at round 2: PR body cites a verify stamp (596bc7a) that does not match head. Fixed at cd0f7fb (body cites cd0f7fb).
- Escaped rounds 1 and 2 (heads 596bc7a and 775a73a). Round 3 (head cd0f7fb, QA CHANGES REQUESTED, Medium) found it: README said "Rules are enforced by hooks in .claude/hooks/" and CONTRIBUTING said "most are enforced by hooks". ADR-0018 says hooks are tripwires that catch common and accidental forms and are not claimed to stop a compromised agent. Same class as the analytics claim: a strength word that the cited ADR does not support.
- Open at cd0f7fb (round 3, Low): README does not warn that `npm run dev` returns 404 until the first page lands; SECURITY.md is in spec 03's Documentation set but not in #30 and no open issue names it; ADR-0019 cites this PR's review thread; head is three commits behind main.
- Correction to round 3 wording: the PR comment said verify's stamp step "does not run" in an export. It runs, but it reads HEAD through git, which an export lacks, so it cannot produce a real stamp.

## PR #122 (headers and CSP, issue #18)
- Caught in round 1 (head f4f0d4d, QA CHANGES REQUESTED, Medium): headers.md said `build.inlineStylesheets: 'never'` is enough for a CSP-clean build. Astro 7.4.0 also inlines small bundled `<script>` blocks; `vite.build.assetsInlineLimit: 0` is needed too. Found only by building a scratch page, not by reading.
- Check for any CSP or "no inline" claim: build a page with inline style, script and JSON-LD and inspect `dist/*.html`.

**Why:** doc PRs contain many claims. The builder's self-check and the first QA pass both focused on copy and links, and missed claims that conflict with ADRs.
**How to apply:** for any docs PR, compare each privacy, stack, licence and "what the site does" claim with docs/adr/ and docs/spec/ and record the result. See [[docs-review-checks]].

## PR #119 (claims, skills, roles, site data; issues #23, #24)
- Round 1 (head e4ef9e0, CHANGES REQUESTED) said "no alias collides with another skill's name or alias". It missed alias `function calling` on "Tool calling", which equals the name of the skill "Function calling". Found at round 2 (head 0e4b1b4) by an overlap script. Logged Low (the engine must dedupe by phrase).
- Lesson: run the alias audit as a script (exact match against every name and alias, then substring overlap with hyphens folded), not by eye. Also check studied-tier names that contain a proven alias (for example `openai` inside "Azure OpenAI").
- Open at approval: `docs/qa/claims-verification.md` has no claim entries; `verifiedOn` on claims is the ledger date, not a QA date (R-303).
