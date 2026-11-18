// Lightsaber form matchups and stamina (rolls.md §5; D-122; Jared, D-143). Built from the lore's form notes
// (Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md:176-202). A matchup is a net modifier (d20 points)
// added to the form user's total in the situations it names; rolls §5 bounds each at +/-1. Terrain rules
// (confined space: Ataru and Jar'Kai -1) are a separate circumstance and listed here as `confined` so the
// table stays the one place that knows forms. Every value is tunable.
import { FORM_IDS } from './skills';

export const MATCHUP_SITUATIONS = ['vsBlasters', 'saberDuel', 'severalOpponents', 'confined', 'openTerrain', 'zeroGravity', 'vsForm'] as const;
export type MatchupSituation = (typeof MATCHUP_SITUATIONS)[number];

export interface MatchupEntry {
  when: MatchupSituation;
  /** For `vsForm`: the opponent's form. */
  form?: string;
  value: number;
  why: string;
}

/** Every form has an entry (an empty list = 0 in every situation). */
export const FORM_MATCHUPS: Readonly<Record<string, readonly MatchupEntry[]>> = {
  shiiCho: [{ when: 'severalOpponents', value: 1, why: 'wide sweeping strikes designed for multiple opponents (lore :176)' }],
  makashi: [
    { when: 'saberDuel', value: 1, why: 'a direct counter to other lightsaber wielders (lore :178)' },
    { when: 'severalOpponents', value: -1, why: 'precision dueling form, poor against several opponents (rolls §5)' },
  ],
  soresu: [{ when: 'vsBlasters', value: 1, why: 'built to deflect blaster bolts (lore :180, rolls §5)' }],
  ataru: [{ when: 'confined', value: -1, why: 'impractical in confined areas (lore :182, rolls §5)' }],
  shien: [{ when: 'vsBlasters', value: 1, why: 'optimizes blaster deflection back at shooters (lore :184)' }],
  djemSo: [{ when: 'vsForm', form: 'soresu', value: 1, why: 'dominating power strikes against a defensive guard (lore :184; design default)' }],
  // D-122: Niman has no matchups in any situation.
  niman: [],
  // Form VII has an entry (Jared, D-143), 0 for now.
  juyo: [],
  vaapad: [],
  trakata: [],
  jarKai: [{ when: 'confined', value: -1, why: 'dual blades in confined space (rolls §5)' }],
  sokan: [{ when: 'openTerrain', value: 1, why: 'terrain exploitation and mobility (lore :196)' }],
  dunMoch: [],
  zeroG: [{ when: 'zeroGravity', value: 1, why: 'weightless-environment adaptation (lore :200)' }],
  saberstaff: [{ when: 'severalOpponents', value: 1, why: 'spinning defense and wide-area coverage (lore :202)' }],
};

/** Per-form exertion multiplier on the per-exchange physical load (Jared, D-143; tunable in the duel-length test). */
export const FORM_STAMINA: Readonly<Record<string, number>> = Object.fromEntries(
  FORM_IDS.map((f) => [f, ({ ataru: 1.25, soresu: 0.85, juyo: 1.15, vaapad: 1.15 } as Record<string, number>)[f] ?? 1.0]),
);

/** Jar'Kai needs Niman at this level (D-122) and dual blades (STUB_DUAL_BLADES until M8). */
export const JARKAI_NIMAN_MIN = 30;
/** Niman halves the combat-integration penalty for Force abilities used while fighting in it (D-122). */
export const NIMAN_CI_FACTOR = 0.5;
