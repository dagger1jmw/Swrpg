// The simulated year of duty (m9-missions B4-B6; m9-release A7, A11, A16): played through the turn (resolveTurn) with no narrator,
// for an ordinary Knight (a Guardian and a Consular), a powerful Knight, a Master and a Padawan with a Knight master, in peace (500
// BBY), a limited war (1,035 BBY, the Grumani campaigns) and a total war (3,661 BBY, the Great Galactic War). The player takes the
// code's mission choices (the approach with the best skill), resolves fights, begins battles on the suggested plan and lets them
// play out, travels where the code says, and otherwise asks to skip the rest of the year. Each (cell, seed) is one job.
import { intentSchema } from '../../src/ai/schemas/intent';
import { seedRng } from '../../src/engine/rng';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import type { GameState } from '../../src/state/gameState';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { resolveTurn } from '../../src/turn/resolve';
import { runDevCommand } from '../../src/turn/devCommands';
import { testStartInput, type TestStartArchetype } from '../../src/turn/testStart';
import type { Job } from '../support/parallelRuns';
import { dutyWithdrawals, playDutyTurn } from '../support/dutyPlayer';
import { LONG_BOUT } from '../../src/data/progression.config';

export const SEEDS = Number(process.env['SEEDS'] ?? 20);
const DAYS = 365;
const skip = (days: number) => intentSchema.parse({ actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: days >= 7 ? 'timeSkip' : 'montage', requestedSpan: { amount: days, unit: 'days' } });
export const ERAS: Record<string, { year: number }> = { peace: { year: 500 }, limited: { year: 1035 }, total: { year: 3661 } };
export const WHO: Record<string, { rank: 'knight' | 'master' | 'padawan'; age: number; archetype: TestStartArchetype; powerful?: boolean; master?: boolean }> = {
  knight: { rank: 'knight', age: 30, archetype: 'jediGuardian' },
  consularKnight: { rank: 'knight', age: 30, archetype: 'jediConsular' },
  powerfulKnight: { rank: 'knight', age: 34, archetype: 'jediGuardian', powerful: true },
  master: { rank: 'master', age: 50, archetype: 'jediGuardian' },
  padawan: { rank: 'padawan', age: 16, archetype: 'jediGuardian', master: true },
};

async function start(who: string, era: string, seed: string): Promise<GameState> {
  const w = WHO[who]!;
  const input = testStartInput({ name: 'Sim', rank: w.rank, age: w.age, archetype: w.archetype, startDate: { year: -ERAS[era]!.year, month: 1, day: 1 }, startSecond: DEFAULT_START_SECOND });
  const session = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed);
  let s = session.state;
  // A powerful Knight (B6a): top-tier combat, the main form at 72.
  if (w.powerful && s.character.mainFormId) s = { ...s, progression: { ...s.progression, skills: { ...s.progression.skills, [s.character.mainFormId]: { ...(s.progression.skills[s.character.mainFormId] ?? {}), xp: 72 * 72 * 100 } } } } as GameState;
  // The opening would set the scene: the character starts at home (the Temple), as /home does.
  s = runDevCommand(REGISTRY, s, '/home').state;
  // A Padawan's master (B7): a generated Jedi Knight, set as the master.
  if (w.master) {
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: 'Master Sim', species: 'human', faction: 'jediOrder', role: 'jediKnight', description: '' }], { source: 'engine' }).state;
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Master Sim')!.id;
    s = applyEvents(REGISTRY, s, [{ type: 'npcGenerated', npcRef: id }, { type: 'masterSet', npcRef: id }], { source: 'engine' }).state;
  }
  return { ...s, meta: { ...s.meta, rngState: seedRng(seed) } };
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

export interface Year {
  cell: string;
  missions: number; success: number; failure: number; cutShort: number; chains: number; postings: number; leaves: number;
  templeDays: number; longestAway: number; lengthsHome: number[]; lengthsPosted: number[]; turns: number;
  /** Complications recorded (m9-release A11: the drama comes from complications). */
  complications: number;
  /** Why each failure failed (the duty log's line). */
  failWhy: string[];
  /** Days off between missions while posted at the front (A7) and while at home. */
  gapsFront: number[];
  gapsHome: number[];
  /** Mission types assigned (A11: the weights lean toward the path). */
  types: Record<string, number>;
  /** m9-tune2: the duty player's withdrawals (tried, got away), and bouts (fights) and those past 10 exchanges. */
  withdrawTried?: number;
  withdrawAway?: number;
  bouts?: number;
  longBouts?: number;
}

/** Why a failure failed, in a few words, from its log line. */
function failCause(what: string): string {
  if (/deadline/.test(what)) return 'deadline';
  if (/never set out/.test(what)) return 'never set out';
  if (/work undone/.test(what)) return 'came back undone';
  if (/beaten in the fight|fight ended: lost|lost/.test(what)) return 'fight lost';
  if (/battle was/.test(what)) return 'battle';
  return 'complications';
}

export async function year(who: string, era: string, i: number): Promise<Year> {
  let s = await start(who, era, `m9-${who}-${era}-${i}`);
  const t0 = s.clock.now.day;
  const y: Year = { cell: `${era}.${who}`, missions: 0, success: 0, failure: 0, cutShort: 0, chains: 0, postings: 0, leaves: 0, templeDays: 0, longestAway: 0, lengthsHome: [], lengthsPosted: [], turns: 0, complications: 0, failWhy: [], gapsFront: [], gapsHome: [], types: {} };
  let lastTemple = t0;
  const seen = new Set<string>();
  const logSeen = new Set<string>();
  let postedNow = false;
  let leaveNow = false;
  let lastEnd: { day: number; front: boolean } | null = null;
  const w0 = { ...dutyWithdrawals };
  y.bouts = 0;
  y.longBouts = 0;
  for (let guard = 0; guard < 4000 && s.clock.now.day - t0 < DAYS; guard++) {
    y.turns++;
    const before = s;
    let r = playDutyTurn(s);
    if (!r) {
      r = resolveTurn(REGISTRY, s, skip(Math.max(1, DAYS - (s.clock.now.day - t0))));
      if (r.state.clock.now.day === s.clock.now.day && r.state.duty === s.duty && !r.state.combat.active && !r.state.battles.planning) r = resolveTurn(REGISTRY, r.state, skip(1));
    }
    s = r.state;
    for (const ap of r.draft.applied) {
      if (ap.event.type !== 'fightResolved') continue;
      const ns = (ap.event['exchanges'] as { n?: number }[]).map((x) => x.n ?? 0);
      // A bout's exchange numbers restart at 1 (m9-tune2 item 7).
      let max = 0;
      for (const n of [...ns, 1]) {
        if (n === 1 && max > 0) {
          y.bouts++;
          if (max > LONG_BOUT.from) y.longBouts++;
          max = 0;
        }
        max = Math.max(max, n);
      }
    }
    if (templeOf(before)) y.templeDays += Math.max(0, s.clock.now.day - before.clock.now.day);
    if (templeOf(s)) {
      y.longestAway = Math.max(y.longestAway, s.clock.now.day - lastTemple);
      lastTemple = s.clock.now.day;
    }
    if (s.duty.posting && !postedNow) y.postings++;
    postedNow = s.duty.posting !== null;
    if (s.duty.leave && !leaveNow) y.leaves++;
    leaveNow = s.duty.leave !== null;
    for (const l of s.duty.log) {
      const k = `${l.day}|${l.what}`;
      if (logSeen.has(k)) continue;
      logSeen.add(k);
      if (l.what.startsWith('complication:')) y.complications++;
      if (/ failed: | ended: failure|has failed/.test(l.what)) y.failWhy.push(failCause(l.what));
      if (l.what.startsWith('assigned: ')) {
        const m = s.duty.mission;
        if (m) y.types[m.type] = (y.types[m.type] ?? 0) + 1;
        if (lastEnd) (lastEnd.front ? y.gapsFront : y.gapsHome).push(l.day - lastEnd.day);
      }
    }
    for (const h of s.duty.history) {
      if (seen.has(h.id + h.startDay)) continue;
      seen.add(h.id + h.startDay);
      y.missions++;
      if (h.outcome === 'success') y.success++;
      else if (h.outcome === 'failure') y.failure++;
      else y.cutShort++;
      const front = before.duty.posting !== null || s.duty.posting !== null;
      (front ? y.lengthsPosted : y.lengthsHome).push(h.endDay - h.startDay);
      lastEnd = s.duty.status === 'home' ? { day: h.endDay, front: s.duty.posting !== null && s.duty.leave === null } : null;
    }
  }
  y.chains = s.duty.record.chains;
  y.longestAway = Math.max(y.longestAway, s.clock.now.day - lastTemple);
  // Failures with no log line found (a capped log) count as complications.
  while (y.failWhy.length < y.failure) y.failWhy.push('complications');
  y.withdrawTried = dutyWithdrawals.tried - w0.tried;
  y.withdrawAway = dutyWithdrawals.away - w0.away;
  return y;
}

const cells = (): [string, string][] => {
  const out: [string, string][] = [];
  for (const era of Object.keys(ERAS)) for (const who of Object.keys(WHO)) if (!process.env['ONLY'] || process.env['ONLY'].split(',').includes(`${era}.${who}`)) out.push([era, who]);
  return out;
};

/** Every (cell, seed): a total war's year costs more (more missions and battles). */
export const MISSION_JOBS: Job<Promise<Year>>[] = cells().flatMap(([era, who], c) =>
  Array.from({ length: SEEDS }, (_, i) => ({ order: c * 1000 + i, cost: era === 'total' ? 3 : era === 'limited' ? 2 : 1, run: () => year(who, era, i) })),
);

const pct = (xs: number[], p: number): number => {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, z) => x - z);
  return a[Math.min(a.length - 1, Math.floor(p * a.length))]!;
};

/** One cell's table row: medians and ranges, and the pooled rates (total over all seeds). */
export function summarize(ys: readonly Year[]): Record<string, unknown> {
  const med = (f: (y: Year) => number): number => pct(ys.map(f), 0.5);
  const range = (f: (y: Year) => number): string => `${Math.min(...ys.map(f))}-${Math.max(...ys.map(f))}`;
  const sum = (f: (y: Year) => number): number => ys.reduce((a, y) => a + f(y), 0);
  const n = sum((y) => y.missions);
  const share = (k: number): string => `${n ? ((100 * k) / n).toFixed(1) : '0'}%`;
  const home = ys.flatMap((y) => y.lengthsHome);
  const posted = ys.flatMap((y) => y.lengthsPosted);
  const gapsFront = ys.flatMap((y) => y.gapsFront);
  const gapsHome = ys.flatMap((y) => y.gapsHome);
  const why: Record<string, number> = {};
  for (const w of ys.flatMap((y) => y.failWhy)) why[w] = (why[w] ?? 0) + 1;
  const types: Record<string, number> = {};
  for (const y of ys) for (const [k, v] of Object.entries(y.types)) types[k] = (types[k] ?? 0) + v;
  return {
    seeds: ys.length,
    missions: `${med((y) => y.missions)} (${range((y) => y.missions)})`,
    pooled: { missions: n, success: share(sum((y) => y.success)), failure: share(sum((y) => y.failure)), cutShort: share(sum((y) => y.cutShort)), complicationsPerMission: n ? (sum((y) => y.complications) / n).toFixed(2) : '0' },
    failWhy: why,
    medians: { success: med((y) => y.success), failure: med((y) => y.failure), cutShort: med((y) => y.cutShort) },
    chains: `${med((y) => y.chains)} (${range((y) => y.chains)})`,
    postings: med((y) => y.postings),
    leaves: `${med((y) => y.leaves)} (${range((y) => y.leaves)})`,
    templeDays: `${med((y) => y.templeDays)} (${range((y) => y.templeDays)})`,
    longestAway: `${med((y) => y.longestAway)} (${range((y) => y.longestAway)})`,
    lengthFromHome: home.length ? `${pct(home, 0.1)} / ${pct(home, 0.5)} / ${pct(home, 0.9)} (n ${home.length})` : '-',
    lengthPosted: posted.length ? `${pct(posted, 0.1)} / ${pct(posted, 0.5)} / ${pct(posted, 0.9)} (n ${posted.length})` : '-',
    daysOffFront: gapsFront.length ? `${pct(gapsFront, 0.1)} / ${pct(gapsFront, 0.5)} / ${pct(gapsFront, 0.9)} (n ${gapsFront.length})` : '-',
    daysOffHome: gapsHome.length ? `${pct(gapsHome, 0.1)} / ${pct(gapsHome, 0.5)} / ${pct(gapsHome, 0.9)} (n ${gapsHome.length})` : '-',
    types,
    turns: med((y) => y.turns),
    withdrawals: `${sum((y) => y.withdrawAway ?? 0)} got away of ${sum((y) => y.withdrawTried ?? 0)} tried`,
    bouts: `${sum((y) => y.longBouts ?? 0)} past ${LONG_BOUT.from} exchanges of ${sum((y) => y.bouts ?? 0)}`,
  };
}
