// Lightsaber-form rules shared by play, creation and the closed form (D-119, D-121). Pure.
import { FORM_TRANSFER_SHARE, K, NIMAN_TRANSFER_FORMS } from '../data/progression.config';
import { FORM_IDS } from '../data/skills';
import { levelExact, xpForLevel } from './curve';

/**
 * The XP a form's fundamentals transfer is measured against (before the 0.75 share): the highest
 * form's XP, except Niman (Form VI), which uses the AVERAGE of the Form I, III, IV and V levels
 * (Form V = the higher of Shien and Djem So; an untrained form counts as 0), D-121.
 */
export function transferBaseXp(form: string, xpOf: (form: string) => number, k = K): number {
  if (form === 'niman') {
    const levels = NIMAN_TRANSFER_FORMS.map((group) => Math.max(...group.map((f) => levelExact(xpOf(f), k))));
    return xpForLevel(levels.reduce((a, b) => a + b, 0) / levels.length, k);
  }
  return Math.max(0, ...FORM_IDS.map(xpOf));
}

/** The transfer XP a form gets on its first session (never negative). */
export function transferXp(form: string, xpOf: (form: string) => number, share = FORM_TRANSFER_SHARE, k = K): number {
  return Math.max(0, share * transferBaseXp(form, xpOf, k) - xpOf(form));
}
