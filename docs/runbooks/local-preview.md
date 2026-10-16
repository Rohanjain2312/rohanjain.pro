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

## Limits

No `!` header detach and no redirects (see `public/_redirects`). Browsers ignore HSTS over plain HTTP.
