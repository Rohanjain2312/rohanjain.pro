# ADR-0019: License scope: site copy is reserved, repository docs are MIT

Status: accepted · Date: 2026-10-16 · Issues: #30

## Context
`docs/spec/03-workflow.md` asks for a LICENSE with code under MIT and "content and résumé text all rights reserved". It does not say whether the repository's own docs (README, `docs/`, `.claude/`) count as content. The QA review of PR #84 found the first LICENSE draft either too narrow (path-based) or too broad ("all written copy, wherever it appears").

## Decision
1. **All rights reserved:** the copy the site shows to readers, wherever it is stored (`src/content/`, text in `.astro` templates and components, metadata such as titles and descriptions); the résumé text and PDFs; everything in `reference/`; the briefs and per-application pages the site generates.
2. **MIT:** everything else, including the code and the repository's documentation and agent instructions (`README.md`, `CONTRIBUTING.md`, `plan.md`, `CLAUDE.md`, `docs/`, `.claude/`).
3. README states the same split in one line and points to LICENSE.

## Consequences
- Others may reuse the build process, specs and agent setup, but not Rohan's site copy or résumé.
- A new content location (for example a future `public/` text file shown to readers) is covered by item 1 without a LICENSE change.

## Alternatives
- Reserve all prose in the repository: blocks reuse of the process docs, which is part of what the public repo shows.
- Reserve only `src/content/`: leaves copy in templates under MIT.
