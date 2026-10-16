// Runs on staged files only (pre-commit). CI runs the full checks (docs/spec/10-cicd.md).
export default {
  '*.{js,mjs,cjs,ts,astro}': [
    'prettier --write --ignore-unknown',
    'eslint --max-warnings 0 --no-warn-ignored',
  ],
  'src/**/*.{css,astro,html}': ['stylelint --allow-empty-input'],
  '*.{css,json,md,yml,yaml}': ['prettier --write --ignore-unknown'],
};
