// Report probe (D-472): how the species ages and the decline read long-lived figures. Prints; asserts nothing.
import { it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { SPECIES, speciesDef, speciesPrime, speciesTableId } from '../../src/data/species';
import { ageLoss, bodyAge, bodyAgeFromH } from '../../src/engine/ageing';
import { bodyCapAt, humanEquivalentAge } from '../../src/engine/species';
import { canonBodyAge, canonFigureLevelsAt } from '../../src/features/npcs/selectors';
import { canonLivedAgeAt } from '../../src/engine/canonRoster';

const f = (x: number): string => x.toFixed(1);
it('ages', () => {
  const row = (name: string, sp: string, age: number, fc: number): void => {
    const s = speciesDef(sp);
    const b = bodyAge(s, age, fc);
    console.info(`[ages] ${name} | ${s.name} | age ${f(age)} | FC ${f(fc)} | h ${f(humanEquivalentAge(s, age))} | body ${f(b)} | caps ${['strength', 'agility', 'endurance'].map((k) => f(bodyCapAt(sp, k as 'strength', b))).join(' / ')} | loss ${(ageLoss('strength', b) * 100).toFixed(0)}% / ${(ageLoss('agility', b) * 100).toFixed(0)}%`);
  };
  row('Bowdaar 3661 (no Force)', 'wookiee', 177, 0);
  for (const [age, fc] of [[300, 0], [400, 0]] as const) row('a Wookiee', 'wookiee', age, fc);
  for (const [age, fc] of [[25, 60], [300, 100], [600, 110], [874, 110], [900, 110]] as const) row('Yoda', 'yodas_species', age, fc);
  for (const fc of [0, 20, 40, 60, 80, 100, 110]) console.info(`[ages] Human, Force Control ${fc}: body at 60 / 80 / 100 / 120 / 150 / 200 = ${[60, 80, 100, 120, 150, 200].map((h) => f(bodyAgeFromH(h, fc))).join(' / ')}`);
  for (const id of ['zym', 'oteg', 'orgus-din', 'kao-cen-darach', 'bela-kiwiiks', 'gnost-dural', 'tol-braga', 'ngani-zho', 'ven-zallow', 'darth-zash', 'darth-mekhis', 'darth-vowrawn', 'darth-marr', 'darth-vindican', 'darth-angral', 'bowdaar', 'karagga', 'khem-val', 'lord-scourge', 'scourge']) {
    const c = CANON_BY_ID.get(`lore:${id}`);
    if (!c) continue;
    const bby = c.anchors.find((a) => a.complete)?.bby ?? 3661;
    const lv = canonFigureLevelsAt(c, bby, 0);
    const b = canonBodyAge(c, bby, lv['forceControl'] ?? 0);
    const lived = canonLivedAgeAt(c, bby);
    const h = humanEquivalentAge(speciesDef(speciesTableId(c.speciesId)), lived);
    console.info(`[ages] ${c.name} | ${c.speciesId} | ${bby} BBY | lived ${f(lived)} | FC ${f(lv['forceControl'] ?? 0)} | h ${f(h)} | body ${f(b)} | S/A/E ${['strength', 'agility', 'endurance'].map((k) => f(lv[k] ?? 0)).join(' / ')}${c.fixed ? ' | fixed' : ''}`);
  }
  for (const s of SPECIES) console.info(`[species] ${s.name} | adult ${s.maturity} | prime ${f(speciesPrime(s))} | life ${s.lifespan} | scale ${s.bodyScale} (${s.bodyScaleSource ?? '-'}) | peak caps ${['strength', 'agility', 'endurance'].map((k) => f(bodyCapAt(s.id, k as 'strength', 30))).join(' / ')}`);
});
