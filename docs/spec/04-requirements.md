# Requirements

Functional and non-functional requirements. Acceptance criteria in issues trace back to these IDs.

### 4.1 Functional requirements
| ID | Requirement |
|---|---|
| F-01 | Home page per the mockup: hero, results strip, production section, selected work (Loan Servicing Agent, Settlement Fail Predictor, Computer-Use Automation, FinCompress), fit check, background, contact. |
| F-02 | Folding sections using native `<details>/<summary>`: Goldman details, loan agent v1 to v2 diff, more projects, figures from the repos, company/role fields, education and publication. |
| F-03 | Hero, results strip, production summary and project cards render as static HTML with no JavaScript. |
| F-04 | Résumé view: accessible dialog with tabs for AI Engineer, ML Engineer, Data Scientist; each tab shows the matching summary and downloads the matching PDF. Focus trap, Escape to close. Without JavaScript, "View résumé" links to the ML Engineer PDF. |
| F-05 | Fit check: textarea (max 8,000 chars), optional company and role title, three sample postings, verdict, evidence rows with skill tags, gaps, and "Open the one-page brief". Runs entirely client-side. |
| F-06 | One-page brief: printable view generated from the fit-check result, saved via the browser print dialog with a dedicated print stylesheet. |
| F-07 | Per-application pages at `/for/<slug>` generated at build time from result files produced by `npm run for`. |
| F-08 | Figures section: timeline plus figure tiles (real images and true-to-scale bars), each result on its own axis. |
| F-09 | Demo panels for Settlement Fail Predictor and FinCompress: a static screenshot first; the Hugging Face Space iframe loads only on click; always a direct link fallback (R-512). |
| F-10 | Footer status: last updated date and demo status from a daily `status.json`. |
| F-11 | Custom 404 page ("Run crashed. Loss is NaN.") per mockup. |
| F-12 | SEO: title, description, canonical, Open Graph and Twitter cards, generated OG image, `sitemap.xml`, `robots.txt`, JSON-LD `Person` schema. |
| F-13 | Privacy page: what is and is not collected (no cookies, cookieless analytics, fit-check text never leaves the browser). |
| F-14 | Contact details: email (`rohanjain2312@gmail.com`) and phone (`+1 240 495 9682`, displayed as `(240) 495-9682`, `tel:` link) in the contact section, résumé view, résumé PDFs and the one-page brief. LinkedIn, GitHub, Hugging Face and Medium (`https://medium.com/@rohanjain2312`, labeled "Writing") links in the contact section and footer. Project write-ups hosted on Medium (for example FinCompress) link to their articles. The Medium profile is also listed in the JSON-LD `sameAs`. |
| F-15 | Résumé PDFs: three versions (AI Engineer, ML Engineer, Data Scientist) generated at build time from `src/content/resume.json` using the Design Lead's print layout, so the PDFs always match the site. |
| F-16 | Location line everywhere: "New York, NY". |
| F-17 | No photo in v1. The hero has a documented, hidden slot so a photo can be added later by dropping one file in and flipping one content flag. |

### 4.2 Non-functional requirements
| ID | Requirement |
|---|---|
| N-01 | Performance: LCP under 1.8 s and CLS under 0.05 on a mid-range phone over 4G; total JS under 30 KB gzipped on the home page; home page HTML+CSS under 60 KB gzipped (excluding fonts and images). |
| N-02 | Accessibility: WCAG 2.2 AA. Zero axe violations. Full keyboard operability. Visible focus. Touch targets 44 px. Contrast 4.5:1 for body text. |
| N-03 | Browser support: last 2 versions of Chrome, Edge, Safari (Firefox is not a target, ADR-0034); iOS Safari 16+; Android Chrome. |
| N-04 | Responsive from 320 px to 1920 px. No horizontal scroll at any width. |
| N-05 | Availability after launch: 99.9% monthly (inherits Cloudflare's edge). |
| N-06 | Security: see `docs/spec/08-security.md` |
| N-07 | Privacy: no cookies and no advertising or marketing scripts. Visits are counted only by cookieless Cloudflare Web Analytics (ADR-0008); the host keeps request logs. The site collects no personal data itself: no accounts, no forms, the fit-check text stays in the browser. |
| N-08 | Maintainability: TypeScript strict mode; no `any`; 90%+ line coverage on `src/lib/`. |
| N-09 | Reproducibility: pinned Node LTS (`.nvmrc`), lockfile committed, deterministic builds. |
| N-10 | Local first: `npm run dev` and `npm run preview` give the full site on `localhost` with production headers emulated. |

### 4.3 The truthfulness rule
Enforced by R-005, R-301 to R-306 (`docs/rules.md`). In short: every number lives in `src/content/claims.json` with a source; markup never holds a number; claims are no stronger than their sources; client decisions override repo values; nothing is invented and nothing is a placeholder.
