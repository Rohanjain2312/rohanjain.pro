---
name: signed-commits-paused
description: R-107 required_signatures rule was removed from the main ruleset in Phase 0; tracked by issue #33 and ADR 0014 (PR #34); risk acceptance must be in needs-client.md
metadata:
  type: project
---

As of 2026-10-15, the `required_signatures` rule is not in ruleset "main protection" (id 25204664). The plan is to restore it once the client uploads a signing key. Issue #33 tracks this. ADR 0014 is in PR #34, which was still open on that date. `docs/needs-client.md` on main did not mention it yet.

**Why:** The threat model (spec 8.1, Tampering and Repudiation) relies on signed commits. Under R-511, a risk can be accepted only through an ADR that is listed in `docs/needs-client.md`.

**How to apply:** At each gate, check that #33 is closed or that ADR 0014 is merged and listed in `docs/needs-client.md`. Re-check with `gh api repos/Rohanjain2312/rohanjain.pro/rulesets/25204664`.
