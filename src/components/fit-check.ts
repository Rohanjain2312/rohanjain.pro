// The fit-check island (design spec 7.9 and 7.14). Bundled by Astro, so the CSP needs no inline script.
//
// What this file may do with visitor text (R-405, R-501, R-502):
// - read it from the fields, pass it to analyze(), and show strings through textContent only;
// - keep the last result in a variable, so the brief can be built from it;
// - nothing else. No fetch, no storage, no cookie, no element built from a string of markup.
import skillsJson from '../content/skills.json';
import { analyze, extras } from '../lib/fitcheck/index.ts';
import type { EvidenceItem, Report, RoleFamily, Skill } from '../lib/fitcheck/types.ts';
import {
  announcement,
  briefTitle,
  clampField,
  countsLine,
  counterText,
  fillSlots,
  gapLine,
  monthLabel,
  noteFor,
  tagLine,
  type BriefTitleCopy,
  type FitNotes,
} from './fit-view.ts';

/** Build-time data for the island, written by FitCheck.astro into `data-fit`. All of it is curated content. */
export type FitConfig = {
  name: string;
  cap: number;
  limits: { counterFrom: number; field: number; briefGaps: number; briefTags: number };
  counts: string;
  labels: { tags: string; linkFor: string };
  notes: FitNotes;
  brief: BriefTitleCopy & { gapsMore: string };
  evidence: EvidenceItem[];
  roles: Record<RoleFamily, string>;
};

const skills = skillsJson as unknown as readonly Skill[];

function pick<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`fit check: missing ${selector}`);
  return el;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Evidence links are curated https URLs. Anything else is dropped rather than linked. */
function safeHref(href: string | undefined): string | undefined {
  return href !== undefined && href.startsWith('https://') ? href : undefined;
}

function evidenceRow(
  row: Report['evidenceRows'][number],
  labels: FitConfig['labels'],
): HTMLLIElement {
  const li = el('li', 'evidence__row');
  const info = el('div', 'evidence__info');
  const name = el('p', 'evidence__name');
  const dot = el('span', '', '● ');
  dot.setAttribute('aria-hidden', 'true');
  name.append(dot, document.createTextNode(row.name));
  info.append(name, el('p', 'evidence__proof', row.proof));
  const href = safeHref(row.href);
  if (href && row.linkLabel) {
    const a = el('a', 'row__link', row.linkLabel);
    a.href = href;
    const context = el('span', 'sr-only', fillSlots(labels.linkFor, { name: row.name }));
    const arrow = el('span', '', ' ↗');
    arrow.setAttribute('aria-hidden', 'true');
    a.append(context, arrow);
    info.append(a);
  }
  const tags = el('ul', 'chips');
  tags.setAttribute('aria-label', fillSlots(labels.tags, { name: row.name }));
  for (const tag of row.tags) tags.append(el('li', 'chip', tag));
  li.append(info, tags);
  return li;
}

function init(root: HTMLElement): void {
  const cfg = JSON.parse(root.dataset['fit'] ?? '') as FitConfig;
  const { evidence } = cfg;

  const controls = pick<HTMLElement>(root, '[data-fit-controls]');
  const textarea = pick<HTMLTextAreaElement>(root, '[data-fit-text]');
  const counter = pick<HTMLElement>(root, '[data-fit-count]');
  const company = pick<HTMLInputElement>(root, '[data-fit-company]');
  const role = pick<HTMLInputElement>(root, '[data-fit-role]');
  const runButton = pick<HTMLButtonElement>(root, '[data-fit-run]');
  const sampleButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-fit-sample]'));
  const status = pick<HTMLElement>(root, '[data-fit-status]');
  const report = pick<HTMLElement>(root, '[data-fit-report]');
  const box = pick<HTMLElement>(root, '[data-fit-box]');
  const verdictEl = pick<HTMLElement>(root, '[data-fit-verdict]');
  const countsEl = pick<HTMLElement>(root, '[data-fit-counts]');
  const noteEl = pick<HTMLElement>(root, '[data-fit-note]');
  const rowsEl = pick<HTMLElement>(root, '[data-fit-rows]');
  const gapsEl = pick<HTMLElement>(root, '[data-fit-gaps]');
  const gapList = pick<HTMLElement>(root, '[data-fit-gap-list]');
  const actions = pick<HTMLElement>(root, '[data-fit-actions]');
  const openBrief = pick<HTMLButtonElement>(root, '[data-fit-brief-open]');

  // The brief dialog sits outside this section, at the end of the body.
  const dialog = pick<HTMLDialogElement>(document, '[data-brief]');
  const b = {
    date: pick<HTMLElement>(dialog, '[data-brief-date]'),
    title: pick<HTMLElement>(dialog, '[data-brief-title]'),
    verdict: pick<HTMLElement>(dialog, '[data-brief-verdict]'),
    counts: pick<HTMLElement>(dialog, '[data-brief-counts]'),
    summary: pick<HTMLElement>(dialog, '[data-brief-summary]'),
    evidence: pick<HTMLElement>(dialog, '[data-brief-evidence]'),
    rows: pick<HTMLElement>(dialog, '[data-brief-rows]'),
    gaps: pick<HTMLElement>(dialog, '[data-brief-gaps]'),
    gapLine: pick<HTMLElement>(dialog, '[data-brief-gap-line]'),
    print: pick<HTMLButtonElement>(dialog, '[data-brief-print]'),
    close: pick<HTMLButtonElement>(dialog, '[data-brief-close]'),
  };

  /** The last result, in memory only. The brief is built from it. */
  let last: { report: Report; company: string; roleTitle: string } | undefined;
  let opener: HTMLElement | null = null;
  let announceTimer: number | undefined;

  function showResult(r: Report): void {
    box.dataset['verdict'] = r.verdictKey;
    verdictEl.textContent = r.verdict;
    countsEl.textContent = countsLine(r, cfg.counts);
    noteEl.textContent = noteFor(r, cfg.notes);
    rowsEl.replaceChildren(...r.evidenceRows.map((row) => evidenceRow(row, cfg.labels)));
    rowsEl.hidden = r.evidenceRows.length === 0;
    gapList.replaceChildren(...r.gaps.map((g) => el('li', 'chip chip--gap', g)));
    gapsEl.hidden = r.gaps.length === 0;
    // A run with too little to go on shows the verdict box and note only (design spec 7.9).
    actions.hidden = !r.enough;
    report.hidden = false;
    // A live region that changes while it is being shown is not reliably read, so a separate status
    // line is cleared and then filled a moment later.
    status.textContent = '';
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => {
      status.textContent = announcement(r, cfg.counts);
    }, 50);
  }

  function run(): void {
    const text = clampField(textarea.value, cfg.cap);
    const result = analyze(text, skills, extras, evidence);
    last = {
      report: result,
      company: clampField(company.value.trim(), cfg.limits.field),
      roleTitle: clampField(role.value.trim(), cfg.limits.field),
    };
    showResult(result);
  }

  function updateCounter(): void {
    counter.textContent = counterText(textarea.value.length, cfg.cap, cfg.limits.counterFrom);
  }

  function setPressed(active: HTMLButtonElement | null): void {
    for (const s of sampleButtons) s.setAttribute('aria-pressed', String(s === active));
  }

  textarea.addEventListener('input', () => {
    if (textarea.value.length > cfg.cap) textarea.value = clampField(textarea.value, cfg.cap);
    updateCounter();
    setPressed(null);
  });
  for (const input of [company, role]) {
    input.addEventListener('input', () => {
      if (input.value.length > cfg.limits.field)
        input.value = clampField(input.value, cfg.limits.field);
    });
  }
  runButton.addEventListener('click', run);
  for (const s of sampleButtons) {
    s.addEventListener('click', () => {
      textarea.value = clampField(s.dataset['jd'] ?? '', cfg.cap);
      company.value = clampField(s.dataset['company'] ?? '', cfg.limits.field);
      role.value = clampField(s.dataset['title'] ?? '', cfg.limits.field);
      updateCounter();
      setPressed(s);
      run();
    });
  }

  function fillBrief(data: NonNullable<typeof last>): void {
    const r = data.report;
    b.date.textContent = monthLabel(new Date());
    b.title.textContent = briefTitle(cfg.name, data.roleTitle, data.company, cfg.brief);
    b.verdict.textContent = r.verdict;
    b.counts.textContent = countsLine(r, cfg.counts);
    b.summary.textContent = cfg.roles[r.roleFamily];
    b.rows.replaceChildren(
      ...r.evidenceRows.map((row) => {
        const li = el('li', 'sheet__row');
        li.append(
          el('strong', '', `${row.name}.`),
          document.createTextNode(` ${row.proof} `),
          el('span', 'sheet__tags', `(${tagLine(row.tags, cfg.limits.briefTags)})`),
        );
        return li;
      }),
    );
    b.evidence.hidden = r.evidenceRows.length === 0;
    b.gapLine.textContent = gapLine(r.gaps, cfg.limits.briefGaps, cfg.brief.gapsMore);
    b.gaps.hidden = r.gaps.length === 0;
  }

  openBrief.addEventListener('click', () => {
    if (!last?.report.enough) return;
    fillBrief(last);
    opener = openBrief;
    dialog.showModal();
  });
  b.close.addEventListener('click', () => dialog.close());
  b.print.addEventListener('click', () => window.print());
  // Escape and Close both end here. The browser restores focus too; this makes it certain.
  dialog.addEventListener('close', () => opener?.focus());

  controls.hidden = false;
}

const root = document.querySelector<HTMLElement>('[data-fit]');
if (root) init(root);
