---
name: severity-calibration
description: How this project rates hook bypasses versus input-side and server-side gaps (ADR-0018), with past findings and their state, so reviews stay consistent
metadata:
  type: project
---

Source of the rule: ADR-0018 (hooks are tripwires; input controls and token scope are the boundary). New hook bypass forms are Low unless they bypass an input-side control (interaction limit, fork approval, author rule).

Not yet in ADR-0018: the 53-I3 exception (a pattern agents hit in normal work, such as passing a gh token to another tool through an environment variable, is rated on likelihood). It is only proposed in #63 (open, moving to Phase 8 under PR #158). Until an ADR adopts it, rate by the written ADR-0018 rule and say so in the review. If it is adopted, rate Medium when nothing input-side or server-side backs the control, or when untrusted input or credentials reach far, and re-rate #47's R-112 shell-write item.

Past findings, state as of 2026-10-16 (re-check before citing):
- Medium, closed: #9 (role-forging routes, PR #2), #44 and #62 (/for data public, PR #55, ADR-0016), #45, #60, #61 (public input and all-repo token, PR #53, ADR-0018), #46 (local install scripts, PR #52).
- Low, open: #47, #51, #54, #56, #58, #63, #153. Low, closed: #32, #38, #57.
- Open Mediums from PR #158 review (2026-10-16): #160 (High, ADR-0024 decision 3 downgrades out-of-scope Medium+ to Low) and #161 (Medium, haiku on code and hook re-reviews). Both block until closed.

**Why:** set in the threat model (#5, PR #49) and fixed by ADR-0018, to keep severity consistent across reviews. The 2026-10-16 check found that I had recorded the I3 exception as settled when it was still a proposal.

**How to apply:** before rating, check whether an input-side control, ruleset, CI check or Cloudflare setting backs the hook. Read the ADR text itself, not an issue's summary of it. Probe hooks by feeding synthetic PreToolUse JSON to copies of the hook files from current `main` and from the open fix PR head; build paths with string concatenation, because `path.join` normalizes `..`. Check open `severity:*` issues first to avoid duplicates. See [[review-stale-status]], [[tooling-quirks]], [[project-adr-0024-process-trims]].
