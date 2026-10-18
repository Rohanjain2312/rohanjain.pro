---
name: shots-script-pr198
description: PR #198 (npm run shots) review: fixed-port collision gives silent wrong output; full-page PNG unreadable in viewer; probe recipes
metadata:
  type: project
---

PR #198 head 79801eb, QA CHANGES REQUESTED (2 Medium, 2 Low on #190).

- Medium: `tests/visual/shots.mjs` uses fixed port 4323 and ignores spawn failure. A foreign server on the port is captured silently (exit 0). Ports are shared across agent worktrees (4399 was held by another agent while I tested; use 4398-style odd ports for probes).
- Medium: full-page 390 x 8703 PNG shows at 90 px wide in the Read viewer. The Reader Advocate 5-second test needs a viewport-sized shot.
- Piping `npm run shots | head` leaks the preview server (EPIPE). Do not pipe to head when testing scripts that spawn servers.
- Round 2 checks: free-port or child-exit detection, fold PNGs named in README, rerun collision test (foreign preview on 4323), confirm no listener left after run.

**Why:** shots feed Reader Advocate verdicts; wrong-site or unreadable images defeat the purpose.
**How to apply:** for any script that spawns a server, test with the port already taken and check what the output says.
