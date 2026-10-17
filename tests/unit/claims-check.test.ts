import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  checkHtml,
  claimNumbers,
  extractNumbers,
  formatFinding,
  nearestText,
  pageName,
  visibleText,
} from '../../src/lib/claims/check.ts';

// Clearly fake claims (R-005): the numbers 111 and 2.50 exist only here.
const claims = [
  { value: 111, display: 'FAKE-111 widgets' },
  { value: '2,500+', display: 'over 2,500+ fake users' },
  { value: 0.48, display: '0.480 fake score' },
];
const allowed = claimNumbers(claims, ['+1 555 010 0199']);

const page = (body: string, head = '') =>
  `<!doctype html><html><head><title>Fake 999</title>${head}</head><body>${body}</body></html>`;

describe('visibleText', () => {
  it('drops head, script, style, template and comments', () => {
    const html = page(
      '<p>Seen 111</p><script>var n = 777;</script><style>.a{width:888px}</style><template>555</template><!-- 666 -->',
      '<meta name="date" content="2026-10-16"><script type="application/ld+json">{"n": 444}</script>',
    );
    const t = visibleText(html);
    expect(t).toContain('Seen 111');
    for (const n of ['777', '888', '555', '666', '444', '999']) expect(t).not.toContain(n);
  });

  it('ignores non-visible attributes but keeps alt and aria-label', () => {
    const t = visibleText(
      '<div class="w-333" data-count="321" style="top:9px"><img src="/a-77.png" alt="Chart of 111"><button aria-label=\'Step 111\'>Go</button></div>',
    );
    expect(t).toContain('Chart of 111');
    expect(t).toContain('Step 111');
    expect(t).not.toContain('333');
    expect(t).not.toContain('321');
    expect(t).not.toContain('77');
  });

  it('decodes entities and separates block elements', () => {
    expect(visibleText('<p>A&amp;B &#x41; &#66; &nbsp;&bogus;</p><p>C</p>')).toBe(
      '\nA&B A B &bogus;\n\nC\n',
    );
    expect(visibleText('<span>9.</span><span>1</span>x')).toBe('9.1x');
    expect(visibleText('<p>a</p>&#0;&#x110000;')).toContain('&#0;');
  });
});

describe('extractNumbers', () => {
  it('finds integers, decimals and comma groups', () => {
    expect(extractNumbers('3.1M trades, 6,400+ scans, 0.333 and 10.').map((f) => f.raw)).toEqual([
      '3.1',
      '6,400',
      '0.333',
      '10',
    ]);
  });

  it('skips digits that belong to names', () => {
    const t = 'S3 v2 rohanjain2312@gmail.com jaroh23 file.v3 x_9';
    expect(extractNumbers(t)).toEqual([]);
  });

  it('keeps digits after a hyphen or slash', () => {
    expect(extractNumbers('GPT-4 and 68/32').map((f) => f.raw)).toEqual(['4', '68', '32']);
  });
});

describe('claimNumbers', () => {
  it('collects numbers from values, displays and extra text', () => {
    const s = claimNumbers(claims, ['call 555']);
    expect([...s].sort()).toEqual(['0.48', '111', '2500', '555'].sort());
  });
});

describe('checkHtml', () => {
  it('passes claimed numbers, years and formatting variants', () => {
    const html = page(
      '<p>111 widgets, 2,500 users, score 0.48 and 0.480, since 2026 and 1999. Call +1 555 010 0199</p>',
    );
    expect(checkHtml('/', html, allowed)).toEqual([]);
  });

  it('fails a seeded unclaimed number and names page, number and nearest text', () => {
    const html = page('<h1>Results</h1><p>We served 777 customers last quarter.</p>');
    const [f, ...rest] = checkHtml('/work/', html, allowed);
    expect(rest).toEqual([]);
    expect(f!.page).toBe('/work/');
    expect(f!.number).toBe('777');
    expect(f!.near).toContain('We served 777 customers');
    expect(formatFinding(f!)).toBe(
      `R-301 /work/: number "777" has no claim in claims.json. Near: "${f!.near}"`,
    );
  });

  it('does not flag numbers hidden in metadata, scripts or class names', () => {
    const html = page('<p class="col-12" data-x="888">Hello</p><script>1234</script>');
    expect(checkHtml('/', html, allowed)).toEqual([]);
  });

  it('honours the allowlist per page only', () => {
    const html = page('<h1>404</h1>');
    const list = [{ page: '/404', number: '404', reason: 'HTTP status code' }];
    expect(checkHtml('/404', html, allowed, list)).toEqual([]);
    expect(checkHtml('/other', html, allowed, list)).toHaveLength(1);
  });
});

describe('helpers', () => {
  it('maps built files to page names', () => {
    expect(pageName('index.html')).toBe('/');
    expect(pageName('for/acme/index.html')).toBe('/for/acme/');
    expect(pageName('404.html')).toBe('/404');
    expect(pageName('a\\b.html')).toBe('/a/b');
  });

  it('trims nearest text to a window', () => {
    const text = `${'x'.repeat(100)} 42 ${'y'.repeat(100)}`;
    const n = nearestText(text, 101, 2, 5);
    expect(n).toBe('xxxx 42 yyyy');
    expect(nearestText('42', 0, 2)).toBe('42');
  });
});

describe('scripts/check-claims.ts', () => {
  const dirs: string[] = [];
  afterEach(() => {
    while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
  });

  function setup(body: string, withAllowlist = false) {
    const root = mkdtempSync(join(tmpdir(), 'claims-'));
    dirs.push(root);
    const dist = join(root, 'dist');
    const content = join(root, 'content');
    mkdirSync(join(dist, 'work'), { recursive: true });
    mkdirSync(content);
    writeFileSync(join(dist, 'index.html'), page('<p>111 widgets</p>'));
    writeFileSync(join(dist, 'work', 'index.html'), page(body));
    writeFileSync(
      join(content, 'claims.json'),
      JSON.stringify([
        {
          id: 'fake-a',
          value: 111,
          display: 'FAKE-111 widgets',
          source: 'fake',
          verifiedOn: '2000-01-01',
        },
      ]),
    );
    writeFileSync(
      join(content, 'site.json'),
      JSON.stringify({
        name: 'Fake',
        location: 'Nowhere',
        availability: 'Never',
        email: 'fake@example.com',
        phone: '+1 555 010 0199',
        profiles: {
          linkedin: 'https://example.com/l',
          github: 'https://example.com/g',
          huggingface: 'https://example.com/h',
          medium: 'https://example.com/m',
        },
        showPhoto: false,
      }),
    );
    if (withAllowlist)
      writeFileSync(
        join(content, 'claims-allowlist.json'),
        JSON.stringify([{ page: '/work/', number: '777', reason: 'fake ordinal' }]),
      );
    return { dist, content };
  }

  const run = (...a: string[]) =>
    spawnSync('node', ['scripts/check-claims.ts', ...a], { encoding: 'utf8' });

  it('passes when every number is claimed', () => {
    const { dist, content } = setup('<p>111 widgets</p>');
    const r = run('--dist', dist, '--content', content);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('OK (2 page(s))');
  });

  it('fails on an unclaimed number and prints page, number and text', () => {
    const { dist, content } = setup('<p>Served 777 people</p>');
    const r = run('--dist', dist, '--content', content);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('/work/');
    expect(r.stderr).toContain('"777"');
    expect(r.stderr).toContain('Served 777 people');
  });

  it('reads the allowlist', () => {
    const { dist, content } = setup('<p>Served 777 people</p>', true);
    expect(run('--dist', dist, '--content', content).status).toBe(0);
  });

  it('skips without dist and fails with --require-dist', () => {
    const { content } = setup('<p>x</p>');
    const missing = join(content, 'no-dist');
    expect(run('--dist', missing, '--content', content).status).toBe(0);
    expect(run('--dist', missing, '--content', content, '--require-dist').status).toBe(1);
  });

  it('fails when claims.json is missing', () => {
    const { dist, content } = setup('<p>x</p>');
    rmSync(join(content, 'claims.json'));
    const r = run('--dist', dist, '--content', content);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('claims.json is missing');
  });
});

describe('resume.json against claims.json (R-301, R-005)', () => {
  const read = (n: string) => JSON.parse(readFileSync(join('src/content', n), 'utf8'));
  const claimsReal = read('claims.json') as {
    id: string;
    value: number | string;
    display: string;
  }[];
  const resume = read('resume.json');
  const site = read('site.json');
  const ok = claimNumbers(claimsReal, [site.phone]);
  const bullets: { text: string; claimIds: string[] }[] = [
    ...resume.experience.flatMap((e: any) => e.bullets),
    ...resume.projects.flatMap((p: any) => p.bullets),
  ];

  it('every number in the résumé maps to a claim', () => {
    const all = JSON.stringify(resume).replace(/https?:[^"]*/g, '');
    expect(checkHtml('resume.json', `<p>${all}</p>`, ok).map((f) => f.number)).toEqual([]);
  });

  it('every bullet with a number references claim IDs', () => {
    for (const b of bullets) {
      const nums = extractNumbers(b.text).filter((f) => !/^(19|20)\d\d$/.test(f.raw));
      if (nums.length) expect(b.claimIds.length, b.text).toBeGreaterThan(0);
    }
    expect(resume.publication.claimIds.length).toBeGreaterThan(0);
  });

  it('has no em dash, local path or work authorization line', () => {
    const s = JSON.stringify(resume);
    expect(s).not.toContain(String.fromCharCode(0x2014));
    expect(s).not.toContain('file:');
    expect(s).not.toMatch(/authoriz|visa|sponsor/i);
    expect(resume.header.location).toBe('New York, NY');
  });
});
