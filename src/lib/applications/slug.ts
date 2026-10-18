// Slug for a /for page: `<company-kebab>-<6 random base32 chars>` (R-503).
import { randomBytes } from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';
const MAX_KEBAB = 40;
const FALLBACK = 'application';

/** Lowercase ASCII kebab-case. Accents are stripped; names with no ASCII letters or digits give "application". */
export function kebab(name: string): string {
  const ascii = name
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const cut = ascii.slice(0, MAX_KEBAB).replace(/-+$/g, '');
  return cut === '' ? FALLBACK : cut;
}

/** Six base32 characters from node:crypto. 256 is a multiple of 32, so masking a byte has no bias. */
export function randomSuffix(bytes: (n: number) => Uint8Array = randomBytes): string {
  const b = bytes(6);
  let out = '';
  for (let i = 0; i < 6; i++) out += ALPHABET[(b[i] ?? 0) & 31];
  return out;
}

export function makeSlug(company: string, bytes?: (n: number) => Uint8Array): string {
  return `${kebab(company)}-${randomSuffix(bytes)}`;
}
