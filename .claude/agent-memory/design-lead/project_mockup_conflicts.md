---
name: mockup-vs-rules-conflicts
description: Known conflicts between the approved mockups and hard rules (R-601 gradients/red, R-505 CSP inline styles, R-006 questions, N-04 overflow at 320), logged as Q-nn in docs/design/spec.md
metadata:
  type: project
---

The mockups in `reference/mockup/` are "the approved spec" (01-product §1.4) but break several hard rules. As of 2026-10-15 these are open questions in `docs/design/spec.md` (PR for issue #6):
- Graph paper is drawn with `linear-gradient` (R-601 bans gradients); 404 uses full-page graph paper (07-design limits it to figures); 404 traceback uses red `#F08A84` (red reserved for margin notes).
- Inline `style=""` everywhere; CSP is `style-src 'self'` (R-505), so dynamic widths/fills need classes or SVG.
- About 19 colors in the mockup are not among the 10 tokens in 07-design §7.2.
- Headings "Hiring? Paste the job description." and "Have a role in mind?" are questions (R-006, R-602 item 2).
- At 320 px the figure grid (minmax 280) and contact email button overflow (N-04).

**Why:** Reviews against the mockup alone would approve rule violations.
**How to apply:** In R-602 reviews, check these spots first and check whether the spec's Q-nn has been closed (by spec edit or ADR) before judging.
