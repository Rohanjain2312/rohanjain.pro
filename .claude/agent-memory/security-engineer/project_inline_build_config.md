---
name: inline-build-config
description: PR #89 review (2026-10-16): spec now forbids CSP hashes, so Astro must be configured to emit no inline style or script; carry into #18 and #29
metadata:
  type: project
---

PR #89 (approved at f98f91e) removed the "use build-time hashes" fallback from 08-security §8.2. Astro 7.4.0 defaults `build.inlineStylesheets` to `auto` (inlines stylesheets under 4 kB), and `astro.config.mjs` set only `output: 'static'`.

**Why:** the spec now says the build emits no inline script or style except the JSON-LD data block, but nothing in config enforces it yet. Rated Low (L1) because no page exists.

**How to apply:** when reviewing #18 (CSP) and the first page PR, check `build.inlineStylesheets: 'never'` and `vite.build.assetsInlineLimit`, and scan built HTML for inline `<style>`, `style=` and any inline `<script>` whose type is not exactly `application/ld+json`. Check #29 asserts the same. JSON-LD must escape `<` as `<`. See [[inline-rule-jsonld]].
