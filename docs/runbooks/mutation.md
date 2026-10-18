# Mutation testing (R-702)

Commands, from the repository root. Both are slow and are not part of `npm run verify`.

- `FC_RUNS=100 npm run mutation` mutates `src/lib/fitcheck/` (break 80). About 9 minutes. Drop `FC_RUNS` for the full 1,000-case property run.
- `npm run mutation:other` mutates the rest of `src/lib/` and `scripts/check-claims.ts` (break 70).

Reports: `reports/mutation/*.html` and `*.json` (git-ignored).

## Why the command runner

`@stryker-mutator/vitest-runner` 10.0.0 does not work with Vitest 5.0.5. It filters tests per mutant with a name pattern that joins suite and test names with a space. Vitest 5 joins them with " > ", so any test inside a `describe` matches nothing. Mutants covered only by such tests report "Survived" with 0 tests run, and the score is too low. Upstream: stryker-js issue 6210 and open PRs 6214, 6220, 6247. Debug logging also crashes with a circular-JSON error on Vitest 5.

The npm scripts therefore pass `--testRunner command --coverageAnalysis off`. Stryker runs `npm test` once per mutant, so every mutant is tested against the whole suite. The `vitest:` blocks in the config files are ignored in this mode.

Return to `perTest` with the vitest runner once a stryker-js release fixes #6210. Then confirm the JSON report has no "Survived" mutant with `testsCompleted: 0`.

## Install

`npm ci` works without `--legacy-peer-deps`. No `overrides` are needed.

## Result (fit-check, 2026-10-17, head 1044453, FC_RUNS=100)

Total 82.46, break 80 passed. analyze.ts 95.00, matcher.ts 74.85, normalize.ts 80.00, thresholds.ts 100.00. `extras.ts`, `samples.ts` and `index.ts` are excluded by the config.
