---
name: signed-commits-paused
description: R-107 required_signatures rule was removed from the main ruleset in Phase 0; tracked by issue #33 and ADR 0014 (PR #34); risk acceptance must be in needs-client.md
metadata:
  type: project
---

UPDATE 2026-10-16: PR #68 restored `required_signatures` in ruleset 25204664 and #33 is closed. The client then removed the `write:ssh_signing_key` scope from the shared token (scopes: gist, project, read:org, repo, workflow), so threat model RR-8 is closed. At each gate run `gh auth status` and confirm the scope stays off; `4d29441` stays the one allowed unsigned commit. `gh api user/ssh_signing_keys` now returns 404 for this token, so the key count cannot be re-checked from here.

History: as of 2026-10-15, the `required_signatures` rule was not in ruleset "main protection" (id 25204664). The plan is to restore it once the client uploads a signing key. Issue #33 tracks this. ADR 0014 is in PR #34, which was still open on that date. `docs/needs-client.md` on main did not mention it yet.

**Why:** The threat model (spec 8.1, Tampering and Repudiation) relies on signed commits. Under R-511, a risk can be accepted only through an ADR that is listed in `docs/needs-client.md`.

**How to apply:** At each gate, check that #33 is closed or that ADR 0014 is merged and listed in `docs/needs-client.md`. Re-check with `gh api repos/Rohanjain2312/rohanjain.pro/rulesets/25204664`.
