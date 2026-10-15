# Needs the client

The only things Claude Code cannot do itself. Each item has exact steps. Claude Code keeps working on everything else meanwhile (R-003).

## Open
- [ ] Turn on a passkey or 2FA for GitHub: https://github.com/settings/security
- [ ] Give the GitHub CLI two more permissions (project board and commit-signature upload). In Terminal run the command below, then approve in the browser:
  `gh auth refresh -h github.com -s project,admin:ssh_signing_key`
  After that Claude Code creates the project board and uploads the signing key.
- [ ] Update the GitHub CLI (the installed 2.63.2 cannot edit PR labels): `brew upgrade gh`

## Done
- [x] Moved `_claude` to `.claude` (2026-10-15).
- [x] Node LTS and the GitHub CLI installed; `gh auth login` done (2026-10-15).
