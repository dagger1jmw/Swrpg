// Plain words for the narrator's role, faction, minion kind and terrain (opt-1 A1; the D-523 species pattern, D-529). The schema
// sends these fields as plain words instead of id lists (about 740 characters off the core); the code resolves an exact id or
// label first (case, spaces and a plural "s" ignored), then a word list. A word nobody can read is never refused: the role is
// "other", the faction "unknown", a minion group the default kind and a terrain word dropped, and the word goes to the review
// queue. Every word list below is a design reading (invented), checked by tests/ai/entityWords.test.ts.
import { FACTIONS, NPC_ROLES, type FactionId, type NpcRole } from './entities.config';
import { MINION_KINDS } from './npcGen.config';
import { SKILLS } from './skills';
import { TERRAIN_TAGS } from './terrain';

/** Lower case, letters and digits only, a plural "s" dropped ("Bounty Hunters" -> "bountyhunter"). */
export const foldWord = (w: string): string =>
  w
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(?<=..)s$/, '');

const exact = <T extends string>(pairs: readonly (readonly [T, readonly string[]])[]): ReadonlyMap<string, T> => {
  const m = new Map<string, T>();
  for (const [id, names] of pairs) for (const n of [id, ...names]) if (!m.has(foldWord(n))) m.set(foldWord(n), id);
  return m;
};

const pick = <T extends string>(words: string, map: ReadonlyMap<string, T>, list: readonly (readonly [T, RegExp])[]): T | null => {
  const w = words.trim();
  if (!w) return null;
  const hit = map.get(foldWord(w));
  if (hit) return hit;
  return list.find(([, re]) => re.test(w))?.[0] ?? null;
};

// ---------------------------------------------------------------- roles

const ROLE_NAMES: Readonly<Partial<Record<NpcRole, readonly string[]>>> = {
  jediMaster: ['Jedi Master'], jediKnight: ['Jedi Knight'], sithLord: ['Sith Lord'], sithAcolyte: ['Sith acolyte'], darkJedi: ['Dark Jedi'],
  darkAcolyte: ['Dark Acolyte'], bountyHunter: ['bounty hunter'],
};
const ROLE_EXACT = exact(NPC_ROLES.map((r) => [r, ROLE_NAMES[r] ?? []] as const));
/** In order: the first that matches wins (the dark side before the Jedi words, a title before a trade). */
const ROLE_WORDS: readonly (readonly [NpcRole, RegExp])[] = [
  ['darkAcolyte', /\bdark acolytes?\b/i],
  ['inquisitor', /\binquisitors?\b|\binquisitorius\b/i],
  ['darkJedi', /\bdark jedi\b|\bfallen jedi\b|\bdark[- ]side (?:adept|user|cultist)s?\b|\bdarksiders?\b|\bnightsisters?\b/i],
  ['sithLord', /\bsith (?:lord|master|emperor)s?\b|\bdark lords?\b|\bdarth\b|\bdark council\b/i],
  ['sithAcolyte', /\bsith (?:acolyte|apprentice|student|initiate|warrior|inquisitor)s?\b|\bacolytes?\b/i],
  ['padawan', /\bpadawans?\b|\bjedi (?:apprentice|learner)s?\b/i],
  ['initiate', /\binitiates?\b|\byounglings?\b/i],
  ['jediMaster', /\bjedi masters?\b|\bgrand masters?\b|\bmaster jedi\b|\bcouncil(?:lor| member)s?\b/i],
  ['jediKnight', /\bjedi(?: knights?| consulars?| guardians?| sentinels?| generals?)?\b/i],
  ['bountyHunter', /\bbounty hunters?\b|\bhunters? for hire\b/i],
  ['droid', /\bdroids?\b|\bautomatons?\b/i],
  ['officer', /\b(?:officers?|captains?|commanders?|generals?|admirals?|lieutenants?|majors?|colonels?|moffs?|commodores?|marshals?)\b/i],
  ['pilot', /\bpilots?\b|\baces?\b|\bstarfighter\b|\bnavigators?\b/i],
  ['soldier', /\b(?:soldiers?|troopers?|guards?|sergeants?|corporals?|privates?|warriors?|marines?|commandos?|militia|sentr(?:y|ies)|mercenar(?:y|ies)|veterans?)\b/i],
  ['politician', /\b(?:senators?|politicians?|chancellors?|governors?|kings?|queens?|princes?|princess(?:es)?|ministers?|diplomats?|ambassadors?|nobles?|nobility|viceroys?|delegates?|envoys?)\b/i],
  ['official', /\b(?:officials?|bureaucrats?|clerks?|administrators?|customs|magistrates?|judges?|inspectors?|harbou?rmasters?|port authority|agents?|spies|spy|intelligence)\b/i],
  ['smuggler', /\bsmugglers?\b|\bspacers?\b|\bgun-?runners?\b/i],
  ['criminal', /\b(?:criminals?|thugs?|gangsters?|crime lords?|pirates?|thie(?:f|ves)|slavers?|assassins?|enforcers?|bandits?|raiders?|outlaws?|kingpins?|hutts?)\b/i],
  ['merchant', /\b(?:merchants?|traders?|shopkeepers?|vendors?|dealers?|innkeepers?|brokers?|salesm[ae]n|peddlers?|cantina owners?)\b/i],
  ['scholar', /\b(?:scholars?|historians?|archivists?|librarians?|scientists?|researchers?|teachers?|professors?|archaeologists?|scribes?|lore ?keepers?)\b/i],
  ['healer', /\b(?:healers?|doctors?|medics?|physicians?|surgeons?|nurses?|medical)\b/i],
  ['servant', /\b(?:servants?|butlers?|stewards?|attendants?|aides?|slaves?|bartenders?|cooks?|maids?|porters?|valets?|waiters?)\b/i],
  ['civilian', /\b(?:civilians?|farmers?|workers?|villagers?|citizens?|child|children|refugees?|labou?rers?|mechanics?|miners?|locals?|colonists?|townsfolk|peasants?|students?|engineers?|technicians?|crafts(?:man|men|woman|women)|herders?|fishers?)\b/i],
];

/** The role the narrator's words name, or null when nothing matches. */
export function roleFromWords(words: string): NpcRole | null {
  return pick(words, ROLE_EXACT, ROLE_WORDS);
}

// ---------------------------------------------------------------- factions

const FACTION_NAMES: Readonly<Partial<Record<FactionId, readonly string[]>>> = {
  republic: ['Galactic Republic', 'the Republic'], sithEmpire: ['Sith Empire', 'the Empire'], jediOrder: ['Jedi Order', 'the Jedi'],
  mandalorians: ['Mandalorian'],
};
const FACTION_EXACT = exact(FACTIONS.map((f) => [f, FACTION_NAMES[f] ?? []] as const));
const FACTION_WORDS: readonly (readonly [FactionId, RegExp])[] = [
  ['sithEmpire', /\b(?:sith )?empire\b|\bimperials?\b|\bdark council\b|\bdromund kaas\b/i],
  ['jediOrder', /\bjedi\b/i],
  ['sith', /\bsith\b|\bbrotherhood of darkness\b|\bnightsisters?\b|\bdark side cult\b/i],
  ['mandalorians', /\bmandalorians?\b|\bmando'?a?d?\b|\bclan\b/i],
  ['republic', /\brepublic\b|\bsenate\b|\bcoruscant (?:security|guard)\b|\bsector rangers?\b/i],
  ['underworld', /\b(?:underworld|cartels?|exchange|black sun|syndicates?|gangs?|crime|criminals?|pirates?|smugglers?|hutt|hutts|bounty hunters?(?: guild)?)\b/i],
  ['independent', /\b(?:independent|neutral|freelance|mercenar(?:y|ies)|unaligned|neither side|separatists?|confederacy)\b/i],
  ['civilian', /\b(?:civilians?|citizens?|locals?|none|no faction|townsfolk|villagers?|nobody)\b/i],
];

/** The faction the narrator's words name, or null when nothing matches. */
export function factionFromWords(words: string): FactionId | null {
  return pick(words, FACTION_EXACT, FACTION_WORDS);
}

// ---------------------------------------------------------------- minion kinds

const KIND_EXACT = exact(MINION_KINDS.map((k) => [k.id, [k.label, ...(k.plural ? [k.plural] : [])]] as const));
const KIND_WORDS: readonly (readonly [string, RegExp])[] = [
  ['yuuzhanVongWarrior', /\b(?:yuuzhan )?vong\b/i],
  ['superBattleDroid', /\bb2s?\b|\bsuper battle droids?\b/i],
  ['droideka', /\bdroidekas?\b|\bdestroyer droids?\b|\brollers?\b/i],
  ['battleDroid', /\bb1s?\b|\bbattle droids?\b/i],
  ['skytrooper', /\bskytroopers?\b/i],
  ['warDroid', /\b(?:war |combat |assassin |security |sentry )?droids?\b/i],
  ['cloneTrooper', /\bclones?(?: troopers?)?\b/i],
  ['stormtrooper', /\bstormtroopers?\b/i],
  ['sithTrooper', /\bsith troopers?\b|\bimperial (?:troopers?|soldiers?)\b/i],
  ['eliteTrooper', /\b(?:elite|commandos?|special forces|arc troopers?|havoc)\b/i],
  ['mandalorian', /\bmandalorians?\b|\bmandos?\b/i],
  ['darkAcolyte', /\bdark acolytes?\b/i],
  ['darkJedi', /\bdark jedi\b|\bdark[- ]siders?\b|\bfallen jedi\b/i],
  ['sithAcolyte', /\b(?:sith )?acolytes?\b|\bsith (?:apprentices?|students?)\b/i],
  ['trooper', /\b(?:troopers?|soldiers?|guards?|marines?|security|sentr(?:y|ies)|infantry|legionnaires?)\b/i],
  ['beast', /\b(?:beasts?|creatures?|animals?|predators?|monsters?|rancors?|nexus|vornskrs?|wolves|wolf|katarns?|tuk'?atas?)\b/i],
  ['militia', /\b(?:militia|locals?|farmers?|villagers?|rebels?|insurgents?|partisans?|colonists?)\b/i],
  ['brawler', /\b(?:brawlers?|street fighters?|pit fighters?|rioters?|mob)\b/i],
  ['thug', /\b(?:thugs?|gangsters?|enforcers?|pirates?|mercenar(?:y|ies)|bandits?|raiders?|criminals?|slavers?|swoop|gangs?|hired guns?|smugglers?)\b/i],
];
/** The kind for a minion word nobody can read (invented): gangsters and enforcers, the middle of the table. */
export const DEFAULT_MINION_KIND = 'thug';

export function minionKindFromWords(words: string): string | null {
  return pick(words, KIND_EXACT, KIND_WORDS);
}

// ---------------------------------------------------------------- terrain

const TERRAIN_EXACT = exact(TERRAIN_TAGS.map((t) => [t.id, [t.label]] as const));
const TERRAIN_WORDS: readonly (readonly [string, RegExp])[] = [
  ['ysalamiri', /\bysalamir/i],
  ['zeroGravity', /\bzero[- ]?g(?:ravity)?\b|\bweightless/i],
  ['floatingPlatforms', /\b(?:floating|hovering|moving) platforms?\b|\brepulsor platforms?\b/i],
  ['highGround', /\bhigh ground\b|\belevat|\bridge\b|\bhilltop\b|\bbalcon/i],
  ['ledge', /\bledges?\b|\bdrops?\b|\bcliffs?\b|\bchasms?\b|\bcatwalks?\b|\bshafts?\b|\bgantr|\bbridges?\b|\bprecipice/i],
  ['iceChunks', /\b(?:chunks? of ice|ice chunks?|ice blocks?)\b/i],
  ['slippery', /\bslippery\b|\bwet\b|\bicy\b|\bice\b|\bmud(?:dy)?\b|\boil(?:y)?\b|\bslick\b|\brain\b|\bsnow\b/i],
  ['looseRock', /\bloose (?:rock|stone)s?\b|\brubble\b|\bscree\b|\bgravel\b/i],
  ['debris', /\bdebris\b|\bwreck(?:age)?\b|\bruins?\b|\bscrap\b/i],
  ['fallenTimber', /\b(?:logs?|branch(?:es)?|timber|fallen trees?|forest|woods|jungle)\b/i],
  ['crates', /\bcrates?\b|\bcontainers?\b|\bcargo\b|\bbarrels?\b|\bstorage\b/i],
  ['machinery', /\bmachinery\b|\bmachines?\b|\bengines?\b|\bgenerators?\b|\bfactory\b|\breactors?\b/i],
  ['fire', /\bfires?\b|\bflames?\b|\bburning\b|\blava\b|\binferno\b/i],
  ['cover', /\bcover\b|\bpillars?\b|\bcolumns?\b|\bbarricades?\b|\bwalls?\b|\btrench(?:es)?\b/i],
  ['confined', /\bconfined\b|\bcorridors?\b|\bhallways?\b|\bnarrow\b|\bcramped\b|\btunnels?\b|\bpassages?\b|\balleys?\b|\bcave\b|\bindoors?\b|\bsmall room\b/i],
  ['unevenGround', /\buneven\b|\brough\b|\brocky\b|\bbroken ground\b|\bsand\b|\bdunes?\b|\bmarsh\b|\bswamp\b/i],
  ['open', /\bopen\b|\bfields?\b|\bplains?\b|\bdesert\b|\bcourtyard\b|\bplaza\b|\barena\b|\bstreets?\b/i],
  ['flatFloor', /\bflat\b|\bfloors?\b|\bhalls?\b|\bdeck\b|\bchambers?\b|\brooms?\b/i],
];

export function terrainFromWords(words: string): string | null {
  return pick(words, TERRAIN_EXACT, TERRAIN_WORDS);
}

// ---------------------------------------------------------------- skills (a choice's skillId)

const SKILL_EXACT = exact(SKILLS.map((k) => [k.id, [k.name]] as const));

/**
 * A choice's skill named in words (opt-1 B2): the id or the skill's name, case, spaces and accents aside ("Force Push", "Dun Moch").
 * Null when it names no skill; the caller then keeps the word, which reads as an unknown skill exactly as an unknown id did.
 */
export function skillFromWords(words: string): string | null {
  return SKILL_EXACT.get(foldWord(words)) ?? null;
}
