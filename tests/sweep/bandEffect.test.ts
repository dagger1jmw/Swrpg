// Report probe (D-461, D-462, D-465): how the measured Force Knowledge and Meditation bands move the canon figures (every
// anchor of a sheet-scale figure, Order archetypes, Knight / Master / Council standing). D-465 reads every figure at its own
// Human-equivalent age (lore or estimated birth year); D-462 read only lore birth years there and the rest at the standing
// midpoint. One line per anchor: birth source, read age, the D-462 and D-465 values, and flags (a move over 10, or a read
// age that looks wrong for the standing, so the estimate can be checked).
import { it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { GAME_SCALE_LINES, KNOWLEDGE_BAND_CURVES, STANDING_MIDPOINT, bandReadAge, bandValue, standingBand } from '../../src/data/canon/sheetScale';

/** The youngest read age that fits a standing (a Knight or Lord, a Master or Darth, the Councils). */
const MIN_AGE: Readonly<Record<number, number>> = { 40: 18, 60: 35, 80: 45 };

it('band effect', () => {
  const focus = (a: string): boolean => a === 'jediConsular' || a === 'sithInquisitor';
  const vsOld: Record<string, number[]> = {};
  const vs462: Record<string, number[]> = {};
  const figures = new Set<string>();
  const flagged: string[] = [];
  let anchors = 0;
  for (const c of CANON_BY_ID.values()) {
    if (!KNOWLEDGE_BAND_CURVES[c.archetype] || c.fixed) continue;
    for (const a of c.anchors) {
      if (a.scale !== 'game' || !a.authored) continue;
      const band = standingBand(c, a.bby);
      if (STANDING_MIDPOINT[band] === undefined) continue;
      const age = bandReadAge(c, a.bby);
      const age462 = c.birthSource === 'lore' ? age : null;
      const cells: string[] = [];
      const flags: string[] = [];
      for (const stat of ['forceKnowledge', 'meditation'] as const) {
        const au = a.authored[stat];
        if (au === undefined || GAME_SCALE_LINES[c.canonId]?.[stat] !== undefined) continue;
        const oldV = Math.max(0, Math.min(au, focus(c.archetype) ? band : band - 20));
        const v462 = bandValue(stat, au, band, c.archetype, age462);
        const newV = a.levels[stat]!;
        const key = `${c.archetype} ${stat} band ${band}`;
        (vsOld[key] ??= []).push(newV - oldV);
        (vs462[key] ??= []).push(newV - v462);
        cells.push(`${stat === 'forceKnowledge' ? 'FK' : 'Med'} ${v462} -> ${newV}`);
        if (Math.abs(newV - v462) > 10) flags.push(`${stat === 'forceKnowledge' ? 'FK' : 'Med'} moves ${newV - v462 > 0 ? '+' : ''}${newV - v462}`);
      }
      if (!cells.length) continue;
      if (age < MIN_AGE[band]!) flags.push(`read age ${age.toFixed(1)} young for standing ${band}`);
      const held = c.ranks.filter((r) => r.fromBby >= a.bby && (r.toBby === undefined || r.toBby <= a.bby)).map((r) => r.title).join(', ') || '-';
      anchors++;
      figures.add(c.canonId);
      const line = `${c.name} | ${c.archetype} | birth ${c.birthBby} BBY (${c.birthSource}) | sheet ${a.bby} BBY | read age ${age.toFixed(1)} (D-462: ${age462 === null ? `midpoint ${STANDING_MIDPOINT[band]}` : age462.toFixed(1)}) | standing ${band} (${held}) | ${cells.join(', ')}${flags.length ? ` | FLAG: ${flags.join('; ')}` : ''}`;
      console.info(`[band-figure] ${line}`);
      if (flags.length) flagged.push(c.name);
    }
  }
  const med = (xs: number[]): number => { const s = [...xs].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };
  const fmt = (v: number[]): string => `median ${med(v).toFixed(1)} (${Math.min(...v).toFixed(1)} to ${Math.max(...v).toFixed(1)})`;
  for (const k of Object.keys(vsOld).sort()) console.info(`[band-effect] ${k}: ${vsOld[k]!.length} anchors; vs D-429 ${fmt(vsOld[k]!)}; vs D-462 ${fmt(vs462[k]!)}`);
  console.info(`[band-effect] ${figures.size} figures (${anchors} anchors) read at their own age; flagged: ${flagged.length ? [...new Set(flagged)].join(', ') : 'none'}`);
});
