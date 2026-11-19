// Combat pass 2 balance rows applied (Jared, 2026-11-19; D-217 to D-229): each rule with its case.
import { describe, expect, it } from 'vitest';
import { AiError } from '../../src/ai/provider';
import { archetypeDef } from '../../src/data/archetypes';
import { COMBAT_XP } from '../../src/data/progression.config';
import { LOADOUT_BY_ARCHETYPE } from '../../src/data/weapons';
import { computeCombatXp, type CombatSession } from '../../src/engine/combatXp';
import { resolveExchange, startDuel, CARD_ONLY_NOTE, type DuelState, type Fighter } from '../../src/engine/duel';
import { rollNpcInputs } from '../../src/engine/npcGen';
import { seedRng } from '../../src/engine/rng';
import { runSequence, type ForceProfile } from '../../src/engine/sequence';
import { isDying, type Wound } from '../../src/engine/wounds';
import { buildMinionFighter } from '../../src/features/combat/build';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import { combatFacts } from '../../src/turn/combatFacts';
import { runDevCommand } from '../../src/turn/devCommands';
import { countsOnMeter } from '../../src/turn/pipeline';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { forceUser, REAL } from '../support/duelSim';
import { CLONE_WARS_DATE } from '../support/dates';
import { devCharacter } from '../support/fightHarness';

const force: ForceProfile = { levelOf: () => 40, ciOf: () => 20, forceOutput: 30, trickLevel: 40 };

describe('row 1, D-219: a strike step that only holds passes the chain on, without the pressure bonus', () => {
  it('step 1 holds -> DONE with "the chain goes on"; step 2 is rolled with no building pressure', () => {
    for (let i = 0; i < 400; i++) {
      const duel = startDuel(forceUser('pc', 50), [forceUser('d', 50)], seedRng(`hold${i}`));
      const r = runSequence({ duel, patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'strike' }, { kind: 'strike' }], 3, {}, force);
      if (!/holds; no ground gained, no hit; the chain goes on/.test(r.lines[0]!)) continue;
      expect(r.lines[0]).toMatch(/^step 1 strike: DONE \(/);
      expect(r.lines[1]).not.toMatch(/NOT REACHED \(an earlier step failed\)/);
      const second = r.state.duel.log.find((x) => x.step === 1);
      if (second) expect(second.rollA!.modifiers.some((m) => m.source === 'building pressure')).toBe(false);
      return;
    }
    throw new Error('no held first step in 400 seeds');
  });
  it('lost ground still stops the chain', () => {
    for (let i = 0; i < 400; i++) {
      const duel = startDuel(forceUser('pc', 50), [forceUser('d', 50)], seedRng(`lose${i}`));
      const r = runSequence({ duel, patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'strike' }, { kind: 'strike' }], 3, {}, force);
      if (!/loses ground/.test(r.lines[0]!)) continue;
      expect(r.lines[0]).toMatch(/FAILED/);
      expect(r.stopReason).toBe('stepFailed');
      return;
    }
    throw new Error('no lost first step in 400 seeds');
  });
});

describe('row 2, D-220: a first use gains at most 4 track steps', () => {
  it('a first-use feint from -3 lands at +1, from 0 at +3', () => {
    let seen = 0;
    for (let i = 0; i < 200 && seen < 2; i++) {
      for (const from of [-3, 0]) {
        const duel = { ...startDuel(forceUser('pc', 50), [forceUser('d', 50)], seedRng(`feint${i}`)), advantage: from };
        const r = runSequence({ duel, patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'tactic', tactic: 'feint' }], 3, {}, force);
        if (!r.results[0]!.success) continue;
        expect(r.state.duel.advantage).toBe(from === -3 ? 1 : 3);
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe('row 4, D-221: a state of mind counts once on a build-up roll', () => {
  const buildUpMods = (f: Fighter, opp = 50): number[] => {
    const s = resolveExchange(startDuel(f, [forceUser('d', opp)], seedRng('som')), REAL, 0);
    return s.log[0]!.rollA!.modifiers.filter((m) => m.source.startsWith('state of mind')).map((m) => m.value);
  };
  it('despair -1 / -1 is -1 on a build-up (was -2); anger +1 / -2 still nets to -1; pride 0 / -1 is -1', () => {
    expect(buildUpMods(forceUser('pc', 50, { stateOfMind: 'despair' }))).toEqual([-1]);
    expect(buildUpMods(forceUser('pc', 50, { stateOfMind: 'anger' })).reduce((a, b) => a + b, 0)).toBe(-1);
    expect(buildUpMods(forceUser('pc', 50, { stateOfMind: 'pride' }), 40)).toEqual([-1]);
  });
});

describe('row 6, D-222: precognition says its Force load on the card, not in the block', () => {
  it('a strike that fires precognition carries a card-only note; the narrator\'s block drops it', () => {
    for (let i = 0; i < 300; i++) {
      const d: DuelState = { ...startDuel(forceUser('pc', 60), [forceUser('d', 60)], seedRng(`pc${i}`)), advantage: -3 };
      const s = resolveExchange(d, REAL, 0);
      const r = s.log[0]!;
      const note = r.notes.find((n) => n.startsWith(CARD_ONLY_NOTE));
      if (!note) continue;
      expect(note).toMatch(/^card: pc: precognition.*: 0\.4 Force load$/);
      const facts = combatFacts({ fightId: 'f', started: false, records: [r], narrate: [r], beat: 'woundingHit', quiet: false, quietLine: null, ended: null, session: null, advantage: s.advantage, fighters: [], notes: [] } as never);
      expect(facts.lines.join('\n')).not.toMatch(/Force load|card:/);
      return;
    }
    throw new Error('no precognition in 300 seeds');
  });
});

describe('row 7, D-223: a droid kind dodges no better than it shoots', () => {
  it('B1 Agility is at most its weapon level; a trooper keeps its own', async () => {
    const s = await devCharacter('knight', 50, CLONE_WARS_DATE);
    for (let i = 0; i < 6; i++) {
      const b1 = buildMinionFighter(s, 'battleDroid', 1, i, 'f');
      expect(b1.agility).toBeLessThanOrEqual(b1.level);
    }
    const trooper = buildMinionFighter(s, 'trooper', 2, 0, 'f');
    expect(trooper.agility).toBeGreaterThan(0);
  });
});

describe('row 8, D-224: a Yuuzhan Vong warrior archetype', () => {
  it('a Vong in a fighting role is of the warrior caste (melee, saber-resistant heavy armor, no Force); a Vong scholar is not', () => {
    const base = { campaignSeed: 'c', age: 30, year: 26, faction: 'unknown' };
    expect(rollNpcInputs({ ...base, npcId: 'v1', role: 'other', species: 'yuuzhanVong' }).archetype).toBe('yuuzhanVongWarrior');
    expect(rollNpcInputs({ ...base, npcId: 'v2', role: 'soldier', species: 'yuuzhanVong' }).archetype).toBe('yuuzhanVongWarrior');
    expect(rollNpcInputs({ ...base, npcId: 'v3', role: 'scholar', species: 'yuuzhanVong' }).archetype).toBe('civilian');
    expect(rollNpcInputs({ ...base, npcId: 'h1', role: 'other', species: 'human' }).archetype).toBe('civilian');
    expect(LOADOUT_BY_ARCHETYPE['yuuzhanVongWarrior']).toEqual({ weapon: 'melee', armor: 'heavy', saberResistant: true });
    const def = archetypeDef('yuuzhanVongWarrior');
    expect(def.main).toBe('melee');
    expect(def.paces.knight?.['forceControl'] ?? 0).toBe(0);
  });
});

describe('rows 13 and 15, D-225 and D-227: capture and surrender', () => {
  const fight = async (seed: string, npc: { species: string; faction: string; role: string }) => {
    let s = await devCharacter('knight', 30);
    s = { ...s, meta: { ...s.meta, rngState: seedRng(seed) } };
    s = runDevCommand(REGISTRY, s, '/wound torso mortal').state;
    expect(isDying(s.health.wounds as Wound[])).toBe(true);
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: 'Captor', ...npc, ageApprox: 30, description: 'an armed fighter' } as never], { source: 'ai' }).state;
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Captor')!.id;
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [id], stakes: 'serious', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    // A dying player cannot fight (D-242): the fight ends at once as lost (dying), and the opponent's choice follows.
    return resolveTurn(REGISTRY, s, null, { beat: { action: 'continue' } as CombatActionInput }).state;
  };
  /** The first seed whose fate roll is a capture (a serious fight rolls captured or left). */
  const captured = async (npc: { species: string; faction: string; role: string }) => {
    for (let i = 0; i < 40; i++) {
      const s = await fight(`cap${i}`, npc);
      if (s.combat.last!.playerFate === 'captured') return s;
    }
    throw new Error('no capture in 40 seeds');
  };
  it('a dying player captured by soldiers is stabilized by the captors', async () => {
    const s = await captured({ species: 'human', faction: 'republic', role: 'soldier' });
    expect(s.combat.last).toMatchObject({ outcome: 'lost', reason: 'dying', playerFate: 'captured' });
    expect(isDying(s.health.wounds as Wound[])).toBe(false);
    expect(s.health.dying).toBeNull();
  });
  it('captured by Yuuzhan Vong warriors (they take captives for sacrifice): not stabilized', async () => {
    const s = await captured({ species: 'yuuzhanVong', faction: 'unknown', role: 'soldier' });
    expect(isDying(s.health.wounds as Wound[])).toBe(true);
  });
  it('a surrender pays the surrender factor 0.5, below fled (0.8) and lost (1.2)', () => {
    const session: CombatSession = { stakes: 'serious', outcome: 'lost', exchanges: [{ skillId: 'makashi', gap: 0 }], forceUses: [] };
    const run = (x: CombatSession): number => computeCombatXp({ session: x, m: () => 1, physicalWeights: () => ({}), todayBeforeM: () => 0, fightsToday: () => 0, clamp: (_k, w) => ({ credited: w, discarded: 0 }) }).beforeM['makashi'] ?? 0;
    expect(COMBAT_XP.surrendered).toBe(0.5);
    expect(run({ ...session, surrendered: true }) / run(session)).toBeCloseTo(0.5 / 1.2, 6);
    expect(run({ ...session, surrendered: true })).toBeLessThan(run({ ...session, outcome: 'fled' }));
  });
});

describe('row 14, D-226: the usage meter counts 2xx replies and 429s only', () => {
  it.each([
    [new AiError('http', 'Gemini error 503', { status: 503 }), false],
    [new AiError('http', 'Gemini error 500', { status: 500 }), false],
    [new AiError('timeout', 'no reply'), false],
    [new AiError('network', 'down'), false],
    [new AiError('noKey', 'no key'), false],
    [new AiError('rateLimit', 'quota', { status: 429 }), true],
    [new AiError('schema', 'bad reply'), true],
    [new AiError('truncated', 'cut off'), true],
  ])('%s -> %s', (e, counts) => {
    expect(countsOnMeter(e)).toBe(counts);
  });
});

describe('row 20, D-229: a missed sequence strike against a minion loses at most one step', () => {
  it('no forced miss moves the track by more than one step', () => {
    let misses = 0;
    for (let i = 0; i < 300; i++) {
      const duel = startDuel(forceUser('pc', 30), [forceUser('m1', 40, { minion: true, weapon: 'blasterRifle', form: null })], seedRng(`fm${i}`));
      const r = runSequence({ duel, patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'strike' }], 3, {}, force);
      const rec = r.state.duel.log[0]!;
      if (rec.kind !== 'strike' || rec.striker !== 'A' || (rec.hit && !rec.hit.avoided) || rec.maneuver || rec.margin > -2) continue;
      misses++;
      expect(rec.advBefore - rec.advAfter).toBeLessThanOrEqual(1);
    }
    expect(misses).toBeGreaterThan(0);
  });
});

describe('D-217: a narrator hazard that ends a fight is rolled for everyone in it', () => {
  it('hazardOccurred + combatEnded (environmentCollapse): the player and the opponents take the hazard; the fight is interrupted', async () => {
    let s = await devCharacter('knight', 40);
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'trooper', count: 2 }], stakes: 'serious', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    s = resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput }).state;
    const vit = (s.combat.active!.duel as DuelState).opponents.map((o) => o.vitality);
    const r = applyEvents(REGISTRY, s, [
      { type: 'hazardOccurred', hazard: 'explosion', severityHint: 2, cause: 'the reactor housing blows apart' },
      { type: 'combatEnded', reason: 'interrupted', category: 'environmentCollapse', why: 'the reactor explodes' },
    ], { source: 'ai' });
    expect(r.rejected).toEqual([]);
    expect(r.state.combat.active).toBeNull();
    expect(r.state.combat.last!.outcome).toBe('interrupted');
    expect(r.state.health.vitalityLost).toBeGreaterThan(0);
    const after = r.state.combat.last!.duel as DuelState;
    after.opponents.forEach((o, i) => expect(o.vitality).toBeLessThan(vit[i]!));
    expect(r.applied.flatMap((a) => a.notes).filter((n) => n.startsWith('hazard: '))).toHaveLength(3);
  });
  it('a hazard with no interruption still does no damage during the fight', async () => {
    let s = await devCharacter('knight', 40);
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'trooper', count: 2 }], stakes: 'serious', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    s = resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput }).state;
    const r = applyEvents(REGISTRY, s, [{ type: 'hazardOccurred', hazard: 'explosion', severityHint: 2, cause: 'a console sparks' }], { source: 'ai' });
    expect(r.state.health.vitalityLost).toBe(s.health.vitalityLost);
    expect(r.state.combat.active).not.toBeNull();
  });
});
