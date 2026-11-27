// m9-missions B4, B5, B6 (reports/m9-missions.md): a simulated year of duty, played through the turn (resolveTurn) with no
// narrator, for an ordinary Knight, a powerful Knight and a Master, in peace (500 BBY), a limited war (1,035 BBY, the Grumani
// campaigns) and a total war (3,661 BBY, the Great Galactic War). The player: takes the code's mission choices (the approach
// with the best skill), resolves fights, begins battles on the suggested plan and lets them play out, travels where the code
// says, and otherwise asks to skip the rest of the year. Writes JSON to MISSIONS_OUT.
// On demand: npx vitest run --config vitest.measure.config.ts missions
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { intentSchema } from '../../src/ai/schemas/intent';
import type { Choice } from '../../src/ai/schemas/compose';
import { APPROACHES, type ApproachId } from '../../src/data/missions.config';
import { seedRng } from '../../src/engine/rng';
import { selectAtHome } from '../../src/features/duty/selectors';
import { selectPerformance } from '../../src/features/progression/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { REGISTRY } from '../../src/state/registry';
import type { GameState } from '../../src/state/gameState';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { expandChoice } from '../../src/turn/expandChoice';
import { missionChoices } from '../../src/turn/missionTurn';
import { resolveTurn } from '../../src/turn/resolve';
import { runDevCommand } from '../../src/turn/devCommands';
import { testStartInput } from '../../src/turn/testStart';

const SEEDS = Number(process.env['SEEDS'] ?? 20);
const DAYS = 365;
const skip = (days: number) => intentSchema.parse({ actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: days >= 7 ? 'timeSkip' : 'montage', requestedSpan: { amount: days, unit: 'days' } });
const ERAS: Record<string, { year: number }> = { peace: { year: 500 }, limited: { year: 1035 }, total: { year: 3661 } };
const WHO: Record<string, { rank: 'knight' | 'master'; age: number; powerful?: boolean }> = { knight: { rank: 'knight', age: 30 }, powerfulKnight: { rank: 'knight', age: 34, powerful: true }, master: { rank: 'master', age: 50 } };

async function start(who: string, era: string, seed: string): Promise<GameState> {
  const w = WHO[who]!;
  const input = testStartInput({ name: 'Sim', rank: w.rank, age: w.age, startDate: { year: -ERAS[era]!.year, month: 1, day: 1 }, startSecond: DEFAULT_START_SECOND });
  const session = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed);
  let s = session.state;
  // A powerful Knight (B6a): top-tier combat, the main form at 72.
  if (w.powerful && s.character.mainFormId) s = { ...s, progression: { ...s.progression, skills: { ...s.progression.skills, [s.character.mainFormId]: { ...(s.progression.skills[s.character.mainFormId] ?? {}), xp: 72 * 72 * 100 } } } } as GameState;
  // The opening would set the scene: the character starts at home (the Temple), as /home does.
  s = runDevCommand(REGISTRY, s, '/home').state;
  return { ...s, meta: { ...s.meta, rngState: seedRng(seed) } };
}

/** The approach a sensible player takes: the code's choice whose skill is the character's best. */
function pick(s: GameState, ch: Choice[]): Choice {
  const score = (c: Choice): number => {
    const a = c.intent.missionApproach as ApproachId | undefined;
    const skill = a && a in APPROACHES ? APPROACHES[a].skill : null;
    return skill ? selectPerformance(s, skill) : -1;
  };
  return [...ch].sort((a, b) => score(b) - score(a))[0]!;
}

const templeOf = (s: GameState): boolean => {
  const chain: string[] = [];
  let id = s.locations.currentId;
  for (let i = 0; id && i < 10; i++) {
    const l = s.locations.byId[id];
    if (!l) break;
    chain.push(l.name);
    id = l.parentId;
  }
  return chain.some((n) => /temple|coruscant/i.test(n)) && !s.duty.posting;
};

interface Year { missions: number; success: number; failure: number; cutShort: number; chains: number; postings: number; leaves: number; templeDays: number; longestAway: number; lengthsHome: number[]; lengthsPosted: number[]; turns: number }

async function year(who: string, era: string, i: number): Promise<Year> {
  let s = await start(who, era, `m9-${who}-${era}-${i}`);
  const t0 = s.clock.now.day;
  const y: Year = { missions: 0, success: 0, failure: 0, cutShort: 0, chains: 0, postings: 0, leaves: 0, templeDays: 0, longestAway: 0, lengthsHome: [], lengthsPosted: [], turns: 0 };
  let lastTemple = t0;
  const seen = new Set<string>();
  let postedNow = false;
  let leaveNow = false;
  for (let guard = 0; guard < 3000 && s.clock.now.day - t0 < DAYS; guard++) {
    y.turns++;
    const before = s;
    let r;
    if (s.combat.active) r = resolveTurn(REGISTRY, s, null, { beat: { action: 'resolve' } as never });
    else if (s.battles.planning && !s.battles.ground) {
      r = resolveTurn(REGISTRY, s, null, { battle: { ground: { act: 'begin' } } });
      if (r.state.battles.planning && !r.state.battles.ground) r = resolveTurn(REGISTRY, s, null, { battle: { ground: { act: 'standDown' } } });
    } else if (s.battles.ground) r = resolveTurn(REGISTRY, s, null, { battle: { ground: { act: 'auto' } } });
    else if (s.battles.active) r = resolveTurn(REGISTRY, s, null, { battle: { auto: true } });
    else {
      const ch = missionChoices(s);
      if (ch.length) {
        const c = pick(s, ch);
        r = resolveTurn(REGISTRY, s, intentSchema.parse(expandChoice(c, () => null).intent), c.intent.missionApproach ? { mission: c.intent.missionApproach } : {});
      } else r = resolveTurn(REGISTRY, s, skip(Math.max(1, DAYS - (s.clock.now.day - t0))));
      if (r.state.clock.now.day === s.clock.now.day && r.state.duty === s.duty && !r.state.combat.active && !r.state.battles.planning) r = resolveTurn(REGISTRY, r.state, skip(1));
    }
    if (process.env['TRACE'] && guard < 400) console.log('T', s.clock.now.day - t0, r.draft.timeAdvanced?.interrupted ?? '', '|', r.draft.report.filter((x) => /mission|travel|refused/.test(x)).join(' / ').slice(0, 160), '|', r.state.duty.status, r.state.duty.mission?.phase ?? '', r.state.world.captivity ? 'HELD' : '', r.state.health.death ? 'DEAD' : '');
    s = r.state;
    // Days at the Temple and the longest time away (from the day the character was last there).
    if (templeOf(before)) y.templeDays += Math.max(0, s.clock.now.day - before.clock.now.day);
    if (templeOf(s)) {
      y.longestAway = Math.max(y.longestAway, s.clock.now.day - lastTemple);
      lastTemple = s.clock.now.day;
    }
    if (s.duty.posting && !postedNow) y.postings++;
    postedNow = s.duty.posting !== null;
    if (s.duty.leave && !leaveNow) y.leaves++;
    leaveNow = s.duty.leave !== null;
    for (const h of s.duty.history) {
      if (seen.has(h.id + h.startDay)) continue;
      seen.add(h.id + h.startDay);
      y.missions++;
      if (h.outcome === 'success') y.success++;
      else if (h.outcome === 'failure') y.failure++;
      else y.cutShort++;
      (before.duty.posting || s.duty.posting ? y.lengthsPosted : y.lengthsHome).push(h.endDay - h.startDay);
    }
  }
  y.chains = s.duty.record.chains;
  y.longestAway = Math.max(y.longestAway, s.clock.now.day - lastTemple);
  void selectAtHome;
  return y;
}

const pct = (xs: number[], p: number): number => {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, z) => x - z);
  return a[Math.min(a.length - 1, Math.floor(p * a.length))]!;
};

// 20 seeds x 9 cells take about 12 minutes on one thread: past the measure config's 10-minute default.
it('a simulated year of missions', { timeout: 3_600_000 }, async () => {
  const out: Record<string, unknown> = {};
  const t = Date.now();
  for (const era of Object.keys(ERAS)) {
    for (const who of Object.keys(WHO)) {
      if (process.env['ONLY'] && process.env['ONLY'] !== `${era}.${who}`) continue;
      const ys: Year[] = [];
      for (let i = 0; i < SEEDS; i++) ys.push(await year(who, era, i));
      const med = (f: (y: Year) => number): number => pct(ys.map(f), 0.5);
      const range = (f: (y: Year) => number): string => `${Math.min(...ys.map(f))}-${Math.max(...ys.map(f))}`;
      const home = ys.flatMap((y) => y.lengthsHome);
      const posted = ys.flatMap((y) => y.lengthsPosted);
      out[`${era}.${who}`] = {
        missions: `${med((y) => y.missions)} (${range((y) => y.missions)})`,
        success: med((y) => y.success), failure: med((y) => y.failure), cutShort: med((y) => y.cutShort),
        chains: `${med((y) => y.chains)} (${range((y) => y.chains)})`,
        postings: med((y) => y.postings), leaves: `${med((y) => y.leaves)} (${range((y) => y.leaves)})`,
        templeDays: `${med((y) => y.templeDays)} (${range((y) => y.templeDays)})`,
        longestAway: `${med((y) => y.longestAway)} (${range((y) => y.longestAway)})`,
        lengthFromHome: home.length ? `${pct(home, 0.1)} / ${pct(home, 0.5)} / ${pct(home, 0.9)} (n ${home.length})` : '-',
        lengthPosted: posted.length ? `${pct(posted, 0.1)} / ${pct(posted, 0.5)} / ${pct(posted, 0.9)} (n ${posted.length})` : '-',
        turns: med((y) => y.turns),
      };
      console.log(era, who, JSON.stringify(out[`${era}.${who}`]));
    }
  }
  out['runtimeSeconds'] = Math.round((Date.now() - t) / 1000);
  console.log('runtime', out['runtimeSeconds'], 's');
  if (process.env['MISSIONS_OUT']) writeFileSync(process.env['MISSIONS_OUT'], JSON.stringify(out, null, 2));
});
