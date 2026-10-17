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

7. **A criterion moved to another issue must sit in that issue's body, not only in a comment (PR #133, 2026-10-16).** #118's CODEOWNERS item was "moved" to #121 by a comment, and the comment says CODEOWNERS already lists the paths. It did not. #121's body has no such criterion.
   **Why:** the comment is the only record, and it was wrong, so the item vanished.
   **How to apply:** for each moved criterion, grep the target issue body and check the target file, not the comment.

8. **Risk acceptance wording (PR #133):** an ADR that "accepts" a risk must say "accepted risk" in its text, be listed in `docs/needs-client.md`, and get an RR row in `docs/security/threat-model.md`. The ADR's own word "Consequences" is not enough (R-511).

9. **Review model (PR #133):** this review ran on haiku. ADR-0022 allows haiku only for docs-only reviews, and `.claude/skills/` is not docs-only. Note the model in the review's Checked list and let the Supervisor decide whether to re-run on sonnet.

Related: [[tooling-quirks]], [[escaped-defects]], [[review-checklist-repo-settings]], [[project-adr0022-model-policy]]
