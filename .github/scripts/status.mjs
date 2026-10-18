#!/usr/bin/env node
// Builds public/status.json for the footer (F-10, docs/spec/06-architecture.md 5.7).
// Usage: node .github/scripts/status.mjs [--out FILE]
// Reads featured repos and demo URLs from src/content/resume.json (no second list to keep in sync).
// Public endpoints only. GITHUB_TOKEN, when set, is used only to raise the API rate limit.
// Shape: { checkedAt, lastUpdated, demos: [{ url, up, checkedAt }] }, dates as YYYY-MM-DD (UTC).
// A demo that cannot be reached is recorded as up:false. A repo whose date cannot be read is skipped.
// If no repo date can be read, the script fails, so a broken run never overwrites good data.
import { readFileSync, writeFileSync } from 'node:fs';

const GH_REPO = /^https:\/\/github\.com\/Rohanjain2312\/([A-Za-z0-9._-]+)$/;
const HF_SPACE = /^https:\/\/huggingface\.co\/spaces\/rohanjain2312\/[A-Za-z0-9._-]+$/;
const day = (d) => new Date(d).toISOString().slice(0, 10);

export function collectLinks(resume) {
  const urls = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      if (typeof v.url === 'string') urls.add(v.url);
      Object.values(v).forEach(walk);
    }
  };
  walk(resume);
  const all = [...urls].sort();
  return {
    repos: all.filter((u) => GH_REPO.test(u)).map((u) => u.match(GH_REPO)[1]),
    demos: all.filter((u) => HF_SPACE.test(u)),
  };
}

export async function buildStatus({ repos, demos }, fetchFn = fetch, now = new Date(), token = '') {
  const checkedAt = day(now);
  const headers = { 'user-agent': 'rohanjain.pro-status', accept: 'application/vnd.github+json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const dates = [];
  for (const name of repos) {
    try {
      const res = await fetchFn(
        `https://api.github.com/repos/Rohanjain2312/${name}/commits?per_page=1`,
        { headers, signal: AbortSignal.timeout(15000) },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const [c] = await res.json();
      dates.push(day(c.commit.committer.date));
    } catch (e) {
      console.warn(`warn: no commit date for ${name}: ${e.message}`);
    }
  }
  if (!dates.length) throw new Error('could not read a commit date for any featured repo');
  const out = [];
  for (const url of demos) {
    let up = false;
    try {
      const res = await fetchFn(url, {
        headers: { 'user-agent': headers['user-agent'] },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      up = res.ok;
    } catch (e) {
      console.warn(`warn: demo unreachable ${url}: ${e.message}`);
    }
    out.push({ url, up, checkedAt });
  }
  return { checkedAt, lastUpdated: dates.sort().at(-1), demos: out };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--out');
  const outFile = i > 0 ? process.argv[i + 1] : 'public/status.json';
  const resume = JSON.parse(readFileSync('src/content/resume.json', 'utf8'));
  const links = collectLinks(resume);
  if (!links.repos.length) throw new Error('no featured repos found in src/content/resume.json');
  const status = await buildStatus(links, fetch, new Date(), process.env.GITHUB_TOKEN || '');
  writeFileSync(outFile, JSON.stringify(status, null, 2) + '\n');
  console.log(`wrote ${outFile}: ${JSON.stringify(status)}`);
}
