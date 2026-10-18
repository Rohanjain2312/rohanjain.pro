---
name: project-pr200-phase2-gate-review
description: PR #200 (Phase 2 design gate record, issue #192) approved at c341e6b on 2026-10-17; its two Mediums fixed at branch tip d3dba98; Lows routed to #190.
metadata:
  type: project
---

Decision: APPROVED at head c341e6b, with approved:qa added. The record's two Mediums were real at its build 0acfd37: the demo "Load live demo" button had no fill (`.btn` in src/styles/components.css) and the focus ring was invisible on the white sheet (`--focus` set on the whole `.demo` in src/styles/demo.css). Frontend fixed both in d3dba98 on platform/183-status-and-gate, and committed new captures in the same commit.

**Why:** Issue #192 asked for a gate record with a PASS or exact changes. The record is complete against those criteria. Its verdict is stale against the branch tip, which is why the approval was not blocked.

**How to apply:** Before the phase gate, check that the record gets a re-check at the tip (design-lead's step). Lows went to #190 (Phase 2 Low backlog). Spec 2.4 is accurate: the five Plex and Newsreader files contain none of U+2190, U+2192, U+2193, U+2197, U+25CF or U+25CB (fontTools check), and Menlo has all six. Open question for the Supervisor: the record's "Phase 6 at the latest" favicon timing is not in docs/spec/11-phases.md. Related: [[feedback-pin-shared-branch-sha]], [[docs-review-checks]].
