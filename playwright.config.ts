import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env['CI'],
  reporter: 'list',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    // Serves the existing dist/; run `npm run build` first (verify and CI do).
    command: 'npx --no-install astro preview',
    port: 4321,
    reuseExistingServer: !process.env['CI'],
    // Astro 7 backgrounds the preview server when it detects an AI agent; the test runner needs it in the foreground.
    env: { AI_AGENT: '', CLAUDECODE: '' },
  },
});
