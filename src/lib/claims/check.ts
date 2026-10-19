// Truthfulness check (R-301): every number in visible page text must map to claims.json.
// Pure functions. scripts/check-claims.ts does the file reading.

export type ClaimLike = { value: number | string; display: string };
export type AllowEntry = { page: string; number: string; reason: string };
export type Finding = { page: string; number: string; near: string };

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '-',
  mdash: '-',
  times: 'x',
  rarr: '->',
  copy: '©',
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code =
        e[1]?.toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const BLOCK_TAGS =
  /<\/?(?:address|article|aside|blockquote|br|dd|div|dl|dt|figcaption|figure|footer|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|td|th|tr|ul)\b[^>]*>/i;
// Attribute values a visitor can read. Quoted or unquoted. `value` is handled apart (see attrTexts).
const ATTR_TEXT =
  /\s(alt|aria-label|title|placeholder|value)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
// `value` is visible text only on these tags, and not for choice or hidden input types.
const VALUE_TAG = /^<(?:input|button)\b/i;
const VALUE_HIDDEN_TYPE = /\stype\s*=\s*["']?(?:radio|checkbox|hidden|range|color|file|image)\b/i;

/** Strip until the text stops changing, so "<!<!---->--" cannot leave a comment behind. */
function stripRepeated(
  s: string,
  re: RegExp,
  replacer: (match: string) => string = () => '',
): string {
  let prev: string;
  let cur = s;
  do {
    prev = cur;
    cur = cur.replace(re, replacer);
  } while (cur !== prev);
  return cur;
}

function attrTexts(tag: string): string[] {
  const out: string[] = [];
  for (const m of tag.matchAll(ATTR_TEXT)) {
    if (m[1]?.toLowerCase() === 'value' && (!VALUE_TAG.test(tag) || VALUE_HIDDEN_TYPE.test(tag)))
      continue;
    out.push(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}

// Private-use markers wrap the content of <time> elements so the date check can see them.
const TIME_OPEN = '\uE000';
const TIME_CLOSE = '\uE001';

/**
 * Text a visitor can read: body text nodes, noscript text, the page title, and alt, aria-label, title,
 * placeholder and value attribute values. Skips script, style, template, comments and the rest of head.
 */
export function visibleText(html: string): string {
  let s = stripRepeated(html, /<!--[\s\S]*?-->/g);
  const title = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(s)?.[1];
  s = s.replace(/<head\b[\s\S]*?<\/head>/gi, '');
  if (title !== undefined) s = `<p>${title}</p>${s}`;
  s = stripRepeated(s, /<(script|style|template)\b[\s\S]*?<\/\1\s*>/gi);
  s = s.replace(/<time\b[^>]*>([\s\S]*?)<\/time\s*>/gi, `${TIME_OPEN}$1${TIME_CLOSE}`);
  s = stripRepeated(s, /<[^>]*>/g, (tag) => {
    if (/\stype\s*=\s*["']?hidden\b/i.test(tag)) return '';
    const attrs = attrTexts(tag);
    const sep = BLOCK_TAGS.test(tag) ? '\n' : '';
    return sep + (attrs.length ? ` ${attrs.join(' ')} ` : '');
  });
  return decodeEntities(s).replace(/[ \t\r\f\v]+/g, ' ');
}

// A number is digits with optional thousands commas and decimals. It must not touch a letter, digit,
// underscore or "@" before it, so "S3", "v2" and "rohanjain2312" are names, not numbers.
// Two prefixes stay part of the number: a lone "x" ("x73", a multiplier) and a leading dot (".73").
const NUMBER = /(?<![\p{L}\p{N}_@.])(?:[xX](?=\d)|\.(?=\d))?\d[\d,]*\.?\d*/gu;

export type Found = { raw: string; index: number };

export function extractNumbers(text: string): Found[] {
  const out: Found[] = [];
  for (const m of text.matchAll(NUMBER)) {
    const raw = m[0].replace(/[.,]+$/, '');
    out.push({ raw, index: m.index });
  }
  return out;
}

const canon = (raw: string): string => String(Number(raw.replace(/^[xX]/, '').replace(/,/g, '')));

// Month names and abbreviations, written out in each pattern so the regexes stay literal.
const DATE_BEFORE = [
  /\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\.?\s*$/i,
  /\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\.?\s*\d{1,2}(?:st|nd|rd|th)?,?\s*$/i,
  /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\.?,?\s*$/i,
  /\d{1,2}[/.-]\d{1,2}[/.-]$/,
  /\bQ[1-4]\s*$/i,
  /\bFY\s*$/i,
  /(?:©|\(c\)|copyright)\s*$/i,
];
const DATE_AFTER = [/^-\d\d(?!\d)/, /^-\d\d-\d\d(?!\d)/, /^[/.-]\d{1,2}[/.-]\d{1,2}(?!\d)/];

const DATE_SPANS = [
  /\d{4}-\d\d-\d\d(?!\d)/g,
  /\d{4}-\d\d(?!\d)/g,
  /\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}(?!\d)/g,
  /\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\.?\s+\d{1,2}(?:st|nd|rd|th)?(?!\d)/gi,
  /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b/gi,
];

/** True when the occurrence sits inside a written or numeric date such as "September 15, 2026" or "2026-10-16". */
function inDateSpan(text: string, f: Found): boolean {
  for (const re of DATE_SPANS)
    for (const m of text.matchAll(re)) {
      if (f.index >= m.index && f.index < m.index + m[0].length) return true;
    }
  return false;
}

/** A number from 1900 to 2099 is a year only in date context: a <time> element, a month name, a numeric date, a quarter or a copyright mark. */
function isYear(text: string, f: Found): boolean {
  if (!/^(19|20)\d{2}$/.test(f.raw)) return false;
  const before = text.slice(Math.max(0, f.index - 24), f.index);
  const after = text.slice(f.index + f.raw.length, f.index + f.raw.length + 24);
  const open = before.lastIndexOf(TIME_OPEN);
  if (open >= 0 && before.indexOf(TIME_CLOSE, open) < 0) return true;
  const clean = before.replace(/[\uE000\uE001]/g, '');
  // "Served March 2000 customers": a month then a number then a plural noun is a count, not a year.
  if (DATE_BEFORE[0]?.test(clean) && /^\s+[a-z]{3,}s\b/i.test(after)) return false;
  return DATE_BEFORE.some((r) => r.test(clean)) || DATE_AFTER.some((r) => r.test(after));
}

/** Set of canonical numbers that appear in claim values and displays, plus extra text such as the phone number. */
export function claimNumbers(claims: ClaimLike[], extraText: string[] = []): Set<string> {
  const set = new Set<string>();
  const texts = [...claims.flatMap((c) => [String(c.value), c.display]), ...extraText];
  for (const t of texts) for (const f of extractNumbers(t)) set.add(canon(f.raw));
  return set;
}

const STOP = new Set(['with', 'from', 'that', 'this', 'than', 'over', 'into', 'across', 'about']);
const norm = (s: string): string => s.replace(/\s+/g, ' ').trim().toLowerCase();

type Entry = { display: string; stems: string[] };

/** Claims keyed by canonical number, so each occurrence can be matched to a claim that mentions it. */
export type ClaimIndex = { byNumber: Map<string, Entry[]>; global: Set<string> };

/** Extra text such as the phone number is allowed anywhere. */
export function buildClaimIndex(claims: ClaimLike[], extraText: string[] = []): ClaimIndex {
  const byNumber = new Map<string, Entry[]>();
  for (const c of claims) {
    const display = norm(c.display);
    const words = display.match(/\p{L}{4,}/gu) ?? [];
    const stems = [...new Set(words.filter((w) => !STOP.has(w)).map((w) => w.slice(0, 5)))];
    const entry: Entry = { display, stems };
    for (const t of [String(c.value), c.display])
      for (const f of extractNumbers(t)) {
        const k = canon(f.raw);
        const list = byNumber.get(k) ?? [];
        if (!list.includes(entry)) list.push(entry);
        byNumber.set(k, list);
      }
  }
  return { byNumber, global: claimNumbers([], extraText) };
}

const RADIUS = 60;

function occurrenceClaimed(lower: string, f: Found, entries: Entry[]): boolean {
  const win = lower.slice(Math.max(0, f.index - RADIUS), f.index + f.raw.length + RADIUS);
  for (const e of entries) {
    if (e.display) {
      for (let at = lower.indexOf(e.display); at >= 0; at = lower.indexOf(e.display, at + 1)) {
        if (at <= f.index && f.index < at + e.display.length) return true;
      }
    }
    if (e.stems.some((st) => win.includes(st))) return true;
  }
  return false;
}

export function nearestText(text: string, index: number, length: number, radius = 40): string {
  const from = Math.max(0, index - radius);
  const to = Math.min(text.length, index + length + radius);
  return text.slice(from, to).replace(/\s+/g, ' ').trim();
}

/**
 * Checks each number occurrence in the visible text. With a ClaimIndex, a number passes only if a claim that
 * contains it has its display text, or one of its words, within 60 characters. With a plain Set, any
 * claimed number passes anywhere. Years pass only in date context. Allowlist entries pass per page.
 */
export function checkHtml(
  page: string,
  html: string,
  allowed: Set<string> | ClaimIndex,
  allowlist: AllowEntry[] = [],
): Finding[] {
  const text = visibleText(html).replace(/\s+/g, ' ');
  const lowered = text.toLowerCase();
  const lower = lowered.length === text.length ? lowered : text;
  const skip = new Set(allowlist.filter((a) => a.page === page).map((a) => canon(a.number)));
  const out: Finding[] = [];
  for (const f of extractNumbers(text)) {
    const key = canon(f.raw);
    if (isYear(text, f) || inDateSpan(text, f) || skip.has(key)) continue;
    if (allowed instanceof Set) {
      if (allowed.has(key)) continue;
    } else if (
      allowed.global.has(key) ||
      occurrenceClaimed(lower, f, allowed.byNumber.get(key) ?? [])
    ) {
      continue;
    }
    const near = nearestText(text, f.index, f.raw.length).replace(/[\uE000\uE001]/g, '');
    out.push({ page, number: f.raw, near });
  }
  return out;
}

/** Page name for a built file path relative to dist: "index.html" is "/", "a/index.html" is "/a/", "404.html" is "/404". */
export function pageName(relPath: string): string {
  const p = '/' + relPath.split('\\').join('/');
  if (p === '/index.html') return '/';
  if (p.endsWith('/index.html')) return p.slice(0, -'index.html'.length);
  return p.replace(/\.html$/, '');
}

export function formatFinding(f: Finding): string {
  return `R-301 ${f.page}: number "${f.number}" has no claim in claims.json. Near: "${f.near}"`;
}
