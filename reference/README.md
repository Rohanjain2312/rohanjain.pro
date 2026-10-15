# reference/

Source material for the build. Read-only. See plan.md section 1.4.

- mockup/Main.dc.html, For.dc.html, 404.dc.html: approved design mockups. They use a proprietary component format (x-dc). Rebuild in Astro; do not copy the runtime. The skills data embedded in Main.dc.html is superseded by skills_tiered.json.
- skills_tiered.json: 300 skills with tier (shipped, work, studied), evidence project ids and role tags. Evidence ids: goldman, loan, settle, cua, fc, tariff, shca, mr, med, gb, ieee.
- figures/: real figures from the project repos.
- resume/Rohan_Resume_v26.docx: the client's current résumé (Data Scientist version).
- role_descriptions.md: summaries for the three résumé variants.

Image references in the mockups use /_blob/<id> paths. Map them to files here:

| Mockup path | File | Source repo |
|---|---|---|
| /_blob/3ad72b97b00b52e3166b528a06d2e25f | figures/settle_pr.png | trade-settlement-fail-predictor, docs/blog/images/fig3_pr_curves.png |
| /_blob/b0ab6aa5f19ad4aa035cf229104ec40f | figures/settle_shap.png | trade-settlement-fail-predictor, docs/blog/images/fig4_shap_vs_truth.png |
| /_blob/65367e32ed007633c708ad1978dce5ce | figures/tariff_hearing.png | customs-court, docs/screenshots/03-single-agent-hearing.png |
| /_blob/08e54afb9e641432d9241846ccf032bd | figures/cua_click.png | computer-use-automation, evidence/discovery/.../007_03_goal_click.png |
| /_blob/7eb49ca1004550d2f331c7cdc3d47404 | figures/fc_pruning.png | FinCompress, fincompress/results/article_assets/01_pruning_curve.png |
| /_blob/cd976f26dc6bbc8c4271110ccdf3e4ad | figures/fc_latency.png | FinCompress, fincompress/results/article_assets/02_cpu_latency.png |

Note: plan.md section 4.4 overrides any number in the mockups where they differ (client decisions on FinCompress, Market Regime and Goldman tenure).
