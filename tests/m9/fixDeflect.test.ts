// m9-fix-deflect (Jared, 28 Nov 2026): sending blaster bolts back, and narrating a result short of the intent.
// Play bug: "Deflect the blaster bolts back at the thugs" became "stance defensive" + "strike aimed at the torso" (a melee
// strike at a gunman); the narration showed the bolts deflected into the deck and a move to better ground, never the intent.
import { describe, expect, it } from 'vitest';
import { MISSED_STRIKE_STEP, REDIRECT, STRIKE_MIN_MARGIN } from '../../src/data/combat.config';
import { resolveExchange, startDuel, type DuelState, type ExchangeRecord, type Fighter, type RedirectOutcome } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { runSequence, type ForceProfile } from '../../src/engine/sequence';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import { combatFacts } from '../../src/turn/combatFacts';
import { combatWordsAction, isRedirectClause, reconcileCombatPayload, targetFromText, type CombatDraft, type CombatFighterView } from '../../src/turn/combatTurn';
import { describeCombat } from '../../src/turn/context';
import { checkNarration, combatSummary } from '../../src/turn/narrationCheck';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import type { TurnDraft } from '../../src/turn/resolve';
import { forceUser, REAL } from '../support/duelSim';
import { devCharacter } from '../support/fightHarness';

const BUG_INPUT = 'Deflect the blaster bolts back at the thugs';
const BUG_INTENT = { action: 'sequence', steps: [{ kind: 'stance', stance: 'defensive' }, { kind: 'strike', aim: 'torso' }] };
const force: ForceProfile = { levelOf: () => 40, ciOf: () => 20, forceOutput: 30, trickLevel: 40 };

const jedi = (form: string, level = 40): Fighter => ({ ...forceUser('pc', level), name: 'Jared', form });
const thug = (id: string, over: Partial<Fighter> = {}): Fighter => forceUser(id, 30, { name: id, weapon: 'blasterPistol', form: null, minion: false, ...over });
const band = (m: number): number => Math.round(m);

describe('the parser: sending the bolts back is the redirect action (m9-fix-deflect item 3)', () => {
  it('the exact play input and close variants are redirect clauses', () => {
    for (const t of [
      BUG_INPUT,
      'deflect the bolts back at the thugs',
      'I deflect their shots back at them',
      'reflect his blaster bolts back at him',
      'redirect the bolts at the droid',
      'Redirect the blaster fire into the gunner',
      'send the bolts back at the Rodian',
      'bat the shots back toward the shooters',
      'turn their fire back on them',
      'deflect the bolts at the thugs',
      'angle my blade to send the bolts back',
    ])
      expect(isRedirectClause(t), t).toBe(true);
  });
  it('plain deflecting, falling back, lightning and return fire are not', () => {
    for (const t of ['deflect the bolts', 'I deflect the incoming fire as I fall back', 'redirect the lightning back at him', 'return fire', 'push them back', 'parry his strike', 'send my saber spinning at him'])
      expect(isRedirectClause(t), t).toBe(false);
  });
  it("the play bug: the intent's defensive stance and torso strike become one redirect step", () => {
    expect(reconcileCombatPayload(BUG_INPUT, BUG_INTENT, 5)).toEqual({ action: 'sequence', steps: [{ kind: 'redirect' }] });
  });
  it('the same input with an aim payload, an empty intent, or a redirect step from the intent', () => {
    expect(reconcileCombatPayload(BUG_INPUT, { action: 'aim', part: 'torso' }, 5)).toEqual({ action: 'sequence', steps: [{ kind: 'redirect' }] });
    // No stance from "deflect" here: the clause is the redirect, not a defend word.
    expect(combatWordsAction(BUG_INPUT)).toBeNull();
    expect(reconcileCombatPayload(BUG_INPUT, { action: 'clarify' }, 5)).toEqual({ action: 'sequence', steps: [{ kind: 'redirect' }] });
    expect(reconcileCombatPayload(BUG_INPUT, { action: 'continue' }, 5)).toEqual({ action: 'sequence', steps: [{ kind: 'redirect' }] });
    expect(reconcileCombatPayload(BUG_INPUT, { action: 'sequence', steps: [{ kind: 'redirect' }] }, 5)).toEqual({ action: 'sequence', steps: [{ kind: 'redirect' }] });
  });
  it('a redirect then a strike keeps both, in order', () => {
    const text = 'Deflect the blaster bolts back at the thugs, then cut down the nearest one';
    expect(reconcileCombatPayload(text, { action: 'sequence', steps: [{ kind: 'strike', aim: 'torso' }, { kind: 'strike' }] }, 5)).toEqual({ action: 'sequence', steps: [{ kind: 'redirect' }, { kind: 'strike' }] });
    expect(reconcileCombatPayload(text, { action: 'sequence', steps: [{ kind: 'strike' }] }, 5)).toEqual({ action: 'sequence', steps: [{ kind: 'redirect' }, { kind: 'strike' }] });
  });
  it('a stance the player names stays; plain deflecting is still the defensive stance (D-179)', () => {
    expect(reconcileCombatPayload('Go defensive and deflect the bolts back at the thugs', { action: 'sequence', steps: [{ kind: 'stance', stance: 'defensive' }, { kind: 'strike' }] }, 5)).toEqual({ action: 'sequence', steps: [{ kind: 'stance', stance: 'defensive' }, { kind: 'redirect' }] });
    expect(combatWordsAction('deflect the bolts')).toEqual({ action: 'posture', stance: 'defensive' });
  });
  it('the shooter named is the target (D-212 reads the redirect clause like an attack clause)', () => {
    const ops = [
      { id: 'm1', name: 'Thug 1', out: false, engagedElsewhere: false, minion: true },
      { id: 'g', name: 'Rodian gunner', out: false, engagedElsewhere: false, minion: false },
    ];
    expect(targetFromText('Deflect the blaster bolts back at the Rodian gunner', ops)).toBe('g');
    expect(targetFromText(BUG_INPUT, ops)).toBe('m1');
  });
});

/** The first record of each redirect outcome over seeded exchanges. */
function sample(a: Fighter, b: Fighter, adv: number, seeds = 400): Map<RedirectOutcome, ExchangeRecord> {
  const out = new Map<RedirectOutcome, ExchangeRecord>();
  for (let i = 0; i < seeds; i++) {
    const s = resolveExchange({ ...startDuel(a, [b], seedRng(`rd${adv}-${i}`)), advantage: adv }, REAL, 0, { redirect: true });
    const r = s.log[0]!;
    expect(r.redirect).toBeDefined();
    if (!out.has(r.redirect!)) out.set(r.redirect!, r);
  }
  return out;
}

describe('the redirect action (m9-fix-deflect item 2)', () => {
  it('build-up: the bands decide (2-5 away, 6-9 ground, 10+ a bolt back into the shooter, the track reset)', () => {
    for (let i = 0; i < 400; i++) {
      const s = resolveExchange(startDuel(jedi('shiiCho', 45), [thug('t1')], seedRng(`bu${i}`)), REAL, 0, { redirect: true });
      const r = s.log[0]!;
      const m = band(r.margin);
      expect(r.kind).toBe('buildUp');
      const want: RedirectOutcome = m >= REDIRECT.sendBackMargin ? 'sentBack' : m >= 6 ? 'gainedGround' : m >= 2 ? 'deflectedAway' : m >= -1 ? 'held' : 'lostGround';
      expect(r.redirect).toBe(want);
      if (want === 'sentBack') {
        expect(r.hit).toMatchObject({ by: 'A', redirected: true, avoided: false });
        expect(r.advAfter).toBe(0);
        // A wound with the shooter's blaster (a duelist's wound carries W; Vitality falls only on the light ones).
        expect(s.opponents[0]!.wounds.at(-1)?.cause ?? (s.opponents[0]!.vitality < thug('t1').vitality ? 'blaster' : null)).toBe('blaster');
      } else expect(r.hit).toBeNull();
    }
  });
  it('against a minion the cut-down margin (6) sends a bolt back; the saber cut-down never fires on a redirect', () => {
    for (let i = 0; i < 300; i++) {
      const s = resolveExchange(startDuel(jedi('shiiCho', 50), [thug('m1', { minion: true })], seedRng(`mn${i}`)), REAL, 0, { redirect: true });
      const r = s.log[0]!;
      expect(r.redirect === 'sentBack').toBe(band(r.margin) >= REDIRECT.sendBackMinionMargin);
      if (r.hit) expect(r.hit.redirected).toBe(true);
    }
  });
  it('holding the strike (+3): a strike margin of 4 sends a bolt back with the shooter weapon; under it the bolt goes wide', () => {
    const seen = sample(jedi('shiiCho', 40), thug('t1'), 3);
    for (const [o, r] of seen) {
      expect(r.kind).toBe('strike');
      expect(['sentBack', 'recovered']).toContain(o);
      if (o === 'sentBack') {
        expect(band(r.margin)).toBeGreaterThanOrEqual(STRIKE_MIN_MARGIN);
        expect(r.hit).toMatchObject({ by: 'A', redirected: true });
        expect(r.advAfter).toBe(0);
      } else {
        expect(band(r.margin)).toBeLessThan(STRIKE_MIN_MARGIN);
        // A strike that misses keeps the pressure by MISSED_STRIKE_STEP (3 since D-244): from +3 to 0.
        expect(r.advAfter).toBe(3 - Math.min(3, MISSED_STRIKE_STEP));
        expect(r.hit).toBeNull();
      }
    }
    expect(seen.has('sentBack') && seen.has('recovered')).toBe(true);
  });
  it('the bolt carries the shooter weapon: a heavy blaster wounds harder than a pistol', () => {
    const avg = (w: Fighter['weapon']): number => {
      let sum = 0;
      let n = 0;
      for (let i = 0; i < 300; i++) {
        const s = resolveExchange({ ...startDuel(jedi('shiiCho', 60), [thug('t', { weapon: w })], seedRng(`dmg${i}`)), advantage: 3 }, REAL, 0, { redirect: true });
        const h = s.log[0]!.hit;
        if (h?.redirected) {
          sum += h.D;
          n++;
        }
      }
      return sum / n;
    };
    expect(avg('heavy')).toBeGreaterThan(avg('blasterPistol'));
  });
  it('form modifiers: Shien +1 redirect on its +1 vs blasters; Soresu -1 on its +1; Shii-Cho none', () => {
    const mods = (form: string): Record<string, number> => {
      const r = resolveExchange(startDuel(jedi(form), [thug('t1')], seedRng('fm')), REAL, 0, { redirect: true }).log[0]!;
      return Object.fromEntries(r.rollA!.modifiers.map((m) => [m.source, m.value]));
    };
    expect(mods('shien')).toMatchObject({ 'shien redirect': 1, 'shien matchup (vsBlasters)': 1 });
    expect(mods('soresu')).toMatchObject({ 'soresu redirect': -1, 'soresu matchup (vsBlasters)': 1 });
    expect(Object.keys(mods('shiiCho')).some((k) => /redirect|matchup/.test(k))).toBe(false);
  });
  it('Shien sends bolts back more often than Soresu at the same level', () => {
    const rate = (form: string): number => {
      let n = 0;
      for (let i = 0; i < 2000; i++) if (resolveExchange(startDuel(jedi(form, 50), [thug('t1')], seedRng(`rt${i}`)), REAL, 0, { redirect: true }).log[0]!.redirect === 'sentBack') n++;
      return n / 2000;
    };
    expect(rate('shien')).toBeGreaterThan(rate('soresu') + 0.05);
  });
  it('several shooters: the redirect aims at the target when it shoots, else the first engaged shooter', () => {
    const duelist = forceUser('blade', 30, { name: 'Vibroblade thug', weapon: 'melee', form: null });
    const duel: DuelState = { ...startDuel(jedi('shien'), [duelist, thug('t1'), thug('t2')], seedRng('sev')), target: 0 };
    const r = runSequence({ duel, patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'redirect' }], 2, {}, force);
    expect(r.state.duel.log[0]!.targetId).toBe('t1');
    const named = runSequence({ duel: { ...duel, target: 2 }, patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'redirect' }], 2, {}, force);
    expect(named.state.duel.log[0]!.targetId).toBe('t2');
    expect(named.lines[0]).toMatch(/^step 1 redirect \(send the bolts back\): (DONE|FAILED) \(/);
  });
  it('cannot be tried: no blaster fire, slugs, or no saber in hand (dropped with the reason, nothing rolled)', () => {
    const run = (a: Fighter, b: Fighter): string => runSequence({ duel: startDuel(a, [b], seedRng('no')), patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'redirect' }], 2, {}, force).lines[0]!;
    expect(run(jedi('shien'), forceUser('d', 40))).toMatch(/NOT REACHED \(no blaster fire to send back/);
    expect(run(jedi('shien'), thug('s', { weapon: 'slugRifle' }))).toMatch(/NOT REACHED \(slugs melt on the blade/);
    expect(run({ ...jedi('shien'), weapon: 'unarmed', saberLost: { weapon: 'lightsaber', skillId: 'soresu', level: 40, form: 'shien' } }, thug('t'))).toMatch(/NOT REACHED \(needs a lightsaber in hand/);
  });
});

describe('the play bug end to end: the turn resolves a redirect, never a melee strike or a stance', () => {
  it('"Deflect the blaster bolts back at the thugs" with the intent the play run returned', async () => {
    let s = await devCharacter('knight', 30);
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'thug', count: 3 }], stakes: 'serious', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    s = resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput }).state;
    const duel0 = s.combat.active!.duel as DuelState;
    const stance0 = duel0.a.stance;
    const from = duel0.log.length;
    const intent = { actionType: 'fight', targets: [], references: [], unknownNames: [], sequence: BUG_INTENT.steps } as never;
    const r = resolveTurn(REGISTRY, s, intent, { text: BUG_INPUT });
    const duel = (r.state.combat.active?.duel ?? r.state.combat.last?.duel) as DuelState;
    const mine = duel.log.slice(from).filter((x) => x.step !== undefined);
    expect(mine.length).toBe(1);
    expect(mine[0]!.redirect).toBeDefined();
    expect(duel.a.stance).toBe(stance0);
    expect(r.draft.combat!.notes.some((n) => /^step 1 redirect \(send the bolts back\)/.test(n))).toBe(true);
    expect(r.draft.combat!.notes.some((n) => /strike \(aimed at the torso\)/.test(n))).toBe(false);
  });
});

/** A narration draft around one redirect record. */
function draftOf(r: ExchangeRecord, a: Fighter, b: Fighter, notes: string[] = []): CombatDraft {
  const view = (f: Fighter): CombatFighterView => ({ id: f.id, name: f.name, vitality: f.vitality, maxVitality: f.maxVitality, status: 'Healthy', out: false, engagedElsewhere: false, minion: f.minion, weapon: f.weapon, form: f.form, lostParts: [] });
  return { fightId: 'f', started: false, records: [r], narrate: [r], beat: 'every5', quiet: false, quietLine: null, ended: null, session: null, advantage: r.advAfter, fighters: [view(a), view(b)], notes } as CombatDraft;
}

describe('narration short of the intent (m9-fix-deflect item 4)', () => {
  const a = { ...jedi('shiiCho', 45), id: 'pc' };
  const b = thug('Thug 1');
  const seen = sample(a, b, 0, 600);
  const short = seen.get('gainedGround') ?? seen.get('deflectedAway')!;
  const c = draftOf(short, a, b);
  const asTurn = { combat: c, applied: [] } as unknown as TurnDraft;

  it("the block states the attempt and how it fell short; the narrator's contract asks for both", () => {
    const facts = combatFacts(c);
    expect(facts.shortOfIntent).toEqual([expect.objectContaining({ kind: 'redirect', goal: "send Thug 1's blaster bolts back at Thug 1" })]);
    expect(facts.lines[0]).toMatch(/Jared tries to send Thug 1's blaster bolts back at Thug 1: NO HIT, SHORT OF THE INTENT \(/);
    expect(describeCombat(c).join('\n')).toMatch(/Short of the intent \(tell each attempt as the player meant it, then how it fell short; never drop the goal and never tell it as done\): #\d+ Jared tries to send Thug 1's blaster bolts back at Thug 1: /);
    expect(combatSummary(c).join(' ')).toMatch(/Short of the intent: Jared tries to send Thug 1's blaster bolts back at Thug 1, but /);
  });
  it('the play narration (bolts into the deck, better ground, no goal) fails the check', () => {
    const play = 'You sweep your blade through the storm of fire, scattering the bolts into the deck as you move to better ground.';
    expect(checkNarration(play, asTurn, false).map((i) => i.kind)).toContain('intentDropped');
  });
  it('the attempt told, then how it fell short, passes', () => {
    const good = 'You angle the blade to send the bolts back at the thugs, but the barrage is too thick: they glance into the deck as you gain ground.';
    expect(checkNarration(good, asTurn, false).filter((i) => i.kind === 'intentDropped' || i.kind === 'stepFailed')).toEqual([]);
  });
  it('the redirect told as done fails the check', () => {
    const wrong = 'You catch the first bolt and it streaks back into the thug, who staggers.';
    expect(checkNarration(wrong, asTurn, false).map((i) => i.kind)).toContain('stepFailed');
  });
  it('a bolt really sent back needs no short-of-intent line', () => {
    const sent = seen.get('sentBack')!;
    expect(combatFacts(draftOf(sent, a, b)).shortOfIntent).toEqual([]);
  });
  it('a FAILED Force step whose attempt the narration drops fails the check', () => {
    const fr = runSequence({ duel: startDuel(a, [b], seedRng('ff')), patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'forceAction', action: 'push' }], 2, {}, { ...force, levelOf: () => 1 });
    const rec = fr.state.duel.log.find((x) => x.kind === 'force')!;
    if (rec.force?.success) return; // the seed's push worked: nothing to check
    const fc = { combat: draftOf(rec, a, b, fr.lines), applied: [] } as unknown as TurnDraft;
    expect(checkNarration('The thug keeps firing as you hold your ground.', fc, false).map((i) => i.kind)).toContain('intentDropped');
    expect(checkNarration('You reach out with the Force to shove him back, but your grip slips away and he keeps firing.', fc, false).map((i) => i.kind)).not.toContain('intentDropped');
  });
});
