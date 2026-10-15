# ADR-0006: Self-hosted fonts; italic serif for margin notes

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
The mockups use a serif and a monospace face, plus handwritten-style margin notes. Third-party font CDNs leak visitor data and complicate the CSP.

## Decision
Self-host Newsreader and IBM Plex Mono via Fontsource as subset WOFF2 with `font-display: swap`. Margin notes use Newsreader italic. No handwriting font (client decision 7).

## Consequences
- No third-party requests for fonts; `font-src 'self'` in the CSP.
- Font files count against the performance budget and must be subset.

## Alternatives
- Google Fonts CDN: privacy and CSP cost.
- A paid handwriting font: declined by the client.
