// Instruction factor (progression-numbers §15, §19): a teacher's level in THAT skill, a partner, or
// solo. Pure.
import { HOLOCRON, TEACHER, TRAINING_MODE } from '../data/progression.config';

export interface InstructionInput {
  studentLevel: number;
  teacher?: { level: number; aptitude?: number; bond?: boolean; holocron?: boolean; physical?: boolean } | undefined;
  partner?: { level: number; bond?: boolean } | undefined;
}

export interface InstructionResult {
  factor: number;
  mode: 'teacher' | 'holocron' | 'partner' | 'solo';
  note?: string;
}

/** Teacher factor: 1 + 0.005 * diff for diff -10..+30 (x0.95..x1.15); below -10 no teaching benefit. */
export function teacherFactor(teacherLevel: number, studentLevel: number): number | null {
  const diff = teacherLevel - studentLevel;
  if (diff < TEACHER.minDiff) return null;
  return Math.min(TEACHER.maxFactor, 1 + TEACHER.perLevel * Math.min(TEACHER.maxDiff, diff));
}

function modeFactor(studentLevel: number, partner: InstructionInput['partner']): InstructionResult {
  if (!partner) return { factor: TRAINING_MODE.solo, mode: 'solo' };
  const weaker = studentLevel - partner.level > TRAINING_MODE.partnerRange;
  return { factor: (weaker ? TRAINING_MODE.weakPartner : TRAINING_MODE.partner) + (partner.bond ? TEACHER.bond : 0), mode: 'partner' };
}

export function instructionFactor(input: InstructionInput): InstructionResult {
  const t = input.teacher;
  if (t) {
    const base = teacherFactor(t.level, input.studentLevel);
    if (base !== null) {
      const eff = t.holocron ? (t.physical ? HOLOCRON.physical : HOLOCRON.other) : 1;
      const aptitude = Math.max(-TEACHER.aptitude, Math.min(TEACHER.aptitude, t.aptitude ?? 0));
      return { factor: base * eff + aptitude + (t.bond ? TEACHER.bond : 0), mode: t.holocron ? 'holocron' : 'teacher' };
    }
    const fallback = modeFactor(input.studentLevel, input.partner);
    return { ...fallback, note: 'teacher is more than 10 levels behind in this skill: no teaching benefit' };
  }
  return modeFactor(input.studentLevel, input.partner);
}
