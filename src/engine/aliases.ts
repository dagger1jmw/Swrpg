// Exact normalized alias matching (architecture §3, D-13): case, whitespace, punctuation and
// leading titles are ignored. There is no fuzzy matching anywhere. Pure; no imports, so the
// build-time lore script can use it too.

/** Leading titles stripped from an alias, longest first so "grand master" wins over "master". */
const TITLES: readonly string[] = [
  'supreme chancellor',
  'grand master',
  'jedi master',
  'jedi knight',
  'grand moff',
  'master',
  'knight',
  'padawan',
  'jedi',
  'darth',
  'lord',
  'lady',
  'admiral',
  'general',
  'captain',
  'commander',
  'senator',
  'chancellor',
  'emperor',
  'empress',
  'moff',
  'sir',
  'doctor',
  'dr',
  'the',
];

/** Lowercase, no diacritics, punctuation to spaces (apostrophes and hyphens inside words kept), single spaces. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/'s\b/g, '')
    .replace(/[^a-z0-9'\- ]+/g, ' ')
    .replace(/(^|\s)['-]+|['-]+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** normalizeText plus leading titles removed (while something remains). "Grand Master Zym" -> "zym". */
export function normalizeAlias(name: string): string {
  let s = normalizeText(name);
  for (let changed = true; changed; ) {
    changed = false;
    for (const t of TITLES) {
      if (s.startsWith(`${t} `) && s.length > t.length + 1) {
        s = s.slice(t.length + 1);
        changed = true;
        break;
      }
    }
  }
  return s;
}

/** True when the normalized alias appears in the normalized text as whole words. */
export function textMentions(normalizedText: string, alias: string): boolean {
  if (!alias) return false;
  return ` ${normalizedText} `.includes(` ${alias} `);
}

/** Aliases too short or too generic to scan free text for (they still match exact refs). */
export function isScannableAlias(alias: string): boolean {
  return alias.length >= 4;
}

/** URL-safe slug for stable IDs. */
export function slugify(text: string): string {
  return normalizeText(text).replace(/'/g, '').replace(/[\s-]+/g, '-').replace(/^-|-$/g, '') || 'unnamed';
}
