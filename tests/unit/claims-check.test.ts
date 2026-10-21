import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildClaimIndex,
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
const index = buildClaimIndex(claims, ['+1 555 010 0199']);

const page = (body: string, head = '') =>
  `<!doctype html><html><head><title>Home</title>${head}</head><body>${body}</body></html>`;

describe('visibleText', () => {
  it('drops head, script, style, template and comments', () => {
    const html = page(
      '<p>Seen 111</p><script>var n = 777;</script><style>.a{width:888px}</style><template>555</template><!-- 666 -->',
      '<meta name="date" content="2026-10-16"><script type="application/ld+json">{"n": 444}</script>',
    );
    const t = visibleText(html);
    expect(t).toContain('Seen 111');
    for (const n of ['777', '888', '555', '666', '444']) expect(t).not.toContain(n);
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

describe('visibleText hardening (issue #248)', () => {
  it('strips nested comments, script blocks and tags until the text is stable', () => {
    expect(visibleText('<!<!-- x -->-- 4242 -->ok')).not.toContain('4242');
    expect(visibleText('<scr<script>x</script>ipt>alert(4343)</script>ok')).not.toContain('4343');
    expect(visibleText('<sc<b>ript>ok')).not.toContain('<');
  });
  it('decodes &copy; so a footer year passes', () => {
    expect(checkHtml('/', page('<footer>&copy; 2026 Fake Name</footer>'), allowed)).toEqual([]);
  });
  it('reads value only on input and button, not on option, meter, data, radio or hidden', () => {
    const t = visibleText(
      '<option value="9191">A</option><meter value="9292"></meter><data value="9393">x</data><input type="radio" value="9494"><input type="submit" value="Send 111"><button value=\'Go 111\'>b</button>',
    );
    for (const n of ['9191', '9292', '9393', '9494']) expect(t).not.toContain(n);
    expect(t).toContain('Send 111');
    expect(t).toContain('Go 111');
  });
  it('reads unquoted attribute values', () => {
    expect(visibleText('<img alt=Chart7777 src=a.png>')).toContain('Chart7777');
    expect(checkHtml('/', page('<img alt=Chart-777 src=a.png>'), allowed)).toHaveLength(1);
  });
  it('does not treat a count after a month name as a year', () => {
    expect(checkHtml('/', page('<p>Served March 2000 customers.</p>'), allowed)).toHaveLength(1);
    expect(checkHtml('/', page('<p>Jan 2021 to Jun 2024, and March 1999.</p>'), allowed)).toEqual(
      [],
    );
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
    const t = 'S3 v2 jainrohan2312@gmail.com jaroh23 file.v3 x_9';
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
      '<p>111 widgets, 2,500 users, score 0.48 and 0.480, since Jan 2026 and Mar 1999. Call +1 555 010 0199</p>',
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

describe('R-301 gaps (issue #151)', () => {
  const nums = (html: string, a: Set<string> | typeof index = index) =>
    checkHtml('/', page(html), a).map((f) => f.number);

  it('treats 1900 to 2099 as a year only in date context', () => {
    expect(nums('<p>Served 2000 customers</p>')).toEqual(['2000']);
    expect(nums('<p>Served 2000 customers</p>', allowed)).toEqual(['2000']);
    expect(nums('<p>Built in 1999 units</p>')).toEqual(['1999']);
    for (const ok of [
      '<time datetime="2026-10-16">2026</time>',
      '<p>Sep 2026</p>',
      '<p>September 15, 2026</p>',
      '<p>15 Sep 2026</p>',
      '<p>2026-10-16</p>',
      '<p>10/16/2026</p>',
      '<p>Q3 2026</p>',
      '<p>\u00a9 2026 Fake</p>',
    ])
      expect(nums(ok), ok).toEqual([]);
  });

  it('matches per occurrence, not against the union of claim values', () => {
    expect(nums('<p>FAKE-111 widgets</p>')).toEqual([]);
    expect(nums('<p>Ships 111 widgets daily</p>')).toEqual([]);
    expect(nums('<p>I ate 111 pancakes</p>')).toEqual(['111']);
    // The union mode still passes it, which is the gap the index closes.
    expect(nums('<p>I ate 111 pancakes</p>', allowed)).toEqual([]);
  });

  it('flags a second occurrence that lacks the claim context', () => {
    expect(
      nums(`<p>111 widgets</p><p>${'Filler. '.repeat(20)}</p><p>Plays 111 guitars</p>`),
    ).toEqual(['111']);
  });

  it('reads noscript, title, placeholder and value text', () => {
    expect(nums('<noscript>Only 777 left</noscript>')).toEqual(['777']);
    const titled = '<html><head><title>Top 888 firms</title></head><body></body></html>';
    expect(checkHtml('/', titled, index).map((f) => f.number)).toEqual(['888']);
    expect(nums('<a href="#" title="Over 666 fans">x</a>')).toEqual(['666']);
    expect(nums('<input placeholder="Pick 557 items">')).toEqual(['557']);
    expect(nums('<input type="submit" value="Send 444 now">')).toEqual(['444']);
    expect(nums('<input type="hidden" value="333">')).toEqual([]);
  });

  it('extracts numbers with a leading x or dot', () => {
    expect(extractNumbers('x73 and .73 and 1.5 and S3 file.v3').map((f) => f.raw)).toEqual([
      'x73',
      '.73',
      '1.5',
    ]);
    expect(nums('<p>Boosted x73 overall</p>')).toEqual(['x73']);
    expect(nums('<p>Scored .73 overall</p>')).toEqual(['.73']);
    expect(nums('<p>Scored 0.73 overall</p>')).toEqual(['0.73']);
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

  it('fails --require-dist on an empty dist and skips without it', () => {
    const { dist, content } = setup('<p>x</p>');
    const empty = join(dist, '..', 'empty');
    mkdirSync(empty);
    expect(run('--dist', empty, '--content', content, '--require-dist').status).toBe(1);
    expect(run('--dist', empty, '--content', content).status).toBe(0);
  });

  it('fails a seeded "Served 2000 customers"', () => {
    const { dist, content } = setup('<p>Served 2000 customers</p>');
    const r = run('--dist', dist, '--content', content);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('"2000"');
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
  const ok = claimNumbers(claimsReal);
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
