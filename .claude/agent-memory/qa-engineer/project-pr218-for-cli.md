---
name: project-pr218-for-cli
description: PR #218 npm run for review: output-dir guard bypassed by path case and `..x` dir names; recheck recipe
metadata:
  type: project
---

PR #218 (head df58042) round 1 CHANGES REQUESTED, 2026-10-18. JD leakage probes (20+ inputs) found nothing; schema strict and mutants caught. Two Mediums in `src/lib/applications/dir.ts`: (1) `realpathSync` keeps typed case on macOS, so `--out` with the repo path in a different case wrote inside the repo; (2) `rel.startsWith('..')` treats `<repo>/..x` as outside. Also pr-hygiene R-109 (827 lines) needed `size:approved`.

**Why:** the guard is the privacy-critical piece (ADR-0016) and string-compare guards fail on case-insensitive filesystems.
**How to apply:** on re-review run `node scripts/for.ts ... --out "<repo path, one segment upper-cased>/x"` and `--out ./..x` from the repo root; confirm the fix uses `realpathSync.native` and `rel === '..' || startsWith('..' + sep)`, and that tests cover both. Hand-mutants that survived: removing `flag: 'wx'`, raising MAX_EXPIRY_DAYS. When mutating `text`, remember `text = ''` runs before the write, so mutate after removing that line or the mutant is vacuous.
