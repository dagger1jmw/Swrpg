// Paths and ranks in plain words for refusal reasons and screens (opt-2 G3; audit D-codes: "only for the outsider path",
// "only for padawan or apprentice" read as ids). One place, so every refusal names them the same way.

export const PATH_WORDS: Readonly<Record<string, string>> = {
  jedi: 'the Jedi',
  sith: 'the Sith',
  outsider: 'Force-sensitives outside the orders',
  career: 'those without the Force (careers)',
};

export const RANK_WORDS: Readonly<Record<string, string>> = {
  initiate: 'an Initiate',
  padawan: 'a Padawan',
  knight: 'a Jedi Knight',
  master: 'a Jedi Master',
  acolyte: 'a Sith acolyte',
  apprentice: 'a Sith apprentice',
  lord: 'a Sith Lord',
  none: 'someone without a rank',
  career: 'someone in a career',
};

/** "the Jedi or the Sith" from path ids. */
export const pathsInWords = (ids: readonly string[]): string => ids.map((p) => PATH_WORDS[p] ?? p).join(' or ');
/** "a Padawan or a Sith apprentice" from rank ids. */
export const ranksInWords = (ids: readonly string[]): string => ids.map((r) => RANK_WORDS[r] ?? r).join(' or ');
