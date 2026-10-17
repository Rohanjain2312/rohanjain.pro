---
name: review-checklist-escaped-defects
description: Review habits learned from past PR reviews; read before every security review (closing keywords, regressed findings, live-state checks, stale approvals)
metadata:
  type: feedback
---

Checks to run on every review, learned from past reviews:

1. **"Closes #N" on a security-finding issue:** verify every acceptance criterion of #N, including files outside the diff. PR #34 (head 83a8970) closed #38, but #38's phase-gate R-107 criterion was never done.
   **Why:** a squash merge auto-closes the issue and the finding disappears half-fixed.
   **How to apply:** for each closing keyword, read the issue and grep the repo for each criterion.

2. **Regressed findings:** new docs can bring back text that an earlier finding fixed elsewhere. ADR-0014 said `admin:ssh_signing_key` after #43 had narrowed `docs/needs-client.md` to `write:ssh_signing_key`.
   **Why:** shared-token least privilege; readers follow whichever doc they open.
   **How to apply:** grep the diff for terms from closed `[security]` issues (scopes, paths, commands).

3. **Check claims about GitHub state against the live API:** the ruleset (`gh api repos/Rohanjain2312/rohanjain.pro/rulesets/25204664`), commit signatures (`commits?sha=main`), and `security_and_analysis`. Root commit `4d29441` is the only allowed unsigned commit (empty tree).

4. **A new head makes the old `approved:security` stale (R-208).** Remove it if you are not re-approving.

5. **A review log must be built from the posted comments of every PR**, one PR at a time, not from memory. The first Phase 0 log (PR #40) held only PR #36.

6. **Schema PRs (PR #83, 2026-10-16):** probe the maximum accepted size of privacy-bound records (R-502 files reached 48 KB), regex-only date fields (`2000-13-45` passes; use `z.iso.date()`), nested `.strict()` coverage, and what error messages echo. For new dev dependencies, compare lock `integrity` with `npm view <pkg> dist.integrity` and check install scripts. Rated Low, approved.

7. **Process PRs that amend an ADR (PR #158, 2026-10-16):** read the amended ADR's rule text and compare it with the new one. Check the skills that repeat the rule, because they can contradict each other inside one file (run-review said "never haiku" and then "re-review on haiku"). Check that every accepted risk is listed in `docs/needs-client.md`. Recount any factual claim about review rounds from the posted REVIEW comments (ADR-0024 said four QA rounds; the comments show five).
   **Why:** the veto (R-511) and the ADR-0022 haiku limit are enforced only through the text, so a silent rewrite of either removes the control.
   **How to apply:** run `git diff` on the amended ADR and the skills, then grep each changed rule's keyword (haiku, Low, CHANGES REQUESTED, approved) across `docs/` and `.claude/`.

Related: [[tooling-quirks]], [[escaped-defects]], [[project-adr-0024-process-trims]]
