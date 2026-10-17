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

**Why:** doc PRs contain many claims. The builder's self-check and the first QA pass both focused on copy and links, and missed claims that conflict with ADRs.
**How to apply:** for any docs PR, compare each privacy, stack, licence and "what the site does" claim with docs/adr/ and docs/spec/ and record the result. See [[docs-review-checks]].

## PR #136 (hooks: #51 worktree path normalization, #58 npm install scripts)
- Round 1 (head 5b8935d, QA CHANGES REQUESTED, High). The #51 fix holds for all 8 roles (128/128 in the dotdot matrix, main fails 106/128). The #58 acceptance fails. Real npm re-enables install scripts through `npm config --location=project set ignore-scripts false`, shell writes to `.npmrc`, `--ignore-scripts=$VAR`, and quote-split flags. None of these are blocked. The builder's probe covers only the three literal forms the issue names. Details in [[project-npm-script-bypass-pr136]].
- Test gaps caught in round 1: the #51 probe covers security-engineer only, though the acceptance says any role. The named `npm rebuild --ignore-scripts=false` case is not in test-hooks.mjs.
- Lesson: a builder's probe that follows the issue's examples passes the examples but misses the same effect through a different flag, file, or quoting. QA must enumerate routes (flag, env, npm config location, file write, substitution, quoting) and run them against real npm, not only the regexes.
