/**
 * Old Age Security pension, estimated from residence and the age it starts.
 *
 * The amount is the full monthly pension at the current quarterly maximum,
 * scaled by years of residence in Canada after 18 and by the deferral
 * increase. The 10% increase at 75, the recovery tax, the Guaranteed Income
 * Supplement, and eligibility rules are out of scope.
 *
 * All amounts are in today's dollars.
 */

/** Q4 2026 maximum monthly pension for ages 65 to 74. */
export const OAS_MAX_MONTHLY = 762.5

/** Residence in Canada after 18 that earns the full pension. */
export const OAS_FULL_RESIDENCE_YEARS = 40

export const OAS_MIN_START_AGE = 65
export const OAS_MAX_START_AGE = 70

/** Simple increase for each month the pension is deferred after 65. */
export const OAS_DEFERRAL_PER_MONTH = 0.006

export const OAS_START_AGES = Array.from(
  { length: OAS_MAX_START_AGE - OAS_MIN_START_AGE + 1 },
  (_, index) => OAS_MIN_START_AGE + index,
)

/**
 * Share of the full pension earned by a residence period. A partial year is
 * rounded down, matching the Act's whole-year calculation.
 */
export function residenceShare(years: number): number {
  if (!Number.isFinite(years)) return 0
  const whole = Math.floor(
    Math.min(OAS_FULL_RESIDENCE_YEARS, Math.max(0, years)),
  )
  return whole / OAS_FULL_RESIDENCE_YEARS
}

/**
 * Multiplier for the start age: 1 at 65, rising by 0.6% for each month the
 * pension is deferred, and 1.36 at 70. A start age that is not a number pays
 * nothing, the way an unusable residence count does.
 */
export function deferralFactor(startAge: number): number {
  if (!Number.isFinite(startAge)) return 0
  const months = Math.round(
    Math.min(
      (OAS_MAX_START_AGE - OAS_MIN_START_AGE) * 12,
      Math.max(0, (startAge - OAS_MIN_START_AGE) * 12),
    ),
  )
  return 1 + OAS_DEFERRAL_PER_MONTH * months
}

/**
 * Monthly pension at a start age, in today's dollars. Eligibility is not
 * checked, so the full amount is scaled by residence alone; residence under a
 * whole year earns nothing, because the partial year is floored away.
 */
export function oasMonthly(years: number, startAge: number): number {
  return OAS_MAX_MONTHLY * residenceShare(years) * deferralFactor(startAge)
}
