// Input fixes from combat pass 1 (D-199): typed words end a sparring session; a typed rest with care starts a care
// period and rests instead of training; a failed feint is a beat with its dice; the initiative warning.
import { describe, expect, it } from 'vitest';
import type { Intent } from '../../src/ai/schemas/intent';
import { PROMPTS } from '../../src/ai/prompts';
import { STOP_SPAR_WORDS } from '../../src/data/combatWords';
import type { DuelState } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import type { Wound } from '../../src/engine/wounds';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { initiativeWarning } from '../../src/ui/duelPanel';
import { devCharacter } from '../support/fightHarness';

const beat = (action: string): { beat: CombatActionInput } => ({ beat: { action } as CombatActionInput });
const fightIntent: Intent = { actionType: 'fight', targets: [], references: [], unknownNames: [] };

async function sparring(): Promise<GameState> {
  const base = await devCharacter('padawan', 16);
  let s = applyEvents(REGISTRY, base, [{ type: 'npcIntroduced', name: 'Master Oren Vash', species: 'human', faction: 'jediOrder', role: 'jediMaster', ageApprox: 50, description: '' }], { source: 'ai' }).state;
  const id = Object.values(s.npcs.byId).find((n) => n.name === 'Master Oren Vash')!.id;
  s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [id], minionGroups: [], stakes: 'spar', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
  s = resolveTurn(REGISTRY, s, null, beat('playBout')).state;
  expect(s.combat.active?.session).toBeTruthy();
  return s;
}

describe('typed words end a sparring session (D-199)', () => {
  for (const text of ['I step back, lower my saber and bow. "That is enough for today, Master." I end the sparring session.', 'stop sparring', "That's enough.", 'I yield.', 'Solah!']) {
    it(`"${text.slice(0, 40)}" ends it like the Stop sparring button`, async () => {
      const s = await sparring();
      const r = resolveTurn(REGISTRY, s, fightIntent, { text });
      expect(r.state.combat.active).toBeNull();
      expect(r.state.combat.last?.session?.ended).toBe('stopped');
      expect(r.draft.combat?.ended?.reason).toMatch(/stopped/);
    });
  }
  it('other typed combat input still plays the bout; the words are configured', async () => {
    const s = await sparring();
    const r = resolveTurn(REGISTRY, s, fightIntent, { text: 'I parry and hold my ground' });
    expect(r.state.combat.active).not.toBeNull();
    expect(STOP_SPAR_WORDS).toContain('solah');
  });
});

describe('a typed rest with care (D-199)', () => {
  const wound: Wound = { id: 'w1', part: 'rightArm', severity: 'severe', W: 27, stabilized: false, healProgress: 0, day: 0, source: 'combat' };
  async function wounded(): Promise<GameState> {
    const base = await devCharacter('knight', 30);
    const s = applyEvents(REGISTRY, base, [{ type: 'healthSynced', vitalityLost: 20, addWounds: [{ ...wound, day: base.clock.now.day }], cause: 'test' }], { source: 'engine' }).state;
    return { ...s, meta: { ...s.meta, rngState: seedRng('rest') } };
  }
  const week = { amount: 1, unit: 'weeks' } as const;
  const healed = (s: GameState): number => (s.health.wounds as Wound[])[0]?.healProgress ?? 1;
  it('"I rest for a week while a medic treats my arm": a care period, rest and recovery days, faster healing', async () => {
    const s = await wounded();
    // The intent the prompt asks for: rest, healing medical, a span of one week.
    const care = resolveTurn(REGISTRY, s, { actionType: 'rest', targets: [], references: [], unknownNames: [], healing: { source: 'medical' }, requestedSpan: week, requestedPacing: 'montage' }, { text: 'I rest for a week while a medic treats my arm' });
    const rep = care.draft.jump!.report;
    expect(rep.trainingDays).toBe(0);
    expect(rep.hoursTrained).toBe(0);
    expect(care.draft.applied.some((a) => (a.event as { type: string; kind?: string }).type === 'careStarted' && (a.event as { kind?: string }).kind === 'medical')).toBe(true);
    // The same week of plain rest heals at the base rate; medical care doubles it (D-150).
    const plain = resolveTurn(REGISTRY, s, { actionType: 'rest', targets: [], references: [], unknownNames: [], requestedSpan: week, requestedPacing: 'montage' }, { text: 'I rest for a week' });
    expect(plain.draft.jump!.report.trainingDays).toBe(0);
    expect(plain.draft.applied.some((a) => (a.event as { type: string }).type === 'careStarted')).toBe(false);
    expect(healed(care.state)).toBeGreaterThan(healed(plain.state) * 1.8);
  });
  it('a montage that is not rest still trains', async () => {
    const s = await wounded();
    const r = resolveTurn(REGISTRY, s, { actionType: 'train', targets: [], references: [], unknownNames: [], requestedSpan: week, requestedPacing: 'montage' }, { text: 'I train for a week' });
    expect(r.draft.jump!.report.trainingDays).toBeGreaterThan(0);
  });
  it('the intent prompt maps resting while treated to rest with healing', () => {
    expect(PROMPTS.intent).toMatch(/I rest for a week while a medic treats my arm.*actionType rest, healing source medical, requestedSpan 1 weeks/);
  });
});

describe('a failed feint through the turn (D-199; the D-194 regression)', () => {
  it('is a narrated sequence beat with its dice in the notes, never "no effect"', async () => {
    const base = await devCharacter('knight', 30);
    let s = applyEvents(REGISTRY, base, [{ type: 'npcIntroduced', name: 'Darth Vek', species: 'human', faction: 'sithEmpire', role: 'sithLord', ageApprox: 45, description: '' }], { source: 'ai' }).state;
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Darth Vek')!.id;
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [id], minionGroups: [], stakes: 'lethal', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    s = resolveTurn(REGISTRY, s, null, beat('narrate')).state;
    let failed = false;
    for (let i = 0; i < 40 && !failed; i++) {
      const seeded = { ...s, combat: { ...s.combat, active: { ...s.combat.active!, duel: { ...(s.combat.active!.duel as DuelState), rng: seedRng(`f${i}`) } } } };
      const r = resolveTurn(REGISTRY, seeded, { ...fightIntent, sequence: [{ kind: 'tactic', tactic: 'feint' }, { kind: 'strike' }] }, { text: 'I feint high, then cut low at his leg.' });
      const notes = r.draft.combat!.notes.join('\n');
      if (!/step 1 feint: FAILED/.test(notes)) continue;
      expect(notes).toMatch(/step 1 feint: FAILED \(seen through: .+ d20 \d+ = .+ vs Darth Vek d20 \d+ = .+ \(margin -?[\d.]+\)\)/);
      expect(r.draft.combat!.beat).toBe('sequence');
      expect(r.draft.combat!.quiet).toBe(false);
      // The feint rolls with the form level (rolls §5; combat pass 1 R9: "d20 6 = 6.0" for a Guardian).
      const [, d20, total] = /: FAILED \(seen through: .+? d20 (\d+) = ([\d.-]+) vs/.exec(notes)!;
      expect(Number(total) - Number(d20)).toBeGreaterThan(4);
      failed = true;
    }
    expect(failed).toBe(true);
  });
});

describe('the initiative warning (D-199)', () => {
  it('shows only while the opponent holds the strike', () => {
    expect(initiativeWarning(-3)).toBe('Opponent has the initiative: a sequence may be cut short');
    expect(initiativeWarning(-5)).not.toBeNull();
    expect(initiativeWarning(-2)).toBeNull();
    expect(initiativeWarning(3)).toBeNull();
  });
});
