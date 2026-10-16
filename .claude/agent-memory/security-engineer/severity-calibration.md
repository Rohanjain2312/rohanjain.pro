---
name: severity-calibration
description: How this project rates hook bypasses versus server-side gaps, and which findings already exist, so reviews stay consistent
metadata:
  type: project
---

Hooks in `.claude/hooks/` are mistake guards that parse shell text; they are not a security boundary. Rate a gap that needs deliberate evasion or an unusual idiom as Low (#32, #47). Rate Medium when nothing server-side backs the control, or when untrusted input or credentials reach far (#9 role-forging routes, #44 /for data in public repo, #45 public GitHub content plus all-repo token, #46 local npm install scripts).

**Why:** set in the threat model (#5, PR #49, 2026-10-15) to keep severity consistent across Phase 0 reviews.

**How to apply:** before rating, check whether a ruleset, CI check or Cloudflare setting backs the hook. Probe hooks by feeding synthetic PreToolUse JSON to copies of the hook files, at both `main` and the open fix PR head. Check open `severity:*` issues first to avoid duplicates. See [[tooling-quirks]].
