// The M6 precognition trial switch (harness only; docs-v2/testing/precog-m6-trial.md). Unset or "off", the game's M5
// rule runs. Otherwise PRECOG_M6 is a comma list of key=value overrides on src/engine/precogTrial.ts PRECOG_TRIAL, e.g.
// "base=7.5" or "base=10,comfort0=0.6,rate0=0.03": base (upkeep base draw per exchange), comfort0 / comfort100 (comfort
// line share at Conditioning 0 / 100), rate0 / rate100 (usual rate share), pain (diagnostic scale on the pain focus strain). "on" alone runs the defaults (base 5, the
// catalog's Complex sustained cost) with D-282's pain once per new wound (smod, ssev, scrit set the moderate, severe and
// critical-or-mortal spikes); wound=0 reproduces trial 1's per-exchange pain. Imported for its side effect by every harness that runs duels, so every worker of a
// parallel run reads the same environment.
import { PRECOG_TRIAL } from '../../src/engine/precogTrial';

const KEYS: Readonly<Record<string, keyof typeof PRECOG_TRIAL>> = { base: 'upkeepBase', comfort0: 'comfortAt0', comfort100: 'comfortAt100', rate0: 'rateAt0', rate100: 'rateAt100', pain: 'painScale', wound: 'painPerWound' };
/** Trial 2 spike keys (wound=1 switches pain to once per new wound): smod moderate, ssev severe, scrit critical and mortal. */
const SPIKES: Readonly<Record<string, readonly string[]>> = { smod: ['moderate'], ssev: ['severe'], scrit: ['critical', 'mortal'] };

/** Potential by lifetime profile (reserve spec §11 counts): Anakin and Luke 27,700; Obi-Wan a strong Master 13,000. */
export const PROFILE_COUNTS: Readonly<Record<string, number>> = { anakin: 27_700, luke: 27_700, obiwan: 13_000, average: 10_000 };

export function applyPrecogTrial(spec: string | undefined): string {
  const s = (spec ?? '').trim();
  if (!s || s === 'off') {
    PRECOG_TRIAL.enabled = false;
    return 'off';
  }
  PRECOG_TRIAL.enabled = true;
  for (const part of s.split(',').map((x) => x.trim()).filter((x) => x && x !== 'on')) {
    const [k, v] = part.split('=');
    const key = KEYS[k ?? ''];
    const spike = SPIKES[k ?? ''];
    if ((!key && !spike) || v === undefined || !Number.isFinite(Number(v))) throw new Error(`PRECOG_M6: bad part "${part}"`);
    if (spike) for (const sev of spike) PRECOG_TRIAL.painSpike[sev] = Number(v);
    else (PRECOG_TRIAL as unknown as Record<string, number>)[key!] = Number(v);
  }
  return `precog-m6 base ${PRECOG_TRIAL.upkeepBase} comfort ${PRECOG_TRIAL.comfortAt0}-${PRECOG_TRIAL.comfortAt100} rate ${PRECOG_TRIAL.rateAt0}-${PRECOG_TRIAL.rateAt100}${PRECOG_TRIAL.painScale !== 1 ? ` pain x${PRECOG_TRIAL.painScale}` : ''}${PRECOG_TRIAL.painPerWound ? ` pain per wound ${PRECOG_TRIAL.painSpike['moderate']}/${PRECOG_TRIAL.painSpike['severe']}/${PRECOG_TRIAL.painSpike['critical']}` : ''}`;
}

/** Sets the lifetime player's ('pc') count from the profile seed ("anakin-s3" -> anakin). */
export function setPlayerCount(seed: string): void {
  PRECOG_TRIAL.counts['pc'] = PROFILE_COUNTS[seed.replace(/-.*$/, '')] ?? PRECOG_TRIAL.defaultCount;
}

export const PRECOG_LABEL = applyPrecogTrial(process.env['PRECOG_M6']);
