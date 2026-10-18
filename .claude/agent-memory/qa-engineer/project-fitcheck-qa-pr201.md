---
name: project-fitcheck-qa-pr201
description: Phase 3 PR A QA setup (golden set, rubric, properties, Stryker) and the tooling snags hit on the way
metadata:
  type: project
---

QA files for fit-check live in tests/property/ (golden, alias audit, properties), tests/fixtures/golden/ (postings, verdicts.json, samples.json), docs/qa/fit-rubric.md, stryker.config.mjs and stryker.config.other.mjs.

Snags:
- vitest.config.ts is not QA-owned (R-112), so the property suite has its own config and `test:property` is chained into `test` and `test:coverage` in package.json.
- A Stryker config must be named `stryker.config.*` to pass the ownership hook.
- fast-check and Stryker installed only with `npm install --legacy-peer-deps` (ERESOLVE on vitest 5.0.5); `npm ci` works afterwards. Stryker adds 2 moderate dev-only audit findings (qs, typed-rest-client).
- Stryker 10.0.0 with vitest 5.0.5 reports mutants as Survived with testsCompleted 0 although the unit tests kill them when the mutant is applied by hand. Treat its score as unreliable until investigated. Config and vitest files outside the repo fail to resolve `vitest/config`.
- Rubric v1 was committed before the engine ran. Four postings disagree with the engine (ai-02, ai-04, ml-01, neg-game); causes are aliases, extras and Unity being alias-only.

**Why:** next QA agent reviewing PR #201 or re-running mutation needs these without rediscovering them.
**How to apply:** read before touching Stryker or the golden set; check whether App/Data has applied the alias fixes listed in docs/qa/fit-rubric.md.
