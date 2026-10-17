# ADR-0026: One combined review, merged phases, lean gates

Status: accepted · Date: 2026-10-17 · Issues: #180 · Amends: ADR-0020, ADR-0022, ADR-0024 (reviews and gate ceremonies)

## Context
The client decided (session chat, 2026-10-17) that the build must be much faster and named three changes. The goal is a launchable site in two or three sessions. CI and the claims check are what protect quality; most of the time went to separate reviews and gate ceremonies.

## Decision
1. **One combined review per PR.** `qa-engineer` reviews every PR once, covering tests, content and claims, copy, and design (spec, tokens, the anti-slop checklist at 390, 768 and 1280 px for visible changes). Security reviews only PRs that change workflows, workflow scripts, the labeler config or `public/_headers` (`.github/labeler.json` is the source of truth, R-209). Design Lead and Reader Advocate no longer review individual PRs.
2. **Merged phases.** Phase 5 (figures, demos, status) is folded into Phase 2, and Phase 2 is built as one or two PRs. The gate criteria of both phases still apply to the merged phase.
3. **Lean gates.** Retired: the second seeded-defect audit (R-704 after Phase 1), the review audit (R-206), probe tests (R-807), the context audit, demo and retro records (R-804 now needs only the plan and gate records), and per-phase Security reviews. A phase closes with its plan, its gate record (each spec criterion with evidence), green CI, no open Medium or higher finding (R-511) and the release. The Phase 6 local security assessment before launch stays, as part of the launch gate in `docs/spec/11-phases.md`.

Unchanged: every CI check (lint, types, tests, headers test, copy lint, claims check, pin checks, review-gate), the claims verification log (R-303), R-302 client decisions, and the hard rules enforced by hooks.

## Consequences
- About half the agent runs per PR, and no gate ceremonies beyond the gate record.
- Accepted risk (in `docs/needs-client.md`): one reviewer per PR catches less than three; reviews and agent instructions are no longer audited after the fact. CI, the claims check and the Phase 6 assessment are the backstop.

## Alternatives
- Keep ADR-0024 as is: faster than before, but the client judged it still too slow.
