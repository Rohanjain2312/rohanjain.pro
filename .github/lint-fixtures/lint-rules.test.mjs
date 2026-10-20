// Self-test for the lint gates (issue #11, #247). Run: npm run lint:selftest
// Each fixture that breaks a rule must fail with its rule ID; clean fixtures must pass.
// ESLint fixtures are linted as text under a virtual src/ path so the path-scoped rules apply.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';
import { findProtectedDirective } from '../../eslint.config.mjs';

const dir = import.meta.dirname;
const eslint = new ESLint();

async function eslintResults(fixture, virtualPath) {
  const code = readFileSync(resolve(dir, fixture), 'utf8');
  const [result] = await eslint.lintText(code, { filePath: virtualPath });
  return result.messages;
}

async function eslintMessages(fixture, virtualPath) {
  return (await eslintResults(fixture, virtualPath)).map((m) => m.message);
}

// The fixture must be reported under this ESLint rule ID as an error, not a warning.
async function assertRule(fixture, virtualPath, ruleId) {
  const found = await eslintResults(fixture, virtualPath);
  assert.ok(
    found.some((m) => m.ruleId === ruleId && m.severity === 2),
    `${ruleId} expected: ${found.map((m) => `${m.ruleId}: ${m.message}`).join(' | ')}`,
  );
}

async function assertMessageHas(fixture, virtualPath, text) {
  const messages = await eslintMessages(fixture, virtualPath);
  assert.ok(
    messages.some((m) => m.includes(text)),
    messages.join(' | '),
  );
}

// Text scan: every comment that is an ESLint directive naming a protected rule (or this guard) is a hit, in any
// position of a list. A comment can switch the ESLint guard off, so the scan is what cannot be bypassed.
function findDirectiveHits(text) {
  const hits = [];
  for (const m of text.matchAll(/\/\*([\s\S]*?)\*\/|\/\/([^\n]*)/g)) {
    const hit = findProtectedDirective(m[1] ?? m[2]);
    if (hit) hits.push(hit);
  }
  return hits;
}

function* walk(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = resolve(path, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(js|mjs|cjs|ts|tsx|astro)$/.test(entry.name)) yield full;
  }
}

async function cssWarnings(fixture) {
  const { results } = await stylelint.lint({ files: resolve(dir, 'css', fixture) });
  return results[0].warnings.map((w) => w.text);
}

describe('ESLint R-405', () => {
  for (const f of [
    'inner-html.js',
    'outer-html.js',
    'insert-adjacent.js',
    'document-write.js',
    'eval.js',
    'new-function.js',
    'storage-call.js',
    'storage-assign.js',
    'set-html.astro',
    // 95-L2: computed keys, window. and globalThis. document.write, unsafe parsers, srcdoc.
    'computed-inner-html.js',
    'window-document-write.js',
    'globalthis-document-write.js',
    'set-html-unsafe.js',
    'parse-html-unsafe.js',
    'contextual-fragment.js',
    'srcdoc.js',
  ]) {
    it(`${f} fails with R-405`, async () => {
      await assertMessageHas(`eslint/${f}`, `src/${f}`, 'R-405');
    });
  }

  // 95-L2: the core rules back the selectors.
  for (const [f, ruleId] of [
    ['eval.js', 'no-eval'],
    ['new-function.js', 'no-new-func'],
    ['implied-eval.js', 'no-implied-eval'],
  ]) {
    it(`${f} fails with ${ruleId}`, () => assertRule(`eslint/${f}`, `src/${f}`, ruleId));
  }

  // 95-L1: a disable comment cannot switch off a project rule.
  for (const f of ['disable-next-line.js', 'disable-config-comment.js']) {
    it(`${f} still fails with R-405 (the comment is rejected)`, async () => {
      await assertRule(`eslint/${f}`, `src/${f}`, 'local/no-protected-disable');
      await assertMessageHas(`eslint/${f}`, `src/${f}`, 'R-405');
    });
  }

  // The four probes from the Security review of #262, plus the blanket form. Each is caught by the text scan.
  for (const [f, name] of [
    ['disable-block.js', '(all rules)'],
    ['disable-line-list.js', 'no-restricted-syntax'],
    ['disable-self-first.js', 'local/no-protected-disable'],
    ['config-quoted.js', 'no-restricted-syntax'],
    ['config-local-quoted.js', 'local/no-protected-disable'],
  ]) {
    it(`${f} is caught by the text scan for ${name} (R-405)`, () => {
      const text = readFileSync(resolve(dir, `eslint/${f}`), 'utf8');
      assert.ok(findDirectiveHits(text, `src/${f}`).includes(name), `R-405: ${name} not detected`);
    });
  }

  it('no source file carries a directive naming a protected rule, or a blanket disable (R-405)', () => {
    const root = resolve(dir, '../..');
    const hits = [];
    for (const top of ['src', 'scripts', 'tests', '.github', 'public']) {
      for (const file of walk(resolve(root, top))) {
        if (file.includes('lint-fixtures')) continue;
        const rel = file.slice(root.length + 1);
        if (findDirectiveHits(readFileSync(file, 'utf8'), rel).length) hits.push(rel);
      }
    }
    assert.deepEqual(hits, [], 'R-405: directive comments naming protected rules in these files');
  });

  it('a disable comment for a rule that is not a project rule is allowed', async () => {
    const [result] = await eslint.lintText(
      '// eslint-disable-next-line security/detect-unsafe-regex\nexport const r = /(a+)+$/;\n',
      { filePath: 'src/ok.js' },
    );
    assert.deepEqual(result.messages, []);
  });

  it('clean.js passes (text rendering and storage reads are allowed)', async () => {
    assert.deepEqual(await eslintMessages('eslint/clean.js', 'src/clean.js'), []);
  });
});

describe('ESLint R-401', () => {
  for (const f of ['dom.js', 'network.js', 'storage.js', 'clock.js', 'random.js']) {
    it(`fitcheck/${f} fails with R-401`, async () => {
      await assertMessageHas(`fitcheck/${f}`, `src/lib/fitcheck/${f}`, 'R-401');
    });
  }

  // 95-L3: dynamic import(), require() and the extra browser globals. The .cjs path proves the
  // rules cover every file type in the folder.
  for (const [f, ruleId] of [
    ['dynamic-import.js', 'no-restricted-syntax'],
    ['dynamic-import-fs.js', 'no-restricted-syntax'],
    ['require.cjs', 'no-restricted-syntax'],
    ['image.js', 'no-restricted-globals'],
    ['worker.js', 'no-restricted-globals'],
    ['shared-worker.js', 'no-restricted-globals'],
    ['broadcast-channel.js', 'no-restricted-globals'],
    ['import-scripts.js', 'no-restricted-globals'],
    ['cookie-store.js', 'no-restricted-globals'],
  ]) {
    it(`fitcheck/${f} fails with R-401`, async () => {
      await assertRule(`fitcheck/${f}`, `src/lib/fitcheck/${f}`, ruleId);
      await assertMessageHas(`fitcheck/${f}`, `src/lib/fitcheck/${f}`, 'R-401');
    });
  }

  it('the same code is allowed outside src/lib/fitcheck/', async () => {
    const messages = await eslintMessages('fitcheck/dom.js', 'src/lib/other/dom.js');
    assert.deepEqual(messages, []);
  });

  it('a pure engine file passes', async () => {
    assert.deepEqual(await eslintMessages('fitcheck/clean.js', 'src/lib/fitcheck/clean.js'), []);
  });
});

describe('ESLint a11y', () => {
  it('an image without alt text fails with astro/jsx-a11y/alt-text', () =>
    assertRule('eslint/a11y.astro', 'src/a11y.astro', 'astro/jsx-a11y/alt-text'));

  it('a disable comment cannot switch off the alt-text rule', async () => {
    await assertRule(
      'eslint/a11y-disable.astro',
      'src/a11y-disable.astro',
      'local/no-protected-disable',
    );
  });
});

describe('Stylelint', () => {
  const cases = [
    ['hex.css', 'R-601'],
    ['named-color.css', 'R-601'],
    ['rgb.css', 'R-601'],
    ['gradient.css', 'R-601'],
    ['box-shadow.css', 'R-601'],
    ['duration-s.css', 'R-608'],
    ['duration-ms.css', 'R-608'],
    // 95-L4: letter case, custom-property durations, more color properties.
    ['uppercase-property.css', 'R-601'],
    ['uppercase-unit.css', 'R-608'],
    ['custom-property-duration.css', 'R-608'],
    ['scrollbar-color.css', 'R-601'],
    // 95-L1: a disable comment does not hide the hex value.
    ['disable-comment.css', 'R-601'],
    ['disable-next-line.css', 'R-601'],
  ];
  for (const [f, id] of cases) {
    it(`${f} fails with ${id}`, async () => {
      const warnings = await cssWarnings(f);
      assert.ok(
        warnings.some((w) => w.includes(id)),
        warnings.join(' | '),
      );
    });
  }

  it('clean.css passes (200 ms and shorter are allowed)', async () => {
    assert.deepEqual(await cssWarnings('clean.css'), []);
  });

  it('hex values are allowed in the token file', async () => {
    assert.deepEqual(await cssWarnings('tokens/tokens.css'), []);
  });
});
