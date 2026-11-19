// The post-narration check (Jared, D-197; the V170 failure mode): before a narration is committed it is scanned for
// contradictions of the resolved block. Conservative by design: each rule fires only on a narrow, explicit pattern in a
// sentence with no negation ("nearly", "before you can", "misses"), so ordinary prose never trips it. Pure.
//
// Rules: (1) severing or limb loss with no sever in the block and no limb lost earlier; (2) the player's blade landing
// when the player hit nobody, or the player being hit when nobody hit the player; (3) a named minion cut down or
// carved through that was not hit and still stands; (4) a step marked NOT REACHED described as done (by the ability);
// (5) bacta or Force healing with no such care applied; (6) a wounding hit left out; (7) a wound placed on a body
// location the block does not have for that fighter.
import { NARRATION_FALLBACK } from '../data/combat.config';
import { partText } from '../engine/duel';
import { combatFacts, type CombatFacts, type HitFact } from './combatFacts';
import type { CombatDraft } from './combatTurn';
import { careApplied } from './context';
import type { TurnDraft } from './resolve';

export type NarrationIssueKind = 'sever' | 'hitNotInLog' | 'minionNotHit' | 'stepNotReached' | 'healingNotApplied' | 'woundOmitted' | 'woundMisplaced' | 'repeated' | 'slipNoHazard' | 'mechanicalTerms';
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
/** A slip, stumble, misstep or lost footing (rule 9). */
const SLIP = /\b(slip\w*|stumbl\w*|trip(?:s|ped|ping)?|misstep\w*|mis-step\w*|overextend\w*|over-extend\w*|los(?:e|es|ing|t) (?:\w+ )?(?:footing|balance|grip)|(?:footing|footwork|balance|grip|feet|foot) (?:\w+ )?(?:falter\w*|slip\w*|giv\w* way|gave way|betray\w*|fail\w*|skid\w*)|(?:falter\w*|unsteady|lose) (?:\w+ )?(?:footing|footwork)|footing faltering|lose your footing)\b/i;
/** A blade or bolt slipping past a guard, someone slipping away: not a slip of footing. */
const SLIP_PAST = /\bslip\w* (?:\w+ )?(?:past|through|under|inside|between|beneath|behind|around|away|free|into|out|by)\b|\bslip of (?:focus|concentration|attention|the mind|will)\b/i;
/** Staggering back from a Push, a thrown object or a knockdown the block lists (rule 9 exemption). */
const STUMBLE_FROM_PUSH = /\b(stumbl\w*|stagger\w*|reel\w*)\b/i;
/** The outcome list's wording in prose (rule 10): severity labels, margins, tracks, beats, upper-case labels. */
const SEVERITY_LABEL = /\b(?:a|an|the|another|one|his|her|its|their|your)\s+(?:[a-z-]+,?\s+){0,2}?(minor|moderate|severe|critical),?\s+(?:[a-z-]+,?\s+)?(wound|strike|blow|hit|cut|graze|injury|burn|gash)s?\b|\bmortal (strike|blow|hit)s?\b/i;
const ENGINE_TERMS: readonly [RegExp, string][] = [
  [/\bmargin\b/i, 'margin'],
  [/\badvantage track\b|\btrack (?:moves|moved|swings|swung|shifts|shifted)\b/i, 'track'],
  [/\b(?:quiet|narrated|next|this) beat\b/i, 'beat'],
  [/\bexchange (?:#|no\.? ?)?\d+\b|#\d+\b|\bbuild-?up exchange\b/i, 'exchange'],
  [/\b(?:DONE|NO HIT|NOT REACHED|FAILED)\b|\bHIT\b/, 'labels'],
  [/\bstamina only\b|\b(?:the )?roll(?:s|ed)? (?:fell|falls|falling) short\b|\bshort of the difficulty\b|\bDC \d/i, 'engine wording'],
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
/** Natural words for a severity label in the fallback (rule 10): the severity is kept, the label is not. */
const SEVERITY_PROSE: Readonly<Record<string, string>> = { minor: 'light', moderate: 'deep', severe: 'grievous', critical: 'terrible', mortal: 'deadly' };

function combatIssues(narrative: string, c: CombatDraft, facts: CombatFacts): NarrationIssue[] {
  const out: NarrationIssue[] = [];
  const sentences = sentencesOf(narrative);
  const anyLost = c.fighters.some((f) => f.lostParts.length > 0);
  const playerHitSomeone = facts.hits.some((h) => h.byPlayer);
  const minions = c.fighters.filter((f) => f.minion && f.id !== 'pc');
  const minionHitByPlayer = facts.hits.some((h) => h.byPlayer && minions.some((m) => m.id === h.targetId)) || c.narrate.some((r) => r.force?.stoodDown);
  const minionNouns = [...new Set(minions.flatMap((m) => m.name.toLowerCase().replace(/\s+\d+$/, '').split(/\s+/).slice(-1)))];
  const minionNounRe = minionNouns.length ? new RegExp(`\\b(${[...minionNouns, 'chassis', 'automaton', 'machine'].join('|')})s?\\b`, 'i') : null;
  const hazard = c.notes.some((n) => n.startsWith('terrain: '));
  const pushLanded = c.narrate.some((r) => (r.force?.success && (r.force.kind === 'push' || r.force.kind === 'throw')) || r.maneuver?.kind === 'knockdown');
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
    // 9. Slips, stumbles and lost footing with no terrain accident in the block (D-201 enforced, D-211).
    if (!hazard) {
      for (const cl of clausesOf(s)) {
        if (NEGATED.test(cl) || !SLIP.test(cl) || SLIP_PAST.test(cl)) continue;
        if (pushLanded && STUMBLE_FROM_PUSH.test(cl)) continue;
        add('slipNoHazard', 'the block lists no terrain accident: nobody slips, stumbles, loses footing or grip, missteps or overextends; explain each miss only with the reason the block gives', s);
        break;
      }
    }
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
  return issues;
}

/**
 * The code-written narration used when a retry still contradicts the block (D-197). Combat: a short summary (D-209,
 * combatSummary), never the engine's sentences. Otherwise: the narration with the offending sentences removed.
 */
export function fallbackNarration(narrative: string, draft: TurnDraft, issues: readonly NarrationIssue[]): string {
  // Only wording issues (engine terms, slips): the narration is kept with those sentences repaired or dropped (D-211);
  // everything that got a fact wrong falls back to the summary.
  const wordingOnly = issues.every((i) => i.kind === 'mechanicalTerms' || i.kind === 'slipNoHazard');
  if (wordingOnly && issues.length) return repairWording(narrative, issues);
  const combatWrong = issues.some((i) => i.kind !== 'healingNotApplied' && !(i.kind === 'woundMisplaced' && !draft.combat));
  if (draft.combat && combatWrong) return combatSummary(draft.combat).join(' ');
  const bad = new Set(issues.map((i) => i.sentence));
  const kept = sentencesOf(narrative).filter((s) => !bad.has(s));
  return kept.length ? kept.join(' ') : 'Time passes as the engine recorded.';
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
 * The fallback for wording issues only (D-211): a severity label becomes natural words ("a painful, moderate wound" ->
 * "a painful, deep wound"; "a mortal strike" -> "a deadly strike"), so the wound and its place survive; a sentence with
 * any other engine term or an invented slip is dropped.
 */
export function repairWording(narrative: string, issues: readonly NarrationIssue[]): string {
  const bad = new Set(issues.map((i) => i.sentence));
  const out: string[] = [];
  for (const sentence of sentencesOf(narrative)) {
    if (!bad.has(sentence)) {
      out.push(sentence);
      continue;
    }
    if (issues.some((i) => i.sentence === sentence && i.kind === 'slipNoHazard')) continue;
    const fixed = sentence.replace(/\b(minor|moderate|severe|critical|mortal)\b/gi, (w) => SEVERITY_PROSE[w.toLowerCase()] ?? w);
    if (!mechanicalTerm(fixed)) out.push(fixed);
  }
  return out.length ? out.join(' ') : 'The fight goes on as the engine recorded.';
}
