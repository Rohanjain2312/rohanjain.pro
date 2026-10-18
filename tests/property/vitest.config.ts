// QA suites: golden set, alias audit and fit-check properties (docs/spec/09-quality.md sections 9.4 and 9.5).
// Run from the repository root: `npm run test:property`.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/property/**/*.test.ts'],
  },
});
