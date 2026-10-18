// Self-test for .github/scripts/status.mjs (#183). Run: node --test .github/lint-fixtures/status.test.mjs
// No network: fetch is injected.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectLinks, buildStatus } from '../scripts/status.mjs';

const resume = {
  projects: [
    {
      links: [
        { url: 'https://github.com/Rohanjain2312/alpha' },
        { url: 'https://huggingface.co/spaces/rohanjain2312/alpha-demo' },
        { url: 'https://colab.research.google.com/drive/x' },
        { url: 'https://github.com/someoneelse/repo' },
        { url: 'https://github.com/Rohanjain2312/alpha' },
      ],
    },
    { links: [{ url: 'https://github.com/Rohanjain2312/beta' }] },
  ],
};

test('collectLinks keeps only own repos and Spaces, deduplicated and sorted', () => {
  assert.deepEqual(collectLinks(resume), {
    repos: ['alpha', 'beta'],
    demos: ['https://huggingface.co/spaces/rohanjain2312/alpha-demo'],
  });
});

const commit = (date) => ({ ok: true, json: async () => [{ commit: { committer: { date } } }] });
const isApi = (url) => new URL(url).hostname === 'api.github.com';
const now = new Date('2026-10-17T12:00:00Z');
const links = { repos: ['alpha', 'beta'], demos: ['https://huggingface.co/spaces/rohanjain2312/alpha-demo'] };

test('buildStatus takes the newest commit date and records demo state', async () => {
  const fetchFn = async (url) => {
    if (url.includes('/alpha/')) return commit('2026-10-01T10:00:00Z');
    if (url.includes('/beta/')) return commit('2026-10-09T23:59:00Z');
    return { ok: true };
  };
  assert.deepEqual(await buildStatus(links, fetchFn, now), {
    checkedAt: '2026-10-17',
    lastUpdated: '2026-10-09',
    demos: [{ url: links.demos[0], up: true, checkedAt: '2026-10-17' }],
  });
});

test('an unreachable or failing demo is up:false, not an error', async () => {
  for (const demo of [async () => ({ ok: false }), async () => Promise.reject(new Error('down'))]) {
    const fetchFn = async (url) => (isApi(url) ? commit('2026-10-01T00:00:00Z') : demo());
    const s = await buildStatus(links, fetchFn, now);
    assert.equal(s.demos[0].up, false);
  }
});

test('one repo failing is skipped; all failing throws', async () => {
  const some = async (url) => (url.includes('/alpha/') ? { ok: false, status: 403 } : isApi(url) ? commit('2026-10-05T00:00:00Z') : { ok: true });
  assert.equal((await buildStatus(links, some, now)).lastUpdated, '2026-10-05');
  const none = async (url) => (isApi(url) ? { ok: false, status: 500 } : { ok: true });
  await assert.rejects(buildStatus(links, none, now), /any featured repo/);
});

test('the token is sent to the GitHub API only', async () => {
  const seen = [];
  const fetchFn = async (url, opts) => {
    seen.push([url, opts.headers.authorization]);
    return isApi(url) ? commit('2026-10-05T00:00:00Z') : { ok: true };
  };
  await buildStatus(links, fetchFn, now, 'tok');
  for (const [url, auth] of seen) assert.equal(auth, isApi(url) ? 'Bearer tok' : undefined);
});
