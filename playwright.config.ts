import { defineConfig } from '@playwright/test';

// PW_E2E_PORT lets `npm run verify` use a free port, so two sessions can run the suite at once (190-s).
const port = Number(process.env['PW_E2E_PORT'] ?? 4321);

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env['CI'],
  reporter: 'list',
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    // Serves the existing dist/; run `npm run build` first (verify and CI do).
    command: `npx --no-install astro preview --port ${port}`,
    port,
    reuseExistingServer: !process.env['CI'],
    // Astro 7 backgrounds the preview server when it detects an AI agent; the test runner needs it in the foreground.
    env: { AI_AGENT: '', CLAUDECODE: '' },
  },
});
