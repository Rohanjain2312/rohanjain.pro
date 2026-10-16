# ADR-0015: Decisions on the design spec outline's open questions

Status: accepted · Date: 2026-10-15 · Issue: #50

## Context
The design spec outline (`docs/design/spec.md`, PR #48, section 14) lists questions that need a Supervisor decision or a spec change. The mockups are the approved source for layout and copy (`docs/spec/01-product.md` §1.4), but some mockup techniques conflict with R-505 (CSP) and R-601 (tokens, red, gradients).

## Decision
1. **Tokens (Q-01).** `docs/spec/07-design.md` §7.2 is the core palette. The Design Lead may add tokens taken from the mockup when each one carries a distinct state or surface (hover, verdict fill, diff text, overlay), and documents its source in `docs/design/spec.md`. Near-duplicates map onto existing tokens, as the outline proposes. All colors still come only from `src/styles/tokens.css` (R-601).
2. **Print surface (Q-02).** Add `--print-paper: #FFFFFF` for print and for on-screen previews of the résumé and the brief.
3. **Graph paper (Q-03, Q-38).** An SVG tile in `src/assets/brand/`, no gradients. Only inside the figures section, as §7.3 says. The 404 page uses plain paper. The Design Lead picks the line color from the mockup's figures section.
4. **Red on the 404 (Q-04).** Dropped. Red stays reserved for margin notes.
5. **Inline styles.** No `style` attributes and no inline `<style>` or `<script>` that would need CSP exceptions (R-505). Bar widths and verdict colors use classes or SVG geometry generated at build time.
6. **Overflow at 320 px (Q-15, Q-16).** Accept the outline's proposals: `minmax(min(280px, 100%), 1fr)` for figure tiles; contact padding 24 px with a wrapping email.
7. **Copy not in the mockup (Q-30, Q-40, Q-41).** The Supervisor writes the no-JavaScript fit-check notice, the privacy page and the expiry page from facts in the spec only (no claims, no numbers beyond `claims.json`). The Reader Advocate reviews them, and Security checks the privacy facts. The privacy page shows a last-updated date read from content. The expiry page does not name the company.
8. **`/for` tailored prose (Q-36).** Decided in Phase 4 by App/Data within these limits: no field may hold job description text (R-502); any prose comes from the engine's output or from an optional note Rohan passes on the command line. If neither is built, the page drops those blocks.
9. **Claims check and non-claim numerals (Q-39).** `scripts/check-claims.ts` reads an allowlist in `src/content/` for numerals that are not claims (the 404 status code, decorative traceback line numbers, section ordinals 01 to 03). Each entry names the page and a reason. QA reviews every change to it.
10. **PDF page size (Q-48).** US Letter, because the target market is the US (§1.1).
11. **Brief overflow (Q-51).** Accept the outline's proposal (4 evidence rows, capped tags, gaps line truncated with a count). App/Data confirms it in Phase 3; the Phase 3 gate already requires one printed page.
12. **Question headings.** Keep the mockup headings "Hiring? Paste the job description." and "Have a role in mind?". They are direct prompts in approved copy, not rhetorical questions.

## Consequences
- `docs/spec/07-design.md` is updated to match items 1 to 4.
- Frontend builds without inline styles from the start, so the CSP needs no hashes for styles.
- The token list grows, but every token has a recorded mockup source.

## Alternatives
- Collapse every mockup color onto the 10 core tokens: loses hover and verdict states the mockup relies on.
- Keep graph paper and red on the 404 with an exception: weakens R-601 for a joke page.
- A4 PDFs: less common for US readers.
