# ADR-0003: No runtime server code and no runtime LLM calls

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
The site has no need for accounts, storage or dynamic data. Server code and model calls add cost, attack surface and nondeterminism.

## Decision
Ship only static files. No server functions, no database, no runtime calls to any LLM. All analysis (fit check) runs in the browser on precompiled data. Scheduled data (demo status) is fetched by a GitHub Actions workflow and baked in at build time.

## Consequences
- Running cost stays at zero beyond the domain.
- The attack surface is limited to static content, headers and client-side input handling.
- The fit check must be deterministic and testable (ADR-0004).

## Alternatives
- An LLM-backed fit check: costly, nondeterministic, hard to test, and a prompt-injection target.
- Edge functions: not needed for any requirement.
