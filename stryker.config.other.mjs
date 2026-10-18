// Mutation testing for the rest of src/lib/ and scripts/check-claims.ts (docs/spec/09-quality.md section 9.5, R-702).
// Threshold: break 70. Run from the repository root: `npx stryker run stryker.config.other.mjs`.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  vitest: { configFile: 'tests/property/vitest.stryker.other.config.ts' },
  mutate: ['src/lib/**/*.ts', '!src/lib/fitcheck/**', 'scripts/check-claims.ts'],
  coverageAnalysis: 'perTest',
  thresholds: { high: 85, low: 75, break: 70 },
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental-other.json',
  tempDirName: '.stryker-tmp/sandbox-other',
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/other.html' },
  jsonReporter: { fileName: 'reports/mutation/other.json' },
  timeoutMS: 20000,
  concurrency: 4,
  disableTypeChecks: true,
};
