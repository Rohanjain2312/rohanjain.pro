---
name: shared-scratchpad-names
description: The session scratchpad is shared with other agents. Use unique probe file names, or another agent can overwrite your probe between runs.
metadata:
  type: feedback
---

Another agent overwrote my `probe136.mjs` in the scratchpad during the PR #136 round 3 review. The replacement was a different script with a different output format, so its numbers were not mine.

**Why:** the scratchpad directory holds files from several agents (one folder per PR). A generic name such as `probe136.mjs` can be replaced between runs.

**How to apply:** name probe scripts and outputs with a QA prefix and the round, for example `qa136-r3-probe.mjs`. Before citing a result from a file, check the file's header and modification time. Re-create any probe that is gone, rather than running a file you did not write.
