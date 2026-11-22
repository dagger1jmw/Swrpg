// Timeline audit (overnight run item 3, D-408): steps the game year from 3,661 to 3,640 BBY and prints what each
// date-driven table says, plus cross-checks between them. Run: npx tsx scripts/audit-timeline.ts [fromBby] [toBby]
import { CANON_NPCS } from '../src/data/canonNpcs';
import { CANON_PLACEMENTS } from '../src/data/canonPlacements';
import { ERA_RULES } from '../src/data/eraRules';
import { rankErasAt } from '../src/data/eraRanks';
import { closedWorlds, PLANETS, WORLD_GATES } from '../src/data/galaxyMap';
import { orderSeatAt, ORDER_SEATS } from '../src/data/orderSeats';
import { FACTION_LEADERS, leadersAt, WORLD_CONTROL } from '../src/data/worldControl';
import { canonBoardAt, canonOffBoard } from '../src/engine/canonRoster';
import { planTrip } from '../src/engine/travel';
import { LORE_INDEX } from '../src/lore/index';
import { isEligible } from '../src/lore/retrieve';

const from = Number(process.argv[2] ?? 3661);
const to = Number(process.argv[3] ?? 3640);
const findings: string[] = [];
const flag = (s: string): void => {
  if (!findings.includes(s)) findings.push(s);
};
const byName = (holder: string) => CANON_NPCS.find((n) => holder.toLowerCase().includes(n.name.toLowerCase()) && n.name.length > 3);
const CORUSCANT = { name: 'Coruscant', region: 'Core Worlds', grid: 'L-9' };

let prevBoard = new Set<string>();
for (let bby = from; bby >= to; bby--) {
  const year = -bby;
  const lines: string[] = [`== ${bby} BBY ==`];
  // Board
  const board = canonBoardAt(bby);
  const ids = new Set(board.map((n) => n.canonId));
  if (bby !== from) {
    const off = [...prevBoard].filter((x) => !ids.has(x));
    const on = [...ids].filter((x) => !prevBoard.has(x));
    lines.push(`board: ${board.length} (+${on.length}: ${on.join(', ')}) (-${off.length}: ${off.map((x) => `${x} [${canonOffBoard(CANON_NPCS.find((n) => n.canonId === x)!, bby)}]`).join(', ')})`);
  } else lines.push(`board: ${board.length}`);
  prevBoard = ids;
  // Leaders, with a check against the roster
  const leaders = leadersAt(bby);
  lines.push(`leaders: ${leaders.map((l) => `${l.office}=${l.holder.split(' (')[0]}`).join('; ')}`);
  for (const l of leaders) {
    const n = byName(l.holder);
    if (n) {
      const why = canonOffBoard(n, bby);
      if (why && why !== 'imprisoned') flag(`leader ${l.office} = ${n.name} in ${bby}, but the roster has them ${why} (birth ${n.birthBby}, death ${n.deathBby ?? '-'})`);
    }
  }
  for (const office of new Set(FACTION_LEADERS.map((l) => l.office))) {
    const h = leaders.filter((l) => l.office === office);
    if (h.length === 0) lines.push(`  (no ${office})`);
  }
  // Order seat vs the Tython gate
  const seat = orderSeatAt(year);
  lines.push(`seat: ${seat}`);
  const closedRep = closedWorlds('republic', bby).map((g) => g.place);
  const closedSith = closedWorlds('sithEmpire', bby).map((g) => g.place);
  if (seat && /Tython/.test(seat) && !/relocating/.test(seat) && closedRep.includes('Tython')) flag(`${bby}: the Order seat is on Tython but Tython is closed to the Republic`);
  lines.push(`closed (republic): ${closedRep.join(', ')}`);
  lines.push(`closed (sith only): ${closedSith.filter((x) => !closedRep.includes(x)).join(', ')}`);
  // Control
  const ctl = WORLD_CONTROL.filter((c) => bby <= c.fromBby && bby >= c.toBby);
  lines.push(`control: ${ctl.map((c) => `${c.place}=${c.side}`).join('; ')}`);
  for (const c of ctl) {
    const gate = WORLD_GATES.find((g) => g.place === c.place);
    const isClosedAll = closedWorlds('other', bby).some((g) => g.place === c.place);
    if (c.side === 'unknown to the galaxy' && gate && !isClosedAll) flag(`${bby}: control says ${c.place} is unknown to the galaxy, but its gate is open (opens ${gate.opensBby})`);
    if (c.side === 'republic' && closedRep.includes(c.place) && gate?.closedTo !== 'all') flag(`${bby}: ${c.place} is Republic-held but closed to the Republic`);
    if (c.side === 'sithEmpire' && closedSith.includes(c.place) && gate?.closedTo !== 'all') flag(`${bby}: ${c.place} is Imperial-held but closed to the Empire`);
  }
  for (const g of WORLD_GATES) {
    const c = WORLD_CONTROL.find((x) => x.place === g.place && x.side === 'unknown to the galaxy');
    if (c && bby <= c.fromBby && !(bby >= c.toBby) && closedWorlds('other', bby).some((x) => x.place === g.place)) flag(`${bby}: ${g.place} is closed (gate opens ${g.opensBby}) though control's "unknown" span ended at ${c.toBby}`);
  }
  // Placements vs the board
  for (const p of CANON_PLACEMENTS) {
    if (!p.canonId || bby > p.fromBby || bby < p.toBby) continue;
    const n = CANON_NPCS.find((x) => x.canonId === p.canonId);
    if (!n) {
      flag(`placement ${p.name}: canonId ${p.canonId} is not in the roster`);
      continue;
    }
    const why = canonOffBoard(n, bby);
    if (p.imprisoned ? why !== 'imprisoned' : why !== null) flag(`${bby}: ${p.name} is placed at ${p.place} but the board says ${why ?? 'on board'}`);
  }
  // Rank eras and era rules
  lines.push(`rank eras: ${rankErasAt(year).map((r) => r.era).join(' | ')}`);
  lines.push(`era rules: ${ERA_RULES.filter((r) => bby <= r.fromBby && bby >= r.toBby).map((r) => r.id).join(', ')}`);
  // Travel from Coruscant to the gated map worlds, Republic and Imperial sides
  const refused: string[] = [];
  for (const side of ['republic', 'sithEmpire'] as const) {
    for (const g of closedWorlds(side, bby)) {
      const w = PLANETS.find((p) => p.name.toLowerCase() === g.place.toLowerCase() || p.name.toLowerCase().startsWith(`${g.place.toLowerCase()} `));
      if (!w) continue;
      const plan = planTrip({ from: CORUSCANT, to: { name: w.name, region: w.region, grid: w.grid }, bby, faction: side, shipClass: 2, closedReason: g.reason });
      if (!plan.ok) refused.push(`${side === 'republic' ? 'R' : 'S'}:${w.name}`);
    }
  }
  lines.push(`travel refused from Coruscant: ${refused.join(', ')}`);
  // Lore index: timeline chunks newly eligible this year
  const newlyEligible = LORE_INDEX.chunks.filter((c) => isEligible(c, year) && !isEligible(c, year - 1));
  lines.push(`lore chunks becoming eligible: ${newlyEligible.length} (${newlyEligible.slice(0, 6).map((c) => `${c.kind}:${c.title}`).join('; ')})`);
  console.log(lines.join('\n'));
}

// Static checks
for (const s of ORDER_SEATS) if (s.fromYear >= -3661 && s.toYear <= -3600 && s.estimate) flag(`order seat ${s.seat}: estimate (${s.estimate})`);
for (const p of CANON_PLACEMENTS) if (!p.canonId) flag(`placement ${p.name} at ${p.place} has no roster entry (narrator name only)`);
console.log('\n== Findings ==');
for (const f of findings) console.log(`- ${f}`);
