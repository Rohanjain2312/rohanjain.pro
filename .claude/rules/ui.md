---
paths:
  - "src/components/**"
  - "src/layouts/**"
  - "src/pages/**"
  - "src/styles/**"
---

# UI

- Spec: `docs/design/spec.md` (Design Lead) and `docs/spec/07-design.md`. Mockups: `reference/mockup/`.
- **R-604** Folding sections use native details and summary; no custom accordion JavaScript.
- Use tokens from `src/styles/tokens.css`; Newsreader for prose, IBM Plex Mono for numbers and labels, Newsreader italic in note red for margin notes.
- Every number comes from `src/content/claims.json` through a component; never type a number into markup.
- Check at 390, 768 and 1280 px before handing back.
- Never put `.md` files in `src/pages/` (Astro serves them as pages).
