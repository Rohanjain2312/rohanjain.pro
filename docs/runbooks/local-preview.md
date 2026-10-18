# Local preview runbook

`npm run preview` serves `dist/` on `http://localhost:4321` with production headers emulated (N-10, 8.2).

```
npm run build
npm run preview            # --port 4400 and --dir <path> are optional
```

## How headers are applied

- `scripts/preview.mjs` reads `dist/_headers` (copied from `public/_headers` by the build), falling back to `public/_headers`.
- It parses the Cloudflare format: unindented path patterns, indented `Name: value` lines, `#` comments.
- Patterns support `*` (splat) and `:placeholder`. All matching rules apply. A repeated header name is joined with `, `.
- No header value lives in code. Edit `public/_headers` (owned by Security) and rebuild.
- Headers are also sent on 404 responses.

## Check

```
curl -I http://localhost:4321/
curl -I http://localhost:4321/for/x     # expect X-Robots-Tag and Cache-Control: no-store
curl -I http://localhost:4321/print/x   # expect X-Robots-Tag
```

Unit test: `tests/unit/preview.test.ts` (fixture is inline).

## Flags

- `--gzip` compresses text responses when the client accepts gzip, as Cloudflare Pages does. `npm run lighthouse` uses it.
- `--no-upgrade` removes only `upgrade-insecure-requests` from the CSP. WebKit upgrades `http://localhost` subresources to https under that directive and the preview cannot serve https. Only the cross-browser run uses it.

## Cross-browser run

```
npm run browsers:install:all   # chromium, firefox, webkit
npm run build
npm run test:browsers          # all projects, 2 workers
npx playwright test --config playwright.config.browsers.ts --project=webkit   # one project
```

`playwright.config.browsers.ts` runs the e2e headers, a11y, component and visual specs on chromium, firefox, webkit, iphone (iPhone 15, WebKit) and pixel (Pixel 7, Chromium). Screenshots and `brief-print` are chromium-only, with the reason in the config. `npm run verify` stays Chromium-only. Use 2 workers: 4 overload the one preview server.

## Lighthouse budgets

```
npm run lighthouse             # builds, serves dist/ with gzip, mobile Lighthouse x3 per page, median asserted
npm run lighthouse -- --runs 5 # odd values only
```

Budgets are in `.github/lighthouse-budgets.json` (9.3, R-607). Lighthouse is pinned in `package.json`. It uses the Chromium that Playwright installed. Results vary by session: home LCP measured 1806 to 1810 ms in one session and about 1665 ms in another, against the 1800 ms budget, so it passes or fails by session. TBT can spike on a loaded machine. A run with a Lighthouse error or a missing metric is dropped; a page needs at least 2 valid runs of 3. The median is taken over valid runs. Asserted: the four scores, LCP, CLS and TBT. **Not asserted:** the 9.3 size budgets (JS 30 KB, CSS 20 KB, fonts 120 KB, images 120 KB gzipped); check them by hand until an issue adds them.

## Limits

No `!` header detach and no redirects (see `public/_redirects`). Browsers ignore HSTS over plain HTTP.
