# ADR-0021: Time-boxed OSV waiver for dev-only braces advisory

Status: accepted · Date: 2026-10-16 · Issues: #13

## Context
OSV-Scanner in CI (R-507) reports GHSA-vfj7-8cjw-p6xm (High, CVSS 8.7) in `braces` 3.0.3. It is a dev-only dependency, pulled in through micromatch by Stylelint and eslint-plugin-astro, and no fixed version exists. The flaw crashes Node on deeply nested brace patterns; in this repo the patterns are globs the repo itself controls. Security rated it Low in the PR #125 review (125-L1).

## Decision
1. `.github/osv-scanner.toml` ignores this advisory by ID only, never by package, with `ignoreUntil` no later than 2027-01-15 and a reason. The OSV step reads it with `--config`.
2. `npm audit --omit=dev --audit-level=high` stays blocking.
3. Remove the waiver as soon as a fixed `braces` (or a micromatch that drops it) is available, or at expiry, whichever comes first. At expiry CI goes red again and Security re-rates.

## Consequences
- CI stays green while a High-rated dev advisory is open. The production bundle does not include `braces`.
- Each new advisory still fails CI; the waiver covers one ID.

## Alternatives
- Override `braces` to an unpatched fork or a different major: no fixed version exists, so this adds risk without removing the flaw.
- Leave CI red until a fix ships: blocks every merge on an issue that cannot be exploited from outside.
