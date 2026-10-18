# Phase 2 gate design review

Issue #192. Reviewer: design-lead. Date: 2026-10-17.
Build reviewed: head of PR #187, commit `0acfd37`, built with `npm run build` and served with `npm run preview`.
Method: screenshots of `/`, `/privacy/` and `/404.html` at 390, 768 and 1280 px (all folds open), the demo dialog (static and loaded, two projects) at the same widths, and the footer with status. A DOM audit at the same widths for type size, target size and page overflow. Judged against `docs/design/spec.md` first, then `reference/mockup/`, then the R-602 checklist.

## Verdict

**Not PASS yet: two Mediums, both in the demo dialog, to fix before the phase gate.** The three pages, the footer and the dialog layout pass. After M1 and M2 are fixed and re-shot, the design check passes. Everything else is Low.

## Not reviewed in this pass
- Keyboard focus rings and hover states were not captured (M2 comes from reading the CSS). The axe run in CI and the QA review cover focus order and contrast.
- The résumé button, the "check fit" nav link, the "Check fit against your role" link, the fit check, the résumé and brief dialogs, `/for` and the expiry page are not built. They belong to Phases 3 and 4 (`docs/phases/phase-2-plan.md`). Their absence is not a finding.
- Print layouts (spec 12). The home page gets the basic print style only.

## Findings

### Medium (fix before the phase gate)

**M1. The "Load live demo" button has no fill.** Owner: Frontend. Files: `src/styles/components.css`, line 71 (`.btn`).
`.btn` sets size, font and padding but no background, color or border, so the demo dialog's primary action renders as the browser's grey default button with a grey border and rounded corners (see `dlg-fc-static-1280`). Spec 6 makes the solid button the only filled style: `--ink` fill, `--paper` text, no border, square corners. R-602 item 6: it looks worse than the mockup (L18 to L19), and it is the one button a visitor must press to see a demo.
Change: add to `.btn` `border: 0; background: var(--ink); color: var(--paper); cursor: pointer;`. `.btn--inverted` and `.btn--outlined` already override the fill and color, and the hover rule `.btn:not(.btn--outlined, .btn--inverted):hover` in `demo.css` already assumes a solid base. Then re-shoot the dialog at 390, 768 and 1280.

**M2. The focus ring is invisible on the demo sheet.** Owner: Frontend. File: `src/styles/demo.css`, `.demo` rule.
`.demo` sets `--focus: var(--paper)` for the whole dialog, so the "Load live demo" button on the white sheet gets a `--paper` ring on a `--well` (white) ground, about 1.1 to 1 contrast. Spec 9.1 re-maps `--focus` to `--paper` only inside ink surfaces (the toolbar). Found from the CSS, not from a capture; verify with a keyboard capture after the fix.
Change: move `--focus: var(--paper)` from `.demo` to `.demo__toolbar`, or add `--focus: var(--ink)` to `.demo__sheet`. Re-shoot with the button focused (Tab from Close) and attach it.

### Low (one line each, for issue #190)
1. Fold summary "The loan agent, then and now" at 390: the count "v1 → v2" wraps onto two lines. Make the count `white-space: nowrap`.
2. 404 H1 at 390 leaves "NaN." alone on the second line. Add `text-wrap: balance` to the H1 (also helps the privacy H1).
3. Demo dialog address line at 390 breaks inside a word ("FinComp / ress"). Break after `/` instead (`<wbr>` after each slash or `overflow-wrap: break-word` with slash break opportunities).
4. Demo dialog height changes by about 26 px between the static and loaded states (the foot row loses the button). The stage does not move, so nothing jumps above it. Optional: keep the foot row height equal in both states.
5. Selected-work cards at 1280: a two-line H3 ("Computer-Use Automation") pushes that card's figure block and links 26 px below its neighbours. Align the figure block and link row across a row (bottom-align with `margin-top: auto` on the figure block, or a subgrid).
6. Figures at 1280: ten tiles in three columns leave "Medical LLM" alone on the last row. Spec 4 allows this. No change needed unless a tile is added or dropped; note it for the Phase 5 content count.
7. Background fold at 768: the degree date wraps below the second degree but not the first. Give the degree rows one rule: years right-aligned on one line from 768, or always below.
8. Footer with status at 1280: the left cluster is one long line, so the five links drop to a second row and the footer is two rows tall. Wrap the left cluster at `--measure-read` so the links stay on one row at the right.
9. Footer status check date reads Oct 18, 2026, later than "last updated" Oct 17, 2026 and later than today. Presumably fixture data; confirm no fixture date can ship in `public/status.json`.
10. `<strong>` in the Production list computes to weight 700 while the variable font stops at 600. Set `font-weight: var(--weight-strong)` on `strong` so the weight is the token and not a clamp.
11. Spec paths: the graph-paper tile is `src/assets/graph-paper.svg` in the build, not `src/assets/brand/graph-paper.svg`. The spec now names the built path (changed in this PR).
12. The inline "rebuild ↗" link is 17 px tall. It sits in running text, which WCAG 2.5.8 exempts; no change, listed so QA does not file it.

## R-602 checklist

| # | Check | Result |
|---|---|---|
| 1 | AI-site patterns (gradient hero, glow, emoji bullets, three identical icon cards, stock art, "Hi, I'm", typing, soft rounded shadows) | Pass. No gradient, shadow or radius anywhere; the graph paper is a masked SVG in the figures panel only. The four project cards share one structure but carry different figures, so they are data rows, not icon cards |
| 2 | Filler, em dashes, rhetorical questions | Pass on the three pages. The two question headings ("Have a role in mind?") are kept by ADR-0015 item 12. No em dashes found |
| 3 | Hierarchy | Pass. H1 at 88 px (52 at 390), then the strip, then 38 px section H2s, 22 px card titles, mono 13 px labels. Sections differ in weight (folds, dark diff band, dark contact band) |
| 4 | Decorative elements carry information | Pass. Red margin notes are the author's comment on each figure; the dark traceback on the 404 is the joke and the page; the diff colors mark removed and added |
| 5 | 8 px rhythm and grid | Pass with Lows 5, 7 and 8. Content starts on the left edge at every width, nothing overflows at 390, 768 or 1280 (scroll width equals viewport on all three pages) |
| 6 | Not worse than the mockup at 390 | Fails only on the demo button (M1, M2). Header, hero, strip, cards, figures, contact and footer match or improve on the mockup |
| 7 | Motion | Pass. The fold marker is the only motion (150 ms, spec 10); the dialog and the demo stage appear with no animation |

DOM audit: no text under 13 px on any page at any width; every boxed control is 44 px or more except the inline link in Low 12; fonts in use are Newsreader 400, 500, 600, italic 400 and Plex Mono 400, 500, 600 (the same set the spec lists).

## Deliberate detail
The results figures start on the H1's left edge (x = 80 at 1280, x = 24 at 390). The first strip cell has no left padding on purpose (spec 7.3, L56), so the eye runs down one line from the name to the first number.

## First screen at 390 by 844
Eyebrow, H1, lede, the email link and the first result figure (40%) all show above the fold; the strip's top rule is at about 415 px and the figure at about 445. The Q-47 check passes. When "View résumé" arrives in Phase 4 it adds about 64 px: re-measure then; the first figure should still be visible.

## System-font fallback for arrows and dots (#126 item 1): accepted
Decision: accept the fallback for U+2190 ←, U+2192 →, U+2193 ↓, U+2197 ↗, U+25CF ● and U+25CB ○. Do not add them to the subsets.
Reason: measured on the build with Chromium's platform-font report. On macOS each glyph renders from Menlo, a monospace face, in the text style and in the text color, one glyph per use. Cost of adding them (about 4 glyphs times 4 faces, plus re-subsetting) buys a small difference in glyph weight, and the glyphs are the least read part of any control.
Conditions, now written into `docs/design/spec.md` section 2.4:
- Every such glyph is decoration next to words ("code", "live demo", "restart from the last checkpoint", the verdict row names). It is `aria-hidden` where it stands apart, and no meaning rests on it alone.
- Never add U+FE0F, and never use an emoji codepoint, so the glyph stays in text presentation on iOS and Android.
- Fonts stay `var(--font-mono)` with the generic `monospace` last, so a monospace symbol face is chosen first.
- Not measured: Windows, Linux and Android. If the visual capture on another platform shows an arrow in a proportional face or taller than the line, add the glyph to the Plex Mono subsets then. No layout shift was seen (links are 44 px tall at minimum).
Item 1 of #126 is closed by this review. The comment in `src/styles/fonts.css` ("Design Lead to accept in docs/design/spec.md") can say "accepted, spec 2.4".

## Favicon placeholder (`data:,`)
Not needed for the Phase 2 gate. Nothing is public before Phase 7, the placeholder stops the `/favicon.ico` request, and its comment points at spec 13.2.
Needed before launch (Phase 6 at the latest): a browser tab with no icon reads as unfinished on the one page whose job is to look finished. I will ship `public/favicon.svg`, `public/favicon.ico` and `public/favicon-180.png` to spec 13.2, together with the OG image, in a separate `design/` PR. The glyph outlines come from the Plex Mono 600 subset already in `public/fonts` (it holds "R" and "J"). Frontend then replaces the `data:,` line in `src/layouts/Base.astro` with the three links in spec 13.2. Supervisor: open one issue for this (owner design-lead, then frontend for the head links).

## Files for the re-check
After M1 and M2 (and ideally Lows 1 to 3), Frontend re-shoots `demo-static-*` and `demo-loaded-*` in `tests/visual/screenshots/`; the Design Lead approves the baselines then.
