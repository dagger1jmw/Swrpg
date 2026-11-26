// Tactics feature (m8-ship-life part G; D-519; docs-v2/spec/ship-life.md section 10). Tactics are knowledge: known ones are
// usable (the battle menu offers only those), seen ones are recognised (the +1 of a known enemy formation) but not usable.
// Learning: a programme's graduation (the ranks feature sends its sets), what a career's own training implies (at creation and
// for old saves), being taught or studying (the narrator's words on the droid event, "tactic: taught the Corellian Slip by
// Master Sel"), and practice after seeing it. Battles send what each side flew (tacticsSeen).
import { z } from 'zod';
import { ARCHETYPE_TACTICS, NPC_TACTICS, PILOT_BASICS, PRACTICE_TO_KNOW, RANK_TACTICS, START_TACTICS, TACTICS, TACTIC_BY_ID, TACTIC_SETS, tacticsOfSets } from '../../data/tactics';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, HandleResult, InitCtx } from '../../state/types';
import { emptyTactics, tacticsSliceSchema, type TacticsSlice } from './tactics';
import { selectTacticLines } from './selectors';

type R = HandleResult<TacticsSlice>;

/** What a character's own career, start and rank imply (old saves and new characters alike), with the source of each. */
export function impliedTactics(c: { archetype?: string; path?: string; start?: { optionId: string } }, rank: string | null, day: number): TacticsSlice['known'] {
  const out: TacticsSlice['known'] = {};
  const add = (ids: readonly string[], source: string): void => {
    for (const id of ids) if (!out[id] && TACTIC_BY_ID.has(id)) out[id] = { source, day };
  };
  add(PILOT_BASICS, 'every pilot knows these');
  for (const set of ARCHETYPE_TACTICS[c.archetype ?? ''] ?? []) add(TACTIC_SETS[set]!.ids, `training: ${TACTIC_SETS[set]!.label}`);
  for (const set of START_TACTICS[c.start?.optionId ?? ''] ?? []) add(TACTIC_SETS[set]!.ids, `service: ${TACTIC_SETS[set]!.label}`);
  if ((c.path === 'jedi' || c.path === 'sith') && rank) for (const set of RANK_TACTICS[rank] ?? []) add(TACTIC_SETS[set]!.ids, `${c.path === 'jedi' ? 'the Order' : 'the Academy'}: ${TACTIC_SETS[set]!.label}`);
  return out;
}

/** An NPC's tactics: its crew kind's sets with the basics (data/tactics NPC_TACTICS). */
export const npcTactics = (kind: string): ReadonlySet<string> => new Set(tacticsOfSets(NPC_TACTICS[kind] ?? []));

/** A tactic named in plain words (its name or id, the longest match). */
export function tacticFromWords(words: string): string | null {
  const t = words.toLowerCase();
  const hits = TACTICS.flatMap((x) => [x.name.toLowerCase().replace(/^the\s+/, '').replace(/\s*\(.*\)$/, ''), x.id.toLowerCase()].filter((n) => n.length >= 4 && t.includes(n)).map((n) => ({ id: x.id, n })));
  return hits.sort((a, b) => b.n.length - a.n.length)[0]?.id ?? null;
}

function learn(slice: TacticsSlice, ids: readonly string[], source: string, day: number): { slice: TacticsSlice; added: string[] } {
  const known = { ...slice.known };
  const added: string[] = [];
  for (const id of ids) {
    if (!TACTIC_BY_ID.has(id) || known[id]) continue;
    known[id] = { source: source.slice(0, 80), day };
    added.push(id);
  }
  return { slice: { ...slice, known }, added };
}

export const tacticsFeature: FeatureModule<TacticsSlice, GameState> = {
  id: 'tactics',
  version: 1,
  initialState: (ctx: InitCtx) => ({ ...emptyTactics(), known: impliedTactics(ctx.character, ctx.rank ?? null, ctx.start.day) }),
  // Old saves: the tactics their recorded training implies (archetype, start, rank).
  emptyState: (raw) => {
    const c = (raw['character'] ?? {}) as { archetype?: string; path?: string; start?: { optionId: string } };
    const rank = ((raw['ranks'] ?? {}) as { rank?: string }).rank ?? null;
    const day = ((raw['clock'] ?? { now: { day: 0 } }) as { now: { day: number } }).now.day;
    return { ...emptyTactics(), known: impliedTactics(c, rank, day) };
  },
  stateSchema: tacticsSliceSchema,
  events: {
    /** Engine (a programme's graduation), player or dev: tactics learned, by set or by id, with the source. */
    tacticsLearned: {
      schema: z.object({ type: z.literal('tacticsLearned'), sets: z.array(z.string()).max(10).optional(), ids: z.array(z.string()).max(40).optional(), source: z.string().min(1).max(80) }),
      sources: ['engine', 'player', 'dev'],
      handle: (slice, e, ctx): R => {
        const sets = (e['sets'] as string[] | undefined) ?? [];
        const ids = [...((e['ids'] as string[] | undefined) ?? []), ...sets.flatMap((s) => TACTIC_SETS[s]?.ids ?? [])];
        const r = learn(slice, ids, String(e['source']), ctx.state.clock.now.day);
        return { slice: r.slice, notes: r.added.length ? [`tactics learned (${String(e['source'])}): ${r.added.map((id) => TACTIC_BY_ID.get(id)!.name).join(', ')}`] : [] };
      },
    },
    /** Engine (battles): tactics watched in a battle, by the enemy or an ally. Known ones are not counted. */
    tacticsSeen: {
      schema: z.object({ type: z.literal('tacticsSeen'), ids: z.array(z.string()).max(40), by: z.enum(['enemy', 'ally']) }),
      sources: ['engine', 'dev'],
      handle: (slice, e, ctx): R => {
        const day = ctx.state.clock.now.day;
        const seen = { ...slice.seen };
        const fresh: string[] = [];
        for (const id of e['ids'] as string[]) {
          if (!TACTIC_BY_ID.has(id) || slice.known[id]) continue;
          if (!seen[id]) fresh.push(id);
          seen[id] = { source: seen[id]?.source ?? `seen used by ${e['by'] === 'enemy' ? 'an enemy' : 'an ally'}`, day: seen[id]?.day ?? day, count: (seen[id]?.count ?? 0) + 1 };
        }
        return { slice: { ...slice, seen }, notes: fresh.length ? [`tactics seen: ${fresh.map((id) => TACTIC_BY_ID.get(id)!.name).join(', ')}`] : [] };
      },
    },
    /**
     * Engine (the droid event's "tactic:" words) or player: taught by someone, studied (a manual, a historical campaign), or
     * practised. Practice moves a seen tactic to known after PRACTICE_TO_KNOW sessions; teaching or study makes it known at once.
     */
    tacticStudied: {
      schema: z.object({ type: z.literal('tacticStudied'), what: z.string().max(120) }),
      sources: ['engine', 'player', 'dev'],
      handle: (slice, e, ctx): R => {
        const words = String(e['what']).toLowerCase().replace(/^\s*tactics?\s*:\s*/, '');
        const id = tacticFromWords(words);
        if (!id) return { reject: `"${String(e['what'])}" names no tactic in the catalogue` };
        const t = TACTIC_BY_ID.get(id)!;
        if (slice.known[id]) return { reject: `${t.name} is already known` };
        const day = ctx.state.clock.now.day;
        if (/\bpractis|\bpractic|\bdrill|\brehears/.test(words)) {
          if (!slice.seen[id]) return { reject: `${t.name} has to be seen in use, taught or studied before it can be practised` };
          const n = (slice.practice[id] ?? 0) + 1;
          if (n < PRACTICE_TO_KNOW) return { slice: { ...slice, practice: { ...slice.practice, [id]: n } }, notes: [`${t.name} practised (${n}/${PRACTICE_TO_KNOW})`] };
          const r = learn({ ...slice, practice: { ...slice.practice, [id]: n } }, [id], 'practice after seeing it', day);
          return { slice: r.slice, notes: [`${t.name} is known now (practice after seeing it)`] };
        }
        const by = /\b(?:by|from)\s+([a-z][a-z' -]{1,40})/i.exec(String(e['what']))?.[1]?.trim();
        const how = /\bstud|\bmanual|\bread|\bcampaign|\bhistor|\barchive|\brecord/.test(words) ? `studied${/\bmanual/.test(words) ? ' (a tactics manual)' : /\bcampaign|\bhistor/.test(words) ? ' (historical campaigns)' : ''}` : `taught${by ? ` by ${by}` : ''}`;
        const r = learn(slice, [id], how, day);
        return { slice: r.slice, notes: [`${t.name} learned (${how})`] };
      },
    },
  },
  selectors: { lines: selectTacticLines },
};

export { PRACTICE_TO_KNOW };
