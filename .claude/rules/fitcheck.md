---
paths:
  - "src/lib/fitcheck/**"
  - "tests/property/**"
  - "tests/fixtures/postings/**"
  - "src/content/skills.json"
---

# Fit-check engine

- Spec: `docs/spec/06-architecture.md` §5.4. Golden set and alias audit: `docs/spec/09-quality.md` §9.4. Properties: §9.5.
- Enforced here by checks: purity (R-401), no RegExp from input (R-402), studied never proven (R-403), threshold ADR (R-404), text-only rendering (R-405), alias breadth (R-406).
- **R-407** How to tune the engine: fix aliases and tiers first; thresholds last.
- Known overly broad aliases from the seed list, to fix in Phase 3: "production", "deploy", "tools", "search", "analysis", "analytics", "metrics", "agents", "documents", "pipelines", "evaluation", "stakeholders", "containers".
- Expected verdicts in `tests/fixtures/postings/` belong to QA. If you think one is wrong, open an issue for QA.
