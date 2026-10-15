# Design system

Tokens, type and layout rules. The Design Lead refines this into `docs/design/spec.md` in Phase 1.

### 7.1 Source of truth
The mockups in `reference/mockup/`, refined by the Design Lead into `docs/design/spec.md` in Phase 1.

### 7.2 Tokens
Paper `#F6F3EB`, card `#FBF9F3`, ink `#1B1A17`, ink-2 `#2C2A25`, muted `#5E5A50`, rule `#CFC8B6`, faint rule `#E2DCCC`, note red `#B42B25` (margin notes only), diff red bg `#3A2422`, diff green bg `#22331F`.

### 7.3 Rules
- Type: Newsreader for prose and headings; IBM Plex Mono for numbers, labels and code; Newsreader italic in note red for margin notes.
- Scale: H1 88 px desktop, ~52 px at 390 px; H2 38 px; body 18 px; captions 13 to 15 px; use `clamp()`.
- Red is reserved for margin notes. No gradients, no emoji, no drop-shadow cards, no glassmorphism.
- Graph-paper background only inside the figures section.
- One solid button style; everything else is a text link.
- Folding uses native `<details>` with a rotating "+" marker.
- No dark mode in v1 (the paper aesthetic is the identity).
- Print stylesheet for the brief and résumé: black on white, no navigation, 18 mm margins, URLs printed after links.

### 7.4 Anti-slop checklist
Defined once, as R-602 in `.claude/agents/design-lead.md`.
