// Mutation testing for the fit-check engine (docs/spec/09-quality.md section 9.5, R-702).
// Thresholds: high 90, low 80, break 80. Run from the repository root: `npx stryker run`.
// Property tests run 1,000 cases by default. For a faster mutation run, `FC_RUNS=100 npx stryker run`
// lowers the case count of the property suite only; CI and `npm test` always use the default.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  vitest: { configFile: 'tests/property/vitest.stryker.config.ts' },
  mutate: [
    'src/lib/fitcheck/**/*.ts',
    '!src/lib/fitcheck/samples.ts',
    '!src/lib/fitcheck/index.ts',
    // extras.ts is a table of strings. Its terms are exercised by the golden set and the alias audit.
    '!src/lib/fitcheck/extras.ts',
  ],
  coverageAnalysis: 'perTest',
  thresholds: { high: 90, low: 80, break: 80 },
  // No incremental cache: a score must come from a clean run, never from reused results.
  incremental: false,
  tempDirName: '.stryker-tmp/sandbox-fitcheck',
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/fitcheck.html' },
  jsonReporter: { fileName: 'reports/mutation/fitcheck.json' },
  timeoutMS: 20000,
  concurrency: 4,
  disableTypeChecks: true,
};
