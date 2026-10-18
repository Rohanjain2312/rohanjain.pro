# Mutation testing (R-702)

Commands, from the repository root. Both are slow and are not part of `npm run verify`.

- `FC_RUNS=100 npm run mutation` mutates `src/lib/fitcheck/` (break 80). Runtime is roughly 9 to 10 minutes. Drop `FC_RUNS` for the full 1,000-case property run.
- `npm run mutation:other` mutates the rest of `src/lib/` and `scripts/check-claims.ts` (break 70).

Reports: `reports/mutation/*.html` and `*.json` (git-ignored).

## Scores must come from a clean run

Stryker runs in incremental mode (`incremental: true` in both config files). A warm `.stryker-tmp` cache reuses earlier results. In our runs, a warm cache gave a higher score than clean runs. Two clean runs scored 79.65.

Both npm scripts now delete `.stryker-tmp` first and pass `--force`, so the run always tests every mutant. If you run `npx stryker run` by hand, clear the cache first:

```sh
rm -rf .stryker-tmp reports
npm run mutation
```

Do not quote a score from a run that reused the cache.

## Recorded scores

The score for each run is recorded in the PR and in the phase gate record. Each record gives the date, the head SHA and the run settings. This runbook does not keep a score.

## Why the command runner

`@stryker-mutator/vitest-runner` 10.0.0 does not work with Vitest 5.0.5. It filters tests per mutant with a name pattern that joins suite and test names with a space. Vitest 5 joins them with " > ", so any test inside a `describe` matches nothing. Mutants covered only by such tests report "Survived" with 0 tests run, and the score is too low. Upstream: stryker-js issue 6210 and open PRs 6214, 6220, 6247. Debug logging also crashes with a circular-JSON error on Vitest 5.

The npm scripts therefore pass `--testRunner command --coverageAnalysis off`. Stryker runs `npm test` once per mutant, so every mutant is tested against the whole suite. The `vitest:` blocks in the config files are ignored in this mode.

Return to `perTest` with the vitest runner once a stryker-js release fixes #6210. Then confirm the JSON report has no "Survived" mutant with `testsCompleted: 0`.

Expect the command runner to take roughly 9 to 10 minutes for `npm run mutation`. It runs the full test suite once per mutant.

## Install

Run `npm ci`. It works without `--legacy-peer-deps`.

`package.json` has an `overrides` entry that pins `qs` to 6.16.0. The entry was added under R-507 (OSV finding, commit bdeee22). `qs` comes in through `@stryker-mutator/core`, then `typed-rest-client`. Remove the entry only after that chain resolves to 6.16.0 or later without it. Check with `npm ls qs`.
