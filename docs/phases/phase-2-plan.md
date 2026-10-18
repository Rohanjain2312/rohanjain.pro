# Phase 2 plan: Core pages (with Phase 5 folded in)

**Goal:** a complete, content-driven home page with figures and demos, a 404 and a privacy page, meeting the Phase 2 and Phase 5 gate criteria in `docs/spec/11-phases.md`. ADR-0026: one or two PRs, one combined review each.

## PRs
| PR | Issue | Owners | Scope |
|---|---|---|---|
| A | #181 | App/Data (projects.json, figures.json first), Frontend | Header, hero, results strip, credentials, Production with both folds, Selected work, More projects, Figures fold, Background, Contact, Footer, 404, privacy; axe and Lighthouse checks in CI; carried Lows #126, #128 item 1 |
| B | #183 | Frontend, Platform | Click-to-load demo embeds; daily status workflow and footer status |

Out of scope: fit check (Phase 3), résumé and brief dialogs and `/for` pages (Phase 4).

## Order
1. App/Data pushes `projects.json` and `figures.json` onto the PR A branch; Frontend builds the pages on the same branch.
2. PR B builds while PR A is in review (pipeline of two).
3. Gate checks from `docs/spec/11-phases.md` Phases 2 and 5 (Reader Advocate 5-second test, images within budget, design check). Gate record `docs/gates/phase-2.md`, `node scripts/phase-gate.mjs 2`, release `v0.2.0`.

## Risks
- PR A is large. Mitigation: `size:approved` with a reason; the combined reviewer checks screenshots at 390, 768 and 1280 px.
- The status workflow is the only new workflow: it gets the Security review (ADR-0026).
