---
name: external-validation
description: Use after Phase 2 (5-second test), after Phase 3 (recruiter fit ratings), when the client reports responses, and after launch (reply-rate tracking). Real people check what the team cannot.
---

# External validation

- **R-901** Validation results are stored without names or contact details.
- **R-903** /for open tracking uses only cookieless Cloudflare path counts.

## 5-second and first-click test (after Phase 2; repeat at Phase 6)
- Prepare 390 and 1280 px home screenshots and a free form (Google Forms with timed image links, or Lyssna's free tier). Plain-file fallback (decision, 2026-10-18, to keep the client's steps minimal): send the two screenshots by message and ask the person to look for 5 seconds before answering; the exposure is then on the honour system, and the results are scored the same way. Use the form when the client is willing to set it up.
- Questions: What is his role? Name one thing he has done. How would you contact him? First click: "Where would you get his résumé?"
- Write the message for the client to send to at least 5 people who recruit or hire for technical roles, or work as engineers. Put it in `docs/needs-client.md`.
- Pass: at least 4 of 5 name the role and one proof point, and at least 4 of 5 first clicks land on "View résumé".

## Recruiter fit ratings (after Phase 3)
- Packet: 10 golden postings (synthetic, ADR-0028) plus the résumé PDF. Raters choose Strong fit, Good fit with gaps, or Not a strong fit, without seeing the engine.
- Send to at least 3 recruiters or hiring managers via the client.
- QA computes exact agreement with the majority and Fleiss' kappa. Pass: engine matches the majority on at least 7 of 10 and never says "Strong fit" where the majority says "Not a strong fit". Failures become alias or tier fixes, or a threshold ADR.

## Reply-rate tracking (after launch)
- `npm run apps -- add` logs an application in a git-ignored file and assigns the `/for` link to 3 of 4 applications at random (R-902). `npm run apps -- reply <id>` marks replies.
- `npm run apps -- report` shows reply and interview rates per group with 95% confidence intervals and says plainly when there are fewer than about 30 per group.

Store all results in `docs/validation/`.
