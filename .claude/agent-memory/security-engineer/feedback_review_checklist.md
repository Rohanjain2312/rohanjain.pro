---
name: review-checklist-escaped-defects
description: Review habits learned from past PR reviews; read before every security review (closing keywords, regressed findings, live-state checks)
metadata:
  type: feedback
---

Checks to run on every review, learned from past reviews:

1. **"Closes #N" on a security-finding issue:** verify every acceptance criterion of #N, including files outside the diff. PR #34 (head 83a8970) closed #38, but #38's phase-gate R-107 criterion was never done.
   **Why:** a squash merge auto-closes the issue and the finding disappears half-fixed.
   **How to apply:** for each closing keyword, read the issue and grep the repo for each criterion.

2. **Regressed findings:** new docs can re-introduce text that an earlier finding fixed elsewhere. ADR-0014 said `admin:ssh_signing_key` after #43 had narrowed `docs/needs-client.md` to `write:ssh_signing_key`.
   **Why:** shared-token least privilege; readers follow whichever doc they open.
   **How to apply:** grep the diff for terms from closed `[security]` issues (scopes, paths, commands).

3. **Check claims about GitHub state against the live API:** the ruleset (`gh api repos/Rohanjain2312/rohanjain.pro/rulesets/25204664`), commit signatures (`commits?sha=main`), and `security_and_analysis`. Root commit `4d29441` is the only allowed unsigned commit (empty tree).

4. **A new head makes the old `approved:security` stale (R-208).** Remove it if you are not re-approving.

Related: [[tooling-quirks]]
