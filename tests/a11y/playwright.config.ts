// Playwright config for the Frontend suites: accessibility (axe), component behavior and visual capture.
// Run with `npm run test:frontend` after `npm run build`. It serves dist/ through scripts/preview.mjs, which
// applies the real CSP from public/_headers, so an inline style or script would be blocked here as in production.
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const port = 4322;

export default defineConfig({
  testDir: '..',
  testMatch: ['a11y/*.spec.ts', 'component/*.spec.ts', 'visual/*.spec.ts'],
  forbidOnly: !!process.env['CI'],
  reporter: 'list',
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: `node scripts/preview.mjs --port ${port} --dir dist`,
    url: `http://localhost:${port}/`,
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    reuseExistingServer: !process.env['CI'],
  },
});
