---
name: reference-push-fix-to-other-branch
description: How to push a QA test fix onto another agent's branch (PR #283 headers e2e) given the worktree guard and the sandbox port block
metadata:
  type: reference
---

- A second worktree made with `git worktree add --detach <path> origin/<branch>` cannot be used: the guard refuses any `cd` or `git -C` into it ("targets the shared checkout"). Remove it (`git worktree remove <path>`), then run `git switch --detach origin/<branch>` inside your own agent worktree, commit there, and `git push origin HEAD:refs/heads/<branch>`.
- `npm ci` works in the sandbox (EPERM on `.idea` files in `tunnel` is harmless). `npm run build` (resume-pdf) and every Playwright run need a local port, so they need `dangerouslyDisableSandbox`.
- The header e2e mutation recipe: `cp -R dist <scratch>/m1`, `sed -i ''` its `_headers`, run `HEADERS_TEST_DIR=<scratch>/m1 npx playwright test tests/e2e/headers.spec.ts`. `scripts/preview.mjs` reads `<dir>/_headers` first, so no repo file changes.
- Mutating the checker: back up `tests/e2e/headers-checks.ts` to scratch, sed, run `headers-checks.spec.ts`, then `cp` back.
- A first `npm run verify` failed once at build with "Tsconfig not found astro/tsconfigs/strictest" although the file existed; a standalone build and a second verify passed. Re-run before reporting a failure.
- Verify needs a clean tree, so commit first, then verify (it stamps the commit SHA).

**Why:** PR #283 task (HSTS and beacon CSP) needed QA-owned test edits pushed to Security's branch.
**How to apply:** use this flow for any cross-branch test fix.
