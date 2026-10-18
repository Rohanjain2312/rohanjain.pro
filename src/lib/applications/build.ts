// Turns an engine Report into the stored result. Copies only the curated fields (R-502).
import type { Report } from '../fitcheck/types.ts';
import { addDays, utcDate } from './expiry.ts';
import { applicationResultSchema, type ApplicationResult } from './schema.ts';

export function buildResult(
  report: Report,
  meta: { company: string; role: string; expiresInDays: number },
  now: Date,
): ApplicationResult {
  const created = utcDate(now);
  return applicationResultSchema.parse({
    company: meta.company,
    role: meta.role,
    created,
    expires: addDays(created, meta.expiresInDays),
    verdict: { label: report.verdict, key: report.verdictKey },
    counts: { proven: report.provenCount, gaps: report.gapCount },
    evidenceRows: report.evidenceRows.map((r) => ({
      id: r.id,
      name: r.name,
      proof: r.proof,
      ...(r.href ? { href: r.href } : {}),
      ...(r.linkLabel ? { linkLabel: r.linkLabel } : {}),
      matchCount: r.matchCount,
      tags: r.tags,
    })),
    gaps: report.gaps,
  });
}
