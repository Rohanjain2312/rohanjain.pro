---
name: project-gate-state
description: Which QA gates exist on main and which are missing, as of 2026-10-16. Use to decide which checks are real and which need a substitute.
metadata:
  type: project
---

State as of 2026-10-16 (main at 5619558, after #85):

- `npm run verify` runs: docs lint, format check (Prettier, added by #85), eslint, stylelint, lint self-test, astro check and tsc, unit tests, build, e2e.
- No link checker runs. Lychee is not installed, and CI (#13) is still open.
- No copy lint exists. `scripts/lint-copy` is not on main. QA owns it under issue #27, which is open. The spec (`docs/spec/09-quality.md`) names it `lint-copy.ts`. QA ownership names `.mjs`. Settle the name when #27 lands.
- SECURITY.md is listed in the spec's documentation set but does not exist. Tracked by issue #96.
- Dev server returns 404 at `/` until issue #21 adds the first page.

**Why:** Reviews that rely on a missing gate silently skip a test. Record the substitute checks each time.

**How to apply:** Where a gate is missing, run an equivalent check and say so in the review. Once #13 or #27 lands, switch the review to the real gate. See [[verify-on-rebased-merge]].
