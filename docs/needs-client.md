# Needs the client

The only things Claude Code cannot do itself. Each item has exact steps. Claude Code keeps working on everything else meanwhile (R-003).

## Open
- [ ] Turn on a passkey or 2FA for GitHub: https://github.com/settings/security
- [ ] Give the GitHub CLI two more permissions (project board and commit-signature upload). In Terminal run the command below, then approve in the browser:
  `gh auth refresh -h github.com -s project,write:ssh_signing_key`
  After that Claude Code creates the project board, uploads the signing key and turns the signed-commit rule back on (#33, ADR-0014).
  When Claude Code reports that the signed-commit rule is back on (#33), remove the signing-key permission again (every agent shares this token):
  `gh auth refresh -h github.com -r write:ssh_signing_key`
- [ ] Update the GitHub CLI (the installed 2.63.2 cannot edit PR labels): `brew upgrade gh`

## Optional (accepted risk, ADR-0018)
- [ ] The accepted risk in one sentence: text planted in a public page or issue could, in a rare case, trick an agent into using your GitHub login on your other repositories. Do this only after every item under "Open" is done, because a later `gh auth refresh` replaces the token below with a full login again. To limit the agents to this repository only:
  1. Create a fine-grained token at https://github.com/settings/personal-access-tokens/new. Expiration: 90 days. Repository access: only `Rohanjain2312/rohanjain.pro`. Permissions: Contents, Issues, Pull requests, Actions and Workflows read and write; Administration read only (write would let the token delete the repository).
  2. In Terminal run `gh auth login --with-token` and paste the token.
  3. Open the Keychain Access app, search for `github.com`, and delete the internet password entries named exactly `github.com`. Keep the entry named `gh:github.com`; it holds the new token. This removes the older login that `git push` uses.
  4. In Terminal run `gh auth setup-git`, so `git push` uses the new token.
  After this, Claude Code cannot change repository settings or the project board. When it needs one of those, it adds the exact command to this file for you to run.

## Done
- [x] Moved `_claude` to `.claude` (2026-10-15).
- [x] Node LTS and the GitHub CLI installed; `gh auth login` done (2026-10-15).
