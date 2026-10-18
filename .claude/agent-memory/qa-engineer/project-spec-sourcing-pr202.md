---
name: project-spec-sourcing-pr202
description: PR #202 (ADR-0028, synthetic golden set, head 5dcf4ff) review state and the open Mediums; gitleaks R-501 rule (#111) is the content-level control and is absent.
metadata:
  type: project
---

PR #202 (ADR-0028, closes #162) was reviewed at head 5dcf4ff with CHANGES REQUESTED. Mediums: (1) §9.4 item 2 gives App/Data the write to `tests/fixtures/golden/`, which R-112 denies (owners.json gives `tests/fixtures/**` to qa-engineer); (2) five stale real-posting, paraphrase or `postings/` instructions on main (app-data-engineer.md:23, fitcheck.md:5 and :15, external-validation SKILL.md:18, spec 01-product.md:48, spec 06-architecture.md:72); (3) ADR-0028 says the gitleaks and pre-commit rules need no exception, but the content check is absent (#111 OPEN, no `.gitleaks.toml`, gitleaks not on PATH, pre-commit R-501 block is path-only). Lows went to #163.

**Why:** the issue's test plan (gitleaks passes on golden fixtures) cannot run until #111 lands and fixtures exist. The path block never reads content, so the content control is the gitleaks rule alone.

**How to apply:** when re-reviewing #202 or any golden-set PR, check each Medium is fixed at the new head. Do not approve a golden fixture PR until `.gitleaks.toml` (#111) exists and gitleaks has run on the fixture. Re-probe R-112 after any owners.json change. See [[feedback-spec-change-sweep]].
