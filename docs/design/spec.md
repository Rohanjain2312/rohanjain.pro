# Design spec

Status: **complete** (Phase 1, issue #19). It replaces the Phase 0 outline (issue #6, PR #48).
Owner: design-lead. Rules served: R-505, R-601, R-602, R-604, R-605, R-606, R-608, R-609.
Closed questions: the ones that needed the Supervisor are closed by **ADR-0015** (`docs/adr/0015-design-outline-decisions.md`). The Design Lead closed the rest here. Index in section 14.

## How to read this file
- Every value carries a **Source** tag. `Lnn` is a line in `reference/mockup/Main.dc.html`; `For Lnn` and `404 Lnn` are lines in the other two mockups; `07-design` is `docs/spec/07-design.md`; `ADR n` is an item of ADR-0015; **DL** is a Design Lead decision made in this file, with its reason.
- Question IDs `Q-nn` are kept from the outline so older reviews still trace. None is open.
- Sizes are CSS px unless a unit is shown. Tokens are written in `rem` at 16 px.
- Where this file departs from a mockup it says so and gives the reason. Judge screenshots against this file first, then the mockup.
- Precedence when sources disagree: client decisions (`docs/spec/01-product.md`, `docs/spec/05-evidence-ledger.md`), then ADR-0015, then `07-design`, then this file, then the mockup.
- A value is on the 8 px rhythm when it is a multiple of 8, or 4 inside a component. Section 3 has the snap rules.

---

## 0. Rules, and what is not ported from the mockup

### 0.1 The inline rule (R-505, ADR 5)
The built site has:
- **no `style` attributes**, in markup or set from script (`setAttribute('style')`);
- **no inline `<style>` element**;
- **no inline `<script>` element**.

The CSP is `style-src 'self'` and `script-src 'self'` with no `unsafe-inline` (R-505). Dynamic appearance uses classes, the `hidden` attribute, `aria-*` attribute selectors, and SVG geometry written at build time (SVG attributes such as `width` on a `<rect>` are not `style` attributes). The one inline block the product needs is the JSON-LD `Person` data block (F-12). It is data, not code, and Security confirms the exemption (section 14.3).

### 0.2 Not ported
| Mockup item | Where | Replacement |
|---|---|---|
| Google Fonts `<link>` and preconnect | Main L11 to L12, For L11 to L12, 404 L11 to L12 | Self-hosted Newsreader and IBM Plex Mono, WOFF2, `font-display: swap` (ADR-0006, `docs/spec/06-architecture.md` §5.1). Section 2 |
| `'Rohan Hand'` font in `.note` | Main L17, For L18, 404 L32 | Newsreader italic in `--note` (client decision 7) |
| DC runtime (`support.js`, `<x-dc>`, `<sc-for>`, `<sc-if>`, `DCLogic`) | all files | Astro components and vanilla TypeScript islands |
| Every `style="..."` and `{{x.style}}` | all files | Classes and tokens (0.1) |
| `linear-gradient` graph paper | Main L150, 404 L19 | One SVG tile used as a CSS mask, only in the figures section (1.3, ADR 3, R-601) |
| Graph paper, `#F4F1E8` background, `#F08A84` error line and -1 degree rotation on the 404 | 404 L14, L19, L31, L32 | Plain `--paper`, traceback error line set by weight, no rotation (8.2, ADR 3 and 4) |
| `a:hover{color:#000}` | Main L15, For L15 | Unreadable on ink surfaces (text turns black on `#1B1A17`). Hover changes the underline only (section 9) |
| 404 link style (`#5E5A50` underline, hover and focus) | 404 L15, L16 | The site link style (section 9) |
| `href="Main.dc.html"` placeholders | For L35, For L81, 404 L33 | Real routes: the matching résumé PDF, `/` |
| Demo panel placeholder (URL bar and 200 px text area) | Main L125 to L130 | A dialog with a static state and a "Load live demo" button (7.6, F-09, R-512) |
| Hard-coded numbers in markup | everywhere | Every number from `src/content/claims.json` through a component (R-301) |

### 0.3 Mockup content that client decisions override
These are content fixes owned by App/Data and the Supervisor. They are listed so screenshots are not judged against stale mockup copy.

| Mockup | Where | Source of truth |
|---|---|---|
| FinCompress "pruning 29% of attention heads raised validation Macro F1 from 0.888 to 0.897" | résumé dialog L325 | Ledger: "pruning 50% of attention heads improved val Macro F1 by +0.9 points" |
| FinCompress tile caption "F1 peaks at 0.897 with 29% of heads pruned" and alt "peaking at 29%" | L506 | Caption must describe the chart without contradicting the résumé claim (ledger, last paragraph) |
| FinCompress card context "F1 0.89 → 0.77" | L471 | Not in the ledger. Omit unless sourced (R-005) |
| Market Regime "61.16% baseline", "MCC 0.480 vs -0.036", axis "Sep 2022 to Oct 2025" | L395, L509 | 81.78% and 0.480 are in the ledger; 61.16%, -0.036 and the date axis are not. 88.4% F1 (ledger) appears nowhere in the mockup |
| Project dates disagree between timeline, tiles and lists (Market Regime Nov vs Dec 2025, GraphBench Mar vs Aug 2026, FinCompress Feb vs Mar 2026, Self-Healing Feb 2026 vs ledger Feb to Aug 2026) | L481 to L512 | `projects.json` `dateRange`. 7.10 says which date each surface shows |
| Goldman tenure shown only as a date range | L76, L310 | Where tenure is stated in words it reads "~4 years at Goldman Sachs" (R-306) |
| Contact section has no phone and no Medium link | L260 to L270 | F-14 adds phone `(240) 495-9682` as a `tel:` link and Medium labeled "Writing" |
| Location | L46 | Already "New York, NY" (F-16). No change |

---

## 1. Color tokens
**Source:** 07-design §7.2; mockup `<helmet>` styles (Main L13 to L29) and inline styles. Token additions follow ADR 1 and 2. All colors come from `src/styles/tokens.css` (R-601).

### 1.1 Core tokens (07-design §7.2)
| Token | Value | Use |
|---|---|---|
| `--paper` | `#F6F3EB` | page background; text on ink |
| `--card` | `#FBF9F3` | chips, textarea, inputs, figure tiles |
| `--ink` | `#1B1A17` | text, 1.5 px rules, solid button, dark bands, focus ring |
| `--ink-2` | `#2C2A25` | lede and body prose, secondary prose |
| `--muted` | `#5E5A50` | labels, dates, captions; weak bar fill; "Not enough to go on" fill |
| `--rule` | `#CFC8B6` | 1 px dividers, chip and tile borders, inverted-button hover fill |
| `--rule-faint` | `#E2DCCC` | list rows in folds, image frames, bar track |
| `--note` | `#B42B25` | margin notes only |
| `--diff-del-bg` | `#3A2422` | removed lines in the v1 → v2 diff |
| `--diff-add-bg` | `#22331F` | added lines in the v1 → v2 diff |

### 1.2 Added tokens (ADR 1 and 2): each carries a distinct state or surface
| Token | Value | Mockup source | Role |
|---|---|---|---|
| `--rule-strong` | `#8A8474` | L15, L20, L238, For L65 | link and button underline; dashed gap-chip border; unselected timeline underline |
| `--ink-3` | `#3A3833` | L19, L440 | solid-button hover fill; "Good fit, with gaps" fill |
| `--verdict-weak` | `#6B6559` | L441 | "Not a strong fit" fill |
| `--on-ink-muted` | `#B8B2A3` | For L25, For L43 | secondary text on ink (also replaces `#D9D4C7`, Main L262) |
| `--diff-del-fg` | `#E3C9C4` | L460 | text on removed diff lines |
| `--diff-add-fg` | `#D3E6C8` | L460 | text on added diff lines |
| `--grid-line` | `#E9E4D6` | L150 | graph-paper line (1.3) |
| `--overlay` | `#1B1A179E` | L275, L338 | dialog backdrop (ink at 62%; the mockup writes `rgb(27 26 23 / 0.62)`, but Stylelint bans `rgb()` outside the token file, so the token is the hex8 form, DL) |
| `--print-paper` | `#FFFFFF` | L126, L166, L169, L288, L344 | résumé and brief sheet; print background (ADR 2) |

### 1.3 Aliases (no new value) and mapped colors
Aliases: `--well` = `--print-paper` (image and bar wells, demo stage; L126, L166, L169). The other `#FFFFFF` uses are the résumé and brief sheets (L288, L344), which are `--print-paper` itself, and the solid-button hover text (L19), which maps to `--paper` below; `--verdict-strong` = `--ink`; `--verdict-good` = `--ink-3`; `--verdict-none` = `--muted`; `--focus` = `--ink`, re-mapped to `--paper` inside any ink surface (9.1).

Mapped onto existing tokens (ADR 1, near-duplicates):
| Mockup value | Where | Becomes | Reason |
|---|---|---|---|
| `#3D3A33` | L58, L62, L66, L128, L151, L192, L202, L238, L291, L348 | `--ink-2` | Same role; 12.93 on paper instead of 10.23 |
| `#EDE9DD` | L93, L215, 404 L23 | `--paper` | Higher contrast on `#6B6559` (5.22 instead of 4.76) |
| `#D9D4C7` | L262 | `--on-ink-muted` | One secondary tone on ink instead of two |
| `#000000` | L15 | `--ink` | Hover changes the underline, not the text |
| `#FFFFFF` hover text | L19 | `--paper` | Solid hover changes fill and adds an underline (9.1) |
| `#B9B2A0` | L498 | `--rule-strong` | Same underline as every other control; it was 1.91 to 1 on paper, now 3.36 |
| `#EFEBE0` | L173 | `--rule-faint` | Bar track |
| `#A9A291` | L500 | `--muted` | Weak bar. It was 2.13 to 1 on its track; now 5.02 (Q-05) |

Dropped (ADR 3 and 4): `#E7E2D4` (404 graph paper), `#F4F1E8` (404 page), `#F08A84` (404 error line, red outside margin notes).

**Graph-paper line color (Q-03): `#E9E4D6`.** It is the value in the figures section (L150), the only place graph paper is allowed (07-design §7.3). `#E7E2D4` belonged to the 404, which loses its grid. Contrast with paper is 1.15, so the grid is texture only; nothing depends on it (ink on it: 13.7).

**Graph-paper tile (ADR 3):** `src/assets/graph-paper.svg`, a 24 by 24 viewBox holding two filled rectangles, `0 0 24 1` and `0 0 1 24`, in any opaque color. CSS uses it as a mask so the line color stays a token and no gradient exists:
- the figures panel (7.8) gets a `::before` positioned over its whole box, behind the content (`z-index: -1` inside an isolated stacking context);
- `mask-image: url(...)`, `mask-size: 24px 24px`, `mask-repeat: repeat`, plus the `-webkit-` prefixed pair; `background-color: var(--grid-line)`.
Cell size 24 and line width 1 are the mockup's (L150). The lines run from the panel's top-left corner, as in the mockup.

### 1.4 Measured contrast (WCAG 2.x, computed from the values above)
| Pair | Ratio | Use |
|---|---|---|
| `--ink` on `--paper` / `--card` / `--print-paper` | 15.69 / 16.53 / 17.40 | text |
| `--ink-2` on `--paper` / `--card` / `--print-paper` | 12.93 / 13.62 / 14.33 | prose |
| `--muted` on `--paper` / `--card` / `--print-paper` | 6.20 / 6.53 / 6.88 | labels, captions |
| `--note` on `--paper` / `--card` / `--print-paper` | 5.72 / 6.02 / 6.34 | margin notes |
| `--paper` on `--ink` | 15.69 | text on dark bands |
| `--on-ink-muted` on `--ink` | 8.23 | secondary text on dark bands |
| `--paper` on `--ink-3` / `--verdict-weak` / `--muted` | 10.56 / 5.22 / 6.20 | verdict boxes, solid hover |
| `--diff-del-fg` on `--diff-del-bg`; `--diff-add-fg` on `--diff-add-bg` | 9.22; 10.20 | diff |
| `--ink` on `--rule` | 10.43 | inverted-button hover |
| `--rule-strong` on `--paper` / `--card` / `--print-paper` / `--ink` | 3.36 / 3.54 / 3.73 / 4.67 | underlines and dashed borders (non-text, 3:1) |
| `--ink` / `--muted` bar on `--rule-faint` track | 12.71 / 5.02 | bars (non-text, 3:1) |
| `--ink-3` hover fill against the `--ink` rest fill | 1.49 | too small to carry hover alone, so hover adds an underline (9.2) |

No pair is below its threshold. Text pairs are 4.5 or higher; non-text pairs are 3 or higher.

---

## 2. Type
**Source:** 07-design §7.3; Main L12 (weights loaded) and every inline `font-size`.

**Families:** `--font-serif` Newsreader, then `Georgia, serif`, for prose and headings. `--font-mono` IBM Plex Mono, then `monospace`, for numbers, labels, navigation, buttons and code. Newsreader italic in `--note` for margin notes. Fallbacks as in the mockup (L31, L34).

**Weights:** `--weight-regular` 400, `--weight-medium` 500, `--weight-strong` 600.

**Files (Q-07, Q-08, DL):**
- Newsreader roman, variable, axes `wght` (400 to 600) and `opsz` (6 to 72), Latin subset, `font-optical-sizing: auto`. The 88 px H1 needs the large optical size to match the mockup; static instances would not give it.
- Newsreader italic, 400 only, static. The mockup also loads italic 500 (L12) but no element uses it, so it is dropped.
- IBM Plex Mono 400, 500, 600, static, Latin subset. 600 is used by the wordmark (L34) and the 404 error line (8.2).
- Budget: 120 KB for all fonts (issue #21). If the total is over, Frontend reports sizes and the Design Lead cuts in this order: narrow the `opsz` range to 14 to 72, then drop Plex Mono 500 (solid buttons and card figures move to 400).

**Fallback metrics (Q-10):** Frontend sets `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` on the Georgia and monospace fallbacks from measured values so CLS stays under 0.05 during the swap (N-01). Values are measured, not chosen here.

### 2.1 Size ladder
| Token | Size | Mockup | Use |
|---|---|---|---|
| `--fs-xs` | 0.8125rem (13) | 11, 12 and 13 | labels, dates, chips, axes, tile heads, field labels, résumé and brief section heads |
| `--fs-sm` | 0.875rem (14) | 14 | nav, eyebrow, text link, textarea, card context, captions |
| `--fs-md` | 0.9375rem (15) | 15 | solid button, fold summary, results caption, résumé and brief body |
| `--fs-base` | 1rem (16) | 16 | card one-liner, project rows, background rows, tile note, 404 back link |
| `--fs-body` | 1.125rem (18) | 18 | body, margin note, verdict note (17 in L217 snaps to 18) |
| `--fs-h3` | 1.375rem (22) | 22 | card title, card figure, 404 margin note |

**Floor (Q-06, DL):** 13 px. 07-design sets captions at 13 to 15 px, so the 11 and 12 px mono labels (L22, L110, L127, L155, L176, L295, L368) are raised to 13. Nothing on the site, in the dialogs or in the PDFs is smaller than 13 px.

### 2.2 Fluid sizes (07-design: "use `clamp()`")
Each fluid size is linear in viewport width between 390 and 1280. The value at 390 is the minimum design size; the value at 1280 is the mockup's. The first argument of `clamp()` is the value at 320 rounded down to an even px, which never binds above 320.

| Token | Role | 320 / 390 / 768 / 1280 (px) | `clamp()` | Source |
|---|---|---|---|---|
| `--fs-h1` | Home H1 | 49 / 52 / 67 / 88 | `clamp(3rem, 2.264rem + 4.045vw, 5.5rem)` | L47, 07-design (88 and about 52) |
| `--fs-page` | `/for` H1 | 38 / 40 / 50 / 64 | `clamp(2.375rem, 1.843rem + 2.697vw, 4rem)` | For L32 (64); 40 at 390 is DL (Q-09) |
| `--fs-compact` | 404, privacy, expiry H1 | 34 / 36 / 45 / 56 | `clamp(2.125rem, 1.702rem + 2.247vw, 3.5rem)` | 404 L22 (56); 36 at 390 is DL (Q-09) |
| `--fs-h2` | Section H2, contact H2, `/for` verdict | 27 / 28 / 32 / 38 | `clamp(1.625rem, 1.476rem + 1.124vw, 2.375rem)` | L75, L106, L191, 07-design (38). Contact H2 (40, L261) and `/for` verdict (40, For L44) snap to 38; 28 at 390 is DL |
| `--fs-verdict` | Fit-check verdict | 28 / 28 / 31 / 34 | `clamp(1.625rem, 1.586rem + 0.674vw, 2.125rem)` | L214 (34); 28 at 390 is DL |
| `--fs-figure` | Results figure (Plex Mono) | 32 / 32 / 35 / 38 | `clamp(1.875rem, 1.836rem + 0.674vw, 2.375rem)` | L57 (38); 32 at 390 is DL |
| `--fs-lede` | Lede, home and `/for` | 20 / 20 / 22 / 24 | `clamp(1.125rem, 1.140rem + 0.449vw, 1.5rem)` | L48 (24); `/for` 22 (For L33) snaps to 24; 20 at 390 is DL |

H2 stays well above the 22 px H3 at 390 (28 vs 22), so the hierarchy holds on a phone. `/for` topics H2 is fixed at 28 (For L71), expressed as `--fs-h2-sub`.

### 2.3 Roles
| Role | Family | Size | Weight | Line height | Tracking | Source |
|---|---|---|---|---|---|---|
| H1, home | serif | `--fs-h1` | 500 | 0.95 | -0.03em | L47 |
| H1, `/for` | serif | `--fs-page` | 500 | 1 | -0.02em | For L32 |
| H1, 404, privacy, expiry | serif | `--fs-compact` | 500 | 1.05 | 0 | 404 L22 |
| H2 (section, contact, `/for` verdict) | serif | `--fs-h2` | 500 | 1.1 | 0 | L75, L261, For L44 |
| H2, `/for` topics | serif | `--fs-h2-sub` (28) | 500 | 1.1 | 0 | For L71 |
| Verdict, fit check | serif | `--fs-verdict` | 500 | 1.05 | 0 | L214 |
| Results figure | mono | `--fs-figure` | 500 | 1 | 0 | L57 |
| Lede | serif | `--fs-lede` | 400 | 1.35 home, 1.45 `/for` | 0 | L48, For L33 |
| H3 card | serif | `--fs-h3` | 600 | 1.2 | 0 | L111 |
| Card figure | mono | `--fs-h3` | 500 | 1.2 | 0 | L114 |
| Body | serif | `--fs-body` | 400 | 1.55 (Q-12: kept) | 0 | L31 |
| Margin note | serif italic | `--fs-body` (16 in tiles, 22 on 404) | 400 | 1.3 in tiles | 0 | L98, L180, 404 L32 |
| Wordmark | mono | `--fs-sm` | 600 | | 0 | L34 |
| Nav, eyebrow | mono | `--fs-sm` | 400 | | 0 | L35, L46 |
| Text link | mono | `--fs-sm` | 400 | | 0 | L20 |
| Solid button | mono | `--fs-md` | 500 | | 0 | L18 |
| Fold summary | mono | `--fs-md` | 400 | | 0 | L23 |
| Section label, dates, credentials, axis, field label, timeline date, demo URL, footer | mono | `--fs-xs` | 400 | | 0 | L73, L76, L69, L176, L204, L155, L127, For L79 |
| Uppercase labels (résumé heads, verdict label) | mono | `--fs-xs` | 400 | | 0.08em | L295, For L43 (0.06em snaps to 0.08) |
| Chip, gap chip, sample button | mono | `--fs-xs` | 400 | | 0 | L22, L238, L196 |
| Evidence name / proof | serif | `--fs-body` 600 / `--fs-sm` | | | | L224, L225 |
| Results caption | serif | `--fs-md` | 400 | | | L58 |
| Card one-liner, rows, background lines | serif | `--fs-base` | 400 | | | L112, L142, L252 |
| Card context, tile caption | serif | `--fs-sm` | 400 | 1.4 caption | | L115, L179 |
| Textarea, inputs | mono | `--fs-sm` | 400 | 1.6 | 0 | L200, L204 |
| Diff lines | mono | `--fs-xs` | 400 | 1.6 | 0 | L93 |
| Traceback | mono | `--fs-sm` | 400 | 1.7 | 0 | 404 L23 |
| Résumé / brief body | serif | `--fs-md` | 400 | 1.5 | 0 | L288, L344 |
| Résumé name / brief title | serif | 2rem (32) / 1.875rem (30) | 600 | 1.1 / 1.15 | 0 | L290, L347 |
| Brief verdict | serif | `--fs-h3` | 600 | | | L350 |

`/for` evidence proof (15, For L51) and the `/for` email link (15, For L36) snap to the Main values (14) so one component has one size (DL).

### 2.4 Arrows and dots use the system font (accepted, issue #126 item 1)
The Latin subsets do not hold U+2190 ←, U+2192 →, U+2193 ↓, U+2197 ↗, U+25CF ● and U+25CB ○. They render from the system monospace or symbol face. Accepted at the Phase 2 gate review (`docs/design/phase-2-gate-review.md`); measured on macOS, where they come from Menlo in text style and text color.
- Each glyph sits next to words and is decoration; where it stands apart it is `aria-hidden`. No meaning rests on it alone.
- No U+FE0F and no emoji codepoints, so iOS and Android keep text presentation.
- The family stays `var(--font-mono)` with the generic `monospace` last.
- If a capture on another platform shows a glyph in a proportional face or taller than the line, add it to the Plex Mono subsets then.

---

## 3. Spacing (8 px rhythm)
**Source:** R-602 item 5 and every `gap`, `padding` and `margin` in the mockup.

**Scale tokens (DL):** `--space-4`, `--space-8`, `--space-16`, `--space-24`, `--space-32`, `--space-40`, `--space-48`, `--space-56`, `--space-64`, `--space-72`. Named by their px value so a reviewer can check them against a screenshot. (The outline proposed index names; px names are harder to misuse.)

**Rules**
1. Block spacing (between sections, between blocks in a section, container padding) uses multiples of 8.
2. 4 is allowed inside a component (label to value, chip gaps, tag rows).
3. Borders and rules (1, 1.5, 2) are not spacing.
4. Mechanical snap for every off-rhythm mockup value: nearest scale value; ties go up.

| Mockup | Becomes | Mockup | Becomes |
|---|---|---|---|
| 1 (diff line padding, L459) | 0 | 14 | 16 |
| 2 (stack gaps, L223, L154) | 4 | 18 | 16 |
| 3 (résumé bullet gap, L312) | 4 | 20 (tie) | 24 |
| 5 (chip gap, L228) | 4 | 22 | 24 |
| 6 (tie) | 8 | 26 | 24 |
| 9, 10 | 8 | 28 (tie) | 32 |
| 12 (tie) | 16 | 36 (tie) | 40 |
| | | 52 (tie) | 56 |

**Exceptions (DL)**
- Chip vertical padding stays 2 (a font-box adjustment, L22).
- Chip row gap is 4 on both Main and `/for` (5 and 6 in the mockup, L228, For L52).
- Control heights: boxed controls (solid button, inputs, fold summary, tabs, sample buttons, dialog buttons) are 48, which is on the rhythm and above the 44 px target floor (N-02, R-606). Text-only links (nav, text links, row links, timeline buttons) keep `min-height: 44px` because their hit area has no visible edge (Q-11, Q-29). Fold summary moves from 52 to 48.
- Flex bases, grid minimums and measures (230, 340, 380, 220, 240, 280, 620, 700, 760) are widths, not spacing.
- Line heights are not on the 8 px grid (Q-12: body stays 1.55).

---

## 4. Layout grid
**Source:** L33, L42; For L28; 404 L20; track minimums; dialog widths L276, L339.

- One column. No 12-column grid. Content width 1120, centered, with 24 gutters outside it at every viewport (L33, L42). With `box-sizing: border-box` write `max-width: calc(var(--container) + 2 * var(--gutter))` (1168). Tokens `--container` 1120 and `--gutter` 24.
- `/for` uses 1120 too (the mockup has 1100, For L23, L28; Q-13, DL: one container for the two content pages). 404 and the expiry page use 860 (404 L20). Dialogs use 860 (résumé) and 820 (brief).
- Measures as tokens (Q-14, DL): `--measure-narrow` 560 (contact line, L262), `--measure-lede` 620 (L48), `--measure-read` 700 (fit intro L192, `/for` lede For L33, privacy, expiry), `--measure-wide` 760 (production summary L78).
- Intrinsic grids, all `repeat(auto-fit, minmax(min(<min>, 100%), 1fr))`: featured projects 240 (gap 32, L107), figure tiles 280 (gap 16, L161; was 18), `/for` topics 240 (gap 16, For L72; was 18), company and role fields 220 (gap 16, L203; was 12). The `min(..., 100%)` wrapper is Q-15 (ADR 6) and is applied to all four so none can overflow at 320.
- Results strip is not auto-fit. It is one column below 768 and three columns from 768 (5.1), because auto-fit would give two columns and drop the third cell alone onto a second row between about 490 and 710 px of viewport.
- Flex rows with a basis split: fit-check evidence rows 230 / 340 (L223, L228), `/for` evidence rows 260 / 360 (For L51), "More projects" rows 88 / 200 / 340 (L140 to L142).
- Every block starts on the left content edge. The results strip's first cell has no left padding so its figure aligns with the H1 (L56). The figures panel bleeds 24 into the gutter on both sides and pads back (L150), so its content stays on the edge.
- Rules: 1.5 px `--ink` starts a major block (results strip, report, `/for` evidence and topics, footers). 1 px `--rule` divides rows. 1 px `--rule-faint` divides list rows inside folds.

**"On grid" for R-602 item 5:** text and rules start on the content edge or on a track edge of the grids above; line lengths are the measures above; nothing is centered except dialogs and the 404 and expiry columns.

---

## 5. Breakpoints: 320, 390, 768, 1280
**Source:** computed from section 4. The mockup has no media queries.

- 320 and 390 are design widths, checked at every release. 768 and 1280 are design widths and the only layout break is **one media query at 768** (`@media (min-width: 48em)`, so it follows text zoom). Q-18 is closed: no other query is needed.
- Above 1280 nothing changes: the container stops growing at 1168 and the type is at its maximum.
- Content width is the viewport minus 48, capped at 1120.

### 5.1 Resolved layout per width
| Element | 320 (272) | 390 (342) | 768 (720) | 1280 (1120) |
|---|---|---|---|---|
| Header | name and nav wrap to two lines | one line | one line | one line |
| Results strip | 1 column, top rules | 1 column, top rules | 3 columns | 3 columns |
| Featured projects (240, gap 32) | 1 | 1 | 2 by 2 | 4 across, 256 each |
| Figure tiles (min(280, 100%), gap 16) | 1, 272 wide | 1 | 2 | 3 |
| Fit evidence rows (230 + 340 + 24) | stacked | stacked | one line | one line |
| "More projects" rows | stacked | stacked | link wraps | one line |
| Company and role fields | 1 | 1 | 2 | 2 |
| `/for` topics | 1 | 1 | 2 + 1 | 3 |
| Contact padding | 24 | 24 | 40 | 40 |
| Contact email button (23 characters, 15 px mono, 24 padding) | wraps after the `@` (10.5) | one line (255 in 294) | one line | one line |
| Résumé tabs | wrap to two rows | one row | one row | one row |
| Dialog overlay padding | 16 | 16 | 32 16 | 32 16 |
| Article padding (résumé, brief) | 24 | 24 | 48 56 | 48 56 |

### 5.2 Overflow fixes (N-04; ADR 6, Q-15 to Q-17)
- Figure tiles: `minmax(min(280px, 100%), 1fr)`.
- Contact: padding 24 below 768 (this also fixes the 36 off-rhythm), email breaks after the `@` (a `<wbr>` there) and the button keeps `min-height: 48px` with padding 12 24 so two lines do not crush.
- Results strip below 768: no `border-left`, no left padding, a 1 px `--rule` top rule between cells (not before the first), padding 16 0. From 768: cells 2 and 3 get `border-left: 1px solid var(--rule)` and padding 16; cell 1 has padding 16 16 16 0.
- Résumé tabs (new): the tablist is `display: flex; flex-wrap: wrap`, each tab `flex: 1 1 auto`, no inner dividers. The three labels total about 330 px at 13 px mono with 8 px padding, which fits the 358 px of a dialog at 390 and wraps to two rows in the 288 px at 320. The mockup's 14 px padding would need about 380 px and overflow at 390.
- Timeline and demo URL bar scroll inside their own region, never the page.
- Every `pre` and diff block wraps (`white-space: pre-wrap; overflow-wrap: anywhere`).

---

## 6. Shared components
**Source:** Main L14 to L28 and repeated inline patterns. Hover and focus are in section 9.

| Component | Spec | Source |
|---|---|---|
| Solid button | The only filled button style (07-design). `--ink` fill, `--paper` text, mono `--fs-md` / 500, `min-height: 48px`, padding 0 24 (22 snaps to 24), square corners, no border. A link styled as this is allowed (no-JS résumé link, `/for`) | L18 to L19 |
| Inverted solid | `--paper` fill, `--ink` text; same metrics; on ink surfaces only | L264, L284, L341 |
| Outlined control | Transparent, 1.5 px border in the surface's text color (`--paper` on ink), mono `--fs-sm`, `min-height: 48px`, padding 0 16 (18 snaps to 16). Dialog Close | L285, L342 |
| Text link | Mono `--fs-sm`, underline `--rule-strong`, offset 4, `min-height: 44px`, `min-width: 44px` | L20 |
| Inline link | Inherits family, underline `--rule-strong`, offset 3; `↗` marks an external link | L15, L83 |
| Chip (proven skill) | Mono `--fs-xs`, `--ink-2`, padding 2 8, 1 px `--rule` border, `--card` fill, no radius | L22 |
| Gap chip | Same metrics, 1 px dashed `--rule-strong` border, no fill | L238 |
| Fold (`<details>`) | Summary: flex, gap 16 (12 snaps to 16), mono `--fs-md`, `min-height: 48px`, top 1 px `--rule`, marker "+" in a 16 px box, count in `--muted` after the label. Native `<details>` only (R-604) | L23 to L27 |
| Section label | Mono `--fs-xs` `--muted`, "01 · production" | L73, L105, L190 |
| Margin note | Newsreader italic, `--note`, `--fs-body` (16 in tiles, 22 on 404). No rotation (Q-20) | L17, L98, L180, 404 L32 |
| Verdict box | Fill by verdict (7.9), `--paper` text, padding 24, gap 8, verdict `--fs-verdict`, counts mono `--fs-xs` | L213 to L217, L438 to L441 |
| Dark band | `--ink` block: diff, contact, `/for` top bar, traceback | L93, L260, For L22, 404 L23 |
| Figure tile | `--card` fill, 1 px `--rule` border, padding 16, gap 8, head row (title left, date right, mono `--fs-xs` `--muted`), 184 media well on `--well` with 1 px `--rule-faint` border, caption, note | L163 to L181 |
| Dialog | Native `<dialog>` opened with `showModal()`: backdrop `--overlay`, column on the overlay, toolbar above a sheet | L275 to L287 |

Q-19 (closed, DL): only "01 · production", "02 · selected work" and "03 · check fit" are numbered. Background is a fold and contact is a closing band, as in the mockup.

---

## 7. Home page sections
Order from F-01 and the mockup. Page: `min-height: 100vh`, `--paper`, body type (L31). Main: padding 8 24 72, column, gap 72 (L42).

### 7.1 Header and navigation (L33 to L40)
- Flex, wrap, space-between, align center, padding 16 24, gap 16 (12 snaps to 16). Not sticky. Hidden in print.
- Wordmark "Rohan Jain": mono `--fs-sm` / 600. Plain text on the home page; a link to `/` on other pages.
- Nav "work", "check fit", "contact": mono `--fs-sm`, gap 16 (18 snaps to 16). Each link `min-height: 44px; min-width: 44px`, centered (Q-21, R-606). "work" is 34 px wide, so the width floor matters.
- Bypass blocks (WCAG 2.4.1) are met by landmarks: `header`, `nav`, `main`, `footer`. No skip link (DL: three links precede `main`).

### 7.2 Hero (L44 to L54)
- Column, gap 32 (28 snaps up), padding-top 32 (L44). Inner block gap 16: eyebrow, H1, lede, action row.
- Eyebrow "ML and AI Engineer · New York, NY · available now": mono `--fs-sm` `--muted`. From `site.json`.
- H1 "Rohan Jain": `--fs-h1`. Lede: `--fs-lede`, `--ink-2`, `--measure-lede`.
- Action row: flex wrap, gap 8 24 (26 snaps to 24), centered: solid "View résumé", text link with the email, text link "Check fit against your role ↓" to `#fit`. Static HTML (F-03). Without JS, "View résumé" is a link to the ML Engineer PDF styled as the solid button (F-04).
- Then, outside the inner block: results strip (7.3), credentials line (7.4).
- **Photo slot (F-17, Q-22, DL):** designed, not shipped. When `showPhoto` is true: at 768 and up the hero becomes two columns `1fr 192px` (gap 48), the photo at the right, 192 by 240 (4:5), `object-fit: cover`, 1 px `--rule` border, no radius, alt text from `site.json`; below 768 the photo sits above the eyebrow at 128 by 160. When false, the markup is absent and nothing is reserved. The results strip and credentials line stay full width below either way.
- **First-screen check (Q-47, DL):** at 390 by 844 the first screen shows the eyebrow, the H1, the lede and the first result figure. Estimated stack: header 76, hero top 40, eyebrow 44, H1 49, lede 81, action row 152, gaps 80, strip rule 2 and padding 16, so the first figure starts near 540 px. Phase 2 measures it with a screenshot. If it fails, the first lever is the action row (text links share a line), not the type.

### 7.3 Results strip (L55 to L68)
- `<dl>`, three cells, `--fs-figure` mono 500 figure over a `--fs-md` `--ink-2` caption (3D3A33 mapped), cell gap 4. 1.5 px `--ink` rules above and below. Numbers from `claims.json`.
- Layout at 320, 390, 768 and 1280: see 5.2. Figure left edge aligns with the H1 (deliberate detail).

### 7.4 Credentials line (L69)
Mono `--fs-xs` `--muted`; IEEE, MS, interns. Wraps. Numbers (3 interns) from `claims.json`.

### 7.5 01 · Production (L72 to L102)
- Column, gap 16 (14 snaps to 16). Label; row of H2 and date range (`--fs-xs` mono `--muted`), flex wrap, space-between, baseline, gap 8 16, so the range drops under the H2 below 768; summary at `--measure-wide`, `--ink-2`.
- Fold "What I built there", count 5: list margin 4 0 16, padding-left 24 (20 snaps up), gap 8, `--ink-2`; lead-in in `<strong>`; the "rebuild ↗" inline link is mono `--fs-xs`.
- Fold "The loan agent, then and now", count "v1 → v2": column, gap 8, padding 4 0 16 (L92). Dark block: `--ink` fill, `--paper` text, mono `--fs-xs`, line height 1.6, padding 16 0. Each line is a `<del>` or `<ins>` as a block with padding 0 16 (1 px drops), `--diff-del-bg`/`--diff-del-fg` or `--diff-add-bg`/`--diff-add-fg`, sign ("-" or "+") in an `aria-hidden` span before the text. Lines wrap, so the block never scrolls (Q-23: `overflow-x: auto` is dropped, no focusable region needed). Then a margin note "same problem, rebuilt with twice the human checks" (L98).

### 7.6 02 · Selected work (L104 to L133; data L467 to L479)
- Column, gap 24 (22 snaps up). Label, H2, grid (`minmax(min(240px, 100%), 1fr)`, gap 32).
- Card (L109): column, gap 8. Date mono `--fs-xs` `--muted`; H3; one-liner `--fs-base` `--ink-2`; figure block with 1 px `--rule` top and bottom and padding 8 0 (figure mono `--fs-h3` 500; context `--fs-sm` `--muted`); links row (flex wrap, gap 0 16, 18 snaps to 16).
- **Demo (F-09, R-512; Q-24, Q-25, DL).** The mockup's panel opens inside a 256 px card at 1280, which cannot hold an iframe. The demo opens in a dialog (6) instead, using the same shell as the résumé and the brief:
  - Trigger: the "try it here" text link on the two cards that have a demo (Settlement Fail Predictor, FinCompress). It opens the dialog and has `aria-haspopup="dialog"`. Without JS it is a plain external link to the Space.
  - Dialog column 860. Toolbar (sticky, as 7.13): project name in mono `--fs-sm` `--paper` on the left, "live demo ↗" text link (direct link fallback) and "Close" outlined control on the right.
  - Sheet: `--well` fill, 1.5 px `--ink` border (L126). Row 1: the Space host and path in mono `--fs-xs` `--muted`, padding 8 8, 1 px `--rule` bottom (L127). Row 2: the stage, `height: min(72vh, 560px)`, which holds the same box in both states so nothing shifts. Row 3: one line of description from the mockup (L464, L465), `--fs-base` `--ink-2`.
  - Static state: a screenshot of the Space (`object-fit: contain`) if one exists; until then the description text centered in the stage, as the mockup does (L128). A solid "Load live demo" button under the stage, and the wake note (copy: Supervisor, section 14.3) in `--fs-sm` `--muted` beside it.
  - Loaded state: the iframe replaces the stage content (`*.hf.space` only, sandboxed, `loading="lazy"`, with a `title`; the sandbox flags, `referrerpolicy` and the rest of the embed attributes are in `docs/spec/06-architecture.md` §5.6, not repeated here). While it wakes the stage shows the wake note and nothing animates. No spinner, no skeleton.
  - Down state (from `status.json`): the trigger is replaced by the "live demo ↗" text link and a mono `--fs-xs` `--muted` line with the check date. No colored dots. Copy: Supervisor.

### 7.7 More projects (L134 to L146; data L481 to L487)
Fold, count 5. Rows: flex wrap, gap 4 24 (2 and 20 snap), padding 8 0 (10 snaps), 1 px `--rule-faint` bottom. Date 88 wide, mono `--fs-xs` `--muted`; name `--fs-body` 600 (flex 1 1 200); line `--fs-base` `--ink-2` (flex 999 1 340); link mono `--fs-xs` with "↗", `min-height: 44px`. Container padding-bottom 16.

### 7.8 Figures from the repos (L147 to L186; data L490 to L517)
- Fold, count 10. The panel (L150): column, gap 16, margin 4 -24 0, padding 24 24 32, `--paper`, graph paper by mask (1.3). The only graph-paper area.
- Intro line `--fs-base` `--ink-2`: "Each result on its own axis. Click a date to find it." (L151).
- **Timeline:** flex, `overflow-x: auto`, 1.5 px `--ink` top rule. Item: `flex: 0 0 auto`, min-width 96, padding 8 16 4 8, 1 px `--rule` left border, gap 4. Date mono `--fs-xs` `--muted`. Project entries are `<a href="#fig-<id>">` upgraded to buttons by script; plain entries (2021 Goldman, 2024 Maryland) are text with padding 8 0. Entry type: serif 13 px, line height 1.3, `min-height: 44px` (Q-26). Underline `--rule-strong`; selected: underline `--ink` and weight 600, `aria-pressed="true"`.
  - A partly visible fourth item at 390 is the scroll affordance (items are 96 wide in 342). No fade, no gradient.
  - Selecting an entry highlights that project's tiles and scrolls the first one into view (`block: nearest`, instant). On one column the tile could otherwise be far off screen (DL).
  - Without JS (Q-28): entries are plain anchor links that jump to the first matching tile; no highlight; all tiles are equal.
- **Tiles:** 6 images (`reference/figures/`, mapping in `reference/README.md`) and 4 bar tiles, each on its own axis (F-08). Tile metrics in section 6. Selected tile (Q-27): `outline: 2px solid var(--ink); outline-offset: -2px` so the box does not change size.
- **Image well:** 184 high (180 snaps to 184), `--well`, 1 px `--rule-faint`, `object-fit: contain`, explicit `width` and `height` attributes, lazy-loaded. Failure shows the alt text in the well.
- **Bar tile (ADR 5):** the well is 184 high with padding 16, gap 16, content centered. Each bar is a label row (label left, value right, mono `--fs-xs`) over an inline SVG generated at build time: `viewBox="0 0 100 16"`, `preserveAspectRatio="none"`, `width: 100%`, height 16 (the mockup's track is 12, L173; 16 is **DL**: on the 8 px rhythm; 12 is not a scale value), `aria-hidden`; a track rect (100 wide, `--rule-faint`) and a fill rect whose `width` is value divided by the axis maximum. Fill: `--ink` for the strong bar, `--muted` for the weak one (Q-05). Under the bars, the axis line in mono `--fs-xs` `--muted`. The values are text, so the SVG carries no information alone. A 0% bar is a track with no fill rect.

### 7.9 03 · Check fit (L189 to L247; logic L416 to L449; samples L408 to L414)
- Column, gap 16. Label; H2 "Hiring? Paste the job description." (ADR 12 keeps it); intro `--measure-read` `--ink-2` (L192).
- **Samples:** "try:" label (mono `--fs-xs` `--muted`) and three buttons (AI Engineer, Data Scientist, iOS Engineer), flex wrap, gap 8. Button: mono `--fs-xs`, 1 px `--ink` border, transparent, `min-height: 48px`, padding 0 16. Pressed (`aria-pressed="true"`): inverted, `--ink` fill, `--paper` text (Q-43). Pressed clears when the textarea is edited. Choosing a sample fills the textarea, company ("Sample Co") and role title, and runs the check at once (L533).
- **Textarea (F-05):** visually hidden label "job description" (L199), `rows="6"`, `maxlength="8000"` (L200), width 100%, padding 16, `--card` fill, 1.5 px `--ink` border, no radius, mono `--fs-sm`, line height 1.6, `resize: vertical`, placeholder "Paste the full posting here." in `--muted`.
- **Cap counter (Q-44, DL):** a right-aligned line under the textarea in mono `--fs-xs` `--muted`, shown only from 7,000 characters, formatted `n / 8,000` (numerals only, no new prose). At 8,000 the field stops accepting input; a longer paste is cut to 8,000 (L535), and the counter reads `8,000 / 8,000`. It is tied to the textarea with `aria-describedby`, not announced on every key.
- **Company and role fold (L201 to L207):** summary "add company and role title for the brief", no top rule, mono `--fs-xs` `--ink-2`, `min-height: 48px`. Two fields in `minmax(min(220px, 100%), 1fr)`, gap 16: label mono `--fs-xs` `--muted`, input `height: 48px`, padding 0 16, `--card` fill, 1.5 px `--ink` border, mono `--fs-sm`. **Each field is capped at 80 characters** (`maxlength="80"`, L204, L205; the handlers slice to 80, L536 and L537; issue #56, `docs/spec/08-security.md` §8.3). At the cap typing stops and a longer paste is cut to 80. There is no counter or message: the fields only label the brief.
- **Check fit:** solid button. There is no disabled state (Q-45): an empty or short posting returns "Not enough to go on" (L438).
- **Report** (appears after a run; absent before): column, gap 16, padding-top 16, 1.5 px `--ink` top rule (L211).
  - Verdict row: flex wrap, gap 24, items start. Verdict box (flex 1 1 240, min-width 0) and note (flex 999 1 380, `--fs-body` `--ink-2`). The box is `aria-live="polite"` so the verdict is announced when it changes.
  - Verdict fills: Strong fit `--verdict-strong`; Good fit, with gaps `--verdict-good`; Not a strong fit `--verdict-weak`; Not enough to go on `--verdict-none` (L438 to L441). Text `--paper` on all four (contrast 15.69, 10.56, 5.22, 6.20).
  - Evidence rows (up to 4, top 1 px `--rule`): row flex wrap, gap 8 24, padding 16 0, 1 px `--rule` bottom. Left cell (flex 1 1 230, gap 4): "● name" in `--fs-body` 600, proof `--fs-sm` `--muted`, optional link mono `--fs-xs` "label ↗". Right cell (flex 999 1 340): up to 8 chips, gap 4. The "●" and "○" are text glyphs, not emoji; they are `aria-hidden` and the words around them carry the meaning.
  - Gaps: flex wrap, gap 4, centered. "○ To ramp up" `--fs-body` 600 with padding-right 8, then gap chips.
  - Actions: flex wrap, gap 8 24: solid "Open the one-page brief" and text link "Forward to the hiring manager" (`mailto:?subject=Candidate%3A%20Rohan%20Jain`, L243).
  - Empty parts are not rendered: no rows if none matched, no gaps block if none. After a first run with no matches the report is the verdict box and note only.
- **Hierarchy (open item from the outline, closed):** two solid buttons show at once after a run ("Check fit" and "Open the one-page brief"). That is one button style, as 07-design requires. Their order and the 1.5 px rule between them give the sequence, so no demotion is needed.
- **No JavaScript (Q-30, ADR 7):** the section shows label, H2, intro and a one-line notice (Supervisor's copy) in place of the controls; no dead controls render. The controls ship hidden (`hidden`) and the island unhides them. This section is far below the first screen, so the unhide cannot move anything visible (CLS).

### 7.10 Background (L249 to L258)
- Fold, count 3. Body: column, gap 8, padding 4 0 16, `--fs-base`. Degree lines: flex wrap, space-between, gap 8; years in mono `--fs-xs` `--muted`. The IEEE line is plain.
- **Dates (Q-31, DL):** cards, "More projects" rows and the résumé use the project's `dateRange` in full; the timeline and the figure tiles show its start month; this fold shows the degree year ranges (L253, L254). Every project date comes from `projects.json`, so no project shows two different dates (0.3).

### 7.11 Contact (L260 to L270)
- `--ink` band, `--paper` text, padding 24 (below 768) or 40 (768 and up), column, gap 16. H2 "Have a role in mind?" at `--fs-h2` (ADR 12). Line `--fs-body` in `--on-ink-muted` at `--measure-narrow`.
- Two rows, each flex wrap, gap 8 24 (Q-32, DL):
  1. Inverted solid with the email (breaks after `@`), text link with the phone `(240) 495-9682` (`tel:`, F-14), text link "View résumé" (button with JS; link to the ML Engineer PDF without).
  2. Text links: LinkedIn ↗, GitHub ↗, Hugging Face ↗, Writing ↗ (F-14).
- Text links on ink are `--paper` with a `--rule-strong` underline (L266).

### 7.12 Footer (pattern from For L79 to L82; Q-33, DL)
- 1.5 px `--ink` top rule, padding-top 16, flex wrap, space-between, gap 8 24, mono `--fs-xs` `--muted`.
- Left: "last updated" date and demo status from `status.json` (F-10). Right: LinkedIn, GitHub, Hugging Face, Writing, Privacy, as text links in `--ink` (each `min-height: 44px`). The privacy link lives only here. Label wording is the Supervisor's (14.3).
- `status.json` missing: the left cluster is not rendered. Stale: it shows the date it was checked.

### 7.13 Résumé dialog (L274 to L335; roles L401 to L406)
- Native `<dialog>`; backdrop `--overlay`; overlay padding 32 16 from 768 and 16 below. Column max 860, gap 16 (12 snaps).
- Toolbar: flex wrap, space-between, gap 8. **Sticky at the top with a solid `--ink` fill** (DL): on a phone the résumé is a long scroll and Close must stay reachable. Left: tablist (AI Engineer, ML Engineer, Data Scientist; mono `--fs-xs`; 1.5 px `--paper` border; selected tab `--paper` fill with `--ink` text; each tab `min-height: 48px`, padding 0 8 (the mockup's 14 does not fit at 390); wraps at 320, see 5.2). Right: inverted solid "Download PDF" (`download`) and outlined "Close".
- Tabs follow the ARIA tabs pattern: arrows move and select, Home and End jump, only the selected tab is in the tab order.
- Opens on the role family of the last fit-check result, otherwise ML Engineer (L546). Focus moves into the dialog; Escape closes; focus returns to the opener.
- Sheet (Q-34, Q-35): `--print-paper`, `--ink`, padding 48 56 from 768 and 24 below, serif `--fs-md` / 1.5, gap 16. It shows the full résumé for the selected role, not only the summary, and is the same component the PDF uses (12.1). On screen section heads are `--muted`; in print they are `--ink`.

### 7.14 Brief dialog (L337 to L373)
- Same shell as 7.13. Toolbar right-aligned: inverted solid "Save as PDF" (calls print, L544), outlined "Close". Column max 820.
- Sheet: as 12.2. Title "Rohan Jain for <role title> at <company>"; with no title it reads "Rohan Jain for your role" and with no company drops " at <company>" (L522). The date is the month of the click, in the mockup's "Oct 2026" form.

---

## 8. Other pages
**Closed questions:** ADR 3 (404 on plain paper), 4 (no red), 7 (copy), 8 (`/for` prose), 9 (numeral allowlist). See section 14.

### 8.1 `/for/<slug>` (For.dc.html)
- `noindex, nofollow`, not in the sitemap (R-503). Title "Rohan Jain for <company>".
- **Top bar** (For L22 to L27): `--ink`, `--paper`; inner 1120, padding 16 24 (12 snaps up), flex wrap, space-between, gap 8, mono `--fs-xs`. Left: "prepared for <company> · <role title>". Right in `--on-ink-muted`: "rohanjain.pro/for/<slug> · <Mon YYYY>" (created month).
- **Main:** padding 48 24 72, column, gap 56 (For L28).
- **Introduction** (gap 16): label mono `--fs-sm` `--muted` ("for your <role title> role"); H1 `--fs-page`, "Rohan Jain, for <company>"; optional lede at `--fs-lede`, line height 1.45, `--measure-read`; actions row (gap 8 24): solid link "View the <Role> résumé" to the PDF of the application's `roleFamily`, and a text link with the email (`mailto:` subject "<company>: <role title>", For L36).
- **Fit** (gap 24): row (flex wrap, gap 32, items start): verdict box (flex 1 1 260, fill by verdict as 7.9, padding 24, gap 8; label "VERDICT ON YOUR POSTING" in mono `--fs-xs` 0.08em `--on-ink-muted`; verdict `--fs-h2`; counts mono `--fs-sm` `--paper`) and a fixed paragraph (flex 999 1 420, `--fs-body` `--ink-2`, For L47). Then evidence rows: 1.5 px `--ink` top rule, rows as 7.9 (padding 16 0, basis 260 / 360, gap 8 24). Then the ramp-up block (gap 8): "○ Where I would need to ramp up" 600, dashed gap chips, optional margin note.
- **Topics** (optional): H2 `--fs-h2-sub` "Good topics for a first conversation"; grid `minmax(min(240px, 100%), 1fr)`, gap 16; item: padding-top 8, 1.5 px `--ink` top rule, gap 4, title 600, description `--fs-md` `--muted`.
- **Footer** (For L79 to L82): as 7.12 without the status and link cluster: left "built from your posting and my verified project data", right link "see everything else ↗" to `/`.
- **Optional blocks (Q-36, ADR 8):** the lede, the ramp-up note and the topics section each render only if the application file or the engine supplies them. Absent, they leave no gap: the H1 is followed by the actions row, the ramp-up block ends with its chips, and the topics section and its H2 are omitted. The hierarchy (top bar, H1, verdict, evidence) holds without them.
- **Unfurl (Q-37, DL):** `/for` links unfurl with the site OG image (13.1), not a per-application card. A card naming the company would need one generated image per application and would put the company in an image URL. The title and description tags are the Supervisor's.
- Print: 12.3.

### 8.2 404 (404.dc.html)
- Wrapper `min-height: 100svh`, padding 64 24, `--paper` (ADR 3: plain paper, no grid). Inner column max 860, gap 32 (28 snaps up).
- Label "step 404" mono `--fs-xs` `--muted`. H1 "Run crashed. Loss is NaN." (F-11) at `--fs-compact`.
- **Traceback:** `<pre>` on `--ink`, text `--paper`, mono `--fs-sm` / 1.7, padding 24 (20 snaps up), `white-space: pre-wrap`, `overflow-wrap: anywhere`; text as the mockup (404 L23 to L31).
- **Error line (ADR 4, issue comment):** the last line, "RuntimeError: run crashed, loss is NaN", stands out by weight, not color. Token class `.trace-error { font-weight: var(--weight-strong); }` (Plex Mono 600) in the same `--paper`. The line above it is 400, so the step is visible without a second color.
- Margin note "not your fault. probably a bad link on my end." in Newsreader italic `--fs-h3` (22), `--note`, no rotation (Q-20: the -1 degree tilt imitated handwriting and the handwriting font is gone, so it carried nothing; R-602 item 4).
- Back link "← restart from the last checkpoint": mono `--fs-base`, `min-height: 44px`, `align-self: flex-start`, to `/`.
- The traceback holds numerals ("404", line numbers). They are decoration and sit on the claims-check allowlist (ADR 9).

### 8.3 Privacy page (not in the mockup; F-13, `docs/spec/08-security.md` §8.8)
Structure only. All text is the Supervisor's, from Security's facts (ADR 7).
- Header and footer: the home header (wordmark links to `/`, nav links to `/#work`, `/#fit`, `/#contact`) and the home footer.
- Main: padding 8 24 72, one column at `--measure-read`, left-aligned on the content edge, gap 32.
- Top block (gap 16): label "privacy" mono `--fs-xs` `--muted`; H1 at `--fs-compact`; "last updated <date>" mono `--fs-xs` `--muted`, from content (Q-40, ADR 7); one intro paragraph at `--fs-body` `--ink-2`.
- Two groups, "collected" and "not collected". Each group starts with a 1.5 px `--ink` rule, padding-top 16, a mono `--fs-sm` group label, then a `<dl>`. Item: `<dt>` serif `--fs-body` 600, `<dd>` serif `--fs-body` `--ink-2`; items padded 16 0 and divided by 1 px `--rule`.
- No folds, no illustration, no table of contents. It is short enough to read in one screen at 1280.

### 8.4 `/for` expiry page (not in the mockup; `docs/spec/06-architecture.md` §5.5)
Structure only. Text is the Supervisor's (ADR 7).
- Layout of the 404 without the traceback and the note: wrapper padding 64 24 on `--paper`, column max 860, gap 32. Label (mono `--fs-xs` `--muted`), H1 at `--fs-compact`, one paragraph at `--measure-read`, back link to `/` in the 404 back-link style.
- It names no company (Q-41, ADR 7). It holds no application data: the build omits the verdict, evidence, gaps and company from an expired page's HTML, so nothing sensitive stays in a stale file. Carries `noindex, nofollow`.

---

## 9. States
**Source:** Main L13 to L29 and the data functions (L438 to L441, L495 to L499, L513 to L516, L525 to L529). All hover rules apply only under `@media (hover: hover)` so touch devices never stick in a hover state.

### 9.1 Global rules
- **Focus (Q-42, DL):** `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }`. `--focus` is `--ink`; inside any ink surface (contact band, dialog toolbars, `/for` top bar, traceback) it is `--paper`. The ring is never removed. In forced-colors mode the system outline applies.
- **Hover on links:** underline color goes from `--rule-strong` to `--ink` (to `--paper` on ink). The text color does not change (the mockup's `#000` is dropped, 0.2).
- **Pressed or selected always means more ink, never an accent color:** inverted fill (tabs, samples), ink underline and weight 600 (timeline), 2 px ink outline (tile).
- **No disabled state anywhere** (Q-45).
- **Visited** links look like unvisited ones.

### 9.2 Matrix
| Element | Hover | Focus | Open / selected | Empty | Error | Loading |
|---|---|---|---|---|---|---|
| Inline link, text link | underline `--ink` | ring | | | | |
| Solid button | fill `--ink-3`, text `--paper`, label underlined (offset 4) | ring | | | | |
| Inverted solid (on ink) | fill `--rule` | ring in `--paper` | | | | |
| Outlined control | fill `--card` (on ink: `--ink-3`) | ring | | | | |
| Sample button | fill `--card` | ring | pressed: `--ink` fill, `--paper` text | | | |
| Fold summary | label underlined `--ink` | ring around the row | "+" rotates 45 degrees in 150 ms; reduced motion: no transition | | | |
| Textarea | | ring | | placeholder in `--muted` | none: input is never rejected | |
| Company and role inputs | | ring | | no placeholder | at 80 characters typing stops, paste is cut, no message | |
| Cap counter | | | visible from 7,000 characters | hidden below 7,000 | at 8,000 reads `8,000 / 8,000` | |
| Verdict box | | | four fills (7.9) | no report before the first run | "Not enough to go on" for empty or short input | engine is instant, no loading state |
| Evidence rows, gaps | | | | block not rendered when empty | | |
| Timeline entry | underline `--ink` | ring | underline `--ink`, weight 600, `aria-pressed` | | | |
| Figure tile | | | 2 px ink outline inset | | image fails: alt text in the well | image lazy-loads into a fixed 184 well, no placeholder motion |
| Demo trigger | underline `--ink` | ring | opens the dialog | | demo down: replaced by the direct link and a status line | |
| Demo dialog | | focus trapped | static, then loaded | stage shows the description if no screenshot | iframe fails: the direct link stays in the toolbar | wake note shown, no spinner |
| Résumé tab | fill `--ink-3` | ring in `--paper` | selected: `--paper` fill, `--ink` text | | PDF missing: the build fails, not a UI state | |
| Dialogs | | trapped; Escape closes; focus returns to the opener | backdrop `--overlay`, page scroll locked | | | |
| Footer status | | | | missing `status.json`: line not rendered | stale: shows the check date | |
| Fonts | | | | | | swap to metric-matched fallback (Q-10) |

Every cell the outline left "open" is decided in this table. Q-42 to Q-45 are 9.1 and the sample, counter and company-field rows.

---

## 10. Motion
**Source:** L25 to L26 (the only transition in all three mockups); R-608.
- The fold marker rotates 45 degrees in 150 ms `ease` (`--motion-fold`). Its purpose is to show the open state. It is the only motion on the site.
- Under `prefers-reduced-motion: reduce`, `--motion-fold` is `0ms`: the marker still turns, with no transition.
- Dialogs, the demo stage, the report and the tile highlight appear with no animation. No scroll animation: `scrollIntoView` is called with the default instant behavior and `scroll-behavior` stays `auto`. No typing effect, no parallax, no hover transitions.
- Any new motion needs a stated purpose and 200 ms or less (R-608).

---

## 11. Mobile layouts (390, with 320 checks)
Screenshots at 390 are the R-602 item 6 baseline.

| Section | At 390 | At 320 |
|---|---|---|
| Header | name and nav on one line, nav links 44 by 44 | nav wraps under the name |
| Hero | H1 52; lede 20; actions wrap: solid button, then the two text links each on their own line | H1 49 |
| Results strip | three stacked cells with top rules | same |
| Production | date range under the H2; folds full width | same |
| Selected work | one card per row; demo opens as a dialog | same |
| Figures | timeline scrolls in its region; tiles one per row; panel keeps the 24 bleed | tiles 272 wide |
| Check fit | samples wrap, each 48 high; textarea full width; report: verdict box above the note, rows stacked | same |
| Contact | padding 24; row 1 wraps: email, then phone and résumé; row 2 links | email breaks after `@` |
| Dialogs | overlay padding 16; sheet padding 24; toolbar sticky; tabs on one row | tabs on two rows |
| `/for` | top bar wraps to two lines; H1 40; verdict box above the paragraph; topics stack | H1 38 |
| 404 | H1 36; traceback wraps | H1 34 |

---

## 12. Print layouts
**Source:** 07-design §7.3 (black on white, no navigation, 18 mm margins, URLs after links); Main L28; résumé sheet L288 to L332; brief sheet L344 to L370; `docs/spec/06-architecture.md` §5.8. Page size: **US Letter** (ADR 10, Q-48). The only point where print departs from screen type is color. Page size, margins and PDF generation are in ADR-0015 and 06-architecture §5.8.

**Print rules (all print styles)**
- `@page { size: Letter; margin: 18mm; }`. Letter at 18 mm margins leaves 179.9 by 243.4 mm.
- Text `--ink`, background `--print-paper` (black on white; `--ink` is the black of the system). No fills: dark bands print as outlined blocks (1.5 px `--ink` border, `--ink` text).
- No navigation, toolbars, overlays, buttons or folds' markers. Hidden with the `noprint` class (L28).
- Muted text prints in `--ink`. Section heads, dates, captions and footers lose the grey.
- Sizes stay at the screen values. The 13 px floor holds (2.1).

### 12.1 Résumé PDF (three variants; F-15, Q-49, Q-50)
- Rendered by Playwright from `/print/resume/[role]` (noindex). Single column, one to two pages, selectable text, fonts embedded. Only the summary differs between variants.
- Order: header, summary, Education, Skills, Work experience, Projects, Publication (L288 to L332).
- Header: name serif 32 / 600 / 1.1; 1.5 px `--ink` rule under the header block, padding-bottom 16. Contact is two lines of mono `--fs-xs`: line 1 "New York, NY · (240) 495-9682 · rohanjain2312@gmail.com"; line 2 the profile **URLs as the link text** (`linkedin.com/in/jaroh23 · github.com/Rohanjain2312 · huggingface.co/rohanjain2312`). This satisfies "URLs printed after links" without printing each URL twice; the PDF links stay clickable (Q-49, DL). The dialog shows the same lines.
- Section heads: mono `--fs-xs`, uppercase, 0.08em, `--ink` in print (Q-50, DL).
- Role lines: left text serif `--fs-md`; right dates mono `--fs-xs` right-aligned; flex wrap, gap 8. Body serif `--fs-md` / 1.5. Bullets indented 16 (18 snaps), gap 4.
- Breaks: each job, project and publication stays whole (`break-inside: avoid`); a section head stays with its first line (`break-after: avoid`); `orphans: 3; widows: 3`. Page 2 has no running header or page number.
- Content: `src/content/resume.json`, with client decisions applied (0.3).

### 12.2 One-page brief (F-06, Q-51)
- Printed through the browser dialog from the brief view. It must fit one Letter page in Chromium and WebKit (Phase 3 gate).
- Only the sheet prints; the page, sections, backdrop and toolbar are hidden. Sheet padding is 0 because the page margin supplies 18 mm.
- Order and type (L344 to L368): header block (label "CANDIDATE BRIEF · date" mono `--fs-xs`; title serif 30 / 600 / 1.15; contact mono `--fs-xs`: email · phone · New York, NY · available now; 1.5 px `--ink` rule below); verdict line (verdict serif `--fs-h3` bold, counts mono `--fs-xs`; **bold text, not a filled box**); role summary; Evidence; Where I would need ramp-up (omitted when none); Background; provenance line mono `--fs-xs`. Gap 16.
- **Title length (issue #56):** company and role title are each capped at 80 characters (7.9). The title takes `overflow-wrap: anywhere` and wraps. At 80 plus 80 characters it runs to about 4 lines at 30 px on the 680 px column (estimate; Phase 3 measures it). The title never shrinks or truncates.
- **Overflow (ADR 11):** rows cap at 4, tag lines at 6, the gaps line truncates with a count. The Phase 3 one-page test uses the worst case: a 160-character title plus the maximum rows. If it still overflows, the pre-approved lever is body `--fs-md` 15 to 14 px. Nothing else changes before the Design Lead is asked.

### 12.3 Other pages (Q-52, DL)
- `/for` prints as a designed page (recruiters may print it): the basic rules above, the top bar as a plain text line, the verdict box outlined, chips with 1 px `--ink` borders, links followed by their URL in parentheses (`a[href]::after`), topics in the grid. It targets one to two Letter pages.
- Home and the privacy page get the basic print style only and are not design targets. Closed folds print open: a `beforeprint` handler sets `open` and an `afterprint` handler restores it.
- Dialogs never print except the sheet in 12.1 and 12.2.

---

## 13. What the mockup leaves open
| Item | Requirement | Design | Where |
|---|---|---|---|
| OG image | F-12 | 13.1 | `public/og.png` |
| Favicon | none | 13.2 | `public/favicon.svg`, `public/favicon.ico`, `public/favicon-180.png` |
| Privacy page | F-13 | 8.3 | |
| `/for` expiry page | §5.5 | 8.4 | |
| Brief layout | F-06 | 12.2 | |
| Résumé PDF layout | F-15 | 12.1 | |
| Hidden photo slot | F-17 | 7.2 | |
| Footer | F-10 | 7.12 | |
| Demo with screenshot | F-09 | 7.6 | |
| Graph-paper tile | ADR 3 | 1.3 | `src/assets/graph-paper.svg` |

### 13.1 OG image (F-12; Q-53, Q-54)
- **Size:** 1200 by 630 PNG, one file for every platform. The 2:1 crop some feeds apply trims 15 px at the top and bottom, which falls inside the 64 margin, so nothing is lost.
- **Content:** no proof numbers (Q-54): an image cannot be checked by R-301 and would go stale. It states who and what, and the site domain.
- **Layout** (canvas `--paper`, margin 64 on all sides, content 1072 by 502, left-aligned like the site):
  1. Top rule: 4 px `--ink`, full content width, at y 64.
  2. Eyebrow, 32 px below: mono 400, 32 px, `--muted`, "ML and AI Engineer · New York, NY · available now" (from `site.json`, as the hero eyebrow L46).
  3. Name, 24 below: "Rohan Jain", serif 500, 160 px, line height 0.95, tracking -0.03em, `--ink` (the hero H1 style, L47, scaled).
  4. Lede, 24 below: serif 400, 40 px, line height 1.35, `--ink-2`, max width 880, two lines, the hero lede (L48).
  5. Bottom, anchored at y 566: a 4 px `--ink` rule, 24 below it `rohanjain.pro` in mono 500, 32 px, `--ink`.
  The stack from the top rule to the lede is about 384 px and the bottom block is 68 px, leaving about 50 px of air in the middle.
- **Rationale:** it reads as the hero scaled up: the same name, the same rule, the same two typefaces. No gradient, no photo, no icon, no pattern. The 40 px lede stays legible at a 500 px wide feed thumbnail.
- **Build:** rendered at build time from an Astro route (`/og`, noindex) by the same Playwright step as the PDFs, at device scale 1, to `public/og.png`. Fonts are the self-hosted ones. Colors are the tokens.
- `og:image:alt`: "Rohan Jain, ML and AI Engineer". `twitter:card`: `summary_large_image`. `/for` pages use the same file (8.1).

### 13.2 Favicon (Q-55)
- **Mark:** a monogram "RJ", square, no rounding (the UI has no radius anywhere). `--ink` square, "RJ" in `--paper`, IBM Plex Mono 600, the wordmark's face (L34). The "+" fold marker was rejected: a plus reads as add or medical in a tab strip, and it names no one. The ink tile works on light and dark tab strips because it brings its own ground.
- **Geometry (32 by 32 viewBox):** two glyphs at font size 20 occupy 24 by about 14, centered, so the margin is 4 on each side and the cap height is about 14. The glyphs are outlined paths generated from the Fontsource IBM Plex Mono 600 file (OFL) with a script, never hand-drawn and never `<text>`, since SVG favicons cannot load web fonts.
- **Files:** `public/favicon.svg` (the master, any size), `public/favicon.ico` (16 and 32), `public/favicon-180.png` (apple touch icon, full-bleed ink square, no transparency). Linked with `rel="icon"` for the SVG and ICO and `rel="apple-touch-icon"` for the PNG. There is no web manifest.
- **Colors:** the SVG cannot read CSS custom properties, so it carries the two token values as literals. A unit test checks that every hex value in `public/favicon.svg` and `src/assets/brand/*.svg` equals a token in `tokens.css`.
- **At 16 px:** each letter is about 6 px wide with a stem of about 1 px. It is legible but plain; that is the intended weight.

---

## 14. Closed questions, and what remains for other roles

### 14.1 Closed by ADR-0015
| ADR item | Questions | Result |
|---|---|---|
| 1 | Q-01 | Tokens may be added when they carry a state or surface; near-duplicates map (section 1) |
| 2 | Q-02 | `--print-paper` `#FFFFFF` |
| 3 | Q-03, Q-38 | Graph paper as an SVG tile, figures section only; 404 on plain paper; line color chosen in 1.3 |
| 4 | Q-04 | No red on the 404 (8.2) |
| 5 | inline styles | The full inline rule (0.1) |
| 6 | Q-15, Q-16 | `min(280px, 100%)` and contact padding 24 with a wrapping email (5.2) |
| 7 | Q-30, Q-40, Q-41 | Supervisor writes the no-JS notice, privacy and expiry copy (14.3) |
| 8 | Q-36 | `/for` prose is optional; layout works without it (8.1) |
| 9 | Q-39 | Numeral allowlist in `src/content/` (8.2) |
| 10 | Q-48 | US Letter (12) |
| 11 | Q-51 | 4 rows, capped tags, truncated gaps (12.2) |
| 12 | question headings | Kept (7.9, 7.11) |

### 14.2 Closed by the Design Lead (DL)
| Questions | Section |
|---|---|
| Q-05 weak bar `--muted` | 1.3, 7.8 |
| Q-06 13 px floor; Q-07 italic 500 dropped; Q-08 variable roman with `opsz`; Q-09 `/for` and 404 H1 at 40 and 36; Q-10 measured metrics | 2 |
| Q-11 control heights; Q-12 line height kept; spacing snap | 3 |
| Q-13 one 1120 container; Q-14 measures as tokens | 4 |
| Q-17 results strip; Q-18 one media query | 5 |
| Q-19 section numbers; Q-20 no rotation | 6, 8.2 |
| Q-21 nav targets; Q-22 photo slot; Q-23 diff; Q-47 first screen | 7.1, 7.2, 7.5 |
| Q-24, Q-25 demo dialog and down state | 7.6 |
| Q-26 to Q-28 timeline, tile selection, no-JS figures | 7.8 |
| Q-29 sample buttons 48; Q-43 pressed samples; Q-44 counter; Q-45 no disabled; issue #56 80-character cap | 7.9, 9 |
| Q-31 date formats; Q-32 contact order; Q-33 footer; Q-34, Q-35 dialog sheet | 7.10 to 7.13 |
| Q-37 unfurls; Q-53 to Q-55 OG and favicon | 8.1, 13 |
| Q-42 focus on ink | 9.1 |
| Q-46 motion | 10 |
| Q-49, Q-50 PDF links and heads; Q-52 `/for` print | 12 |

### 14.3 Still needed from other roles (none blocks Frontend)
| Item | Who |
|---|---|
| Copy: no-JS fit-check notice; privacy page; expiry page (ADR 7). Also footer labels ("last updated", demo status), the demo wake note, the demo-down status line, `og:title` and `og:description`, image alt text for the demo screenshots. Copy comes from facts in the spec only (R-005) | Supervisor; Reader Advocate reviews; Security checks privacy facts |
| Claims-check allowlist entries (ADR 9): the 404 status code and traceback numerals, section ordinals 01 to 03, the counter cap `8,000`, the textarea and field caps in the markup | QA, App/Data |
| The JSON-LD `Person` block is an inline `<script type="application/ld+json">`. It is data, not code, and the CSP does not govern it. Confirm it is exempt from the 0.1 rule, and say how the headers test treats it | Security |
| `/for` tailored prose fields (ADR 8): only if built | App/Data (Phase 4) |
| Brief overflow confirmation against the worst case in 12.2 | App/Data (Phase 3) |
| Screenshots of the two Spaces for the demo static state (F-09) | Frontend or QA, Phase 5. Until then the stage shows the description text |
| 07-design §7.3 should state the full inline rule (no `style` attributes, no inline `<style>`, no inline `<script>`). **Supervisor edit; not made here** | Supervisor |

---

## 15. Handoffs and reviewer's list

### 15.1 What realizes this spec
- `src/styles/tokens.css` (#20, Design Lead): sections 1 to 4 and 10.
- Base and print styles, fonts (#21, Frontend): sections 2, 4, 9.1, 10 and 12.
- Components and pages (Phase 2, Frontend): sections 6 to 8, 11.
- Brand assets (graph-paper tile, favicon, OG image): files named in section 13, produced in later PRs.
- Reference screenshots of each page at 320, 390, 768 and 1280, and the print previews, are added to `docs/design/` after Phase 2 builds the pages, because they cannot exist before.

### 15.2 Deliberate details a reviewer can check
1. The results figures sit on the H1's left edge (the first cell has no left padding).
2. The fold "+" is the only motion on the site, 150 ms, and stops under reduced motion.
3. The 404 error line differs by weight (400 to 600), not by color.
4. Selection always means more ink (inverted fill, ink underline with weight, or a 2 px ink outline). No accent color is added for state.
5. Graph paper appears in one place, behind the figures, drawn from a token color. Its line is there because the section's claim is "each result on its own axis".
6. Hover on dark surfaces changes the underline, not the text (the mockup's black-on-ink hover is fixed).
7. Boxed controls are 48 high and text links 44: the visible edge is on the rhythm, the invisible hit area meets the touch floor.
8. Plex Mono is reserved for labels, dates, figures and controls. Prose is always Newsreader, in the dialogs and PDFs too.
9. The brief's verdict is bold text, so it prints as black on white without a filled box.
10. Nothing on the site is under 13 px.
