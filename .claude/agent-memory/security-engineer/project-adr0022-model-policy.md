---
name: project-adr0022-model-policy
description: State of the ADR-0022 model and parallelism policy (PR #133, 2026-10-16) and the open Security items it left; check before any review that touches agent models or R-205
metadata:
  type: project
---

ADR-0022 (PR #133, head b9f120a, review posted as CHANGES REQUESTED on 2026-10-16) sets: up to eight agents in parallel; sonnet for builds and reviews; haiku for chores and docs-only reviews; no opus subagents, including Security reviews of `.claude/hooks/`. It supersedes ADR-0020 decision 2 and the opus exception in decision 1.

**Why:** the client asked (2026-10-16) for more parallel agents and smaller models for less intensive tasks, because the build was too slow.

**Status (2026-10-16):** the first review (head b9f120a) was CHANGES REQUESTED. The re-review at head ff7d4df was APPROVED with `approved:security`. The fix added the accepted-risk line to ADR-0022 and to `docs/needs-client.md`, moved the CODEOWNERS gap to #121's body, and updated `docs/status.md`.

**Still open (Security follow-ups, not blockers):**
- RR-3 in `docs/security/threat-model.md` still cites model tiers as an offset. Add an RR row for ADR-0022 and update RR-3 after merge (Security's file).
- ADR-0022 header and ADR-0020 status do not yet show the partial supersession (I-2).
- CODEOWNERS still lacks the preview paths and nine other owners.json mappings; tracked in #121 (Platform).
- The "build takes too long" client quote has no repo source (I-5); needs-client.md says "save usage" where the ADR says speed (I-6).

**How to apply:** when the next PR changes agent models, R-205 or ADR-0020/0022, check the open items above. Related: [[review-checklist-escaped-defects]] (checks 7 to 9), [[severity-calibration]].
