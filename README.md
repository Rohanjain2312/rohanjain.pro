# rohanjain.pro

The portfolio site of Rohan Jain, an ML Engineer, AI Engineer and Data Scientist based in New York, NY. It will be served at `rohanjain.pro`.

**Status:** under construction and not yet launched. The features below are planned; what exists today is tracked in [`docs/status.md`](docs/status.md).

## For recruiters and hiring managers

What the finished site will offer:

- What Rohan built, with a link to the source of every number: a repo, a demo, a figure or the résumé.
- A fit check that compares a job posting with Rohan's evidence and gives an honest verdict, including "Not a strong fit", plus a one-page brief you can forward.
- The résumé on the site as text and as PDFs.
- This repository is public so you can check how the site was built and tested.

## How it was built

A team of Claude Code agents is building the site, working like a small engineering organization: a Supervisor, a Design Lead, Frontend, App/Data, Platform, Security, QA and a Reader Advocate who judges only the rendered pages. Each piece of work is a GitHub Issue, a branch and a reviewed pull request. Hooks in `.claude/hooks/` catch common rule violations (they are tripwires, see ADR-0018), and CI will check every pull request once it lands (issue #13). The full plan starts at [`plan.md`](plan.md); progress is in [`docs/status.md`](docs/status.md).

Stack: [Astro](https://astro.build) with static output, TypeScript in strict mode, Vitest and Playwright. No server code at runtime. No tracking cookies and no third-party tracking scripts; cookieless analytics after launch (ADR-0008).

## Run it locally

Requirements: Node.js at the version in [`.nvmrc`](.nvmrc), and npm.

```bash
nvm use
npm ci
npm run browsers:install
npm run dev
```

`npm ci` runs with install scripts turned off (`.npmrc`), so the Playwright browser is installed by its own script. Until the first page lands (issue #21), the dev server returns 404 at `/`.

| Script                     | What it does                                                            |
| -------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`              | Development server on localhost                                         |
| `npm run build`            | Static build into `dist/`                                               |
| `npm run preview`          | Serves the built site on localhost                                      |
| `npm run check`            | `astro check` and `tsc --noEmit`                                        |
| `npm test`                 | Unit tests (Vitest)                                                     |
| `npm run test:e2e`         | End-to-end tests (Playwright)                                           |
| `npm run lint`             | ESLint, including the XSS and fit-check purity rules                    |
| `npm run lint:css`         | Stylelint (tokens only, no gradients or shadows, short transitions)     |
| `npm run format:check`     | Prettier check                                                          |
| `npm run validate:content` | Schema and cross-reference check of the content files                   |
| `npm run docs:lint`        | Rule IDs, paths and budgets in the docs                                 |
| `npm run verify`           | Every check CI will run; required before a pull request is marked ready |

## Repository map

| Path             | Holds                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `src/`           | Site source (pages, components, styles, content and the fit-check engine as they are built) |
| `docs/spec/`     | The specification                                                                           |
| `docs/adr/`      | Architecture decision records                                                               |
| `docs/design/`   | The design spec                                                                             |
| `docs/security/` | Threat model and security reviews                                                           |
| `.claude/`       | Agent roles, skills and the hooks that enforce the rules                                    |
| `reference/`     | Read-only source material: mockups, figures, résumé                                         |

## Contributing and license

Workflow: [`CONTRIBUTING.md`](CONTRIBUTING.md). Code and repository docs are MIT licensed; the site's copy, the résumé and `reference/` are all rights reserved. See [`LICENSE`](LICENSE).
