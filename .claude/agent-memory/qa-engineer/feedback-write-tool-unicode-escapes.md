---
name: feedback-write-tool-unicode-escapes
description: The Write tool expands backslash-u escapes before the R-008 hook sees them; build banned characters from code points and create byte-exact fixtures with node or printf.
metadata:
  type: feedback
---

A backslash followed by `u2014` in Write content trips the R-008 em dash guard, because the hook sees the expanded character. A bash heredoc with several statements can also hit the worktree guard ("too complex").

**Why:** found while building the copy lint (#27). The first Write of `scripts/lint-copy.mjs` was blocked with no literal em dash in it.

**How to apply:** in scripts and tests, build characters with `String.fromCharCode` and `String.fromCodePoint` (a backslash from `String.fromCharCode(92)`). Create fixtures that need literal em dashes or escape text with one small `printf` or `node -e` per file (macOS `printf %s` also expands `\u`, so use `node -e` for escape text). Keep each Bash call simple and split; one command with loops, sed mutations and git trips the guard. See [[worktree-git-guard]].
