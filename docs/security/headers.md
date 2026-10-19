# HTTP security headers: rationale

Policy of record for `public/_headers`. Source: `docs/spec/08-security.md` 8.2. Owner: Security. Issue #18.

## Content-Security-Policy

| Directive                   | Value                | Why                                                                                         |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `default-src`               | `'none'`             | Deny by default. Every needed type is listed below.                                         |
| `script-src`                | `'self'` and the Web Analytics beacon (two forms) | Bundled scripts, plus Cloudflare's beacon (Phase 7, below). No `'unsafe-inline'`, `'unsafe-eval'` or hashes (R-505). |
| `style-src`                 | `'self'`             | Only external stylesheets. No inline `<style>` or `style=` attributes.                      |
| `img-src`                   | `'self' data:`       | Local images and small inline data URIs.                                                    |
| `font-src`                  | `'self'`             | Self-hosted fonts only.                                                                     |
| `connect-src`               | `'self'`             | The fit check runs in the browser; no third-party calls. The automatic beacon reports to this domain, so it stays `'self'` (Phase 7, below). |
| `frame-src`                 | `https://*.hf.space` | The one allowed embed: the live demo on Hugging Face Spaces.                                |
| `frame-ancestors`           | `'none'`             | No site may frame this one (clickjacking). Pairs with `X-Frame-Options`.                    |
| `base-uri`                  | `'none'`             | Blocks `<base>` injection.                                                                  |
| `form-action`               | `'none'`             | The site has no form posts.                                                                 |
| `manifest-src`              | `'self'`             | Web manifest from the same origin.                                                          |
| `require-trusted-types-for` | `'script'`           | Blocks string-to-code DOM sinks (`innerHTML`, `eval`, script `src`) unless a policy approves. |
| `upgrade-insecure-requests` | n/a                  | Upgrades any stray `http:` subresource.                                                     |

### Trusted Types (issue #241, 232-L1)

`require-trusted-types-for 'script'` is on. It is defence in depth: `src/` has no DOM sink (no `innerHTML`, `outerHTML`, `insertAdjacent*`, `document.write`, `eval`, `new Function`, `set:html`). The code uses `textContent`, `replaceChildren`, `setAttribute('sandbox', ...)` and `iframe.src`; none of these is a Trusted Types sink, so no policy is needed and the CSP has no `trusted-types` directive.

Checked on 2026-10-18 in Chromium against `npm run preview` with the real header: the Frontend suite (`npm run test:frontend`, `tests/component`, 105 passed) and a probe that loaded `/`, `/privacy/`, `/for/`, `/404.html` and `/print/resume/ml/`, ran the fit check, opened the brief, demo and résumé dialogs and loaded the demo iframe. No console error, page error or `securitypolicyviolation` event came from Trusted Types. Browsers without Trusted Types (Firefox, older Safari) ignore the directive; the other directives still apply.

Rule for new code: a new sink needs a Security review first and, if unavoidable, a named `trusted-types` policy.

### Inline rule

The build must emit no inline script and no inline style. The one exception is the JSON-LD block, `<script type="application/ld+json">`. It is a data block. Browsers do not execute it, and `script-src` does not apply to it, so it needs no hash.

Consequence for the build: Astro 7.4.0 inlines small stylesheets by default (`build.inlineStylesheets: 'auto'`) and inlines small bundled scripts through Vite's asset inline limit. Either would emit inline `<style>` or `<script>` and break `style-src 'self'` or `script-src 'self'`. Platform must set both in `astro.config.mjs`:

- `build.inlineStylesheets: 'never'`
- `vite.build.assetsInlineLimit: 0`

Both are Platform-owned; Security does not edit `astro.config.mjs`. Any other inline script, such as one that Astro emits for a client directive, is also a violation. The QA headers/HTML test (#29) fails on any inline `<script>` that is not JSON-LD, any `<style>`, and any `style=`.

## Other headers (all routes)

| Header                         | Value                                                           | Why                                                                                              |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Strict-Transport-Security`    | `max-age=63072000; includeSubDomains; preload`                  | Two years of HTTPS only, subdomains included (Phase 7). Not submitted to the preload list yet.    |
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

`/for` and `/print` (no trailing slash) have their own rules with the same headers, because `/for/*` does not match the bare path.

Résumé PDFs stay indexable (client decision). The `/*` rule and the path rules both apply. The path headers do not overlap the `/*` set, so nothing is joined.

## Phase 7 additions (issue #283)

### Strict-Transport-Security

`max-age=63072000; includeSubDomains; preload` on every route. Browsers ignore it over plain HTTP. `includeSubDomains; preload` is hard to undo, so the site is not submitted to the preload list until it has been stable for 30 days (Phase 8). Any subdomain of `rohanjain.pro` must serve HTTPS from now on. The `*.pages.dev` hostname of the Pages project also receives the header; it only pins that host.

### Cloudflare Web Analytics

Cloudflare injects the beacon at the edge (automatic setup; the setup command called the API with `auto_install: true`), so the site's HTML has no script tag for it and the repo needs no tag or site token. Cloudflare's docs: automatic setup is on by default for proxied sites and a `Cache-Control: public, no-transform` response header would stop the injection (https://developers.cloudflare.com/web-analytics/get-started/). The site sends no `no-transform`.

Origins, from Cloudflare's CSP guidance (https://developers.cloudflare.com/web-analytics/faq/, "Content Security Policy"):

- `script-src` gets `https://static.cloudflareinsights.com/beacon.min.js`, as the page shows, and the same with a trailing slash. A path source matches that file only; the slash form matches a versioned path under it. The versioned form is not in the docs and is unverified until the first deploy shows the injected tag, so both are listed. No wildcard, no host-wide source.
- `connect-src` stays `'self'`. The page says automatic injection reports to the same domain. `https://cloudflareinsights.com` is for the manual snippet only and is not added.

Checked on 2026-10-19 by downloading `https://static.cloudflareinsights.com/beacon.min.js` (version string `2026.10.1`, 31,853 bytes) as data and reading it, without running it:

- No `document.cookie`, `localStorage` or `sessionStorage` use. This agrees with Cloudflare's statement that Web Analytics "does not use any client-side state, such as cookies or localStorage" (https://www.cloudflare.com/web-analytics/).
- No `createElement`, `innerHTML`, `outerHTML`, `insertAdjacent*`, `document.write`, `eval` or `new Function`, so it needs no Trusted Types policy under `require-trusted-types-for 'script'`.
- It sends with `navigator.sendBeacon` or `XMLHttpRequest` to the relative path `/cdn-cgi/rum`. The only absolute URL in the file is `https://cloudflareinsights.com/cdn-cgi/rum`, used when `__cfBeacon.version` is unset (the manual snippet).

Still to check at the first deploy (launch checklist, `docs/spec/12-operations.md`): the injected tag's `src`, a visit counted in the dashboard, no `Set-Cookie`, and no CSP or Trusted Types violation in the console. If the `src` is not covered by the two sources, change `_headers` and the headers test together.

The headers test (`tests/e2e/headers-checks.ts`, QA) and `docs/spec/08-security.md` 8.2 carry the same values; they are owned by QA and the Supervisor and change in the same PR.

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
