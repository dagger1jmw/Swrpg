// A small made-up network for the tag-network engine's tests (D-466): no lore, no shipped data. Two fleets, a city and a
// pact in the 3,650s BBY (the year only has to have a canon roster, for substitution).
import type { WorldEventDef, WorldNetwork } from '../../src/data/worldNetwork';

const base = { roles: [], conditions: [], consumes: [], produces: [], source: 'test fixture' } as const;
const ev = (e: Partial<WorldEventDef> & Pick<WorldEventDef, 'id' | 'title' | 'date'>): WorldEventDef => ({ ...base, summary: `${e.title} as recorded.`, ...e });

export const FIXTURE: WorldNetwork = {
  standing: [{ outcome: 'O.war', note: 'the war is on' }],
  events: [
    // Before the test campaign's start: history.
    ev({ id: 'E.3660.muster', title: 'The muster', date: { year: -3660 }, consumes: [{ outcome: 'O.war', required: true }], produces: [{ outcome: 'O.fleet' }] }),
    // A replaceable leader and a crucial one; a medium crucial condition; a low one that is not crucial.
    ev({
      id: 'E.3655.strike',
      title: 'The strike',
      date: { year: -3655, month: 3, day: 10, placed: 'invented' },
      places: ['Coruscant'],
      roles: [
        { id: 'role.captain', label: 'Darth Angral', kind: 'replaceable', canonId: 'lore:darth-angral' },
        { id: 'role.blade', label: 'Darth Malgus', kind: 'crucial', canonId: 'lore:darth-malgus' },
        { id: 'role.hero', label: 'the Hero', kind: 'replaceable', protagonist: true },
      ],
      conditions: [
        {
          id: 'cond.secret',
          text: 'Nobody knows the strike is coming',
          brokenText: 'The plan of the strike is out',
          crucial: true,
          guard: 'medium',
          breakIf: [{ kind: 'action', actionTypes: ['investigate'], places: ['Coruscant'] }, { kind: 'flag', flag: 'sceneOutcome:strike-plan', strength: 'major' }],
          leads: [{ canonIds: ['lore:darth-angral'] }, { places: ['Coruscant'] }, { sites: ['Old Vault'] }],
          onBreak: 'cancelled',
        },
        { id: 'cond.gate', text: 'The gate opens', brokenText: 'The gate is held', crucial: false, guard: 'low', breakIf: [{ kind: 'control', place: 'The Gate', side: 'republic' }] },
      ],
      consumes: [{ outcome: 'O.fleet', required: true }],
      produces: [
        { outcome: 'O.city_taken' },
        { outcome: 'O.gate_open', when: { intact: ['cond.gate'] } },
        { outcome: 'O.gate_held', when: { broken: ['cond.gate'] } },
        { outcome: 'O.blade_alive', when: { intact: ['role.blade'] } },
      ],
      plotPoint: 'PP-9',
      interrupts: true,
    }),
    // The two-step ripple: the pact needs the city, the settlement needs the pact.
    ev({ id: 'E.3654.pact', title: 'The pact', date: { year: -3654 }, consumes: [{ outcome: 'O.city_taken', required: true }], produces: [{ outcome: 'O.pact' }], plotPoint: 'PP-9' }),
    ev({ id: 'E.3653.settlement', title: 'The settlement', date: { year: -3653 }, consumes: [{ outcome: 'O.pact', required: true }], produces: [{ outcome: 'O.settled' }] }),
    // Touches neither: an anchor. It would rather have the pact, but does not need it.
    ev({ id: 'E.3652.storm', title: 'The storm', date: { year: -3652 }, consumes: [{ outcome: 'O.pact', required: false }], produces: [{ outcome: 'O.storm' }] }),
    ev({ id: 'E.3652.harvest', title: 'The harvest', date: { year: -3652, month: 6 }, produces: [{ outcome: 'O.harvest' }] }),
    // An occupation that has to hold, and one that waits for an alternative's outcome.
    ev({
      id: 'E.3651.siege',
      title: 'The siege',
      date: { year: -3651, month: 2, day: 1 },
      endDate: { year: -3651, month: 2, day: 20 },
      places: ['The Gate'],
      conditions: [
        {
          id: 'cond.hold',
          text: 'The siege holds',
          brokenText: 'The siege is lifted',
          crucial: true,
          guard: 'medium',
          window: 'underway',
          breakIf: [{ kind: 'control', place: 'The Gate', side: 'republic', strength: 'major' }],
        },
      ],
      produces: [{ outcome: 'O.siege_begun', at: 'start' }, { outcome: 'O.gate_taken' }],
    }),
    ev({ id: 'E.3651.court', title: 'The long court', date: { year: -3651, month: 6 }, consumes: [{ outcome: 'O.long_war', required: true }], produces: [{ outcome: 'O.court' }] }),
    // A high guard: foreknowledge first, then extraordinary work.
    ev({
      id: 'E.3650.plot',
      title: 'The plot',
      date: { year: -3650 },
      conditions: [
        {
          id: 'cond.hidden',
          text: 'The plot is hidden at the top',
          brokenText: 'The plot is exposed',
          crucial: true,
          guard: 'high',
          prerequisites: [{ id: 'know.plot', text: 'What is planned', tests: [{ kind: 'action', actionTypes: ['investigate'], places: ['Kaas City'] }, { kind: 'npc', canonId: 'lore:darth-jadus', state: 'captured' }], leads: [{ places: ['Kaas City'] }] }],
          breakIf: [{ kind: 'action', actionTypes: ['dialogue'], canonIds: ['lore:darth-marr'] }],
        },
        {
          id: 'cond.vault',
          text: 'The vault is closed',
          brokenText: 'The vault is open',
          crucial: false,
          guard: 'veryHigh',
          prerequisites: [
            { id: 'know.where', text: 'Where it is', tests: [{ kind: 'action', actionTypes: ['investigate'], places: ['Ziost'] }], leads: [{ places: ['Ziost'] }] },
            { id: 'know.key', text: 'Who has the key', tests: [{ kind: 'npc', canonId: 'lore:darth-baras', state: 'captured' }] },
            { id: 'know.name', text: 'Its name', tests: [{ kind: 'fight', places: ['Ziost'], strength: 'major' }] },
          ],
          breakIf: [{ kind: 'action', actionTypes: ['forceUse'], places: ['Ziost'] }, { kind: 'npc', canonId: 'lore:darth-vowrawn', state: 'dead', strength: 'decisive' }],
        },
        { id: 'cond.calm', text: 'The capital is calm', brokenText: 'The capital rises', crucial: false, guard: 'low', breakIf: [{ kind: 'fight', places: ['Kaas City'] }] },
      ],
      produces: [{ outcome: 'O.plot_done' }],
    }),
  ],
  scenes: [{ id: 'strike-plan', title: 'The plan is read', event: 'E.3655.strike', guard: 'high', fromYear: -3655, on: [{ kind: 'action', actionTypes: ['forceUse'], places: ['Coruscant'] }, { kind: 'fight', canonIds: ['lore:darth-angral'] }], leads: [{ places: ['Coruscant'] }] }],
  plotPoints: [
    {
      id: 'PP-9',
      title: 'The strike and the pact',
      events: ['E.3655.strike', 'E.3654.pact'],
      tracker: { outcome: 'O.city_taken', is: 'broken' },
      alternatives: [
        { id: 'drained', title: 'Both sides are drained', heading: 'A WAR THAT DRAGS ON', parameters: ['No treaty', 'Both sides are tired'], criteria: [], base: 1 },
        {
          id: 'winner',
          title: 'The stronger side dictates terms',
          heading: 'A VICTORY',
          parameters: ['The winner sets the terms'],
          requires: { outcome: 'O.blade_alive', is: 'broken' },
          criteria: [{ when: { test: { kind: 'control', place: 'The Gate', side: 'republic' } }, weight: 2 }],
          effects: {
            produces: ['O.long_war'],
            reschedule: [{ events: ['E.3653.settlement', 'E.3652.harvest'], byDays: 100 }],
            control: [{ place: 'The Gate', side: 'republic', note: 'held by the winner' }],
          },
        },
      ],
    },
  ],
};
