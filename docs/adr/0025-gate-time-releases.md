# ADR-0025: Gate-time releases instead of release-please

Status: accepted · Date: 2026-10-17 · Issues: #173, #15 · Supersedes: the release-please criterion of #15

## Context
PR #134 added release-please to keep a release PR open. It fails on every push to `main`: GitHub Actions may not create pull requests in this repository. Enabling that setting (`can_approve_pull_request_reviews`) would also let Actions approve pull requests, and the Security review of PR #134 asked for an ADR before doing so. Even with the setting, a release PR opened by `GITHUB_TOKEN` does not trigger other workflows, so the required checks (#14) would never run on it and it could never merge without a bypass, which R-111 forbids.

## Decision
1. Remove release-please and its config files.
2. At each phase gate, the Supervisor publishes the release: `gh release create v0.N.0 --target main --generate-notes`. Release notes come from merged PR titles, which already follow Conventional Commits (R-108).
3. `release.yml` runs on `release: published`: a read-only job builds and generates the CycloneDX SBOM; a separate job with `contents: write` attaches it and runs no third-party code (the PR #134 split).
4. The `phase-gate` skill's release step uses the command in decision 2.

## Consequences
- No standing release PR and no repo setting that lets Actions approve pull requests.
- `main` no longer gets a failing Release run on every push.
- No `CHANGELOG.md` file; the GitHub release notes are the changelog.

## Alternatives
- Enable the setting and use a GitHub App token so release PRs trigger checks: more secrets and moving parts for a solo portfolio site.
- Keep release-please and let it fail: leaves `main` red, which the gate forbids.
