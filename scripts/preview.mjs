// Usage: node scripts/preview.mjs [--port 4321] [--dir dist] [--gzip] [--no-upgrade]
// --gzip compresses text responses when the client accepts it, as Cloudflare Pages does (Lighthouse runs).
// --no-upgrade removes only the `upgrade-insecure-requests` CSP directive. WebKit upgrades http://localhost
// subresources to https under it and the preview cannot serve https. Use it for WebKit test runs only.
// Static preview of the build with headers from `_headers` applied per route (N-10, 8.2).
// `_headers` is the only source of header values. Reads <dir>/_headers, then public/_headers.
import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync, createReadStream } from 'node:fs';
import { extname, join, posix, resolve } from 'node:path';
import { createGzip } from 'node:zlib';
import { fileURLToPath } from 'node:url';

/**
 * Parse Cloudflare `_headers` text. Unindented lines are path patterns;
 * indented `Name: value` lines belong to the last pattern.
 * @param {string} text
 * @returns {{ pattern: string, headers: [string, string][] }[]}
 */
export function parseHeaders(text) {
  const rules = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    if (raw.trim() === '' || raw.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      current = { pattern: raw.trim(), headers: [] };
      rules.push(current);
      continue;
    }
    const line = raw.trim();
    const i = line.indexOf(':');
    if (!current || i <= 0) continue;
    current.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
  }
  return rules;
}

function toRegExp(pattern) {
  const path = pattern.replace(/^https?:\/\/[^/]+/, '');
  let src = '';
  for (const part of path.split(/(\*|:[A-Za-z]\w*)/)) {
    if (part === '*') src += '.*';
    else if (part.startsWith(':') && part.length > 1) src += '[^/]+';
    else src += part.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${src}$`);
}

/**
 * Headers for a URL path. All matching rules apply; repeated names are joined with ", ".
 * @param {{ pattern: string, headers: [string, string][] }[]} rules
 * @param {string} pathname
 * @returns {[string, string][]}
 */
export function headersFor(rules, pathname) {
  const out = new Map();
  for (const rule of rules) {
    if (!toRegExp(rule.pattern).test(pathname)) continue;
    for (const [name, value] of rule.headers) {
      const key = name.toLowerCase();
      const prev = out.get(key);
      out.set(key, [name, prev ? `${prev[1]}, ${value}` : value]);
    }
  }
  return [...out.values()];
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};
const isFile = (p) => existsSync(p) && statSync(p).isFile();

/**
 * One canonical path for header matching and file lookup: decoded once, normalized.
 * Returns null for malformed escapes, encoded slashes, backslashes, NUL, or traversal.
 * @param {string} rawPathname
 * @returns {string | null}
 */
export function canonicalPath(rawPathname) {
  if (/%(2f|5c|00)/i.test(rawPathname)) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(rawPathname);
  } catch {
    return null;
  }
  if (decoded.includes('\\') || decoded.includes('\0')) return null;
  if (decoded.split('/').includes('..')) return null;
  const norm = posix.normalize(decoded);
  if (!norm.startsWith('/') || norm.split('/').includes('..')) return null;
  return norm;
}

/**
 * Case-sensitive lookup of a canonical path under dir, even on case-insensitive filesystems.
 * @param {string} dir
 * @param {string} canonical
 * @returns {string | null}
 */
export function lookupFile(dir, canonical) {
  const segs = canonical.split('/').filter(Boolean);
  let cur = dir;
  for (let i = 0; i < segs.length; i++) {
    const seg = /** @type {string} */ (segs[i]);
    const names = readdirSync(cur);
    const last = i === segs.length - 1;
    if (names.includes(seg)) {
      const next = join(cur, seg);
      if (!last) {
        if (!statSync(next).isDirectory()) return null;
        cur = next;
        continue;
      }
      if (isFile(next)) return next;
      if (isFile(join(next, 'index.html'))) return join(next, 'index.html');
    }
    if (last && names.includes(`${seg}.html`) && isFile(join(cur, `${seg}.html`))) {
      return join(cur, `${seg}.html`);
    }
    return null;
  }
  return isFile(join(cur, 'index.html')) ? join(cur, 'index.html') : null;
}

function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => (args.indexOf(n) >= 0 ? args[args.indexOf(n) + 1] : d);
  const dir = resolve(opt('--dir', 'dist'));
  const port = Number(opt('--port', '4321'));
  const gzip = args.includes('--gzip');
  const noUpgrade = args.includes('--no-upgrade');
  if (!existsSync(dir)) {
    console.error(`preview: ${dir} not found. Run "npm run build" first.`);
    process.exit(1);
  }
  const file = [join(dir, '_headers'), resolve('public/_headers')].find(existsSync);
  const rules = file ? parseHeaders(readFileSync(file, 'utf8')) : [];
  console.log(file ? `preview: headers from ${file}` : 'preview: no _headers file found');

  createServer((req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
    const canonical = canonicalPath(pathname);
    let target = null;
    try {
      target = canonical ? lookupFile(dir, canonical) : null;
    } catch {
      target = null;
    }
    const notFound = !target;
    if (notFound) target = [join(dir, '404.html')].find(isFile) ?? null;
    if (canonical) {
      for (const [k, v] of headersFor(rules, canonical)) {
        const value =
          noUpgrade && k.toLowerCase() === 'content-security-policy'
            ? v.replace(/;?\s*upgrade-insecure-requests/, '')
            : v;
        res.setHeader(k, value);
      }
    }
    res.statusCode = notFound ? 404 : 200;
    res.setHeader('Content-Type', types[extname(target ?? '')] ?? 'application/octet-stream');
    if (!target) return res.end('Not found');
    if (req.method === 'HEAD') return res.end();
    const stream = createReadStream(target);
    stream.on('error', () => res.destroy());
    const type = String(res.getHeader('Content-Type'));
    if (gzip && /text|json|javascript|svg|xml/.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      stream.pipe(createGzip()).pipe(res);
      return;
    }
    stream.pipe(res);
  }).listen(port, '127.0.0.1', () => console.log(`preview: http://localhost:${port}/`));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
