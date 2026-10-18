// Pure helpers that turn a fit-check Report into the strings the page shows. No DOM, no Astro imports,
// so Vitest runs them. Every sentence comes from the `fit` block of copy/home.json; the numbers come from
// the Report. Nothing here builds markup (R-405): callers put these strings in text nodes.
import type { Report, VerdictKey } from '../lib/fitcheck/types.ts';
import { MONTHS } from './lib.ts';

export type FitNotes = Record<VerdictKey, string>;

/** Cut a field to its cap. Same unit as the `maxlength` attribute. */
export function clampField(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

/** "7,214 / 8,000", or an empty string below the point where the counter shows. */
export function counterText(length: number, cap: number, from: number): string {
  if (length < from) return '';
  return `${length.toLocaleString('en-US')} / ${cap.toLocaleString('en-US')}`;
}

/**
 * Fill {slots} in a copy template in one pass. Values are inserted as given: a value that contains
 * "{x}" or "$&" is not read again, because visitor text can end up in a value.
 */
export function fillSlots(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-z]+)\}/g, (whole, key: string) => values[key] ?? whole);
}

/** "9 proven · 1 to ramp up" from the template in copy. */
export function countsLine(report: Report, template: string): string {
  return fillSlots(template, {
    proven: String(report.provenCount),
    gaps: String(report.gapCount),
  });
}

/** The fixed paragraph under the verdict. One per verdict key. */
export function noteFor(report: Report, notes: FitNotes): string {
  return notes[report.verdictKey];
}

/** "Strong fit. 9 proven · 1 to ramp up." for the status line read out by screen readers. */
export function announcement(report: Report, template: string): string {
  return `${report.verdict}. ${countsLine(report, template)}`;
}

/** "Oct 2026": the month of the click, in the form the site uses everywhere. */
export function monthLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export type BriefTitleCopy = {
  title: string;
  defaultRole: string;
  atCompany: string;
};

/** "Rohan Jain for ML Engineer at Acme". No role: "your role". No company: no " at ...". */
export function briefTitle(
  name: string,
  roleTitle: string,
  company: string,
  copy: BriefTitleCopy,
): string {
  const role = roleTitle.trim() === '' ? copy.defaultRole : roleTitle.trim();
  const at = company.trim() === '' ? '' : fillSlots(copy.atCompany, { company: company.trim() });
  return fillSlots(copy.title, { name, role, company: at });
}

/** First `max` tags, joined for the brief ("Python, LangGraph, Docker"). */
export function tagLine(tags: readonly string[], max: number): string {
  return tags.slice(0, max).join(', ');
}

/** The gaps line on the brief: up to `max` names, then a count of the rest. */
export function gapLine(gaps: readonly string[], max: number, moreTemplate: string): string {
  if (gaps.length <= max) return `${gaps.join(', ')}.`;
  return fillSlots(moreTemplate, {
    list: gaps.slice(0, max).join(', '),
    n: String(gaps.length - max),
  });
}
