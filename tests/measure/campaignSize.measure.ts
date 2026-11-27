// m9-release B2: where the saves live and how big a long campaign gets. The dev test start's Knight in 3,661 BBY (posted in the
// Great Galactic War), two years played with missions (the duty player) and skips; the save envelope's size along the way. Then
// turns through the real pipeline with a narration of a long reply's length, for the transcript entry's size. On demand:
// npx vitest run --config vitest.measure.config.ts campaignSize. Writes JSON to SIZE_OUT.
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { REGISTRY } from '../../src/state/registry';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider } from '../../src/ai/fixtureProvider';
import { intentSchema } from '../../src/ai/schemas/intent';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { seedRng } from '../../src/engine/rng';
import { makeEnvelope } from '../../src/persist/envelope';
import { SAVE_HISTORY } from '../../src/persist/saveHistory';
import { createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { runDevCommand } from '../../src/turn/devCommands';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import { resolveTurn } from '../../src/turn/resolve';
import { testStartInput } from '../../src/turn/testStart';
import { playDutyTurn } from '../support/dutyPlayer';

const skip = (days: number) => intentSchema.parse({ actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: days >= 7 ? 'timeSkip' : 'montage', requestedSpan: { amount: days, unit: 'days' } });
const kb = (n: number): number => Math.round(n / 102.4) / 10;
const envSize = (s: GameState): number => JSON.stringify(makeEnvelope(REGISTRY, s, '2026-11-27T00:00:00.000Z')).length;

/** A long reply's narration (about 2,400 characters, four paragraphs) and four choices. */
const LONG = Array.from({ length: 4 }, (_, i) => `Paragraph ${i + 1}. ` + 'The hangar lights stutter as the transport settles onto the pad, and the smell of coolant and ozone rolls across the deck while the crew calls out the checks. '.repeat(4)).join('\n\n');
const reply = { narrative: LONG, choices: ['Ask the quartermaster about the convoy', 'Check the manifests', 'Find the commander', 'Rest before the trip'].map((label) => ({ label, intent: { actionType: 'other' } })), scene: { moodTags: ['busy', 'tense'] }, events: [] };

it('campaign size', { timeout: 3_600_000 }, async () => {
  const input = testStartInput({ name: 'Kael Voss', rank: 'knight', age: 30, archetype: 'jediGuardian', startDate: { year: -3661, month: 3, day: 1 }, startSecond: DEFAULT_START_SECOND });
  let s = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'size', branchId: 'b' }, 'size')).state;
  s = runDevCommand(REGISTRY, s, '/home').state;
  s = { ...s, meta: { ...s.meta, rngState: seedRng('size') } };
  const t0 = s.clock.now.day;
  const envelope: Record<string, number> = { day0: kb(envSize(s)) };
  let turns = 0;
  for (const mark of [90, 180, 365, 545, 730]) {
    for (let g = 0; g < 6000 && s.clock.now.day - t0 < mark; g++) {
      let r = playDutyTurn(s) ?? resolveTurn(REGISTRY, s, skip(Math.max(1, mark - (s.clock.now.day - t0))));
      if (r.state.clock.now.day === s.clock.now.day && r.state.duty === s.duty && !r.state.combat.active) r = resolveTurn(REGISTRY, r.state, skip(1));
      s = r.state;
      turns++;
    }
    envelope[`day${mark}`] = kb(envSize(s));
  }
  // The transcript entry: turns through the pipeline (stubbed narrator with a long reply), as the browser stores them.
  const provider = createFixtureProvider(Array.from({ length: 120 }, (_, i) => ({ data: { ...reply, narrative: `Turn ${i}. ${reply.narrative.replace(/Paragraph/g, `Scene ${i}, paragraph`)}` } })));
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  const router = createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => 0 });
  const storage = createMemoryStorage();
  let ms = Date.UTC(2026, 10, 27);
  const deps: TurnDeps = { registry: REGISTRY, provider, router, storage, getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }) };
  let session: Session = { state: s, history: [], campaign: { campaignId: 'size', name: 'Kael Voss', createdAt: 'x', lastPlayedAt: 'x' } };
  for (let i = 0; i < 30; i++) session = (await playTurn(deps, session, { kind: 'choice', choice: { label: 'Rest a while', intent: { actionType: 'rest' } } })).session;
  const entries = storage.transcript.map((e) => JSON.stringify(e).length);
  const entry = entries.reduce((a, b) => a + b, 0) / entries.length;
  const snapshots = 1 + SAVE_HISTORY.recent + SAVE_HISTORY.dailyDays;
  const env2y = envelope['day730']! * 1024;
  const campaign = (n: number) => ({ turns: n, transcriptMB: Math.round((n * entry) / 104857.6) / 10, snapshotsMB: Math.round((snapshots * env2y) / 104857.6) / 10 });
  const out = { envelopeKB: envelope, simulatedTurns: turns, transcriptEntryKB: kb(entry), snapshotsKept: snapshots, longCampaign: [campaign(500), campaign(1500), campaign(3000)] };
  console.log(JSON.stringify(out, null, 1));
  if (process.env['SIZE_OUT']) writeFileSync(process.env['SIZE_OUT'], JSON.stringify(out, null, 2));
});
