// Vitest config used only by Stryker for the rest of src/lib/ and scripts/check-claims.ts.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    exclude: ['tests/unit/fitcheck-*.test.ts'],
    testTimeout: 60000,
  },
});
