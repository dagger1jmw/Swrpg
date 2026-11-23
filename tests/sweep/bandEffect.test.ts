// Report probe (D-461): how the re-measured Force Knowledge and Meditation bands move the canon figures (every anchor of
// a sheet-scale figure, Order archetypes, Knight / Master / Council standing), against the D-429 rule.
import { it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { GAME_SCALE_LINES, KNOWLEDGE_BANDS, standingBand } from '../../src/data/canon/sheetScale';

it('band effect', () => {
  const focus = (a: string): boolean => a === 'jediConsular' || a === 'sithInquisitor';
  const rows: Record<string, number[]> = {};
  let n = 0;
  for (const c of CANON_BY_ID.values()) {
    if (!KNOWLEDGE_BANDS[c.archetype] || c.fixed) continue;
    for (const a of c.anchors) {
      if (a.scale !== 'game' || !a.authored) continue;
      const band = standingBand(c, a.bby);
      for (const stat of ['forceKnowledge', 'meditation'] as const) {
        const au = a.authored[stat];
        if (au === undefined || GAME_SCALE_LINES[c.canonId]?.[stat] !== undefined) continue;
        const oldV = Math.max(0, Math.min(au, focus(c.archetype) ? band : band - 20));
        const newV = a.levels[stat]!;
        (rows[`${c.archetype} ${stat} band ${band}`] ??= []).push(newV - oldV);
        n++;
      }
    }
  }
  const med = (xs: number[]): number => { const s = [...xs].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };
  for (const [k, v] of Object.entries(rows).sort()) console.info(`[band-effect] ${k}: ${v.length} anchors, change median ${med(v).toFixed(1)} (${Math.min(...v).toFixed(1)} to ${Math.max(...v).toFixed(1)})`);
  console.info(`[band-effect] ${n} values in all`);
});
