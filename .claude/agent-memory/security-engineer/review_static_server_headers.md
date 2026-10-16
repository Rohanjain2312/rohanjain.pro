---
name: review-static-server-headers
description: Probe list for local static servers or header emulators (PR #120 preview.mjs): path canonicalization mismatch, bind address, missing headers file
metadata:
  type: feedback
---

When reviewing a server that applies headers per route (scripts/preview.mjs, #17), probe the real server with `http.request`, not only the parser unit.

**Why:** In PR #120 (head 18cedca, 2026-10-16) headers matched the raw URL path but the file came from the decoded path. `/%66or/x` served the /for page without `X-Robots-Tag` or `no-store`. Phase 6 scans (8.9) run against this server, so fidelity matters. Also `listen(port)` bound to `*` where `astro preview` binds to localhost.

**How to apply:**
- Send `/%66or/x`, `/for%2fx`, `//for/x`, `/FOR/x` (macOS is case-insensitive), `/x?q`, trailing slash, and a 404 under `/for/`. Headers must match the same canonical path used to pick the file.
- Check traversal with `..%2f`, sibling-prefix dir (`dist2`), `%00`, malformed `%`.
- Check `lsof -iTCP:<port>` for bind address.
- Check behaviour when `_headers` is absent (silent no-header server = false pass).
- Rated Low, changes requested (outcome to check on re-review). See [[severity-calibration]].
