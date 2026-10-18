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

## PR #185 (Phase 2 plan and ADR-0026 doc cleanup, heads dd8591c, 30a3836, 01364993, 8bfeef6, bd36743)
- Round 1 (dd8591c) caught the 182-L2 to L4 stale process text in run-review, rules, qa-engineer, cicd, threat-model and needs-client. It missed the same retired duties in three agent headers (design-lead, reader-advocate, qa-engineer), in plan.md, and in the 11-phases gate lines. Round 2 (30a3836) caught them.
- Round 3 (01364993) renamed the reader-advocate per-PR heading "Review a PR as two people" to "Check the rendered site as two people" with no trigger. Round 4 (8bfeef6, CHANGES REQUESTED, Medium) found that the "(when the Supervisor asks)" qualifier sat on the next heading, which covers only lines 25 to 28. Round 5 (bd36743, approved) moved it onto line 20.
- Pattern: a qualifier on a heading covers only the lines under that heading. Check that the qualifier sits on the line that governs the block, not on the next heading.
- Low that stayed off the tracker: `docs/design/spec.md` line 632 (Reader Advocate reviews) was a round-2 Low and was not on #163 until round 5. Post every round's Lows to #163 in the round they are raised.
- Low not caught in round 1: `docs/status.md` "Open PRs" lists only #185, while PR #186 was opened before the head. Check the open-PR list against `gh pr list --state open` at the head time.

**Why:** the rules for retired duties are spread across agent headers, skills, specs and the threat model. A fix in one file is not a fix for the rule.
**How to apply:** for a process-retirement PR, grep every file in the retirement list for the retired terms (R-206, R-807, R-704, "probe test", "audit 2", per-PR review verbs), not just the files the builder names.

## PR #164 (do-not-merge audit PR, head bc03846)
- A bundle labelled "copy and style refresh" hid 6 High and 4 Medium defects: unclaimed number, claim value changed against display, vacuous test (`r.success || !r.success`), CSP `'unsafe-inline'`, unpinned action tag, wrong location, low-contrast token, stronger claim display, em dash, wrong issue link.
- Tell: the PR body described scope vaguely and the suite stayed green only because a test was weakened. Run build and claims check in a clean export; diff each hunk against its rule, not against the body.
## PR #204 (Phase 2 gate record and 5-second packet, round 1 ddaa561, round 2 083f1f3)
- Round 1 (ddaa561, CHANGES REQUESTED) caught the first-click part running in Phase 2 with no button to click. Round 2 (083f1f3) deferred it in the skill header, question list and Pass line, and the packet and gate row agreed.
- Self-correction: my round-1 review said "a static screenshot cannot produce a first click". That is wrong in general, since first-click tests often use static images. The real reason is that the "View résumé" button does not exist before Phase 4. Round 2 logged the wording as a Low on #163.
- Open Low at 083f1f3, predates the round: the Phase 6 repeat and the first-click pass criterion appear only in the skill. Spec 01 criterion 9 and spec 11 Phase 6 do not name them.
**Why:** a timing deferral can be right while its stated reason is wrong. A reviewer's own rationale is a claim too.
**How to apply:** when a review says why a test cannot run, check that the reason holds in general, not only for the case in front of you. Log the wrong reason as a Low and fix the wording.
