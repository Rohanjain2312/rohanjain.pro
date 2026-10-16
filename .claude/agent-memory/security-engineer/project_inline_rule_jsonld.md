---
name: inline-rule-jsonld
description: Security ruling on the inline-script rule and the JSON-LD data block (PR #82 review, 2026-10-16) and the follow-ups it left for #18 and #29
metadata:
  type: project
---

I confirmed in the PR #82 review that the JSON-LD `Person` block is exempt from "no inline script". It is a data block, CSP does not apply to it. The headers/HTML test accepts only `type="application/ld+json"` with JSON text; any other inline `<script>`, `<style>` or `style=` fails. Build it with `JSON.stringify` and `<` as `<`; no phone in it.

**Why:** spec 0.1 allows the block, but 07-design §7.3 and 08-security §8.2 do not (and §8.2 still says "use build-time hashes"). A test written from one doc fails against another.

**How to apply:** when writing the CSP (#18) and reviewing the headers test (#29), use the rule above. Check that the Supervisor aligned §7.3 and §8.2. Also check `/og` is not served indexable (X-Robots-Tag in `_headers`) and that `/for` og:title and og:description are generic. See [[severity-calibration]].
