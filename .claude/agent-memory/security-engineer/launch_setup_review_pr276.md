---
name: launch-setup-review-pr276
description: PR #276 review (2026-10-19): Phase 7 launch-setup script; credential handling clean, CHANGES REQUESTED for three Lows; what to re-check
metadata:
  type: project
---

PR #276 (head 55880fb): `.github/scripts/launch-setup.mjs`, tests, runbook section 5. Verdict CHANGES REQUESTED, no Medium. Lows beyond the criteria went on #233.

**Why:** the token handling was sound (hidden prompt refuses a pipe, nothing on disk or argv, `gh secret set` value on stdin, verified with a fake `gh`). The misses were around it: `parseArgs` echoes `--token=<value>`; the deploy-token step creates a new 90-day token on every run and loses its value if `gh secret set` fails (the `production` environment does not exist until Claude Code creates it); runbook 1.3.3 and ADR-0032 still say "one Pages project" while the token is account-wide for Pages (Cloudflare documents the account as the resource). The ADR amendment belongs to the Supervisor and must land before the link goes to the client.

**How to apply:** on re-review check the diff from 55880fb for: no argument value in error text, dry-run validates `--account`, a `gh` and environment preflight before the first Cloudflare change, an existing-token check, spawn/EPIPE errors wrapped, runbook line fixed. Also check the ADR-0032 amendment and the `_headers` CSP origins for Web Analytics (my Phase 7 change, not yet done). Method that worked: fake `gh` on PATH recording argv and stdin; sandbox refuses ptys, so the hidden prompt is verified by code read plus the piped-stdin refusal. Cloudflare doc pages via WebFetch confirm permission names (template page lists keys; permission reference lists names only, no Web Analytics or DNSSEC group).

Related: [[pr254-deploy-template-review]], [[token-step-review]]
