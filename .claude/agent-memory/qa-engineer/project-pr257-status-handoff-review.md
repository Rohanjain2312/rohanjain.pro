---
name: project-pr257-status-handoff-review
description: PR #257 (issue #256 status pointer, handoff, ADR-0031, R-513 active, Phase 7 client item) at 75ec6fa: round 1 CHANGES REQUESTED; recheck list for round 2
metadata:
  type: project
---

PR #257 (supervisor/256-status-and-handoff) at 75ec6fa71106010b4196ac7a375df5b78ede48af. Round 1: CHANGES REQUESTED.

Verified OK at that head:
- Spec 8.2 CSP line is byte-identical to PR #255's public/_headers (security/245-gitleaks-and-csp, 6bf0776). Main's _headers has no require-trusted-types-for yet, so the spec is ahead of main until #255 merges.
- R-513 "active" is accurate: guard-bash.mjs denies (lines 283 to 285, 382 to 383) and test-hooks.mjs covers them (lines 109 to 122). rules.md and 10-cicd.md agree.
- lint-docs passes (87 rules, 0 errors).

Mediums that blocked round 1:
1. ADR-0031 premise is wrong. Proof lines on /for pages are built from claim display text (src/lib/content/evidence.ts lines 40 to 45; schemas.ts line 61 says "no number lives here (R-301)"). Examples: "saved 40 hours a month", "82.5% exact 10-digit". Result files freeze the text at generation, and the default expiry is 90 days, so a changed claim can ship stale. The schema bounds length (600 chars) and counts (max 1000), not values.
2. status.md "Open PRs" lists #236, which merged 2026-10-18T23:00:40Z as 3eb9425. Open PRs at that head: #97, #250, #254, #255, #257. Status "Next (2)" still tells the next session to drive #236 to merge.
3. handoff.md client steps differ from needs-client item (3) and launch.md: handoff step 2 omits "turn DNSSEC off" (must be off before the nameserver change), and step 3 says one gh secret set command where the runbook says two.
4. handoff.md says performance and cross-browser tests "run on every pull request". ci.yml lines 181 to 183 echo "Passing trivially" for Lighthouse, and no workflow runs test:browsers.

Lows: docs/runbooks/launch.md (cited by needs-client and handoff) exists only on unmerged PR #254 (platform/231-phase-7-prep); ADR README index stops at 0029; issue #233 is CLOSED but status cites it as the open Low backlog; status "Next (5)" says the status-data ruleset item is "logged in needs-client.md" but it is not on head; spec 04 F-12 requires sitemap.xml and nothing on main generates one (handoff implies a sitemap).

Why: the acceptance tests (file exists, lint passes) passed, but the content drifted from GitHub state and from the runbook. Those are the checks the criteria name.
How to apply on round 2: re-run gh pr list and gh pr view 236 at the new head; re-diff handoff steps 2 and 3 against needs-client item (3); check whether ADR-0031 now states the proof-text risk; check whether merge order with #254 and #255 is stated. Related: [[feedback-exemption-premise-check]], [[docs-review-checks]], [[feedback-pin-shared-branch-sha]].

Round 2 (head d800dd5, CHANGES REQUESTED again):
- Resolved: ADR-0031 now exempts only the counts line; handoff DNSSEC order and two gh secret set commands; handoff CI claim narrowed to headers and accessibility.
- Still open: status "Next (2)" and "Progress" still treat #236 as open (merged as 3eb9425); needs-client ruleset item asks the client for a repo setting outside the five client-only items in CLAUDE.md.
- New blocker: PR #254 runbook section 3 (line 48) still removes the whole for/ folder and says proof text is not in claims.json. It must match the ADR before #254 and #257 merge.
- Low on #233: ADR-0031 cites a "Phase 7 plan" that does not exist; sitemap F-12 gap also on #233.
- Lesson: when a fix removes a defect from one file, check the implementing runbook on the sibling PR too (see [[feedback-exemption-premise-check]]).

Round 3 (head 59fb768, after main absorbed #236, #250, #254; CHANGES REQUESTED):
- Resolved: all four round 1 Mediums (ADR-0031 counts-only; status #236; main's runbook section 3 matches ADR; handoff DNSSEC and two-command wording).
- Open Medium: needs-client status-data ruleset item asks the client for a repo setting. Existing optional items sit inside the five client-only categories; #245 says "Supervisor adds the rulesets, #244".
- Lows: duplicate review-gate line in status; ADR-0032 omits the 90-day deploy-token rotation case; rotate-secrets.md missing; Phase 7 deploy workflow plan missing (on #233).

Round 4 (head a61346b): APPROVED. The ruleset item moved to #244 under the Supervisor, the duplicate status line is gone, and ADR-0032 names the rotation case. `approved:qa` added via the API. Still on #233: the missing Phase 7 deploy workflow plan.
