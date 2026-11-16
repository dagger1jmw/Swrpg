// Reproduces progression-numbers §20 test 4 (fatigue reference days) and the §9
// willpower references from the spec rules in day.mjs.
// Run: node docs-v2/calc/fatigue-reference.mjs
import { simulateDay } from './day.mjs';

const drills = { id: 'drills', load: { p: 1.0, m: 0.4 } };
const study = { id: 'study', load: { p: 0.05, m: 1.0 } };
const day = (blocks, End, Will = End) => simulateDay(blocks, { End, Will });
const r = (x) => x.toFixed(2);
const rows = [];
function row(name, spec, res) { rows.push([name, spec, res]); }

row('End 30, 3h drills', '2.68', r(day([{ act: drills, hours: 3 }], 30).blocks[0].effHours));
row('End 30, 6h drills', '3.40', r(day([{ act: drills, hours: 6 }], 30).blocks[0].effHours));
row('End 90, 6h drills', '4.51', r(day([{ act: drills, hours: 6 }], 90).blocks[0].effHours));
row('End 90, 8h drills', '4.87', r(day([{ act: drills, hours: 8 }], 90).blocks[0].effHours));
row('End 90, 6h easy (gap -25, x0.3)', '1.35', r(0.3 * day([{ act: drills, hours: 6 }], 90).blocks[0].effHours));
let d = day([{ act: study, hours: 2 }, { act: drills, hours: 3 }], 50);
row('study 2h then drills 3h (50/50)', '2.00 / 2.57', `${r(d.blocks[0].effHours)} / ${r(d.blocks[1].effHours)}`);
d = day([{ act: drills, hours: 3 }, { act: study, hours: 2 }], 50);
row('drills 3h then study 2h', '2.75 / 1.87', `${r(d.blocks[0].effHours)} / ${r(d.blocks[1].effHours)}`);
d = day([{ act: drills, hours: 3 }, { act: study, hours: 3 }], 50);
row('drills 3h then study 3h', '2.75 / 2.26', `${r(d.blocks[0].effHours)} / ${r(d.blocks[1].effHours)}`);
// test 5
const e6 = day([{ act: drills, hours: 6 }], 90), e8 = day([{ act: drills, hours: 8 }], 90);
row('test 5: End 90 8h vs 6h XP gain, f_phys(8h)', '< 10%, > 1.0', `${(100 * (e8.blocks[0].effHours / e6.blocks[0].effHours - 1)).toFixed(1)}%, ${e8.fP.toFixed(2)}`);
// §9 willpower references
row('§9 willpower: 3h drills End 30', '0.0', r(day([{ act: drills, hours: 3 }], 30).willXp));
row('§9 willpower: 6h drills End 90', '1.42', r(day([{ act: drills, hours: 6 }], 90).willXp));
row('§9 willpower: 4h drills + 3h study End 60 Will 40', '2.88', r(day([{ act: drills, hours: 4 }, { act: study, hours: 3 }], 60, 40).willXp));
row('§9 willpower: 8h drills End 60', '3.0', r(day([{ act: drills, hours: 8 }], 60).willXp));

console.log('| Case | Spec value | Computed |\n|---|---|---|');
for (const [a, b, c] of rows) console.log(`| ${a} | ${b} | ${c} |`);
