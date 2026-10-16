# Design spec

Status: **outline** (Phase 0, issue #6). The Design Lead completes it in Phase 1, before Phase 2 UI work starts.
Owner: design-lead. Rules it serves: R-601, R-602, R-604, R-605, R-606, R-608, R-609.

## How to read this file
- Each section lists its **Source** (mockup file and line numbers, or spec section), what the source **fixes**, and its **Open** questions (IDs `Q-nn`).
- Values come only from `reference/mockup/` and `docs/spec/07-design.md`. Anything marked **Proposed** is a derivation from those values, to confirm with screenshots in Phase 1. Nothing here is a new value.
- Mockup line numbers refer to `reference/mockup/Main.dc.html` unless another file is named. `For` is `For.dc.html`, `404` is `404.dc.html`.
- Precedence when sources disagree: client decisions (`docs/spec/01-product.md`, `docs/spec/05-evidence-ledger.md`) over `docs/spec/07-design.md` over the mockup over this file.

## 0. What is not ported from the mockup
| Mockup item | Where | Replacement |
|---|---|---|
| Google Fonts `<link>` and preconnect | Main L11 to L12, For L11 to L12, 404 L11 to L12 | Self-hosted Newsreader and IBM Plex Mono, WOFF2, `font-display: swap` (ADR-0006, `docs/spec/06-architecture.md` §5.1) |
| `'Rohan Hand'` font family in `.note` | Main L17, For L18, 404 L31 | Newsreader italic in note red (client decision 7) |
| DC runtime (`support.js`, `<x-dc>`, `<sc-for>`, `<sc-if>`, `DCLogic`) | all files | Astro components and vanilla TypeScript islands |
| Inline `style` attributes and inline `<style>` | all files | Stylesheets only. CSP is `style-src 'self'` with no `unsafe-inline` (R-505), so bar widths and verdict fills need classes or SVG attributes, not `style=""` |
| `linear-gradient` graph paper | Main L150, 404 L19 | R-601 bans gradients and Stylelint will enforce it. **Proposed:** a small SVG grid tile in `src/assets/brand/`. See Q-03 |
| Hard-coded numbers in markup | everywhere | Every number from `src/content/claims.json` through a component (R-301) |

### 0.1 Mockup content that client decisions override
These are content fixes, owned by App/Data and the Supervisor. They are listed here so screenshots are not judged against stale mockup copy.

| Mockup | Where | Source of truth |
|---|---|---|
| FinCompress "pruning 29% of attention heads raised validation Macro F1 from 0.888 to 0.897" | résumé dialog L325 | Ledger: "pruning 50% of attention heads improved val Macro F1 by +0.9 points" |
| FinCompress tile caption "F1 peaks at 0.897 with 29% of heads pruned" and alt "peaking at 29%" | L506 | Caption must describe the chart without contradicting the résumé claim (ledger, last paragraph) |
| FinCompress card context "F1 0.89 → 0.77" | L471 | Not in the ledger. Omit unless sourced (R-005) |
| Market Regime "61.16% baseline", "MCC 0.480 vs -0.036", axis "Sep 2022 to Oct 2025" | L395, L509 | 81.78% and 0.480 are in the ledger; 61.16%, -0.036 and the date axis are not. 88.4% F1 (ledger) appears nowhere in the mockup |
| Project dates disagree between timeline, tiles and lists (Market Regime Nov vs Dec 2025, GraphBench Mar vs Aug 2026, FinCompress Feb vs Mar 2026, Self-Healing Feb 2026 vs ledger Feb to Aug 2026) | L481 to L512 | `projects.json` `dateRange`. See Q-31 for which date each surface shows |
| Goldman tenure shown only as a date range | L76, L310 | Where tenure is stated in words it reads "~4 years at Goldman Sachs" (R-306) |
| Contact section has no phone and no Medium link | L260 to L270 | F-14 adds phone `(240) 495-9682` as a `tel:` link and Medium labeled "Writing" |
| Location | L46 | Already "New York, NY" (F-16). No change |

---

## 1. Color tokens
**Source:** `docs/spec/07-design.md` §7.2; mockup `<helmet>` styles (Main L13 to L29) and inline styles.

**Fixed by 07-design (the only colors R-601 allows today):**
| Token (proposed name) | Value | Mockup use |
|---|---|---|
| `--paper` | `#F6F3EB` | page background, text on dark |
| `--card` | `#FBF9F3` | chips, textarea, inputs, figure tiles |
| `--ink` | `#1B1A17` | text, 1.5 px rules, solid button, dark bands, focus ring |
| `--ink-2` | `#2C2A25` | lede and body prose |
| `--muted` | `#5E5A50` | labels, dates, captions, "Not enough to go on" verdict fill |
| `--rule` | `#CFC8B6` | 1 px dividers, chip border, tile border |
| `--rule-faint` | `#E2DCCC` | rows in "More projects", image frames |
| `--note` | `#B42B25` | margin notes only |
| `--diff-del-bg` | `#3A2422` | removed lines in the v1 → v2 diff |
| `--diff-add-bg` | `#22331F` | added lines in the v1 → v2 diff |

**Colors in the mockup that are not tokens (each must be tokenized or mapped before Phase 2):**
| Value | Where | Role |
|---|---|---|
| `#8A8474` | L15, L20, L238, For L15, For L65 | link underline, dashed gap-chip border |
| `#3D3A33` | L58, L151, L192, L202 | secondary prose (results `dd`, fit intro) |
| `#3A3833` | L19, L440 | solid button hover; "Good fit, with gaps" fill |
| `#6B6559` | L441 | "Not a strong fit" fill |
| `#EDE9DD` | L93, L215, 404 L23 | text on ink (diff, verdict counts, traceback) |
| `#B8B2A3`, `#D9D4C7` | For L25, L262 | secondary text on ink |
| `#E3C9C4`, `#D3E6C8` | L460 | diff text on red and green backgrounds |
| `#FFFFFF` | L19, L126, L166, L288 | solid hover text, demo frame, image well, résumé and brief paper |
| `#000000` | L15 | link hover text |
| `#E9E4D6` (Main), `#E7E2D4` (404) | L150, 404 L19 | graph-paper lines |
| `#F4F1E8` | 404 L19 | 404 page background (differs from `--paper`) |
| `#EFEBE0`, `#A9A291` | L173, L500 | bar track and weak bar fill |
| `#B9B2A0` | L498 | unselected timeline underline |
| `#F08A84` | 404 L30 | traceback error line (a red outside margin notes, see Q-04) |
| `rgba(27,26,23,0.62)` | L275, L338 | dialog overlay (ink at 62%) |

**Measured contrast (WCAG 2.x formula, computed from the values above):**
| Pair | Ratio | Note |
|---|---|---|
| ink on paper | 15.69 | |
| muted on paper / on card | 6.20 / 6.53 | passes 4.5 for body text |
| note red on paper / on card | 5.72 / 6.02 | passes |
| paper on `#6B6559` ("Not a strong fit") | 5.22 | passes |
| `#EDE9DD` on `#6B6559` (verdict counts) | 4.76 | passes, narrowly |
| `#8A8474` on paper | 3.36 | fine as underline and border (non-text 3:1), never as text |
| `#A9A291` bar on `#EFEBE0` track | 2.13 | below 3:1 non-text contrast; see Q-05 |
| `#F08A84` on ink | 7.19 | passes, but see Q-04 |

**Open**
- Q-01: Tokenize the 19 extra values, or collapse them onto the 10 tokens? Proposed: keep the ones that carry a state (`#3A3833` hover, verdict fills, diff text, overlay) as tokens; map `#3D3A33` to `--ink-2`, `#000000` and `#FFFFFF` hover text to `--ink` and `--paper`, `#B9B2A0` to `--rule`. Needs a token-list update in 07-design (Supervisor) because R-601 says tokens only.
- Q-02: Résumé and brief use `#FFFFFF` paper on screen. Keep as a print-surface token (`--print-paper`) since 07-design says print is black on white?
- Q-03: Graph paper as an SVG tile (proposed) or a token-colored background pattern another way. Line color `#E9E4D6` or `#E7E2D4`?
- Q-04: 404 traceback uses `#F08A84`, a red outside margin notes. R-601 reserves red for margin notes. Drop it (proposed) or record an exception ADR.
- Q-05: Bar charts in figure tiles: weak bar `#A9A291` on `#EFEBE0` is 2.13:1. The values are printed as text beside each bar, so the bar is not the only carrier. Confirm with QA that axe accepts it, or darken the weak bar to `--muted`.

---

## 2. Type
**Source:** 07-design §7.3; Main L12 (weights loaded), all inline `font-size` values.

**Families:** Newsreader for prose and headings; IBM Plex Mono for numbers, labels, navigation, buttons and code; Newsreader italic in `--note` for margin notes. Fallbacks in the mockup: `Georgia, serif` and `monospace`.

**Weights the mockup loads:** Newsreader 400, 500, 600, italic 400, italic 500; Plex Mono 400, 500, 600. Newsreader uses the optical-size axis (`opsz 6..72`).

**Scale observed (Main unless noted):**
| Role | Family | Size | Weight | Line height | Tracking | Source |
|---|---|---|---|---|---|---|
| H1, home | Newsreader | 88 | 500 | 0.95 | -0.03em | L47 |
| H1, `/for` | Newsreader | 64 | 500 | 1 | -0.02em | For L32 |
| H1, 404 | Newsreader | 56 | 500 | 1.05 | | 404 L22 |
| H2, contact | Newsreader | 40 | 500 | 1.1 | | L261 |
| Verdict, `/for` | Newsreader | 40 | 500 | 1.05 | | For L44 |
| H2, sections | Newsreader | 38 | 500 | 1.1 | | L75, L106, L191 |
| Result figure (`dt`) | Plex Mono | 38 | 500 | 1 | | L57 |
| Verdict, fit check | Newsreader | 34 | 500 | 1.05 | | L214 |
| Résumé name / brief title | Newsreader | 32 / 30 | 600 | 1.1 / 1.15 | | L290, L347 |
| H2, `/for` topics | Newsreader | 28 | 500 | | | For L71 |
| Lede | Newsreader | 24 (22 on `/for`) | 400 | 1.35 (1.45) | | L48, For L33 |
| H3 card / card figure | Newsreader 600 / Plex Mono 500 | 22 | | 1.2 | | L111, L114 |
| Body | Newsreader | 18 | 400 | 1.55 | | L32 |
| Margin note | Newsreader italic | 18 (16 in tiles, 22 on 404) | 400 | | | L98, L180, 404 L31 |
| Secondary prose | Newsreader | 15 to 17 | 400 | | | L58, L112, L217 |
| Buttons | Plex Mono | 15 (solid), 14 (text link) | 500 / 400 | | | L18, L20 |
| Fold summary | Plex Mono | 15 | 400 | | | L23 |
| Labels, nav, eyebrow | Plex Mono | 13 to 14 | 400 | | | L35, L46, L73 |
| Chips, dates, résumé section heads | Plex Mono | 12 | 400 | | 0.08em on heads | L22, L110, L295 |
| Demo URL, timeline date, axis, brief footer | Plex Mono | 11 | 400 | | | L127, L155, L176, L369 |
| Résumé and brief body | Newsreader | 15 | 400 | 1.5 | | L288, L344 |

**Fixed by 07-design:** H1 88 px desktop, about 52 px at 390 px; H2 38 px; body 18 px; captions 13 to 15 px; sizes use `clamp()`.

**Proposed:** H1 interpolates linearly from 52 px at 390 to 88 px at 1280, which gives `clamp(<min>, 36.2px + 4.045vw, 88px)` and about 49 px at 320. Other display sizes (H2, `/for` H1, 404 H1, result figures) scale on the same slope ratio; exact `clamp()` values set in Phase 1 from screenshots.

**Open**
- Q-06: 11 and 12 px Plex Mono labels are below the 13 px caption floor in 07-design. Raise to 13 (proposed) or record an exception for mono labels.
- Q-07: The mockup loads Newsreader italic 500, but no element uses it. Drop it from the subset (proposed) to save bytes (N-01).
- Q-08: Variable Newsreader with `opsz`, or static instances? Decide on font bytes against the N-01 budget, with Frontend.
- Q-09: `/for` H1 (64) and 404 H1 (56) at 390 px: not specified. Proposed: same slope as the home H1.
- Q-10: Fallback metric overrides (`size-adjust`, `ascent-override`) to keep CLS under 0.05 during font swap. Frontend implements; values measured, not chosen.

---

## 3. Spacing (8 px rhythm)
**Source:** the design-lead brief (R-602 item 5) and every `gap`, `padding` and `margin` in the mockup.

**Observed values**
| Class | Values | Typical use |
|---|---|---|
| Multiples of 8 | 8, 16, 24, 32, 48, 56, 64, 72 | header padding, gutters, card gap, section gap (72), `/for` gaps (48, 56), 404 padding (64) |
| Multiples of 4 only | 4, 12, 20, 28, 36, 52 | label gaps, hero gap (28), contact padding (36), résumé padding (52), summary height (52) |
| Off rhythm | 1, 2, 5, 6, 9, 10, 14, 18, 22, 26 | diff line padding, chip padding, section-internal gaps (14, 18, 22), CTA gap (26) |

**Proposed rules**
- Block spacing (between sections, between blocks in a section, container padding) uses multiples of 8 only.
- 4 is allowed inside a component (label to value, chip padding, row gap in tag lists).
- Off-rhythm values snap to the nearest multiple of 8; ties (12, 20, 28, 36, 52) are settled per element with screenshots in Phase 1.
- The rhythm applies to spacing, not to line boxes. Body line height stays 1.55 from the mockup unless Q-12 changes it.
- Proposed scale tokens: `--space-1` 4, `--space-2` 8, `--space-3` 16, `--space-4` 24, `--space-5` 32, `--space-6` 48, `--space-7` 56, `--space-8` 64, `--space-9` 72 (all present in the mockup).

**Open**
- Q-11: Control heights 44 (text links, inputs, dialog buttons) and 52 (fold summary) are off rhythm. 44 is the touch-target floor (N-02). Keep 44 as an exception, or move all controls to 48?
- Q-12: Body line height 1.55 gives a 27.9 px line. Keep, or set 1.5 / 1.556? Only matters if we want text baselines on the 8 px grid; proposed: no.

---

## 4. Layout grid
**Source:** L33, L42 (container), For L28, 404 L20, L55, L107, L161, L203, For L72 (track minimums), dialog widths L276, L339.

**Fixed by the mockup**
- One column. No 12-column grid. Content max width 1120 px (home), 1100 px (`/for`), 860 px (404, résumé dialog), 820 px (brief dialog). Side gutter 24 px at every width.
- Text measures: lede 620, production prose 760, fit intro 700, `/for` lede 700, contact prose 560.
- Intrinsic grids, all `repeat(auto-fit, minmax(<min>, 1fr))`: results strip 220, featured projects 240 (gap 32), `/for` topics 240 (gap 18), figure tiles 280 (gap 18), company and role fields 220 (gap 12).
- Flex rows with basis split: fit-check evidence rows 230 / 340, `/for` evidence rows 260 / 360, "More projects" rows 88 / 200 / 340.
- Every block starts on the left content edge. The results strip's first cell has no left padding so its figure aligns with the H1 (L56). The figures panel bleeds 24 px into the gutter on both sides and pads back (L150), so its content stays on the edge.
- 1.5 px ink rules mark the start of a major block (results strip, fit report, `/for` evidence, topics, footer). 1 px `--rule` divides rows. 1 px `--rule-faint` divides list rows inside folds.

**Proposed definition of "on grid" for reviews (R-602 item 5):** text and rules start on the content edge or on a track edge of the intrinsic grids above; measures are the ones listed; nothing is centered except dialogs.

**Open**
- Q-13: Unify the container at 1120 for `/for` (proposed) or keep 1100?
- Q-14: Should the measures become tokens (`--measure-lede` and so on)?

---

## 5. Breakpoints: 320, 390, 768, 1280
**Source:** computed from section 4. The mockup has no media queries; everything reflows through `auto-fit` and `flex-wrap`.

Content width is viewport minus 48 px, capped at 1120 (home).

| Element | 320 (272 px) | 390 (342 px) | 768 (720 px) | 1280 (1120 px) |
|---|---|---|---|---|
| Results strip (min 220) | 1 column | 1 column | 3 columns | 3 columns |
| Featured projects (min 240, gap 32) | 1 | 1 | 2 by 2 | 4 across, 256 px each |
| Figure tiles (min 280, gap 18) | **overflows** (280 > 272) | 1 | 2 | 3 |
| Fit evidence rows (230 + 340 + 20) | stacked | stacked | one line | one line |
| "More projects" rows | stacked | stacked | link wraps | one line |
| `/for` topics (min 240) | 1 | 1 | 2 + 1 | 3 |
| Company and role fields (min 220) | 1 | 1 | 2 | 2 |
| Contact email button (Plex Mono 15, 23 chars, 22 px padding) inside 36 px padding | **overflows** (about 251 px in 200 px) | fits | fits | fits |

**Open (all must be fixed for N-04, no horizontal scroll from 320 px)**
- Q-15: Figure tiles: use `minmax(min(280px, 100%), 1fr)` (proposed).
- Q-16: Contact block at 320: reduce padding to 24 (proposed, also fixes rhythm) and allow the email to wrap.
- Q-17: Results strip in one column: the `border-left` dividers and 18 px left padding on cells 2 and 3 (L60, L64) become wrong when stacked. Proposed: top rule between stacked cells, zero left padding, below the 3-column width.
- Q-18: Are any explicit media queries needed beyond the type `clamp()`s and Q-16, Q-17? Proposed: no; one breakpoint at most, chosen where the results strip leaves one column.

---

## 6. Shared components
**Source:** Main L14 to L28 class rules and repeated inline patterns.

| Component | Fixed by the mockup | Source |
|---|---|---|
| Solid button | the only filled button style (07-design). Ink fill, paper text, Plex Mono 15 / 500, min height 48, padding 0 22, square corners | L18 to L19 |
| Inverted solid | paper fill on ink, used in contact and dialog toolbars | L264, L284, L341 |
| Text link | Plex Mono 14, underline `#8A8474` offset 4, min height 44 | L20 |
| Inline link | inherits family, underline `#8A8474` offset 3, `↗` for external | L15, L83 |
| Chip (proven skill) | Plex Mono 12, padding 2 9, 1 px `--rule` border, `--card` fill | L22 |
| Gap chip | same, 1 px dashed `#8A8474`, no fill | L238 |
| Fold (`<details>`) | summary: Plex Mono 15, min height 52, top 1 px `--rule`, "+" marker 16 px wide, count in `--muted` after the label | L23 to L27 |
| Section label | Plex Mono 13 `--muted`, numbered "01 · production" | L73, L105, L190 |
| Margin note | Newsreader italic, `--note`, 16 to 18 px | L17, L98, L180 |
| Verdict box | fill by verdict (section 9), paper text, verdict Newsreader 34, counts Plex Mono 13 | L213 to L217, L438 to L441 |
| Dark band | ink block: diff, contact, `/for` top bar, 404 traceback | L93, L260, For L22, 404 L23 |
| Figure tile | `--card` fill, 1 px `--rule` border, 12 padding, title and date row, 180 px media well on white, caption, note | L163 to L181 |
| Dialog | fixed overlay ink at 62%, centered column, toolbar row above a white article | L275 to L287 |

**Open**
- Q-19: Section numbers "01 · production" carry order, but sections after 03 (background, contact) are unnumbered. Number all, or only the three that are in the nav?
- Q-20: The 404 margin note is rotated -1 degree (404 L31) to imitate handwriting. With no handwriting font, the rotation is decoration only (R-602 item 4). Proposed: drop it.

---

## 7. Home page sections
Order from F-01 and the mockup. Each item: source, what it holds, open questions.

### 7.1 Header and navigation
- Source: L33 to L40. Name in Plex Mono 14 / 600 on the left; nav "work", "check fit", "contact" in Plex Mono 14, gap 18. Not sticky. Hidden in print (`.noprint`).
- Q-21: Nav links are text with no 44 px height in the mockup (N-02). Give them `min-height: 44px`.

### 7.2 Hero
- Source: L44 to L54. Eyebrow (role · location · availability), H1 name, lede at 620 measure, action row: "View résumé" (solid), email (text link), "Check fit against your role ↓" (text link). Static HTML, works without JS (F-03, R-605). Without JS, "View résumé" is a link to the ML Engineer PDF (F-04).
- Hidden photo slot (F-17): not in the mockup. Proposed: at 768 and up, a fixed-ratio slot to the right of the name block; at 390, above the eyebrow. When `showPhoto` is false the slot renders nothing and reserves no space.
- Q-22: Photo slot position, aspect ratio and size. Decide in Phase 1 with a test image; no photo ships in v1.

### 7.3 Results strip
- Source: L55 to L68. `<dl>`, three cells, figure in Plex Mono 38 / 500, label in Newsreader 15. 1.5 px ink rules top and bottom; 1 px `--rule` between cells. Numbers from `claims.json`.
- Mobile: see Q-17.

### 7.4 Credentials line
- Source: L69. One line of Plex Mono 13 `--muted`: IEEE, MS, interns. Wraps on mobile.

### 7.5 01 · Production
- Source: L72 to L102. Label, H2 with date range right-aligned on the baseline, summary at 760 measure, then two folds:
  - "What I built there" (5 items, `<ul>`, bold lead-in, inline "rebuild ↗" link).
  - "The loan agent, then and now" (v1 → v2): dark diff block, Plex Mono 13, `-` lines on `--diff-del-bg`, `+` lines on `--diff-add-bg`, then a margin note.
- Q-23: The diff block scrolls horizontally (`overflow-x: auto`). Lines wrap (`pre-wrap`), so at 320 nothing should scroll. Confirm, and make the block focusable if it can scroll (axe `scrollable-region-focusable`).

### 7.6 02 · Selected work
- Source: L104 to L133, data L467 to L479. Four cards: date, H3 name, plain one-liner, figure block between two 1 px rules (figure Plex Mono 22, context Newsreader 14), links row.
- Demo panel: the mockup toggles a white box with URL bar and a 200 px description area ("try it here" / "close demo"). F-09 and `docs/spec/06-architecture.md` §5.6 replace it: static screenshot first, a "Load live demo" button that creates the `*.hf.space` iframe on click, a note that free demos can take up to a minute to wake, and a direct link fallback.
- Q-24: Demo panel layout inside a 256 px card at 1280. Proposed: the panel spans the full grid row under the card row, not inside the card. Needs a mockup frame in Phase 1.
- Q-25: Demo status from `status.json` (F-10): how a down demo is shown on the card. Proposed: the demo button is replaced by the direct link and a Plex Mono 12 `--muted` status line. No colored dots.

### 7.7 More projects (fold)
- Source: L134 to L146, data L481 to L487. Rows: date (88 px), name (600), line, link. Faint rule under each row.

### 7.8 Figures from the repos (fold)
- Source: L147 to L186, data L490 to L517. The only graph-paper area (07-design). Intro line, horizontal timeline (dates in Plex Mono 11, labels in Newsreader 13; project entries are buttons that select a project), then tiles: 6 images from `reference/figures/` and 4 true-to-scale bar charts, each on its own axis (F-08). The selected project's tiles get a 2 px ink border.
- Q-26: The timeline is a horizontal scroll region with buttons 36 px tall (below 44, N-02). Proposed: 44 px buttons, focusable region, and a visible scroll affordance at 390.
- Q-27: Selection changes the tile border from 1 to 2 px, which shifts content by 1 px. Proposed: `outline` or an inset border so size does not change.
- Q-28: What the selection does without JS (R-605 does not cover figures, but the fold must still read). Proposed: no selection, all tiles equal.

### 7.9 03 · Check fit
- Source: L189 to L247, logic L416 to L449, samples L408 to L414. Label, H2, intro (700 measure), "try:" with three sample buttons, visually hidden label, textarea (6 rows, 8,000 max, `--card` fill, 1.5 px ink border, square), fold for company and role title, "Check fit" solid button. Report: verdict box beside a note, evidence rows (name, proof, link, chips), gap chips, then "Open the one-page brief" (solid) and "Forward to the hiring manager" (text link).
- Q-29: Sample buttons are 40 px tall (below 44). Raise to 44 or 48.
- Q-30: No-JS state: the form cannot run. Proposed: the section renders with a one-line notice in place of the button, written by the Supervisor (copy is not invented here).
- The page has two solid buttons visible at once after a report (Check fit, Open the brief). 07-design allows one solid style, not one instance; confirm hierarchy in Phase 1 screenshots.

### 7.10 Background (fold)
- Source: L249 to L258. "Education and publication", count 3. Degree lines with right-aligned years in Plex Mono 12.
- Q-31: Which date format each surface uses (year only here, month and year in résumé, ranges on cards). Proposed: cards and résumé use `dateRange` in full; timeline and folds use the start year or month only.

### 7.11 Contact
- Source: L260 to L270. Ink band, 36 px padding, H2 40, line in `#D9D4C7`, actions: email (inverted solid), "View résumé" (text button), LinkedIn, GitHub, Hugging Face.
- Adds (F-14): phone as a `tel:` link, Medium labeled "Writing".
- Q-32: Order of the seven contact actions and how they wrap at 390. Proposed: email, phone, résumé on the first line; profile links on the second.

### 7.12 Footer
- Source: none on the home mockup. Pattern from `For` L79 to L82: 1.5 px ink top rule, Plex Mono 13 `--muted`, space-between, wraps.
- Holds (F-10, F-13, F-14): last updated date and demo status from `status.json`, profile links including "Writing", and a link to the privacy page.
- Q-33: Final footer content order and whether the privacy link lives here only. Proposed: here only.

### 7.13 Résumé dialog
- Source: L274 to L335, roles L401 to L406. Toolbar: tablist (AI Engineer, ML Engineer, Data Scientist; selected tab inverted), "Download PDF" (inverted solid), "Close" (outlined on ink). Article on white, padding 48 52, Newsreader 15, sections: header, summary, education, skills, work experience, projects, publication. Opens on the role family of the last fit-check result, otherwise ML Engineer.
- Q-34: At 390 the article has 254 px of text width (52 px side padding). Proposed: padding 24 at narrow widths.
- Q-35: The screen article and the PDF are the same layout (section 12). Confirm the dialog shows the role summary and the full résumé, or the summary plus a PDF link only (F-04 says "shows the matching summary").

### 7.14 Brief dialog
- Source: L337 to L373. Toolbar: "Save as PDF" (calls print), "Close". Article: "CANDIDATE BRIEF · date", title "Rohan Jain for <role> at <company>", contact line with phone and availability, verdict and counts, role summary, evidence, ramp-up line, background, provenance line. Print layout in section 12.

---

## 8. Other pages

### 8.1 `/for/<slug>`
- Source: `For.dc.html`. Ink top bar (prepared-for line, page URL and month), intro (label, H1 64, lede, solid button to the matching résumé, email link), verdict box beside a paragraph, evidence rows with chips, ramp-up chips and a margin note, "Good topics for a first conversation" (three items under 1.5 px ink rules), footer.
- `noindex, nofollow`, not in the sitemap (R-503).
- Q-36: The lede, the gap note and the three topics are tailored prose, but `applications/<slug>.json` (`docs/spec/06-architecture.md` §5.3) has no fields for them. Either the schema grows (App/Data, Supervisor) or the page drops those blocks. Design needs the answer before laying out the page.
- Q-37: Link unfurls. `/for` links are sent to recruiters and will unfurl in mail, Slack and LinkedIn. Use the site OG image, or a per-application card naming the company?

### 8.2 404
- Source: `404.dc.html`. Label "step 404", H1 "Run crashed. Loss is NaN." (F-11), traceback in an ink block, margin note, back link.
- Conflicts: full-page graph paper (07-design limits it to the figures section), its own background `#F4F1E8`, red error line (Q-04), rotated note (Q-20).
- Q-38: Keep graph paper on the 404 (the page is a lab-notebook joke and the grid supports it) or use plain `--paper` to follow 07-design? Proposed: plain paper. Needs a Supervisor call if kept.
- Q-39: The traceback contains "404" and line numbers. R-301 maps every number in built HTML to a claim; QA and App/Data need an allowlist for the 404 page and for section numbers "01" to "03".

### 8.3 Privacy page (not in the mockup)
- Requirement: F-13, `docs/spec/08-security.md` §8.8. States what is and is not collected.
- Proposed layout: home header and footer, one prose column at the 700 measure, H1 at the 404 size, Plex Mono labels for each item, no folds. Copy from Security and the Supervisor.
- Q-40: Does the privacy page carry a "last updated" date? It would come from content, not markup.

### 8.4 `/for` expiry page (not in the mockup)
- Requirement: `docs/spec/06-architecture.md` §5.5: "a short notice with a link to the main site".
- Proposed layout: the 404 structure (label, H1, one paragraph, back link) on plain paper, without the traceback or the ink top bar. Copy from the Supervisor.
- Q-41: Does the expired page name the company it was prepared for? Proposed: no.

---

## 9. States
**Source:** Main L13 to L29, data functions (L438 to L441, L495 to L499, L513 to L516, L525 to L529). "Open" means the mockup does not define it.

| Element | Hover | Focus | Open / selected | Empty | Error | Loading |
|---|---|---|---|---|---|---|
| Links | underline to ink, text `#000` | 2 px ink outline, offset 2 | | | | |
| Solid button | fill `#3A3833`, text white | same ring | | | | |
| Inverted solid (on ink) | open | ink ring is invisible on ink (Q-42) | | | | |
| Fold summary | open | ring | "+" rotates 45 degrees in 150 ms | | | |
| Sample buttons | open | ring | which sample ran is not shown (Q-43) | | | |
| Textarea and inputs | open | ring | | placeholder "Paste the full posting here." | over 8,000 chars is cut silently (Q-44) | |
| Verdict box | | | "Strong fit" ink; "Good fit, with gaps" `#3A3833`; "Not a strong fit" `#6B6559`; "Not enough to go on" `--muted` | no report before the first run | | |
| Evidence rows / gaps | | | | rows or gaps hidden when empty | | |
| Timeline item | open | ring | ink underline and 600 weight vs `#B9B2A0` underline | | | |
| Figure tile | | | 2 px ink border (Q-27) | | image fails: alt text only (open) | images lazy-load (open) |
| Demo panel | | ring | "try it here" / "close demo", `aria-expanded` | | demo down or blocked: direct link (Q-25) | "may take up to a minute to wake" (copy from §5.6) |
| Résumé tabs | open | ring | selected tab inverted | | PDF missing: build fails, not a UI state | |
| Dialogs | | focus trapped, Escape closes | overlay ink 62% | | | |
| Footer status | | | | `status.json` missing: hide the line (proposed) | stale data: show the date it was checked | |
| Fonts | | | | | | swap with metric-matched fallback (Q-10) |

**Open**
- Q-42: Focus ring on ink surfaces (contact, dialog toolbars, `/for` bar, 404 traceback). Proposed: 2 px `--paper` outline on dark surfaces.
- Q-43: Show which sample posting is loaded (pressed state with `aria-pressed`)?
- Q-44: Show a character count near 8,000? Proposed: show it only past 7,000.
- Q-45: Disabled and pressed states for buttons are not defined. Proposed: no disabled buttons anywhere; "Check fit" always runs and an empty input gives "Not enough to go on".

---

## 10. Motion
**Source:** L25 to L26 (the only transition in all three mockups); R-608.
- The fold marker rotates 45 degrees in 150 ms `ease`. That is the only motion.
- Under `prefers-reduced-motion: reduce` the marker changes with no transition.
- Dialogs, demo panels and report reveal appear with no animation. No scroll animation, no smooth scroll, no typing effect.
- Q-46: None open. Any new motion needs a stated purpose and must be 200 ms or less (R-608).

---

## 11. Mobile layouts (390, with 320 checks)
**Source:** section 5 computations; screenshots at 390 are the R-602 item 6 baseline.

| Section | At 390 |
|---|---|
| Header | name and nav on one line if they fit, else nav wraps under the name |
| Hero | H1 about 52 px; lede full width; action row wraps: solid button first, then the two text links each on their own line |
| Results strip | three stacked cells with top rules (Q-17) |
| Production | date range wraps under the H2; folds full width |
| Selected work | one card per row; demo panel full width under its card |
| Figures | timeline scrolls inside its region; tiles one per row |
| Check fit | sample buttons wrap; textarea full width; report: verdict box above the note, rows stacked |
| Contact | padding 24 (Q-16); actions wrap in the order from Q-32 |
| Dialogs | 16 px overlay padding; article padding 24 (Q-34); toolbar wraps tabs above the buttons |
| `/for` | top bar wraps to two lines; H1 scales (Q-09); verdict box above the paragraph; topics stack |

- Q-47: Should the 390 home page fit name, role, and one proof point in the first screen (success criterion 1, 5-second test)? Proposed: yes; measure in Phase 2 and tune hero spacing to make it true.

---

## 12. Print layouts
**Source:** 07-design §7.3 (black on white, no navigation, 18 mm margins, URLs printed after links); Main L28 (`.noprint`); résumé article L288 to L332; brief article L344 to L370; `docs/spec/06-architecture.md` §5.8.

### 12.1 Résumé PDF (three variants)
- Rendered by Playwright from `/print/resume/[role]` (noindex). Single column, one to two pages, text selectable, fonts embedded. Only the summary differs between variants.
- Layout from the résumé article: name Newsreader 32 / 600; contact line Plex Mono 12 with location, phone, email and profile links; section heads Plex Mono 12 caps with 0.08em tracking; dates right-aligned in Plex Mono 12; body Newsreader 15 / 1.5; bullets indented 18.
- Q-48: Page size, US Letter or A4? Not in any source. US Letter is the likely reader default; needs a Supervisor decision.
- Q-49: Profile links in the PDF: print full URLs after the labels (07-design), or use the URLs as the labels to save a line?
- Q-50: Section heads in `--muted` on screen; in print, ink (strict "black on white") or keep the grey? Proposed: ink.

### 12.2 One-page brief
- Printed through the browser dialog from the brief view. Must fit one page in Chromium and WebKit (Phase 3 gate).
- Hides everything except the article: page header, sections, overlay and toolbar.
- Verdict is bold text, not a filled box, so it prints as black on white.
- Q-51: Behavior when the evidence or gaps would push past one page. Proposed: the engine already caps rows at 4 and tags at 6 in the tag line; gaps line truncates with a count. Confirm with App/Data.

### 12.3 Other pages
- Home and `/for` print: not a design target in 07-design. Proposed: a basic print style (no navigation, ink on white, dark bands printed as outlined blocks, folds printed open).
- Q-52: Print the `/for` page as a designed layout, since recruiters may print it?

---

## 13. Items the mockup leaves open
| Item | Requirement | Derive from | Open |
|---|---|---|---|
| OG image | F-12, Phase 6 | hero: paper background, name in Newsreader 500, eyebrow in Plex Mono, `rohanjain.pro` in Plex Mono, 1.5 px ink rule | Q-53: size (the common platform size is 1200 by 630; confirm per platform); Q-54: include proof numbers? If yes they must render from `claims.json` at build time so R-301 can check them; proposed: no numbers |
| Favicon | none | header wordmark (Plex Mono 600, ink on paper) | Q-55: monogram "RJ" vs the fold "+" mark; formats (SVG plus PNG fallbacks) |
| Privacy page | F-13 | section 8.3 | Q-40 |
| `/for` expiry page | §5.5 | section 8.4 | Q-41 |
| Brief layout | F-06 | section 12.2 | Q-51 |
| Résumé PDF layout | F-15 | section 12.1 | Q-48 to Q-50 |
| Hidden photo slot | F-17 | section 7.2 | Q-22 |
| Footer | F-10 | section 7.12 | Q-33 |
| Demo panel with screenshot | F-09 | section 7.6 | Q-24, Q-25 |

---

## 14. Decisions needed from other roles
Most questions above are design calls the Design Lead closes in Phase 1. These need someone else:

| ID | Question | Who |
|---|---|---|
| Q-01, Q-02 | Extend the 07-design token list beyond 10 colors | Supervisor (spec edit) |
| Q-03, Q-38 | Graph paper outside the figures section; implement without gradients | Supervisor (ADR), Frontend |
| Q-04 | Red outside margin notes on the 404 | Supervisor (keep the rule, proposed) |
| Q-39 | Claims-check allowlist for "404", traceback line numbers and section numbers | QA, App/Data |
| Q-36 | `/for` schema fields for lede, gap note and topics | App/Data, Supervisor |
| Q-30, Q-40, Q-41 | Copy for the no-JS fit check, privacy page and expiry page | Supervisor, Security (privacy facts) |
| Q-48 | PDF page size | Supervisor |
| Q-51 | Brief overflow rules | App/Data |
| Copy | "Hiring? Paste the job description." (L191) and "Have a role in mind?" (L261) are questions in headings. R-006 and R-602 item 2 ban rhetorical questions. Keep as approved mockup copy, or rewrite | Supervisor |

---

## 15. Phase 1 completion checklist
- [ ] Every `Q-nn` closed: decided here, or by an ADR the Supervisor writes.
- [ ] `src/styles/tokens.css` holds every color, size and space value used; no raw values in components.
- [ ] Reference screenshots of each page at 320, 390, 768 and 1280 px, plus brief and résumé print previews, in `docs/design/`.
- [ ] Mockup frames for the open items in section 13.
- [ ] A short "deliberate details" list reviewers can check (for example: results figures align with the H1 edge; the fold "+" is the only motion).
