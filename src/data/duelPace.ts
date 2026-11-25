// How fast a lightsaber duel reads, by the weaker duelist's level (Jared, 2026-11-25; D-496). For the narrator only: nothing
// here changes an exchange. The levels and counts are invented, apart from the apex (ten in a couple of seconds, Jared).
export const DUEL_PACE: readonly { from: number; text: string }[] = [
  { from: 95, text: 'a blur of light: each exchange is ten or more strikes and parries in a couple of seconds, faster than an ordinary eye follows' },
  { from: 80, text: 'very fast: each exchange is six to eight strikes and parries in two or three seconds' },
  { from: 60, text: 'fast: each exchange is four or five strikes and parries in a few seconds' },
  { from: 40, text: 'quick and practised: each exchange is three or four blows' },
  { from: -Infinity, text: 'each exchange is two or three blows' },
];
