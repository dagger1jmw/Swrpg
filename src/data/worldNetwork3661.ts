// The world-event tag network, 3,661-3,640 BBY (M8 Phase B, D-467). Encoded from docs-v2/spec/world-event-tags-draft.md
// (reviewed by Jared, rulings in its section 6). Facts come from SW_Timeline_3700_3600BBY Parts 1-2 (P1, P2; the row is in
// `source`). Design calls, not lore: which roles are crucial, the guards, every breaking test (`breakIf`,
// `prerequisites`, scenes; listed in docs-v2/reports/m8-world-b.md), and every month and day marked 'invented' (the lore
// gives none for the 3,661-3,660 and 3,654-3,653 chains but the order; "mid-3,641" is its own).
import type { ConditionTag, DeedTest, Lead, RoleTag, StateTest, WorldDate, WorldEventDef, WorldExpr, WorldNetwork, WorldTest } from './worldNetwork';

// ---- Shorthand ----

const on = (bby: number, month?: number, day?: number): WorldDate => ({ year: -bby, ...(month ? { month, ...(day ? { day } : {}), placed: 'invented' as const } : {}) });
const circa = (d: WorldDate): WorldDate => ({ ...d, circa: true });
const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
/** A replaceable person, or a body or fleet (no id: it cannot be lost with one person). */
const R = (label: string, canonId?: string, more: Partial<RoleTag> = {}): RoleTag => ({ id: `role.${slug(label)}`, label, kind: 'replaceable', ...(canonId ? { canonId: `lore:${canonId}` } : {}), ...more });
const C = (label: string, canonId: string, more: Partial<RoleTag> = {}): RoleTag => ({ ...R(label, canonId, more), kind: 'crucial' });
/** A crucial person the lore index has no entry for: known by name. */
const N = (npcName: string): RoleTag => ({ id: `role.${slug(npcName)}`, label: npcName, kind: 'crucial', npcName });
/** A class hero: always an NPC (ruling 1). */
const H = (label: string, canonId: string): RoleTag => ({ ...R(label, canonId), protagonist: true });
const needs = (...outcomes: string[]) => outcomes.map((outcome) => ({ outcome, required: true }));
const wants = (...outcomes: string[]) => outcomes.map((outcome) => ({ outcome, required: false }));
const gives = (...outcomes: string[]) => outcomes.map((outcome) => ({ outcome }));
const lore = (...ids: string[]): string[] => ids.map((i) => `lore:${i}`);

const SLEUTH = ['investigation', 'intelligence', 'stealth', 'forceSense'];
const SPEECH = ['charisma', 'intelligence', 'mindTrick'];
/** The player investigates at a place. */
const look = (...places: string[]): DeedTest => ({ kind: 'action', actionTypes: ['investigate'], skills: SLEUTH, places });
/** The player persuades (or works on) a person. */
const talk = (...ids: string[]): DeedTest => ({ kind: 'action', actionTypes: ['dialogue'], skills: SPEECH, canonIds: lore(...ids) });
/** The player uses the Force on a place. */
const force = (...places: string[]): DeedTest => ({ kind: 'action', actionTypes: ['forceUse'], places });
/** What can start an inquiry: these people met (or a fact or thread about them). */
const about = (...ids: string[]): Lead => ({ canonIds: lore(...ids) });
/** A fact or thread recorded about a place. */
const word = (...places: string[]): Lead => ({ places });
/** A recorded discovery. */
const given = (...facts: StateTest[]): Lead => ({ facts });
const COUNCIL = about('darth-malgus', 'darth-angral', 'darth-marr', 'darth-vowrawn', 'darth-baras', 'darth-azamin', 'darth-decimus');
const imperial = (strength: 'minor' | 'major' | 'decisive', ...places: string[]): WorldTest => ({ kind: 'fight', places, factions: ['sithEmpire', 'sith'], minStakes: 'serious', strength });
const republic = (strength: 'minor' | 'major' | 'decisive', ...places: string[]): WorldTest => ({ kind: 'fight', places, factions: ['republic', 'jediOrder'], minStakes: 'serious', strength });
const beat = (id: string, strength: 'minor' | 'major' | 'decisive' = 'major'): WorldTest => ({ kind: 'fight', canonIds: lore(id), minStakes: 'serious', strength });
const taken = (id: string, strength: 'minor' | 'major' | 'decisive' = 'major'): WorldTest => ({ kind: 'npc', canonId: `lore:${id}`, state: 'captured', strength });
const flag = (id: string): StateTest => ({ kind: 'flag', flag: `sceneOutcome:${id}` });
const scene = (id: string, strength: 'minor' | 'major' | 'decisive' = 'major'): WorldTest => ({ ...flag(id), strength });
const knows = (tag: string): WorldTest => ({ kind: 'known', tag });

const cond = (id: string, text: string, brokenText: string, guard: ConditionTag['guard'], breakIf: readonly WorldTest[], more: Partial<ConditionTag> = {}): ConditionTag => ({ id: `cond.${id}`, text, brokenText, crucial: true, guard, breakIf, ...more });
const minor = (...a: Parameters<typeof cond>): ConditionTag => ({ ...cond(...a), crucial: false });

type Draft = Pick<WorldEventDef, 'id' | 'title' | 'summary' | 'date' | 'source'> & Partial<WorldEventDef>;
const ev = (d: Draft): WorldEventDef => ({ roles: [], conditions: [], consumes: [], produces: [], ...d });

const FORESEEN = 'E.3653.temple_strike#cond.unaware';
const HYDIAN = ['Hydian Way', 'Devaron'];
const KAAS = ['Dromund Kaas', 'Kaas City'];

// ---- 1. War years, 3,661-3,654 ----

const WAR: WorldEventDef[] = [
  ev({ id: 'E.3661.blockade', title: 'The Mandalorian Blockade of the Hydian Way', summary: 'Mandalorian cruisers close the Hydian Way for the Empire.', date: on(3661), places: ['Hydian Way'], roles: [R('Mandalore the Lesser', 'mandalore-the-lesser')], produces: gives('O.blockade_active'), source: 'P1, 3661 row 1' }),
  ev({
    id: 'E.3661.devaron',
    title: 'The battle near Devaron',
    summary: 'A Jedi strike on the blockade near Devaron fails.',
    date: on(3661, 3, 10),
    places: ['Devaron', 'Hydian Way'],
    roles: [R('the Jedi strike leader', 'gnost-dural')],
    conditions: [cond('blockade_holds', 'The blockade holds against the Jedi strike', 'The Jedi strike near Devaron breaks through the pickets', 'medium', [{ kind: 'action', actionTypes: ['dialogue', 'investigate'], skills: ['tactics', 'intelligence'], canonIds: lore('gnost-dural') }, { kind: 'fight', places: HYDIAN, factions: ['mandalorians'], minStakes: 'serious', strength: 'major' }], { window: { fromYear: -3661 } })],
    consumes: needs('O.blockade_active'),
    produces: gives('O.devaron_failed'),
    source: 'P1, 3661 row 2',
  }),
  ev({
    id: 'E.3661.riots',
    title: 'The Coruscant riots',
    summary: 'Food riots begin on Coruscant as the blockade cuts its supplies.',
    // Standing at the 3,661 start, as the M7 start has them (D-400): the rows of a year are not dated against each other.
    date: on(3661),
    places: ['Coruscant'],
    conditions: [cond('supply_cut', 'The blockade cuts the supply', 'Supplies reach Coruscant through the blockade', 'low', [{ kind: 'fight', places: HYDIAN, factions: ['mandalorians'], minStakes: 'serious' }], { window: { fromYear: -3661 } })],
    consumes: needs('O.blockade_active'),
    produces: gives('O.coruscant_riots'),
    source: 'P1, 3661 row 3',
  }),
  ev({ id: 'E.3661.satele_recall', title: 'Satele Shan is recalled to Coruscant', summary: 'Satele Shan is recalled to Coruscant.', date: on(3661, 5), places: ['Coruscant'], roles: [C('Satele Shan', 'satele-shan')], produces: gives('O.satele_on_coruscant'), source: 'P1, 3661 row 4' }),
  ev({
    id: 'E.3661.belsavis_shange',
    title: 'Prince Shange is imprisoned on Belsavis',
    summary: 'SIS agents hold the Cathar Prince Shange in stasis in the Tomb on Belsavis.',
    date: on(3661, 6),
    places: ['Belsavis'],
    roles: [R('the SIS team'), N('Prince Shange')],
    conditions: [minor('secret', 'The capture is secret', 'Word of Prince Shange\'s capture is out', 'medium', [look('Belsavis')], { leads: [word('Belsavis'), about('marcus-trant', 'ngani-zho')] })],
    produces: gives('O.shange_imprisoned'),
    source: 'P1, 3661 row 5',
  }),
  ev({ id: 'E.3661.raxxus', title: 'Lord Raxxus is imprisoned on Belsavis', summary: 'Lord Raxxus is imprisoned on Belsavis.', date: circa(on(3661, 7)), places: ['Belsavis'], roles: [N('Lord Raxxus')], produces: gives('O.raxxus_imprisoned'), source: 'P1, 3661 row 6' }),
  ev({ id: 'E.3661.theron', title: 'Theron Shan is brought to Monastery', summary: 'Ngani Zho brings the young Theron Shan to Monastery.', date: circa(on(3661, 8)), places: ['Monastery'], roles: [R('Ngani Zho', 'ngani-zho'), C('Theron Shan', 'theron-shan')], produces: gives('O.theron_trained'), source: 'P1, 3661 row 7' }),
  ev({ id: 'E.3661.rim_campaign', title: 'The Rim Campaign begins', summary: 'The Rim Campaign begins in the Outer Rim.', date: circa(on(3661, 10)), produces: gives('O.rim_campaign'), source: 'P1, 3661 row 8' }),
  ev({
    id: 'E.3660.hydian_battle',
    title: 'The Battle on the Hydian Way',
    summary: 'Smugglers led by Hylo Visz, with the Republic Navy, break the blockade and restore the trade route.',
    date: on(3660, 1, 15),
    places: ['Hydian Way'],
    // Ruling 4: Visz breaks it unless Visz fails or is killed first; only then another captain takes the place and the fame.
    roles: [R('Hylo Visz', 'hylo-visz', { faction: 'underworld', roles: ['smuggler'], breakIf: [flag('visz-stopped')] }), R('the Republic Navy')],
    conditions: [
      cond('hutt_backing', 'The Hutts back the run', 'The Hutts withdraw their backing for the blockade run', 'medium', [{ kind: 'action', actionTypes: ['dialogue', 'investigate'], skills: [...SPEECH, 'investigation'], places: ['Nal Hutta', 'Nar Shaddaa'] }], { window: { fromYear: -3661 }, prerequisites: [{ id: 'know.run', text: 'That the Hutts are paying for a run at the blockade', tests: [look('Nal Hutta', 'Nar Shaddaa', ...HYDIAN), talk('hylo-visz')], leads: [about('hylo-visz', 'zale-barrows', 'gault-rennow'), word('Nal Hutta', 'Nar Shaddaa', 'Hydian Way')] }] }),
      minor('pickets', 'The Mandalorian pickets can be beaten', 'The Mandalorian pickets are ready for the run', 'medium', [talk('mandalore-the-lesser')], { window: { fromYear: -3661 } }),
    ],
    consumes: needs('O.blockade_active'),
    produces: gives('O.blockade_broken', 'O.visz_famous'),
    interrupts: true,
    source: 'P1, 3660 row 1',
  }),
  ev({
    id: 'E.3660.riots_end',
    title: 'The Coruscant riots end',
    summary: 'The riots on Coruscant end as the blockade falls and supplies return.',
    date: on(3660, 2, 1),
    places: ['Coruscant'],
    conditions: [cond('supply_restored', 'Supply is restored', 'The relief convoys do not get through', 'low', [{ kind: 'fight', places: HYDIAN, factions: ['republic', 'underworld'], minStakes: 'serious' }], { window: { fromYear: -3660 } })],
    consumes: needs('O.blockade_broken', 'O.coruscant_riots'),
    produces: gives('O.riots_ended'),
    source: 'P1, 3660 row 2',
  }),
  ev({ id: 'E.3660.ord_radama', title: 'The Battle of Ord Radama', summary: 'Malgus and Venemal take Ord Radama and lose it again; a Harrower falls on Livien Magnus and Venemal dies.', date: on(3660, 3), places: ['Ord Radama'], roles: [R('Darth Malgus', 'darth-malgus'), R('Darth Venemal', 'darth-venemal')], consumes: needs('O.rim_campaign'), produces: gives('O.ord_radama_republic', 'O.venemal_dead'), source: 'P1, 3660 row 3' }),
  ev({ id: 'E.3660.ashas_serenno', title: 'The Battles of Ashas Ree and Serenno', summary: 'The Empire fights at Ashas Ree and takes Serenno.', date: circa(on(3660, 5)), places: ['Ashas Ree', 'Serenno'], roles: [R('Darth Malgus', 'darth-malgus')], consumes: needs('O.rim_campaign'), source: 'P1, 3660 row 5' }),
  ev({ id: 'E.3660.ziost', title: 'The Battle of Ziost', summary: 'Darth Marr repels the Republic at Ziost.', date: on(3660, 7), places: ['Ziost'], roles: [R('Darth Marr', 'darth-marr')], consumes: needs('O.rim_campaign'), source: 'P1, 3660 row 6' }),
  ev({
    id: 'E.3660.korriban',
    title: 'The Battle of Korriban',
    summary: 'A Jedi-led assault on Korriban fails; it stays Imperial.',
    date: on(3660, 8),
    places: ['Korriban'],
    roles: [R('the Jedi leaders')],
    conditions: [cond('defences', 'Korriban\'s defences hold', 'Korriban\'s defences fall', 'high', [imperial('major', 'Korriban'), force('Korriban')], { window: { fromYear: -3660 }, prerequisites: [{ id: 'know.defences', text: 'How Korriban is defended', tests: [look('Korriban'), taken('spindrall')], leads: [word('Korriban'), COUNCIL] }] })],
    consumes: needs('O.rim_campaign'),
    produces: [...gives('O.korriban_imperial'), { outcome: 'O.korriban_fallen', when: { broken: ['cond.defences'] }, control: { place: 'Korriban', side: 'republic', note: 'taken by the Republic and the Jedi in this campaign' } }],
    source: 'P1, 3660 row 7',
  }),
  ev({
    id: 'E.3660.great_hunt',
    title: 'The Great Hunt: a new Mandalore',
    summary: 'Artus Lok wins the Great Hunt, kills Mandalore the Lesser on Geonosis and becomes Mandalore the Vindicated.',
    date: circa(on(3660, 10)),
    places: ['Geonosis'],
    roles: [R('Artus Lok', 'mandalore-the-vindicated', { faction: 'mandalorians', roles: ['bountyHunter', 'officer'] }), C('Mandalore the Lesser', 'mandalore-the-lesser')],
    conditions: [minor('discredited', 'The Lesser is discredited after the blockade', 'The Lesser keeps the clans\' respect', 'low', [{ kind: 'outcome', outcome: 'O.blockade_broken', state: 'broken' }, talk('mandalore-the-lesser')], { window: { fromYear: -3660 } })],
    consumes: wants('O.blockade_broken'),
    produces: gives('O.new_mandalore'),
    source: 'P1, 3660 row 8',
  }),
  ev({ id: 'E.3660.crusader_schism', title: 'The Crusader\'s schism', summary: 'The Crusader\'s schism splits the Mandalorians; Project 32.', date: circa(on(3660, 11)), consumes: needs('O.new_mandalore'), produces: gives('O.mandalorian_schism'), source: 'P1, 3660 row 10' }),
  ev({ id: 'E.3660.barrows_seventh', title: 'The defeat of the Imperial Seventh Fleet', summary: 'Zale Barrows defeats the Imperial Seventh Fleet.', date: on(3660, 12), endDate: on(3653, 4), roles: [R('Zale Barrows', 'zale-barrows')], produces: gives('O.barrows_fleet'), source: 'P1, 3660 row 11' }),
  ev({
    id: 'E.3659.visz_rumour',
    title: 'Hylo Visz is rumoured dead',
    summary: 'Hylo Visz is rumoured dead after double-crossing the Hutts.',
    date: on(3659),
    places: ['Nal Hutta', 'Nar Shaddaa'],
    roles: [C('Hylo Visz', 'hylo-visz', { breakIf: [flag('visz-stopped')] })],
    conditions: [cond('betrayal', 'Visz is alive and betrays the Hutts', 'Visz stays loyal to the Hutts', 'low', [talk('hylo-visz')], { window: { fromYear: -3660 }, prerequisites: [{ id: 'know.betrayal', text: 'That Visz means to cheat the Hutts', tests: [look('Nal Hutta', 'Nar Shaddaa')], leads: [about('hylo-visz', 'gault-rennow')] }] })],
    consumes: needs('O.visz_famous'),
    produces: gives('O.visz_gone'),
    source: 'P1, 3659 row 1',
  }),
  ev({
    id: 'E.3658.xandret',
    title: 'Lema Xandret defects',
    summary: 'Lema Xandret defects from the Sith Empire.',
    date: on(3658),
    roles: [N('Lema Xandret')],
    conditions: [cond('escape', 'The escape succeeds', 'Lema Xandret does not get away', 'medium', [look(...KAAS)], { window: { fromYear: -3659 }, prerequisites: [{ id: 'know.xandret', text: 'That Xandret means to run', tests: [look(...KAAS), talk('darth-baras')], leads: [about('darth-baras', 'shullis-khamarr'), word(...KAAS)] }] })],
    produces: gives('O.xandret_defected'),
    source: 'P1, 3658 row 1',
  }),
  ev({ id: 'E.3655.odacer', title: 'The Odacer-Faustin academy', summary: 'The Sith academy on Odacer-Faustin is running.', date: on(3655), places: ['Odacer-Faustin'], produces: gives('O.odacer_academy'), source: 'P1, 3655 row 1' }),
  ev({
    id: 'E.3654.peace_offer',
    title: 'The Dark Council offers peace',
    summary: 'The Dark Council offers the Republic peace talks.',
    date: on(3654, 6, 1),
    places: ['Coruscant'],
    roles: [R('the Dark Council')],
    conditions: [
      cond('deception', 'The peace offer is a deception', 'The peace offer is exposed as a deception', 'high', [talk('berooken', 'paran-am-ris', 'zym', 'rans'), taken('darth-angral', 'decisive')], {
        window: { fromYear: -3655 },
        prerequisites: [{ id: 'know.deception', text: 'What the Dark Council means by the offer', tests: [look(...KAAS, 'Korriban'), taken('darth-malgus'), taken('darth-angral'), taken('darth-vowrawn')], leads: [COUNCIL] }],
      }),
    ],
    produces: gives('O.peace_talks'),
    plotPoint: 'PP-1',
    source: 'P1, 3654 row 1',
  }),
  ev({ id: 'E.3654.minos_end', title: 'The Minos Cluster fighting ends', summary: 'Fighting in the Minos Cluster ends with the peace offer; the Empire withdraws.', date: on(3654, 6, 20), endDate: on(3653, 3), places: ['Minos Cluster'], consumes: needs('O.peace_talks'), produces: gives('O.minos_quiet'), source: 'P1, 3654 row 2; 3653 row 1' }),
  ev({ id: 'E.3654.trant_narshaddaa', title: 'Marcus Trant heads the SIS on Nar Shaddaa', summary: 'Marcus Trant becomes SIS bureau chief on Nar Shaddaa.', date: on(3654, 8), places: ['Nar Shaddaa'], roles: [R('Marcus Trant', 'marcus-trant')], produces: gives('O.trant_sis'), source: 'P1, 3654 row 3' }),
  ev({ id: 'E.3654.rhen_var', title: 'The Battle of Rhen Var', summary: 'Darth Mekhis seizes Rhen Var; Satele Shan leads the Republic defence.', date: circa(on(3654, 9)), endDate: circa(on(3653, 2)), places: ['Rhen Var'], roles: [R('Darth Mekhis', 'darth-mekhis'), R('Satele Shan', 'satele-shan')], produces: gives('O.rhen_var_imperial'), source: 'P1, 3654 row 4' }),
];

// ---- 2. The Sacking and the Treaty, 3,653 (PP-1) ----

const SACKING: WorldEventDef[] = [
  ev({ id: 'E.3653.druckenwell', title: 'The Battle of Druckenwell', summary: 'The Battle of Druckenwell.', date: on(3653, 2), places: ['Druckenwell'], source: 'P1, 3653 row 1' }),
  ev({
    id: 'E.3653.alderaan_conference',
    title: 'The peace conference on Alderaan',
    summary: 'Republic and Imperial delegates meet on Alderaan, Paran Am-Ris, Dar\'Nala and Satele Shan among them.',
    date: on(3653, 6, 1),
    places: ['Alderaan'],
    roles: [R('Paran Am-Ris', 'paran-am-ris'), R('Dar\'Nala', 'darnala'), R('Satele Shan', 'satele-shan')],
    conditions: [
      cond('attention', 'The conference draws Republic and Jedi attention away from Coruscant', 'Coruscant is watched despite the conference', 'high', [talk('zym', 'satele-shan', 'darnala', 'berooken', 'rans'), scene('coruscant-warned')], {
        window: { fromYear: -3654 },
        prerequisites: [{ id: 'know.cover', text: 'That the conference is a cover', tests: [look('Alderaan'), knows('E.3654.peace_offer#cond.deception'), knows(FORESEEN)], leads: [about('darnala', 'paran-am-ris', 'satele-shan'), word('Alderaan')] }],
      }),
    ],
    consumes: needs('O.peace_talks'),
    produces: gives('O.republic_distracted'),
    plotPoint: 'PP-1',
    source: 'P1, 3653 row 2',
  }),
  ev({
    id: 'E.3653.temple_strike',
    title: 'The strike on the Jedi Temple',
    summary: 'A Sith strike team under Darth Malgus and Lord Adraas destroys the Jedi Temple and disables Coruscant\'s defence grid.',
    date: on(3653, 6, 20),
    endDate: on(3653, 6, 21),
    places: ['Coruscant', 'Jedi Temple'],
    roles: [C('Darth Malgus', 'darth-malgus'), R('Lord Adraas', 'adraas'), R('the strike team')],
    conditions: [
      cond('unaware', 'The Republic does not know', 'The Republic knows a strike on Coruscant is coming', 'high', [talk('zym', 'ven-zallow', 'berooken', 'rans', 'satele-shan'), scene('coruscant-warned')], {
        window: { fromYear: -3654 },
        onBreak: 'cancelled',
        prerequisites: [{ id: 'know.strike', text: 'That Coruscant itself is the target', tests: [look(...KAAS, 'Korriban', 'Alderaan'), taken('darth-malgus'), taken('darth-angral'), taken('adraas')], leads: [COUNCIL, about('adraas', 'eleena-daru')] }],
      }),
      // Saving the Temple alone: it does not stop the Sacking (PP-1).
      cond('reach', 'The strike team reaches the Temple', 'The strike team is stopped at the Jedi Temple', 'medium', [imperial('major', 'Jedi Temple'), beat('darth-malgus'), beat('adraas')], { window: { fromYear: -3653 } }),
      minor('grid', 'The defence grid can be disabled', 'Coruscant\'s defence grid stays up', 'medium', [{ kind: 'action', actionTypes: ['investigate'], skills: [...SLEUTH, 'tactics'], places: ['Coruscant'] }, imperial('major', 'Coruscant')], {
        window: { fromYear: -3653 },
        prerequisites: [{ id: 'know.grid', text: 'That the grid is a target', tests: [knows(FORESEEN), look('Alderaan')], leads: [about('adraas', 'eleena-daru'), word('Alderaan')] }],
      }),
    ],
    consumes: needs('O.republic_distracted'),
    produces: [
      { outcome: 'O.temple_destroyed', when: { intact: ['role.darth_malgus', 'cond.reach'] } },
      { outcome: 'O.temple_saved', when: { broken: ['role.darth_malgus', 'cond.reach'] } },
      { outcome: 'O.weak_ground_control', when: { broken: ['role.darth_malgus', 'cond.reach'] } },
      { outcome: 'O.grid_down', when: { intact: ['cond.grid'] } },
      { outcome: 'O.zallow_dead', when: { intact: ['role.darth_malgus', 'cond.reach'] } },
    ],
    plotPoint: 'PP-1',
    interrupts: true,
    source: 'P1, 3653 row 3',
  }),
  ev({
    id: 'E.3653.sacking',
    title: 'The Sacking of Coruscant',
    summary: 'Darth Angral\'s armada takes Coruscant, which is held under two days of martial law; Chancellor Berooken is killed.',
    date: on(3653, 6, 21),
    endDate: on(3653, 6, 23),
    places: ['Coruscant'],
    roles: [R('Darth Angral', 'darth-angral'), R('the armada')],
    conditions: [
      // The PP-1 hinge. Contestable only where the Empire's ground control is weak.
      cond('hold', 'The Empire takes and holds Coruscant', 'The Empire\'s hold on Coruscant is broken', 'high', [imperial('major', 'Coruscant'), beat('darth-angral', 'decisive'), { kind: 'control', place: 'Coruscant', side: 'republic', strength: 'decisive' }], {
        window: 'underway',
        prerequisites: [{ id: 'know.contestable', text: 'That the occupation is thin on the ground', tests: [{ kind: 'outcome', outcome: 'O.weak_ground_control', state: 'produced' }] }],
      }),
      cond('grid_down', 'The defence grid is down', 'The defence grid meets the armada', 'medium', [{ kind: 'outcome', outcome: 'O.grid_down', state: 'broken', strength: 'major' }], { window: { fromYear: -3653 } }),
    ],
    consumes: [{ outcome: 'O.grid_down', required: true, onBreak: 'altered' }, ...wants('O.weak_ground_control')],
    produces: [{ outcome: 'O.coruscant_occupied', at: 'start' }, { outcome: 'O.berooken_dead' }],
    plotPoint: 'PP-1',
    interrupts: true,
    source: 'P1, 3653 row 4',
  }),
  ev({
    id: 'E.3653.treaty',
    title: 'The Treaty of Coruscant',
    summary: 'With the capital occupied, the Republic signs, ends the war, withdraws from many fronts and cedes important systems.',
    date: on(3653, 6, 23),
    places: ['Alderaan', 'Coruscant'],
    roles: [R('the Republic delegation'), R('the Dark Council')],
    conditions: [cond('hostage', 'The capital is held hostage', 'Coruscant is no longer held hostage', 'medium', [{ kind: 'outcome', outcome: 'O.coruscant_occupied', state: 'broken', strength: 'major' }], { window: { fromYear: -3653 } })],
    consumes: needs('O.coruscant_occupied', 'O.peace_talks'),
    produces: gives('O.treaty_signed', 'O.systems_ceded'),
    plotPoint: 'PP-1',
    interrupts: true,
    source: 'P1, 3653 row 5',
  }),
  ev({ id: 'E.3653.chancellor', title: 'A new Supreme Chancellor', summary: 'With Berooken dead, Paran Am-Ris serves as interim Chancellor; Dorian Janarus is elected.', date: on(3653, 8), places: ['Coruscant'], roles: [R('Paran Am-Ris', 'paran-am-ris'), R('Dorian Janarus', 'dorian-janarus')], consumes: needs('O.berooken_dead'), produces: gives('O.janarus_chancellor'), source: 'P1, 3653 row 6' }),
  ev({
    id: 'E.3653.zym',
    title: 'Grand Master Zym is killed',
    summary: 'Grand Master Zym, who survived the Sacking, is killed on Coruscant by the bounty hunter Braden.',
    date: on(3653, 7, 15),
    places: ['Coruscant'],
    roles: [C('Zym', 'zym'), R('Braden', 'braden', { faction: 'independent', roles: ['bountyHunter'] })],
    conditions: [cond('unguarded', 'Zym is unguarded after the Treaty', 'Zym is guarded', 'medium', [talk('zym'), beat('braden')], { window: { fromYear: -3653 }, prerequisites: [{ id: 'know.bounty', text: 'That someone wants Zym dead', tests: [look('Coruscant'), taken('braden')], leads: [about('braden', 'zym')] }] })],
    consumes: needs('O.treaty_signed'),
    produces: gives('O.grand_master_vacant'),
    source: 'P1, 3653 row 7',
  }),
  ev({
    id: 'E.3653.deaths',
    title: 'The deaths after the Sacking',
    summary: 'Dar\'Nala dies on Dantooine; Eleena Daru and Lord Adraas die on Coruscant.',
    date: on(3653, 6, 25),
    places: ['Dantooine', 'Coruscant'],
    roles: [R('Dar\'Nala', 'darnala'), R('Ven Zallow', 'ven-zallow'), R('Eleena Daru', 'eleena-daru'), R('Lord Adraas', 'adraas')],
    conditions: [
      minor('darnala', 'Dar\'Nala dies on Dantooine', 'Dar\'Nala lives', 'medium', [talk('darnala'), imperial('major', 'Dantooine')], { window: { fromYear: -3653 } }),
      minor('eleena', 'Eleena Daru dies', 'Eleena Daru lives', 'medium', [talk('eleena-daru'), beat('darth-malgus')], { window: { fromYear: -3653 } }),
      minor('adraas', 'Adraas dies', 'Adraas lives', 'medium', [talk('adraas')], { window: { fromYear: -3653 } }),
    ],
    consumes: needs('O.temple_destroyed'),
    produces: [
      { outcome: 'O.darnala_dead', when: { intact: ['cond.darnala'] } },
      { outcome: 'O.eleena_dead', when: { intact: ['cond.eleena'] } },
      { outcome: 'O.adraas_dead', when: { intact: ['cond.adraas'] } },
    ],
    source: 'P1, 3653 row 8',
  }),
  ev({ id: 'E.3653.dantooine', title: 'The Battle of Dantooine', summary: 'Zale Barrows\'s Free Spacers Fleet defeats the Imperial Third Fleet.', date: on(3653, 5), places: ['Dantooine'], roles: [R('Zale Barrows', 'zale-barrows')], consumes: needs('O.barrows_fleet'), source: 'P1, 3653 row 9' }),
  ev({ id: 'E.3653.riots_after', title: 'Riots on Coruscant after the Sacking', summary: 'Coruscant riots after the Sacking.', date: on(3653, 7, 1), places: ['Coruscant'], consumes: needs('O.coruscant_occupied'), produces: gives('O.coruscant_unrest'), source: 'P1, 3653 row 10' }),
  ev({ id: 'E.3653.decimus', title: 'Darth Decimus joins the Dark Council', summary: 'Darth Azamin is assassinated; Darth Decimus succeeds him.', date: circa(on(3653, 9)), places: KAAS, roles: [R('Darth Decimus', 'darth-decimus'), C('Darth Azamin', 'darth-azamin')], produces: gives('O.decimus_council'), source: 'P1, 3653 row 11' }),
  ev({ id: 'E.3653.hutt_treaty', title: 'The Hutt-Imperial treaty', summary: 'A treaty keeps the Hutt Cartel neutral.', date: on(3653, 9, 10), places: ['Nal Hutta'], roles: [R('the Hutt Cartel')], produces: gives('O.hutt_neutral'), source: 'P1, 3653 row 13' }),
  ev({
    id: 'E.3653.ord_mantell_fleet',
    title: 'Ord Mantell\'s fleet is sold',
    summary: 'A corrupt admiral sells off Ord Mantell\'s fleet; the Republic military all but abandons the planet.',
    date: on(3653, 10, 10),
    places: ['Ord Mantell'],
    roles: [R('the admiral')],
    conditions: [cond('unexposed', 'The sale goes unexposed', 'The sale of Ord Mantell\'s fleet is exposed', 'medium', [look('Ord Mantell')], { window: { fromYear: -3653 }, leads: [word('Ord Mantell'), about('corso-riggs')] })],
    consumes: needs('O.treaty_signed'),
    produces: gives('O.ord_mantell_abandoned'),
    source: 'P1, 3653 row 15',
  }),
  ev({ id: 'E.3653.senate_blame', title: 'The Senate blames the Jedi', summary: 'The Senate blames the Jedi for the war\'s loss.', date: on(3653, 7, 2), places: ['Coruscant'], consumes: needs('O.treaty_signed', 'O.temple_destroyed'), produces: gives('O.senate_distrusts_jedi'), source: 'P1, 3653 row 17' }),
  // The vote is in 3,653 (D-476, Jared): interim Chancellor Am-Ris tells Zym, who dies that July.
  ev({
    id: 'E.3653.temple_shelved',
    title: 'The Senate postpones the Temple',
    summary: 'The Senate votes to put off rebuilding the Coruscant Jedi Temple indefinitely; Interim Chancellor Am-Ris tells Grand Master Zym.',
    date: on(3653, 7, 10),
    places: ['Coruscant'],
    conditions: [cond('hostile', 'The Senate is hostile', 'The Senate agrees to rebuild the Coruscant Temple', 'medium', [talk('paran-am-ris', 'dorian-janarus', 'leontyne-saresh'), { kind: 'outcome', outcome: 'O.senate_distrusts_jedi', state: 'broken', strength: 'major' }], { window: { fromYear: -3653 } })],
    consumes: needs('O.temple_destroyed', 'O.senate_distrusts_jedi'),
    produces: gives('O.rebuilding_postponed'),
    source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part1 (3653 BBY); P2, Cold War row 7',
  }),
  ev({ id: 'E.3653.balmorra_ceded', title: 'Balmorra is left to the Empire', summary: 'The Republic ends its support for Balmorra, which stays under Imperial control.', date: on(3653, 11), places: ['Balmorra'], consumes: needs('O.systems_ceded'), produces: gives('O.balmorra_imperial'), source: 'P1, after 3653 (row 18)' }),
];

// ---- 3. The Cold War, 3,653-3,642, and the war's return, 3,641-3,640 ----

const FLARE_UPS = ['O.hutt_treaty_cracked', 'O.sebaddon_incident', 'O.uphrades_destroyed', 'O.balmorra_republic', 'O.taris_imperial', 'O.revan_free', 'O.plan_zero'];
const GALACTIC_WAR_EVENTS = ['E.3641.braga', 'E.3641.belsavis', 'E.3641.fronts', 'E.3640.karrid', 'E.3640.corellia', 'E.3640.ilum', 'E.3640.voice'];

const COLD_WAR: WorldEventDef[] = [
  ev({
    id: 'E.3653.alderaan_secession',
    title: 'Alderaan secedes',
    summary: 'Senator Gaul Panteer walks out of the Senate over the Treaty; Alderaan secedes and the Alderaan Civil War follows.',
    // "after 3,653 BBY": the first day of 3,652, as the control table has it.
    date: { year: -3652, placed: 'invented' },
    places: ['Alderaan'],
    roles: [R('Gaul Panteer', 'silara-panteer-and-gaul-panteer')],
    conditions: [cond('anger', 'Anger at the Treaty', 'Alderaan is kept in the Republic', 'low', [talk('silara-panteer-and-gaul-panteer')], { window: { fromYear: -3653 }, prerequisites: [{ id: 'know.walkout', text: 'That Panteer means to walk out', tests: [look('Alderaan', 'Coruscant')], leads: [about('silara-panteer-and-gaul-panteer'), word('Alderaan')] }] })],
    consumes: needs('O.treaty_signed'),
    produces: gives('O.alderaan_civil_war'),
    source: 'P2, Cold War row 2',
  }),
  ev({ id: 'E.3653.ord_mantell_war', title: 'The Separatist War on Ord Mantell', summary: 'Separatists rise on Ord Mantell against the corrupt government loyal to the Republic.', date: { year: -3652, placed: 'invented' }, places: ['Ord Mantell'], consumes: needs('O.ord_mantell_abandoned'), produces: gives('O.ord_mantell_war'), source: 'P2, Cold War row 4' }),
  ev({
    id: 'E.3651.tython',
    title: 'Tython is rediscovered',
    summary: 'Satele Shan rediscovers Tython and becomes Grand Master.',
    date: on(3651),
    places: ['Tython'],
    roles: [R('Satele Shan', 'satele-shan')],
    // Jared (D-467): the vacancy is optional, so Tython is found either way; only the Grand Master depends on it.
    consumes: wants('O.grand_master_vacant'),
    produces: [...gives('O.tython_found'), { outcome: 'O.grand_master_set', when: { intact: ['O.grand_master_vacant'] } }],
    source: 'P2, Cold War row 5',
  }),
  ev({
    id: 'E.3650.tython_begun',
    title: 'The Tython Temple is begun',
    summary: 'The Order starts building its new Temple on Tython.',
    date: on(3650),
    places: ['Tython'],
    consumes: needs('O.rebuilding_postponed', 'O.tython_found'),
    produces: gives('O.order_on_tython'),
    source: 'P2, Cold War row 7 (the building; D-476)',
  }),
  ev({ id: 'E.3650.trant_director', title: 'Marcus Trant becomes SIS Director', summary: 'Marcus Trant becomes Director of the SIS.', date: on(3650), places: ['Coruscant'], roles: [R('Marcus Trant', 'marcus-trant')], consumes: needs('O.trant_sis'), produces: gives('O.trant_director'), source: 'P2, Cold War row 8' }),
  ev({ id: 'E.3650.mindor', title: 'The Mindor incursion', summary: 'An illegal Imperial incursion wipes out a Chagrian colony on Mindor.', date: on(3650), places: ['Mindor'], roles: [R('Fideltin Rusk', 'fideltin-rusk')], consumes: needs('O.treaty_signed'), source: 'P2, Cold War row 9' }),
  ev({ id: 'E.3649.janarus', title: 'Janarus is re-elected', summary: 'Dorian Janarus is re-elected Supreme Chancellor.', date: on(3649), places: ['Coruscant'], roles: [R('Dorian Janarus', 'dorian-janarus')], consumes: needs('O.janarus_chancellor'), source: 'P2, Cold War rows 11 and 16 (and again in 3,645)' }),
  ev({ id: 'E.3649.starbender', title: 'Operation Starbender', summary: 'Imperial Intelligence carries out Operation Starbender.', date: on(3649), source: 'P2, Cold War row 12' }),
  ev({ id: 'E.3648.taris', title: 'The Taris Resettlement begins', summary: 'The Taris Resettlement Initiative begins; the Endar Rebirth is lost over Taris.', date: on(3648), places: ['Taris'], produces: gives('O.taris_resettled'), source: 'P2, Cold War row 13' }),
  ev({ id: 'E.3648.makeb', title: 'The Makeb contract', summary: 'The InterStellar Regulators win the contract to police and defend Makeb.', date: on(3648), places: ['Makeb'], produces: gives('O.makeb_regulators'), source: 'P2, Cold War row 14' }),
  ev({ id: 'E.3647.tython_temple', title: 'The Tython Temple is completed', summary: 'The new Jedi Temple on Tython is completed.', date: on(3647), places: ['Tython'], consumes: needs('O.order_on_tython'), produces: gives('O.tython_temple'), source: 'P2, Cold War row 15' }),
  ev({ id: 'E.3645.odacer_sickness', title: 'The Sickness at Odacer-Faustin', summary: 'The Sickness breaks out at the Odacer-Faustin academy; a Sith warship crashes on Geonosis.', date: on(3645), places: ['Odacer-Faustin', 'Geonosis'], roles: [N('Darth Scabrous')], consumes: needs('O.odacer_academy'), source: 'P2, Cold War row 17' }),
  ev({ id: 'E.3645.blackstar', title: 'Blackstar Squad on Hutta', summary: 'Republic Special Forces\' Blackstar Squad is sent on a covert mission to Hutta.', date: on(3645), places: ['Nal Hutta'], consumes: needs('O.hutt_neutral'), source: 'P2, Cold War row 18' }),
  ev({ id: 'E.3644.krikthasi', title: 'The Krikthasi Massacre', summary: 'The Krikthasi Massacre on Balmorra.', date: on(3644), places: ['Balmorra'], consumes: needs('O.balmorra_imperial'), source: 'P2, Cold War row 19' }),
  ev({ id: 'E.3643.quesh', title: 'Hutt families break the treaty on Quesh', summary: 'Three Hutt families break the Hutt-Imperial treaty by helping the Republic on Quesh.', date: circa(on(3643, 1, 20)), places: ['Quesh'], roles: [R('the Hutt families')], conditions: [cond('deal', 'The Hutt families\' deal with the Republic goes ahead', 'The Hutt families\' deal on Quesh falls through', 'medium', [talk('suudaa-nemro'), look('Quesh'), republic('major', 'Quesh')], { window: { fromYear: -3645 }, prerequisites: [{ id: 'know.deal', text: 'That Hutt families are dealing with the Republic', tests: [look('Nal Hutta', 'Nar Shaddaa', 'Quesh'), talk('suudaa-nemro')], leads: [about('suudaa-nemro'), word('Nal Hutta', 'Quesh')] }] })], consumes: needs('O.hutt_neutral'), produces: gives('O.hutt_treaty_cracked'), plotPoint: 'PP-2', source: 'P2, Cold War row 21' }),
  ev({ id: 'E.3643.sebaddon', title: 'The Sebaddon affair', summary: 'Jet Nebula finds the Cinzia: the Sebaddon affair and the Hex droid crisis.', date: on(3643, 3), places: ['Sebaddon', 'Nal Hutta'], roles: [R('Jet Nebula')], consumes: needs('O.xandret_defected'), produces: gives('O.sebaddon_incident'), plotPoint: 'PP-2', source: 'P2, Cold War row 22' }),
  ev({ id: 'E.3643.flesh_raiders', title: 'The Flesh Raiders attack on Tython', summary: 'Flesh Raiders under the Dark Jedi Bengel Morr attack the Jedi on Tython and are defeated by the Hero of Tython.', date: on(3643, 4), places: ['Tython'], roles: [H('the Hero of Tython', 'hero-of-tython'), R('Bengel Morr', 'bengel-morr')], consumes: needs('O.order_on_tython'), source: 'P2, Cold War row 23' }),
  ev({
    id: 'E.3643.desolator',
    title: 'The Desolator crisis',
    summary: 'Darth Angral destroys Uphrades with the Desolator; Angral, Tarnis, Nefarid and Orgus Din die.',
    date: on(3643, 6),
    places: ['Uphrades', 'Coruscant', 'Tython'],
    roles: [C('Darth Angral', 'darth-angral'), H('the Hero of Tython', 'hero-of-tython'), R('Orgus Din', 'orgus-din')],
    conditions: [cond('secret', 'Angral\'s superweapon is kept secret', 'Angral\'s superweapon is exposed', 'medium', [look('Uphrades', 'Coruscant'), talk('tarnis', 'nefarid'), taken('tarnis'), taken('nefarid')], { window: { fromYear: -3645 }, prerequisites: [{ id: 'know.desolator', text: 'That Angral is building a weapon', tests: [look('Coruscant', 'Tython', 'Uphrades', ...KAAS), taken('tarnis'), taken('nefarid')], leads: [about('darth-angral', 'tarnis', 'nefarid', 'orgus-din'), word('Uphrades')] }] })],
    consumes: needs('O.treaty_signed'),
    produces: gives('O.uphrades_destroyed', 'O.angral_dead'),
    plotPoint: 'PP-2',
    interrupts: true,
    source: 'P2, Cold War row 24',
  }),
  // Ruled c. 3,643 (D-384 [3], D-476): the timeline slice's 3,653 is Nar Shaddaa/Legends' minority dating.
  ev({ id: 'E.3643.exchange_out', title: 'The Exchange is driven from the Corellian sector', summary: 'The Shadow Syndicate beats the Exchange and drives it out of the Corellian sector.', date: circa(on(3643, 8)), places: ['Nar Shaddaa'], produces: gives('O.exchange_weakened'), source: 'P1, 3653 row 14; SW_NarShaddaa_HuttSpace_GGW_Part1 decision 3; D-476' }),
  ev({ id: 'E.3643.esseles', title: 'The attack on the Esseles', summary: 'Rycus Kilran\'s Emperor\'s Glory attacks the Republic cruiser Esseles.', date: on(3643, 9), roles: [R('Rycus Kilran', 'rycus-kilran')], source: 'P2, Cold War row 26' }),
  ev({ id: 'E.3643.council_changes', title: 'Changes on the Dark Council', summary: 'Darth Hadra succeeds Mekhis; Darth Jadus fakes his death and Zhorrid takes the seat; Skotia is murdered and Zash becomes a Darth.', date: on(3643, 10), places: KAAS, roles: [R('Darth Hadra', 'darth-hadra'), R('Darth Mekhis', 'darth-mekhis'), R('Darth Jadus', 'darth-jadus'), R('Darth Skotia', 'darth-skotia'), R('Darth Zash', 'darth-zash')], produces: gives('O.council_shift_3643'), source: 'P2, Cold War rows 27-28' }),
  ev({ id: 'E.3642.balmorra_freed', title: 'Balmorra is freed', summary: 'The Republic and the Balmorran resistance free Balmorra.', date: on(3642, 2), places: ['Balmorra'], roles: [R('the Balmorran resistance')], conditions: [cond('rising', 'The resistance and the Republic can take Balmorra', 'The rising on Balmorra is broken', 'high', [republic('major', 'Balmorra'), look('Balmorra')], { window: { fromYear: -3644 }, prerequisites: [{ id: 'know.rising', text: 'That the resistance and the Republic mean to rise together', tests: [look('Balmorra'), taken('zenith')], leads: [about('zenith', 'darth-lachris'), word('Balmorra')] }] })], consumes: needs('O.balmorra_imperial'), produces: gives('O.balmorra_republic'), plotPoint: 'PP-2', source: 'P2, Cold War row 31' }),
  ev({ id: 'E.3642.taris_invasion', title: 'The invasion of Taris', summary: 'The Empire invades and occupies Taris, halting the resettlement.', date: on(3642, 4), places: ['Taris'], roles: [R('Leontyne Saresh', 'leontyne-saresh')], conditions: [cond('landing', 'The Empire can land on Taris', 'The invasion of Taris is thrown back', 'medium', [imperial('major', 'Taris'), talk('leontyne-saresh')], { window: { fromYear: -3643 }, prerequisites: [{ id: 'know.landing', text: 'That the Empire is coming for Taris', tests: [look(...KAAS, 'Taris'), taken('rycus-kilran')], leads: [about('rycus-kilran', 'leontyne-saresh'), word('Taris'), COUNCIL] }] })], consumes: needs('O.taris_resettled'), produces: gives('O.taris_imperial'), plotPoint: 'PP-2', source: 'P2, Cold War row 32' }),
  ev({
    id: 'E.3642.maelstrom',
    title: 'Revan is freed from the Maelstrom',
    summary: 'A Republic strike team frees Revan from the Maelstrom Prison; the Foundry; Malgus takes the station; Kilran dies.',
    date: on(3642, 6),
    places: ['Maelstrom Nebula', 'the Foundry'],
    roles: [C('Revan', 'revan'), C('Darth Malgus', 'darth-malgus'), R('the strike team'), R('Rycus Kilran', 'rycus-kilran')],
    conditions: [cond('imprisoned', 'Revan is still imprisoned', 'Revan is no longer in the Maelstrom Prison', 'high', [force('Maelstrom'), imperial('major', 'Maelstrom')], { window: { fromYear: -3645 }, prerequisites: [{ id: 'know.prison', text: 'Where Revan is held', tests: [look(...KAAS), taken('rycus-kilran')], leads: [about('rycus-kilran', 'revan'), word('Maelstrom', 'Maelstrom Nebula')] }] })],
    produces: [
      { outcome: 'O.revan_free', when: { intact: ['role.revan', 'cond.imprisoned'] } },
      { outcome: 'O.foundry_malgus', when: { intact: ['role.darth_malgus'] } },
      { outcome: 'O.kilran_dead' },
    ],
    plotPoint: 'PP-2',
    source: 'P2, Cold War rows 33-34',
  }),
  ev({ id: 'E.3642.plan_zero', title: 'Plan Zero', summary: 'The War Trust is destroyed; Darth Baras\'s Plan Zero.', date: on(3642, 9), endDate: { year: -3641, month: 3, placed: 'invented' }, roles: [C('Darth Baras', 'darth-baras'), H('the Emperor\'s Wrath', 'emperor-wrath')], produces: gives('O.plan_zero'), plotPoint: 'PP-2', source: 'P2, Cold War rows 37-38' }),
  ev({ id: 'E.3641.treaty_collapse', title: 'The Treaty of Coruscant collapses', summary: 'The Treaty of Coruscant officially collapses; the Cold War ends and the Galactic War begins.', date: { year: -3641, month: 6, day: 15, placed: 'lore' }, consumes: needs('O.treaty_signed'), produces: gives('O.galactic_war'), plotPoint: 'PP-2', interrupts: true, source: 'P2, Galactic War row 1 ("mid-3,641")' }),
  ev({ id: 'E.3641.braga', title: 'Tol Braga\'s strike on the Emperor', summary: 'A Jedi strike team under Tol Braga tries to capture the Emperor and is turned.', date: on(3641, 8), roles: [R('Tol Braga', 'tol-braga')], consumes: needs('O.galactic_war'), produces: gives('O.braga_turned'), source: 'P2, Galactic War row 2' }),
  ev({ id: 'E.3641.baras_council', title: 'Darth Baras takes a Council seat', summary: 'Baras\'s apprentice kills Darth Vengean on Dromund Kaas; Baras takes the seat.', date: on(3641, 9), places: KAAS, roles: [C('Darth Baras', 'darth-baras'), H('the Emperor\'s Wrath', 'emperor-wrath')], consumes: needs('O.plan_zero'), produces: gives('O.baras_council'), source: 'P2, Galactic War row 3' }),
  ev({
    id: 'E.3641.belsavis',
    title: 'The invasion of Belsavis',
    summary: 'The Empire invades the Belsavis prison and frees the Dread Masters.',
    date: on(3641, 10),
    places: ['Belsavis'],
    roles: [R('the Dread Masters', 'dread-masters')],
    conditions: [cond('held', 'The prison still holds them', 'The Dread Masters are out of the Empire\'s reach', 'medium', [imperial('major', 'Belsavis'), look('Belsavis')], { window: { fromYear: -3641 }, prerequisites: [{ id: 'know.invasion', text: 'That the Empire is coming for the Dread Masters', tests: [look(...KAAS), imperial('major', 'Belsavis')], leads: [COUNCIL, word('Belsavis'), given({ kind: 'outcome', outcome: 'O.galactic_war', state: 'produced' })] }] })],
    // Shange and Raxxus are held there too; the Dread Masters do not need them (optional: D-467).
    consumes: [...needs('O.galactic_war'), ...wants('O.shange_imprisoned', 'O.raxxus_imprisoned')],
    produces: gives('O.dread_masters_free'),
    source: 'P2, Galactic War row 4',
  }),
  ev({ id: 'E.3641.chancellor_vote', title: 'The Chancellor election of 3,641', summary: 'A Supreme Chancellor election is held.', date: on(3641, 10, 15), places: ['Coruscant'], consumes: needs('O.janarus_chancellor'), source: 'P2, Galactic War row 5' }),
  ev({ id: 'E.3641.fronts', title: 'The fronts of 3,641', summary: 'War on Quesh, fighting on Hoth, and the Alderaan Civil War goes on.', date: on(3641, 11), places: ['Quesh', 'Hoth', 'Alderaan'], consumes: needs('O.galactic_war', 'O.alderaan_civil_war'), produces: gives('O.fronts_3641'), source: 'P2, Galactic War row 6' }),
  // Karrid's assault comes last in 3,640 (D-468 [3]): it follows the Emperor's fall and Malgus's. The Council deaths run to
  // the year's end, because Karrid's own death over Duro is among them.
  ev({ id: 'E.3640.karrid', title: 'Karrid\'s assault', summary: 'The Empire launches a renewed assault, led by Darth Karrid from the Ascendant Spear.', date: on(3640, 11), roles: [R('Darth Karrid', 'darth-karrid')], consumes: needs('O.galactic_war'), source: 'P2, Galactic War row 10' }),
  ev({ id: 'E.3640.corellia', title: 'The Battle of Corellia', summary: 'Darth Decimus invades Corellia; Decimus, Hadra and Acharon die there.', date: on(3640, 2), places: ['Corellia'], roles: [R('Darth Decimus', 'darth-decimus')], consumes: needs('O.galactic_war', 'O.decimus_council'), produces: gives('O.corellia_contested'), source: 'P2, Galactic War row 11' }),
  ev({ id: 'E.3640.ilum', title: 'The Battle of Ilum', summary: 'Malgus declares himself Emperor at Ilum and is defeated.', date: on(3640, 4), places: ['Ilum'], roles: [C('Darth Malgus', 'darth-malgus')], consumes: needs('O.galactic_war', 'O.foundry_malgus'), produces: gives('O.malgus_defeated', 'O.ilum_contested'), interrupts: true, source: 'P2, Galactic War rows 12-13' }),
  ev({ id: 'E.3640.voss', title: 'The Emperor on Voss', summary: 'The Emperor goes to Voss in disguise and is trapped in the Dark Heart.', date: circa(on(3640, 5)), places: ['Voss'], roles: [C('the Emperor', 'vitiate')], produces: gives('O.emperor_trapped'), source: 'P2, Galactic War row 14' }),
  ev({ id: 'E.3640.voice', title: 'The Emperor\'s Voice is killed', summary: 'In a Republic assault on Dromund Kaas the Hero of Tython kills the Emperor\'s Voice; power passes to the Dark Council.', date: on(3640, 7), places: KAAS, roles: [H('the Hero of Tython', 'hero-of-tython')], consumes: needs('O.galactic_war'), produces: gives('O.dark_council_rules'), interrupts: true, source: 'P2, Galactic War row 15' }),
  ev({ id: 'E.3640.council_deaths', title: 'Deaths on the Dark Council', summary: 'Thanaton is killed and Darth Nox takes the Sphere of Ancient Knowledge; Baras dies; Karrid dies over Duro and Acina heads the Sphere of Technology.', date: on(3640, 8), endDate: on(3640, 12), places: ['Korriban', 'Duro'], roles: [R('Darth Thanaton', 'darth-thanaton'), H('Darth Nox', 'darth-nox'), R('Darth Baras', 'darth-baras'), R('Darth Karrid', 'darth-karrid'), R('Darth Acina', 'darth-acina')], consumes: needs('O.baras_council'), produces: gives('O.council_deaths_3640'), source: 'P2, Galactic War row 16' }),
  ev({ id: 'E.3640.janarus_dies', title: 'Chancellor Janarus is killed', summary: 'Janarus is killed aboard the Founder; Leontyne Saresh becomes Chancellor and Jace Malcom Supreme Commander.', date: on(3640, 9), places: ['the Founder'], roles: [C('Dorian Janarus', 'dorian-janarus'), R('Leontyne Saresh', 'leontyne-saresh'), R('Jace Malcom', 'jace-malcom')], consumes: needs('O.janarus_chancellor'), produces: gives('O.saresh_chancellor'), source: 'P2, Galactic War rows 17-18' }),
];

// ---- 4. Plot points ----

const prevented: WorldExpr = { atLeast: 4, of: FLARE_UPS.map((outcome): WorldExpr => ({ outcome, is: 'broken' })) };
const INCIDENT_PLACES = ['Balmorra', 'Taris', 'Alderaan', 'Ord Mantell'] as const;
const incident = (place: string): string => `treaty-incident-${slug(place).replace(/_/g, '-')}`;
/** Two extra incidents bring the collapse forward (invented; the map says "extra incidents added through play"). */
const provoked: WorldExpr = { atLeast: 2, of: INCIDENT_PLACES.map((p): WorldExpr => ({ test: flag(incident(p)) })) };
const lost = (canonId: string): WorldExpr => ({ test: { kind: 'npc', canonId: `lore:${canonId}`, state: 'lost' } });
const IMPERIAL_LOSSES: WorldExpr[] = [lost('darth-malgus'), lost('darth-angral'), lost('darth-marr'), lost('darth-vowrawn'), { outcome: 'O.korriban_imperial', is: 'broken' }];
const REPUBLIC_LOSSES: WorldExpr[] = [lost('berooken'), lost('zym'), lost('satele-shan'), lost('rans'), { outcome: 'O.blockade_broken', is: 'broken' }];
/** Total defeat (D-468 [5], invented): the capital taken, or the main fleet destroyed (which waits for ship combat), plus three losses. */
const CAPITAL_LOST = { imperial: { test: { kind: 'control', place: 'Dromund Kaas', side: 'sithEmpire', is: false } }, republic: { test: { kind: 'control', place: 'Coruscant', side: 'republic', is: false } } } as const satisfies Record<string, WorldExpr>;
const FREED = [{ place: 'Coruscant', side: 'republic' as const, note: 'the Empire did not hold it; the Treaty of Coruscant was never signed' }];
/** How long a delayed collapse waits (invented): three years. */
const DELAY_DAYS = 3 * 368;

export const NETWORK_3661: WorldNetwork = {
  standing: [],
  events: [...WAR, ...SACKING, ...COLD_WAR],
  scenes: [
    // Wired end to end (D-467): the player, knowing Coruscant is the target, gets the warning believed.
    { id: 'coruscant-warned', title: 'Coruscant is warned', event: 'E.3653.temple_strike', guard: 'high', fromYear: -3654, on: [talk('zym', 'ven-zallow', 'berooken', 'rans')], requires: [{ kind: 'known', tag: FORESEEN }] },
    // Ruling 4: Visz fails before breaking the blockade.
    { id: 'visz-stopped', title: 'Hylo Visz is stopped', event: 'E.3660.hydian_battle', guard: 'medium', fromYear: -3661, on: [{ kind: 'fight', canonIds: lore('hylo-visz'), minStakes: 'serious' }] },
    // PP-2: extra incidents added through play.
    ...INCIDENT_PLACES.map((place) => ({
      id: incident(place),
      title: `An incident on ${place}`,
      event: 'E.3641.treaty_collapse',
      guard: 'medium' as const,
      fromYear: -3652,
      on: [{ kind: 'fight' as const, places: [place], factions: ['republic', 'jediOrder', 'sithEmpire', 'sith'] as const, minStakes: 'lethal' as const }],
      requires: [{ kind: 'outcome' as const, outcome: 'O.treaty_signed', state: 'produced' as const }],
    })),
  ],
  plotPoints: [
    {
      id: 'PP-1',
      title: 'The Sacking and the Treaty',
      events: ['E.3654.peace_offer', 'E.3653.alderaan_conference', 'E.3653.temple_strike', 'E.3653.sacking', 'E.3653.treaty'],
      // The one hinge (ruling 2): the Empire takes and holds Coruscant.
      tracker: { any: [{ outcome: 'O.coruscant_occupied', is: 'broken' }, { tag: 'E.3653.sacking#cond.hold', is: 'broken' }] },
      alternatives: [
        {
          id: 'attrition',
          title: 'Peace by attrition',
          heading: 'A WAR THAT GRINDS ON',
          parameters: ['No treaty is signed and the war goes on', 'In time both sides are drained and a later, looser peace follows', 'The Republic is much less restricted than it would have been', 'The Cold War comes much later or not at all'],
          base: 2,
          criteria: [],
          effects: { breaks: ['O.treaty_signed'], control: FREED },
        },
        {
          id: 'victors-treaty',
          title: 'A treaty favouring the winner',
          heading: 'THE BALANCE TIPS',
          parameters: ['No Treaty of Coruscant', 'Whoever holds the advantage now will dictate terms: major freedoms for one side, restrictions for the other', 'The Cold War comes much later or not at all'],
          criteria: [...IMPERIAL_LOSSES, ...REPUBLIC_LOSSES].map((when) => ({ when, weight: 1 })).concat([{ when: { tag: FORESEEN, is: 'broken' }, weight: 1 }, { when: { outcome: 'O.temple_saved', is: 'produced' }, weight: 1 }]),
          effects: { breaks: ['O.treaty_signed'], control: FREED },
        },
        {
          id: 'total-defeat',
          title: 'Total defeat of one side',
          heading: 'ONE SIDE IS BROKEN',
          parameters: ['No Treaty of Coruscant', 'The side that has lost its leaders collapses in the years that follow'],
          requires: { any: [{ all: [CAPITAL_LOST.imperial, { atLeast: 3, of: IMPERIAL_LOSSES }] }, { all: [CAPITAL_LOST.republic, { atLeast: 3, of: REPUBLIC_LOSSES }] }] },
          base: 10,
          criteria: [],
          effects: { breaks: ['O.treaty_signed'], control: FREED },
        },
      ],
    },
    {
      id: 'PP-2',
      title: 'The Treaty\'s collapse',
      events: ['E.3643.quesh', 'E.3643.sebaddon', 'E.3643.desolator', 'E.3642.balmorra_freed', 'E.3642.taris_invasion', 'E.3642.maelstrom', 'E.3642.plan_zero', 'E.3641.treaty_collapse'],
      appliesIf: { all: [{ outcome: 'O.treaty_signed', is: 'produced' }, { not: { outcome: 'O.galactic_war', is: 'produced' } }] },
      // Ruling 3: four of the seven flare-ups prevented. The default, collapse on time, is the recorded path: nothing is chosen.
      tracker: { any: [prevented, provoked] },
      alternatives: [
        {
          id: 'delayed',
          title: 'The collapse is delayed',
          heading: 'THE COLD WAR HOLDS',
          parameters: ['The Cold War lasts longer than recorded', 'Open war still comes, later, and its first years follow it'],
          criteria: [{ when: prevented, weight: 2 }],
          effects: { reschedule: [{ events: ['E.3641.treaty_collapse', ...GALACTIC_WAR_EVENTS], byDays: DELAY_DAYS }] },
        },
        {
          id: 'early',
          title: 'The collapse comes early',
          heading: 'THE TREATY BREAKS EARLY',
          parameters: ['Incident upon incident: open war resumes before mid-3,641'],
          requires: provoked,
          base: 1,
          criteria: [],
          effects: { reschedule: [{ events: ['E.3641.treaty_collapse'], byDays: 0, toNow: true }] },
        },
      ],
    },
  ],
};
