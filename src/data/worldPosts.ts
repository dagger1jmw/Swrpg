// Posts (D-491): the places in an army, a service, a crew or a household that a world condition can ask for. A post is
// held by the start option that gives it, by a tie (the figure whose people these are trusts the character, or is their
// master or apprentice), or by the engine-only flag worldPost:<id>. Nothing sets the flag yet: wartime postings are not
// built, so a post with no start and no tie is out of reach until then.
export interface WorldPostDef {
  label: string;
  /** Start options that hold it from the first day. */
  starts?: readonly string[];
  /** Trusted by (or bound as master or apprentice to) any of these: their household, crew or staff. */
  tiedTo?: readonly string[];
  /** The start options hold it until this year (BBY): the job ends with what it was for. */
  startsUntilBby?: number;
}

export const WORLD_POSTS = {
  sis: { label: 'an SIS agent', starts: ['sis-agent'], tiedTo: ['lore:marcus-trant'] },
  'imperial-intelligence': { label: 'an agent of Imperial Intelligence', starts: ['imperial-agent'], tiedTo: ['lore:shullis-khamarr'] },
  'republic-command': { label: 'a Republic officer, or a Jedi, with a command' },
  'imperial-command': { label: 'an Imperial officer with a command' },
  'republic-security': { label: 'Republic security on Coruscant: the grid, traffic control, the Senate guard' },
  'temple-security': { label: 'the guard of the Jedi Temple' },
  'republic-investigator': { label: 'a Republic military investigator' },
  'conference-delegation': { label: 'the Republic delegation on Alderaan, or its Jedi escort', tiedTo: ['lore:paran-am-ris', 'lore:darnala'] },
  senate: { label: 'a senator, or an aide with access to one', tiedTo: ['lore:paran-am-ris', 'lore:dorian-janarus', 'lore:leontyne-saresh'] },
  'alderaan-house': { label: 'an Alderaanian noble, or an aide', tiedTo: ['lore:silara-panteer-and-gaul-panteer'] },
  'mandalorian-command': { label: 'a Mandalorian officer of the blockade', tiedTo: ['lore:mandalore-the-lesser'] },
  'mandalorian-liaison': { label: 'the Imperial liaison to the Mandalorians', starts: ['imperial-agent'], startsUntilBby: 3660 },
  raiders: { label: 'the command of the raiders on the Hydian Way' },
  'hutt-service': { label: 'in the service of a Hutt, or a cartel contact', starts: ['underworld-smuggler'], tiedTo: ['lore:suudaa-nemro', 'lore:tassaa-bareesh', 'lore:karagga-the-unyielding'] },
  'hutt-envoy': { label: 'an Imperial agent to the Hutts' },
  'visz-crew': { label: 'the crew or circle of Hylo Visz', tiedTo: ['lore:hylo-visz'] },
  'belsavis-staff': { label: 'the staff of the Belsavis prison' },
  'adraas-household': { label: 'the household of Lord Adraas', tiedTo: ['lore:adraas'] },
  'baras-household': { label: 'the household of Darth Baras', tiedTo: ['lore:darth-baras'] },
  'council-staff': { label: 'the staff of a Dark Councillor', tiedTo: ['lore:darth-marr', 'lore:darth-vowrawn', 'lore:darth-azamin', 'lore:darth-decimus', 'lore:darth-angral'] },
  'angral-fleet': { label: 'the fleet of Darth Angral', tiedTo: ['lore:darth-angral'] },
  'strike-team': { label: 'the team that strikes the Jedi Temple', tiedTo: ['lore:darth-malgus', 'lore:adraas'] },
  'sith-household': { label: 'a Sith household on Dromund Kaas' },
  resistance: { label: 'the Balmorran resistance', tiedTo: ['lore:zenith'] },
  'maelstrom-team': { label: 'the Republic strike team sent to the Maelstrom' },
  'maelstrom-jailer': { label: 'the jailers of the Maelstrom Prison' },
  serving: { label: 'a serving soldier, sailor or agent of a side', starts: ['republic-trooper', 'republic-pilot', 'sis-agent', 'imperial-soldier', 'imperial-officer', 'imperial-agent'] },
} as const satisfies Record<string, WorldPostDef>;

export type WorldPostId = keyof typeof WORLD_POSTS;
export const WORLD_POST_IDS = Object.keys(WORLD_POSTS) as WorldPostId[];
export const worldPost = (id: WorldPostId): WorldPostDef => WORLD_POSTS[id];
