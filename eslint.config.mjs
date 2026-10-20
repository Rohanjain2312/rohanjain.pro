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
    // 95-L2: computed literal keys reach the same sinks: el["innerHTML"] = x.
    selector:
      'AssignmentExpression[left.computed=true][left.property.value=/^(innerHTML|outerHTML|srcdoc)$/i]',
    message: 'R-405: innerHTML, outerHTML and srcdoc are banned. Render user input as text.',
  },
  {
    selector:
      'CallExpression[callee.computed=true][callee.property.value=/^(insertAdjacentHTML|setHTMLUnsafe|parseHTMLUnsafe|createContextualFragment|write|writeln)$/]',
    message: 'R-405: HTML string sinks are banned, including computed names.',
  },
  {
    selector: 'AssignmentExpression[left.property.name="srcdoc"]',
    message: 'R-405: srcdoc is banned. Render user input as text.',
  },
  {
    selector: 'CallExpression[callee.property.name="setAttribute"][arguments.0.value=/^srcdoc$/i]',
    message: 'R-405: srcdoc is banned. Render user input as text.',
  },
  {
    selector: 'JSXAttribute[name.name=/^srcdoc$/i]',
    message: 'R-405: srcdoc is banned. Render user input as text.',
  },
  {
    selector:
      'CallExpression[callee.property.name=/^(setHTMLUnsafe|parseHTMLUnsafe|createContextualFragment)$/]',
    message:
      'R-405: setHTMLUnsafe, parseHTMLUnsafe and createContextualFragment are banned. Render user input as text.',
  },
  {
    // window.document.write and globalThis.document.write.
    selector:
      'CallExpression[callee.object.property.name="document"][callee.object.object.name=/^(window|globalThis|self)$/][callee.property.name=/^(write|writeln)$/]',
    message: 'R-405: document.write is banned.',
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
  ['Image', 'network'],
  ['Worker', 'network'],
  ['SharedWorker', 'network'],
  ['BroadcastChannel', 'network'],
  ['importScripts', 'network'],
  ['cookieStore', 'storage'],
].map(([name, kind]) => ({
  name,
  message: `R-401: ${kind} global "${name}" is banned in src/lib/fitcheck/. The engine must be pure.`,
}));

// R-401: no dynamic import() and no require() inside the engine; a static import is the only way in.
const r401Syntax = [
  {
    selector: 'ImportExpression',
    message: 'R-401: dynamic import() is banned in src/lib/fitcheck/. Use a static import.',
  },
  {
    selector: 'CallExpression[callee.name="require"]',
    message: 'R-401: require() is banned in src/lib/fitcheck/. Use a static import.',
  },
];

// 95-L1: an inline comment must not switch off a project rule. Protected rules are the ones that carry a
// project rule, and this rule itself. Other rules (such as the fs heuristic) may still be disabled with a reason.
// A comment that names a protected rule at ANY position of its list is rejected, as is a blanket disable.
// The same function backs the text scan in .github/lint-fixtures/lint-rules.test.mjs, because a comment can
// also switch this rule off, which no ESLint rule can report.
const PROTECTED =
  /^(no-restricted-[\w-]+|no-eval|no-implied-eval|no-new-func|jsx-a11y\/[\w-]+|astro\/[\w/-]+|local\/[\w-]+)$/;
export function findProtectedDirective(commentText) {
  const text = commentText.trim();
  const directive = /^eslint-(?:disable|enable)(?:-next-line|-line)?(?=\s|$)([\s\S]*)$/.exec(text);
  const config = /^eslint\s+([\s\S]+)$/.exec(text);
  let tokens;
  if (directive) {
    const list = directive[1].split(/\s--\s/)[0].trim();
    if (!list) return '(all rules)';
    tokens = list.split(/[\s,]+/);
  } else if (config) {
    tokens = config[1].split(/[\s,:]+/);
  } else return null;
  return tokens.map((t) => t.replace(/^["']|["']$/g, '')).find((t) => PROTECTED.test(t)) ?? null;
}
const noProtectedDisable = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const hit = findProtectedDirective(comment.value);
          if (hit) {
            context.report({
              loc: comment.loc,
              message: `R-405: an inline comment cannot name "${hit}". Fix the code or add a config exception in eslint.config.mjs.`,
            });
          }
        }
      },
    };
  },
};

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
  { plugins: { local: { rules: { 'no-protected-disable': noProtectedDisable } } } },
  js.configs.recommended,
  tseslint.configs.recommended,
  security.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Noisy on plain indexed access; the R-405 sinks above are the XSS defense.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'security/detect-object-injection': 'off',
      'astro/no-set-html-directive': 'off', // replaced by the R-405 selector
      'no-restricted-syntax': ['error', ...r405],
      'local/no-protected-disable': 'error',
      // 95-L2: the core rules back the R-405 selectors.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    // The fs rule fires on every computed path. Node-side code (loaders, scripts, tests) reads paths it builds;
    // browser code has no fs. Config files may build regexes.
    files: [
      'scripts/**',
      'tests/**',
      '*.config.{js,mjs,ts}',
      '.stylelintrc.mjs',
      '.github/**',
      'src/lib/content/**',
    ],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'off',
    },
  },
  {
    // The slug patterns are linear (fixed delimiters); the unsafe-regex heuristic is a false positive there.
    files: [
      'scripts/**',
      '*.config.{js,mjs,ts}',
      '.stylelintrc.mjs',
      '.github/**',
      'src/lib/content/schemas.ts',
    ],
    rules: { 'security/detect-unsafe-regex': 'off' },
  },
  {
    // Tests build deliberately invalid data.
    files: ['tests/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    // JsonLd emits build-time site content (not user input) as script text; "<" is escaped by jsonLdText and
    // the CSP never runs JSON. Astro has no other way to emit it. Only the set:html selector is dropped here.
    files: ['src/components/JsonLd.astro'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...r405.filter((r) => !r.message.startsWith('R-405: set:html')),
      ],
    },
  },
  {
    // 95-L3: every file type in the engine folder, not only js, mjs and ts.
    files: ['src/lib/fitcheck/**/*'],
    rules: {
      'no-restricted-syntax': ['error', ...r405, ...r401Syntax],
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
              group: [
                'node:*',
                'fs',
                'fs/*',
                'http',
                'https',
                'net',
                'crypto',
                'child_process',
                'os',
                'path',
                'worker_threads',
              ],
              message: 'R-401: Node I/O modules are banned in src/lib/fitcheck/.',
            },
          ],
        },
      ],
    },
  },
);
