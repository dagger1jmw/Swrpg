// Who may learn a restricted lightsaber form (lore batch 10, D-370; lore: SW_Lightsaber_Forms_AllEras_Part1.md,
// Form VII; SW_Lightsaber_Forms_Catalog_Check_Part1.md A19-A26, D11-D13). Pure rules, no state access.
//
// Vaapad's gate is "a teacher OR records", replacing the old maceLiving / maceTrustEstablished flags:
// - It doesn't exist before Mace Windu and Sora Bulq create it in the late Republic. Before then "Vaapad" is only an
//   old name for Juyo (ruling 1).
// - Teacher: Windu with his personal permission; Bulq (unsanctioned, with a corruption risk on learning); or any
//   living Vaapad master (Billaba, Vos while alive, or a character who has mastered it).
// - Records: from the New Jedi Order onward, the recovered records (The Jedi Path, the Great Holocron), preserved into
//   the Legacy era.
// - Design gates kept: light side only, Juyo 61+.

import { NJO_FORM_RECORDS_YEAR } from '../../data/trainingRecords';

/** Design default: Windu and Bulq create Vaapad c. 40 BBY (Legends gives only "the late Republic"). */
export const VAAPAD_CREATED_YEAR = -40;
/** A "Vaapad master" teacher: Vaapad at Master tier. */
export const VAAPAD_MASTER_LEVEL = 61;
/** Design gate kept from v3: Juyo 61+ before Vaapad. */
export const VAAPAD_JUYO_MIN = 61;

export type VaapadTeacher =
  /** Mace Windu: teaches only with his personal permission. */
  | { kind: 'windu'; permission: boolean }
  /** Sora Bulq: teaches outside sanction; learning from him carries a corruption risk. */
  | { kind: 'bulq' }
  /** Any other living Vaapad master (Billaba, Vos, or a character who mastered it). */
  | { kind: 'master' };

export interface VaapadAccessInput {
  /** Calendar year: negative = BBY, positive = ABY. */
  year: number;
  teacher: VaapadTeacher | null;
  /** Access to the recovered Form VII records (the Jedi archives of the New Jedi Order or later). */
  records: boolean;
  /** Light side only (design gate). Until alignment is built, the caller passes a stand-in. */
  lightSide: boolean;
  juyoLevel: number;
}

export type VaapadAccess = { ok: true; via: 'teacher' | 'records'; corruptionRisk: boolean } | { ok: false; reason: string };

export function vaapadAccess(i: VaapadAccessInput): VaapadAccess {
  if (i.year < VAAPAD_CREATED_YEAR) return { ok: false, reason: 'Vaapad does not exist yet: before Windu and Bulq create it, "Vaapad" is an old name for Juyo' };
  if (!i.lightSide) return { ok: false, reason: 'Vaapad is light side only' };
  if (i.juyoLevel < VAAPAD_JUYO_MIN) return { ok: false, reason: `Vaapad needs Juyo ${VAAPAD_JUYO_MIN}` };
  const t = i.teacher;
  if (t && (t.kind === 'master' || t.kind === 'bulq' || (t.kind === 'windu' && t.permission))) return { ok: true, via: 'teacher', corruptionRisk: t.kind === 'bulq' };
  if (i.records && i.year >= NJO_FORM_RECORDS_YEAR) return { ok: true, via: 'records', corruptionRisk: false };
  if (t?.kind === 'windu') return { ok: false, reason: 'Windu teaches Vaapad only with his personal permission' };
  return { ok: false, reason: 'Vaapad needs a teacher (Windu with his permission, Bulq, or a Vaapad master) or, from the New Jedi Order on, the recovered records' };
}

/**
 * Forms of Jedi origin that Sith and Dark Jedi also used (ruling 15; Catalog Check A44): Soresu (Bane, Zannah,
 * Vader), Ataru (Maul, Scourge, Kas'im), Niman (Exar Kun, Sidious, Krayt), Sokan (Maul at Theed). No path is barred.
 */
export const JEDI_ORIGIN_ALSO_SITH: readonly string[] = ['soresu', 'ataru', 'niman', 'sokan'];
