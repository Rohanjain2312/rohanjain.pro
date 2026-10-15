---
paths:
  - "tests/**"
  - "stryker.config.*"
  - "vitest.config.*"
  - "playwright.config.*"
---

# Tests

- **R-701** Never weaken or delete a test to get a build to pass; removing a test file requires QA review.
- Ownership: `tests/unit/` App/Data; `tests/visual/`, `tests/a11y/`, `tests/component/` Frontend; `tests/e2e/`, `tests/property/`, `tests/fixtures/` QA.
- Strategy, thresholds and budgets: `docs/spec/09-quality.md`.
- A failing test is information. Fix the code, or open an issue for the test's owner.
