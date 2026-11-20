// The combat engine sweep (Part 2A, D-194): thousands of scripted fights through the real turn resolver, no AI, checked
// for broken behaviour, with win rates and the real level gaps reported. `npm run sweep` (not part of test or
// test:all); re-run after M6 or any combat change. It fails when a check finds broken behaviour; the tables are a report.
import { describe, expect, it } from 'vitest';
import type { ExchangeRecord, Fighter } from '../../src/engine/duel';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { selectCI, selectLevelExact } from '../../src/features/progression/selectors';
import { devCharacter, isWounded, PATTERNS, runFight, type FightResult, type FightSpec } from '../support/fightHarness';
import { CLONE_WARS_DATE, TEST_YEAR } from '../support/dates';
import { minionKindInEra } from '../../src/data/npcGen.config';
import { createMemoryStorage } from '../../src/persist/storage';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { testStartInput } from '../../src/turn/testStart';
import { playerFormLevel } from '../../src/turn/devCommands';
import { TEST_START_DATE } from '../support/dates';

/** Kinds that do not exist at the neutral test date fight in the Clone Wars (D-213), so the sweep measures the kinds it names. */
/** A smuggler at 30 with a blaster pistol (the test start by archetype, D-215): a shooter, for the cover rows (D-243). */
const smugglerBase = async (): Promise<GameState> => {
  const input = testStartInput({ name: 'Smuggler', rank: 'knight', age: 30, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND, archetype: 'smuggler' });
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'sweep-smuggler', branchId: 'b' }, 'smuggler')).state;
};
const eraBase = async (rank: Parameters<typeof devCharacter>[0], age: number, kind: string | null): Promise<GameState> => devCharacter(rank, age, kind && !minionKindInEra(kind, TEST_YEAR) ? CLONE_WARS_DATE : undefined);

const TERRAINS: Readonly<Record<string, string[]>> = { flatFloor: ['flatFloor'], forest: ['fallenTimber', 'unevenGround'], ice: ['slippery', 'iceChunks'], ruins: ['debris', 'looseRock', 'unevenGround', 'cover'], hangar: ['flatFloor', 'crates', 'machinery'] };
const MINIONS: Readonly<Record<string, { kind: string; count: number }>> = {
  '6 B1': { kind: 'battleDroid', count: 6 }, '10 B1': { kind: 'battleDroid', count: 10 }, '6 B2': { kind: 'superBattleDroid', count: 6 }, '4 droidekas': { kind: 'droideka', count: 4 },
  '10 militia': { kind: 'militia', count: 10 }, '6 troopers': { kind: 'trooper', count: 6 }, '6 elites': { kind: 'eliteTrooper', count: 6 }, '4 Mandalorians': { kind: 'mandalorian', count: 4 },
};
const RANKS = [['padawan', 16], ['knight', 30], ['knight', 50], ['master', 50]] as const;
/** Fights per configuration: rank x minion group x terrain x pattern (the Knight at 50 on a flat floor gets more). */
const N_CONFIG = 8;
const N_REFERENCE = 40;
const N_DUEL = 12;
const N_RATE = 300;

interface Issue { kind: string; detail: string; seed: string; config: string }

class Sweep {
  issues: Issue[] = [];
  counts: Record<string, number> = {};
  rows: Record<string, { n: number; win: number; wounded: number; ex: number; captured: number }> = {};
  bump(k: string): void {
    this.counts[k] = (this.counts[k] ?? 0) + 1;
  }
  issue(kind: string, detail: string, seed: string, config: string): void {
    this.bump(`issue:${kind}`);
    if (this.issues.filter((x) => x.kind === kind).length < 5) this.issues.push({ kind, detail, seed, config });
  }
  record(key: string, f: FightResult): void {
    const r = (this.rows[key] ??= { n: 0, win: 0, wounded: 0, ex: 0, captured: 0 });
    r.n++;
    if (f.outcome === 'won') r.win++;
    if (f.reason === 'captured') r.captured++;
    if (isWounded(f)) r.wounded++;
    r.ex += f.exchanges;
  }
  table(prefix = ''): string[] {
    return Object.entries(this.rows)
      .filter(([k]) => k.startsWith(prefix))
      .map(([k, r]) => `${k.padEnd(58)} n ${String(r.n).padStart(4)}  win ${((100 * r.win) / r.n).toFixed(1).padStart(5)}  wounded ${((100 * r.wounded) / r.n).toFixed(1).padStart(5)}  exchanges ${(r.ex / r.n).toFixed(1)}${r.captured ? `  captured ${((100 * r.captured) / r.n).toFixed(1)}` : ''}`);
  }

  /** Every check on one finished fight. */
  check(f: FightResult, base: GameState, seed: string, config: string, pattern: string): void {
    if (!f.outcome) this.issue('neverEnds', `turns ${f.turns}, exchanges ${f.exchanges}`, seed, config);
    const d = f.finalDuel;
    if (!d) return this.issue('noDuel', '', seed, config);
    for (const x of [d.a, ...d.opponents] as Fighter[]) {
      if (x.vitality < -1e-9 || !Number.isFinite(x.vitality)) this.issue('badVitality', `${x.name} ${x.vitality}`, seed, config);
      if (x.dead && !x.out) this.issue('deadAndFighting', x.name, seed, config);
      const sev = x.wounds.filter((w) => w.severed).map((w) => w.part);
      if (new Set(sev).size !== sev.length) this.issue('severedTwice', `${x.name}: ${sev.join(',')}`, seed, config);
    }
    // A minion reported cut down is out; nothing hits it afterwards.
    const cutDown = new Set<string>();
    for (const r of d.log as ExchangeRecord[]) {
      if (!Number.isFinite(r.margin)) this.issue('nanMargin', `#${r.n}`, seed, config);
      if (r.hit && !r.hit.avoided && r.hit.by === 'A' && cutDown.has(r.targetId)) this.issue('hitAfterCutDown', `${r.targetId} at #${r.n}`, seed, config);
      if (r.notes.some((n) => /cuts down/.test(n))) {
        cutDown.add(r.targetId);
        if (!d.opponents.find((o) => o.id === r.targetId)?.out) this.issue('cutDownButStanding', `${r.targetId} at #${r.n}`, seed, config);
      }
      if (r.kind !== 'force' || !r.force) continue;
      const fr = r.force;
      this.bump(`force ${fr.kind}: ${fr.misfire ? 'misfire' : fr.collapse ? 'collapse' : fr.outcome}`);
      const target = d.opponents.find((o) => o.id === r.targetId);
      const known = selectLevelExact(base, fr.abilityId);
      if (known >= 1 && fr.user && fr.user.levelBonus < 0.05) this.issue('zeroLevelBonus', `${fr.abilityId} known ${known.toFixed(1)}, bonus ${fr.user.levelBonus}`, seed, config);
      if (target && (target.forceResistance ?? 0) === 0 && fr.kind !== 'saberThrow' && (fr.resistKind === 'forceResistance' || fr.outcome === 'forceResisted')) this.issue('nonForceUserResisted', `${target.name} vs ${fr.kind}`, seed, config);
      if (target?.forceTraits?.includes('droid') && (fr.resistKind === 'willpower' || fr.outcome === 'willResisted')) this.issue('droidWillpower', `${target.name} vs ${fr.kind}`, seed, config);
    }
    // Sequences: each step of a 3-step sequence has a line (resolved, failed or dropped).
    if (pattern === 'mixed') {
      const lines = f.notes.filter((n) => /^step \d/.test(n));
      // A single Force action logs only a step 1 line; a 3-step sequence logs steps 1 to 3, each DONE, FAILED or NOT REACHED (D-197).
      if (lines.filter((n) => n.startsWith('step 2 ')).length !== lines.filter((n) => n.startsWith('step 3 ')).length) this.issue('stepLineMissing', 'a sequence without a step-3 line', seed, config);
      const unmarked = lines.find((n) => !/: (DONE|FAILED|NOT REACHED) \(/.test(n));
      if (unmarked) this.issue('stepLineUnmarked', unmarked, seed, config);
      if (lines.some((n) => /lands/.test(n))) this.issue('stepSaysLands', lines.find((n) => /lands/.test(n)) ?? '', seed, config);
    }
    // A finished fight with a known Force ability used gives that ability CI.
    const used = new Set(d.log.filter((r) => r.force && !r.force.misfire && r.force.side === 'A').map((r) => r.force!.abilityId));
    for (const a of used) {
      if (selectLevelExact(base, a) < 1 || !f.outcome) continue;
      this.bump('CI checks');
      if (selectCI(f.state, a) <= selectCI(base, a) + 1e-9) this.issue('noCiFromForce', `${a}: ${selectCI(base, a).toFixed(2)} -> ${selectCI(f.state, a).toFixed(2)}`, seed, config);
    }
  }
}

describe('combat sweep', () => {
  it('thousands of scripted fights: no broken behaviour; win rates and gaps reported', async () => {
    const sw = new Sweep();
    const t0 = Date.now();
    let fights = 0;
    // Minion groups: every rank x group x terrain x pattern.
    for (const [rank, age] of RANKS) {
      for (const [mk, g] of Object.entries(MINIONS))
        for (const [tk, tags] of Object.entries(TERRAINS))
          for (const [pk, pat] of Object.entries(PATTERNS)) {
            const n = rank === 'knight' && age === 50 && tk === 'flatFloor' ? N_REFERENCE : N_CONFIG;
            const base = await eraBase(rank, age, g.kind);
            for (let i = 0; i < n; i++) {
              const seed = `${rank}${age}:${mk}:${tk}:${pk}:${i}`;
              const f = runFight(base, { minionGroups: [g], terrainTags: tags }, pat, seed);
              fights++;
              sw.check(f, base, seed, `${rank}${age} vs ${mk} ${tk} ${pk}`, pk);
              sw.record(`${rank}${age} | ${mk} | ${pk}`, f);
            }
          }
    }
    // Named duelists (the gap is measured on the fighting levels).
    for (const [rank, age] of RANKS) {
      const base0 = await devCharacter(rank, age);
      for (const [role, ages] of [['sithAcolyte', [16, 25]], ['sithLord', [30, 40, 55, 70]], ['jediKnight', [25, 35, 50]]] as const)
        for (const ageApprox of ages) {
          const name = `Duelist ${role} ${ageApprox}`;
          const st = applyEvents(REGISTRY, base0, [{ type: 'npcIntroduced', name, species: 'human', faction: role === 'jediKnight' ? 'jediOrder' : 'sithEmpire', role, ageApprox, description: '' }], { source: 'ai' }).state;
          const id = Object.values(st.npcs.byId).find((x) => x.name === name)!.id;
          for (const [pk, pat] of Object.entries(PATTERNS))
            for (let i = 0; i < N_DUEL; i++) {
              const seed = `${rank}${age}:${role}${ageApprox}:${pk}:${i}`;
              const f = runFight(st, { opponentRefs: [id], terrainTags: ['flatFloor'], stakes: 'lethal' }, pat, seed);
              fights++;
              const gap = f.finalDuel ? Math.round((f.finalDuel.opponents[0]!.level - f.finalDuel.a.level) / 10) * 10 : 0;
              sw.check(f, st, seed, `${rank}${age} vs ${role}${ageApprox} ${pk}`, pk);
              sw.record(`duel ${rank}${age} | gap ${gap >= 0 ? '+' : ''}${gap} (${role} ${ageApprox}) | ${pk}`, f);
            }
        }
    }
    // Determinism: the same seed twice gives the same fight.
    const knight = await devCharacter('knight', 50);
    const knightCW = await eraBase('knight', 50, 'battleDroid');
    const knightFor = (kind: string): GameState => (minionKindInEra(kind, TEST_YEAR) ? knight : knightCW);
    for (let i = 0; i < 60; i++) {
      const spec: FightSpec = { minionGroups: [Object.values(MINIONS)[i % 8]!], terrainTags: Object.values(TERRAINS)[i % 5]! };
      const pat = Object.values(PATTERNS)[i % 5]!;
      const a = runFight(knightFor(spec.minionGroups![0]!.kind), spec, pat, `det${i}`);
      const b = runFight(knightFor(spec.minionGroups![0]!.kind), spec, pat, `det${i}`);
      if (JSON.stringify(a.log) !== JSON.stringify(b.log) || a.outcome !== b.outcome) sw.issue('nondeterministic', `${a.log.length} vs ${b.log.length}`, `det${i}`, 'determinism');
    }
    // D-158 group sizes for the Knight at 50 (flat floor).
    for (const k of ['10 B1', '10 militia', '6 troopers', '6 elites', '4 Mandalorians', '6 B2', '4 droidekas'])
      for (const pk of ['balanced', 'mixed', 'heavyForce']) for (let i = 0; i < N_RATE; i++) sw.record(`rates knight50 | ${k} | ${pk}`, runFight(knightFor(MINIONS[k]!.kind), { minionGroups: [MINIONS[k]!], terrainTags: ['flatFloor'] }, PATTERNS[pk]!, `rate:${k}:${pk}:${i}`));
    // Capture (D-262): the same groups sent to take the Knight alive; a group with no subduing means (B2s, droidekas:
    // heavy repeaters) keeps its kill intent, so its rows match the kill rows.
    for (const k of ['10 B1', '10 militia', '6 troopers', '6 elites', '4 Mandalorians', '6 B2', '4 droidekas']) for (let i = 0; i < N_RATE; i++) sw.record(`rates knight50 | ${k} | balanced | capture`, runFight(knightFor(MINIONS[k]!.kind), { minionGroups: [{ ...MINIONS[k]!, wantAlive: true }], terrainTags: ['flatFloor'] }, PATTERNS['balanced']!, `rate:${k}:balanced:${i}`));
    // Cover (D-243): troopers in ruins with cover, against a Knight at 50 and a smuggler at 30 (a shooter: both in cover).
    for (const pk of ['balanced', 'mixed']) for (let i = 0; i < N_RATE; i++) sw.record(`rates knight50 | 6 troopers | ${pk} | cover`, runFight(knightFor('trooper'), { minionGroups: [MINIONS['6 troopers']!], terrainTags: ['cover', 'debris'] }, PATTERNS[pk]!, `cover:${pk}:${i}`));
    const smuggler = await smugglerBase();
    for (const [tag, tags] of [['flat', ['flatFloor']], ['cover', ['cover', 'debris']]] as const) for (let i = 0; i < N_RATE; i++) sw.record(`rates smuggler30 | 4 troopers | balanced | ${tag}`, runFight(smuggler, { minionGroups: [{ kind: 'trooper', count: 4 }], terrainTags: [...tags] }, PATTERNS['balanced']!, `smug:${tag}:${i}`));
    // The real level gaps of generated minions (D-158 measured at fixed gaps; compare there before tuning).
    const gaps: string[] = [];
    for (const [rank, age] of RANKS) {
      for (const [mk, g] of Object.entries(MINIONS)) {
        const base = await eraBase(rank, age, g.kind);
        const xs: number[] = [];
        let pc = 0;
        for (let i = 0; i < 100; i++) {
          const d = runFight(base, { minionGroups: [g] }, PATTERNS['balanced']!, `gap:${mk}:${i}`, 1).finalDuel!;
          pc = d.a.level;
          for (const o of d.opponents) xs.push(o.level - d.a.level);
        }
        xs.sort((a, b) => a - b);
        gaps.push(`${`${rank}${age} (fights at ${pc.toFixed(1)})`.padEnd(30)} ${mk.padEnd(15)} gap median ${xs[Math.floor(xs.length / 2)]!.toFixed(0).padStart(4)}  p10 ${xs[Math.floor(xs.length * 0.1)]!.toFixed(0).padStart(4)}  p90 ${xs[Math.floor(xs.length * 0.9)]!.toFixed(0).padStart(4)}`);
      }
    }
    console.log(
      [
        `COMBAT SWEEP: ${fights} fights in ${((Date.now() - t0) / 1000).toFixed(1)} s`,
        '',
        'Issues (broken behaviour):',
        ...(sw.issues.length ? sw.issues.map((x) => `  ${x.kind}: ${x.detail} [${x.config}; seed ${x.seed}]`) : ['  none']),
        '',
        'Counts:',
        ...Object.entries(sw.counts).sort().map(([k, v]) => `  ${k}: ${v}`),
        '',
        'D-158 group sizes, Knight at 50:',
        ...sw.table('rates '),
        '',
        'Generated minion level gaps:',
        ...gaps,
        '',
        'All configurations:',
        ...sw.table('padawan'),
        ...sw.table('knight'),
        ...sw.table('master'),
        ...sw.table('duel '),
      ].join('\n'),
    );
    expect(sw.issues).toEqual([]);
  }, 3_600_000);

  it('D-268: the share of won duels against Sith duelists that end in withdrawal (report)', async () => {
    const t0 = Date.now();
    // D-268: the share of won duels against named Sith duelists that end in their tactical withdrawal (design target
    // 20-30%). The pass-5 set-up: a Knight test start at 30, dev Sith duelists at a gap of -10, 0 and +10 to the form,
    // 20 duelists a gap (each generated as a Sith Warrior or Inquisitor), 15 fights each.
    const withdrawRows: string[] = [];
    {
      const k30 = await devCharacter('knight', 30, CLONE_WARS_DATE);
      const form = playerFormLevel(k30);
      let wonAll = 0;
      let wdAll = 0;
      for (const gap of [-10, 0, 10]) {
        let won = 0;
        let wd = 0;
        let ex = 0;
        for (let j = 0; j < 20; j++) {
          const name = `Sith ${gap} ${j}`;
          let st = applyEvents(REGISTRY, k30, [{ type: 'npcIntroduced', name, species: 'human', faction: 'sith', role: 'sithLord', ageApprox: 35, description: '' }], { source: 'dev' }).state;
          const id = Object.values(st.npcs.byId).find((x) => x.name === name)!.id;
          st = applyEvents(REGISTRY, st, [{ type: 'devNpcLevelsSet', npcRef: id, level: Math.round((form + gap) * 10) / 10 }], { source: 'dev' }).state;
          for (let i = 0; i < 15; i++) {
            const f = runFight(st, { opponentRefs: [id], terrainTags: ['flatFloor'], stakes: 'serious' }, PATTERNS['balanced']!, `wd:${gap}:${j}:${i}`);
            if (f.outcome !== 'won') continue;
            won++;
            ex += f.exchanges;
            if (f.finalDuel?.opponents[0]?.yielded === 'withdrew') wd++;
          }
        }
        wonAll += won;
        wdAll += wd;
        withdrawRows.push(`knight30 (form ${form.toFixed(1)}) vs Sith duelist gap ${gap >= 0 ? '+' : ''}${gap}: won ${won} of 300, withdrew ${wd} (${won ? ((100 * wd) / won).toFixed(1) : '-'}% of the won), won fights ${won ? (ex / won).toFixed(1) : '-'} exchanges`);
      }
      withdrawRows.push(`all gaps: withdrew ${wdAll} of ${wonAll} won (${((100 * wdAll) / Math.max(1, wonAll)).toFixed(1)}%)`);
    }
    console.log(['D-268 Sith tactical withdrawal, share of won duels (target 20-30%):', ...withdrawRows, `(${((Date.now() - t0) / 1000).toFixed(1)} s)`].join('\n'));
  }, 3_600_000);
});

