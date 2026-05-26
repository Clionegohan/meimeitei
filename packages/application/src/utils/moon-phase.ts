// Synodic month (new moon to new moon) in days.
const SYNODIC_DAYS = 29.5305882

// Known new moon: 2000-01-06 18:14 UTC. Reference epoch used by many
// almanac-grade approximations. Accurate to ~a few hours over decades —
// good enough for a decorative moon glyph.
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14)

// Returns the moon's phase as a fraction in [0, 1):
//   0     = new moon (dark)
//   0.25  = first quarter
//   0.5   = full moon
//   0.75  = last quarter
//   1     = back to new moon (never reached — the range is half-open)
export const getMoonPhase = (date: Date): number => {
  const elapsedDays = (date.getTime() - KNOWN_NEW_MOON_UTC) / (1000 * 60 * 60 * 24)
  const cycles = elapsedDays / SYNODIC_DAYS
  const fractional = cycles - Math.floor(cycles)
  return fractional < 0 ? fractional + 1 : fractional
}
