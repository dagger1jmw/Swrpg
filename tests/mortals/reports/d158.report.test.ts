// Report only (D-267): the D-158 group-size rows (a Knight at 50, flat floor, 300 fights each) under the CANDIDATE,
// on the sweep's seeds (tests/sweep/combatSweep.test.ts).
import { it } from 'vitest';
import { minionKindInEra } from '../../../src/data/npcGen.config';
import { applyCandidate } from '../../support/candidates';
import { CLONE_WARS_DATE, TEST_YEAR } from '../../support/dates';
import { devCharacter, isWounded, PATTERNS, runFight } from '../../support/fightHarness';

const candidate = applyCandidate(process.env['CANDIDATE']);
const MINIONS: Readonly<Record<string, { kind: string; count: number }>> = { '10 B1': { kind: 'battleDroid', count: 10 }, '10 militia': { kind: 'militia', count: 10 }, '6 troopers': { kind: 'trooper', count: 6 }, '6 elites': { kind: 'eliteTrooper', count: 6 }, '4 Mandalorians': { kind: 'mandalorian', count: 4 }, '6 B2': { kind: 'superBattleDroid', count: 6 }, '4 droidekas': { kind: 'droideka', count: 4 } };

it('D-158 rows', async () => {
  const knight = await devCharacter('knight', 50);
  const knightCW = await devCharacter('knight', 50, CLONE_WARS_DATE);
  const out: string[] = [];
  for (const [k, g] of Object.entries(MINIONS))
    for (const pk of ['balanced', 'mixed', 'heavyForce']) {
      let win = 0;
      let wounded = 0;
      let mortal = 0;
      let ex = 0;
      for (let i = 0; i < 300; i++) {
        const f = runFight(minionKindInEra(g.kind, TEST_YEAR) ? knight : knightCW, { minionGroups: [g], terrainTags: ['flatFloor'] }, PATTERNS[pk]!, `rate:${k}:${pk}:${i}`);
        if (f.outcome === 'won') win++;
        if (isWounded(f)) wounded++;
        if (f.finalDuel?.a.wounds.some((w) => w.severity === 'mortal')) mortal++;
        ex += f.exchanges;
      }
      out.push(`${k} | ${pk}: win ${((win / 3)).toFixed(1)} wounded ${(wounded / 3).toFixed(1)} mortal ${(mortal / 3).toFixed(1)} exchanges ${(ex / 300).toFixed(1)}`);
    }
  console.info(`[d158] ${candidate}: ${out.join('; ')}`);
}, 0);