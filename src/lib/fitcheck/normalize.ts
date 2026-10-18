// Input cleaning (docs/spec/06-architecture.md section 5.4). Pure string work.
import { config } from './thresholds.ts';

/**
 * Trim, NFKC, lowercase, collapse whitespace, cap at maxChars.
 * The raw text is cut first, so any input gives the same result as its first maxChars characters.
 * The result is cut again because NFKC can lengthen text.
 */
// Invisible characters that split a word without showing: soft hyphen, zero-width, bidi marks, word joiner, BOM.
const INVISIBLE = /[\u00ad\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g;

export function normalizeText(text: string, maxChars: number = config.maxChars): string {
  const cut = text.slice(0, maxChars);
  const clean = cut.replace(INVISIBLE, '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  return clean.length > maxChars ? clean.slice(0, maxChars) : clean;
}

/** Same cleaning for curated terms, without a cap. */
export function normalizeTerm(term: string): string {
  return term.replace(INVISIBLE, '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}
