# Product

Purpose, success criteria, scope, client decisions and budget. Read when planning a phase or judging whether a change serves the goal.

### 1.1 Purpose
A personal portfolio site whose only job is to get Rohan Jain hired as an ML Engineer, AI Engineer, or Data Scientist in the US. Primary readers are recruiters (60 seconds, often on a phone, often non-technical) and hiring managers (5 to 10 minutes, technical, skeptical).

### 1.2 Success criteria
1. A recruiter knows who Rohan is, what he does, and three proof points within 5 seconds of landing, with JavaScript disabled.
2. A hiring manager can verify every number on the site by following a link to a repo, demo, figure, or the résumé.
3. The fit check gives an honest verdict, including "Not a strong fit", and produces a forwardable one-page brief.
4. Rohan can create a personalized page for each application with one command.
5. Lighthouse 95+ on Performance, Accessibility, Best Practices and SEO, on mobile.
6. Security headers grade A+ (securityheaders.com) and Mozilla Observatory A+ at production launch.
7. Running cost is the domain renewal only, excluding the client's Claude plan.
8. The site does not look AI-generated. It passes the Design Lead's anti-slop review (R-602 in `.claude/agents/design-lead.md`).
9. Real readers confirm it (skill `external-validation`): at least 4 of 5 people name Rohan's role and one proof point after a 5-second look, and the fit check agrees with the recruiter majority on at least 7 of 10 postings, never saying "Strong fit" where the majority says "Not a strong fit".

### 1.3 Non-goals
- No blog, CMS, login, comments, contact form, newsletter or database in v1.
- No server-side code at runtime. No LLM calls at runtime.
- No tracking cookies, no third-party ad or marketing scripts.
- No statement about work authorization anywhere on the site, résumés, briefs or metadata.

### 1.4 Reference material (provided in `reference/`)
- `reference/mockup/Main.dc.html`, `For.dc.html`, `404.dc.html`: the approved design mockups. Treat layout, copy, typography, colors and interactions as the spec. The mockups use a proprietary component format; rebuild them in Astro, do not copy the runtime.
- `reference/skills_tiered.json`: the 300 skills with tier and evidence.
- `reference/figures/`: six real figures from the project repos.
- `reference/resume/Rohan_Resume_v26.docx`: the client's current résumé (Data Scientist version). Source text for the résumé content file.
- `reference/role_descriptions.md`: the three role summaries (AI Engineer, ML Engineer, Data Scientist).

### 1.5 Delivery stages
1. **Local build (now):** the complete site runs on `localhost`, fully tested, with CI on GitHub. This is the target for Phases 0 to 6.
2. **Production launch (later):** the client owns `rohanjain.pro` (registered at Porkbun, October 2026). Phase 7 moves its DNS to Cloudflare and deploys to Cloudflare Pages on that domain. Everything for Phase 7 is prepared in advance so the client's part takes minutes (the client-only list in `CLAUDE.md`).

## Client decisions (resolved October 2026)
| # | Decision | Answer |
|---|---|---|
| 1 | Domain | `rohanjain.pro`, registered at Porkbun (October 2026). Build locally until Phase 7. No hosting bought from the registrar. |
| 2 | Location | New York, NY, everywhere. |
| 3 | Work authorization | Not stated anywhere. |
| 4 | Photo | Text only for now; hidden slot for later. |
| 5 | Phone | Show it wherever contact details appear (contact section, résumé view and PDFs, brief). |
| 6 | Repo visibility | Public. |
| 7 | Handwriting font | No. Use Newsreader italic. |
| 8 | Résumé conflicts | Use résumé values: FinCompress 50% of heads, +0.9 Macro F1; Market Regime 88.4% F1; Goldman ~4 years. |
| 9 | Résumé PDFs indexable | Yes. |
| 10 | Golden job postings | Claude Code writes synthetic ones from scratch (ADR-0028, `docs/spec/09-quality.md` §9.4). |

## Budget
| Item | Cost |
|---|---|
| Local build, GitHub (public repo), CI, scanning | $0 |
| Domain `rohanjain.pro` at Porkbun | Paid; yearly renewal at Porkbun's .pro rate |
| Hosting, DNS, analytics, Phase 7 | $0 on free tiers |
| Fonts | $0 (open licenses) |
| Claude Code | Client's existing Claude plan |
| **Total** | **domain renewal only** |
