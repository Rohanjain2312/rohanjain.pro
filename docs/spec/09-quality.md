# Quality engineering

Test strategy, budgets, golden postings, mutation and property tests. Owned by QA with the builders.

### 9.1 Test strategy
| Level | Tool | Owner | Covers |
|---|---|---|---|
| Unit | Vitest | App/Data | Fit-check engine, slugs, formatting, validators; 90%+ coverage on `src/lib/` |
| Content | Zod + scripts | App/Data | Schema validity, references between files, tiers and evidence |
| Truthfulness | `scripts/check-claims.ts` | App/Data builds, QA verifies | Every number in built HTML and PDFs maps to a claim |
| Claim verification | Manual re-derivation from sources, logged | QA | Every claim matches its source or its client decision |
| Acceptance | Playwright, written from acceptance criteria | QA | Each issue's criteria, independent of the builder |
| Mutation | StrykerJS (Vitest runner) | QA | Tests actually catch bugs in `src/lib/` (§9.5) |
| Property | fast-check | QA | Fit-check invariants (§9.5) |
| Copy lint | `scripts/lint-copy.mjs` | QA | No em dashes, banned hype words, work-authorization terms, or inconsistent location, titles and years across site and PDFs |
| Component | Vitest + Astro container API | Frontend | Cards, folds, report, brief |
| End-to-end | Playwright | Frontend + B | Home, folds, each sample, brief, résumé tabs and PDFs, keyboard-only path, `/for` page, 404 |
| Visual regression | Playwright screenshots | Frontend, baselines approved by Design Lead | 390, 768, 1280 px |
| Accessibility | axe-core; scripted keyboard checks; manual screen reader notes where Claude Code can run them | Frontend | Zero violations |
| Performance | Lighthouse CI with budgets | Platform | Section 9.3 |
| Links | lychee | Platform | No broken links |
| HTML | html-validate | Platform | Valid markup |
| Security | gitleaks, CodeQL, OSV, npm audit, ZAP baseline | Security | Section 8 |

### 9.2 Code quality
ESLint (security and a11y plugins), Prettier, `astro check`, `tsc --noEmit`, Stylelint; Husky + lint-staged pre-commit (format, lint, gitleaks, JD-file block); commitlint. One command `npm run verify` runs everything CI runs.

### 9.3 Performance budgets (Lighthouse CI asserts, mobile)
Performance 95+, Accessibility 100, Best Practices 100, SEO 100. LCP < 1.8 s, CLS < 0.05, TBT < 100 ms. Home page JS < 30 KB gzipped; CSS < 20 KB gzipped; fonts < 120 KB total; each figure image < 120 KB.

### 9.4 Golden job postings (App/Data Engineer, Phase 3)
Claude Code builds the golden test set itself; the client is not asked.
1. Write at least 18 synthetic US job postings from scratch (ADR-0028): 4 AI Engineer, 4 ML Engineer, 4 Data Scientist, plus 6 negative controls (3 clearly unrelated, for example iOS or hardware, and 3 adjacent, for example data engineer, analytics engineer, backend engineer). App/Data may read real postings to keep the wording realistic, but nothing from a real posting is stored: no text, paraphrase, URL, date or company name.
2. For each, store in `tests/fixtures/golden/<id>.json`: id, role family, a made-up generic company descriptor (for example "fintech, NYC") and a `requirements` list of short strings in Claude Code's own words. Never use a path named `postings/` (R-501).
3. Before the engine exists, QA and the Reader Advocate assign an expected verdict to each synthetic posting using a written rubric (`docs/qa/fit-rubric.md`) based on the Evidence Ledger, and commit it. The App/Data Engineer does not set expected verdicts.
4. Golden tests assert: each expected verdict, the three on-site samples, and that every negative control returns "Not a strong fit".
5. If the engine disagrees with the rubric, fix aliases or tiers first. Change thresholds only with an ADR.
6. **Alias audit (QA):** for each alias, count how many negative-control postings it matches. Any alias that matches more than a third of them is too broad and must be removed or made more specific. Known suspects in the seed list: "production", "deploy", "tools", "search", "analysis", "analytics", "metrics", "agents", "documents", "pipelines", "evaluation", "stakeholders", "containers".
7. Real recruiter ratings (skill `external-validation`) replace the rubric as ground truth once they arrive.

### 9.5 Mutation and property-based testing (QA, Phase 3)
- StrykerJS with the Vitest runner on `src/lib/` and `scripts/check-claims.ts`. Thresholds: high 90, low 80, break 80 for `src/lib/fitcheck/`; break 70 elsewhere. Runs incrementally on PRs that touch `src/lib/` and in full nightly.
- fast-check properties for the engine, each run with at least 1,000 generated cases:
  1. Deterministic: the same input always gives the same report.
  2. Studied-tier skills never appear as proven.
  3. Invariant to letter case, extra whitespace and Unicode-equivalent forms.
  4. Appending text with no skill terms never changes the result.
  5. Adding a proven skill's alias never lowers the proven count; adding a gap term never raises the verdict.
  6. Any input longer than 8,000 characters gives the same result as its first 8,000.
  7. Any input up to 8,000 characters finishes in under 50 ms.
  8. The verdict always matches the documented thresholds for its counts.
  9. Rendering any generated string (including HTML and script payloads) adds no elements to the page (component test).

### 9.6 Seeded-defect audits
Procedure and categories: skill `seeded-defect-audit`. Audit 1 ran at Phase 1; no later audits (R-704 retired, ADR-0026).

### 9.7 External validation
5-second and first-click test, recruiter fit ratings, and reply-rate tracking: skill `external-validation`. Pass criteria are success criterion 9 in `docs/spec/01-product.md`.
