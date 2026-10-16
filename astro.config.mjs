import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  build: {
    // The CSP in public/_headers allows no inline style or script (docs/security/headers.md, R-505).
    inlineStylesheets: 'never',
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
