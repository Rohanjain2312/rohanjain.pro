---
name: lint-gate-gaps-pr85
description: Known bypasses in the ESLint R-405/R-401 and Stylelint R-601/R-608 gates as of PR #85 (head f83acfc), to re-check when rules change
metadata:
  type: project
---

PR #85 (lint, format, style gates) was approved with follow-ups. Known bypasses at f83acfc:

- R-405 `no-restricted-syntax` selectors miss computed keys (`el["innerHTML"] = x`), destructuring targets, `window.document.write`, `(0, eval)()`, `globalThis.Function`, string timers, and aliased storage.
- R-401 override glob is `*.{js,mjs,ts}` only; `.tsx`, `.cjs`, `.astro` escape. Dynamic `import("node:fs")` and `Intl.DateTimeFormat` without a date are not banned.
- Stylelint R-608 regex is case sensitive (`300MS` passes); `BOX-SHADOW` upper case passes; `url(red.png)` is a named-color false positive; `lint:css` scans `src/**` only.
- Self-test fixtures live in `.github/lint-fixtures/` (Platform cannot write `tests/`); the a11y case only asserts any message exists.

**Why:** The lint rules are part of the XSS defense (docs/spec/08-security.md section 8.3), so bypass forms matter once real components exist.

**How to apply:** On any PR that adds components, fitcheck code or CSS, grep for these forms by hand. When property tests (R-405 render test) land, confirm they cover the bypass forms. Re-run `/private/tmp` style probes against the real configs after any lint config change. Check CI (#13) runs `npm run lint:selftest`.

Related: [[project-qa-tooling-gaps]].
