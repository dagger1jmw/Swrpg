// Diagnosis probe (Phase B): Obi-Wan's yearly main-form XP, its combat part and the 4.0x discards.
import { it } from 'vitest';
import { gated, OBIWAN } from '../lifetime/profiles';
import { fightStats, runLifetime } from '../support/lifetime';

it('obi clamp', () => {
  const es: string[] = [];
  const r = runLifetime(gated(OBIWAN), 45, {
    onDay: (s, { age }) => {
      if (Math.abs(age - Math.round(age)) < 1 / 300 && Math.round(age) % 2 === 0 && age > 14 && age < 40)
        es.push(`${Math.round(age)}: E ${JSON.stringify(s.progression.E).slice(0, 120)} bank ${Object.entries(s.progression.bank ?? {}).map(([k, v]) => `${k}=${Number(v).toFixed(0)}`).join(',')}`);
    },
  });
  console.info(`[obiclamp] bankShare ${r.bankShare.toFixed(3)}`);
  for (const e of es) console.info(`[obiclamp] ${e}`);
  console.info(`[obiclamp] combat XP discarded ${fightStats.combatDiscardedXp.toFixed(0)}; discarded sessions ${r.discarded}; milestones ${JSON.stringify(r.milestones)}`);
  console.info(`[obiclamp] yearMain ${r.yearMain.map((x) => x.toFixed(0)).join(' ')}`);
  console.info(`[obiclamp] yearCombat ${r.yearCombat.map((x) => x.toFixed(0)).join(' ')}`);
}, 3_600_000);
