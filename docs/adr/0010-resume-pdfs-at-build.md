# ADR-0010: Résumé PDFs generated from content at build time

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
Hand-maintained PDFs drift from the site. Three role variants (AI, ML, DS) share most content.

## Decision
`src/content/resume.json` is seeded from `reference/resume/Rohan_Resume_v26.docx` with the client decisions applied. `scripts/resume-pdf.ts` renders `/print/resume/[role]` with Playwright (Chromium) during the build into three text-selectable, single-column PDFs. The claims check also runs on PDF text.

## Consequences
- PDFs always match site content and pass the same truthfulness checks.
- The build depends on a headless browser.

## Alternatives
- Hand-made PDFs: drift.
- A PDF library drawing layouts in code: duplicates the design system.
