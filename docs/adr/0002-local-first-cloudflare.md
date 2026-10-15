# ADR-0002: Local-first build; Cloudflare Pages and DNS; domain at Porkbun

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
The client registered `rohanjain.pro` at Porkbun in October 2026. The site must be complete and tested before any hosting work, and running cost must be the domain renewal only.

## Decision
Build and test everything on `localhost` through Phase 6. In Phase 7, move DNS to Cloudflare (the registration stays at Porkbun) and deploy to Cloudflare Pages on the apex domain.

## Consequences
- No hosting cost; free tiers for hosting, DNS and analytics.
- Custom headers (`_headers`) and an apex domain are supported.
- The client's launch steps are short: create a Cloudflare account, change nameservers at Porkbun, create one API token.
- Headers are emulated locally until launch, then verified with external scanners.

## Alternatives
- Vercel Hobby, Netlify: viable, but Cloudflare gives DNS, headers and analytics in one place.
- GitHub Pages: no custom headers.
- Porkbun DNS with a CNAME: no apex support on Pages.
- Moving the registration to Cloudflare: not needed.
