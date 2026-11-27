// opt-1 measurements (reports/opt-1.md): the narrative schema's 20 situations, the state block (audit C2), tokens per narrative
// call by section (audit P1). Run on demand: npx vitest run --config vitest.measure.config.ts. Writes JSON to OPT1_OUT.
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { toGeminiSchema } from '../../src/ai/jsonSchema';
import { composeNarrativeSchema } from '../../src/ai/schemas/compose';
import { activeParts } from '../../src/ai/schemas/parts';
import { makeEstimator } from '../../src/ai/tokenRatio';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import type { NarrativeTurnInfo } from '../../src/state/types';
import { buildNarrativeRequest, historyWindow, stateBlock } from '../../src/turn/context';
import type { TurnRecord } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { selectPresentNpcIds } from '../../src/features/pacing/selectors';
import { selectCurrentLocationId, selectLocationChain } from '../../src/features/locations/selectors';
import { selectOpenThreads } from '../../src/features/threads/selectors';
import { lateCampaign, situations, type Situation } from '../support/schemaSituations';

const est = makeEstimator(4);
const size = (s: GameState, turn: NarrativeTurnInfo): number => JSON.stringify(toGeminiSchema(composeNarrativeSchema(REGISTRY, s, turn).wire)).length;

const history = (n: number, size: number, s?: GameState): TurnRecord[] =>
  Array.from({ length: n }, (_, i) => ({ turn: i + 1, input: { kind: 'typed', text: `I do thing ${i + 1}` }, narrative: `${'Story text of the turn. '.repeat(Math.ceil(size / 24))}`.slice(0, size), draft: { applied: [] }, applied: [], clockAfter: { day: s ? s.clock.now.day : 0, second: 0 }, worldAfter: s ? (selectLocationChain(s, selectCurrentLocationId(s)).at(-1)?.id ?? null) : undefined }) as unknown as TurnRecord);

function focus(s: GameState): string[] {
  const chain = selectLocationChain(s, selectCurrentLocationId(s)).map((l) => l.id);
  const master = s.ranks.masterId ? [s.ranks.masterId] : [];
  return [...selectPresentNpcIds(s), ...chain, ...selectOpenThreads(s).map((t) => t.id), ...master];
}

function stateRow(x: Situation, narrative = false): Record<string, unknown> {
  const parts = activeParts(x.state, x.turn);
  // narrative: the narrative call's own state block (opt-1 B: no world lines, VALID SKILLS only with training); else the intent call's.
  const b = narrative ? stateBlock(x.state, est, undefined, focus(x.state), x.turn.text ?? '', { world: false, validSkills: parts.has('training') }) : stateBlock(x.state, est, undefined, focus(x.state), x.turn.text ?? '');
  const idTokens = b.report.included.reduce((a, i) => a + i.tokens, 0);
  const f = new Set(focus(x.state));
  const lostFocus = b.report.dropped.filter((d) => f.has(d.id)).map((d) => d.id);
  // Focus IDs inside the fixed Present/Location lines survive even when their ID line is dropped (audit C2): "lost" is a focus ID
  // that appears nowhere in the block.
  const lost = [...f].filter((id) => !b.text.includes(id));
  return { name: x.name, fixed: b.report.tokens - idTokens, whole: b.report.tokens, dropped: b.report.dropped.length, focusLineDropped: lostFocus.length, focusLost: lost.length, focusIds: f.size };
}

function p1Row(name: string, s: GameState, text: string, sameDay = true): Record<string, unknown> {
  const { draft, state } = resolveTurn(REGISTRY, s, null, { text });
  const turn: NarrativeTurnInfo = { timeAdvancedByDraft: draft.timeAdvanced !== null, text };
  const wire = composeNarrativeSchema(REGISTRY, state, { ...turn, parts: activeParts(state, turn) }).wire;
  const schemaChars = JSON.stringify(toGeminiSchema(wire)).length;
  const req = buildNarrativeRequest(state, draft, { kind: 'typed', text }, history(40, 2200, sameDay ? s : undefined), { model: 'm', ratio: 4, schemaChars });
  const out: Record<string, unknown> = { name, total: req.report.estimatedTokens };
  for (const sec of req.report.sections) out[sec.name] = ((out[sec.name] as number | undefined) ?? 0) + sec.tokens;
  out['rules'] = req.report.sections.find((x) => x.name === 'gmRules')?.included[0]?.id;
  out['loreNote'] = req.report.sections.find((x) => x.name === 'lore')?.included[0]?.note;
  return out;
}

it('opt-1 measurements', () => {
  const list = situations();
  const schema = list.map((x) => ({ name: x.name, size: size(x.state, x.turn), core: size(x.state, { ...x.turn, parts: new Set(['core']) }) }));
  const pick = (n: string): Situation => list.find((x) => x.name === n)!;
  const late: Situation = { name: 'a late campaign', state: lateCampaign(pick('a full story, alone').state), turn: { timeAdvancedByDraft: false, text: 'I think it over' } };
  const c2 = ['alone in the wilds', 'an army officer', 'the spaceport with the ship', 'a ship battle', 'everything at once'].map((n) => stateRow(pick(n))).concat([stateRow(late)]);
  const c2all = [...list, late].map((x) => stateRow(x));
  const c2narr = [...list, late].map((x) => stateRow(x, true));
  // The history step's trade-off (opt-1 C2): a campaign from turn 1 to 60, 2,200 characters a turn; for each step, the history
  // tokens kept on average and the share of calls whose history starts with the same turn as the call before.
  const steps = [1, 2, 3, 4, 5, 6].map((step) => {
    let kept = 0;
    let same = 0;
    let prev: number | null = null;
    const N = 60;
    for (let n = 20; n <= N; n++) {
      const w = historyWindow(history(n, 2200), 8000, est, step);
      kept += w.report.tokens;
      if (prev !== null && w.fromTurn === prev) same++;
      prev = w.fromTurn;
    }
    return { step, avgTokens: Math.round(kept / (N - 19)), sameStart: Math.round((100 * same) / (N - 20)) };
  });
  const p1 = [
    p1Row('an ordinary turn (a conversation)', pick('a conversation').state, 'I ask her about the war'),
    p1Row('an ordinary turn (alone in the wilds)', pick('alone in the wilds').state, 'I walk on'),
    p1Row('a fight about to start', pick('a fight about to start').state, 'I draw my lightsaber'),
    p1Row('a late campaign', late.state, 'I think it over'),
    p1Row('an ordinary turn, a new year or world (lore in full)', pick('a conversation').state, 'I ask her about the war', false),
  ];
  const out = { schema, c2, c2all, c2narr, p1, steps };
  writeFileSync(process.env['OPT1_OUT'] ?? 'opt1-measure.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out));
}, 300_000);
