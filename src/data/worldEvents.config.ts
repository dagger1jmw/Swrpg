// Weighted world events during montages and time skips (architecture §10 slot 8, training-routines §7;
// D-123, D-136). Once per jump day the world rolls: a significant event with SIGNIFICANT_CHANCE (Jared:
// 1/150, about 45% that a 90-day montage stops early), else a minor one with MINOR_CHANCE (1/12). The
// engine picks only the kind and the people or thread involved; the AI narrates what happened. Kinds,
// weights and conditions are design defaults. Order calendar events and the Legends timeline are
// scheduled facts, not rolls (M7, M8).

export const WORLD_EVENT_CHANCE = { significant: 1 / 150, minor: 1 / 12 } as const;

export type WorldEventNeed = 'npc' | 'thread';

export interface WorldEventKind {
  id: string;
  significant: boolean;
  weight: number;
  /** Paths it can happen to (absent = any). */
  paths?: readonly string[];
  /** Ranks it can happen to (absent = any). */
  ranks?: readonly string[];
  /** Needs a known active NPC or an open thread to involve. */
  needs?: WorldEventNeed;
  /** Engine summary for the report and the AI ("{npc}" / "{thread}" filled in). */
  summary: string;
}

export const WORLD_EVENT_KINDS: readonly WorldEventKind[] = [
  // Minor: noted in the report and narrated as a highlight; the jump goes on.
  { id: 'message', significant: false, weight: 3, summary: 'A message arrives' },
  { id: 'rumor', significant: false, weight: 2, summary: 'Rumors reach the character' },
  { id: 'galaxyNews', significant: false, weight: 2, summary: 'News of the wider galaxy arrives' },
  { id: 'duty', significant: false, weight: 2, paths: ['jedi', 'sith'], summary: 'An assigned duty takes up a day' },
  { id: 'encounter', significant: false, weight: 3, needs: 'npc', summary: 'A brief encounter with {npc}' },
  { id: 'teacherRemark', significant: false, weight: 2, needs: 'npc', summary: '{npc} remarks on the training' },
  // Significant: the jump stops and the story zooms to a moment.
  { id: 'summons', significant: true, weight: 3, paths: ['jedi', 'sith'], summary: 'The character is summoned' },
  { id: 'missionOffer', significant: true, weight: 2, ranks: ['knight', 'master', 'lord', 'none'], summary: 'A mission is offered' },
  { id: 'visitor', significant: true, weight: 3, needs: 'npc', summary: '{npc} arrives with urgent news' },
  { id: 'trouble', significant: true, weight: 2, summary: 'Trouble breaks out nearby' },
  { id: 'threadTurn', significant: true, weight: 3, needs: 'thread', summary: 'The situation around "{thread}" changes' },
];

export const WORLD_LOG_MAX = 50;
