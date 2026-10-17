# Frontend tests

Run `npm run build` first. These suites serve `dist/` through `scripts/preview.mjs`, which applies the real CSP.

```
npm run test:frontend
```

This runs axe (`tests/a11y/`), behavior and layout checks (`tests/component/`) and screenshot capture (`tests/visual/`, output in `tests/visual/screenshots/`). CI wiring is in PR B (Platform).

## Lighthouse (mobile, local)

Serve `dist/` with gzip, as Cloudflare Pages will. `scripts/preview.mjs` does not compress, which adds about 0.3 s to LCP. Then run, per page:

```
npx --yes lighthouse@latest http://localhost:PORT/ --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=lh-home.json
```

Run on 2026-10-17 with Lighthouse 13.5.0, mobile defaults, gzip static server:

| Page        | Performance | Accessibility | Best practices | SEO | LCP   | CLS | TBT  |
| ----------- | ----------- | ------------- | -------------- | --- | ----- | --- | ---- |
| `/`         | 100         | 100           | 100            | 100 | 1.5 s | 0   | 0 ms |
| `/privacy/` | 100         | 100           | 100            | 100 | 1.4 s | 0   | 0 ms |
| `/404.html` | 100         | 100           | 100            | 60  | 1.5 s | 0   | 0 ms |

The 404 SEO score is the `is-crawlable` audit: the page carries `noindex` and returns status 404 on purpose. Skip the SEO category for it in any budget file.

Without compression (`scripts/preview.mjs`) home LCP is 1.81 s and the 15 kB stylesheet is the render-blocking resource.
