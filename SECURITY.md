# Security policy

## Report a vulnerability

Report security problems in private. Do not open a public issue for them.

1. Open [a private advisory for this repository](https://github.com/Rohanjain2312/rohanjain.pro/security/advisories/new). This uses GitHub private vulnerability reporting.
2. Describe the problem. Include the page or file, the steps to reproduce, and what you saw.
3. Keep the details private until a fix is merged.

GitHub private vulnerability reporting is the only channel for security reports to this site.

## Response time

No response time is set. This repository does not promise one.

## Scope

In scope:

- The website at rohanjain.pro. It is not live yet.
- The HTTP security headers and Content Security Policy, set in `public/_headers`.
- The source code in this repository, including the browser code that runs on the site.
- The build and CI workflows in `.github/workflows/`, and the repository's dependencies.

Out of scope:

- Third-party services that the site links to or loads, such as GitHub, LinkedIn, Medium, Hugging Face and Cloudflare. Report problems in those services to their owners.
- Denial-of-service testing and high-volume traffic.
- Social engineering, phishing and physical attacks.
- Reports with no security effect. Typos, copy and layout issues go to a public issue.

When you test, use only your own browser session. Do not access, change or delete other people's data. Stop once you have shown the problem.

## Supported versions

Only the current `main` branch is supported.

## Severity and fixes

Each confirmed finding gets one severity: Critical, High, Medium, Low or Info. A Medium or higher finding blocks merge and launch until it is fixed, unless an architecture decision record accepts the risk. Low findings are tracked as GitHub issues. Reviews and findings are recorded in [`docs/security/reviews/`](docs/security/reviews/).
