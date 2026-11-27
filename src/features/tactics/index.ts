// Tactics feature (m8-ship-life part G; D-519; docs-v2/spec/ship-life.md section 10). Tactics are knowledge: known ones are
// usable (the battle menu offers only those), seen ones are recognised (the +1 of a known enemy formation) but not usable.
// Learning: a programme's graduation (the ranks feature sends its sets), what a career's own training implies (at creation and
// for old saves), being taught or studying (the narrator's words on the droid event, "tactic: taught the Corellian Slip by
// Master Sel"), and practice after seeing it. Battles send what each side flew (tacticsSeen).
import { z } from 'zod';
import { ARCHETYPE_TACTICS, COMMAND_BASICS, COMMON_GROUND, NPC_TACTICS, PAST_INITIATE, PILOT_BASICS, PRACTICE_TO_KNOW, RANK_TACTICS, START_TACTICS, TACTICS, TACTIC_BY_ID, TACTIC_SETS, TEACH_NEEDS, UNKNOWN_TEACHER_TACTICS, tacticTier, tacticsOfSets } from '../../data/tactics';
import { TACTIC_PLAN } from '../../data/groundCommand.config';
import { normalizeAlias } from '../../engine/aliases';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, HandleResult, InitCtx } from '../../state/types';
import { selectNpcLevel } from '../npcs/selectors';
import { selectPresentNpcIds } from '../pacing/selectors';
import { emptyTactics, tacticsSliceSchema, type TacticsSlice } from './tactics';
import { selectTacticLines } from './selectors';

type R = HandleResult<TacticsSlice>;

/**
 * What a character's own career, start and rank imply (old saves and new characters alike), with the source of each. One list per
 * character (m8-fixes B1): the Tactics tab and every battle menu read it, so what anyone can order is in it too.
 */
export function impliedTactics(c: { archetype?: string; path?: string; start?: { optionId: string } }, rank: string | null, day: number): TacticsSlice['known'] {
  const out: TacticsSlice['known'] = {};
  const add = (ids: readonly string[], source: string): void => {
    for (const id of ids) if (!out[id] && TACTIC_BY_ID.has(id)) out[id] = { source, day };
  };
  for (const set of ARCHETYPE_TACTICS[c.archetype ?? ''] ?? []) add(TACTIC_SETS[set]!.ids, `training: ${TACTIC_SETS[set]!.label}`);
  for (const set of START_TACTICS[c.start?.optionId ?? ''] ?? []) add(TACTIC_SETS[set]!.ids, `service: ${TACTIC_SETS[set]!.label}`);
  // Past the initiate stage (m8-fixes B2): the initiate years' basics for a Jedi, the Academy's for a Sith (approved, D-526).
  const initiate = (c.path === 'jedi' || c.path === 'sith') && rank ? PAST_INITIATE[rank] : undefined;
  if (initiate) add(TACTIC_SETS[initiate]!.ids, `${c.path === 'jedi' ? 'the Order' : 'the Academy'}: ${TACTIC_SETS[initiate]!.label}`);
  if ((c.path === 'jedi' || c.path === 'sith') && rank) for (const set of RANK_TACTICS[rank] ?? []) add(TACTIC_SETS[set]!.ids, `${c.path === 'jedi' ? 'the Order' : 'the Academy'}: ${TACTIC_SETS[set]!.label}`);
  add(PILOT_BASICS, 'every pilot knows these');
  add([...COMMAND_BASICS, ...COMMON_GROUND], 'anyone can order these');
  return out;
}

/** Tactics the player used in battles before m8-fixes (old saves, B6): the last ship battle's formation and the ground plans. */
export function usedInOldBattles(battles: unknown): string[] {
  const b = (battles ?? {}) as { last?: { fleet?: { a?: { formation?: string } }; role?: string } | null; active?: { fleet?: { a?: { formation?: string } }; role?: string } | null; lastGround?: { planning?: { role?: string; plan?: { manoeuvre?: string | null } }; battle?: { a?: { plan?: string } } } | null; ground?: { planning?: { role?: string; plan?: { manoeuvre?: string | null } }; battle?: { a?: { plan?: string } } } | null; planning?: unknown; history?: { tacticsUsed?: string[] }[] };
  const out = new Set<string>();
  for (const r of b.history ?? []) for (const id of r.tacticsUsed ?? []) out.add(id);
  for (const x of [b.last, b.active]) if (x?.role === 'commander' && x.fleet?.a?.formation) out.add(x.fleet.a.formation);
  for (const g of [b.lastGround, b.ground]) {
    if (g?.planning?.role !== 'commander') continue;
    if (g.planning.plan?.manoeuvre) out.add(g.planning.plan.manoeuvre);
    const plan = g.battle?.a?.plan;
    const id = plan ? Object.entries(TACTIC_PLAN).find(([, v]) => v === plan)?.[0] : undefined;
    if (id) out.add(id);
  }
  return [...out].filter((id) => TACTIC_BY_ID.has(id));
}

/** Old saves (B6): the starting set for the character's background, plus every tactic already used in a battle. */
function forOldSave(raw: Record<string, unknown>, known: TacticsSlice['known']): TacticsSlice['known'] {
  const c = (raw['character'] ?? {}) as { archetype?: string; path?: string; start?: { optionId: string } };
  const rank = ((raw['ranks'] ?? {}) as { rank?: string }).rank ?? null;
  const day = ((raw['clock'] ?? { now: { day: 0 } }) as { now: { day: number } }).now.day;
  const out = { ...impliedTactics(c, rank, day), ...known };
  for (const id of usedInOldBattles(raw['battles'])) if (!out[id]) out[id] = { source: 'used in a battle', day };
  return out;
}

/** Who teaches, from the words ("taught by Master Sel") or the master in the scene: an NPC's Tactics, else an unknown instructor's. */
function teacherOf(s: GameState, by: string | undefined): { name: string; tactics: number } | null {
  const npcs = Object.values(s.npcs.byId);
  if (by) {
    const w = normalizeAlias(by);
    const n = npcs.find((x) => [x.name, ...x.aliases].some((a) => normalizeAlias(a) === w)) ?? npcs.find((x) => [x.name, ...x.aliases].some((a) => { const k = normalizeAlias(a); return k.length >= 3 && (k.includes(w) || w.includes(k)); }));
    return n ? { name: n.name, tactics: selectNpcLevel(s, n.id, 'tactics') } : { name: by, tactics: UNKNOWN_TEACHER_TACTICS };
  }
  const master = s.ranks.masterId;
  if (master && selectPresentNpcIds(s).includes(master) && s.npcs.byId[master]) return { name: s.npcs.byId[master]!.name, tactics: selectNpcLevel(s, master, 'tactics') };
  return null;
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
  version: 2,
  initialState: (ctx: InitCtx) => ({ ...emptyTactics(), known: impliedTactics(ctx.character, ctx.rank ?? null, ctx.start.day) }),
  // Old saves (m8-fixes B6): the starting set their recorded background implies (archetype, start, rank), plus what they used.
  emptyState: (raw) => ({ ...emptyTactics(), known: forOldSave(raw, {}) }),
  migrations: { 2: (old, raw) => ({ ...(old as TacticsSlice), known: forOldSave(raw ?? {}, (old as TacticsSlice).known) }) },
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
      // Its own AI event since m8-ground (D-520): the schema's parts made the room; the droid event's "tactic:" words still route here.
      schema: z.object({ type: z.literal('tacticStudied'), what: z.string().max(120) }),
      sources: ['ai', 'engine', 'player', 'dev'],
      narrative: () => true,
      part: 'training',
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
        const studied = /\bstud|\bmanual|\bread|\bcampaign|\bhistor|\barchive|\brecord/.test(words);
        // Taught (m8-fixes B3a): the teacher's own Tactics decides how hard a tactic they can pass on (a master with military
        // experience teaches more); a commander in the field teaches the same way.
        const teacher = studied ? null : teacherOf(ctx.state, by);
        const tier = tacticTier(id);
        const teacherTactics = teacher?.tactics ?? UNKNOWN_TEACHER_TACTICS;
        if (!studied && teacherTactics < TEACH_NEEDS[tier]) return { reject: `${teacher?.name ?? 'the teacher'} (Tactics ${Math.round(teacherTactics)}) cannot teach ${t.name}: ${tier === 'advanced' ? 'an advanced tactic needs a seasoned commander' : 'it needs a teacher with military experience'} (Tactics ${TEACH_NEEDS[tier]}); it can be learned in the field` };
        const how = studied ? `studied${/\bmanual/.test(words) ? ' (a tactics manual)' : /\bcampaign|\bhistor/.test(words) ? ' (historical campaigns)' : ''}` : `taught${teacher ? ` by ${teacher.name}` : by ? ` by ${by}` : ''}`;
        const r = learn(slice, [id], how, day);
        return { slice: r.slice, notes: [`${t.name} learned (${how})`] };
      },
    },
  },
  selectors: { lines: selectTacticLines },
};

export { PRACTICE_TO_KNOW };
