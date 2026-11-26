// Droid selectors (M8 checklist item 7; docs-v2/spec/droids.md). Read-only views of the droids slice for the narrator, the
// economy (what can be sold) and the ship rules (astromech hooks).
import { DROID_LOCATIONS, type DroidSkill } from '../../data/droids.config';
import { DROID_MODELS } from '../../data/droidModels';
import { dateFromAbsDay, SECONDS_PER_DAY } from '../../engine/calendar';
import {
  astromechHooks,
  droidStatus,
  modelForPriceRow,
  modelInService,
  modelOf,
  personalityP,
  personalityStage,
  quirksOf,
  ratedSkills,
  regardText,
  type AstromechHooks,
  type DroidUnit,
} from '../../engine/droids';
import { KIND_OF_MODEL } from '../../data/droidModels';
import type { GameState } from '../../state/gameState';

export const selectDroids = (s: GameState): readonly DroidUnit[] => s.droids.units;
const nowSec = (s: GameState): number => s.clock.now.day * SECONDS_PER_DAY + s.clock.now.second;
const today = (s: GameState): number => s.clock.now.day;

/** The owned droid a reference names: its id, its name or designation, or its model's words; the only droid when there is one. */
export function selectDroidByRef(s: GameState, ref: string | undefined): DroidUnit | null {
  const units = selectDroids(s);
  if (!ref) return units.length === 1 ? units[0]! : null;
  const r = ref.trim().toLowerCase();
  return (
    units.find((u) => u.id.toLowerCase() === r) ??
    units.find((u) => u.name.toLowerCase() === r) ??
    units.find((u) => r.includes(u.name.toLowerCase()) || u.name.toLowerCase().includes(r)) ??
    units.find((u) => modelOf(u).name.toLowerCase().includes(r) || r.includes(modelOf(u).name.toLowerCase())) ??
    null
  );
}

/** The owned droid a sale of this catalog row sells (its model, or a model of the generic row's kind); never an impounded one. */
export function selectDroidForSale(s: GameState, rowId: string): DroidUnit | null {
  const year = dateFromAbsDay(today(s)).year;
  const m = modelForPriceRow(rowId, year);
  if (!m) return null;
  const free = selectDroids(s).filter((u) => !u.impounded);
  return free.find((u) => u.modelId === m.id) ?? (rowId.startsWith('droid:') ? null : (free.find((u) => KIND_OF_MODEL(modelOf(u)) === KIND_OF_MODEL(m)) ?? null));
}

/** The astromech hooks of the best working astromech the character owns (for the ship rules, checklist item 13); null if none. */
export function selectAstromech(s: GameState): { unit: DroidUnit; hooks: AstromechHooks } | null {
  const best = selectDroids(s)
    .filter((u) => !u.impounded && modelOf(u).starfighterInterface)
    .map((unit) => ({ unit, hooks: astromechHooks(unit, today(s), nowSec(s)) }))
    .sort((a, b) => b.hooks.astrogation + b.hooks.repair - (a.hooks.astrogation + a.hooks.repair))[0];
  return best ?? null;
}

const fmtSkills = (r: Partial<Record<DroidSkill, number>>): string =>
  Object.entries(r)
    .map(([k, v]) => `${k} ${Math.round(v)}`)
    .join(', ');

/** One owned droid, for the narrator. */
export function droidLine(s: GameState, u: DroidUnit): string {
  const m = modelOf(u);
  const day = today(s);
  const stage = personalityStage(personalityP(u, day));
  const status = droidStatus(u, nowSec(s));
  const hurt = DROID_LOCATIONS.filter((l) => (u.systems[l] ?? 'working') !== 'working').map((l) => `${l} ${u.systems[l]}`);
  const ion = u.disabledUntil !== null && u.disabledUntil > nowSec(s) ? `ionized for ${Math.ceil((u.disabledUntil - nowSec(s)) / 60)} more min` : null;
  const quirks = quirksOf(u, day);
  const parts = [
    `${u.name} [${u.id}] (${m.name}, class ${m.cls}${m.also ? `/${m.also}` : ''})`,
    `personality ${stage}${stage === 'full' ? ' (a full companion)' : ''}${quirks.length ? `: ${quirks.join('; ')}` : ''}`,
    `toward its owner: ${regardText(u, day)}`,
    ...(u.bolt ? ['restraining bolt fitted'] : []),
    `${status}${hurt.length ? ` (${hurt.join(', ')})` : ''}${ion ? `, ${ion}` : ''}`,
    ...(m.shield ? [`shield ${u.shieldStops ? 'up' : 'down'}`] : []),
    ...(u.impounded ? ['impounded by the authorities'] : []),
    ...(u.stolen ? ['stolen property'] : []),
    `skills ${fmtSkills(ratedSkills(u, day))}`,
  ];
  return `- ${parts.join('; ')}.`;
}

/** The narrator's droid lines (the engine owns droids: the events report, the code decides). */
export function selectDroidLines(s: GameState): string[] {
  const year = dateFromAbsDay(today(s)).year;
  const units = selectDroids(s);
  const sold = DROID_MODELS.filter((m) => !m.generic && m.price !== null && modelInService(m, year)).map((m) => m.name);
  const lines = [
    `DROIDS (property and companions, never playable; the engine owns them: buy new or sell with trade; second-hand, salvage, gifts, theft, wipes, bolts, orders, upgrades, repairs, damage and losses with the droid event). Models sold this year: ${sold.length ? sold.join(', ') : 'generic protocol, astromech, medical, labour and security droids'}.`,
  ];
  if (units.length) {
    lines.push('Owned droids:', ...units.map((u) => droidLine(s, u)));
    lines.push('A memory wipe is a hard choice, not a dark-side act; droids are not people for alignment; companions may react to how droids are treated; droid rights is a contested movement.');
  }
  return lines;
}

/** The Possessions tab's card for each droid (m8-ship-life part F): model, condition, modules, memory, bolt, where. */
export function selectDroidCards(s: GameState): { id: string; name: string; model: string; condition: string; modules: string; memory: string; bolt: string; where: string }[] {
  const day = today(s);
  return selectDroids(s).map((u) => {
    const m = modelOf(u);
    const hurt = DROID_LOCATIONS.filter((l) => (u.systems[l] ?? 'working') !== 'working').map((l) => `${l} ${u.systems[l]}`);
    const years = Math.max(0, (day - u.wipedDay) / 365.25);
    return {
      id: u.id,
      name: u.name,
      model: m.name,
      condition: `${droidStatus(u, nowSec(s))}${hurt.length ? ` (${hurt.join(', ')})` : ''}`,
      modules: [...u.modules.map((x) => `${x.skill} +${x.gain}`), ...u.reprogrammed.map((x) => `reprogrammed: ${x}`)].join(', ') || 'factory',
      memory: `${years < 1 ? `${Math.round(years * 12)} months` : `${Math.round(years * 10) / 10} years`} since the last wipe; personality ${personalityStage(personalityP(u, day))}`,
      bolt: u.bolt ? 'restraining bolt fitted' : 'no bolt',
      where: u.impounded ? 'impounded' : 'with the character',
    };
  });
}
