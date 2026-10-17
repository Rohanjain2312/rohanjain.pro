---
name: context-audit
description: Retired (ADR-0026): no context audits. Kept for reference; use only if the client asks for one.
---

# Context audit

Inputs: transcripts in `~/.claude/projects/<project>/<session>/` and `subagents/agent-*.jsonl` (kept 30 days), plus hook denials logged to `.claude/state/hook-log.jsonl`.

1. For each role, list which instruction files loaded (agent file, path rules, skills) and which spec files it read.
2. Count hook denials by rule ID. A rule blocked often means the instruction is missing from where that agent works: move or sharpen it.
3. Look for rule breaks no check caught (from reviews, QA audits, seeded-defect results). If a check could catch it, open an issue to add one and update `docs/rules.md`.
4. Note any file that agents never read but that holds rules they needed.
5. Record findings and changes in `docs/retros/phase-N.md` under "Context audit". Changes to `CLAUDE.md` or `.claude/` trigger the probe test (R-807).
