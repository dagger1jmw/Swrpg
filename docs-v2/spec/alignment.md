# Alignment and dark pressure (v1)

Reference scenarios (simulated):

| Scenario                                                   | Result                                              |
| ---------------------------------------------------------- | --------------------------------------------------- |
| Devout Jedi starting at 0, low pressure                    | about +59 after 12 years, about +89 after 30        |
| Anakin-like: +30, three war years at pressure 70           | -25 (edge of Shadowed); a willing turn then -40     |
| One bad year at pressure 45, starting at +40               | about +31                                           |
| Climbing back from -60 to neutral with steady practice     | about 11 years                                      |

## 1. State (code-owned; replaces V170's alignment, equilibrium and equilibrium XP)
  alignment Q: -100..+100 (settled nature)
  dark pressure D: 0..100 (current pull of the dark side)
  lastNoticedTier: the tier the character last noticed about themselves (what the UI shows)
  philosophy: livingForce | unifyingForce | jediOrthodox | jediSentinel | gray | warrior |
    sithPassion | sithInquisitor
  turned: false until the character willingly embraces the dark side
  Tiers (from continuous Q; half-open intervals, amended by D-65):
    Luminous 75 < Q <= 100 | Attuned 25 < Q <= 75 | Calm 0 < Q <= 25 |
    Balanced -25 <= Q <= 0 | Shadowed -50 <= Q < -25 | Corrupted -75 <= Q < -50 |
    Consumed -100 <= Q < -75
    (Same tiers as before for integer Q; every real Q now has exactly one tier.)
  Starting alignment (Q11, copied by D-63): by path (character-creation.md §2) plus a
    philosophy offset: livingForce +5, unifyingForce +3, jediOrthodox +3, jediSentinel 0,
    gray 0, warrior 0, sithPassion -5, sithInquisitor -5.

## 2. Daily drift (runs in onTimeAdvanced)
  Dark drift: if D > 20, Q -= 0.01 * (D - 20) / 10 per day
    (D 60 sustained: about -15 per year; D 90: about -26 per year)
  Light drift: if D <= 20 AND the day included practice (30+ minutes of meditation, Jedi
    service, or philosophy-appropriate devotion):
    Q += p * (1 - max(0, Q)/100) * r(Q) per day   (slows near +100; never speeds up below 0)
    p by philosophy: livingForce 0.025 | unifyingForce 0.02 | jediOrthodox 0.02 |
      jediSentinel 0.015 | gray: drift toward 0 at 0.01 | warrior 0 |
      sithPassion -0.025 | sithInquisitor -0.02 (Sith teachings pull dark even when calm)
  r(Q) = redemption multiplier, linear between: Q >= -25: 1.0 | -50: 0.6 | -75: 0.3;
    Q < -75 (Consumed): 0, so normal play cannot raise Q (amended by D-65 to match the
    half-open Consumed tier and section 7)
  Once turned: dark drift x2.

## 3. Dark pressure sources (all from engine events)
  Anger channeling: +0.5 per effective hour (progression spec sec 17)
  Force meter past 1.0 while channeling: +2 per load point (health spec sec 2)
  Dark-tagged Force ability: +1 per use * effort
  moralChoice dark, weight w (1-3): D += 5w and Q -= 2w immediately
  emotionalEvent anger, fear, hatred or despair, intensity i (1-3): D += 3i
  Unresolved grief: D cannot fall below 10 * intensity while grief is active. Grief is a
    lingering condition (progression-numbers §17): the floor holds even while anger, calm or
    any other state of mind is active. The floor is derived from progression's grief via a
    selector, not stored in this slice (amended by D-46).
  Sustained war or captivity: +0.2 per day

  Breaking point (Q45, copied by D-63): when D reaches 90, the engine sets the flag
    breakingPoint (flag-registry.md §4) for the AI to build a story scene around. There is
    no mechanical discharge; nothing resets automatically.

## 4. Dark pressure relief
  Base decay: -0.5 per day (halved while D > 50: the pull holds on)
  Meditation: -1 per hour, max -3 per day; doubled while centered
  Time with a trusted master or close friend (relationship strong bond): -0.5 per day
  moralChoice light, weight w: D -= 3w and Q += 1w * r(Q) (light choices count less than
    dark ones; redemption is slower)

## 5. Willing turn
  A moralChoice dark with weight 3 AND an explicit player decision to embrace the dark side
  (a confirmation the UI asks for, never inferred by the AI): turned = true, Q -= 15,
  philosophy may change to a Sith philosophy. No hidden drift after this; the player
  sees their real tier.

## 6. Noticing your own fall (gradual and hard to see)
  The UI shows lastNoticedTier, not the live tier.
  Each 30 days, chance to notice the real tier =
    clamp(3% * |Q change over the last 90 days| + Meditation / 400, 0, 0.9)
  A master or close companion with Force Sense S also checks monthly:
    clamp(3% * |Q change over 90 days| + S / 300, 0, 0.9); success opens a story thread
    ("Master Vell senses something has changed in you").
  Noticing updates lastNoticedTier and is narrated. The debug console always shows live values.

## 7. Redemption past Consumed
  Q below -75 can only rise through a redemptive act: a moralChoice light with weight 3
  that also meets at least one of:
    sacrifice of something vital (life, power, freedom) for another
    an act for someone with a strong-bond relationship, against the character's dark interest
    a Force vision or confrontation marked as a turning point by the engine-or-player flag
      redemptionTurningPoint (flag-registry.md §2; the AI cannot set it, amended by D-33)
  Effect: Q += 30 (to at least -45), D halved, turned = false. Code validates the
  conditions; the AI can only propose the moralChoice. At most once per in-game year.

## 8. Effects of alignment
  XP multipliers (inside the 2.8 cap, on top of state of mind):
    light-side abilities: Shadowed x0.9 | Corrupted x0.8 | Consumed x0.6
    dark-tagged abilities: Shadowed x1.1 | Corrupted x1.2 | Consumed x1.3
  Sensing alignment: another Force user rolls d20 + Force Sense/10 vs DC 10 + |Q|/10.
  Physical signs at Corrupted and Consumed (eyes, pallor), narrated by the AI when visible.
  Both can be hidden with specific abilities (names and prerequisites from the lore doc,
    e.g. Force concealment for the presence and an illusion or glamour ability for the body;
    flag anything the lore does not support):
    Passive concealment (always on, no Force load): adds concealment level / 20 to the DC.
    Active concealment (Force load 0.05 per minute): the observer instead contests
      d20 + Force Sense/10 vs d20 + concealment level/10 + 5.
    Hiding physical signs (Force load 0.03 per minute while seen): signs stay hidden while
      the hiding ability's level >= 20 + |Q|/2.
    Stress can break both: in combat, under anger, or with the Force meter above 0.8, roll
      d20 + the ability level/10 vs DC 15 each scene; on failure, the concealment slips.
  Combat rolls are not affected directly; anger and other states of mind are (rolls spec sec 5).

## 9. Required tests
 1. The scenario table above reproduces within +/-3 points.
 2. Q never rises while Q < -75 except through a validated redemptive act.
 3. Light choices move Q less than equal-weight dark choices, at every Q.
 4. The UI tier stays at lastNoticedTier until a notice roll succeeds (unless turned).
 5. A willing turn requires the explicit player confirmation; the AI cannot trigger it.
 6. Grief keeps D at or above its floor until the grief state ends.
 7. All alignment changes come from engine events; the AI never sets Q or D.
 8. Concealment: passive raises the sensing DC; active switches to a contest and costs Force
    load; hidden physical signs show when the ability level is below 20 + |Q|/2 or a stress
    roll fails.
 9. Tier boundaries: Q 25.5 is Attuned, Q 25 is Calm, Q -25 is Balanced, Q -25.01 is
    Shadowed, Q -75.5 is Consumed (half-open intervals, D-65).
10. The grief floor holds while anger or centered is active (D-46).
11. D reaching 90 sets breakingPoint and changes nothing else (Q45).
