---
paths:
  - ".github/**"
  - ".husky/**"
  - "package.json"
  - "public/_headers"
---

# CI, dependencies and headers

- Checks to build and what each enforces: `docs/spec/10-cicd.md`. Rule IDs: `docs/rules.md`.
- Pin every Action to a full commit SHA with the version in a comment, and set `permissions: read-all` at workflow level (R-504).
- A dependency change needs a one-line justification in the PR (R-506).
- Header policy: `docs/spec/08-security.md` §8.2 (R-505).
- Changes to `.github/workflows/`, workflow scripts, the labeler config or `public/_headers` get Security review automatically (R-209, ADR-0026). Other `.claude/` and dependency changes get the combined QA review.
