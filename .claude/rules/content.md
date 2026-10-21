---
paths:
  - "src/content/**"
  - "scripts/check-claims*"
  - "scripts/resume-pdf*"
  - "src/pages/print/**"
---

# Content and claims

- **R-302** No claim is stronger than its source. Client decisions override repo values: FinCompress "pruning 50% of attention heads improved val Macro F1 by +0.9 points"; Market Regime "88.4% F1 with optimized thresholds"; Goldman tenure "~4 years". Record the repo value in the claim's `note` field, never on the page.
- **R-306** Tenure reads "~4 years at Goldman Sachs"; "3.5+ years of production experience" appears only in role summaries, never side by side without the distinction.
- Seed values and sources: `docs/spec/05-evidence-ledger.md`. After Phase 1, `src/content/claims.json` is the source of truth.
- Contact details live only in `src/content/site.json`: jainrohan2312@gmail.com, New York, NY, LinkedIn jaroh23, GitHub Rohanjain2312, Hugging Face rohanjain2312, Medium @rohanjain2312.
- Schemas: `docs/spec/06-architecture.md` §5.3.
