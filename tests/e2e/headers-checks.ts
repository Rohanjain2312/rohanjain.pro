// Expectations for the security header test (R-505, issue #29).
// Source of truth: docs/spec/08-security.md 8.2 and docs/security/headers.md. These values are typed from
// the spec. They are never read from public/_headers, so a wrong _headers file cannot define its own pass.
//
// Phase 7 changes this file in the same PR that changes _headers:
//   - add Strict-Transport-Security (not required before Phase 7)
//   - add the Cloudflare Web Analytics origins to script-src and connect-src

export type HeaderMap = Record<string, string>;

/** Exact CSP from the spec. Each directive maps to its sorted source list. */
export const EXPECTED_CSP: Readonly<Record<string, readonly string[]>> = {
  'default-src': ["'none'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'frame-src': ['https://*.hf.space'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'none'"],
  'manifest-src': ["'self'"],
  'upgrade-insecure-requests': [],
};

/** Source expressions that R-505 and 8.2 forbid anywhere in the CSP. */
const FORBIDDEN_SOURCES: readonly RegExp[] = [
  /^'unsafe-inline'$/i,
  /^'unsafe-eval'$/i,
  /^'unsafe-hashes'$/i,
  /^'wasm-unsafe-eval'$/i,
  /^'(sha256|sha384|sha512)-/i,
  /^'nonce-/i,
  /^'strict-dynamic'$/i,
  /^\*$/,
];

/** Sent on every route (8.2). Lowercase names. */
export const COMMON_HEADERS: Readonly<Record<string, string>> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
};

export type RouteKind = 'home' | 'for' | 'print';

export interface Route {
  path: string;
  kind: RouteKind;
}

/** Bare and trailing-slash forms: `/for/*` does not match `/for` (headers.md). */
export const ROUTES: readonly Route[] = [
  { path: '/', kind: 'home' },
  { path: '/for', kind: 'for' },
  { path: '/for/', kind: 'for' },
  { path: '/for/acme', kind: 'for' },
  { path: '/for/acme/', kind: 'for' },
  { path: '/print', kind: 'print' },
  { path: '/print/', kind: 'print' },
  { path: '/print/resume', kind: 'print' },
  { path: '/print/resume/', kind: 'print' },
];

export function parseCsp(value: string): {
  directives: Map<string, string[]>;
  duplicates: string[];
} {
  const directives = new Map<string, string[]>();
  const duplicates: string[] = [];
  for (const part of value.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    const name = tokens.shift()?.toLowerCase();
    if (!name) continue;
    if (directives.has(name)) duplicates.push(name);
    else directives.set(name, tokens);
  }
  return { directives, duplicates };
}

const sorted = (xs: readonly string[]): string[] => [...xs].sort();

/** Returns one message per problem. Empty means the CSP matches the spec. */
export function checkCsp(value: string | undefined): string[] {
  if (value === undefined) return ['Content-Security-Policy is missing'];
  const problems: string[] = [];
  const { directives, duplicates } = parseCsp(value);
  for (const d of duplicates) problems.push(`CSP directive repeated: ${d}`);
  for (const [name, tokens] of directives) {
    for (const token of tokens) {
      if (FORBIDDEN_SOURCES.some((re) => re.test(token))) {
        problems.push(`CSP ${name} contains forbidden source ${token}`);
      }
    }
  }
  for (const [name, want] of Object.entries(EXPECTED_CSP)) {
    const got = directives.get(name);
    if (!got) problems.push(`CSP directive missing: ${name}`);
    else if (sorted(got).join(' ') !== sorted(want).join(' ')) {
      problems.push(`CSP ${name} is "${got.join(' ')}", expected "${want.join(' ')}"`);
    }
  }
  for (const name of directives.keys()) {
    if (!(name in EXPECTED_CSP)) problems.push(`CSP has unexpected directive: ${name}`);
  }
  return problems;
}

/** Headers a route must carry, beyond the CSP. */
export function expectedHeaders(kind: RouteKind): HeaderMap {
  const out: HeaderMap = { ...COMMON_HEADERS };
  if (kind === 'for' || kind === 'print') out['x-robots-tag'] = 'noindex, nofollow';
  if (kind === 'for') out['cache-control'] = 'no-store';
  return out;
}

/**
 * Checks one response's headers against the spec for its route kind.
 * `headers` must use lowercase names (Playwright's `response.headers()` does).
 */
export function checkRouteHeaders(kind: RouteKind, headers: HeaderMap): string[] {
  const problems = checkCsp(headers['content-security-policy']);
  for (const [name, want] of Object.entries(expectedHeaders(kind))) {
    const got = headers[name];
    if (got === undefined) problems.push(`${name} is missing`);
    else if (got !== want) problems.push(`${name} is "${got}", expected "${want}"`);
  }
  if (kind === 'home' && headers['x-robots-tag'] !== undefined) {
    problems.push(
      `home page must stay indexable but sends x-robots-tag: ${headers['x-robots-tag']}`,
    );
  }
  return problems;
}

// ---- Inline code in the build output (R-505, ADR-0015 item 5, headers.md "Inline rule") ----

export interface Tag {
  name: string;
  attrs: Map<string, string>;
  raw: string;
}

const isSpace = (c: string | undefined): boolean =>
  c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';
const isLetter = (c: string | undefined): boolean => c !== undefined && /^[a-zA-Z]$/.test(c);

/**
 * Minimal HTML tag scanner. Skips comments and the text inside script and style elements, honours quoted
 * attribute values that contain `>`, and lower-cases names. Hand-written so no regex can backtrack.
 */
export function* scanTags(html: string): Generator<Tag> {
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt < 0) return;
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      if (end < 0) return;
      i = end + 3;
      continue;
    }
    if (!isLetter(html[lt + 1])) {
      i = lt + 1;
      continue;
    }
    let p = lt + 1;
    while (p < html.length && !isSpace(html[p]) && html[p] !== '>' && html[p] !== '/') p++;
    const name = html.slice(lt + 1, p).toLowerCase();
    const attrs = new Map<string, string>();
    while (p < html.length && html[p] !== '>') {
      if (isSpace(html[p]) || html[p] === '/') {
        p++;
        continue;
      }
      const nameStart = p;
      while (p < html.length && !isSpace(html[p]) && !'=>/'.includes(html[p] ?? '')) p++;
      const attr = html.slice(nameStart, p).toLowerCase();
      while (isSpace(html[p])) p++;
      let value = '';
      if (html[p] === '=') {
        p++;
        while (isSpace(html[p])) p++;
        const q = html[p];
        if (q === '"' || q === "'") {
          const end = html.indexOf(q, p + 1);
          const stop = end < 0 ? html.length : end;
          value = html.slice(p + 1, stop);
          p = stop + 1;
        } else {
          const valueStart = p;
          while (p < html.length && !isSpace(html[p]) && html[p] !== '>') p++;
          value = html.slice(valueStart, p);
        }
      }
      if (attr) attrs.set(attr, value);
    }
    const raw = html.slice(lt, p + 1);
    yield { name, attrs, raw };
    i = p + 1;
    if (name === 'script' || name === 'style') {
      const close = html.toLowerCase().indexOf(`</${name}`, i);
      i = close < 0 ? html.length : close;
    }
  }
}

/**
 * Lists inline code in one HTML document: any `<style>`, any `style=` attribute, any inline `on*=` handler,
 * any `javascript:` URL, and any `<script>` without `src` other than JSON-LD (`application/ld+json`).
 */
export function findInlineCode(html: string): string[] {
  const problems: string[] = [];
  for (const { name, attrs, raw } of scanTags(html)) {
    const where = raw.length > 80 ? `${raw.slice(0, 80)}...` : raw;
    if (name === 'style') problems.push(`inline <style>: ${where}`);
    if (name === 'script' && !attrs.has('src')) {
      const type = (attrs.get('type') ?? '').trim().toLowerCase();
      if (type !== 'application/ld+json') problems.push(`inline <script>: ${where}`);
    }
    for (const [attr, value] of attrs) {
      if (attr === 'style') problems.push(`style attribute on <${name}>: ${where}`);
      else if (/^on[a-z]+$/.test(attr))
        problems.push(`inline event handler ${attr} on <${name}>: ${where}`);
      else if (/^\s*javascript:/i.test(value))
        problems.push(`javascript: URL in ${attr} on <${name}>: ${where}`);
    }
  }
  return problems;
}
