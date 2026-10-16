// ESLint flat config. Every project rule message starts with its rule ID (docs/rules.md).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import security from 'eslint-plugin-security';
import globals from 'globals';

const STORAGE = '/^(localStorage|sessionStorage)$/';

// R-405: user input renders as text only; no HTML sinks, no code from strings, no web storage writes.
const r405 = [
  {
    selector: 'AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]',
    message: 'R-405: innerHTML and outerHTML are banned. Render user input as text (textContent).',
  },
  {
    selector: 'CallExpression[callee.property.name="insertAdjacentHTML"]',
    message: 'R-405: insertAdjacentHTML is banned. Render user input as text (textContent).',
  },
  {
    selector:
      'CallExpression[callee.object.name="document"][callee.property.name=/^(write|writeln)$/]',
    message: 'R-405: document.write is banned.',
  },
  {
    selector: 'CallExpression[callee.name="eval"], CallExpression[callee.property.name="eval"]',
    message: 'R-405: eval is banned.',
  },
  {
    selector: 'NewExpression[callee.name="Function"], CallExpression[callee.name="Function"]',
    message: 'R-405: new Function is banned.',
  },
  {
    selector: `CallExpression[callee.property.name=/^(setItem|removeItem|clear)$/]:matches([callee.object.name=${STORAGE}], [callee.object.property.name=${STORAGE}])`,
    message: 'R-405: web storage writes are banned. Do not store user input.',
  },
  {
    selector: `AssignmentExpression:matches([left.object.name=${STORAGE}], [left.object.object.name=${STORAGE}], [left.object.property.name=${STORAGE}])`,
    message: 'R-405: web storage writes are banned. Do not store user input.',
  },
  {
    selector: 'AssignmentExpression[left.object.name="document"][left.property.name="cookie"]',
    message: 'R-405: writing cookies is banned. Do not store user input.',
  },
  {
    // Astro: set:html injects raw HTML.
    selector: 'JSXAttribute[name.namespace.name="set"][name.name.name="html"]',
    message: 'R-405: set:html is banned. Render user input as text.',
  },
];

// R-401: the fit-check engine is pure. No DOM, network, storage, clock or randomness.
const r401Names = [
  ['window', 'DOM'],
  ['document', 'DOM'],
  ['navigator', 'DOM'],
  ['location', 'DOM'],
  ['history', 'DOM'],
  ['self', 'DOM'],
  ['globalThis', 'global object'],
  ['fetch', 'network'],
  ['XMLHttpRequest', 'network'],
  ['WebSocket', 'network'],
  ['EventSource', 'network'],
  ['Request', 'network'],
  ['localStorage', 'storage'],
  ['sessionStorage', 'storage'],
  ['indexedDB', 'storage'],
  ['caches', 'storage'],
  ['Date', 'clock'],
  ['performance', 'clock'],
  ['setTimeout', 'clock'],
  ['setInterval', 'clock'],
  ['requestAnimationFrame', 'clock'],
  ['crypto', 'randomness'],
  ['process', 'environment'],
].map(([name, kind]) => ({
  name,
  message: `R-401: ${kind} global "${name}" is banned in src/lib/fitcheck/. The engine must be pure.`,
}));

export default tseslint.config(
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'coverage/',
      'reports/',
      'playwright-report/',
      'test-results/',
      'reference/',
      '.claude/',
      '.github/lint-fixtures/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  security.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Noisy on plain indexed access; the R-405 sinks above are the XSS defense.
      'security/detect-object-injection': 'off',
      'astro/no-set-html-directive': 'off', // replaced by the R-405 selector
      'no-restricted-syntax': ['error', ...r405],
    },
  },
  {
    // Build-time Node code reads paths it computes; the fs and regexp rules are for runtime code.
    files: ['scripts/**', '*.config.{js,mjs,ts}', '.stylelintrc.mjs', '.github/**'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-unsafe-regex': 'off',
    },
  },
  {
    files: ['src/lib/fitcheck/**/*.{js,mjs,ts}'],
    rules: {
      'no-restricted-globals': ['error', ...r401Names],
      'no-restricted-properties': [
        'error',
        ...['random', 'randomUUID', 'getRandomValues'].map((property) => ({
          property,
          message: `R-401: randomness (${property}) is banned in src/lib/fitcheck/.`,
        })),
        {
          object: 'Date',
          property: 'now',
          message: 'R-401: the clock is banned in src/lib/fitcheck/.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*', 'fs', 'http', 'https', 'net', 'crypto', 'child_process'],
              message: 'R-401: Node I/O modules are banned in src/lib/fitcheck/.',
            },
          ],
        },
      ],
    },
  },
);
