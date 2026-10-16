---
name: mockup-vs-rules-conflicts
description: How the mockup-vs-rule conflicts (gradients, inline styles, extra colors, question headings, 320 px overflow) were closed; ADR-0015 plus docs/design/spec.md sections 0 to 14
metadata:
  type: project
---

The mockups in `reference/mockup/` are "the approved spec" (01-product §1.4) but broke several hard rules. As of 2026-10-16 all are closed in `docs/design/spec.md` (issue #19) and ADR-0015:
- Graph paper: SVG tile used as a CSS mask, token color `--grid-line` `#E9E4D6`, figures section only. 404 is plain paper.
- Inline styles: full rule is no `style` attribute, no inline `<style>`, no inline `<script>` (spec 0.1). Only open point: JSON-LD block, Security to confirm.
- Extra colors: 9 added tokens, the rest mapped (spec 1.2, 1.3). 404 red dropped; error line uses weight 600.
- Question headings kept (ADR item 12). 320 px overflow fixed by `min(280px, 100%)`, contact padding 24, `<wbr>` after `@`, wrapping résumé tabs.

**Why:** Reviews against the mockup alone would approve rule violations, and spec departures from the mockup are deliberate.
**How to apply:** In R-602 reviews, judge against the spec first, then the mockup. A spec departure is listed in 0.2, 1.3 or marked DL; anything else that differs from the mockup is a finding.
