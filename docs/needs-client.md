# Needs the client

The only things Claude Code cannot do itself. Each item has exact steps. Claude Code keeps working on everything else meanwhile (R-003).

## Open
- [ ] Turn on a passkey or 2FA for GitHub: https://github.com/settings/security
- [ ] Give the GitHub CLI two more permissions (project board and commit-signature upload). In Terminal run the command below, then approve in the browser:
  `gh auth refresh -h github.com -s project,write:ssh_signing_key`
  After that Claude Code creates the project board, uploads the signing key and turns the signed-commit rule back on (#33, ADR-0014).
  When Claude Code reports that #33 is closed, remove the signing-key permission again (every agent shares this token):
  `gh auth refresh -h github.com -r write:ssh_signing_key`
- [ ] Update the GitHub CLI (the installed 2.63.2 cannot edit PR labels): `brew upgrade gh`

## Optional (accepted risk, ADR-0018)
- [ ] Every agent uses your GitHub CLI login, which can reach all your repositories. To limit that to this repository only, create a fine-grained token at https://github.com/settings/personal-access-tokens/new (Repository access: only `Rohanjain2312/rohanjain.pro`; permissions: Contents, Issues, Pull requests, Actions, Administration read and write), then run `gh auth login --with-token` and paste it. Claude Code works the same either way.

## Done
- [x] Moved `_claude` to `.claude` (2026-10-15).
- [x] Node LTS and the GitHub CLI installed; `gh auth login` done (2026-10-15).
