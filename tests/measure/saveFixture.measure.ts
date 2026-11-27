// opt-2 H1: writes a save fixture from the dev test start at this build (tests/fixtures/saves/<SAVE_NAME>.json). Run once at the
// end of each milestone (docs-v2/progress.md, the habits): SAVE_NAME=<milestone> npx vitest run --config vitest.measure.config.ts saveFixture
import { mkdirSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { makeEnvelope } from '../../src/persist/envelope';
import { createMemoryStorage } from '../../src/persist/storage';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign } from '../../src/turn/campaign';
import { testStartInput } from '../../src/turn/testStart';
import { intentSchema } from '../../src/ai/schemas/intent';
import { runDevCommand } from '../../src/turn/devCommands';
import { resolveTurn } from '../../src/turn/resolve';

it('writes the save fixture', async () => {
  const name = process.env['SAVE_NAME'] ?? 'fixture';
  const req = testStartInput({ name: 'Kael Voss', rank: 'knight', age: 30, startDate: { year: -3661, month: 3, day: 1 }, startSecond: 9 * 3600, archetype: 'jediGuardian', speciesId: 'human' });
  const session = await createCampaign(REGISTRY, createMemoryStorage(), req, { campaignId: 'fixture-campaign', branchId: 'fixture-branch' }, '2026-11-27T00:00:00.000Z');
  mkdirSync('tests/fixtures/saves', { recursive: true });
  writeFileSync(`tests/fixtures/saves/${name}.json`, JSON.stringify(makeEnvelope(REGISTRY, session.state, '2026-11-27T00:00:00.000Z'), null, 1));
});

// m9-missions B12: a save mid-mission (the dev test start's Knight on a recon on Taris, arrived, its first stage tried). On demand:
// npx vitest run --config vitest.measure.config.ts saveFixture -t "mid-mission"
it('writes the mid-mission save fixture', async () => {
  const req = testStartInput({ name: 'Kael Voss', rank: 'knight', age: 30, startDate: { year: -500, month: 3, day: 1 }, startSecond: 9 * 3600, archetype: 'jediGuardian', speciesId: 'human' });
  const session = await createCampaign(REGISTRY, createMemoryStorage(), req, { campaignId: 'fixture-campaign', branchId: 'fixture-branch' }, '2026-11-27T00:00:00.000Z');
  let s = runDevCommand(REGISTRY, session.state, '/home').state;
  s = runDevCommand(REGISTRY, s, '/mission start recon Taris').state;
  s = resolveTurn(REGISTRY, s, intentSchema.parse({ actionType: 'travel', targets: [], references: [], unknownNames: ['Taris'] })).state;
  s = resolveTurn(REGISTRY, s, intentSchema.parse({ actionType: 'other', targets: [], references: [], unknownNames: [] }), { mission: 'stealth' }).state;
  if (s.duty.status !== 'mission') throw new Error('the fixture mission ended early');
  writeFileSync('tests/fixtures/saves/m9-missions-mid.json', JSON.stringify(makeEnvelope(REGISTRY, s, '2026-11-27T00:00:00.000Z'), null, 1));
});
