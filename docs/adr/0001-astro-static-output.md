# ADR-0001: Use Astro with static output

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
The site is mostly content: text, numbers, figures and a few interactive parts (fit check, résumé dialog, demo embeds). Recruiters read it on phones, often with slow connections. Every number must come from validated content files.

## Decision
Use Astro (latest stable) with static output, TypeScript strict, plain CSS with custom properties, content collections with Zod schemas, and vanilla TypeScript islands. Preact only if a component truly needs it.

## Consequences
- Pages ship as HTML with near-zero JavaScript by default, which helps the performance budgets (R-607) and the JavaScript-disabled requirement (R-605).
- Content is typed and validated at build time.
- Interactivity is written by hand, which keeps bundles small but takes more care.

## Alternatives
- Next.js: heavier runtime.
- SvelteKit: smaller content ecosystem.
- Hand-written HTML: no content model or tests.
- Tailwind: rejected for styling in favor of exact design fidelity without framework weight.
