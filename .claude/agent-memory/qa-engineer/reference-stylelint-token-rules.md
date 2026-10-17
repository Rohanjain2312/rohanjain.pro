---
name: reference-stylelint-token-rules
description: What .stylelintrc.mjs actually bans (rgb, hsl, gradients, shadows, named colors, motion over 200 ms) and where the token-file override stops. Read before judging any CSS or token PR.
metadata:
  type: reference
---

Facts from `.stylelintrc.mjs` (checked 2026-10-16 at PR #108 head e1b752d):

- `function-disallowed-list` bans rgb, rgba, hsl, hsla, hwb, lab, lch, oklab, oklch, color, color-mix, gradient functions and drop-shadow in every file. The token-file override only turns off `color-no-hex` for `**/tokens.css` and `**/tokens/**/*.css`. So rgb() fails even inside tokens.css. A probe file named tokens.css with rgb() failed (2026-10-16).
- `property-disallowed-list` bans box-shadow and text-shadow everywhere.
- Named colors are caught in color props and in any `--*` custom property. Motion values over 200 ms are caught in transition, animation and any `--*` name with dur, delay, motion, transition or animation in it.
- `stylelint-config-standard` also applies: short hex (`#fff`), hue-degree notation, and `alpha-value-notation` (percent alpha in rgb).
- `npm run lint:css` scans `src/**/*.{css,astro,html}`. A probe in scratch (not in the worktree) confirmed every rule fires.

**Why:** The spec (07 §7.2) and the PR #108 token comment said rgb() was banned only outside the token file. That was wrong. The PR picked hex8 for `--overlay`, which is the right form, but the stated reason was not. Trail: PR #108 review comment, Low findings.

**How to apply:** Before accepting a rationale that cites Stylelint, read the config and run a probe. Write probe files in the scratch copy, never in the worktree, and delete them before `npm run verify`.
