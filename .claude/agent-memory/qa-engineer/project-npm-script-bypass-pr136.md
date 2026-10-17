---
name: npm-script-bypass-pr136
description: Shell routes that re-enable npm install scripts past R-509 at PR #136 head 5b8935d (issue #58), verified with real npm 11.19. Re-check when guard-bash RAW_DENY or .npmrc ownership changes.
metadata:
  type: project
---

At PR #136 head 5b8935d, guard-bash RAW_DENY blocks these literal forms: `--ignore-scripts=false|0|no`, `--ignore-scripts false`, `--no-ignore-scripts`, `npm_config_ignore_scripts=` set to false, 0, no or empty, and `npm config set|delete|rm ignore-scripts` with no flags in between.

Still allowed, and real npm runs install scripts after them:
- `npm config --location=project set ignore-scripts false` (`--location` sits between `config` and `set`).
- Shell writes to `.npmrc`: `echo 'ignore-scripts=false' >> .npmrc`, `printf ... > .npmrc`, `sed -i '' ... .npmrc`.
- `--ignore-scripts=$VAR` (with `F=false` set earlier).
- Quote-split flags: `--ignore-''scripts=false`, `"--ignore-scripts"=false`.

Not effective here: user-level `npm config set ignore-scripts false` and `npm c set` (no location). The project `.npmrc` outranks user config. `npm config --global set` was not tested, but global config ranks below project too.

Also: platform-engineer owns `.npmrc` in owners.json. Edit and Write can set `ignore-scripts=false`, and guard-write checks only the path, not the content.

Status at head 7b06134 (round 2, CHANGES REQUESTED): the four routes above now deny, and a new guard-write rule denies `.npmrc` edits that drop or change `ignore-scripts=true`. Interpreter writes to `.npmrc` were still open.

Status at head 1fc6ad4 (round 3, CHANGES REQUESTED): the shell-segment rule closes interpreter and awk writes that name `.npmrc` literally. Real-tool re-enables still pass the hook:
- `npm --location=project config set ignore-scripts false` (flag before subcommand). High.
- `zsh -c 'echo ... >> .n?mrc'` (zsh expands the glob in a redirect; `/bin/sh` on macOS does not). Medium.
- `node -e "require('fs').appendFileSync('.npm'+'rc', ...)"` (concatenated name). Medium.
- `git log --format=%B -1 --output=.npmrc` with a commit line `ignore-scripts=false`. Low.

Status at head 22c15a3 (round 4, CHANGES REQUESTED): `npm --location=project config set` and `git log --output=.npmrc` now deny. Still open, plain form: `npm --location project config set ignore-scripts false` (space-separated flag value) and `npm --loglevel silent --location=project config set ...` are allowed. Real npm re-enables scripts for the first. Scope rule from the supervisor (ADR-0018): judge #58 on named routes plus plain variants. zsh glob redirects and concatenated interpreter names are tracked in #153 and #47.

Status at head a8bcaf8 (round 5, CHANGES REQUESTED): the form-agnostic npm rule closes `--location project` and the other flag spellings. Still open, plain: a backslash-newline continuation (`npm --location=project config \` then newline `set ignore-scripts false`) re-enables scripts under real npm. The hook strips backslashes and splits on newlines, so the continued line has no `npm`. Underscore spellings (`ignore_scripts`) are rejected or ignored by npm, so they have no effect.

Status at head 22863672 (round 6, APPROVED, approved:qa added): backslash-newline joins before matching. The 44 plain variants and both continuation cases pass. Obfuscated forms stay in #153 and #47. Test tip: build hook JSON with node, not a shell echo. A shell-quoted `\\\n` gave a false allow in this round.

The `.npmrc` tripwire has no check on `npm_config_userconfig`, since that file ranks below the project config.

**Why:** ADR-0018 says these tripwires match raw command text so that substitution and quoting do not hide them. The `--location` and `.npmrc` shell-write forms are common, not obscure. The real-npm check ran in scratch projects with their own user, global and cache config, so no real npm config was changed.
**How to apply:** if #136 or a follow-up merges with these gaps, log them under [[escaped-defects]]. On any change to guard-bash RAW_DENY or to `.npmrc` ownership, rerun the route probe with real npm. The probe design needs a dependency with an install script. A root `prepare` script does not run on `npm rebuild`.
