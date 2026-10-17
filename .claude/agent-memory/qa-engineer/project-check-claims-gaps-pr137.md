---
name: check-claims-gaps-pr137
description: Known bypasses in scripts/check-claims.ts (R-301) at PR #137 head fd1148c, and the fixture harness approach used to find them
metadata:
  type: project
---

PR #137 (resume.json, check-claims) was approved with follow-ups. Bypasses confirmed with real-CLI fixtures at fd1148c:

- Any visible 1900 to 2099 number is treated as a year ("Served 2000 customers" passes).
- Global number set, not per claim: 26 integers in 0..100 and the phone digits are allowed on every page.
- Skipped or unread: `<noscript>` text, `title`/`placeholder`/`value` attributes, numbers with a leading letter ("x73") or leading dot (".73"). `--require-dist` accepts an empty dist.
- PDF text check is not built (waits for #5.8).

**Why:** R-301 is the truthfulness gate; each bypass is a path for an unclaimed number to reach the site.
**How to apply:** when a page with real copy lands, grep the built HTML for these forms by hand. Build the QA property test for the year and noscript cases (stryker target includes scripts/check-claims.ts). Reusable harness idea: write fixture dists to the scratchpad and run `node scripts/check-claims.ts --dist <fx> --content src/content` per case.

Related: [[project-qa-tooling-gaps]].
