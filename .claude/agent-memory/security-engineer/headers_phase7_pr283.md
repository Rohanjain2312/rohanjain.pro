---
name: headers-phase7-hsts-analytics
description: Issue #283 (HSTS plus Web Analytics CSP): decisions, the R-112 split with QA and the Supervisor, and what to check at first deploy
metadata:
  type: project
---

Issue #283 (branch `security/283-hsts-analytics`): HSTS added to `/*`; `script-src` gets `https://static.cloudflareinsights.com/beacon.min.js` and the same with a trailing slash; `connect-src` stays `'self'`.

**Why:** Cloudflare's CSP guidance says automatic injection reports to the site's own `/cdn-cgi/rum`, and `cloudflareinsights.com` is for the manual snippet only. I downloaded `beacon.min.js` as data and read it: no cookie or storage use, no Trusted Types sink, the only absolute URL is the manual-mode one. The docs show the path form; the versioned `/beacon.min.js/v...` form is from memory and unverified, so both path sources are listed. Auto-injection means the repo needs no script tag and no site token.

**How to apply:** R-112 stops Security from editing `tests/e2e/headers-checks.ts` (QA) and `docs/spec/08-security.md` (Supervisor), so a Security headers change is always a two-role change. Ask for those edits up front or the e2e spec fails 13 tests on the CSP string. At first deploy check the injected tag's `src` against the two sources, `Set-Cookie` absent, no console CSP or Trusted Types error. HSTS preload submission waits for 30 stable days (Phase 8). Edit tool only writes inside the agent's own worktree path, so create the branch in it rather than a second worktree.

Related: [[severity-calibration]], [[tooling-quirks]]
