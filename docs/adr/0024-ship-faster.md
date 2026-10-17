# ADR-0024: Ship faster: product first, bigger slices, bounded reviews

Status: accepted · Date: 2026-10-16 · Issues: #157 · Amends: ADR-0022 decision 1 (parallelism) and decision 4 (Low deferral); ADR-0022 decision 2 (haiku limits) is unchanged

## Context
The client said in the session chat (2026-10-16) that the build takes far too long for a website and asked for speed-ups that keep quality.

Phases 0 and 1 used about 150 issue and PR numbers. Most went to process tooling (hooks, CI gates, review rules) rather than to the site. Where the time went:
- Every Low finding became its own issue, often with its own PR and review.
- Review rounds were open-ended. PR #136 (hook regexes) took five QA CHANGES REQUESTED reviews, each finding a new variant beyond the issue's criteria.
- Small issues each paid the full fixed cost: a builder, two or three reviewers, a status update, a merge.
- Gate ceremonies (demo, retro, context audit, review audit, Security phase review, probe test) ran at full depth at every gate.

The quality bar is the gate criteria in `docs/spec/11-phases.md` and the hard rules in `docs/rules.md`. None of the decisions below change them.

## Decision
1. **Product first; process tooling frozen.** Hooks, CI checks and review rules are done enough (ADR-0018: hooks are tripwires). New work on them happens only for a Medium or higher finding, or when a check blocks legitimate work. Process-tooling Lows move to the Phase 8 milestone (post-launch hardening). Product Lows move to the phase whose work they touch.
2. **Bigger slices.** A phase is planned as a few vertical slices, each one issue and one PR (for example Phase 2: page shell and hero; work sections; contact, footer, 404 and privacy). Same-owner issues share a PR. A coherent slice over 600 lines gets `size:approved` with the reason in the PR body (R-109).
3. **Bounded reviews.** Each reviewer judges the acceptance criteria and the risks named in the delegation, in one round. A Low beyond that scope goes to the phase's Low backlog, never CHANGES REQUESTED. A Medium or higher finding blocks wherever it is found, in or out of scope (R-511 for security findings; the phase-gate script for all severities). After a fix, the re-review checks only the diff from the reviewed head. It runs on haiku only when the fix changes docs and nothing else. Any fix that changes code, workflows, hooks, content data or the `needs:security-review` path set is re-checked on sonnet (ADR-0022 decision 2). A third round needs a Supervisor note in the PR explaining why.
4. **One Low backlog per phase.** Reviewers add Lows as checklist lines to a single `Phase N Low backlog` issue instead of opening one issue each. Lows never block a gate. ADR-0022 decision 4 still applies to moving them, including Security agreement for `type:security` issues.
5. **Pipeline of two.** At most one PR is in review while the next slice is being built. Builders open a draft PR on their first push (R-803), so a usage-limit stop leaves at most two resumable PRs and nothing half merged.
6. **Phase overlap.** Building Phase N+1 slices may start once Phase N has only findings fixes, audits and gate records left. Phase N's gate must still pass before any Phase N+1 gate.
7. **Lighter gate ceremonies.** Demo, retro and gate records stay (R-804) but use a short template: what shipped, evidence links, one process change. The context audit runs at Phases 3 and 6 only. The R-206 review audit stays on sonnet. The Security phase review at Phases 1 to 5 reads the findings register and the phase's security-labeled PRs; Phase 6 still runs the full `docs/spec/08-security.md` §8.9 assessment. Seeded-defect audits (R-704) and every spec gate criterion are unchanged.

## Consequences
- Fewer, larger PRs; each still gets every required review and CI gate.
- Some tripwire gaps stay open until Phase 8. They are Lows under ADR-0018; CI and token scope remain the boundary.
- Accepted risks (listed in `docs/needs-client.md`): bounded reviews can miss Low issues beyond the stated criteria; haiku diff re-checks of docs-only fixes are weaker; the context audit, which checks R-204, R-205 and R-705 after the fact, runs at Phases 3 and 6 only. The seeded-defect audits, the R-206 audit and the Phase 6 assessment are the backstop.
- Moved issues as of this ADR: to Phase 8: #47, #54, #63, #153 (hooks; Security agreed in the PR #158 review), #121 (preview polish), #116 and #75 (need the client's CLI). To Phase 2: #126 (fonts for the first pages), #128 (its first item, lychee fragment handling, is needed by the first pages with section links). To Phase 3: #95 (Security agreed: before the first fit-check code), #123. Kept in Phase 1 at Security's request: #91 (the date check validates claim dates now), #111 (R-501 job-description rule), #156 (its CI step is the R-505 gate).

## Alternatives
- Keep the per-issue process and add more parallel agents: tried under ADR-0022; usage ran out faster without fewer rounds.
- Drop review roles: rejected; it would lower the quality bar the client asked to keep.
