# Phase 6 accessibility audit (QA, independent)

Issue #235 (split from #230). Built site at `origin/main` 40d79e8, audited on 2026-10-18 before Frontend's accessibility PR for #229 lands. Chromium only (Playwright 1.64.1, axe-core 4.13.0). Platform's cross-browser projects are not part of this record.

Severity scale: Critical blocks a primary task for everyone. High blocks it for a group with no workaround. Medium is a WCAG 2.2 AA failure, or a barrier on a primary task that has a workaround. Low is a usability or best-practice gap, or a miss against a stricter project rule (N-02, 44 px targets) that passes WCAG.

**Result: no Critical, High or Medium finding. Six Lows and four notes.**

## How to repeat

```
npm run build
node tests/e2e/a11y-audit.mjs --out <dir outside the repo>
```

`tests/e2e/a11y-audit.mjs` is a report generator, not a test. It serves `dist/` through `scripts/preview.mjs` (real CSP) and builds a `/for` fixture site in a temp directory from a synthetic posting. Optional `--only axe,keys,motion,zoom,forced,tree,targets`. Output is JSON, YAML trees and PNGs in `<dir>`.

## 1. axe, every page and dialog state, 390 / 768 / 1280 px

Tags: wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice. A second pass with every rule enabled also found nothing.

States: home (folds closed, folds open, fit check with a report, fit check with the too-short warning), résumé dialog on each tab, demo dialog (static, loaded with a mocked iframe), brief dialog, privacy, 404, three print résumé routes, `/for` live and expired (fixture).

Result: 0 violations in all 54 combinations.

axe could not decide `color-contrast` in four places ("incomplete"):

- Home with folds open, 81 nodes: "background could not be determined due to a pseudo element" (the graph-paper tile). A by-hand pass over 247 text elements, using computed colors against the nearest flat background, found none below AA. Lowest ratio 5.72 (note red on paper). The tile lines under text were not measured. See note N-1.
- Fit report and `/for` live, 5 nodes each: the aria-hidden marks (filled and open circles) beside evidence names and the ramp-up lead. They carry no meaning alone (the verdict and counts are text).
- Demo dialog at 1280, 1 node: `.demo__url`.

## 2. Keyboard-only walkthrough

Home, 390 / 768 / 1280, folds closed: 34 tab stops each, in reading order. Every stop shows a 2 px outline (ink on paper, paper on the dark contact block). None is obscured, off screen or under 44 px except where noted. No positive `tabindex`.

| Flow | Result |
| --- | --- |
| Résumé dialog: Enter on "View résumé" | Opens, focus on the selected tab (ML Engineer). |
| Résumé dialog: 12 Tab and 12 Shift+Tab | Stays inside. Order: tabs, Download, Close, then sheet links. |
| Résumé dialog: Escape | Closes, focus returns to the opener. |
| Demo dialog: Enter on "try it here" | Opens, focus on "live demo". Tab cycles through the dialog and the browser UI; no trap. Escape returns focus to the trigger. |
| Demo dialog: Space on "Load live demo" | Iframe loads and has a title ("Live demo FinCompress"). **Focus is lost (finding A-1).** |
| Fit check: sample (Enter), Check fit (Enter) | Sample pressed state set, report appears, `role=status` line holds "Strong fit. 16 proven, 2 to ramp up" about 50 ms later (source: `src/components/fit-check.ts`, delayed on purpose). Focus stays on "Check fit". |
| Brief: "Open the one-page brief", Escape | Focus lands on "Save as PDF", returns to the opener on close. |
| `/for` live (390) | 6 stops, all links, in reading order. |
| `/for` expired, 404, privacy | 1, 1 and 8 stops, in order. |

Not walked with a keyboard: home with every fold open, the print routes, the timeline in the Figures fold beyond one activation (finding A-5).

## 3. Reduced motion

`prefers-reduced-motion: reduce` on home and every dialog state: no animation or transition longer than 10 ms on any element. Without the preference, the only motion is the fold marker (`.fold__plus`, 0.15 s transform). `scroll-behavior` is `auto` in both modes. Pass.

## 4. Zoom and reflow

200 percent is a 640 px viewport, 400 percent a 320 px viewport (WCAG 1.4.4 and 1.4.10), on home, fit report, three dialogs, privacy, 404 and a `/for` page.

- No page scrolls horizontally. Dialogs fit the 320 by 256 px viewport and their controls wrap.
- The only element wider than the viewport is the Figures timeline, inside `.timeline-region` (`overflow-x: auto`). That is a diagram, covered by the two-dimensional exception to 1.4.10. Its entries are focusable, so a keyboard user can scroll it. See A-5.
- Text spacing (1.4.12 values applied through inline styles at 390 px): no clipping and no horizontal page scroll.
- Not done: a browser-level text-only zoom (the CSP blocks a style tag, and Playwright cannot change the browser zoom factor).

## 5. Forced colors (`forced-colors: active`, 390 and 1280)

Pages stay readable and links keep their underline. Two Lows (A-2, A-3). axe reports a `color-contrast` item in this mode, which is the rule reading author colors that the browser overrides; not counted.

## 6. Accessibility tree and text order

Snapshots of every page and dialog state are produced by the script (`ariaSnapshot`). Home reads in this order: banner with a "Sections" navigation, main with regions "Introduction", "Goldman Sachs · Data Scientist", "Four projects, real numbers", "Hiring? Paste the job description." and the contact region, then the footer navigation. One `h1`; `h2` per section; `h3` per project. No duplicate ids on any page. Link names carry the target ("code for Loan Servicing Agent"); decorative arrows are hidden from the tree. `lang="en"` and a unique title on every page. Résumé tabs expose `tablist`, `tab` and `tabpanel`.

A real screen reader was not run. The tree and text order were checked, not the spoken output.

## Findings

| ID | Severity | Finding | Repro | Suggested fix |
| --- | --- | --- | --- | --- |
| A-1 | Low | Keyboard focus is dropped to `<body>` after "Load live demo". The button hides itself (`load.hidden = true` in `src/components/demos.ts`). The next Tab lands on the dialog element, then "live demo", then "Close". A keyboard or screen-reader user gets no cue that the demo loaded. | Open `/`, Tab to "try it here for FinCompress", Enter, Tab to "Load live demo", Enter. `document.activeElement` is `BODY`. | After creating the iframe, focus the iframe or the stage. |
| A-2 | Low | In forced colors the filled and outlined buttons lose their boundary and read as plain text: "View résumé" (hero and contact), "Check fit", "Download PDF", "Close", "Load live demo", "Save as PDF". Sample buttons keep their border. | Emulate `forced-colors: active`; open `/` at 1280 px. | Give `.btn` a `1px solid transparent` border (it turns visible in forced colors). |
| A-3 | Low | In forced colors the dialog surface has no background or border. Page text shows through behind the toolbar of the résumé, demo and brief dialogs, so "Close" and "Save as PDF" sit on top of page text. | Forced colors, open the brief dialog at 390 px: tag chips from the page overlap the toolbar. | Give the dialog column a system `Canvas` background and a visible border in `@media (forced-colors: active)`. |
| A-4 | Low | `/for` "see everything else" link is 164 by 20 px. N-02 asks for 44 px targets. WCAG 2.5.8 (24 px) passes through the spacing exception. | Build a `/for` page; measure the link at 390 px. | Give the link the same 44 px block size as other standalone links. |
| A-5 | Low | Timeline entries scroll the matching figure into view but leave focus on the timeline button, which is then far off screen (about 7,500 px at 320 px wide). The next Tab continues from the button. | Open Figures, Tab to a timeline entry (for example "Market Regime Classifier"), Enter. | Move focus to the revealed tile (give it `tabindex="-1"`), or leave as is and record the choice. |
| A-6 | Low | The page has no skip link. Landmarks (banner, navigation, main, contentinfo) satisfy 2.4.1, and the header holds two links, so the cost is small. | Tab once from the top: first stop is "work". | Optional. Skip if the header stays this short. |

Notes (not findings):

- N-1 axe `color-contrast` is incomplete over the graph-paper tile (81 nodes, home with folds open). Hand ratios on flat colors are above AA. Measure text over the tile lines once, for example from a screenshot sample.
- N-2 `docs/design/spec.md` 7.9 says the verdict box is `aria-live`; the page uses a separate `role=status` line. Already listed on #195 (PR #208).
- N-3 The fit report's aria-hidden circles are decoration; verdict and counts are text.
- N-4 Home LCP was 1.7 s against a 1.8 s budget (see #195, PR #210). Not an accessibility item.

## Not covered in this run

- Firefox and WebKit (Platform, #230).
- A real screen reader (VoiceOver, NVDA).
- Keyboard walkthrough of home with every fold open, and of the print routes.
- Forced colors on `/for`, privacy and 404; zoom screenshots beyond the first viewport (the script checks reflow numerically).
- Pointer-target size at 768 px.

## Follow-up after Frontend's PR for #229 lands (for the Supervisor to recheck)

1. Rebuild and run `node tests/e2e/a11y-audit.mjs --out <dir>` again. Expect 0 axe violations on every state, and check any new page (the SEO work adds `sitemap.xml` and `robots.txt`, which have no markup).
2. Mark each of A-1 to A-6 as fixed, left on purpose (with the reason) or still open. Frontend is fixing its own audit findings, so some may already be gone.
3. If the favicon or JSON-LD changes `Base.astro`, confirm the headers test still passes (JSON-LD is the one inline block the plan allows).
4. Re-measure LCP on `/` (note N-4) after any font or image change.
5. Run the contrast sample over the graph-paper tile (N-1).
