// Tactics as knowledge (m8-ship-life part G; D-519; docs-v2/spec/ship-life.md section 10). One dated catalogue (D-438): the
// dogfight manoeuvres, attack runs and fleet formations of combat-scales and SW_Space_Tactics.md, and the ground manoeuvres of
// the design notes' "Ground command" (m8-ground will use those). Each entry's id is the engine's own where the engine flies it
// (MANOEUVRES, RUN_APPROACHES, FORMATIONS); the rest are story tactics the narrator may use once known. Descriptions and dates
// are the lore's; "strong against" and "weak against" read the engine's matchups where it has them, else the lore's text
// (ground: readings, invented, as the fleet formations were). Sets: what a programme, a rank or a teacher gives.
import { FORMATION_BEATS, type MANOEUVRE } from './shipCombat.config';

export const TACTIC_SCALES = ['dogfight', 'attackRun', 'fleet', 'ground'] as const;
export type TacticScale = (typeof TACTIC_SCALES)[number];

export interface TacticDef {
  id: string;
  name: string;
  scale: TacticScale;
  description: string;
  strong: string;
  weak: string;
  /** Requirements in words; `needs` is what the engine checks. */
  requires?: string;
  needs?: 'wingman' | 'forceOrDroid' | 'terrain' | 'trench';
  /** In use from / to (campaign years); absent = no era tie in the lore. */
  from?: number;
  to?: number;
  /** The engine flies or orders it (the battle menu offers it once known). */
  engine: boolean;
  source: string;
}

const ST = 'SW_Space_Tactics.md';
const GC = 'm8-design-notes "Ground command" (matchups invented)';
const beats = (id: string): string => (FORMATION_BEATS as Record<string, readonly string[]>)[id]?.join(', ') || 'nothing in particular';
const beatenBy = (id: string): string =>
  Object.entries(FORMATION_BEATS as Record<string, readonly string[]>)
    .filter(([, v]) => v.includes(id))
    .map(([k]) => k)
    .join(', ') || 'nothing in particular';

const dog = (id: keyof typeof MANOEUVRE, name: string, description: string, strong: string, weak: string, extra: Partial<TacticDef> = {}): TacticDef => ({ id, name, scale: 'dogfight', description, strong, weak, engine: true, source: ST, ...extra });

export const TACTICS: readonly TacticDef[] = [
  // ---- dogfight manoeuvres (the engine's) ----
  dog('fly', 'The head-on pass', 'Hold the fight and trade fire as you pass: no special move.', 'an even fight', 'any real manoeuvre'),
  dog('break', 'The Break', 'A sharp turn into the attack so the attacker overshoots.', 'an attacker on your tail', 'the Reverse Throttle Hop, the Tallon Roll; a snap shot if timed wrong'),
  dog('jink', 'Jinking', 'Random slips and turns to deny a lock; the attacker keeps the position.', 'a lock from behind (harder to hit)', 'your own shots suffer'),
  dog('scissors', 'Scissors', 'Timed twisting turns after an overshoot to bring the attacker into your sights.', 'a pilot who only holds the fight', 'the Tallon Roll; bad timing'),
  dog('stall', 'Silerian Stall', 'An abrupt halt so pursuers overtake and become targets.', 'a close pursuer', 'the Tallon Roll'),
  dog('koiogran', 'Koiogran turn', 'Kill the forward momentum and loop-roll onto a new heading.', 'escaping pursuit, turning guns on the pursuer', 'terrain close by'),
  dog('powerPivot', 'Power pivot', 'Lateral thrusters spin the fighter half round.', 'facing a pursuer fast', 'a pilot who reads it'),
  dog('terrain', 'Terrain-following flying', 'Fly perilously close to a surface where pursuers cannot follow.', 'pursuers and line-of-sight sensors', 'a crash if it goes wrong', { needs: 'terrain', requires: 'a surface to hug (asteroids, a city, a trench)' }),
  dog('reverseThrottleHop', 'Reverse Throttle Hop', 'As the defender breaks, pull up, decelerate and drop back onto the tail.', 'the Break, the trap', 'timing: too early and the defender loops round'),
  dog('tallonRoll', 'Tallon Roll', 'About to overshoot a breaking target: level out, pull up, roll away and slide in behind.', 'the Break, the Silerian Stall, scissors', 'disorientation'),
  dog('loopBack', "Segnor's Loop", 'Run away from the target, then double back for another pass.', 'resetting a losing fight', 'nothing gained in position'),
  dog('trap', 'The trap', 'A pair attacked from behind both break; an attacker who follows ends up between them.', 'a lone pursuer', 'a feint at the leader, then a Tallon Roll or Reverse Throttle Hop', { needs: 'wingman', requires: 'a wingman' }),
  dog('corellianSlip', 'Corellian Slip', 'A friend flies straight at you and your pursuer, veering off at the last moment to kill it.', 'a pursuer fixed on you', 'a wingman out of position', { needs: 'wingman', requires: 'a wingman' }),
  dog('slipJaws', 'Slip-jaws', 'Two fighters cross so close that their pursuers collide.', 'two pursuers', 'only droid or Force-aided pilots can fly it', { needs: 'forceOrDroid', requires: 'a droid pilot or a Force-aided one, and a wingman' }),
  // ---- dogfight: story tactics (the lore's, not flown by the engine) ----
  { id: 'underSplit', name: 'Under Split', scale: 'dogfight', description: 'The leader crosses in front of the wingman as bait; the wingman dives under and cuts up for a belly shot.', strong: 'green pilots', weak: 'a veteran who sees the bait; dangerous for the lead', requires: 'a wingman', needs: 'wingman', engine: false, source: ST },
  { id: 'feintBackstab', name: 'Feint and Backstab', scale: 'dogfight', description: 'One flight runs head-on and banks away, drawing pursuit; a second flight out of sensor range pounces.', strong: 'pursuers who chase', weak: 'a disciplined enemy who holds', requires: 'two flights', needs: 'wingman', engine: false, source: ST },
  { id: 'luftberry', name: 'Luftberry circle', scale: 'dogfight', description: 'A defensive circle: each craft covers the one ahead.', strong: 'faster attackers against slow craft and bombers', weak: 'no way to win, only to last', requires: 'several craft', engine: false, source: ST },
  { id: 'battleSpread', name: 'Battle spread', scale: 'dogfight', description: 'A pair flying side by side 200-300 m apart in hostile territory.', strong: 'surprise from either side', weak: 'nothing in particular', requires: 'a wingman', engine: false, source: ST },
  { id: 'corkscrew', name: 'Corkscrew Avoid', scale: 'dogfight', description: 'Spiral to dodge fire while holding a heading.', strong: 'gunners on a capital ship', weak: 'fighters on your tail', engine: false, source: ST },
  // ---- fighters against capital ships (the attack-run engine's approaches) ----
  { id: 'pass', name: 'Strafing pass', scale: 'attackRun', description: 'A run past the ship firing on one shield facing.', strong: 'a ship with weak point defence', weak: 'its turbolaser batteries and point defence', engine: true, source: ST },
  { id: 'skim', name: 'Hull skimming', scale: 'attackRun', description: 'Strafe about 5 m above the hull, under the big guns, for point-blank shots at vital systems.', strong: 'a capital ship\'s guns (built for other capital ships)', weak: 'a scrape against the hull', engine: true, source: ST },
  { id: 'trench', name: 'Trench run', scale: 'attackRun', description: 'Hug a trench in the hull for cover and deliver ordnance to a sensitive point; usually a three-ship triangle.', strong: 'a capital ship with a trench', weak: 'pursuing fighters; a wreck when it goes wrong', requires: 'a ship with a trench; enemy fighters dealt with first', needs: 'trench', engine: true, source: ST },
  { id: 'novaFlare', name: 'Nova flare', scale: 'attackRun', description: 'Massed torpedo volleys on points of one shield facing.', strong: 'any ship, the bigger and more frequent the volleys', weak: 'the captain rolling the ship to fresh shields', requires: 'torpedoes', engine: false, source: ST },
  { id: 'hitAndRun', name: 'Hit-and-run raid', scale: 'attackRun', description: 'Jump in, fire a few torpedoes, jump out.', strong: 'forcing the enemy to launch fighters and spread thin', weak: 'hard on pilots and fighters if kept up', requires: 'hyperdrive-equipped fighters', engine: false, source: ST },
  // ---- fleet formations (the engine's) ----
  { id: 'exchange', name: 'The line (exchange)', scale: 'fleet', description: 'Two battle lines pass trading broadsides; better shields and weapons win.', strong: beats('exchange'), weak: beatenBy('exchange'), engine: true, source: ST },
  { id: 'capT', name: 'Capping the T', scale: 'fleet', description: 'Cross in front of the enemy line: every ship fires on its lead, only the lead can reply.', strong: beats('capT'), weak: beatenBy('capT'), engine: true, source: ST },
  { id: 'slash', name: 'Slash (line through the centre)', scale: 'fleet', description: 'Drive a line through the middle of the enemy formation, broadsides both ways.', strong: beats('slash'), weak: `${beatenBy('slash')}; breaks up if its lead is disabled`, requires: 'ships with strong, redundant shields', engine: true, source: ST },
  { id: 'fake', name: 'The fake', scale: 'fleet', description: 'Rush in as if to brawl, then heel over into a line for a running broadside.', strong: `${beats('fake')}, commanders who break formation`, weak: `${beatenBy('fake')}, a commander who holds formation`, engine: true, source: ST },
  { id: 'brawl', name: 'The brawl', scale: 'fleet', description: 'Lines rush each other into ship-on-ship melee; the outnumbered side\'s gamble.', strong: beats('brawl'), weak: beatenBy('brawl'), engine: true, source: ST },
  { id: 'pincer', name: 'Pincer', scale: 'fleet', description: 'Trap a target between attacking warships.', strong: beats('pincer'), weak: `${beatenBy('pincer')}; stretched thin`, engine: true, source: ST },
  { id: 'screen', name: 'Starfighter screen', scale: 'fleet', description: 'Fighters between the capital ships and the enemy\'s fighters and bombers.', strong: 'fighter and bomber strikes', weak: beatenBy('screen'), requires: 'fighters aboard', engine: true, source: ST },
  { id: 'feignedRetreat', name: 'Feigned retreat', scale: 'fleet', description: 'Pretend to retreat in disarray to draw the enemy into an ambush.', strong: beats('feignedRetreat'), weak: beatenBy('feignedRetreat'), engine: true, source: ST },
  { id: 'withdraw', name: 'Withdraw', scale: 'fleet', description: 'Fall back in order to long range and leave.', strong: 'saving the fleet', weak: beatenBy('withdraw'), engine: true, source: 'combat-scales (D-505)' },
  { id: 'rollShip', name: 'Rolling the ship', scale: 'fleet', description: 'Turn a damaged facing away and show fresh shields.', strong: 'a nova flare on one facing', weak: 'guns x0.6 that round', engine: true, source: ST },
  // ---- fleet: story tactics ----
  { id: 'targetedBarrage', name: 'Targeted barrage', scale: 'fleet', description: 'Concentrate turbolaser fire on an enemy ship\'s weak points; often the easiest way to kill carriers.', strong: 'carriers', weak: 'leaves the rest of the line free', engine: false, source: ST },
  { id: 'slashingTheDeck', name: 'Slashing the deck', scale: 'fleet', description: 'Attack along a vector that keeps out of most of a ship\'s guns, double back and fire again.', strong: 'a lone heavy ship', weak: 'a target with fighter or capital support', from: -2000, engine: false, source: `${ST} (the New Sith Wars)` },
  { id: 'hullShieldedLaunch', name: 'Hull-shielded fighter launch', scale: 'fleet', description: 'Angle the hull against the enemy to shield fighters as they launch, then send them round the flank.', strong: 'commanders who cannot handle an unstructured attack', weak: 'experienced opponents', requires: 'a carrier', engine: false, source: ST },
  { id: 'patrolTriangle', name: 'Patrol triangle', scale: 'fleet', description: 'A sensor ship on point, a stronger ship trailing, a heavy cruiser anchoring as command ship.', strong: 'patrolling with minimum detection', weak: 'a concentrated strike on the point', engine: false, source: ST },
  { id: 'vanjervalisChain', name: 'Vanjervalis Chain', scale: 'fleet', description: 'Hammerheads slaved to an Inexpugnable\'s sensor package form a blockade line that predicts and adjusts.', strong: 'a fugitive ship trying to break a blockade', weak: 'a hacked control link turns the guns', requires: 'an Inexpugnable command ship and Hammerheads', from: -3964, engine: false, source: `${ST} (the Mandalorian Wars)` },
  // ---- ground (m8-ground; matchups are readings) ----
  { id: 'frontalAssault', name: 'Frontal assault', scale: 'ground', description: 'Mass on the enemy\'s front and break it by weight.', strong: 'a thin or tired line, a feint that overcommits', weak: 'defence in depth, an ambush, enfilade from a flank', engine: false, source: GC },
  { id: 'flanking', name: 'Flanking', scale: 'ground', description: 'Fix the front and strike the enemy\'s side.', strong: 'a frontal assault, a static line', weak: 'a reserve held back, an ambush on the flanking force', engine: false, source: GC },
  { id: 'envelopment', name: 'Envelopment', scale: 'ground', description: 'Wrap round both flanks to surround the enemy.', strong: 'a frontal assault, a defence with no depth', weak: 'a breakthrough at the thin centre, a fighting withdrawal', engine: false, source: GC },
  { id: 'defenceInDepth', name: 'Defence in depth', scale: 'ground', description: 'Layered positions that give ground slowly and bleed an attacker.', strong: 'a frontal assault, a breakthrough', weak: 'a siege, infiltration behind the lines', engine: false, source: GC },
  { id: 'ambush', name: 'Ambush', scale: 'ground', description: 'Strike from hiding where the enemy must pass.', strong: 'a careless advance, a flanking force', weak: 'scouting, a feint that springs it early', engine: false, source: GC },
  { id: 'feint', name: 'Feint', scale: 'ground', description: 'A false attack to draw the enemy\'s reserve, then the real blow elsewhere.', strong: 'an enemy who commits its reserve, an ambush', weak: 'a disciplined defence that holds, a frontal assault', engine: false, source: GC },
  { id: 'siege', name: 'Siege or encirclement', scale: 'ground', description: 'Cut a position off and starve or grind it down.', strong: 'defence in depth, a fortress', weak: 'a relief force, a breakout, time', engine: false, source: GC },
  { id: 'infiltration', name: 'Infiltration or raid', scale: 'ground', description: 'Small units slip past the line to strike command, supply or a key point.', strong: 'defence in depth, a siege line', weak: 'patrols and alert sentries, open ground', engine: false, source: GC },
  { id: 'fightingWithdrawal', name: 'Fighting withdrawal', scale: 'ground', description: 'Fall back in order, covering each move with fire.', strong: 'an envelopment closing, a stronger enemy', weak: 'pursuit by faster units, a broken rear guard', engine: false, source: GC },
];
export const TACTIC_BY_ID: ReadonlyMap<string, TacticDef> = new Map(TACTICS.map((t) => [t.id, t]));

/** In use in a calendar year (D-438). */
export const tacticInUse = (t: TacticDef, year: number): boolean => (t.from === undefined || year >= t.from) && (t.to === undefined || year <= t.to);

/** What every pilot knows (Jared): the break, the jink, the head-on pass; a strafing pass at a big ship. */
export const PILOT_BASICS: readonly string[] = ['fly', 'break', 'jink', 'pass'];
/** What any commander can order without training (a reading, invented): the line, the brawl, withdrawing, rolling the ship. */
export const COMMAND_BASICS: readonly string[] = ['exchange', 'brawl', 'withdraw', 'rollShip'];

/** Sets a programme, an archetype, a rank or a teacher gives (readings of the design notes; the split is invented). */
export const TACTIC_SETS: Readonly<Record<string, { label: string; ids: readonly string[] }>> = {
  flightSchool: { label: 'flight school: the core dogfight manoeuvres', ids: ['fly', 'break', 'jink', 'scissors', 'stall', 'koiogran', 'powerPivot', 'reverseThrottleHop', 'tallonRoll', 'loopBack', 'trap', 'pass', 'battleSpread', 'luftberry'] },
  aceManoeuvres: { label: 'a veteran pilot\'s manoeuvres', ids: ['terrain', 'corellianSlip', 'underSplit', 'feintBackstab', 'corkscrew', 'skim', 'trench', 'novaFlare', 'hitAndRun'] },
  officerAcademy: { label: 'an officer academy: the fleet formations', ids: ['exchange', 'capT', 'slash', 'fake', 'brawl', 'pincer', 'screen', 'feignedRetreat', 'withdraw', 'rollShip', 'targetedBarrage', 'hullShieldedLaunch', 'patrolTriangle', 'slashingTheDeck'] },
  groundBasics: { label: 'army training: the ground basics', ids: ['frontalAssault', 'flanking', 'defenceInDepth', 'fightingWithdrawal'] },
  groundOfficer: { label: 'an officer academy: ground command', ids: ['frontalAssault', 'flanking', 'envelopment', 'defenceInDepth', 'ambush', 'feint', 'siege', 'infiltration', 'fightingWithdrawal'] },
  smugglerFlying: { label: 'a smuggler\'s flying', ids: ['fly', 'break', 'jink', 'scissors', 'stall', 'koiogran', 'powerPivot', 'loopBack', 'terrain', 'corkscrew'] },
  irregularGround: { label: 'irregular fighting', ids: ['ambush', 'infiltration', 'fightingWithdrawal', 'feint'] },
};

/** Programmes (m8-skills, D-513) that give sets on graduation. */
export const PROGRAMME_TACTICS: Readonly<Record<string, readonly string[]>> = {
  caridaFlight: ['flightSchool'],
  caridaFull: ['officerAcademy', 'groundOfficer', 'flightSchool'],
  caridaStormtrooper: ['groundBasics'],
  officerAcademy: ['officerAcademy', 'groundOfficer'],
  prefsbelt: ['officerAcademy', 'groundOfficer'],
  royalGuard: ['groundBasics'],
  verdGoten: ['groundBasics', 'irregularGround'],
  cloneRegular: ['groundBasics'],
  cloneCommando: ['groundBasics', 'irregularGround'],
  raithal: ['officerAcademy', 'groundOfficer'],
};

/**
 * What a career's own training implies (old saves and new characters alike; readings, invented): pilots flight school, naval
 * officers the formations, soldiers and officers the ground, smugglers their own flying, Mandalorians irregular fighting.
 * Jedi and Sith Knights and Lords learn to fly in the Order or the Academy (the core manoeuvres; Jared's Jedi pilots).
 */
export const ARCHETYPE_TACTICS: Readonly<Record<string, readonly string[]>> = {
  starfighterPilot: ['flightSchool'],
  shipGunner: [],
  navalOfficer: ['officerAcademy'],
  officer: ['groundOfficer'],
  soldier: ['groundBasics'],
  mandalorian: ['groundBasics', 'irregularGround', 'smugglerFlying'],
  smuggler: ['smugglerFlying'],
  bountyHunter: ['smugglerFlying', 'irregularGround'],
  intelAgent: ['irregularGround'],
};
/** Start options that imply a set beyond the archetype's (a pilot start is a pilot; a naval officer start knows the formations). */
export const START_TACTICS: Readonly<Record<string, readonly string[]>> = {
  'republic-pilot': ['flightSchool'],
  'imperial-officer': ['officerAcademy'],
  'mandalorian-blockade': ['flightSchool'],
};
/** Force-path ranks that imply the core flying (a reading: Knights and Lords fly their own fighters). */
export const RANK_TACTICS: Readonly<Record<string, readonly string[]>> = { knight: ['flightSchool'], master: ['flightSchool'], lord: ['flightSchool'], darth: ['flightSchool'] };

/** NPC pilots and commanders by crew kind (shipBattles.config GENERIC_CREW kinds; invented). */
export const NPC_TACTICS: Readonly<Record<string, readonly string[]>> = {
  navy: ['flightSchool', 'officerAcademy'],
  elite: ['flightSchool', 'aceManoeuvres', 'officerAcademy'],
  militia: [],
  pirate: ['smugglerFlying'],
  droid: ['flightSchool'],
};

/** Seen used this many times (by either side, in battles the character fought), practice makes it known (invented). */
export const PRACTICE_TO_KNOW = 3;

/** Every id in the given sets, with the basics. */
export function tacticsOfSets(sets: readonly string[], basics: readonly string[] = PILOT_BASICS): string[] {
  return [...new Set([...basics, ...sets.flatMap((s) => TACTIC_SETS[s]?.ids ?? [])])];
}
