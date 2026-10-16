# HTTP security headers: rationale

Policy of record for `public/_headers`. Source: `docs/spec/08-security.md` 8.2. Owner: Security. Issue #18.

## Content-Security-Policy

| Directive                   | Value                | Why                                                                                         |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `default-src`               | `'none'`             | Deny by default. Every needed type is listed below.                                         |
| `script-src`                | `'self'`             | Only bundled scripts. No `'unsafe-inline'`, `'unsafe-eval'` or hashes (R-505).              |
| `style-src`                 | `'self'`             | Only external stylesheets. No inline `<style>` or `style=` attributes.                      |
| `img-src`                   | `'self' data:`       | Local images and small inline data URIs.                                                    |
| `font-src`                  | `'self'`             | Self-hosted fonts only.                                                                     |
| `connect-src`               | `'self'`             | The fit check runs in the browser; no third-party calls. Phase 7 adds the analytics origin. |
| `frame-src`                 | `https://*.hf.space` | The one allowed embed: the live demo on Hugging Face Spaces.                                |
| `frame-ancestors`           | `'none'`             | No site may frame this one (clickjacking). Pairs with `X-Frame-Options`.                    |
| `base-uri`                  | `'none'`             | Blocks `<base>` injection.                                                                  |
| `form-action`               | `'none'`             | The site has no form posts.                                                                 |
| `manifest-src`              | `'self'`             | Web manifest from the same origin.                                                          |
| `upgrade-insecure-requests` | n/a                  | Upgrades any stray `http:` subresource.                                                     |

### Inline rule

The build must emit no inline script and no inline style. The one exception is the JSON-LD block, `<script type="application/ld+json">`. It is a data block. Browsers do not execute it, and `script-src` does not apply to it, so it needs no hash.

Consequence for the build: Astro inlines small stylesheets by default (`build.inlineStylesheets: 'auto'`). That would emit `<style>` and break `style-src 'self'`. Platform must set `build.inlineStylesheets: 'never'` in `astro.config.mjs`. The site uses no hydrated islands, so Astro emits no inline hydration scripts. The QA headers/HTML test (#29) fails on any inline `<script>` that is not JSON-LD, any `<style>`, and any `style=`.

## Other headers (all routes)

| Header                         | Value                                                           | Why                                                                                              |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `X-Content-Type-Options`       | `nosniff`                                                       | Stops MIME sniffing.                                                                             |
| `X-Frame-Options`              | `DENY`                                                          | Legacy clickjacking defence for browsers that ignore `frame-ancestors`.                          |
| `Referrer-Policy`              | `strict-origin-when-cross-origin`                               | Sends only the origin cross-site, and nothing on downgrade. Keeps `/for/<slug>` out of referrers. |
| `Permissions-Policy`           | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | The site uses none of these.                                                                     |
| `Cross-Origin-Opener-Policy`   | `same-origin`                                                   | Isolates the browsing context group.                                                             |
| `Cross-Origin-Resource-Policy` | `same-origin`                                                   | Other origins cannot embed this site's resources.                                                |

## Per-route headers

| Route      | Header                            | Why                                                                            |
| ---------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `/for/*`   | `X-Robots-Tag: noindex, nofollow` | Per-application pages are for one recipient. Search engines must not list them. |
| `/for/*`   | `Cache-Control: no-store`         | Keeps these pages out of shared and browser caches.                            |
| `/print/*` | `X-Robots-Tag: noindex, nofollow` | Print views duplicate the main pages.                                          |

Résumé PDFs stay indexable (client decision). The `/*` rule and the path rules both apply. The path headers do not overlap the `/*` set, so nothing is joined.

## Deferred to Phase 7

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. Browsers ignore it over plain HTTP, and `includeSubDomains; preload` is hard to undo. Submit to the preload list after 30 stable days.
- Cloudflare Web Analytics origins in `script-src` and `connect-src`.

Both are noted in a comment at the top of `public/_headers`.

## Open points

- `/og` is not defined in the spec yet. If an OG image route is added, Security reviews whether it needs `X-Robots-Tag`.

## Verify

```
npm run build
npm run preview
curl -I http://localhost:4321/
curl -I http://localhost:4321/for/x
curl -I http://localhost:4321/print/x
```
