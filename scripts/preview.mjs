// Usage: node scripts/preview.mjs [--port 4321] [--dir dist]
// Static preview of the build with headers from `_headers` applied per route (N-10, 8.2).
// `_headers` is the only source of header values. Reads <dir>/_headers, then public/_headers.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync, createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
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

function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => (args.indexOf(n) >= 0 ? args[args.indexOf(n) + 1] : d);
  const dir = resolve(opt('--dir', 'dist'));
  const port = Number(opt('--port', '4321'));
  if (!existsSync(dir)) {
    console.error(`preview: ${dir} not found. Run "npm run build" first.`);
    process.exit(1);
  }
  const file = [join(dir, '_headers'), resolve('public/_headers')].find(existsSync);
  const rules = file ? parseHeaders(readFileSync(file, 'utf8')) : [];
  console.log(file ? `preview: headers from ${file}` : 'preview: no _headers file found');

  const resolveFile = (pathname) => {
    const rel = normalize(decodeURIComponent(pathname)).replace(/^([/\\]|\.\.[/\\])+/, '');
    const base = join(dir, rel);
    if (!base.startsWith(dir)) return null;
    return [base, join(base, 'index.html'), `${base}.html`].find(isFile) ?? null;
  };

  createServer((req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
    let target = null;
    try {
      target = resolveFile(pathname);
    } catch {
      target = null;
    }
    const notFound = !target;
    if (notFound) target = [join(dir, '404.html')].find(isFile) ?? null;
    for (const [k, v] of headersFor(rules, pathname)) res.setHeader(k, v);
    res.statusCode = notFound ? 404 : 200;
    res.setHeader('Content-Type', types[extname(target ?? '')] ?? 'application/octet-stream');
    if (!target) return res.end('Not found');
    if (req.method === 'HEAD') return res.end();
    createReadStream(target).pipe(res);
  }).listen(port, () => console.log(`preview: http://localhost:${port}/`));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
