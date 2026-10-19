# Needs the client

The only things Claude Code cannot do itself. Each item has exact steps. Claude Code keeps working on everything else meanwhile (R-003).

## Open
- [ ] Update the GitHub CLI (the installed 2.63.2 cannot edit PR labels): `brew upgrade gh`

- [ ] Before Phase 7, on a normal computer (the agent sandbox cannot start Firefox): in the project folder run `npm run browsers:install` once, then `npm run test:browsers`. Paste the result in chat. Failures become issues.

- [ ] Confirm the availability line the site shows. `src/content/site.json` says "Available now", taken from the mockup; no source states it (R-005). Reply with the exact text you want, or "none" to hide it.

- [ ] Two numbers in your résumé have no source in the Evidence Ledger, so `resume.json` leaves them out (R-005, PR #137): "109M params" and "all 3 planted interactions ranked top 3 of 190 pairs". The site claim "10-prompt check" (medical LLM project) also has no source QA could find (PR #152). To keep any of them, reply with the repo file or notebook that shows each number. Otherwise nothing is needed.

- [ ] Optional, does not block the build: the real 5-second test (skill `external-validation`). Pick at least 5 people who recruit or hire for technical roles, or who work as engineers. In the project folder run `npm run browsers:install` once, then `npm run shots`, then send each person the two files `.shots/home-390-fold.png` (phone size) and `.shots/home-1280-fold.png` (laptop size; give each person one of the two) with this message: "Look at this picture for 5 seconds, then answer without opening it again. Without scrolling: (1) What is this person's role? (2) Name one thing they have done. (3) How would you contact them?" Do not explain the page first. (This is the plain-file version of the test: the 5 seconds rely on the person's honesty; if you would rather use a free form with timed images, such as Google Forms or Lyssna, the questions are the same.) Send results without names (R-901): paste each person's three answers in chat or into `docs/validation/phase-2-five-second.md`. The test passes when at least 4 of 5 name the role and one proof point. The first-click question ("Where would you get his résumé?") waits until the "View résumé" button ships in Phase 4 and is asked in the Phase 6 repeat. Nothing is needed from you if you skip this.

- [ ] Optional, does not block the build: recruiter fit ratings (skill `external-validation`, after Phase 3). Send at least 3 recruiters or hiring managers the 10 postings in `docs/validation/phase-3-rating-packet.md` (the team prepares this file with the postings only; the engine's verdicts are not in it) plus a screenshot of the home page top (`npm run shots`, file `.shots/home-1280-fold.png`; the résumé PDF arrives in Phase 4). Message: "Here are 10 made-up job postings and a picture of a candidate's page. For each posting, pick one: Strong fit, Good fit with gaps, or Not a strong fit. Go with your first judgement." Paste the ratings back without names (R-901). The test passes when the engine matches the majority on at least 7 of 10 and never says "Strong fit" where the majority says "Not a strong fit". Nothing is needed from you if you skip this.

- [ ] Phase 7, after v0.9.0 (does not block earlier work). Steps are in `docs/runbooks/launch.md` section 1: (1) Cloudflare account with passkey or 2FA, add `rohanjain.pro`, and send the two nameservers it shows; (2) Porkbun: turn DNSSEC off, set those nameservers, and later paste one DS record; (3) create one Cloudflare setup token from the prepared link and run the prepared command that uses it once on your computer (it sets up DNS and creates a narrow deploy token for GitHub, ADR-0032); revoke the setup token after launch.

## Optional (speed)
- [ ] To let the build resume on its own after usage limits (`scripts/autopilot.sh`, #116), install the Claude Code command-line tool. In Terminal run `brew install --cask claude-code`, then `claude --version` to check. The desktop app's copy cannot run from Terminal.

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
- [x] Signing-key permission removed again (2026-10-16, verified with `gh auth status`).
- [x] Passkey or 2FA turned on for GitHub (2026-10-16).
- [x] GitHub CLI given the `project` and `write:ssh_signing_key` permissions (2026-10-16). Claude Code uploaded the signing key, created the project board and turned the signed-commit rule back on.
- [x] Moved `_claude` to `.claude` (2026-10-15).
- [x] Node LTS and the GitHub CLI installed; `gh auth login` done (2026-10-15).
