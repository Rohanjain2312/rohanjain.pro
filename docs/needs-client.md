# Needs the client

The only things Claude Code cannot do itself. Each item has exact steps. Claude Code keeps working on everything else meanwhile (R-003).

## Open
- [ ] Update the GitHub CLI (the installed 2.63.2 cannot edit PR labels): `brew upgrade gh`

- [ ] Confirm the availability line the site shows. `src/content/site.json` says "Available now", taken from the mockup; no source states it (R-005). Reply with the exact text you want, or "none" to hide it.

- [ ] Two numbers in your résumé have no source in the Evidence Ledger, so `resume.json` leaves them out (R-005, PR #137): "109M params" and "all 3 planted interactions ranked top 3 of 190 pairs". The site claim "10-prompt check" (medical LLM project) also has no source QA could find (PR #152). To keep any of them, reply with the repo file or notebook that shows each number. Otherwise nothing is needed.

- [ ] Optional, does not block the build: the real 5-second test (skill `external-validation`). Pick 5 people who are not engineers (a recruiter, a friend in another field). In the project folder run `npm run shots`, then send each person only the file `.shots/home-390-fold.png` (a phone-size screenshot of the top of the home page) with this message: "Look at this picture for 5 seconds, then I will take it away. Without scrolling: (1) What job is this person looking for? (2) What is one thing they have done? (3) How would you contact them?" Do not explain the page first. Write each person's three answers into a new file `docs/validation/phase-2-five-second.md` (or paste them in chat) and the team will fix what people missed. Nothing is needed from you if you skip this.

## Optional (speed)
- [ ] To let the build resume on its own after usage limits (`scripts/autopilot.sh`, #116), install the Claude Code command-line tool. In Terminal run `brew install --cask claude-code`, then `claude --version` to check. The desktop app's copy cannot run from Terminal.

## Accepted risks (no action needed)
- Your speed decision (ADR-0026): each PR gets one combined review, Security only for workflow and header changes, and no audits of reviews or agent instructions. CI and the claims check remain.
- Until 2026-10-22, 54 locked npm packages are under 7 days old (ADR-0023). They are signed, install scripts are off, and the audit is clean. They pass the 7-day rule on that date with no change.
- To build faster (ADR-0024, your request): reviews judge each PR's stated criteria in one round, so small issues outside them can wait for a later phase; re-checks of small docs and content fixes use a cheaper model. Every phase's quality gate is unchanged.
- All agents, including Security reviewers, run on sonnet or haiku; none on opus (ADR-0022, your request to save usage). Reviews share one model family with the builders, so some shared blind spots go uncaught. Seeded-defect audits measure this.
- Dev-only `braces` advisory GHSA-vfj7-8cjw-p6xm is waived in CI until 2027-01-15 or until a fix ships (ADR-0021). It does not reach the published site.

## Optional (accepted risk, ADR-0018)
- [ ] The accepted risk in one sentence: text planted in a public page or issue could, in a rare case, trick an agent into using your GitHub login on your other repositories. Do this only after every item under "Open" is done, because a later `gh auth refresh` replaces the token below with a full login again. To limit the agents to this repository only:
  1. Create a fine-grained token at https://github.com/settings/personal-access-tokens/new. Expiration: 90 days. Repository access: only `Rohanjain2312/rohanjain.pro`. Permissions: Contents, Issues, Pull requests, Actions and Workflows read and write; Administration read only (write would let the token delete the repository).
  2. In Terminal run `gh auth login --with-token` and paste the token.
  3. Open the Keychain Access app, search for `github.com`, and delete the internet password entries named exactly `github.com`. Keep the entry named `gh:github.com`; it holds the new token. This removes the older login that `git push` uses.
  4. In Terminal run `gh auth setup-git`, so `git push` uses the new token.
  After this, Claude Code cannot change repository settings or the project board. When it needs one of those, it adds the exact command to this file for you to run.

## Done
- [x] Signing-key permission removed again (2026-10-16, verified with `gh auth status`).
- [x] Passkey or 2FA turned on for GitHub (2026-10-16).
- [x] GitHub CLI given the `project` and `write:ssh_signing_key` permissions (2026-10-16). Claude Code uploaded the signing key, created the project board and turned the signed-commit rule back on.
- [x] Moved `_claude` to `.claude` (2026-10-15).
- [x] Node LTS and the GitHub CLI installed; `gh auth login` done (2026-10-15).
