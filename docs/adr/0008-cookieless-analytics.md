# ADR-0008: Cookieless analytics only

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
The site needs basic traffic and reply-rate signals without a consent banner or tracking.

## Decision
Use Cloudflare Web Analytics (cookieless) after launch. No tracking cookies, no third-party ad or marketing scripts. `/for` open tracking uses only cookieless Cloudflare path counts (R-903).

## Consequences
- No consent banner; simpler privacy page.
- Coarser data than cookie-based tools.

## Alternatives
- Plausible, Umami: extra cost or hosting.
- Google Analytics: cookies and consent.
