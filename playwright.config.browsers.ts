// Cross-browser matrix (docs/spec/09-quality.md, issue #230). Run with `npm run test:browsers` after
// `npm run build` and `npm run browsers:install:all`. It runs the e2e headers suite and the Frontend suites
// (a11y, component) on Chromium, Firefox, WebKit and two mobile emulations (iPhone, Pixel).
// `npm run verify` stays Chromium-only and fast; the default configs are unchanged.
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const port = 4322;

// Tests that run in the chromium project only. Every entry states why.
const chromiumOnly = [
  // Screenshots: PNG baselines differ per engine and would churn the tracked captures.
  'visual/*.spec.ts',
  // This spec launches Chromium and WebKit itself (Firefox cannot print), so it already covers both engines.
  // Repeating it per project would only repeat the same two launches. Its PDF checks are Chromium-only
  // because Playwright can print a PDF only in Chromium.
  'component/brief-print.spec.ts',
];

const matrix = {
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
  // Mobile emulation: the iPhone profile runs WebKit with touch and a 390 px viewport; the Pixel runs Chromium.
  iphone: devices['iPhone 15'],
  pixel: devices['Pixel 7'],
};

export default defineConfig({
  testDir: 'tests',
  testMatch: ['e2e/*.spec.ts', 'a11y/*.spec.ts', 'component/*.spec.ts', 'visual/*.spec.ts'],
  forbidOnly: !!process.env['CI'],
  retries: 0,
  // Four workers overload the single preview server and the for.spec site build, which gives connection refused
  // and one intermittent failure. Two workers were stable.
  workers: 2,
  reporter: [['list'], ['json', { outputFile: 'test-results/browsers.json' }]],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...Object.entries(matrix).map(([name, device]) => ({
      name,
      use: { ...device },
      testIgnore: chromiumOnly,
    })),
  ],
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    // --no-upgrade drops only `upgrade-insecure-requests`: WebKit would otherwise upgrade http://localhost
    // subresources to https, which the local preview cannot serve. The headers spec starts its own server
    // with the full CSP and is not affected by this flag.
    command: `node scripts/preview.mjs --port ${port} --dir dist --no-upgrade`,
    url: `http://localhost:${port}/`,
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    reuseExistingServer: !process.env['CI'],
  },
});
