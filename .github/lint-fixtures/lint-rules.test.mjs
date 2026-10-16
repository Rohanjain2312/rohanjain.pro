// Self-test for the lint gates (issue #11). Run: npm run lint:selftest
// Each fixture that breaks a rule must fail with its rule ID; clean fixtures must pass.
// ESLint fixtures are linted as text under a virtual src/ path so the path-scoped rules apply.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';

const dir = import.meta.dirname;
const eslint = new ESLint();

async function eslintMessages(fixture, virtualPath) {
  const code = readFileSync(resolve(dir, fixture), 'utf8');
  const [result] = await eslint.lintText(code, { filePath: virtualPath });
  return result.messages.map((m) => m.message);
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
  ]) {
    it(`${f} fails with R-405`, async () => {
      const messages = await eslintMessages(`eslint/${f}`, `src/${f}`);
      assert.ok(
        messages.some((m) => m.includes('R-405')),
        messages.join(' | '),
      );
    });
  }

  it('clean.js passes (text rendering and storage reads are allowed)', async () => {
    assert.deepEqual(await eslintMessages('eslint/clean.js', 'src/clean.js'), []);
  });
});

describe('ESLint R-401', () => {
  for (const f of ['dom.js', 'network.js', 'storage.js', 'clock.js', 'random.js']) {
    it(`fitcheck/${f} fails with R-401`, async () => {
      const messages = await eslintMessages(`fitcheck/${f}`, `src/lib/fitcheck/${f}`);
      assert.ok(
        messages.some((m) => m.includes('R-401')),
        messages.join(' | '),
      );
    });
  }

  it('the same code is allowed outside src/lib/fitcheck/', async () => {
    const messages = await eslintMessages('fitcheck/dom.js', 'src/lib/other/dom.js');
    assert.deepEqual(messages, []);
  });

  it('a pure engine file passes', async () => {
    assert.deepEqual(
      await eslintMessages('fitcheck/clean.js', 'src/lib/fitcheck/clean.js'),
      [],
    );
  });
});

describe('ESLint a11y', () => {
  it('an image without alt text fails', async () => {
    const messages = await eslintMessages('eslint/a11y.astro', 'src/a11y.astro');
    assert.ok(messages.length > 0);
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
