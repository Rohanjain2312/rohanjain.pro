// Term matcher. Curated terms are compiled once; the user's text is only ever searched, never compiled (R-402).
// Deliberately avoids regexes (R-402): scanning uses indexOf plus boundary checks.
import { config } from './thresholds.ts';
import { normalizeTerm } from './normalize.ts';
import type { Extra, Skill } from './types.ts';

/** Characters that continue a word. "c++" and "c#" keep their symbols; "java" must not hit "javascript". */
function isWordChar(ch: string | undefined): boolean {
  if (ch === undefined) return false;
  return (
    (ch >= 'a' && ch <= 'z') ||
    (ch >= '0' && ch <= '9') ||
    ch === '+' ||
    ch === '#' ||
    (ch > '\u007f' && /\p{L}|\p{N}/u.test(ch))
  );
}

const SHORT_BEFORE = new Set([' ', ',', ';', ':', '(', ')', '[', ']', '"', "'", '/']);

/** Terms of one or two characters ("r", "f1", "s3") need clean neighbors, so "r&d" or "a-r" do not hit. */
function shortBoundaryOk(text: string, start: number, end: number): boolean {
  const before = start === 0 ? undefined : text[start - 1];
  const after = text[end];
  if (before !== undefined && !SHORT_BEFORE.has(before)) return false;
  if (after === undefined || SHORT_BEFORE.has(after)) return true;
  return after === '.' && (end + 1 >= text.length || text[end + 1] === ' ');
}

/** True when `term` occurs in `text` with a boundary on both sides. Both are already normalized. */
export function containsTerm(text: string, term: string): boolean {
  if (term.length === 0) return false;
  const short = term.length <= 2;
  let from = 0;
  for (;;) {
    const at = text.indexOf(term, from);
    if (at === -1) return false;
    const end = at + term.length;
    if (short) {
      if (shortBoundaryOk(text, at, end)) return true;
    } else if (!isWordChar(at === 0 ? undefined : text[at - 1]) && !isWordChar(text[end])) {
      return true;
    }
    from = at + 1;
  }
}

export interface CompiledSkill {
  skill: Skill;
  terms: string[];
  /** True when the skill counts only with a technical context (config.plainWordSkills). */
  needsContext: boolean;
}
export interface CompiledExtra {
  extra: Extra;
  terms: string[];
}
export interface Matcher {
  skills: CompiledSkill[];
  extras: CompiledExtra[];
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter((v) => v.length > 0))];
}

/** Build the term lists once. Skills named in config.nameNeedsAlias match through aliases only. */
export function compileMatcher(skills: readonly Skill[], extras: readonly Extra[]): Matcher {
  const aliasOnly = new Set(config.nameNeedsAlias.map(normalizeTerm));
  const plain = new Set(config.plainWordSkills.map(normalizeTerm));
  return {
    skills: skills.map((skill) => {
      const name = normalizeTerm(skill.name);
      const own = aliasOnly.has(name) ? [] : [name];
      return {
        skill,
        terms: uniq([...own, ...skill.aliases.map(normalizeTerm)]),
        needsContext: plain.has(name),
      };
    }),
    extras: extras.map((extra) => {
      const name = normalizeTerm(extra.name);
      const own = aliasOnly.has(name) ? [] : [name];
      return { extra, terms: uniq([...own, ...extra.aliases.map(normalizeTerm)]) };
    }),
  };
}

const cache = new WeakMap<readonly Skill[], WeakMap<readonly Extra[], Matcher>>();

/** Memoized by array identity, so repeated runs on the same content do not recompile. */
export function matcherFor(skills: readonly Skill[], extras: readonly Extra[]): Matcher {
  let byExtras = cache.get(skills);
  if (!byExtras) {
    byExtras = new WeakMap();
    cache.set(skills, byExtras);
  }
  let matcher = byExtras.get(extras);
  if (!matcher) {
    matcher = compileMatcher(skills, extras);
    byExtras.set(extras, matcher);
  }
  return matcher;
}

export function matchesAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => containsTerm(text, term));
}
