// Report probe (D-461, D-462): how the measured Force Knowledge and Meditation bands move the canon figures (every anchor
// of a sheet-scale figure, Order archetypes, Knight / Master / Council standing), against the D-429 rule and against the
// D-461 reading at the standing midpoint; and how many anchors read the figure's own age (a lore birth year) or fall back.
import { it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { GAME_SCALE_LINES, KNOWLEDGE_BAND_CURVES, STANDING_MIDPOINT, bandReadAge, bandValue, standingBand } from '../../src/data/canon/sheetScale';

it('band effect', () => {
  const focus = (a: string): boolean => a === 'jediConsular' || a === 'sithInquisitor';
  const vsOld: Record<string, number[]> = {};
  const vsMid: Record<string, number[]> = {};
  const figures = { actual: new Set<string>(), fallback: new Set<string>() };
  const anchors = { actual: 0, fallback: 0 };
  for (const c of CANON_BY_ID.values()) {
    if (!KNOWLEDGE_BAND_CURVES[c.archetype] || c.fixed) continue;
    for (const a of c.anchors) {
      if (a.scale !== 'game' || !a.authored) continue;
      const band = standingBand(c, a.bby);
      if (STANDING_MIDPOINT[band] === undefined) continue;
      const age = bandReadAge(c, a.bby);
      let used = false;
      for (const stat of ['forceKnowledge', 'meditation'] as const) {
        const au = a.authored[stat];
        if (au === undefined || GAME_SCALE_LINES[c.canonId]?.[stat] !== undefined) continue;
        used = true;
        const oldV = Math.max(0, Math.min(au, focus(c.archetype) ? band : band - 20));
        const midV = bandValue(stat, au, band, c.archetype, null);
        const newV = a.levels[stat]!;
        const key = `${c.archetype} ${stat} band ${band}`;
        (vsOld[key] ??= []).push(newV - oldV);
        (vsMid[key] ??= []).push(newV - midV);
      }
      if (!used) continue;
      if (age !== null) console.info(`[band-effect] own age: ${c.name} (${c.archetype}) at ${a.bby} BBY, Human-equivalent ${age.toFixed(1)}; standing ${band}; Force Knowledge ${a.levels['forceKnowledge'] ?? '-'}, Meditation ${a.levels['meditation'] ?? '-'}`);
      if (age === null) {
        anchors.fallback++;
        figures.fallback.add(c.canonId);
      } else {
        anchors.actual++;
        figures.actual.add(c.canonId);
      }
    }
  }
  const med = (xs: number[]): number => { const s = [...xs].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };
  const fmt = (v: number[]): string => `median ${med(v).toFixed(1)} (${Math.min(...v).toFixed(1)} to ${Math.max(...v).toFixed(1)})`;
  for (const k of Object.keys(vsOld).sort()) console.info(`[band-effect] ${k}: ${vsOld[k]!.length} anchors; vs D-429 ${fmt(vsOld[k]!)}; vs the D-461 midpoint read ${fmt(vsMid[k]!)}`);
  console.info(`[band-effect] read age: ${figures.actual.size} figures (${anchors.actual} anchors) at their own age (lore birth year); ${figures.fallback.size} figures (${anchors.fallback} anchors) at the standing midpoint (estimated birth year)`);
  // The same count if estimated birth years were read too (every roster figure has a birth year).
  let all = 0;
  for (const c of CANON_BY_ID.values()) if (KNOWLEDGE_BAND_CURVES[c.archetype] && !c.fixed && c.anchors.some((a) => a.scale === 'game' && a.authored)) all++;
  console.info(`[band-effect] figures with a band-read anchor: ${all}; birth years: lore ${[...CANON_BY_ID.values()].filter((c) => c.birthSource === 'lore').length}, estimate ${[...CANON_BY_ID.values()].filter((c) => c.birthSource === 'estimate').length} (whole roster)`);
});
