// Vitest config used only by Stryker for src/lib/fitcheck/: the engine's unit tests plus the QA suites.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/fitcheck-*.test.ts', 'tests/property/**/*.test.ts'],
    testTimeout: 60000,
  },
});
