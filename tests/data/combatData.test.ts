// M5 step 1: integrity of the combat, health, NPC-generation, canon and flag data (D-143).
import { describe, expect, it } from 'vitest';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { CANON_ERAS, CANON_NPCS } from '../../src/data/canonNpcs';
import { FATE_ROLL, SITH_ACADEMIES, SPARRING_DEFAULT_BY_RANK, STRIKE_QUALITY, isNarratedBeat } from '../../src/data/combat.config';
import { QUIET_LINES, fillLine } from '../../src/data/combatLines';
import { FACTIONS, NPC_ROLES, SPECIES } from '../../src/data/entities.config';
import { FLAGS, flagDef } from '../../src/data/flags';
import { FORM_MATCHUPS, FORM_STAMINA, MATCHUP_SITUATIONS } from '../../src/data/formMatchups';
import {
  FALL_LOCATION_WEIGHTS,
  HEAL_MULT,
  LOCATION_WEIGHTS,
  SEVERITY_FROM_W,
  WEAPON_BASE,
} from '../../src/data/health.config';
import {
  DEFAULT_ARCHETYPE,
  FACTION_ARCHETYPE,
  MINION_KINDS,
  ROLE_ARCHETYPES,
  TALENT_ROLL_ORDERS,
} from '../../src/data/npcGen.config';
import { RANKS } from '../../src/data/rankMinimums';
import { SEQUENCE_CAP } from '../../src/data/sequence.config';
import { FORM_IDS, isSkillId } from '../../src/data/skills';
import { STUB_DUAL_BLADES, STUB_PLAYER_SHATTERPOINT_PERCEPTION, STUB_WEAPONS, stubLightPhilosophy, stubProsthetic } from '../../src/data/stubs';
import { TERRAIN_TAGS } from '../../src/data/terrain';
import { LOADOUT_BY_ARCHETYPE, loadoutFor } from '../../src/data/weapons';
import { slugify } from '../../src/engine/aliases';
import { canonAbsence, canonPresentAt, canonRoleAt } from '../../src/engine/canonRoster';

const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
const RANK_IDS = RANKS.map((r) => r.id);

describe('M5 stubs (D-143)', () => {
  it('hold their values until M6 / M8', () => {
    expect(STUB_WEAPONS).toBe(true);
    expect(STUB_DUAL_BLADES).toBe(false);
    expect(STUB_PLAYER_SHATTERPOINT_PERCEPTION).toBe(false);
    expect(stubLightPhilosophy('jedi')).toBe(true);
    expect(stubLightPhilosophy('sith')).toBe(false);
    expect(stubProsthetic({ path: 'jedi' })).toBe('qualityCybernetic');
    expect(stubProsthetic({ path: 'career', archetype: 'smuggler' })).toBe('basicProsthetic');
    expect(stubProsthetic({ faction: 'republic' })).toBe('qualityCybernetic');
  });
});

describe('form matchups and stamina (rolls §5, D-122, D-143)', () => {
  it('every form has an entry, each within +/-1, in a known situation', () => {
    for (const f of FORM_IDS) {
      expect(FORM_MATCHUPS[f], f).toBeDefined();
      for (const m of FORM_MATCHUPS[f]!) {
        expect(Math.abs(m.value)).toBeLessThanOrEqual(1);
        expect(MATCHUP_SITUATIONS).toContain(m.when);
        if (m.when === 'vsForm') expect(FORM_IDS).toContain(m.form);
      }
    }
  });
  it('Niman is 0 in every situation; Form VII has an entry', () => {
    expect(FORM_MATCHUPS['niman']).toEqual([]);
    expect(FORM_MATCHUPS['juyo']).toBeDefined();
    expect(FORM_MATCHUPS['vaapad']).toBeDefined();
  });
  it('stamina multipliers: Ataru 1.25, Soresu 0.85, Juyo / Vaapad 1.15, others 1.0', () => {
    expect(FORM_STAMINA['ataru']).toBe(1.25);
    expect(FORM_STAMINA['soresu']).toBe(0.85);
    expect(FORM_STAMINA['juyo']).toBe(1.15);
    expect(FORM_STAMINA['vaapad']).toBe(1.15);
    for (const f of FORM_IDS) if (!['ataru', 'soresu', 'juyo', 'vaapad'].includes(f)) expect(FORM_STAMINA[f]).toBe(1);
  });
});

describe('health data (health §4-7)', () => {
  it('location weights sum to 100', () => {
    expect(sum(Object.values(LOCATION_WEIGHTS))).toBeCloseTo(100);
    expect(sum(Object.values(FALL_LOCATION_WEIGHTS))).toBeCloseTo(100);
  });
  it('severity bands descend and cover 1+', () => {
    const mins = SEVERITY_FROM_W.map(([w]) => w);
    expect(mins).toEqual([...mins].sort((a, b) => b - a));
    expect(mins.at(-1)).toBe(1);
  });
  it('lightsaber base 40, healing cap x6 (D-143)', () => {
    expect(WEAPON_BASE.lightsaber).toBe(40);
    expect(HEAL_MULT.cap).toBe(6);
  });
});

describe('combat config', () => {
  it('strike qualities descend from 16 to 4', () => {
    expect(STRIKE_QUALITY.map(([m]) => m)).toEqual([16, 12, 8, 4]);
  });
  it('beat classes', () => {
    expect(isNarratedBeat('woundingHit')).toBe(true);
    expect(isNarratedBeat('periodic')).toBe(false);
  });
  it('every rank has a sparring default and a sequence base', () => {
    for (const r of RANK_IDS) {
      expect(SPARRING_DEFAULT_BY_RANK[r], r).toBeDefined();
      expect(SEQUENCE_CAP.byRank[r], r).toBeDefined();
    }
  });
  it('academy eras run forward in time (fromBby >= toBby)', () => {
    for (const a of SITH_ACADEMIES) expect(a.fromBby).toBeGreaterThanOrEqual(a.toBby);
    expect(SITH_ACADEMIES.map((a) => a.id)).toContain('trayus');
  });
  it('fate chances sum to 1', () => {
    for (const g of Object.values(FATE_ROLL)) {
      expect(sum(g.lethal)).toBeCloseTo(1);
      expect(sum(g.serious)).toBeCloseTo(1);
    }
  });
  it('quiet lines fill both names', () => {
    const line = QUIET_LINES.trackSwing!.up[0]!;
    expect(fillLine(line, 'Jared', 'the droid')).not.toMatch(/\{(pc|opp)\}/);
  });
});

describe('terrain', () => {
  it('unique ids, valid supplies', () => {
    const ids = TERRAIN_TAGS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TERRAIN_TAGS) if (t.objects) expect(t.objects.supply[0]).toBeLessThanOrEqual(t.objects.supply[1]);
  });
});

describe('weapons stub', () => {
  it('a loadout for every archetype; Initiates carry a training saber', () => {
    for (const id of ARCHETYPE_BY_ID.keys()) expect(LOADOUT_BY_ARCHETYPE[id], id).toBeDefined();
    expect(loadoutFor('jediGuardian', 'initiate').weapon).toBe('trainingSaber');
    expect(loadoutFor('jediGuardian', 'knight').weapon).toBe('lightsaber');
  });
});

describe('NPC generation config (npc-generation §2-6)', () => {
  it('role archetypes exist and weights sum to 1; roles are registered', () => {
    for (const [role, list] of Object.entries(ROLE_ARCHETYPES)) {
      expect(NPC_ROLES).toContain(role);
      expect(sum(list.map(([, w]) => w))).toBeCloseTo(1);
      for (const [a] of list) expect(ARCHETYPE_BY_ID.has(a), a).toBe(true);
    }
    for (const m of Object.values(FACTION_ARCHETYPE)) for (const a of Object.values(m)) expect(ARCHETYPE_BY_ID.has(a)).toBe(true);
    expect(ARCHETYPE_BY_ID.has(DEFAULT_ARCHETYPE)).toBe(true);
  });
  it('talent distributions sum to 1', () => {
    for (const d of Object.values(TALENT_ROLL_ORDERS)) expect(sum(d.map(([, p]) => p))).toBeCloseTo(1, 9);
  });
  it('minion grades sum to 1 and archetypes exist', () => {
    for (const k of MINION_KINDS) {
      expect(sum(k.grades)).toBeCloseTo(1);
      expect(ARCHETYPE_BY_ID.has(k.archetype)).toBe(true);
    }
  });
});

describe('canon NPCs (npc-generation §5, D-155)', () => {
  it('canon IDs match the lore index slugs and are unique', () => {
    const ids = CANON_NPCS.map((c) => c.canonId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CANON_NPCS) expect(c.canonId).toBe(`lore:${slugify(c.name)}`);
  });
  it('fields are registered: species, faction, roles, archetype, skills', () => {
    for (const c of CANON_NPCS) {
      expect(SPECIES).toContain(c.speciesId);
      expect(FACTIONS).toContain(c.faction);
      for (const r of [c.role, ...(c.earlierRoles ?? []).map((e) => e.role)]) expect(NPC_ROLES).toContain(r);
      expect(ARCHETYPE_BY_ID.has(c.archetype), c.name).toBe(true);
      for (const k of Object.keys(c.levels)) expect(isSkillId(k), `${c.name}: ${k}`).toBe(true);
      for (const v of Object.values(c.levels)) expect(v).toBeGreaterThanOrEqual(0);
    }
  });
  it('dates are ordered: born before the sheet and before death; every year is marked lore or estimate', () => {
    for (const c of CANON_NPCS) {
      expect(c.birthBby, c.name).toBeGreaterThan(c.snapshotBby);
      expect(['lore', 'estimate']).toContain(c.birthSource);
      if (c.deathBby !== undefined) {
        expect(c.birthBby).toBeGreaterThan(c.deathBby);
        expect(['lore', 'estimate']).toContain(c.deathSource);
      }
    }
  });
  it('each era roster lies inside its span and matches a lore file', () => {
    for (const era of CANON_ERAS) {
      expect(era.fromBby).toBeGreaterThan(era.toBby);
      expect(era.loreFile).toMatch(/^Docs\/SWRPG lore\/SW_Characters_/);
    }
  });
});

describe('canon roster by campaign date (D-155)', () => {
  const names = (bby: number): string[] => canonPresentAt(bby).map((c) => c.name);
  const why = (name: string, bby: number) => canonAbsence(CANON_NPCS.find((c) => c.name === name)!, bby);
  it('3,681 BBY, before Korriban falls: Kao Cen Darach, Padawan Satele, apprentice Malgus and Vindican; no Theron or Hero of Tython', () => {
    const at = names(3681);
    for (const n of ['Kao Cen Darach', 'Satele Shan', 'Darth Malgus', 'Darth Vindican', 'Zym', 'Jace Malcom']) expect(at, n).toContain(n);
    expect(canonRoleAt(CANON_NPCS.find((c) => c.name === 'Satele Shan')!, 3681)).toBe('padawan');
    expect(canonRoleAt(CANON_NPCS.find((c) => c.name === 'Darth Malgus')!, 3681)).toBe('sithAcolyte');
    expect(why('Theron Shan', 3681)).toBe('unborn');
    expect(why('Hero of Tython', 3681)).toBe('unborn');
    expect(why('Aric Jorgan', 3681)).toBe('unborn');
    expect(why('Revan', 3681)).toBe('unavailable');
  });
  it('3,653 BBY, the Sacking: Zym and Ven Zallow (their death year), Malgus; Kao Cen and Vindican dead, Dread Masters imprisoned, Theron too young', () => {
    const at = names(3653);
    for (const n of ['Zym', 'Ven Zallow', 'Darth Malgus', 'Satele Shan', 'Shae Vizla']) expect(at, n).toContain(n);
    expect(why('Kao Cen Darach', 3653)).toBe('dead');
    expect(why('Darth Vindican', 3653)).toBe('dead');
    expect(why('Dread Masters', 3653)).toBe('unavailable');
    expect(why('Theron Shan', 3653)).toBe('tooYoung');
  });
  it('3,640 BBY, the Galactic War: Hero of Tython, Theron, Marr and Revan; Zym and Ngani Zho dead', () => {
    const at = names(3640);
    for (const n of ['Hero of Tython', 'Theron Shan', 'Darth Marr', 'Revan', 'Satele Shan']) expect(at, n).toContain(n);
    expect(why('Zym', 3640)).toBe('dead');
    expect(why('Ngani Zho', 3640)).toBe('dead');
    expect(why('Darth Baras', 3639)).toBe('dead'); // died 3,640 BBY (lore batch 19): present in his death year
  });
  it('Aric Jorgan (born 3,673, lore batch 19) is never an active soldier before 3,655', () => {
    expect(why('Aric Jorgan', 3656)).toBe('tooYoung');
    expect(why('Aric Jorgan', 3655)).toBeNull();
  });
});

describe('flag registry (flag-registry §7 tests 1 and 3)', () => {
  it('unique ids; no rank-gating or engine flag allows ai', () => {
    const ids = FLAGS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FLAGS) if (f.section === 'rank' || f.section === 'engine') expect(f.sources).not.toContain('ai');
  });
  it('flags the specs read are registered (heroicAct, masterApproval, councilBypassGranted, breakingPoint)', () => {
    for (const f of ['heroicAct:fight-1', 'masterApproval', 'councilBypassGranted', 'breakingPoint', 'staleness', 'settlingIn']) expect(flagDef(f), f).not.toBeNull();
  });
  it('param flags need a param; plain flags take none; unknown flags are null', () => {
    expect(flagDef('heroicAct')).toBeNull();
    expect(flagDef('heroicAct:')).toBeNull();
    expect(flagDef('masterApproval:x')).toBeNull();
    expect(flagDef('madeUp')).toBeNull();
  });
});
