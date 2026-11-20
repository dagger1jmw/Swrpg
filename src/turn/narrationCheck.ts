// The post-narration check (Jared, D-197; the V170 failure mode): before a narration is committed it is scanned for
// contradictions of the resolved block. Conservative by design: each rule fires only on a narrow, explicit pattern in a
// sentence with no negation ("nearly", "before you can", "misses"), so ordinary prose never trips it. Pure.
//
// Rules: (1) severing or limb loss with no sever in the block and no limb lost earlier; (2) the player's blade landing
// when the player hit nobody, or the player being hit when nobody hit the player; (3) a named minion cut down or
// carved through that was not hit and still stands; (4) a step marked NOT REACHED described as done (by the ability);
// (5) bacta or Force healing with no such care applied; (6) a wounding hit left out; (7) a wound placed on a body
// location the block does not have for that fighter. Rules 8 to 12: D-210, D-211, D-216, D-236. Rules 13 to 17 (D-237):
// a shot or a failed Force step told as done, ground given to the wrong side, "the last one" while several stand, a
// weapon nobody carries, and a fighter who stands on a leg that is gone or uses an arm that is gone.
import { NARRATION_FALLBACK } from '../data/combat.config';
import { partText } from '../engine/duel';
import { combatFacts, playerShotNotReached, type CombatFacts, type HitFact } from './combatFacts';
import type { CombatDraft } from './combatTurn';
import { careApplied } from './context';
import type { TurnDraft } from './resolve';

export type NarrationIssueKind = 'sever' | 'hitNotInLog' | 'minionNotHit' | 'stepNotReached' | 'healingNotApplied' | 'woundOmitted' | 'woundMisplaced' | 'repeated' | 'slipNoHazard' | 'mechanicalTerms' | 'gearNotInBlock' | 'stepFailed' | 'groundReversed' | 'survivorCount' | 'lastingState' | 'captorsWrong';
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
  // "taking a light blow to your own ribs" (D-242; pass 3, with no hit on the player in the block).
  /\b(?:tak(?:e|es|ing)|took|suffer\w*|absorb\w*) (?:\w+[ ,]+){0,3}(?:blow|hit|cut|graze|strike|bolt|shot|impact|slash)s? (?:to|on|into|across|against) your\b/i,
];

/** Nouns after an ordinal that are not a fighter ("the second strike"). */
const NOT_A_FIGHTER = 'strike|blow|cut|bolt|shot|time|attempt|exchange|swing|thrust|step|moment|pass|parry|volley|attack|lunge|wave|round|one of|of';
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const DAMAGE = /\b(carv\w*|cut\w*|slic\w*|cleav\w*|slash\w*|hack\w*|bisect\w*|sever\w*|destroy\w*|shatter\w*|impal\w*|pierc\w*|skewer\w*|fell\w*|drop\w*|kill\w*|slay\w*|finish\w*|dispatch\w*|shear\w*|dismantl\w*|demolish\w*|obliterat\w*|decapitat\w*|wreck\w*|smash\w*|rend\w*|rent|split\w*|(?:tear|tears|tore|rip|rips|ripped) (?:\w+ )?(?:through|apart)|tak\w+ (?:\w+ )?(?:out|down)|took (?:\w+ )?(?:out|down)|goes down|falls?|collaps\w*|crumpl\w*|toppl\w*|disabl\w*|wound\w*|sear\w*|burn\w*|maim\w*)\b/i;

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

/** A kill or destruction verb (rule 3b): the strong subset of DAMAGE (not "falls" or "wounds"). */
const KILL = /\b(shear\w*|carv\w* (?:\w+ ){0,2}through|cut\w* (?:\w+ ){0,2}(?:down|through|apart|in (?:two|half))|slic\w* (?:\w+ ){0,2}(?:through|apart|in (?:two|half))|cleav\w*|bisect\w*|destroy\w*|fell(?:s|ed)?|drop(?:s|ped|ping)? (?:it|him|her|them|the)\b|dismantl\w*|demolish\w*|obliterat\w*|decapitat\w*|behead\w*|(?:tear|tears|tore|tearing|rip|rips|ripped|ripping) (?:\w+ ){0,2}(?:through|apart)|split\w* (?:it|him|her|them|the \w+) (?:in two|apart|open)|wreck\w*|reduc\w* (?:it|them|the \w+) to (?:scrap|slag|pieces)|cut\w* (?:it|him|her|them) down|shatter\w* (?:its|the) (?:chassis|head|torso))/i;
/** A kill verb as the purpose of a move ("to cut down", "to carve through"): rule 3b skips it. */
const KILL_AIM = new RegExp(`\\b(?:to|meant to|aiming to|trying to) (?:\\w+ )?(?:${KILL.source})`, 'i');
/** Plain negation in a clause (rules 3b and 9): "never slips", "without losing footing", "does not stumble". */
const NEGATED = /\b(no|not|never|nor|without|neither|doesn't|does not|didn't|did not|don't|do not|refus\w*|keep\w* (?:your|his|her|their|its) (?:footing|balance|feet)|regain\w*|steady|steadies|steadied|sure-footed)\b/i;
/**
 * Rule 9 (D-201 in code; rewritten after combat pass 3, D-236): only the body counts. Footing terms are a slip of the
 * feet, the balance or the grip; "your focus slips", "the moment slips away" and "slips past his guard" are not.
 */
const FOOTING: readonly RegExp[] = [
  /\b(?:footing|footwork|balance|feet|foot|grip) (?:\w+ ){0,2}?(?:falter\w*|slip\w*|giv\w+ way|gave way|betray\w*|fail\w*|skid\w*)\b/i,
  /\blos(?:e|es|ing|t) (?:\w+ ){0,2}?(?:footing|balance|grip)\b/i,
  /\b(?:falter\w*|unsteady) (?:\w+ )?(?:footing|footwork)\b/i,
  /\bslip(?:s|ped|ping)? (?:(?!past|through|under|inside|between|beneath|behind|around|away|free|into|out|by)\w+ ){0,3}?on (?:the|a|an|some|loose|wet|slick|uneven|broken|his|her|its|their|your)\b/i,
  /\btrip(?:s|ped|ping)?\b/i,
  /\bmis-?step\w*\b/i,
  // A stumble on or over something is a slip of the feet whatever else happened ("stumbles over the uneven terrain").
  /\bstumbl\w* (?:\w+ ){0,2}?(?:on|over) (?:the|a|an|some|loose|wet|slick|uneven|broken|his|her|its|their|your)\b/i,
];
/**
 * How a fighter reacts to being hit, pushed, choked or knocked down: fine when the block has that on the fighter.
 * "Off balance" and "staggers" alone never fire ("he catches you off balance" is being outpaced).
 */
const REACTION = /\b(stumbl\w*|(?:you|he|she|it|they) (?:fall|falls|fell) (?:to the (?:ground|floor|deck|dirt|stone|grass|snow|ice)|flat|hard|heavily|backwards?|on (?:the|his|her|its|their|your))|drop\w* to (?:one|his|her|its|their|your) knees?)\b/i;
const SECOND_PERSON = /\b(you|your|yours|yourself)\b/;
const THIRD_PERSON = /\b(he|she|it|they|his|her|its|their|him|them|himself|herself|itself|opponent|foe|enemy|adversary)\b/;

/** What the block has on each side that explains a stumble or a fall (rule 9). */
interface SlipCauses {
  /** A terrain accident, a knockdown, a Push or a thrown object: footing really lost. */
  footing: { pc: boolean; opp: boolean };
  /** Those, or any hit, Choke or lightning: stumbling back, off balance, going down. */
  reaction: { pc: boolean; opp: boolean };
}

function slipCauses(c: CombatDraft, facts: CombatFacts): SlipCauses {
  const pcName = (c.fighters.find((f) => f.id === 'pc')?.name ?? '').toLowerCase();
  const footing = { pc: false, opp: false };
  const reaction = { pc: false, opp: false };
  for (const n of c.notes) {
    if (!n.startsWith('terrain: ')) continue;
    if (pcName && n.toLowerCase().includes(pcName)) footing.pc = true;
    else footing.opp = true;
  }
  for (const r of c.narrate) {
    if (r.maneuver?.kind === 'knockdown') footing[r.maneuver.by === 'A' ? 'opp' : 'pc'] = true;
    if (r.force?.success) {
      const on = r.force.side === 'A' ? 'opp' : 'pc';
      if (r.force.kind === 'push' || r.force.kind === 'throw') footing[on] = true;
      if (r.force.kind === 'choke' || r.force.kind === 'lightning') reaction[on] = true;
    }
  }
  for (const h of facts.hits) reaction[h.byPlayer ? 'opp' : 'pc'] = true;
  reaction.pc ||= footing.pc;
  reaction.opp ||= footing.opp;
  return { footing, reaction };
}

/** Whose body a clause is about at `index`: the last "you" or "he / it / a name" before it, in the clause, else in the sentence. */
function subjectAt(sentence: string, clause: string, index: number, oppNames: RegExp | null): 'pc' | 'opp' {
  const last = (text: string): 'pc' | 'opp' | null => {
    let at = -1;
    let who: 'pc' | 'opp' | null = null;
    for (const [re, side] of [[SECOND_PERSON, 'pc'], [THIRD_PERSON, 'opp'], [oppNames, 'opp']] as const) {
      if (!re) continue;
      for (const m of text.matchAll(new RegExp(re.source, 'gi'))) {
        if (m.index > at) {
          at = m.index;
          who = side;
        }
      }
    }
    return who;
  };
  const start = Math.max(0, sentence.indexOf(clause));
  return last(clause.slice(0, index)) ?? last(sentence.slice(0, start + index)) ?? last(clause) ?? 'pc';
}

/** The slip in a clause that the block does not explain (rule 9), or null. */
function unexplainedSlip(sentence: string, clause: string, causes: SlipCauses, oppNames: RegExp | null): string | null {
  if (NEGATED.test(clause)) return null;
  for (const re of FOOTING) {
    const m = re.exec(clause);
    if (m && !causes.footing[subjectAt(sentence, clause, m.index, oppNames)]) return m[0];
  }
  const m = REACTION.exec(clause);
  if (m && !causes.reaction[subjectAt(sentence, clause, m.index, oppNames)]) return m[0];
  return null;
}
/** The outcome list's wording in prose (rule 10): severity labels, margins, tracks, beats, upper-case labels. */
// Labels on any blow (D-242; pass 3: "a severe stroke", "a critical slug", "a severe impact").
const SEVERITY_LABEL = /\b(?:a|an|the|another|one|his|her|its|their|your)\s+(?:[a-z-]+,?\s+){0,2}?(minor|moderate|severe|critical),?\s+(?:[a-z-]+,?\s+)?(wound|strike|blow|hit|cut|graze|injury|burn|gash|stroke|impact|slug|shot|bolt|thrust|slash)s?\b|\bmortal (strike|blow|hit|stroke|shot|thrust)s?\b/i;
/** "drains your stamina", "taxing its stamina", "strains his stamina" (D-242): the block's "stamina only" in prose. */
// The verb only: "a drain on his stamina" (a noun) has no natural swap and is left alone.
const STAMINA_PHRASE = /(?<!\b(?:a|an|the) )\b(drain|tax|strain|sap|test|wear|tire)(s|es|ed|ing)?\b(?:\s+(?:on|at|down))?\s+(your|his|her|its|their|the \w+'s)\s+stamina\b/i;
/** Natural words for a stamina phrase: "wears you down", "wearing him down". */
function staminaWords(m: RegExpExecArray): string {
  const tense = m[2] === 'ing' ? 'wearing' : m[2] === 'ed' ? 'wore' : m[2] ? 'wears' : 'wear';
  const who: Record<string, string> = { your: 'you', his: 'him', her: 'her', its: 'it', their: 'them' };
  const w = m[3]!.toLowerCase();
  return `${tense} ${who[w] ?? m[3]!.replace(/'s$/, '')} down`;
}
const ENGINE_TERMS: readonly [RegExp, string][] = [
  [/\bmargin\b/i, 'margin'],
  [/\badvantage track\b|\btrack (?:moves|moved|swings|swung|shifts|shifted)\b/i, 'track'],
  [/\b(?:quiet|narrated|next|this) beat\b/i, 'beat'],
  [/\bexchange (?:#|no\.? ?)?\d+\b|#\d+\b|\bbuild-?up exchange\b/i, 'exchange'],
  [/\b(?:DONE|NO HIT|NOT REACHED|FAILED)\b|\bHIT\b/, 'labels'],
  [/\bstamina only\b|\b(?:the )?roll(?:s|ed)? (?:fell|falls|falling) short\b|\bshort of the difficulty\b|\bDC \d/i, 'engine wording'],
  // "drains your stamina" (D-242); the repair swaps it for natural words.
  [STAMINA_PHRASE, 'stamina'],
  // The step list in prose: "you do not reach your intended strikes", "your remaining sequence" (D-242).
  [/\bintended (?:strikes?|steps?|attacks?|cuts?)\b|\byour (?:remaining|planned|whole) sequence\b/i, 'step list'],
];
/** The first outcome-list term in a sentence, or null. */
export function mechanicalTerm(sentence: string): string | null {
  const label = SEVERITY_LABEL.exec(sentence);
  if (label) return label[0].trim();
  for (const [re] of ENGINE_TERMS) {
    const m = re.exec(sentence);
    if (m) return m[0];
  }
  return null;
}
/** "two quick cuts", "three swift strikes" (rule 12). */
const COUNTED_STRIKES = /\b(two|three|four|five|both)\s+(?:[a-z-]+,?\s+){0,2}?(cuts|strikes|blows|slashes|thrusts|swings|attacks|lunges)\b/i;
const NUMBER_WORDS: Readonly<Record<string, number>> = { two: 2, both: 2, three: 3, four: 4, five: 5 };
/** Natural words for a severity label in the fallback (rule 10): the severity is kept, the label is not. */
const SEVERITY_PROSE: Readonly<Record<string, string>> = { minor: 'light', moderate: 'deep', severe: 'grievous', critical: 'terrible', mortal: 'deadly' };

/** The player character firing a ranged weapon (rule 13): a shot taken, or "your bolt" in the air. */
const PLAYER_FIRES = /\byou\b[^.]{0,120}?\b(?:fire back|return fire|open fire|fire (?:a|an|off|two|three|twice|again|at|toward|towards|into|from|blindly|wildly|once)|shoot|shoots|shooting|squeez\w+ (?:off|the trigger)|snap\w* off (?:a|an|two)|pull\w* the trigger|loos\w+ (?:a|an|two) (?:shot|bolt)s?)\b|\byour (?:\w+ )?(?:bolt|shot|blast)s?\b/i;
/** What a Force action looks like when it worked (rule 14): only the visible effect, never the attempt. */
const FORCE_EFFECT: Readonly<Record<string, RegExp>> = {
  push: /\b(?:hurl\w*|throw\w*|send\w*|sent|slam\w*|knock\w*|fling\w*|flung|toss\w*|blast\w*|shov\w*|driv\w+)\b[^.]{0,50}?\b(?:back(?:ward|wards)?|off (?:his|her|its|their) feet|flying|sprawling|crashing|tumbling|reeling|to the (?:ground|floor|deck)|into the|across the)\b/i,
  choke: /\b(?:gasp\w*|chok\w+ (?:for|on)|claw\w* at (?:his|her|its|their) (?:throat|neck)|lift\w* (?:him|her|it|them) off|(?:throat|windpipe) (?:clos\w+|constrict\w*|crush\w*)|struggl\w+ (?:for|to) breath\w*)\b/i,
  lightning: /\b(?:lightning|bolts?|arcs?)\b[^.]{0,70}?\b(?:strik\w+|struck|slam\w*|lash\w*|sear\w*|burn\w*|scorch\w*|engulf\w*|wrack\w*|convuls\w*|crackl\w+ (?:over|across|through))\b[^.]{0,40}?\b(?:him|her|it|them|his|its|their|the \w+'s)\b/i,
  throw: /\b(?:rock|stone|boulder|log|branch|crate|debris|chunk|timber|machinery|slab|rubble)\b[^.]{0,60}?\b(?:slam\w*|crash\w*|smash\w*|strik\w+|struck|hit|hits|catch\w*|crush\w*)\b[^.]{0,30}?\b(?:him|her|it|them|into|against)\b/i,
  recall: /\b(?:saber|lightsaber|hilt|weapon|blade)\b[^.]{0,60}?\b(?:leap\w*|flies|fly|flew|snap\w*|return\w*|slap\w*|smack\w*|spin\w*|land\w*)\b[^.]{0,20}?\b(?:in|into|to) your (?:\w+ )?(?:hand|palm|grip|grasp)\b/i,
  saberThrow: /\b(?:saber|lightsaber|hilt|weapon|blade)\b[^.]{0,60}?\b(?:loop\w*|return\w*|arc\w*|spin\w*|snap\w*|fl(?:ies|y|ew))\b[^.]{0,20}?\bback (?:in|into|to) your (?:\w+ )?(?:hand|palm|grip|grasp)\b/i,
};
/** A weapon named in prose that nobody in the fight carries (rule 16b): only the unmistakable ones. */
const WEAPON_WORDS: readonly [RegExp, readonly string[], string][] = [
  [/\bscatter ?guns?\b/i, ['scatterGun'], 'a scatter gun'],
  [/\bslugthrowers?\b/i, ['slugPistol', 'slugRifle'], 'a slugthrower'],
];
/** Blades meeting (rule 16c). */
const BLADES_LOCK = /\b(?:lock\w* blades|clash\w* blades|blades? (?:lock|locks|locked|locking|clash|clashes|clashed|clashing|meet|meets|met|meeting|cross|crosses|crossed|crossing))\b/i;
const SURVIVOR_NOUNS = ['opponent', 'foe', 'enemy', 'attacker', 'soldier', 'survivor', 'fighter', 'automaton', 'machine', 'figure'];

function combatIssues(narrative: string, c: CombatDraft, facts: CombatFacts): NarrationIssue[] {
  const out: NarrationIssue[] = [];
  const sentences = sentencesOf(narrative);
  const anyLost = c.fighters.some((f) => f.lostParts.length > 0);
  const playerHitSomeone = facts.hits.some((h) => h.byPlayer);
  const minions = c.fighters.filter((f) => f.minion && f.id !== 'pc');
  const minionHitByPlayer = facts.hits.some((h) => h.byPlayer && minions.some((m) => m.id === h.targetId)) || c.narrate.some((r) => r.force?.stoodDown);
  const minionNouns = [...new Set(minions.flatMap((m) => m.name.toLowerCase().replace(/\s+\d+$/, '').split(/\s+/).slice(-1)))];
  const minionNounRe = minionNouns.length ? new RegExp(`\\b(${[...minionNouns, 'chassis', 'automaton', 'machine'].join('|')})s?\\b`, 'i') : null;
  const causes = slipCauses(c, facts);
  const oppWords = [...new Set(c.fighters.filter((f) => f.id !== 'pc').flatMap((f) => f.name.toLowerCase().split(/[^a-z']+/).filter((w) => w.length >= 4)))];
  const oppNames = oppWords.length ? new RegExp(`\\b(${oppWords.join('|')})s?\\b`) : null;
  const pcView = c.fighters.find((f) => f.id === 'pc');
  const pcUnarmored = pcView?.armor !== undefined && pcView.armor === 'none';
  const strikesMade = facts.steps.filter((st) => /^strike/.test(st.label) && st.status !== 'NOT REACHED').length;
  const strikesNotReached = facts.steps.some((st) => /^strike/.test(st.label) && st.status === 'NOT REACHED');
  // Rules 13 to 16 (D-237).
  const pcName = c.fighters[0]?.name ?? 'the player character';
  const noShot = playerShotNotReached(c);
  const forceUses = c.narrate.filter((r) => r.kind === 'force' && r.force && r.force.side === 'A').map((r) => r.force!);
  // A failed kind with no success of its own in the passage. The saber back in hand is one picture for a throw and a
  // recall, so either one succeeding excuses it for both.
  const saberBack = forceUses.some((f) => f.success && (f.kind === 'recall' || f.kind === 'saberThrow'));
  const failedForce = [...new Set(forceUses.filter((f) => !f.success).map((f) => f.kind as string))].filter((k) => !forceUses.some((f) => f.success && f.kind === k) && !(saberBack && (k === 'recall' || k === 'saberThrow')));
  const playerGained = c.narrate.some((r) => r.advAfter > r.advBefore || r.maneuver?.by === 'A') || playerHitSomeone || forceUses.some((f) => f.success);
  const oppAlt = [...oppWords, 'opponent', 'foe', 'enemy', 'adversary'].join('|');
  const oppGivesGround = new RegExp(
    String.raw`\b(?:he|she|it|they|${oppAlt})\b[^,;.]{0,50}?\b(?:gives?|giving|gave|yields?|yielding|cedes?|ceding) (?:\w+ )?(?:ground|an inch|a step)\b` +
      // "you drive him back", never "to drive him back" (an aim) or "driving you back" (you are the one driven).
      String.raw`|\byou\b[^,;.]{0,50}?(?<!\bto )\b(?:driv\w+|drove|forc\w+|push\w*|press\w*|shov\w*|back\w*) (?:him|her|it|them|the (?:${oppAlt})|${oppAlt})(?: \w+)? back\b` +
      String.raw`|(?<!\b(?:driv\w+|drove|forc\w+|push\w+|press\w+|shov\w+|pin\w*|keep\w*|hold\w*) )\byou (?:\w+ ){0,3}?(?<!\bto )(?:claim\w*|gain\w*|seiz\w+|win|wins|winning|won) (?:\w+ )?ground\b`,
    'i',
  );
  const standing = c.fighters.filter((f) => f.id !== 'pc' && !f.out && !f.engagedElsewhere);
  const survivorNouns = [...new Set([...oppWords, ...SURVIVOR_NOUNS])].join('|');
  const survivor = new RegExp(String.raw`\bthe (?:sole |lone |one |single )?(?:surviving|last|final|only|remaining|lone|sole) (?:\w+ )?(?:${survivorNouns})\b(?!s)|\bthe only one (?:left|standing|remaining)\b|\bthe last (?:one|of them)\b|\bthe (?:lone|sole) survivor\b`, 'i');
  const carried = new Set(c.fighters.map((f) => f.weapon));
  const oppBlade = c.fighters.some((f) => f.id !== 'pc' && ['lightsaber', 'trainingSaber', 'melee'].includes(f.weapon));
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
    // 3b. A minion cut down when the player hit no minion at all (D-211): "you ... the nearest war droid ... shearing
    // cleanly through its metallic chassis". Unnamed ("the nearest droid", "its chassis"), so read by the minion nouns.
    if (!minionHitByPlayer && minionNouns.length && /\b(you|your)\b/i.test(s) && minionNounRe!.test(s)) {
      // "to cut down the nearest droid" is the aim of a move, not its result.
      const killClause = clausesOf(s).find((cl) => KILL.test(cl) && !KILL_AIM.test(cl) && !NOT_AN_EVENT.test(cl) && !NEGATED.test(cl));
      if (killClause) add('minionNotHit', 'you hit no minion in this passage: no droid, trooper or other minion is cut down, carved through or destroyed', s);
    }
    // 9. A slip of the feet, the balance or the grip that the block does not explain (D-201 enforced; D-211, D-236).
    for (const cl of clausesOf(s)) {
      if (!unexplainedSlip(s, cl, causes, oppNames)) continue;
      add('slipNoHazard', 'the block lists no terrain accident, knockdown or hit that explains it: nobody slips, stumbles, trips or loses footing or grip; explain each miss only with the reason the block gives', s);
      break;
    }
    // 11. The player's armor when the block gives them none (D-216).
    if (pcUnarmored && /\byour (armor|armour|beskar|plating|breastplate|chest plate|vest)\b/i.test(s) && !NEGATED.test(s)) add('gearNotInBlock', 'the player character wears no armor in this fight: describe none', s);
    // 12. More strikes told than the player made (D-216): "two swift cuts ... parries each blow" when the second strike step was NOT REACHED.
    if (strikesNotReached) {
      const m = COUNTED_STRIKES.exec(s);
      if (m && (NUMBER_WORDS[m[1]!.toLowerCase()] ?? 0) > strikesMade && !NOT_DONE.test(s)) add('stepNotReached', `the player character made ${strikesMade} strike${strikesMade === 1 ? '' : 's'} here and the rest were NOT REACHED: describe ${strikesMade === 1 ? 'one' : strikesMade}, not ${m[1]}`, s);
    }
    // 13. A shot the player character never took (D-237): the strike step was NOT REACHED and nothing was fired.
    if (noShot && !NOT_DONE.test(s) && PLAYER_FIRES.test(s)) add('stepNotReached', `${pcName}'s strike was NOT REACHED: no shot was fired in this passage, so describe none (no bolt of theirs flies, hits or misses)`, s);
    // 14. A Force action that FAILED told with its effect (D-237): the push that throws him back, the saber back in hand.
    for (const kind of failedForce) {
      const effect = FORCE_EFFECT[kind];
      if (!effect) continue;
      // The saber's flight spans clauses ("leaps from the floor, spinning into your palm"): read by the sentence.
      const ownSaber = kind === 'recall' || kind === 'saberThrow';
      const clean = (x: string): boolean => effect.test(x) && !NOT_AN_EVENT.test(x) && !NOT_DONE.test(x) && !NEGATED.test(x);
      const shown = ownSaber ? clean(s) : clausesOf(s).some(clean);
      // A push's effect needs the push in the same sentence: a body driven back by a blade is not a Force push.
      const sameAction = ownSaber || (FORCE_PROSE[kind]?.test(s) ?? false);
      if (shown && sameAction) add('stepFailed', `the ${FORCE_NAME[kind] ?? (kind === 'recall' ? 'saber recall' : kind)} FAILED in this passage: it had no effect, so describe none`, s);
    }
    // 15. Ground given to the wrong side (D-237; pass 3: "Kade smoothly gives ground" when Kade gained it).
    if (!playerGained && clausesOf(s).some((x) => oppGivesGround.test(x) && !NOT_AN_EVENT.test(x) && !NEGATED.test(x))) add('groundReversed', `${pcName} gained no ground in this passage (the track never moved their way): the opponent does not give ground, yield or get driven back`, s);
    // 16. "The surviving X", "the last X", "the only one left" while more than one opponent stands (D-237).
    if (standing.length > 1 && survivor.test(s) && !NEGATED.test(s)) add('survivorCount', `${standing.length} opponents are still standing (${standing.map((f) => f.name).join(', ')}): nobody is "the last", "the surviving" or "the only one left"`, s);
    // 16b. A weapon nobody in this fight carries (D-237; pass 3: a scatter gun from the fight before).
    for (const [re, weaponKinds, word] of WEAPON_WORDS) {
      if (re.test(s) && !weaponKinds.some((k) => carried.has(k)) && !NEGATED.test(s)) add('gearNotInBlock', `nobody in this fight carries ${word}: only the weapons the block lists`, s);
    }
    // 16c. Blades locked with an opponent who has none (D-242; pass 3: a B1 "locking blades").
    if (!oppBlade && BLADES_LOCK.test(s) && !NEGATED.test(s)) add('gearNotInBlock', 'no opponent in this fight carries a blade: nobody locks or clashes blades with the player character (they shoot, or fight with what the block lists)', s);
    // 10. Engine and outcome-list terms in the prose (D-205 R5, enforced D-211).
    const term = mechanicalTerm(s);
    if (term) add('mechanicalTerms', `"${term}" is the outcome list's wording, not prose: show the wound and the moment instead (a deep cut, a grievous wound), never margins, tracks, beats or labels`, s);
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
  /** Everyone in the scene whose body has lost something (D-237), from the state. In a fight the fighters' views come first. */
  lasting?: readonly LastingView[];
  /** The player's captors while a prisoner (D-242): their kind and its noun. */
  captors?: { kind: string | null; noun: string; group: string } | null;
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

/** Words of taking or holding a prisoner (rule 18). */
const CAPTURE_WORDS = /\b(?:captor\w*|captive\w*|prisoner\w*|seiz\w+|grip\w*|grab\w*|grasp\w*|drag\w*|haul\w*|bind\w*|binders|bound|restrain\w*|shackl\w*|manacl\w*|march\w* you|escort\w*|led away|lead you|take you|takes you|taking you|took you|hold you|holds you|close in|closes in|surround\w*)\b/i;
/** Minion kind nouns (rule 18), as the kinds' labels end. */
const KIND_NOUNS = ['droid', 'trooper', 'warrior', 'thug', 'brawler', 'beast', 'acolyte', 'droideka', 'militia', 'soldier', 'mercenar'];

/**
 * Rule 18 (D-242; pass 3: line troopers captured a Padawan and "the remaining war droids" seized her): a sentence about
 * taking or holding the prisoner names the captors' kind, not another. Only when the captors are a minion kind; a
 * sentence that also names the captors' own noun is left alone.
 */
export function captorIssues(narrative: string, captors: { kind: string | null; noun: string; group: string } | null): NarrationIssue[] {
  if (!captors?.kind) return [];
  const out: NarrationIssue[] = [];
  const own = new RegExp(`\\b${captors.noun}s?\\b`, 'i');
  for (const s of sentencesOf(narrative)) {
    if (!CAPTURE_WORDS.test(s) || own.test(s)) continue;
    const other = KIND_NOUNS.find((n) => n !== captors.noun && new RegExp(`\\b${n}\\w*\\b`, 'i').test(s));
    if (other) out.push({ kind: 'captorsWrong', text: `the player character was captured by ${captors.group}: the captors are ${captors.noun}s, not ${other}s`, sentence: s });
  }
  return out;
}

/** A fighter whose body has lost something (D-237): from the fight's views or the state (context.lastingStates). */
export interface LastingView {
  name: string;
  pc: boolean;
  cannotStand: boolean;
  missing: readonly string[];
}

/** Getting up, in words that can only be about a third person ("pull himself up", "to his feet", "help him up"). */
const STAND_REFLEXIVE_3 = /\b(?:(?:pull|haul|push|lever|lift|climb|clamber|scrambl|stagger|get|rise|rais)\w* (?:(?:himself|herself|itself|themselves) )?(?:(?:back )?(?:up|upright)\b|(?:back )?(?:to|onto) (?:his|her|its|their) feet)|(?:back )?(?:on|onto|to) (?:his|her|its|their) feet|(?:help|haul|pull|lift)\w* (?:him|her|it|them) (?:up|upright|to (?:his|her|its|their) feet))\b/i;
const STAND_REFLEXIVE_2 = /\b(?:(?:pull|haul|push|lever|lift|climb|clamber|scrambl|stagger|get|rise)\w* (?:yourself )?(?:back )?(?:to|onto) your feet|(?:pull|haul|push|lever) yourself (?:up|upright)|(?:back )?(?:on|onto|to) your feet)\b/i;
/** Standing or moving on legs, whoever does it: read with the clause's subject. */
const STAND_PLAIN = /\b(?:stands? up|stands? tall|stands? again|rises?|rising|walks?|walking|strides?|striding|runs?|running|sprints?|sprinting|paces?|pacing|steps? (?:forward|back|toward|towards|away|aside|in|out|closer)|leaps?|leaping|kicks?|kicking|charges?|charging|lunges?|lunging)\b/i;
/** A failed or impossible attempt, or the injury itself: not standing. */
const NOT_STANDING = /\b(?:tr(?:y|ies|ying|ied)|attempt\w*|fail\w*|cannot|can't|unable|struggl\w*|collaps\w*|crumpl\w*|never|not|no|without|would|could|if|stump|sever\w*|missing|gone|lost|drag\w*|crawl\w*)\b/i;
const MISSING_TALK = /\b(?:stump|sever\w*|missing|gone|lost|ruin\w*|cauteri\w*|where|empty|remain\w*|used to|once)\b/i;
const THIRD_ANY = /\b(?:he|she|it|they|his|her|its|their|him|them|himself|herself|itself|themselves)\b/i;
/** A capitalized word after the first: the sentence names someone or somewhere else. */
const namesSomeoneElse = (sentence: string): boolean => /\b(?!I\b)[A-Z][a-z]{2,}\b/.test(sentence.replace(/^\W*\w+/, ''));

/**
 * Rule 17 (D-237; pass 3: a duelist with a severed arm and leg "taking your hand to pull himself up"): a fighter who
 * cannot stand does not stand up, walk, kick or get helped to their feet, and a missing arm or hand is not used. Who a
 * sentence is about: the one fighter named in it, or, for a sentence with only pronouns, the one named just before.
 */
export function lastingIssues(narrative: string, list: readonly LastingView[]): NarrationIssue[] {
  const out: NarrationIssue[] = [];
  if (!list.length) return out;
  // A fighter is named by the full name only (D-247; pass 4: "Duelist 9 steps forward" was read as Duelist 37, who had
  // lost a leg, because the two names share the word "Duelist"). "Duelist 3" is not "Duelist 37" either.
  const named = list
    .filter((l) => !l.pc && l.name.trim().length > 0)
    .map((l) => ({ l, re: new RegExp(`(?<![\\w-])${l.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}(?![\\w-])`, 'i') }));
  const pc = list.find((l) => l.pc) ?? null;
  const lacks = (l: LastingView, side: string, limb: string): boolean => l.missing.some((p) => p.toLowerCase() === `${side}${limb}`);
  const upper = (l: LastingView): boolean => l.missing.some((p) => /Arm$|Hand$/.test(p));
  const flag = (l: LastingView, what: string, s: string): void => {
    if (!out.some((x) => x.sentence === s)) out.push({ kind: 'lastingState', text: `${l.name} ${what}`, sentence: s });
  };
  let referent: (typeof named)[number] | null = null;
  for (const s of sentencesOf(narrative)) {
    const here = named.filter((n) => n.re.test(s));
    let third: (typeof named)[number] | null = null;
    if (here.length === 1) third = referent = here[0]!;
    else if (here.length > 1) referent = null;
    else if (namesSomeoneElse(s)) referent = null;
    else if (THIRD_ANY.test(s)) third = referent;
    for (const cl of clausesOf(s)) {
      if (third) {
        const t = third.l;
        if (t.cannotStand && !NOT_STANDING.test(cl)) {
          const plain = STAND_PLAIN.exec(cl);
          if (STAND_REFLEXIVE_3.test(cl) || (plain && subjectAt(s, cl, plain.index, third.re) === 'opp')) flag(t, 'cannot stand (a leg is gone): they stay down; no standing up, walking, kicking or being helped to their feet', s);
        }
        if (upper(t) && !MISSING_TALK.test(cl)) {
          const m = /\b(?:his|her|its|their) (right|left) (arm|hand|fist|fingers)\b/i.exec(cl);
          const limb = m && /arm/i.test(m[2]!) ? 'arm' : 'hand';
          if (m && lacks(t, m[1]!.toLowerCase(), limb)) flag(t, `has no ${m[1]!.toLowerCase()} ${limb}: it is not used, raised or gripped with`, s);
          const both = /\b(?:both (?:of (?:his|her|its|their) )?(?:hands|arms|fists)|two-handed|with two hands)\b/i.exec(cl);
          if (both && subjectAt(s, cl, both.index, third.re) === 'opp') flag(t, 'has lost an arm or a hand: nothing is done with both hands', s);
        }
      }
      if (pc) {
        if (pc.cannotStand && !NOT_STANDING.test(cl)) {
          const plain = STAND_PLAIN.exec(cl);
          if (STAND_REFLEXIVE_2.test(cl) || (plain && /\byou\b/i.test(cl) && subjectAt(s, cl, plain.index, null) === 'pc')) flag(pc, 'cannot stand (a leg is gone): no standing up, walking, kicking or getting to their feet', s);
        }
        if (upper(pc) && !MISSING_TALK.test(cl)) {
          const m = /\byour (right|left) (arm|hand|fist|fingers)\b/i.exec(cl);
          const limb = m && /arm/i.test(m[2]!) ? 'arm' : 'hand';
          if (m && lacks(pc, m[1]!.toLowerCase(), limb)) flag(pc, `has no ${m[1]!.toLowerCase()} ${limb}: it is not used`, s);
          if (/\b(?:both (?:of your )?(?:hands|arms|fists)|with two hands)\b/i.test(cl) && /\byour?\b/i.test(cl)) flag(pc, 'has lost an arm or a hand: nothing is done with both hands', s);
        }
      }
    }
  }
  return out;
}

/**
 * Who has lost what, as the narration must respect it (rule 17). In a fight: each fighter's state at the start of the
 * passage (a limb severed in this passage is the hit rules' business; the fighter was whole until then). Outside a
 * fight: the state's list.
 */
function lastingViews(c: CombatDraft | null, fromState: readonly LastingView[]): LastingView[] {
  if (!c) return [...fromState];
  const facts = combatFacts(c);
  const out: LastingView[] = [];
  for (const f of c.fighters) {
    if (!f.lasting?.missing.length) continue;
    const now = facts.hits.filter((h) => h.severed && h.targetId === f.id).map((h) => h.part);
    const justLost = (p: string): boolean => now.some((n) => n === p || (n.endsWith('Arm') && p === n.replace('Arm', 'Hand')));
    const missing = f.lasting.missing.filter((p) => !justLost(p));
    if (missing.length) out.push({ name: f.name, pc: f.id === 'pc', cannotStand: missing.some((p) => p.endsWith('Leg')), missing });
  }
  const names = new Set(c.fighters.map((f) => f.name));
  return [...out, ...fromState.filter((l) => !names.has(l.name))];
}

/** The words of a sentence for the repeat check: lower case letters and digits only. */
const wordsOf = (s: string): string[] => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
/** Word overlap of two texts: shared words over the larger set (1.0 = the same words). */
function overlap(a: readonly string[], b: readonly string[]): number {
  if (!a.length || !b.length) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / Math.max(A.size, B.size);
}
/** A sentence counts as repeated at this word overlap with a sentence of the previous reply (D-210). */
export const REPEAT_SENTENCE = 0.8;
/** The narration repeats the previous reply when this share of its sentences are repeats, or the whole text overlaps this much. */
export const REPEAT_SHARE = 0.6;
/** A reply shorter than this is not checked for repeats (a stock line, a one-sentence beat). */
export const REPEAT_MIN_WORDS = 25;

/**
 * Rule 8 (D-210, combat pass 2 issue 9): the narration repeats the previous reply word for word or nearly (the narrator
 * did so when RESOLVED was empty). One issue per repeated sentence, so the fallback can drop them; only when most of
 * the reply repeats, never for one recurring phrase.
 */
export function repeatedIssues(narrative: string, previous: string): NarrationIssue[] {
  const prev = sentencesOf(previous).map(wordsOf).filter((w) => w.length >= 5);
  const now = sentencesOf(narrative);
  if (!prev.length || !now.length || wordsOf(narrative).length < REPEAT_MIN_WORDS) return [];
  const repeats = now.filter((s) => {
    const w = wordsOf(s);
    return w.length >= 5 && prev.some((p) => overlap(w, p) >= REPEAT_SENTENCE);
  });
  const whole = overlap(wordsOf(narrative), wordsOf(previous));
  if (repeats.length / now.length < REPEAT_SHARE && whole < 0.85) return [];
  const text = 'your narration repeats your previous reply nearly word for word: narrate only what RESOLVED says happened this turn, in new words';
  return (repeats.length ? repeats : now).map((sentence) => ({ kind: 'repeated' as const, text, sentence }));
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
export function checkNarration(narrative: string, draft: TurnDraft, woundedOrHealing: boolean, known: KnownWounds = { player: [] }, previous: string | null = null): NarrationIssue[] {
  const issues: NarrationIssue[] = [];
  if (previous) issues.push(...repeatedIssues(narrative, previous));
  if (draft.combat && !draft.combat.quiet) issues.push(...combatIssues(narrative, draft.combat, combatFacts(draft.combat)));
  if (woundedOrHealing) issues.push(...healingIssues(narrative, draft));
  issues.push(...misplacedIssues(narrative, draft, known));
  issues.push(...lastingIssues(narrative, lastingViews(draft.combat && !draft.combat.quiet ? draft.combat : null, known.lasting ?? [])));
  issues.push(...captorIssues(narrative, known.captors ?? null));
  return issues;
}

/** How a narration with issues was settled (the engine log says which). */
export interface NarrationSettled {
  narrative: string;
  how: 'reworded' | 'summary' | 'trimmed';
}
export type Recheck = (text: string) => readonly NarrationIssue[];

/**
 * The narration with only the outcome list's terms swapped (repairWording), when that alone settles every issue: the
 * result is checked again and must be clean (D-236). Null otherwise: the caller retries, then falls back.
 */
export function rewordable(narrative: string, issues: readonly NarrationIssue[], recheck: Recheck): string | null {
  if (!issues.length || !issues.every((i) => i.kind === 'mechanicalTerms')) return null;
  const reworded = repairWording(narrative);
  return reworded !== narrative && recheck(reworded).length === 0 ? reworded : null;
}

/**
 * A narration that still has issues, settled in code (D-197, D-209, D-236). Wording repair only swaps terms and never
 * removes a sentence, and its result is checked again; anything the swap cannot make consistent gets the combat summary
 * (never the engine's sentences). Outside a fight the offending sentences (an invented treatment, a repeated line) are
 * removed, as before.
 */
export function settleNarration(narrative: string, draft: TurnDraft, issues: readonly NarrationIssue[], recheck: Recheck): NarrationSettled {
  const reworded = rewordable(narrative, issues, recheck);
  if (reworded !== null) return { narrative: reworded, how: 'reworded' };
  const combatWrong = issues.some((i) => i.kind !== 'healingNotApplied' && !(i.kind === 'woundMisplaced' && !draft.combat));
  if (draft.combat && combatWrong) return { narrative: combatSummary(draft.combat).join(' '), how: 'summary' };
  const bad = new Set(issues.map((i) => i.sentence));
  const kept = sentencesOf(narrative).filter((s) => !bad.has(s));
  return { narrative: kept.length ? kept.join(' ') : 'Time passes as the engine recorded.', how: 'trimmed' };
}

/** settleNarration with the plain re-check (no known wounds, no previous reply). */
export function fallbackNarration(narrative: string, draft: TurnDraft, issues: readonly NarrationIssue[]): string {
  return settleNarration(narrative, draft, issues, (text) => checkNarration(text, draft, false)).narrative;
}

const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
const clipLine = (line: string): string => (line.length <= NARRATION_FALLBACK.maxLineChars ? line : `${line.slice(0, line.lastIndexOf(' ', NARRATION_FALLBACK.maxLineChars - 5))} ...`);
const woundWords = (h: HitFact): string => (h.severed ? `the ${partText(h.part)} severed` : h.severity ? `${h.severity} wound to the ${partText(h.part)}` : `a graze on the ${partText(h.part)}`);
const SEVERITY_RANK: Readonly<Record<string, number>> = { minor: 1, moderate: 2, severe: 3, critical: 4, mortal: 5 };

/**
 * The fallback's summary of a combat passage (D-209): at most NARRATION_FALLBACK.maxLines plain sentences: the count of
 * exchanges, hits and wounds each way, the key events (severed limbs, then the worst wounds, in exchange order), the
 * other wounds by location, the steps, and the end state. It stays short for a 300-exchange Resolve to end and never
 * contradicts the block (every wound's location is named).
 */
export function combatSummary(c: CombatDraft): string[] {
  const facts = combatFacts(c);
  const pc = c.fighters.find((f) => f.id === 'pc')?.name ?? 'You';
  const lines: string[] = [];
  const force = c.narrate.filter((r) => r.kind === 'force').length;
  const by = facts.hits.filter((h) => h.byPlayer);
  const on = facts.hits.filter((h) => !h.byPlayer);
  const wounding = (hs: HitFact[]): number => hs.filter((h) => h.severity || h.severed).length;
  lines.push(`${plural(c.narrate.length, 'exchange')} of fighting${force ? ` (${plural(force, 'use')} of the Force)` : ''}: ${pc} lands ${plural(by.length, 'hit')} (${wounding(by)} wounding) and takes ${plural(on.length, 'hit')} (${wounding(on)} wounding).`);
  // Key events: severed limbs first, then the worst wounds, told in exchange order.
  const ranked = [...facts.hits].filter((h) => h.severity || h.severed).sort((a, b) => Number(b.severed) - Number(a.severed) || (SEVERITY_RANK[b.severity ?? ''] ?? 0) - (SEVERITY_RANK[a.severity ?? ''] ?? 0) || a.n - b.n);
  const key = ranked.slice(0, NARRATION_FALLBACK.maxKeyEvents).sort((a, b) => a.n - b.n);
  const strikerOf = (h: HitFact): string => (h.byPlayer ? pc : (c.fighters.find((f) => f.id === c.narrate.find((r) => r.n === h.n)?.targetId)?.name ?? 'The opponent'));
  for (const h of key) lines.push(`${strikerOf(h)} hits ${h.targetName}: ${woundWords(h)}.`);
  // The other wounds by fighter and location, so none is left out (the check's woundOmitted rule).
  const rest = ranked.slice(NARRATION_FALLBACK.maxKeyEvents);
  if (rest.length) {
    const byTarget = new Map<string, string[]>();
    for (const h of rest.sort((a, b) => a.n - b.n)) byTarget.set(h.targetName, [...(byTarget.get(h.targetName) ?? []), woundWords(h)]);
    lines.push(clipLine(`Other wounds: ${[...byTarget].map(([t, w]) => `${t}, ${w.join(', ')}`).join('; ')}.`));
  }
  const missed = facts.didNotHappen.filter((d) => !d.startsWith('step ')).length;
  if (missed) lines.push(`${plural(missed, 'strike or attempt', 'strikes and attempts')} did not land.`);
  const steps = facts.steps;
  const done = steps.filter((st) => st.status !== 'NOT REACHED').map((st) => `${st.label} ${st.status === 'DONE' ? 'done' : 'failed'}`);
  if (done.length) lines.push(clipLine(`Steps: ${done.join('; ')}.`));
  const notReached = steps.filter((st) => st.status === 'NOT REACHED').map((st) => `${st.label} (${st.detail})`);
  if (notReached.length) lines.push(clipLine(`Not reached: ${notReached.join('; ')}.`));
  const standing = c.fighters.filter((f) => f.id !== 'pc' && !f.out && !f.engagedElsewhere).length;
  if (c.ended) lines.push(`The fight is over: ${c.ended.outcome}${c.ended.playerFate ? `; the opponent's choice: ${c.ended.playerFate}` : ''}.`);
  else lines.push(`The fight goes on: ${plural(standing, 'opponent')} still standing.`);
  // The end state always survives the cap.
  if (lines.length > NARRATION_FALLBACK.maxLines) return [...lines.slice(0, NARRATION_FALLBACK.maxLines - 1), lines[lines.length - 1]!];
  return lines;
}

/**
 * Wording repair (D-211, narrowed by D-236): the outcome list's terms are swapped for natural words and nothing else
 * changes. A severity label keeps its severity ("a painful, moderate wound" -> "a painful, deep wound"; "a mortal
 * strike" -> "a deadly strike"), so the wound and its place survive. No sentence is ever removed: one that still has an
 * engine term afterwards is left as it is, and the caller's re-check then falls back to the retry or the summary.
 */
export function repairWording(narrative: string): string {
  return sentencesOf(narrative)
    .map((sentence) => {
      let fixed = sentence;
      // Swap the severity word of each label, one label at a time (a sentence may hold several).
      for (let i = 0; i < 4; i++) {
        const m = STAMINA_PHRASE.exec(fixed);
        if (!m) break;
        fixed = fixed.slice(0, m.index) + staminaWords(m) + fixed.slice(m.index + m[0].length);
      }
      for (let i = 0; i < 8; i++) {
        const m = SEVERITY_LABEL.exec(fixed);
        if (!m) break;
        const label = m[0].replace(/\b(minor|moderate|severe|critical|mortal)\b/i, (w) => SEVERITY_PROSE[w.toLowerCase()] ?? w);
        if (label === m[0]) break;
        fixed = fixed.slice(0, m.index) + label + fixed.slice(m.index + m[0].length);
      }
      return fixed;
    })
    .join(' ');
}
