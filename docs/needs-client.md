# Needs the client

The only things Claude Code cannot do itself. Each item has exact steps. Claude Code keeps working on everything else meanwhile (R-003).

## Open

- [ ] Phase 7 (the build waits for you here). Steps are in `docs/runbooks/launch.md` sections 1 and 4. Done: Cloudflare account and zone Active, Porkbun nameservers and DNSSEC record, the setup run (DNS, DNSSEC, Pages project and domains, Web Analytics, deploy token stored as secrets), setup token deleted (all 2026-10-19). Still to do, in this order, each only when Claude Code tells you it is ready: (1) run one prepared command in Terminal that needs only your GitHub login (it sets the deploy variables and adds the deploy workflow to your private applications repo; Claude Code gives you a dry run to look at first; if it says the file write was refused, run `gh auth refresh -s workflow` once and run it again); (2) run `gh workflow run deploy.yml --repo Rohanjain2312/rohanjain.pro-applications` to start the first deploy, and tell Claude Code when it finishes; (3) after launch Claude Code gives you the steps for anything left to clean up. Nothing else is needed from you.

## Optional (speed)
- [ ] To let the build resume on its own after usage limits (`scripts/autopilot.sh`, #116), install the Claude Code command-line tool. Homebrew is not installed on your Mac, so skip this unless you want it; if you do, ask in chat and Claude Code will give you exact steps that do not need Homebrew. The desktop app's copy cannot run from Terminal.

## Accepted risks (no action needed)
- Your speed decision (ADR-0026): each PR gets one combined review, Security only for workflow and header changes, and no audits of reviews or agent instructions. CI and the claims check remain.
- Until 2026-10-22, 54 locked npm packages are under 7 days old (ADR-0023). They are signed, install scripts are off, and the audit is clean. They pass the 7-day rule on that date with no change.
- To build faster (ADR-0024, your request): reviews judge each PR's stated criteria in one round, so small issues outside them can wait for a later phase; re-checks of small docs and content fixes use a cheaper model. Every phase's quality gate is unchanged.
- All agents, including Security reviewers, run on sonnet or haiku; none on opus (ADR-0022, your request to save usage). Reviews share one model family with the builders, so some shared blind spots go uncaught. The first seeded-defect audit measured this; further audits are retired (ADR-0026).
- Dev-only `braces` advisory GHSA-vfj7-8cjw-p6xm is waived in CI until 2027-01-15 or until a fix ships (ADR-0021). It does not reach the published site.

## Optional (accepted risk, ADR-0018)
- [ ] The accepted risk in one sentence: text planted in a public page or issue could, in a rare case, trick an agent into using your GitHub login on your other repositories. Do this only after every item under "Open" is done, because a later `gh auth refresh` replaces the token below with a full login again. To limit the agents to this repository only:
  1. Create a fine-grained token at https://github.com/settings/personal-access-tokens/new. Expiration: 90 days. Repository access: only `Rohanjain2312/rohanjain.pro`. Permissions: Contents, Issues, Pull requests, Actions and Workflows read and write; Administration read only (write would let the token delete the repository).
  2. In Terminal run `gh auth login --with-token` and paste the token.
  3. Open the Keychain Access app, search for `github.com`, and delete the internet password entries named exactly `github.com`. Keep the entry named `gh:github.com`; it holds the new token. This removes the older login that `git push` uses.
  4. In Terminal run `gh auth setup-git`, so `git push` uses the new token.
  After this, Claude Code cannot change repository settings or the project board. When it needs one of those, it adds the exact command to this file for you to run.

## Done
- [x] Availability line confirmed as "Available now" (2026-10-19, `src/content/site.json`).
- [x] Résumé numbers "109M params" and "all 3 planted interactions ranked top 3 of 190 pairs" taken from your résumé (2026-10-19, PR #272); the unsourced "10-prompt check" was removed instead.
- [x] Firefox dropped as a target (2026-10-19, ADR-0034). `brew upgrade gh` dropped: Homebrew is not installed and the upgrade was optional.
- [x] Signing-key permission removed again (2026-10-16, verified with `gh auth status`).
- [x] Passkey or 2FA turned on for GitHub (2026-10-16).
- [x] GitHub CLI given the `project` and `write:ssh_signing_key` permissions (2026-10-16). Claude Code uploaded the signing key, created the project board and turned the signed-commit rule back on.
- [x] Moved `_claude` to `.claude` (2026-10-15).
- [x] Node LTS and the GitHub CLI installed; `gh auth login` done (2026-10-15).
