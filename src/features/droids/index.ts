// Droids feature (M8 checklist item 7; docs-v2/spec/droids.md). The code owns every droid (Golden Rule 1): the narrator reports
// what happened (a salvaged droid, a wipe, a bolt fitted, an order, an upgrade, a repair, a hit) with the `droid` event and no
// numbers; the code picks the model for the date, rolls the job or the hit, charges the economy and changes the droid. New
// droids are bought and sold through the economy's `trade` (which sends droidAcquired and droidSold here).
import { z } from 'zod';
import { TOOL_KIT } from '../../data/droids.config';
import { DROID_SHIELD, DROID_SKILLS, ION_POWER, REGARD, REPAIR_SKILL, UPGRADE_HOURS, WIPE_PRICE, type DroidHow, type DroidSkill } from '../../data/droids.config';
import { DROID_MODEL_BY_ID } from '../../data/droidModels';
import { HIT_MULT, WEAPON_BASE } from '../../data/health.config';
import { dateFromAbsDay, SECONDS_PER_DAY } from '../../engine/calendar';
import {
  applyDroidHit,
  damagedLocations,
  droidStatus,
  impoundFee,
  jobCost,
  jobLevel,
  modelOf,
  modelPrice,
  modelRefusal,
  newDroid,
  orderOutcome,
  pastYears,
  personalityP,
  personalityStage,
  repaired,
  repairJob,
  resolveModel,
  shieldRecharged,
  upgradeJob,
  wiped,
  withModule,
  withRegard,
  withReprogram,
  type DroidHit,
  type DroidUnit,
} from '../../engine/droids';
import { pay } from '../../engine/economy';
import { efficiency } from '../../engine/fatigue';
import { checkRating, type LevelInputs } from '../../engine/rolls';
import { nextFloat, type RngState } from '../../engine/rng';
import type { GameState } from '../../state/gameState';
import type { ApplyCtx, FeatureModule, GameEvent, HandleResult } from '../../state/types';
import { selectAcceptance } from '../economy/selectors';
import { selectFatigue, selectIsSpent, selectLastingPenalty, selectWoundPenalty } from '../health/selectors';
import { selectPresentNpcIds } from '../pacing/selectors';
import { selectPerformance, selectRust } from '../progression/selectors';
import { droidsSliceSchema, type DroidsSlice } from './droids';
import { selectDroidByRef, selectDroidLines, selectDroids } from './selectors';

type R = HandleResult<DroidsSlice>;

export const DROID_ACTS = ['acquire', 'lose', 'impound', 'reclaim', 'wipe', 'bolt', 'unbolt', 'order', 'upgrade', 'reprogram', 'repair', 'hit'] as const;
export const DROID_WEAPONS = ['blaster', 'slug', 'blade', 'lightsaber', 'explosive', 'ionPistol', 'ionRifle', 'ionGrenade', 'ionize'] as const;
type DroidWeapon = (typeof DROID_WEAPONS)[number];

// The event's `what` is plain words (the economy's way: the narrator names, the code reads; it keeps the schema small).
type Acquired = 'secondHand' | 'salvage' | 'gift' | 'found' | 'stolen';
/** How a droid was had, from the words: second-hand (bought used), salvaged, stolen, found; else a gift. */
export function howFromWords(t: string): Acquired {
  const w = t.toLowerCase();
  if (/second[- ]?hand|\bused\b|pre-?owned/.test(w)) return 'secondHand';
  if (/salvag|scrap|wreck/.test(w)) return 'salvage';
  if (/\bst[oe]l|steal|\btook\b|\btaken\b/.test(w)) return 'stolen';
  if (/\bfound\b|\bfind\b|abandoned|derelict/.test(w)) return 'found';
  return 'gift';
}
/** How a droid was lost: destroyed, set free, or (else) stolen. */
export const lossFromWords = (t: string): 'destroyed' | 'freed' | 'stolen' => (/destroy|scrap|slag|wreck/i.test(t) ? 'destroyed' : /\bfree/i.test(t) ? 'freed' : 'stolen');
const SKILL_WORDS: readonly (readonly [RegExp, DroidSkill])[] = [
  [/medic|surg|heal/, 'medicine'],
  [/scien|analy|research/, 'science'],
  [/repair|mechanic|engineer/, 'repair'],
  [/astrogat|navigat|hyperspace/, 'astrogation'],
  [/slic|hack|computer/, 'slicing'],
  [/language|translat|interpret/, 'languages'],
  [/social|etiquette|protocol|diplom/, 'social'],
  [/blaster|shoot|marksman|gun/, 'blaster'],
  [/melee|blade|close combat|fist/, 'melee'],
  [/security|guard|sensor|surveil/, 'security'],
  [/labou?r|lift|haul|load/, 'labour'],
  [/pilot|flying|flight/, 'piloting'],
];
/** The droid skill the words name (its id, or a word for it); null when none. */
export function skillFromWords(t: string): DroidSkill | null {
  const w = t.toLowerCase();
  return DROID_SKILLS.find((s) => new RegExp(`\\b${s}\\b`).test(w)) ?? SKILL_WORDS.find(([re]) => re.test(w))?.[1] ?? null;
}
/** The weapon the words name (default a blaster). */
export function weaponFromWords(t: string): DroidWeapon {
  const w = t.toLowerCase();
  if (/ionize/.test(w)) return 'ionize';
  if (/\bion\b/.test(w)) return /grenade/.test(w) ? 'ionGrenade' : /rifle|cannon/.test(w) ? 'ionRifle' : 'ionPistol';
  if (/saber/.test(w)) return 'lightsaber';
  if (/grenade|explos|detonat|\bmine\b|missile|rocket/.test(w)) return 'explosive';
  if (/slug|bullet|shotgun/.test(w)) return 'slug';
  if (/blade|vibro|knife|sword|claw|axe|club|melee|staff/.test(w)) return 'blade';
  return 'blaster';
}
const nameFromWords = (t: string): string | undefined => /\b(?:named|called|designated)\s+([A-Za-z0-9][A-Za-z0-9-]{0,29})/.exec(t)?.[1];
const AGAINST = /against|unwilling|refus|won'?t|forbid|object/i;
const SHOP = /\bshop\b|workshop|garage|technician|droidsmith|mechanic's/i;
/** What the narrator's words say happened to which droid (the code reads them; a reject asks for plainer words). */
export function parseDroidWhat(s: GameState, what: string): { act: (typeof DROID_ACTS)[number]; ref?: string; shop: boolean } | { reject: string } {
  const w = what.toLowerCase();
  const shop = SHOP.test(w);
  const owned = selectDroids(s).find((u) => w.includes(u.name.toLowerCase()) || w.includes(u.id));
  const ref = owned?.id;
  const one = selectDroids(s).length === 1 ? selectDroids(s)[0]!.id : undefined;
  const target = ref ?? one;
  // A droid newly had: nothing owned is named and a model is.
  if (!ref && /\b(bought|buys?|purchased?|salvaged?|found|finds?|given|gift|acquired?|stole|steals?|took|takes?|won|wins?|got|gets?|second[- ]?hand|used)\b/.test(w) && resolveModel(what)) return { act: 'acquire', shop };
  const pick = (act: (typeof DROID_ACTS)[number]) => ({ act, ...(target ? { ref: target } : {}), shop });
  if (/\bwip(e|ed|es|ing)\b|memory flush/.test(w)) return pick('wipe');
  if (/unbolt|bolt (?:is )?(?:off|removed)|remov\w* (?:the |its |a )?(?:restraining )?bolt/.test(w)) return pick('unbolt');
  if (/\bbolt/.test(w)) return pick('bolt');
  if (/reclaim|out of (?:the )?impound|from (?:the )?impound/.test(w)) return pick('reclaim');
  if (/impound|confiscat|seiz/.test(w)) return pick('impound');
  if (/reprogram/.test(w)) return pick('reprogram');
  if (/upgrad|module|install/.test(w)) return pick('upgrade');
  if (/repair|\bfix|patch(?:ed|es|ing)? up|reboot/.test(w)) return pick('repair');
  if (/destroy|stolen|\bstole\b|set free|freed|\blost\b|is gone/.test(w)) return pick('lose');
  if (/\b(hit|shot|struck|blast|damag|ioniz|slash|cut|explo|ion)\w*/.test(w)) return pick('hit');
  if (/order|command|\btold\b|\btells?\b|instruct/.test(w)) return pick('order');
  return { reject: 'say plainly what happened to the droid (bought used, salvaged, wiped, bolted, ordered, upgraded, repaired, hit, impounded, lost)' };
}
const ADVANCED = /advanced|major|military|big/i;

const today = (s: GameState): number => s.clock.now.day;
const nowSec = (s: GameState): number => s.clock.now.day * SECONDS_PER_DAY + s.clock.now.second;
const yearOf = (s: GameState): number => dateFromAbsDay(today(s)).year;
const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');

/** The character's level for a droid job: Repair (droids.config REPAIR_SKILL; m8-skills, D-513) with the usual penalties. */
function standIn(s: GameState): LevelInputs {
  return {
    level: selectPerformance(s, REPAIR_SKILL),
    woundPenalty: 1 - (1 - selectWoundPenalty(s, REPAIR_SKILL)) * (1 - selectLastingPenalty(s, REPAIR_SKILL)),
    rust: selectRust(s, REPAIR_SKILL),
    vitalitySpent: selectIsSpent(s),
    fatigueEfficiency: efficiency(selectFatigue(s).p),
  };
}

/** A job's check: the character's stand-in, or at a shop the better of it and the shop's technician (a fresh Adept). */
function jobRoll(s: GameState, rng: RngState, label: string, rating: number, shop: boolean): { success: boolean; rng: RngState; note: string; byShop: boolean } {
  const own = standIn(s);
  const level = jobLevel(own.level, shop);
  const byShop = level > own.level;
  const inputs = byShop ? { level, woundPenalty: 0, rust: 0, vitalitySpent: false, fatigueEfficiency: 1 } : own;
  const [card, r] = checkRating(rng, { label, skillId: REPAIR_SKILL, levelInputs: inputs, modifiers: [], rating });
  return { success: card.success, rng: r, byShop, note: `${label} (${byShop ? "the shop's technician" : "the character's Repair"}): ${card.total.toFixed(1)} vs DC ${card.dc}, ${card.success ? 'success' : 'failure'}` };
}

const canPay = (s: GameState, credits: number): boolean => pay(s.economy.wallet, credits, selectAcceptance(s)) !== null;
const charge = (credits: number, reason: string): GameEvent => ({ type: 'creditsCharged', credits: Math.round(credits), reason: reason.slice(0, 120), lender: 'bank' });

const replace = (slice: DroidsSlice, u: DroidUnit): DroidsSlice => ({ ...slice, units: slice.units.map((x) => (x.id === u.id ? u : x)) });
const remove = (slice: DroidsSlice, id: string): DroidsSlice => ({ ...slice, units: slice.units.filter((x) => x.id !== id) });

/** A designation from the model's name and a draw: "T3-K7", "GE3-04". */
function designation(modelId: string, u: number): string {
  const m = DROID_MODEL_BY_ID.get(modelId)!;
  const head = m.name.split(' ')[0]!.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4) || 'DX';
  const letters = 'ABCDEFGHJKLMNPRSTVWXZ';
  const n = Math.floor(u * 21 * 10);
  return `${head}-${letters[n % 21]}${Math.floor(n / 21)}`;
}

function acquired(slice: DroidsSlice, s: GameState, modelId: string, how: DroidHow, rng0: RngState, name?: string, stolen = false): { slice: DroidsSlice; unit: DroidUnit; rng: RngState } {
  const [u1, r1] = nextFloat(rng0);
  const [u2, r2] = nextFloat(r1);
  const id = `droid-${slice.nextId}`;
  const unit = newDroid(DROID_MODEL_BY_ID.get(modelId)!, { id, name: name?.trim() || designation(modelId, u1), seed: `${s.meta.campaignId}:${id}`, how, day: today(s), pastYears: pastYears(how, u2), stolen });
  return { slice: { ...slice, units: [...slice.units, unit], nextId: slice.nextId + 1 }, unit, rng: r2 };
}

/** A narrator's report of a hit: the weapon's power (combat's base damage) times a drawn hit quality; ion weapons their ion power. */
function hitFrom(weapon: DroidWeapon, u: number, s: GameState): DroidHit {
  if (weapon === 'ionize') return { kind: 'ionize', power: selectPerformance(s, 'forceOutput') || 40, margin: 0 };
  if (weapon === 'ionPistol' || weapon === 'ionRifle' || weapon === 'ionGrenade') return { kind: 'ion', power: ION_POWER[weapon] };
  const base = { blaster: WEAPON_BASE.blasterRifle, slug: WEAPON_BASE.slugRifle, blade: WEAPON_BASE.melee, lightsaber: WEAPON_BASE.lightsaber, explosive: WEAPON_BASE.heavy }[weapon];
  // Hit quality for a narrated hit (invented): a graze 30%, solid 50%, clean 20%.
  const q = u < 0.3 ? HIT_MULT.graze : u < 0.8 ? HIT_MULT.solid : HIT_MULT.clean;
  return { kind: 'physical', power: base * q };
}

// ---------------------------------------------------------------- the droid event

/** The narrator's report, in words: read, then handled as a structured act. */
function handleDroidWords(slice: DroidsSlice, e: GameEvent, ctx: ApplyCtx<GameState>): R {
  const what = String(e['what']);
  const p = parseDroidWhat(ctx.state, what);
  if ('reject' in p) return p;
  return handleDroid(slice, { type: 'droidAct', act: p.act, what, shop: p.shop, ...(p.ref ? { ref: p.ref } : {}) }, ctx);
}

function handleDroid(slice: DroidsSlice, e: GameEvent, ctx: ApplyCtx<GameState>): R {
  const s = ctx.state;
  const act = e['act'] as (typeof DROID_ACTS)[number];
  const ref = typeof e['ref'] === 'string' ? (e['ref'] as string) : undefined;
  const what = typeof e['what'] === 'string' ? (e['what'] as string) : '';
  const day = today(s);
  let rng = s.meta.rngState;
  if (act === 'acquire') {
    const m = resolveModel(what);
    if (!m) return { reject: 'name the droid model in plain words in what (a second-hand astromech, a salvaged T3, an HK assassin droid)' };
    const how = howFromWords(what);
    if (how === 'gift' && /\b(bought|buys?|purchased?)\b/i.test(what)) return { reject: 'a new droid is bought with trade (the economy prices it); the droid event is for second-hand units, salvage, gifts, finds and theft' };
    const refusal = modelRefusal(m, yearOf(s), how === 'secondHand');
    if (refusal) return { reject: refusal };
    const emit: GameEvent[] = [];
    const notes: string[] = [];
    if (how === 'secondHand') {
      const price = modelPrice(m, true)!;
      if (!canPay(s, price)) return { reject: `cannot afford a second-hand ${m.name}: ${fmt(price)} cr` };
      emit.push(charge(price, `a second-hand ${m.name}`));
    }
    const r = acquired(slice, s, m.id, how, rng, nameFromWords(what), how === 'stolen');
    const stage = personalityStage(personalityP(r.unit, day));
    notes.push(`${r.unit.name} (${m.name}) joins the character: ${how === 'stolen' ? 'stolen property' : how}; personality ${stage} (${Math.round((day - r.unit.wipedDay) / 365)} years since its last wipe)`);
    return { slice: r.slice, rng: r.rng, notes, emit };
  }
  const u = selectDroidByRef(s, ref);
  if (!u) return { reject: ref ? `no owned droid "${ref}"` : 'name which droid' };
  const m = modelOf(u);
  switch (act) {
    case 'lose': {
      const how = lossFromWords(what);
      return { slice: remove(slice, u.id), notes: [`${u.name} is gone: ${how === 'freed' ? 'set free' : how}`] };
    }
    case 'impound':
      return { slice: replace(slice, { ...u, impounded: true }), notes: [`${u.name} is impounded by the authorities: ${fmt(impoundFee(m))} cr to reclaim${u.stolen ? ' (stolen property: it goes back to its owner instead)' : ''}`] };
    case 'reclaim': {
      if (!u.impounded) return { reject: `${u.name} is not impounded` };
      if (u.stolen) return { reject: `${u.name} is stolen property: the authorities return it to its owner` };
      return { slice: replace(slice, { ...u, impounded: false }), emit: [charge(impoundFee(m), `reclaiming ${u.name} from the impound`)], notes: [`${u.name} reclaimed from the impound`] };
    }
    case 'wipe': {
      const before = personalityStage(personalityP(u, day));
      const others = selectDroids(s).filter((x) => x.id !== u.id && ['opinions', 'independent', 'full'].includes(personalityStage(personalityP(x, day)))).map((x) => x.name);
      const witnesses = [...others, ...selectPresentNpcIds(s).map((id) => s.npcs.byId[id]?.name).filter((n): n is string => Boolean(n))];
      // Not a dark-side act (Jared): no alignment, flag or standing event, only the shop's bill.
      return {
        slice: replace(slice, wiped(u, day)),
        emit: [charge(WIPE_PRICE, `a memory wipe for ${u.name}`)],
        notes: [`${u.name}'s memory is wiped: back to factory programming (was ${before}; its quirks and what it learned are gone, its modules stay); a hard choice, not a dark-side act${witnesses.length ? `; may react: ${witnesses.join(', ')}` : ''}`],
      };
    }
    case 'bolt': {
      if (u.bolt) return { reject: `${u.name} already wears a restraining bolt` };
      const minded = ['opinions', 'independent', 'full'].includes(personalityStage(personalityP(u, day)));
      return { slice: replace(slice, minded ? withRegard({ ...u, bolt: true }, REGARD.boltOn) : { ...u, bolt: true }), notes: [`a restraining bolt fitted to ${u.name}: it must obey the caller${minded ? ' (it resents it)' : ''}`] };
    }
    case 'unbolt':
      if (!u.bolt) return { reject: `${u.name} wears no restraining bolt` };
      return { slice: replace(slice, { ...u, bolt: false }), notes: [`${u.name}'s restraining bolt removed`] };
    case 'order': {
      if (droidStatus(u, nowSec(s)) === 'disabled' || droidStatus(u, nowSec(s)) === 'destroyed') return { reject: `${u.name} is ${droidStatus(u, nowSec(s))}` };
      const against = AGAINST.test(what);
      const [roll, r] = nextFloat(rng);
      const o = orderOutcome(u, day, against, roll);
      let next = u;
      const notes: string[] = [];
      if (o.broke) {
        next = { ...u, bolt: false };
        notes.push(`${u.name} breaks its restraining bolt and acts on its own`);
      } else if (u.bolt && o.obeys) {
        const minded = ['opinions', 'independent', 'full'].includes(personalityStage(personalityP(u, day)));
        if (against && minded) next = withRegard(u, REGARD.forcedByBolt);
        notes.push(`${u.name} obeys the restraining bolt's caller${against ? ' against its will' : ''}`);
      } else notes.push(o.obeys ? `${u.name} obeys` : `${u.name} refuses the order: its own judgement, and no bolt to force it`);
      return { slice: replace(slice, next), rng: r, notes };
    }
    case 'upgrade':
    case 'reprogram': {
      const sk = skillFromWords(what);
      if (!sk) return { reject: `name the skill in what (${DROID_SKILLS.join(', ')})` };
      const shop = e['shop'] === true;
      const tier = ADVANCED.test(what) ? 'advanced' : 'basic';
      const job = upgradeJob(u, act === 'upgrade' ? { kind: 'module', skill: sk, tier } : { kind: 'reprogram', skill: sk }, shop, day);
      if (job.refusal) return { reject: job.refusal };
      if (!shop && !slice.toolKit) return { reject: `${act === 'upgrade' ? 'fitting a module' : 'reprogramming'} needs a tool kit (a droid tool kit, ${TOOL_KIT.price} cr), or a shop` };
      if (!canPay(s, jobCost(job.price, shop, true))) return { reject: `cannot afford the job: ${fmt(jobCost(job.price, shop, true))} cr` };
      const roll = jobRoll(s, rng, `${act === 'upgrade' ? `${tier} ${sk} module` : `reprogramming for ${sk}`} on ${u.name}`, job.rating, shop);
      rng = roll.rng;
      const cost = jobCost(job.price, shop, roll.success);
      const next = roll.success ? (act === 'upgrade' ? withModule(u, sk, tier) : withReprogram(u, sk)) : u;
      // The character's own work teaches Repair (m8-skills, D-513); a shop's technician's does not.
      const learned: GameEvent[] = roll.byShop ? [] : [{ type: 'playXpEarned', source: 'repair', hours: act === 'upgrade' ? UPGRADE_HOURS[tier] : UPGRADE_HOURS.reprogram, rating: job.rating, success: roll.success, inFight: false, why: `work on ${u.name}` }];
      return {
        slice: replace(slice, next),
        rng,
        emit: [charge(cost, `${act === 'upgrade' ? `a ${tier} ${sk} module` : 'reprogramming'} for ${u.name}${shop ? ' (shop)' : ''}`), ...learned],
        notes: [roll.note, roll.success ? `${u.name}: ${act === 'upgrade' ? `${sk} +${tier === 'advanced' ? 10 : 5}` : `now programmed for ${sk}`} (${fmt(cost)} cr)` : `the job fails: ${fmt(cost)} cr of parts and labour lost`],
      };
    }
    case 'repair': {
      const shop = e['shop'] === true;
      const notes: string[] = [];
      const emit: GameEvent[] = [];
      let next = u;
      if (u.disabledUntil !== null && u.disabledUntil > nowSec(s)) {
        next = { ...next, disabledUntil: null };
        notes.push(`${u.name} rebooted after the ion overload`);
      }
      const locs = damagedLocations(next);
      if (!locs.length && !notes.length) return { reject: `${u.name} needs no repair` };
      for (const loc of locs) {
        const job = repairJob(next, loc)!;
        if (job.big && !shop) {
          notes.push(`${loc} (${job.from}): a big job, it needs a droid shop`);
          continue;
        }
        // The character's own repairs need a tool kit (m8-skills, D-513); a reboot above is a quick fix and needs none.
        if (!shop && !slice.toolKit) {
          notes.push(`${loc}: repairing it needs a tool kit (a droid tool kit, ${TOOL_KIT.price} cr) or a shop`);
          continue;
        }
        if (!canPay(s, jobCost(job.price, shop, true))) {
          notes.push(`${loc}: cannot afford the parts (${fmt(jobCost(job.price, shop, true))} cr)`);
          continue;
        }
        const roll = jobRoll(s, rng, `repairing ${u.name}'s ${loc} (${job.from})`, job.rating, shop);
        rng = roll.rng;
        const cost = jobCost(job.price, shop, roll.success);
        emit.push(charge(cost, `repairing ${u.name}'s ${loc}${shop ? ' (shop)' : ''}`));
        if (!roll.byShop) emit.push({ type: 'playXpEarned', source: 'repair', hours: job.hours, rating: job.rating, success: roll.success, inFight: false, why: `repairing ${u.name}` });
        notes.push(roll.note);
        if (roll.success) {
          // A destroyed processor is a new one: the memory goes with it.
          next = repaired(loc === 'processor' && job.from === 'destroyed' ? wiped(next, day) : next, loc);
          notes.push(`${loc} repaired (${job.hours} h of work, ${fmt(cost)} cr)${loc === 'processor' && job.from === 'destroyed' ? ': a new processor, the old memory lost' : ''}`);
        } else notes.push(`${loc}: the repair fails (${fmt(cost)} cr lost)`);
      }
      return { slice: replace(slice, next), rng, emit, notes };
    }
    case 'hit': {
      const weapon = weaponFromWords(what);
      const [q, r1] = nextFloat(rng);
      const [loc, r2] = nextFloat(r1);
      const res = applyDroidHit(u, hitFrom(weapon, q, s), nowSec(s), loc);
      return { slice: replace(slice, res.unit), rng: r2, notes: [res.note] };
    }
    default:
      return { reject: `unknown droid act ${String(act)}` };
  }
}

// ---------------------------------------------------------------- the module

export const droidsFeature: FeatureModule<DroidsSlice, GameState> = {
  id: 'droids',
  version: 1,
  initialState: () => ({ units: [], nextId: 1 }),
  emptyState: () => ({ units: [], nextId: 1 }),
  stateSchema: droidsSliceSchema,
  events: {
    /** Engine: a tool kit bought or issued (economy trade; m8-skills, D-513). */
    toolKitAcquired: {
      schema: z.object({ type: z.literal('toolKitAcquired') }),
      sources: ['engine'],
      handle: (slice) => (slice.toolKit ? { slice } : { slice: { ...slice, toolKit: true }, notes: ['a tool kit for repairs and upgrades'] }),
    },
    /**
     * AI: something happened to a droid, in plain words (the code reads them; one field keeps the response schema under its
     * cap): "bought a second-hand T3", "salvaged an astromech named Patch", "wiped Patch's memory", "fitted a restraining bolt",
     * "ordered Patch against its will", "an advanced astrogation module at a shop", "repaired at a shop", "hit by an ion
     * grenade", "impounded", "Patch was stolen". New droids are bought and sold with trade. The code decides the rest.
     */
    droid: {
      schema: z.object({ type: z.literal('droid'), what: z.string().max(100) }),
      sources: ['ai', 'player', 'engine'],
      narrative: () => true,
      handle: handleDroidWords,
    },
    /** Engine or player: the same, structured (an act, the droid, the words for its details, at a shop). */
    droidAct: {
      schema: z.object({ type: z.literal('droidAct'), act: z.enum(DROID_ACTS), ref: z.string().max(40).optional(), what: z.string().max(100).optional(), shop: z.boolean().optional() }),
      sources: ['player', 'engine'],
      handle: handleDroid,
    },
    /** Engine: a droid bought new through the economy's trade (the economy has charged it). */
    droidAcquired: {
      schema: z.object({ type: z.literal('droidAcquired'), modelId: z.string() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const id = String(e['modelId']);
        if (!DROID_MODEL_BY_ID.has(id)) return { reject: `unknown droid model ${id}` };
        const r = acquired(slice, ctx.state, id, 'bought', ctx.state.meta.rngState);
        return { slice: r.slice, rng: r.rng, notes: [`${r.unit.name} (${DROID_MODEL_BY_ID.get(id)!.name}), new from the factory: a basic personality`] };
      },
    },
    /** Engine: a droid sold through the economy's trade (the economy has paid for it). */
    droidSold: {
      schema: z.object({ type: z.literal('droidSold'), unitId: z.string() }),
      sources: ['engine'],
      handle: (slice, e) => {
        const u = slice.units.find((x) => x.id === e['unitId']);
        return u ? { slice: remove(slice, u.id), notes: [`${u.name} sold`] } : { reject: `no owned droid ${String(e['unitId'])}` };
      },
    },
    /** Engine: a hit on an owned droid with its power set by the caller (combat, hazards). */
    droidHit: {
      schema: z.object({ type: z.literal('droidHit'), unitId: z.string(), kind: z.enum(['physical', 'ion', 'ionize']), power: z.number().min(0), margin: z.number().optional() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const u = slice.units.find((x) => x.id === e['unitId']);
        if (!u) return { reject: `no owned droid ${String(e['unitId'])}` };
        const [loc, rng] = nextFloat(ctx.state.meta.rngState);
        const res = applyDroidHit(u, { kind: e['kind'] as DroidHit['kind'], power: Number(e['power']), ...(typeof e['margin'] === 'number' ? { margin: e['margin'] } : {}) }, nowSec(ctx.state), loc);
        return { slice: replace(slice, res.unit), rng, notes: [res.note] };
      },
    },
  },
  // Shields come back between scenes (any time passing).
  onTimeAdvanced: (slice) => ({ slice: slice.units.some((u) => modelOf(u).shield && u.shieldStops < DROID_SHIELD.stops) ? { ...slice, units: slice.units.map(shieldRecharged) } : slice }),
  selectors: { lines: selectDroidLines },
};
