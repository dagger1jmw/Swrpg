// Flag registry (spec/flag-registry.md, D-33; built in M5). Flags are the only boolean story state. Each flag
// lists its allowed sources; flagSet from any other source is rejected and logged. A `param` flag is written
// `<id>:<param>` (e.g. heroicAct:fight-3). No flag in the rank-gating or engine sections allows `ai`.
export type FlagSection = 'rank' | 'engine' | 'background' | 'story';
/** The event sources a flag may allow (a subset of state/types EventSource; data imports nothing outside data). */
export type FlagSource = 'ai' | 'engine' | 'player';

export interface FlagDef {
  id: string;
  /** True when the flag takes a parameter: `<id>:<param>`. */
  param?: boolean;
  sources: readonly FlagSource[];
  section: FlagSection;
  /** Who reads it (flag-registry tables). */
  readBy: string;
}

export const FLAGS: readonly FlagDef[] = [
  // §2 Rank-gating flags (engine or player only)
  { id: 'masterApproval', sources: ['engine'], section: 'rank', readBy: 'Knight Trials eligibility (ranks.md §1)' },
  { id: 'heroicAct', param: true, sources: ['engine'], section: 'rank', readBy: 'Wartime Courage and Flesh credit; Council bypass' },
  { id: 'trialPassed', param: true, sources: ['engine'], section: 'rank', readBy: 'Knight eligibility, retakes' },
  { id: 'trialFailed', param: true, sources: ['engine'], section: 'rank', readBy: 'retakes, third-failure choice' },
  { id: 'initiateTrialsPassed', sources: ['engine'], section: 'rank', readBy: 'Padawan selection window' },
  { id: 'deed', param: true, sources: ['engine'], section: 'rank', readBy: 'standing S (ranks.md §1)' },
  { id: 'redemptionTurningPoint', sources: ['engine', 'player'], section: 'rank', readBy: 'redemption past Consumed (alignment.md §7)' },
  { id: 'turnConfirmed', sources: ['player'], section: 'rank', readBy: 'alignment' },
  { id: 'councilBypassGranted', sources: ['engine'], section: 'rank', readBy: 'Knight promotion without trials' },
  // §4 Other engine flags
  { id: 'breakingPoint', sources: ['engine'], section: 'engine', readBy: 'context (Q45, alignment.md §6a)' },
  { id: 'forbiddenAccess', param: true, sources: ['engine'], section: 'engine', readBy: 'learning forbidden abilities (Q27)' },
  { id: 'staleness', sources: ['engine'], section: 'engine', readBy: 'choices must include a forward jump' },
  { id: 'settlingIn', sources: ['engine'], section: 'engine', readBy: 'pacing' },
  // §5 Player background flags (set at creation)
  { id: 'homeworld', param: true, sources: ['player'], section: 'background', readBy: 'backstory facts, context' },
  { id: 'warYears', param: true, sources: ['player'], section: 'background', readBy: 'character creation E/CI, closed form' },
  { id: 'family', param: true, sources: ['player'], section: 'background', readBy: 'backstory facts' },
  // §6 Story flags (ai allowed; no mechanical effect)
  { id: 'metCouncil', sources: ['ai', 'engine'], section: 'story', readBy: 'story content' },
  { id: 'visitedArchives', sources: ['ai', 'engine'], section: 'story', readBy: 'story content' },
  { id: 'knowsSecret', param: true, sources: ['ai', 'engine'], section: 'story', readBy: 'story content' },
];

export const FLAG_BY_ID: ReadonlyMap<string, FlagDef> = new Map(FLAGS.map((f) => [f.id, f]));

/** The registered definition of a flag string (`id` or `id:param`), or null. */
export function flagDef(flag: string): FlagDef | null {
  const i = flag.indexOf(':');
  const id = i < 0 ? flag : flag.slice(0, i);
  const def = FLAG_BY_ID.get(id);
  if (!def) return null;
  if (Boolean(def.param) !== i >= 0) return null;
  if (def.param && flag.slice(i + 1).length === 0) return null;
  return def;
}
