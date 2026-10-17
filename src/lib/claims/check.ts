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
const ATTR_TEXT = /\s(?:alt|aria-label)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

/** Text a visitor can read: body text nodes plus alt and aria-label values. Skips head, script, style, template and comments. */
export function visibleText(html: string): string {
  let s = html.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<head\b[\s\S]*?<\/head>/gi, '');
  s = s.replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<[^>]*>/g, (tag) => {
    const attrs: string[] = [];
    for (const m of tag.matchAll(ATTR_TEXT)) attrs.push(m[1] ?? m[2] ?? '');
    const sep = BLOCK_TAGS.test(tag) ? '\n' : '';
    return sep + (attrs.length ? ` ${attrs.join(' ')} ` : '');
  });
  return decodeEntities(s).replace(/[ \t\r\f\v]+/g, ' ');
}

// A number is digits with optional thousands commas and decimals. It must not touch a letter, digit,
// underscore or "@" before it, so "S3", "v2" and "rohanjain2312" are names, not numbers.
const NUMBER = /(?<![\p{L}\p{N}_@.])\d[\d,]*\.?\d*/gu;

export type Found = { raw: string; index: number };

export function extractNumbers(text: string): Found[] {
  const out: Found[] = [];
  for (const m of text.matchAll(NUMBER)) {
    const raw = m[0].replace(/[.,]+$/, '');
    out.push({ raw, index: m.index });
  }
  return out;
}

const canon = (raw: string): string => String(Number(raw.replace(/,/g, '')));

/** Years such as 2026 are dates, not claims. */
const isYear = (raw: string): boolean => /^(19|20)\d{2}$/.test(raw);

/** Set of canonical numbers that appear in claim values and displays, plus extra text such as the phone number. */
export function claimNumbers(claims: ClaimLike[], extraText: string[] = []): Set<string> {
  const set = new Set<string>();
  const texts = [...claims.flatMap((c) => [String(c.value), c.display]), ...extraText];
  for (const t of texts) for (const f of extractNumbers(t)) set.add(canon(f.raw));
  return set;
}

export function nearestText(text: string, index: number, length: number, radius = 40): string {
  const from = Math.max(0, index - radius);
  const to = Math.min(text.length, index + length + radius);
  return text.slice(from, to).replace(/\s+/g, ' ').trim();
}

export function checkHtml(
  page: string,
  html: string,
  allowed: Set<string>,
  allowlist: AllowEntry[] = [],
): Finding[] {
  const text = visibleText(html);
  const skip = new Set(allowlist.filter((a) => a.page === page).map((a) => canon(a.number)));
  const out: Finding[] = [];
  for (const f of extractNumbers(text)) {
    if (isYear(f.raw) || allowed.has(canon(f.raw)) || skip.has(canon(f.raw))) continue;
    out.push({ page, number: f.raw, near: nearestText(text, f.index, f.raw.length) });
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
