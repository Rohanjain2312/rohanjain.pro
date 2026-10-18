// Independent accessibility audit of the built site (QA, Phase 6; record in docs/qa/phase-6-a11y.md).
// It is a report generator, not a test: it never fails the build. Run `npm run build` first, then:
//   node tests/e2e/a11y-audit.mjs --out <dir> [--only axe,keys,motion,zoom,forced,tree,targets]
// It serves dist/ through scripts/preview.mjs (real CSP) and builds a /for fixture site in a temp directory
// from a synthetic posting, as tests/component/for.spec.ts does. Nothing is written inside the repository.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const OUT = arg('out');
if (!OUT) {
  console.error('Usage: node tests/e2e/a11y-audit.mjs --out <dir> [--only axe,keys,...]');
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });
const ONLY = new Set((arg('only') ?? 'axe,keys,motion,zoom,forced,tree,targets').split(','));
const MAIN_PORT = 4411;
const FOR_PORT = 4412;
const MAIN = `http://localhost:${MAIN_PORT}`;
const FOR = `http://localhost:${FOR_PORT}`;
const WIDTHS = [390, 768, 1280];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const HF = 'https://*.hf.space/**';

const servers = [];
function serve(dir, port) {
  const child = spawn('node', ['scripts/preview.mjs', '--port', String(port), '--dir', dir], {
    stdio: 'ignore',
  });
  servers.push(child);
  return child;
}
async function waitFor(url) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not start: ${url}`);
}

/** Builds the /for fixture site: one live result and one expired result, from a synthetic posting. */
function buildForFixture() {
  const work = mkdtempSync(join(tmpdir(), 'qa-a11y-for-'));
  const apps = join(work, 'applications');
  mkdirSync(apps);
  writeFileSync(
    join(work, 'posting.txt'),
    [
      'We are hiring an AI Engineer.',
      'You will build LLM agents with LangGraph, retrieval augmented generation and tool calling.',
      'Python, SQL, Docker and Kubernetes are required. Experience with vLLM is a plus.',
    ].join('\n'),
  );
  const gen = (company) =>
    spawnSync(
      'node',
      [
        'scripts/for.ts',
        '--company',
        company,
        '--role',
        'Staff Widget Engineer',
        '--jd',
        join(work, 'posting.txt'),
        '--out',
        apps,
      ],
      { encoding: 'utf8' },
    );
  if (gen('Northwind Fixture').status !== 0) throw new Error('for generator failed (live)');
  const before = new Set(readdirSync(apps));
  if (gen('Hidden Fixture Corp').status !== 0) throw new Error('for generator failed (expired)');
  const files = readdirSync(apps);
  const old = files.find((f) => !before.has(f));
  const live = files.find((f) => f !== old).replace(/\.json$/, '');
  const data = JSON.parse(readFileSync(join(apps, old), 'utf8'));
  data.created = '2020-01-01';
  data.expires = '2020-04-01';
  writeFileSync(join(apps, old), JSON.stringify(data));
  const dist = join(work, 'dist');
  const build = spawnSync('npx', ['astro', 'build', '--outDir', dist], {
    env: { ...process.env, APPLICATIONS_DIR: apps },
    encoding: 'utf8',
  });
  if (build.status !== 0) throw new Error(`fixture build failed: ${build.stderr}`);
  return { dist, live, expired: old.replace(/\.json$/, '') };
}

const short = (n) => (n.length > 160 ? `${n.slice(0, 160)}...` : n);

async function axeScan(page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const all = await new AxeBuilder({ page }).analyze();
  return {
    violations: r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => short(n.target.join(' '))),
    })),
    incomplete: all.incomplete.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 6).map((n) => short(n.target.join(' '))),
      count: v.nodes.length,
    })),
    allRulesViolations: all.violations
      .filter((v) => !r.violations.some((x) => x.id === v.id))
      .map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => short(n.target.join(' '))),
      })),
  };
}

// ---- state openers: each returns after the page is in the named state ----
const fitSample = async (page) => {
  await page.locator('[data-fit-sample]').first().click();
  await page.locator('[data-fit-run]').click();
  await page.locator('[data-fit-report]').waitFor({ state: 'visible' });
};
function homeStates() {
  return [
    ['home-folds-closed', async () => {}],
    [
      'home-folds-open',
      async (page) => {
        await page.evaluate(() => {
          for (const d of document.querySelectorAll('details')) d.open = true;
        });
      },
    ],
    ['home-fit-report', fitSample],
    [
      'home-fit-report-warning',
      async (page) => {
        await page.locator('#fit-text').fill('x'.repeat(40));
        await page.locator('[data-fit-run]').click();
      },
    ],
    [
      'resume-dialog-ml',
      async (page) => {
        await page.locator('.hero [data-resume-open]').click();
        await page.locator('[data-resume-dialog]').waitFor({ state: 'visible' });
      },
    ],
    [
      'resume-dialog-ai',
      async (page) => {
        await page.locator('.hero [data-resume-open]').click();
        await page.getByRole('tab').first().click();
      },
    ],
    [
      'resume-dialog-ds',
      async (page) => {
        await page.locator('.hero [data-resume-open]').click();
        await page.getByRole('tab').last().click();
      },
    ],
    [
      'demo-dialog-static',
      async (page) => {
        await page.getByRole('link', { name: /try it here for FinCompress/ }).click();
        await page.locator('[data-demo-dialog]').waitFor({ state: 'visible' });
      },
    ],
    [
      'demo-dialog-loaded',
      async (page) => {
        await page.getByRole('link', { name: /try it here for FinCompress/ }).click();
        await page.getByRole('button', { name: 'Load live demo' }).click();
        await page.locator('iframe').waitFor();
      },
    ],
    [
      'brief-dialog',
      async (page) => {
        await fitSample(page);
        await page.locator('[data-fit-brief-open]').click();
        await page.locator('[data-brief]').waitFor({ state: 'visible' });
      },
    ],
  ];
}

async function newPage(browser, { width = 1280, height = 900, ...ctx } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, ...ctx });
  await context.route(HF, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>demo</p>' }),
  );
  return { context, page: await context.newPage() };
}

// ---- 1. axe: every page and dialog state at three widths ----
async function runAxe(browser, fixture) {
  const results = {};
  const pages = [
    ['privacy', `${MAIN}/privacy/`],
    ['404', `${MAIN}/404.html`],
    ['print-resume-ai', `${MAIN}/print/resume/ai/`],
    ['print-resume-ml', `${MAIN}/print/resume/ml/`],
    ['print-resume-ds', `${MAIN}/print/resume/ds/`],
    ['for-live', `${FOR}/for/${fixture.live}/`],
    ['for-expired', `${FOR}/for/${fixture.expired}/`],
  ];
  for (const width of WIDTHS) {
    for (const [name, url] of pages) {
      const { context, page } = await newPage(browser, { width });
      await page.goto(url);
      results[`${name}@${width}`] = await axeScan(page);
      await context.close();
    }
    for (const [name, open] of homeStates()) {
      const { context, page } = await newPage(browser, { width });
      await page.goto(`${MAIN}/`);
      await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
      await open(page);
      results[`${name}@${width}`] = await axeScan(page);
      await context.close();
    }
  }
  writeFileSync(join(OUT, 'axe.json'), JSON.stringify(results, null, 2));
  for (const [k, v] of Object.entries(results)) {
    const incomplete = v.incomplete.map((i) => `${i.id}(${i.count})`).join(',');
    console.log(
      `axe ${k}: violations=${v.violations.length} extra-rules=${v.allRulesViolations.length} incomplete=[${incomplete}]`,
    );
    for (const x of [...v.violations, ...v.allRulesViolations])
      console.log(`   ${x.id} ${x.impact}: ${x.nodes.join(' | ')}`);
  }
}

// ---- 2. keyboard ----
const describeFocus = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const name =
    el.getAttribute('aria-label') ||
    (el.labels && el.labels[0] ? el.labels[0].textContent : '') ||
    el.textContent ||
    el.getAttribute('title') ||
    '';
  const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
  const cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
  const top = document.elementFromPoint(cx, cy);
  return {
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role'),
    id: el.id || undefined,
    cls: String(el.className || '').slice(0, 50),
    name: name.replace(/\s+/g, ' ').trim().slice(0, 60),
    w: Math.round(r.width),
    h: Math.round(r.height),
    top: Math.round(r.top),
    left: Math.round(r.left),
    inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
    obscured: !!top && top !== el && !el.contains(top) && !top.contains(el),
    obscuredBy:
      top && top !== el && !el.contains(top) && !top.contains(el)
        ? top.tagName + '.' + top.className
        : undefined,
    focusVisible: el.matches(':focus-visible'),
    outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} off ${cs.outlineOffset}`,
    boxShadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.slice(0, 60),
    tabindex: el.getAttribute('tabindex'),
    inDialog: !!el.closest('dialog'),
  };
};

async function tabWalk(page, max = 120) {
  const seen = [];
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.activeElement?.blur();
  });
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(describeFocus);
    if (!f) break;
    seen.push(f);
    if (seen.length > 1 && seen[0].name === f.name && seen[0].top === f.top && i > 3) break;
  }
  return seen;
}

async function runKeys(browser, fixture) {
  const out = {};
  for (const width of WIDTHS) {
    const { context, page } = await newPage(browser, { width, height: 900 });
    await page.goto(`${MAIN}/`);
    await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
    const walk = await tabWalk(page, 160);
    out[`home-tab-walk@${width}`] = walk;
    const weak = walk.filter(
      (f) => f.outline.startsWith('none') && f.boxShadow === 'none' && !f.focusVisible,
    );
    console.log(
      `keys home@${width}: ${walk.length} stops; no visible indicator: ${weak.length}; obscured: ${walk.filter((f) => f.obscured).length}; offscreen: ${walk.filter((f) => !f.inView).length}; undersized(<24): ${walk.filter((f) => f.w < 24 || f.h < 24).length}`,
    );
    for (const f of walk) {
      const flags = [];
      if (f.outline.startsWith('none') && f.boxShadow === 'none') flags.push('NO-INDICATOR');
      if (f.obscured) flags.push(`OBSCURED-BY ${f.obscuredBy}`);
      if (!f.inView) flags.push('OFFSCREEN');
      if (f.w < 24 || f.h < 24) flags.push('SMALL');
      if (f.tabindex && Number(f.tabindex) > 0) flags.push('POSITIVE-TABINDEX');
      if (flags.length) console.log(`   ${f.tag}[${f.name}] ${f.w}x${f.h} ${flags.join(' ')}`);
    }
    await context.close();
  }

  // Dialog behavior with the keyboard only (1280).
  const { context, page } = await newPage(browser, { width: 1280 });
  const dlg = [];
  const check = async (label, fn) => {
    try {
      const r = await fn();
      dlg.push({ label, ...r });
      console.log(`keys dialog: ${label}: ${JSON.stringify(r)}`);
    } catch (e) {
      dlg.push({ label, error: String(e).slice(0, 200) });
      console.log(`keys dialog: ${label}: ERROR ${String(e).slice(0, 200)}`);
    }
  };
  const trap = async (selector, openerSel) => {
    await page.goto(`${MAIN}/`);
    await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
    return { selector, openerSel };
  };
  await check('resume: Enter on hero opener opens, focus inside', async () => {
    await trap();
    await page.locator('.hero [data-resume-open]').focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-resume-dialog]').waitFor({ state: 'visible' });
    const f = await page.evaluate(describeFocus);
    return { focus: f && f.name, inDialog: f && f.inDialog };
  });
  await check('resume: 12 Tab presses stay inside', async () => {
    const names = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(describeFocus);
      names.push(f ? `${f.inDialog ? 'in' : 'OUT'}:${f.name}` : 'body');
    }
    return { names };
  });
  await check('resume: 12 Shift+Tab presses stay inside', async () => {
    const names = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab');
      const f = await page.evaluate(describeFocus);
      names.push(f ? `${f.inDialog ? 'in' : 'OUT'}:${f.name}` : 'body');
    }
    return { names };
  });
  await check('resume: Escape closes and focus returns to the opener', async () => {
    await page.keyboard.press('Escape');
    const open = await page.locator('[data-resume-dialog]').evaluate((d) => d.open);
    const f = await page.evaluate(describeFocus);
    return { stillOpen: open, focus: f && f.name };
  });
  await check('demo: Enter opens; Tab x8 stays inside; Escape returns focus', async () => {
    await page.goto(`${MAIN}/`);
    await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
    const link = page.getByRole('link', { name: /try it here for FinCompress/ });
    await link.focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-demo-dialog]').waitFor({ state: 'visible' });
    const first = await page.evaluate(describeFocus);
    const names = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(describeFocus);
      names.push(f ? `${f.inDialog ? 'in' : 'OUT'}:${f.name}` : 'body');
    }
    await page.keyboard.press('Escape');
    const f = await page.evaluate(describeFocus);
    return { first: first && first.name, names, afterEscape: f && f.name };
  });
  await check('demo: Load button via Space, iframe focusable', async () => {
    await page.goto(`${MAIN}/`);
    await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
    await page.getByRole('link', { name: /try it here for FinCompress/ }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Load live demo' }).focus();
    await page.keyboard.press('Space');
    await page.locator('iframe').waitFor();
    const f = await page.evaluate(describeFocus);
    const title = await page.locator('iframe').getAttribute('title');
    return { focusAfterLoad: f && `${f.tag}:${f.name}`, iframeTitle: title };
  });
  await check('fit check by keyboard: sample, run, status, brief, close', async () => {
    await page.goto(`${MAIN}/`);
    await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
    await page.locator('[data-fit-sample]').first().focus();
    await page.keyboard.press('Enter');
    const pressed = await page.locator('[data-fit-sample]').first().getAttribute('aria-pressed');
    const ta = await page.locator('#fit-text').inputValue();
    await page.locator('[data-fit-run]').focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-fit-report]').waitFor({ state: 'visible' });
    const status = await page.locator('[data-fit-status]').textContent();
    const afterRun = await page.evaluate(describeFocus);
    await page.locator('[data-fit-brief-open]').focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-brief]').waitFor({ state: 'visible' });
    const inBrief = await page.evaluate(describeFocus);
    await page.keyboard.press('Escape');
    const back = await page.evaluate(describeFocus);
    return {
      samplePressed: pressed,
      textLen: ta.length,
      status: (status ?? '').slice(0, 80),
      focusAfterRun: afterRun && afterRun.name,
      briefFocus: inBrief && `${inBrief.inDialog ? 'in' : 'OUT'}:${inBrief.name}`,
      afterEscape: back && back.name,
    };
  });
  await check('skip link / bypass', async () => {
    await page.goto(`${MAIN}/`);
    const first = await tabWalk(page, 1);
    const landmarks = await page.evaluate(() =>
      [...document.querySelectorAll('header,nav,main,footer,[role=banner],[role=main]')].map(
        (e) => e.tagName,
      ),
    );
    return { firstStop: first[0] && first[0].name, landmarks };
  });
  out.dialogs = dlg;
  await context.close();

  // /for pages: tab walk.
  for (const [name, url] of [
    ['for-live', `${FOR}/for/${fixture.live}/`],
    ['for-expired', `${FOR}/for/${fixture.expired}/`],
    ['privacy', `${MAIN}/privacy/`],
    ['404', `${MAIN}/404.html`],
  ]) {
    const c = await newPage(browser, { width: 390 });
    await c.page.goto(url);
    const walk = await tabWalk(c.page, 60);
    out[`${name}-tab-walk@390`] = walk;
    console.log(
      `keys ${name}@390: ${walk.length} stops: ${walk.map((f) => `${f.tag}[${f.name}]${f.outline.startsWith('none') && f.boxShadow === 'none' ? ' NO-INDICATOR' : ''}`).join(' > ')}`,
    );
    await c.context.close();
  }
  writeFileSync(join(OUT, 'keys.json'), JSON.stringify(out, null, 2));
}

// ---- 3. reduced motion ----
const motionProbe = () => {
  const moving = [];
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const anim = cs.animationName !== 'none' && parseFloat(cs.animationDuration) > 0.011;
    const trans =
      cs.transitionProperty !== 'none' && cs.transitionProperty !== 'all'
        ? parseFloat(cs.transitionDuration) > 0.011
        : parseFloat(cs.transitionDuration) > 0.011;
    if (anim || trans)
      moving.push({
        el: `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`,
        anim: anim ? `${cs.animationName} ${cs.animationDuration}` : undefined,
        trans: trans ? `${cs.transitionProperty} ${cs.transitionDuration}` : undefined,
      });
  }
  return {
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    moving,
    animations: document.getAnimations().map((a) => a.id || a.constructor.name).length,
  };
};
async function runMotion(browser) {
  const out = {};
  for (const reduce of ['no-preference', 'reduce']) {
    const { context, page } = await newPage(browser, { reducedMotion: reduce });
    await page.goto(`${MAIN}/`);
    await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
    out[reduce] = { home: await page.evaluate(motionProbe) };
    for (const [name, open] of homeStates().filter(([n]) => /dialog|report/.test(n))) {
      await page.goto(`${MAIN}/`);
      await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
      await open(page);
      out[reduce][name] = await page.evaluate(motionProbe);
    }
    await context.close();
  }
  writeFileSync(join(OUT, 'motion.json'), JSON.stringify(out, null, 2));
  for (const [k, v] of Object.entries(out))
    for (const [s, p] of Object.entries(v))
      console.log(
        `motion ${k} ${s}: scroll-behavior=${p.scrollBehavior} moving=${p.moving.length} ${p.moving
          .slice(0, 4)
          .map((m) => `${m.el}(${m.anim ?? ''}${m.trans ?? ''})`)
          .join(' ')}`,
      );
}

// ---- 4. zoom: 200% = 640 CSS px wide, 400% = 320 CSS px wide (WCAG 1.4.4, 1.4.10) ----
const reflowProbe = () => {
  const doc = document.documentElement;
  const wide = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (el.closest('dialog:not([open])') || el.closest('[hidden]') || el.closest('.sr-only'))
      continue;
    if (r.right > innerWidth + 1) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' && r.right <= innerWidth + 1) continue;
      wide.push(
        `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} right=${Math.round(r.right)}`,
      );
    }
  }
  const clipped = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (el.closest('[hidden],dialog:not([open]),.sr-only')) continue;
    if (
      (cs.overflowX === 'hidden' || cs.overflowY === 'hidden') &&
      (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) &&
      el.clientHeight > 0
    )
      clipped.push(
        `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} sw=${el.scrollWidth}/${el.clientWidth} sh=${el.scrollHeight}/${el.clientHeight}`,
      );
  }
  return {
    hScroll: doc.scrollWidth > doc.clientWidth,
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    wideCount: wide.length,
    wide: wide.slice(0, 8),
    clipped: clipped.slice(0, 8),
  };
};
async function runZoom(browser, fixture) {
  const out = {};
  const sizes = [
    ['200pct', 640, 400],
    ['400pct', 320, 256],
  ];
  const states = [
    ['home', async () => {}],
    ...homeStates().filter(([n]) =>
      /resume-dialog-ml|demo-dialog-static|brief-dialog|fit-report$/.test(n),
    ),
  ];
  for (const [zname, w, h] of sizes) {
    for (const [name, open] of states) {
      const { context, page } = await newPage(browser, { width: w, height: h });
      await page.goto(`${MAIN}/`);
      await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
      await open(page);
      const r = await page.evaluate(reflowProbe);
      out[`${name}@${zname}`] = r;
      await page.screenshot({
        path: join(OUT, `zoom-${name}-${zname}.png`),
        fullPage: name === 'home' ? false : false,
      });
      console.log(
        `zoom ${name}@${zname}: hScroll=${r.hScroll} (${r.scrollWidth}/${r.clientWidth}) wide=${r.wideCount} ${r.wide.join(' ; ')} clipped=${r.clipped.join(' ; ')}`,
      );
      await context.close();
    }
    for (const [name, url] of [
      ['privacy', `${MAIN}/privacy/`],
      ['404', `${MAIN}/404.html`],
      ['for-live', `${FOR}/for/${fixture.live}/`],
    ]) {
      const { context, page } = await newPage(browser, { width: w, height: h });
      await page.goto(url);
      const r = await page.evaluate(reflowProbe);
      out[`${name}@${zname}`] = r;
      console.log(
        `zoom ${name}@${zname}: hScroll=${r.hScroll} (${r.scrollWidth}/${r.clientWidth}) wide=${r.wideCount} ${r.wide.join(' ; ')} clipped=${r.clipped.join(' ; ')}`,
      );
      await context.close();
    }
  }
  // Text resize only (1.4.4): root font-size raised to 200% at a 1280 viewport.
  const { context, page } = await newPage(browser, { width: 1280, height: 800 });
  await page.goto(`${MAIN}/`);
  await page.addStyleTag({ content: 'html{font-size:200% !important}' }).catch(() => {});
  const r = await page.evaluate(reflowProbe);
  out['home@text-200pct'] = r;
  console.log(`zoom home@text-200pct (style tag may be blocked by CSP): hScroll=${r.hScroll}`);
  await context.close();
  writeFileSync(join(OUT, 'zoom.json'), JSON.stringify(out, null, 2));
}

// ---- 5. forced colors ----
async function runForced(browser) {
  const out = {};
  for (const width of [390, 1280]) {
    for (const [name, open] of [
      ['home', async () => {}],
      ...homeStates().filter(([n]) =>
        /resume-dialog-ml|demo-dialog-static|brief-dialog|fit-report$/.test(n),
      ),
    ]) {
      const { context, page } = await newPage(browser, {
        width,
        height: 900,
        forcedColors: 'active',
      });
      await page.goto(`${MAIN}/`);
      await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
      await open(page);
      const probe = await page.evaluate(() => ({
        forced: matchMedia('(forced-colors: active)').matches,
        // Elements whose only visible boundary is a background or shadow: buttons and inputs with no border.
        noBorderControls: [
          ...document.querySelectorAll('button,input,textarea,select,summary,a.btn'),
        ]
          .filter((e) => e.getBoundingClientRect().width > 0)
          .filter((e) => {
            const cs = getComputedStyle(e);
            return parseFloat(cs.borderTopWidth) === 0 && cs.outlineStyle === 'none';
          })
          .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`)
          .slice(0, 12),
        svgOrImgWithoutAlt: [
          ...document.querySelectorAll('img:not([alt]),svg:not([aria-hidden="true"]):not([role])'),
        ].length,
      }));
      out[`${name}@${width}`] = probe;
      await page.screenshot({ path: join(OUT, `forced-${name}-${width}.png`), fullPage: false });
      const scan = await axeScan(page);
      out[`${name}@${width}`].axe = scan.violations;
      console.log(
        `forced ${name}@${width}: forced=${probe.forced} noBorderControls=${probe.noBorderControls.join(',')} axe=${scan.violations.map((v) => v.id).join(',')}`,
      );
      await context.close();
    }
  }
  writeFileSync(join(OUT, 'forced.json'), JSON.stringify(out, null, 2));
}

// ---- 6. accessibility tree text order ----
async function runTree(browser, fixture) {
  const pages = [
    ['home', `${MAIN}/`],
    ['privacy', `${MAIN}/privacy/`],
    ['404', `${MAIN}/404.html`],
    ['print-resume-ml', `${MAIN}/print/resume/ml/`],
    ['for-live', `${FOR}/for/${fixture.live}/`],
    ['for-expired', `${FOR}/for/${fixture.expired}/`],
  ];
  for (const [name, url] of pages) {
    const { context, page } = await newPage(browser, { width: 1280 });
    await page.goto(url);
    await page.locator('body').waitFor();
    if (name === 'home') await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
    writeFileSync(join(OUT, `tree-${name}.yml`), await page.locator('html').ariaSnapshot());
    await context.close();
  }
  for (const [name, open] of homeStates().filter(([n]) => /dialog|fit-report$/.test(n))) {
    const { context, page } = await newPage(browser, { width: 1280 });
    await page.goto(`${MAIN}/`);
    await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
    await open(page);
    writeFileSync(join(OUT, `tree-${name}.yml`), await page.locator('html').ariaSnapshot());
    await context.close();
  }
  console.log(`tree: snapshots written to ${OUT}`);
}

// ---- 7. targets and document-level checks ----
const docProbe = () => {
  const ids = {};
  for (const e of document.querySelectorAll('[id]')) ids[e.id] = (ids[e.id] ?? 0) + 1;
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
    .filter((h) => !h.closest('dialog:not([open])') && !h.closest('[hidden]'))
    .map((h) => `${h.tagName}:${h.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)}`);
  const small = [];
  for (const e of document.querySelectorAll(
    'a[href],button,summary,input,textarea,select,[role=tab]',
  )) {
    if (e.closest('[hidden],dialog:not([open])')) continue;
    const r = e.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const inline = getComputedStyle(e).display === 'inline' && e.tagName === 'A';
    if (r.width < 44 || r.height < 44)
      small.push({
        el: `${e.tagName.toLowerCase()}[${(e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30)}]`,
        w: Math.round(r.width),
        h: Math.round(r.height),
        inline,
      });
  }
  const spacing = (() => {
    const el = document.createElement('p');
    return !!el;
  })();
  return {
    lang: document.documentElement.lang,
    title: document.title,
    dupIds: Object.entries(ids)
      .filter(([, n]) => n > 1)
      .map(([k]) => k),
    headings: heads,
    h1Count: document.querySelectorAll('h1').length,
    imgsNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    emptyAlt: [...document.querySelectorAll('img')].filter((i) => i.getAttribute('alt') === '')
      .length,
    targetsUnder44: small,
    hasSkipLink: !!document.querySelector('a[href="#main"],a[href="#content"],.skip-link'),
    tabindexPositive: document.querySelectorAll(
      '[tabindex]:not([tabindex="0"]):not([tabindex="-1"])',
    ).length,
    ariaHiddenFocusable: [...document.querySelectorAll('[aria-hidden="true"]')].filter(
      (e) =>
        e.matches('a[href],button,input,[tabindex]') ||
        e.querySelector('a[href],button,input,[tabindex="0"]'),
    ).length,
    spacing,
  };
};
async function runTargets(browser, fixture) {
  const out = {};
  for (const width of [390, 1280]) {
    for (const [name, url] of [
      ['home', `${MAIN}/`],
      ['privacy', `${MAIN}/privacy/`],
      ['404', `${MAIN}/404.html`],
      ['for-live', `${FOR}/for/${fixture.live}/`],
      ['for-expired', `${FOR}/for/${fixture.expired}/`],
    ]) {
      const { context, page } = await newPage(browser, { width });
      await page.goto(url);
      if (name === 'home') await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
      const p = await page.evaluate(docProbe);
      out[`${name}@${width}`] = p;
      console.log(
        `doc ${name}@${width}: lang=${p.lang} title="${p.title}" h1=${p.h1Count} dupIds=${p.dupIds} skip=${p.hasSkipLink} under44=${p.targetsUnder44.length}`,
      );
      for (const t of p.targetsUnder44)
        console.log(`    ${t.el} ${t.w}x${t.h}${t.inline ? ' (inline link)' : ''}`);
      if (width === 1280) console.log(`    headings: ${p.headings.join(' | ')}`);
      await context.close();
    }
  }
  // Text spacing (1.4.12): apply the WCAG spacing values and look for clipping. The CSP blocks style tags, so
  // set inline style properties from a script run by Playwright (not a page script).
  const { context, page } = await newPage(browser, { width: 390, height: 900 });
  await page.goto(`${MAIN}/`);
  await page.locator('[data-fit-controls]').waitFor({ state: 'visible' });
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.setProperty('line-height', '1.5', 'important');
    root.style.setProperty('letter-spacing', '0.12em', 'important');
    root.style.setProperty('word-spacing', '0.16em', 'important');
    for (const p of document.querySelectorAll('p,li,h1,h2,h3,summary,a,button,span,label')) {
      p.style.setProperty('line-height', '1.5', 'important');
      p.style.setProperty('letter-spacing', '0.12em', 'important');
      p.style.setProperty('word-spacing', '0.16em', 'important');
      if (p.tagName === 'P') p.style.setProperty('margin-bottom', '2em', 'important');
    }
  });
  const sp = await page.evaluate(reflowProbe);
  await page.screenshot({ path: join(OUT, 'text-spacing-home-390.png') });
  out['text-spacing@390'] = sp;
  console.log(
    `text-spacing home@390: hScroll=${sp.hScroll} wide=${sp.wide.join(' ; ')} clipped=${sp.clipped.join(' ; ')}`,
  );
  await context.close();
  writeFileSync(join(OUT, 'targets.json'), JSON.stringify(out, null, 2));
}

// ---- main ----
const fixture = buildForFixture();
serve('dist', MAIN_PORT);
serve(fixture.dist, FOR_PORT);
try {
  await waitFor(`${MAIN}/`);
  await waitFor(`${FOR}/`);
  const browser = await chromium.launch();
  const run = {
    axe: runAxe,
    keys: runKeys,
    motion: runMotion,
    zoom: runZoom,
    forced: runForced,
    tree: runTree,
    targets: runTargets,
  };
  for (const [name, fn] of Object.entries(run)) {
    if (!ONLY.has(name)) continue;
    console.log(`--- ${name} ---`);
    await fn(browser, fixture);
  }
  await browser.close();
} finally {
  for (const s of servers) s.kill();
}
