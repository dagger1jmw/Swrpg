// opt-1 E: replies cut short (finishReason MAX_TOKENS) in a simulated evening, before (D-58's flat 300 for the JSON) and after (the
// allowance sized from the turn, src/turn/outputBudget.ts). The real usage log does not record finishReason (it does from opt-1 on);
// the transcripts that do (a call's outcome "truncated") live in the browser's saves, not in the repo. Every number in this model is
// invented and listed in reports/opt-1.md E: the evening's turns, the replies' JSON (real event shapes at typical lengths), the
// prose and thinking lengths.
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { THINKING_HEADROOM_TOKENS } from '../../src/ai/models.config';
import { PACING_OUTPUT_CAPS } from '../../src/data/pacing.config';
import { JSON_ALLOWANCE } from '../../src/turn/outputBudget';
import { nextFloat, seedRng, type RngState } from '../../src/engine/rng';

const txt = (n: number) => 'x'.repeat(n);
const npc = (n: number) => ({ type: 'npcIntroduced', key: `tmp:${n}`, name: 'Commander Rel Tavos', species: "Twi'lek", faction: 'the Republic', role: 'officer', ageApprox: 40, description: txt(150) });
const loc = (n: number) => ({ type: 'locationIntroduced', key: `tmp:${n}`, name: 'The Lower Docks of Nar Shaddaa', kind: 'district', region: 'Hutt Space', parentRef: 'loc:nar-shaddaa', description: txt(200), moveHere: n === 1 });
const fact = () => ({ type: 'factLearned', aboutRef: 'npc:rel-tavos', fact: txt(220), importance: 'minor' });
const choices = Array.from({ length: 4 }, () => ({ label: txt(60), intent: { actionType: 'dialogue', targetRef: 'npc:rel-tavos' }, pacingHint: 'scene' }));
const reply = (events: unknown[]) => JSON.stringify({ narrative: '', choices, scene: { moodTags: ['tense', 'quiet'], presentNpcRefs: ['npc:rel-tavos', 'npc:sera'] }, events });
/** JSON is token-dense (keys, punctuation, ids): about 3.5 characters a token (invented). */
const tokens = (json: string) => Math.ceil(json.length / 3.5);

interface Kind { name: string; count: number; level: keyof typeof PACING_OUTPUT_CAPS; json: number; prose: [number, number]; after: number }
const KINDS: Kind[] = [
  { name: 'opening', count: 1, level: 'scene', json: tokens(reply([npc(3), npc(4), npc(5), loc(1), loc(2), fact(), fact(), fact(), { type: 'threadOpened', key: 'tmp:6', title: txt(40), stakes: txt(120), entityRefs: ['tmp:3'] }, { type: 'timeElapsed', seconds: 600, reason: txt(40) }])), prose: [700, 200], after: JSON_ALLOWANCE.opening },
  { name: 'arrival', count: 4, level: 'scene', json: tokens(reply([loc(1), npc(2), npc(3), fact(), fact(), { type: 'locationChanged', locationRef: 'tmp:1' }])), prose: [600, 180], after: JSON_ALLOWANCE.arrival },
  { name: 'montage or skip', count: 2, level: 'montage', json: tokens(reply([fact(), fact(), fact(), fact(), { type: 'threadProgressed', threadRef: 'thread:x', note: txt(150) }, { type: 'relationshipChanged', npcRef: 'npc:sera', delta: 1, reason: txt(80) }])), prose: [800, 200], after: JSON_ALLOWANCE.jump },
  { name: 'fight beat (narrated)', count: 3, level: 'moment', json: tokens(reply([])), prose: [420, 120], after: JSON_ALLOWANCE.base },
  { name: 'ordinary moment', count: 22, level: 'moment', json: tokens(reply([fact(), { type: 'relationshipChanged', npcRef: 'npc:sera', delta: 1, reason: txt(80) }])), prose: [380, 120], after: JSON_ALLOWANCE.base },
  { name: 'ordinary scene', count: 8, level: 'scene', json: tokens(reply([npc(2), fact(), fact(), { type: 'relationshipChanged', npcRef: 'npc:sera', delta: 1, reason: txt(80) }])), prose: [620, 180], after: JSON_ALLOWANCE.scene },
];
/** Thinking at level low, inside its 1,024 headroom on most turns (invented: uniform 150 to 1,100). */
const THINKING: [number, number] = [150, 1100];

function normal(rng: RngState, mean: number, sd: number): [number, RngState] {
  let u1: number, u2: number;
  [u1, rng] = nextFloat(rng);
  [u2, rng] = nextFloat(rng);
  return [mean + sd * Math.sqrt(-2 * Math.log(Math.max(1e-9, u1))) * Math.cos(2 * Math.PI * u2), rng];
}

it('a simulated evening', () => {
  const EVENINGS = 2000;
  let rng = seedRng('opt1-evening');
  const byKind: Record<string, { before: number; after: number; json: number }> = {};
  let before = 0;
  let after = 0;
  for (let e = 0; e < EVENINGS; e++) {
    for (const k of KINDS) {
      for (let i = 0; i < k.count; i++) {
        let prose: number, u: number;
        [prose, rng] = normal(rng, k.prose[0], k.prose[1]);
        [u, rng] = nextFloat(rng);
        const think = THINKING[0] + u * (THINKING[1] - THINKING[0]);
        const need = Math.max(80, prose) + k.json + think;
        const cap = PACING_OUTPUT_CAPS[k.level] + THINKING_HEADROOM_TOKENS;
        const b = need > cap + 300 ? 1 : 0;
        const a = need > cap + k.after ? 1 : 0;
        byKind[k.name] = { before: (byKind[k.name]?.before ?? 0) + b, after: (byKind[k.name]?.after ?? 0) + a, json: k.json };
        before += b;
        after += a;
      }
    }
  }
  const out = {
    evenings: EVENINGS,
    perEvening: { before: before / EVENINGS, after: after / EVENINGS },
    byKind: Object.fromEntries(Object.entries(byKind).map(([n, v]) => [n, { jsonTokens: v.json, before: v.before / EVENINGS, after: v.after / EVENINGS }])),
  };
  writeFileSync(process.env['BUDGET_OUT'] ?? 'output-budget.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out));
});
