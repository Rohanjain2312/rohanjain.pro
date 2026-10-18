// Footer status and demo helpers. Pure functions: status.json is read by data.ts, checked here.
import { MONTHS } from './lib.ts';

export type DemoStatus = { url: string; up: boolean; checkedAt: string };
export type Status = { checkedAt: string; lastUpdated: string; demos: DemoStatus[] };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Checks the shape of status.json (docs/spec/06-architecture.md 5.7). Anything else counts as no status. */
export function parseStatus(raw: unknown): Status | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const checkedAt = r['checkedAt'];
  const lastUpdated = r['lastUpdated'];
  if (typeof checkedAt !== 'string' || !DAY.test(checkedAt)) return undefined;
  if (typeof lastUpdated !== 'string' || !DAY.test(lastUpdated)) return undefined;
  if (!Array.isArray(r['demos'])) return undefined;
  const demos: DemoStatus[] = [];
  for (const d of r['demos'] as unknown[]) {
    if (!d || typeof d !== 'object') return undefined;
    const x = d as Record<string, unknown>;
    const url = x['url'];
    const up = x['up'];
    const at = x['checkedAt'];
    if (typeof url !== 'string' || typeof up !== 'boolean') return undefined;
    if (typeof at !== 'string' || !DAY.test(at)) return undefined;
    demos.push({ url, up, checkedAt: at });
  }
  return { checkedAt, lastUpdated, demos };
}

/** "2026-10-17" becomes "Oct 17, 2026". */
export function dayLabel(iso: string): string {
  if (!DAY.test(iso)) throw new Error(`Not a YYYY-MM-DD date: "${iso}".`);
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/**
 * Embed address of a Hugging Face Space. "https://huggingface.co/spaces/owner/Name_x" becomes
 * "https://owner-name-x.hf.space" (lowercase; "_" and "." turn into "-"). Anything else gives undefined.
 */
export function embedUrl(spaceUrl: string): string | undefined {
  const m = /^https:\/\/huggingface\.co\/spaces\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?$/.exec(
    spaceUrl,
  );
  if (!m) return undefined;
  const host = `${m[1]}-${m[2]}`.toLowerCase().replace(/[_.]/g, '-');
  return `https://${host}.hf.space`;
}

/** Address without the scheme, for the demo address row. */
export function bareUrl(url: string): string {
  return url.replace(/^https:\/\//, '').replace(/\/$/, '');
}
