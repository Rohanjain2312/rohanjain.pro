# Needs the client

The only things Claude Code cannot do itself. Each item has exact steps. Claude Code keeps working on everything else meanwhile (R-003).

## Open
- [ ] Update the GitHub CLI (the installed 2.63.2 cannot edit PR labels): `brew upgrade gh`

## Optional (speed)
- [ ] To let the build resume on its own after usage limits (`scripts/autopilot.sh`, #116), install the Claude Code command-line tool. In Terminal run `brew install --cask claude-code`, then `claude --version` to check. The desktop app's copy cannot run from Terminal.

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
