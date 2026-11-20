// D-246 (combat pass 4 issue 2): every fighter the generator can make has generated levels, never +0. Pass 4: the
// narrator's Yuuzhan Vong warrior fought at level +0 with 20 Vitality and was worth 0 XP, because creation refused the
// NPC-only archetype (D-224) and the NPC got an empty level table; the Vong minions had the same empty table under the
// weapon level D-195 patches in (Vitality 24 for every grade).
import { describe, expect, it } from 'vitest';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { DEFAULT_ARCHETYPE, FACTION_ARCHETYPE, MINION_KINDS, ROLE_ARCHETYPES, SPECIES_ARCHETYPE } from '../../src/data/npcGen.config';
import { minionInputs } from '../../src/engine/npcGen';
import { buildMinionFighter, buildNpcFighter } from '../../src/features/combat/build';
import { computeCreation } from '../../src/features/character/creation';
import { npcLevelsFor, selectNpcGen, selectNpcLevels } from '../../src/features/npcs/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { runDevCommand } from '../../src/turn/devCommands';
import { testStartInput } from '../../src/turn/testStart';

async function knight26Aby(seed: string): Promise<GameState> {
  const input = testStartInput({ name: 'Teren Vax', rank: 'knight', age: 30, startDate: { year: 26, month: 1, day: 1 }, startSecond: DEFAULT_START_SECOND });
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed)).state;
}
/** Every archetype the generator can pick: by role, faction, species, the default, and every minion kind's. */
const GENERATED = [...new Set([
  ...Object.values(ROLE_ARCHETYPES).flatMap((xs) => xs.map(([a]) => a)),
  ...Object.values(FACTION_ARCHETYPE).flatMap((m) => Object.values(m)),
  ...Object.values(SPECIES_ARCHETYPE).flatMap((m) => Object.values(m)),
  DEFAULT_ARCHETYPE,
  ...MINION_KINDS.map((k) => k.archetype),
])];
const PASS3_VONG = { type: 'npcIntroduced', key: 'tmp:1', name: 'Yuuzhan Vong warrior', species: 'unknown', faction: 'independent', role: 'soldier', ageApprox: 30, description: 'A towering warrior clad in ridged vonduun crab armor, wielding a writhing amphistaff.' };

describe('generated levels for every generated archetype (D-246)', () => {
  it('every role, faction and species override the narrator can send gives a named NPC a full level table', async () => {
    for (const a of GENERATED) expect(ARCHETYPE_BY_ID.has(a), a).toBe(true);
    const cases: { role: string; faction: string; species: string; name: string; desc: string }[] = [
      ...Object.keys(ROLE_ARCHETYPES).map((role) => ({ role, faction: 'independent', species: 'human', name: `A ${role}`, desc: '' })),
      ...Object.entries(FACTION_ARCHETYPE).flatMap(([faction, m]) => Object.keys(m).map((role) => ({ role, faction, species: 'human', name: `A ${faction} ${role}`, desc: '' }))),
      ...Object.entries(SPECIES_ARCHETYPE).flatMap(([species, m]) => Object.keys(m).map((role) => ({ role, faction: 'independent', species, name: `A ${species} ${role}`, desc: '' }))),
      { role: 'merchant', faction: 'independent', species: 'human', name: 'A merchant', desc: '' },
    ];
    let s = await knight26Aby('lv');
    const seen = new Set<string>();
    cases.forEach((c, i) => {
      const r = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: `tmp:${i + 1}`, name: c.name, species: c.species, faction: c.faction, role: c.role, description: c.desc }], { source: 'ai' });
      expect(r.rejected, c.name).toEqual([]);
      s = r.state;
      const npc = Object.values(s.npcs.byId).find((n) => n.name === c.name)!;
      seen.add(selectNpcGen(s, npc.id)?.archetype ?? '?');
      const lv = selectNpcLevels(s, npc.id);
      expect(Object.keys(lv).length, c.name).toBeGreaterThan(3);
      expect(lv['endurance'] ?? 0, `${c.name} endurance`).toBeGreaterThan(5);
      const f = buildNpcFighter(s, npc.id).fighter;
      if (c.role !== 'merchant') expect(f.level, `${c.name} fighting level`).toBeGreaterThan(0);
    });
    // Every archetype a named NPC can get was reached (the role table's picks are seeded, so at least one per role).
    for (const a of [...Object.values(FACTION_ARCHETYPE).flatMap((m) => Object.values(m)), ...Object.values(SPECIES_ARCHETYPE).flatMap((m) => Object.values(m)), DEFAULT_ARCHETYPE]) expect(seen.has(a), a).toBe(true);
  });
  it('creation refuses an NPC-only archetype for a player and accepts it for an NPC', () => {
    const base = { name: 'x', birthDay: -30 * 368, startDay: 0, speciesId: 'human', path: 'career' as const, archetype: 'yuuzhanVongWarrior', trainingStartAge: 17, talents: {}, warYears: 0, dominantHand: 'right' as const, rank: 'career' };
    expect(computeCreation(base).errors.join(' ')).toMatch(/is not an archetype of the career path/);
    expect(computeCreation({ ...base, npc: true }).errors).toEqual([]);
  });
  it('every minion kind, every grade: its fighting skill and Vitality come from its levels', async () => {
    const s = await knight26Aby('mk');
    for (const k of MINION_KINDS) {
      for (let g = 1; g <= 5; g++) {
        const f = buildMinionFighter(s, k.id, g, 0, 'f');
        expect(f.level, `${k.id} grade ${g}`).toBeGreaterThan(0);
        expect(f.endurance, `${k.id} grade ${g} endurance`).toBeGreaterThan(5);
      }
    }
  });
});

describe('the narrator\'s Yuuzhan Vong warrior against a dev-made one (D-246)', () => {
  it('the pass-3/4 event: real levels, never +0, and the same as a dev-made warrior with the same training', async () => {
    let s = await knight26Aby('vong');
    s = applyEvents(REGISTRY, s, [PASS3_VONG], { source: 'ai' }).state;
    const npc = Object.values(s.npcs.byId).find((n) => n.name === 'Yuuzhan Vong warrior')!;
    const lv = selectNpcLevels(s, npc.id);
    expect(lv['melee'] ?? 0).toBeGreaterThan(5);
    const named = buildNpcFighter(s, npc.id).fighter;
    expect(named.skillId).toBe('melee');
    expect(named.level).toBeGreaterThan(5);
    expect(named.maxVitality).toBeGreaterThan(40);
    // The same inputs as a dev-made warrior of each grade (its years of training), named: within the named NPC's
    // seeded variance of the minion's level, at every grade.
    const today = s.clock.now.day;
    for (let g = 1; g <= 5; g++) {
      const inp = minionInputs('yuuzhanVongWarrior', g, `cmp:${g}`);
      const asNamed = npcLevelsFor({ ...inp, minionGrade: null }, 'yuuzhanVong', inp.age, today);
      const dev = buildMinionFighter(s, 'yuuzhanVongWarrior', g, 0, 'f');
      expect(asNamed['melee']!, `grade ${g}`).toBeGreaterThan(dev.level * 0.7);
      expect(asNamed['melee']!, `grade ${g}`).toBeLessThan(dev.level * 1.3);
      expect(asNamed['endurance']!, `grade ${g}`).toBeGreaterThan(dev.endurance * 0.7);
    }
  });
  it('a dev-made Vong group has real Endurance and Vitality (was 24 at every grade)', async () => {
    const s = runDevCommand(REGISTRY, await knight26Aby('grp'), '/fight 3 yuuzhanVongWarrior').state;
    for (const o of (s.combat.active!.duel as { opponents: { maxVitality: number; endurance: number }[] }).opponents) {
      expect(o.endurance).toBeGreaterThan(5);
      expect(o.maxVitality).toBeGreaterThan(40);
    }
  });
});
