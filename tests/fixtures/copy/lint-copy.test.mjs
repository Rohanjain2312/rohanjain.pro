// Self-test for the copy lint (issue #27). Run: node --test tests/fixtures/copy/lint-copy.test.mjs
// Each fixture that breaks a rule must fail with its rule ID and line; clean copy must pass.
// This file builds banned characters from code points so the R-008 write guard does not block it.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { lintText } from '../../../scripts/lint-copy.mjs';

const here = import.meta.dirname;
const repoRoot = resolve(here, '../../..');
const script = join(repoRoot, 'scripts/lint-copy.mjs');
const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);
const BS = String.fromCharCode(92);

function cli(args, { root = repoRoot } = {}) {
  const r = spawnSync('node', [script, '--root', root, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function fixture(name) {
  return join(here, name);
}

function rules(rel, text, opts) {
  return lintText(rel, text, opts).map((f) => f.rule);
}

describe('fixtures fail with their rule ID, file and line', () => {
  const cases = [
    ['r008-em-dash.md', 'R-008', [3]],
    ['r008-escapes.txt', 'R-008', [1, 2, 3, 4]],
    ['r007-visa.md', 'R-007', [3]],
    ['r007-sponsorship.txt', 'R-007', [1]],
    ['r007-opt.md', 'R-007', [3]],
    ['r010-based-in.md', 'R-010', [3]],
    ['r010-city-state.md', 'R-010', [3]],
    ['r010-label.md', 'R-010', [3]],
    ['r010-json/site.json', 'R-010', [3]],
    ['r601-emoji.md', 'R-601', [3, 5, 6, 7]],
    ['r601-escapes.txt', 'R-601', [1, 2, 3]],
    ['r603-hype.md', 'R-603', [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
  ];
  for (const [file, rule, lines] of cases) {
    it(`${file} fails ${rule} on line(s) ${lines.join(',')}`, () => {
      const { code, out } = cli([fixture(file)]);
      assert.equal(code, 1);
      const found = out
        .split('\n')
        .filter((l) => l.startsWith(`${rule} `))
        .map((l) => {
          const m = /^(R-\d{3}) (\S+):(\d+) /.exec(l);
          assert.ok(m, `line has the form "<rule> <file>:<line> <message>": ${l}`);
          assert.ok(m[2].endsWith(file), `names the file: ${l}`);
          return Number(m[3]);
        });
      assert.deepEqual(found, lines);
      assert.ok(!out.split('\n').some((l) => /^R-\d{3} /.test(l) && !l.startsWith(`${rule} `)));
    });
  }

  it('clean.md passes', () => {
    const { code, out } = cli([fixture('clean.md')]);
    assert.equal(code, 0, out);
  });
});

describe('R-008 em dash', () => {
  it('flags the character and each escaped form', () => {
    assert.deepEqual(rules('src/a.md', `a ${EM} b`), ['R-008']);
    assert.deepEqual(rules('src/a.html', 'a &mdash; b'), ['R-008']);
    assert.deepEqual(rules('src/a.html', 'a &#8212; b'), ['R-008']);
    assert.deepEqual(rules('src/a.html', 'a &#X2014; b'), ['R-008']);
    assert.deepEqual(rules('src/a.json', `{"t":"a ${BS}u2014 b"}`), ['R-008']);
    assert.deepEqual(rules('src/a.ts', `const t = "a ${BS}u{2014} b";`), ['R-008']);
  });
  it('allows the en dash and the hyphen', () => {
    assert.deepEqual(rules('src/a.md', `2021${EN}2024 and well-known`), []);
  });
  it('reports the right line in CRLF text', () => {
    const [f] = lintText('src/a.md', `one\r\ntwo\r\nthree ${EM}\r\n`);
    assert.equal(f.line, 3);
  });
  it('checks the repo scope for the literal character only', () => {
    assert.deepEqual(rules('docs/a.md', `a ${EM} b`, { scope: 'repo' }), ['R-008']);
    assert.deepEqual(rules('docs/a.md', 'a &mdash; b', { scope: 'repo' }), []);
    assert.deepEqual(rules('docs/a.md', 'a visa b', { scope: 'repo' }), []);
  });
});

describe('R-007 work authorization', () => {
  const bad = [
    'work authorization',
    'Work Authorisation',
    'work-authorization',
    'employment authorization',
    'authorized to work',
    'eligible to work',
    'work eligibility',
    'right to work',
    'work permit',
    'visa',
    'Visas',
    'sponsorship',
    'sponsored by a firm',
    'sponsor for a role',
    'H-1B',
    'H1B',
    'green card',
    'citizenship',
    'US citizen',
    'U.S. citizens',
    'permanent resident',
    'OPT',
    'CPT',
  ];
  for (const phrase of bad) {
    it(`flags "${phrase}"`, () => {
      assert.deepEqual(rules('src/a.md', `Note: ${phrase}.`), ['R-007']);
    });
  }
  it('flags a phrase split across lines', () => {
    assert.deepEqual(
      lintText('src/a.md', 'work\nauthorization').map((f) => f.rule),
      ['R-007'],
    );
  });
  it('does not flag lookalikes', () => {
    const ok = 'visualization, advisor, supervisor, optimization, adopt, an opt-in flag, F-1 score';
    assert.deepEqual(rules('src/a.md', ok), []);
  });
  it('applies to code under src but not to bundles in dist', () => {
    assert.deepEqual(rules('src/lib/a.ts', 'const s = "visa";'), ['R-007']);
    assert.deepEqual(rules('dist/_astro/a.js', 'var s="visa";'), []);
  });
});

describe('R-010 location', () => {
  it('accepts New York, NY', () => {
    assert.deepEqual(rules('src/a.md', 'Based in New York, NY. Location: New York, NY'), []);
  });
  const bad = [
    'Based in Boston, MA',
    'based in Austin',
    'located in the Bay Area',
    'Rohan lives in Jersey City, NJ',
    'headquartered in Seattle',
    'Location: Washington, DC',
    'Brooklyn, NY',
    'New York City, NY',
    'Greater Boston Area',
    'based in New York City',
    'based in New Jersey',
  ];
  for (const text of bad) {
    it(`flags "${text}"`, () => {
      assert.ok(rules('src/a.md', text).every((r) => r === 'R-010'));
      assert.ok(rules('src/a.md', text).length >= 1);
    });
  }
  it('flags every US state code except the ones that read as English words', () => {
    const states =
      'AL AK AZ AR CA CO CT DE DC FL GA ID IL IA KS KY LA MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(
        ' ',
      );
    assert.equal(states.length, 46);
    for (const st of states) {
      assert.deepEqual(rules('src/a.md', `Springfield, ${st}`), ['R-010'], st);
    }
  });
  it('does not read role lists as places', () => {
    assert.deepEqual(
      rules('src/a.md', 'ML Engineer, AI Engineer, Data Scientist. Security, QA.'),
      [],
    );
  });
  it('does not apply to code files', () => {
    assert.deepEqual(rules('src/lib/a.ts', 'location: nonEmpty, // Location: Austin'), []);
  });
  it('checks site.json and the resume header', () => {
    assert.deepEqual(rules('src/content/site.json', '{\n"location": "Austin"\n}'), ['R-010']);
    assert.deepEqual(rules('src/content/site.json', '{\n"location": "New York, NY"\n}'), []);
    const resume = (loc) =>
      JSON.stringify(
        { header: { location: loc }, experience: [{ location: 'Bengaluru' }] },
        null,
        2,
      );
    assert.deepEqual(rules('src/content/resume.json', resume('Seattle')), ['R-010']);
    assert.deepEqual(rules('src/content/resume.json', resume('New York, NY')), []);
  });
  it('checks structured-data address fields', () => {
    const ld = (city, region) =>
      `<script type="application/ld+json">{"addressLocality":"${city}","addressRegion":"${region}"}</script>`;
    assert.deepEqual(rules('dist/index.html', ld('New York', 'NY')), []);
    assert.equal(rules('dist/index.html', ld('Boston', 'NY')).length, 1);
    assert.equal(rules('dist/index.html', ld('New York', 'MA')).length, 1);
  });
});

describe('R-601 emoji', () => {
  it('flags emoji, flags, keycaps and forced emoji presentation', () => {
    for (const s of ['\u{1F600}', '\u{1F1FA}\u{1F1F8}', '✅', '⚠️', '1️⃣', '↗️']) {
      assert.deepEqual(rules('src/a.md', `x ${s} y`), ['R-601'], s);
    }
  });
  it('flags emoji written as entities and escapes', () => {
    assert.deepEqual(rules('src/a.html', 'x &#x1F600; y'), ['R-601']);
    assert.deepEqual(rules('src/a.html', 'x &#128512; y'), ['R-601']);
    assert.deepEqual(rules('src/a.ts', `x ${BS}u{1F600} y`), ['R-601']);
    assert.deepEqual(rules('src/a.ts', `x ${BS}ud83d${BS}ude00 y`), ['R-601']);
  });
  it('allows arrows, copyright, trade marks, digits and punctuation', () => {
    assert.deepEqual(rules('src/a.md', '→ ← ↔ © ® ™ #1 *2 3✓ • ★'), []);
  });
  it('applies to css in dist', () => {
    assert.deepEqual(rules('dist/_astro/a.css', 'a::before{content:"\u{1F600}"}'), ['R-601']);
  });
});

describe('R-603 banned words', () => {
  const bad = [
    'passionate',
    'passionately',
    'cutting-edge',
    'cutting edge',
    'leverage',
    'leveraged',
    'leverages',
    'leveraging',
    'seamless',
    'seamlessly',
    'unlock',
    'unlocks',
    'unlocked',
    'unlocking',
    'delve',
    'delves',
    'delved',
    'delving',
    'synergy',
    'synergies',
    'synergistic',
    'world-class',
    'world class',
    'game-changer',
    'game changer',
    'game-changing',
    'robust',
    'robustly',
    'PASSIONATE',
  ];
  for (const word of bad) {
    it(`flags "${word}"`, () => {
      assert.deepEqual(rules('src/a.md', `A ${word} thing.`), ['R-603']);
    });
  }
  it('allows robust as a named method and the word robustness', () => {
    assert.deepEqual(
      rules('src/a.md', 'Uses robust scaling, robust standard errors and robustness checks.'),
      [],
    );
  });
  it('does not match inside other words', () => {
    assert.deepEqual(
      rules('src/a.md', 'unlockable? no. Delver, leverageless, seamlessness.').length,
      0,
    );
  });
  it('is not applied to bundles in dist', () => {
    assert.deepEqual(rules('dist/_astro/a.js', 'var s="leverage";'), []);
  });
});

describe('scope and exemptions', () => {
  let tmp;
  before(() => {
    tmp = mkdtempSync(join(tmpdir(), 'lint-copy-'));
    const put = (rel, text) => {
      const abs = join(tmp, rel);
      mkdirSync(join(abs, '..'), { recursive: true });
      writeFileSync(abs, text);
    };
    put('src/content/ok.md', 'Fine copy in New York, NY.\n');
    put('reference/old.md', `Reference ${EM} is exempt.\n`);
    put('tests/fixtures/copy/bad.md', `Fixture ${EM} is skipped.\n`);
    put('node_modules/pkg/a.md', `Dependency ${EM}\n`);
    put('docs/ok.md', 'No dash here.\n');
  });
  after(() => rmSync(tmp, { recursive: true, force: true }));

  it('passes a clean tree and exempts reference/ and the fixture directory', () => {
    const { code, out } = cli([], { root: tmp });
    assert.equal(code, 0, out);
  });

  it('fails an em dash in docs/ (repo-wide R-008)', () => {
    writeFileSync(join(tmp, 'docs/bad.md'), `x\nBad ${EM} dash\n`);
    const { code, out } = cli([], { root: tmp });
    rmSync(join(tmp, 'docs/bad.md'));
    assert.equal(code, 1);
    assert.match(out, /^R-008 docs\/bad\.md:2 /m);
  });

  it('does not apply other rules outside the site files', () => {
    writeFileSync(
      join(tmp, 'docs/rules.md'),
      'Never mention a visa. Be passionate. Based in Boston, MA.\n',
    );
    const { code, out } = cli([], { root: tmp });
    rmSync(join(tmp, 'docs/rules.md'));
    assert.equal(code, 0, out);
  });

  it('lints build output and ignores source maps and bundles for word rules', () => {
    mkdirSync(join(tmp, 'dist/_astro'), { recursive: true });
    writeFileSync(join(tmp, 'dist/index.html'), `<p>\n<b>Passionate</b> ${EM} \u{1F600}</p>\n`);
    writeFileSync(join(tmp, 'dist/_astro/app.js'), 'var s="leverage";\n');
    writeFileSync(join(tmp, 'dist/_astro/app.js.map'), `{"x":"${EM}"}\n`);
    const { code, out } = cli([], { root: tmp });
    rmSync(join(tmp, 'dist'), { recursive: true });
    assert.equal(code, 1);
    const lines = out.split('\n').filter((l) => /^R-\d{3} /.test(l));
    assert.ok(
      lines.every((l) => l.includes('dist/index.html:')),
      out,
    );
    assert.deepEqual(lines.map((l) => l.slice(0, 5)).sort(), ['R-008', 'R-601', 'R-603']);
  });

  it('lints README.md and CONTRIBUTING.md with every rule', () => {
    writeFileSync(join(tmp, 'README.md'), 'Open to a visa.\n');
    writeFileSync(join(tmp, 'CONTRIBUTING.md'), 'Seamless.\n');
    const { code, out } = cli([], { root: tmp });
    rmSync(join(tmp, 'README.md'));
    rmSync(join(tmp, 'CONTRIBUTING.md'));
    assert.equal(code, 1);
    assert.match(out, /^R-007 README\.md:1 /m);
    assert.match(out, /^R-603 CONTRIBUTING\.md:1 /m);
  });

  it('--require-dist fails when dist/ is missing', () => {
    const { code, err } = cli(['--require-dist'], { root: tmp });
    assert.equal(code, 2);
    assert.match(err, /dist\/ is missing/);
  });

  it('exempts an explicit path under reference/', () => {
    const { code } = cli([join(tmp, 'reference/old.md')], { root: tmp });
    assert.equal(code, 0);
  });

  it('rejects unknown options and missing paths', () => {
    assert.equal(cli(['--nope']).code, 2);
    assert.equal(cli([join(tmp, 'missing.md')], { root: tmp }).code, 2);
  });
});

describe('static tree fixture', () => {
  it('exempts reference/ and flags docs/', () => {
    const { code, out } = cli([], { root: fixture('tree') });
    assert.equal(code, 1);
    const lines = out.split('\n').filter((l) => /^R-\d{3} /.test(l));
    assert.equal(lines.length, 1);
    assert.match(lines[0], /^R-008 docs\/bad\.md:3 /);
  });
});
