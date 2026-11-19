// The post-narration check (Jared, D-197; the V170 failure mode): before a narration is committed it is scanned for
// contradictions of the resolved block. Conservative by design: each rule fires only on a narrow, explicit pattern in a
// sentence with no negation ("nearly", "before you can", "misses"), so ordinary prose never trips it. Pure.
//
// Rules: (1) severing or limb loss with no sever in the block and no limb lost earlier; (2) the player's blade landing
// when the player hit nobody, or the player being hit when nobody hit the player; (3) a named minion cut down or
// carved through that was not hit and still stands; (4) a step marked NOT REACHED described as done (by the ability);
// (5) bacta or Force healing with no such care applied; (6) a wounding hit left out; (7) a wound placed on a body
// location the block does not have for that fighter.
import { combatFacts, type CombatFacts } from './combatFacts';
import type { CombatDraft } from './combatTurn';
import { careApplied } from './context';
import type { TurnDraft } from './resolve';

export type NarrationIssueKind = 'sever' | 'hitNotInLog' | 'minionNotHit' | 'stepNotReached' | 'healingNotApplied' | 'woundOmitted' | 'woundMisplaced';
export interface NarrationIssue {
  kind: NarrationIssueKind;
  /** The correction for the retry, and the log line. */
  text: string;
  /** The offending sentence. */
  sentence: string;
}

const sentencesOf = (text: string): string[] => text.split(/(?<=[.!?…])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
/** Clauses of a sentence: a miss in one clause does not excuse a hit in another. */
const clausesOf = (sentence: string): string[] => sentence.split(/[,;:—–]|\s+(?:before|but|while|then|until|only to|yet)\s+/i).map((s) => s.trim()).filter(Boolean);

/** Words that make a clause an attempt, a near thing or a miss, not an event. */
const NOT_AN_EVENT = /\b(nearly|almost|narrowly|barely|threaten\w*|aim\w*|tries|try|trying|tried|attempt\w*|fail\w*|would|could|might|meant|seek\w*|hop\w*|intend\w*|miss\w*|avoid\w*|evad\w*|dodg\w*|parr\w+|block\w*|deflect\w*|turn\w* aside|recover\w*|sidestep\w*|out of reach|short of|wide of|harmless\w*|unharmed|uninjured|untouched|no (wound|harm|injury|damage)|without (a |any )?(wound|harm|injury))\b/i;
/** Words that say a planned move did not come off. */
const NOT_DONE = /\b(before (you|he|she|they|it) (can|could|manage\w*)|no (time|chance|room|opening)|never (get|gets|got|reach|reaches|comes|came)|unable|cannot|can't|could not|couldn't|fail\w*|short|too late|denied|instead|not reach\w*|(don't|do not|didn't|did not) get|without (the )?(time|chance)|interrupt\w*|prevent\w*|stops? you|rob\w* you|no follow-?up|dies unspent|goes unused|must wait|have to wait)\b/i;

const SEVER = /\b(sever(s|ed|ing)?|amputat\w*|dismember\w*|decapitat\w*|behead\w*|stump|(cut|cuts|cutting|lop|lops|lopped|lopping|slice|slices|sliced|slicing|shear|shears|sheared|hack|hacks|hacked|take|takes|took|taking)\s+(?:\w+\s+){0,3}(arm|hand|leg|head|limb|foot)\s+off|(cut|cuts|cutting|lop|lops|lopped|slice|slices|sliced|shear|shears|sheared|hack|hacks|hacked)\s+off\s+(?:\w+\s+){0,3}(arm|hand|leg|head|limb|foot)|(arm|hand|leg|limb|head)\s+(falls|drops|clatters|tumbles|spins)\s+(away|free|to the))\b/i;

/** The player's weapon landing on someone. */
const PLAYER_LANDS: readonly RegExp[] = [
  /\byour (blade|lightsaber|saber|strike|blow|cut|thrust|weapon|slash)\b[^.]{0,60}?\b(catches|bites|sears|slices|carves|cuts|cleaves|pierces|burns|connects|strikes home|finds (?:its|his|her|their) (?:mark|target)|lands|scores|scorches|gashes|wounds|opens)\b(?![^.]{0,25}\b(blade|saber|lightsaber|guard|weapon|staff|parry|air|nothing|empty|ground|floor|wall|stone)\b)/i,
  /\byou (?:\w+ ){0,5}(score|scores|land|lands|deliver|delivers)\s+(?:\w+[ ,]+){0,5}(touch|hit|blow|cut|wound|gash|strike)\b/i,
  /\byou (?:\w+ ){0,4}(cut|cuts|slice|slices|carve|carves|cleave|cleaves|slash|slashes|hack|hacks|bisect|bisects)\s+(?:\w+ ){0,3}(through|down|into|apart|in two|in half)\b(?![^.]{0,20}\b(air|nothing|empty|guard|defen[cs]e)\b)/i,
];
/** The player being hit. */
const PLAYER_IS_HIT: readonly RegExp[] = [
  /\b(catches|catching|hits|hitting|strikes|striking|sears|searing|burns|burning|grazes|grazing|clips|clipping|slams into|punches into|tears into|cuts into|slices into|bites into|scorches|gashes|wounds)\s+(?:\w+ ){0,2}(you\b(?! (off|by|un|flat))|your (arm|leg|shoulder|side|ribs|chest|back|thigh|torso|flank|hand|head|face|forearm|hip|knee)\b)/i,
  /\byou (?:are|take|suffer)\s+(?:\w+ ){0,3}(hit|struck|wounded|wound|gash|burn|graze)\b/i,
];

/** Nouns after an ordinal that are not a fighter ("the second strike"). */
const NOT_A_FIGHTER = 'strike|blow|cut|bolt|shot|time|attempt|exchange|swing|thrust|step|moment|pass|parry|volley|attack|lunge|wave|round|one of|of';
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const DAMAGE = /\b(carv\w*|cut\w*|slic\w*|cleav\w*|slash\w*|hack\w*|bisect\w*|sever\w*|destroy\w*|shatter\w*|impal\w*|pierc\w*|skewer\w*|fell\w*|drop\w*|kill\w*|slay\w*|finish\w*|dispatch\w*|tak\w+ (?:\w+ )?(?:out|down)|took (?:\w+ )?(?:out|down)|goes down|falls?|collaps\w*|crumpl\w*|toppl\w*|disabl\w*|wound\w*|sear\w*|burn\w*|maim\w*)\b/i;

/** How each Force step reads in prose (rule 4). */
const FORCE_PROSE: Readonly<Record<string, RegExp>> = {
  push: /\bforce[- ]push\w*|\b(push|pushes|pushing|shove|shoves|shoving|hurl|hurls|hurling|throw|throws|throwing|fling|flings|blast|blasts|slam|slams)\b[^.]{0,50}\b(with|through|using) the force\b|\b(wave|surge|burst|blast|pulse|wall|shockwave) of (?:\w+ ){0,2}(force|kinetic|telekinetic)\b|\bkinetic (?:force )?(energy|blast|wave)\b|\btelekinetic (push|shove|blast|wave|burst)\b/i,
  lightning: /\blightning\b/i,
  choke: /\b(chok\w+|force[- ]grip|invisible (grip|hand|fingers)|crush\w* (his|her|its|their) (throat|windpipe))\b/i,
  throw: /\b(hurl|fling|throw|launch|send)\w*\b[^.]{0,40}\b(rock|stone|boulder|log|branch|crate|debris|chunk|timber|machinery|slab|rubble)\b/i,
  saberThrow: /\b(throw|hurl|toss|fling|cast)\w*\b[^.]{0,30}\b(lightsaber|saber|blade)\b|\b(spinning|whirling) (lightsaber|saber|blade)\b/i,
  mindTrick: /\bmind[- ]trick\b/i,
};
const FORCE_NAME: Readonly<Record<string, string>> = { push: 'Force push', lightning: 'Force lightning', choke: 'Force choke', throw: 'Force throw', saberThrow: 'saber throw', mindTrick: 'mind trick' };

const BACTA = /\b(bacta|kolto)\b/i;
const FORCE_HEAL = /\bforce[- ](heal\w*|assisted healing)|\bhealing (trance|through the force)|\b(heal\w*|mend\w*|knit\w*)\b[^.]{0,40}\b(with|through|using) the force\b/i;
/**
 * Healing only talked about, wished for, sought, or named as what the character did NOT get ("treated only by medpacs
 * rather than restorative bacta": a false alarm in the re-check, since the block itself tells the narrator there is no
 * bacta).
 */
const HEALING_NOT_APPLIED_TALK = /\b(no|not|nor|never|without|rather than|instead of|in place of|unlike|only by|only with|absent|absence|need\w*|wish\w*|would|should|could|must|seek\w*|find|look\w* for|ask\w*|request\w*|suggest\w*|recommend\w*|offer\w*|if|until|when you reach|lack\w*|out of|luxury)\b/i;

function combatIssues(narrative: string, c: CombatDraft, facts: CombatFacts): NarrationIssue[] {
  const out: NarrationIssue[] = [];
  const sentences = sentencesOf(narrative);
  const anyLost = c.fighters.some((f) => f.lostParts.length > 0);
  const playerHitSomeone = facts.hits.some((h) => h.byPlayer);
  const add = (kind: NarrationIssueKind, text: string, sentence: string): void => {
    if (!out.some((x) => x.kind === kind && x.sentence === sentence)) out.push({ kind, text, sentence });
  };
  for (const s of sentences) {
    for (const cl of clausesOf(s)) {
      if (NOT_AN_EVENT.test(cl)) continue;
      // 1. Severing with no sever.
      if (!facts.anySevered && !anyLost && SEVER.test(cl)) add('sever', 'no limb was severed in this passage: do not describe any severing or lost limb', s);
      // 2. Hits that are not in the log.
      if (!playerHitSomeone && PLAYER_LANDS.some((re) => re.test(cl))) add('hitNotInLog', `${c.fighters[0]?.name ?? 'the player character'} hit nobody in this passage (every strike was NO HIT): the blade must not land, cut or score a touch`, s);
      if (!facts.playerHit && PLAYER_IS_HIT.some((re) => re.test(cl))) add('hitNotInLog', `nobody hit ${c.fighters[0]?.name ?? 'the player character'} in this passage: describe no hit, graze or burn on them`, s);
      // 3. A numbered minion that was not hit and still stands, cut down or carved through.
      for (const o of facts.unhitOpponents) {
        if (o.out || !o.minion) continue;
        const m = /^(.*\S)\s+(\d+)$/.exec(o.name);
        if (!m) continue;
        const noun = m[1]!.split(/\s+/).pop()!.toLowerCase();
        const ordinal = ORDINALS[Number(m[2]) - 1];
        const lower = cl.toLowerCase();
        // By name, by "the second battle droid", or by a bare "the second" that is not a second strike or moment.
        const named =
          lower.includes(o.name.toLowerCase()) ||
          (ordinal !== undefined && (new RegExp(`\\b${ordinal}\\b(?:\\s+\\w+){0,3}\\s+${noun}s?\\b`).test(lower) || new RegExp(`\\bthe ${ordinal}\\b(?!\\s+(?:\\w+\\s+)?(?:${NOT_A_FIGHTER})\\b)`).test(lower)));
        if (named && DAMAGE.test(cl)) add('minionNotHit', `${o.name} was NOT hit and is still fighting: do not describe it cut, carved through, wounded or brought down`, s);
      }
    }
    // 4. A step NOT REACHED described as done (whole-sentence negation).
    if (!NOT_DONE.test(s)) {
      for (const st of facts.steps) {
        if (st.status !== 'NOT REACHED' || !st.force) continue;
        const re = FORCE_PROSE[st.force];
        if (!re) continue;
        // The same ability really used in this passage makes the prose ambiguous: leave it.
        if (facts.steps.some((x) => x !== st && x.force === st.force && x.status !== 'NOT REACHED')) continue;
        if (re.test(s)) add('stepNotReached', `step ${st.index + 1} (${FORCE_NAME[st.force] ?? st.label}) was NOT REACHED (${st.detail}): it did not happen, so say the character did not get to it`, s);
      }
    }
    // 2b. A touch or a hit scored when nobody was hit at all (whole sentence, no near-miss words in it).
    if (facts.hits.length === 0 && !c.narrate.some((r) => r.hit?.point) && !NOT_AN_EVENT.test(s) && ANY_TOUCH.test(s)) add('hitNotInLog', 'nobody was hit or touched in this passage (every exchange was NO HIT): describe no touch, hit or point scored', s);
  }
  // 6. A wounding hit on the player or a named opponent that the narration never places (the wound left out).
  const lower = narrative.toLowerCase();
  for (const h of facts.hits) {
    if (!h.severity) continue;
    const victim = c.fighters.find((f) => f.id === h.targetId);
    if (victim?.minion) continue;
    const where = PART_PROSE[h.part.replace(/^(left|right)/, '').toLowerCase()] ?? null;
    if (where && !where.test(lower)) out.push({ kind: 'woundOmitted', text: `#${h.n} HIT ${h.targetName} (${h.part.replace(/([A-Z])/g, ' $1').toLowerCase()}, ${h.severed ? 'severed' : `${h.severity} wound`}): the narration left this wound out; narrate it where and as severe as listed`, sentence: '' });
  }
  return out;
}

/** A touch or hit scored, whoever the subject is. */
const ANY_TOUCH = /\b(score|scores|scoring|land|lands|landing)\s+(a|an|the)\s+(?:[\w-]+[ ,]+){0,4}(touch|hit|point)\b/i;
/** How a wounded location shows up in prose. */
const PART_PROSE: Readonly<Record<string, RegExp>> = {
  arm: /\b(arm|shoulder|elbow|forearm|bicep|wrist)\b/,
  leg: /\b(leg|thigh|knee|shin|calf|hip|ankle)\b/,
  hand: /\b(hand|fingers|wrist|knuckles)\b/,
  torso: /\b(torso|chest|ribs|side|stomach|abdomen|back|body|flank|gut|belly)\b/,
  head: /\b(head|face|skull|temple|jaw|neck|cheek|brow)\b/,
};

/**
 * Rule 7 (Jared, after combat pass 1; the medic-week case: a "deep torso wound" when the wound was the right arm). Body
 * words by location group, narrower than PART_PROSE: "side" and "back" are left out (your back foot, at your side).
 */
const LOCATION_WORDS: Readonly<Record<string, string>> = {
  arm: 'arms?|shoulders?|elbows?|forearms?|biceps?',
  hand: 'hands?|fingers|wrists?|knuckles',
  leg: 'legs?|thighs?|knees?|shins?|calf|calves|ankles?|hips?|feet|foot',
  torso: 'torso|chest|ribs|ribcage|stomach|abdomen|gut|belly|flank',
  head: 'head|face|skull|temple|jaw|cheek|brow|neck|eyes?',
};
/** Groups a wound on a part may be described with (an arm wound may show at the wrist; a hand wound up the arm). */
const LOCATION_ALLOWS: Readonly<Record<string, readonly string[]>> = { arm: ['arm', 'hand'], hand: ['hand', 'arm'], leg: ['leg'], torso: ['torso'], head: ['head'] };
/** Words that make a clause about a wound (its place, its treatment or its pain). */
const WOUND_WORDS = /\b(wound\w*|gash\w*|burn\w*|injur\w*|graz\w*|lacerat\w*|scorch\w*|bleed\w*|blood\w*|bandag\w*|treat\w*|tend\w*|heal\w*|mend\w*|hit|struck|sear\w*|cauteri\w*|pain\w*|ach\w*|throb\w*|stump|cut|slash\w*|stab\w*|pierc\w*)\b/i;
/** Up to three describing words between the possessive and the body word, never another possessive or an article ("your blade cuts his chest" is not your chest). */
/** Clauses that do not place a wound: near misses, aims, hypotheticals, negations (narrower than NOT_AN_EVENT, which also skips "recover"). */
const NOT_PLACED = /\b(nearly|almost|narrowly|barely|threaten\w*|aim\w*|tries|try|trying|tried|attempt\w*|would|could|might|meant|miss\w*|avoid\w*|evad\w*|dodg\w*|parr\w+|block\w*|deflect\w*|turn\w* aside|sidestep\w*|short of|wide of|harmless\w*|unharmed|uninjured|untouched|no (wound|harm|injury|damage)|without (a |any )?(wound|harm|injury)|not|never)\b/i;
const FILLER = String.raw`(?:(?!(?:his|her|their|its|your|the|a|an)\b)[\w-]+\s+){0,3}?`;
const groupOf = (part: string): string => part.replace(/^(left|right)/, '').toLowerCase();

export interface KnownWounds {
  /** Body parts of every wound the player character had before or after the turn (health and this fight). */
  player: readonly string[];
}

function misplacedIssues(narrative: string, draft: TurnDraft, known: KnownWounds): NarrationIssue[] {
  const out: NarrationIssue[] = [];
  const c = draft.combat;
  const facts = c && !c.quiet ? combatFacts(c) : null;
  // Each fighter's known locations: their wounds (health, earlier passages) and this passage's hits on them.
  const partsOf = (id: string): Set<string> => {
    const parts = new Set<string>();
    const view = c?.fighters.find((f) => f.id === id);
    for (const p of view?.woundParts ?? []) parts.add(groupOf(p));
    for (const p of view?.lostParts ?? []) parts.add(groupOf(p));
    for (const h of facts?.hits ?? []) if (h.targetId === id) parts.add(groupOf(h.part));
    if (id === 'pc') for (const p of known.player) parts.add(groupOf(p));
    return parts;
  };
  const allowed = (parts: Set<string>): Set<string> => new Set([...parts].flatMap((g) => LOCATION_ALLOWS[g] ?? [g]));
  const subjects: { id: string; name: string; possessive: RegExp; mention: RegExp | null }[] = [{ id: 'pc', name: c?.fighters[0]?.name ?? 'the player character', possessive: new RegExp(String.raw`\byour\s+${FILLER}`), mention: null }];
  for (const f of c?.fighters.slice(1) ?? []) {
    if (f.minion) continue;
    const words = f.name.toLowerCase().split(/[^a-z0-9']+/).filter((w) => w.length >= 4);
    if (!words.length) continue;
    subjects.push({ id: f.id, name: f.name, possessive: new RegExp(String.raw`\b(?:his|her|their|its)\s+${FILLER}`), mention: new RegExp(`\\b(${words.join('|')})\\b`, 'i') });
  }
  for (const subj of subjects) {
    const parts = partsOf(subj.id);
    if (!parts.size) continue; // no known wound: placing one is the hit rules' business, not this one
    const ok = allowed(parts);
    for (const s of sentencesOf(narrative)) {
      for (const cl of clausesOf(s)) {
        if (NOT_PLACED.test(cl) || !WOUND_WORDS.test(cl)) continue;
        if (subj.mention && !subj.mention.test(s)) continue;
        for (const [group, words] of Object.entries(LOCATION_WORDS)) {
          if (ok.has(group)) continue;
          const re = new RegExp(subj.possessive.source + `(${words})\\b`, 'i');
          if (!re.test(cl)) continue;
          const where = [...parts].join(', ');
          if (!out.some((x) => x.sentence === s)) out.push({ kind: 'woundMisplaced', text: `${subj.name}'s wounds are on the ${where} only: do not describe a wound on the ${group}`, sentence: s });
        }
      }
    }
  }
  return out;
}

function healingIssues(narrative: string, draft: TurnDraft): NarrationIssue[] {
  const care = new Set(careApplied(draft));
  const out: NarrationIssue[] = [];
  for (const s of sentencesOf(narrative)) {
    if (HEALING_NOT_APPLIED_TALK.test(s)) continue;
    if (!care.has('bacta') && BACTA.test(s)) out.push({ kind: 'healingNotApplied', text: 'no bacta or kolto was applied this turn: describe no bacta treatment', sentence: s });
    else if (!care.has('forceHealer') && FORCE_HEAL.test(s)) out.push({ kind: 'healingNotApplied', text: 'no Force healing was applied this turn: describe none', sentence: s });
  }
  return out;
}

/**
 * The contradictions between a narration and the turn's resolved block. `woundedOrHealing`: the character has wounds or
 * the turn is a time jump or a healing action (only then is healing prose checked).
 */
export function checkNarration(narrative: string, draft: TurnDraft, woundedOrHealing: boolean, known: KnownWounds = { player: [] }): NarrationIssue[] {
  const issues: NarrationIssue[] = [];
  if (draft.combat && !draft.combat.quiet) issues.push(...combatIssues(narrative, draft.combat, combatFacts(draft.combat)));
  if (woundedOrHealing) issues.push(...healingIssues(narrative, draft));
  issues.push(...misplacedIssues(narrative, draft, known));
  return issues;
}

/**
 * The code-written narration used when a retry still contradicts the block (D-197). Combat: the outcome list in plain
 * sentences. Otherwise: the narration with the offending sentences removed.
 */
export function fallbackNarration(narrative: string, draft: TurnDraft, issues: readonly NarrationIssue[]): string {
  const combatWrong = issues.some((i) => i.kind !== 'healingNotApplied' && !(i.kind === 'woundMisplaced' && !draft.combat));
  if (draft.combat && combatWrong) {
    const facts = combatFacts(draft.combat);
    const plain = facts.lines.map((l) =>
      l
        .replace(/^#\d+(?: \(surprise\))?(?: \(sequence step \d+\))?(?: \(while .+? only defends\))?\s*/, '')
        .replace(/ Explain the failure only with this reason; nothing else in the scene blocked it\./, '')
        .replace(/: DONE\. /, ': ')
        .replace(/: DONE \(/, ' (')
        .replace(/NO HIT/g, 'no hit')
        .replace(/HIT \(/g, 'a hit (')
        .replace(/FAILED/g, 'it fails')
        .replace(/SEVERED/g, 'severed'),
    );
    const missed = facts.steps.filter((s) => s.status === 'NOT REACHED').map((s) => `${s.label} (${s.detail})`);
    if (missed.length) plain.push(`Not reached: ${missed.join('; ')}.`);
    if (draft.combat.ended) plain.push(`The fight is over: ${draft.combat.ended.outcome}.`);
    return plain.join(' ');
  }
  const bad = new Set(issues.map((i) => i.sentence));
  const kept = sentencesOf(narrative).filter((s) => !bad.has(s));
  return kept.length ? kept.join(' ') : 'Time passes as the engine recorded.';
}
