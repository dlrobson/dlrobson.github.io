/**
 * Canada Pension Plan retirement pension, estimated from annual earnings.
 *
 * The pension is three components, each over its own window and divisor:
 *
 *   base               25%    of career-average covered earnings, after drop-outs
 *   first additional   8.33%  of covered earnings from 2019 on, over 480 months
 *   second additional  33.33% of earnings between the two ceilings from 2024 on,
 *                             over 480 months
 *
 * The 480-month divisors are fixed: a contributor with fewer than 40 years of
 * enhanced contributions is diluted in proportion, and the general drop-out
 * does not apply to the enhanced components.
 *
 * The first additional rate phases in from 2019 to 2022, so a 2019 contribution
 * buys a quarter of a full year's credit rather than all of it.
 *
 * All amounts are nominal. Callers that want today's dollars should project the
 * ceilings and deflate the result with the same inflation rate.
 */

import type { Ceilings } from './params'

/**
 * Earnings by calendar year. A year with no entry had no earnings: a gap in an
 * earning period, or a year outside the working span.
 */
export interface Earnings {
  readonly [year: number]: number | undefined
}

/** One age-bounded salary. Periods in one set must not overlap. */
export interface EarningPeriod {
  readonly fromAge: number
  readonly toAge: number
  readonly salary: number
}

interface Month {
  readonly year: number
  readonly band: number
  readonly band2: number
}

export interface Estimate {
  readonly claimAge: number
  readonly claimYear: number
  readonly ympeAverage: number
  readonly monthsInPeriod: number
  readonly monthsDroppedChildRearing: number
  readonly monthsDroppedAfter65: number
  readonly monthsDroppedGeneral: number
  readonly monthsCounted: number
  readonly earningMonths: number
  readonly enhancedMonths: number
  readonly base: number
  readonly firstAdditional: number
  readonly secondAdditional: number
  readonly factor: number
  readonly monthly: number
  readonly annual: number
  monthlyIn(year: number, cpi: number): number
  annualIn(year: number, cpi: number): number
}

export const BASE_RATE = 0.25
export const FIRST_ADDITIONAL_RATE = 0.0833
export const SECOND_ADDITIONAL_RATE = 0.3333

export const ENHANCED_DIVISOR_MONTHS = 480
export const GENERAL_DROPOUT = 0.17
export const MIN_CONTRIBUTORY_MONTHS = 120
export const YMPE_AVERAGE_YEARS = 5

export const EARLY_REDUCTION_PER_MONTH = 0.006
export const LATE_INCREASE_PER_MONTH = 0.007
export const MIN_CLAIM_AGE = 60
export const MAX_CLAIM_AGE = 70

export const FIRST_ADDITIONAL_START = 2019
export const SECOND_ADDITIONAL_START = 2024
export const YAMPE_RATIO = 1.14

export const DEFAULT_CPI = 0.025
export const DEFAULT_WAGE_GROWTH = 0.03

/**
 * Share of a full first-additional credit earned by contributing in a given
 * year. The enhancement raised the contribution rate in four annual steps, and
 * the benefit earned is proportional to the rate paid.
 */
const FIRST_ADDITIONAL_RAMP: Readonly<Record<number, number>> = {
  2019: 0.25,
  2020: 0.5,
  2021: 0.75,
}

export function firstAdditionalShare(year: number): number {
  if (year < FIRST_ADDITIONAL_START) return 0
  return FIRST_ADDITIONAL_RAMP[year] ?? 1
}

export function deflate(
  amount: number,
  fromYear: number,
  toYear: number,
  cpi: number,
): number {
  return amount / (1 + cpi) ** (fromYear - toYear)
}

function round100(value: number): number {
  return Math.floor(value / 100 + 0.5) * 100
}

/** Extend both ceilings forward from the last published year. */
export function project(
  ceilings: Ceilings,
  through: number,
  growth: number,
): Ceilings {
  const last = Math.max(...Object.keys(ceilings.ympe).map(Number))
  if (through <= last) return ceilings

  const ympe: Record<number, number> = { ...ceilings.ympe }
  const yampe: Record<number, number> = { ...ceilings.yampe }
  for (let year = last + 1; year <= through; year++) {
    ympe[year] = round100(ympe[year - 1] * (1 + growth))
    yampe[year] = round100(ympe[year] * YAMPE_RATIO)
  }
  return { ympe, yampe }
}

export function ympeAverage(
  ympe: Readonly<Record<number, number>>,
  claimYear: number,
): number {
  let total = 0
  for (
    let year = claimYear - YMPE_AVERAGE_YEARS + 1;
    year <= claimYear;
    year++
  ) {
    const value = ympe[year]
    if (value === undefined) throw new Error(`no YMPE for ${year}`)
    total += value
  }
  return total / YMPE_AVERAGE_YEARS
}

export function adjustmentFactor(claimAge: number): number {
  if (claimAge < MIN_CLAIM_AGE || claimAge > MAX_CLAIM_AGE) {
    throw new Error(
      `claim age must be ${MIN_CLAIM_AGE}-${MAX_CLAIM_AGE}, got ${claimAge}`,
    )
  }
  const months = (claimAge - 65) * 12
  if (months < 0) return 1 + EARLY_REDUCTION_PER_MONTH * months
  return 1 + LATE_INCREASE_PER_MONTH * months
}

function dropLowest(months: Month[], count: number): Month[] {
  const indices = months.map((_, index) => index)
  indices.sort((a, b) => months[a].band - months[b].band || a - b)
  const dropped = new Set(indices.slice(0, count))
  return months.filter((_, index) => !dropped.has(index))
}

/**
 * Remove low-earning months inside a child-rearing window. Only months below
 * the contributor's own average count, and the 120-month floor still applies.
 */
function dropChildRearing(
  months: Month[],
  windows: readonly (readonly [number, number])[],
  average: number,
): { months: Month[]; dropped: number } {
  const eligible = months
    .map((month, index) => ({ month, index }))
    .filter(
      ({ month }) =>
        month.band < average &&
        windows.some(
          ([firstYear, lastYear]) =>
            month.year >= firstYear && month.year <= lastYear,
        ),
    )
    .sort((a, b) => a.month.band - b.month.band || a.index - b.index)

  const room = Math.max(0, months.length - MIN_CONTRIBUTORY_MONTHS)
  const dropped = new Set(eligible.slice(0, room).map(({ index }) => index))
  return {
    months: months.filter((_, index) => !dropped.has(index)),
    dropped: dropped.size,
  }
}

export function estimate(
  birthYear: number,
  claimAge: number,
  earnings: Earnings,
  ceilings: Ceilings,
  childRearing?: readonly (readonly [number, number])[],
): Estimate {
  const claimYear = birthYear + claimAge
  const startYear = Math.max(1966, birthYear + 18)
  const endYear = Math.min(claimYear - 1, birthYear + 69)
  if (endYear < startYear) {
    throw new Error(
      `no contributory period for birth year ${birthYear} and claim age ${claimAge}`,
    )
  }

  const averageYmpe = ympeAverage(ceilings.ympe, claimYear)
  const ceiling = averageYmpe / 12

  let months: Month[] = []
  for (let year = startYear; year <= endYear; year++) {
    const ympe = ceilings.ympe[year]
    if (ympe === undefined) throw new Error(`no YMPE for ${year}`)
    const yampe = ceilings.yampe[year]
    if (yampe === undefined && year >= SECOND_ADDITIONAL_START) {
      throw new Error(`no YAMPE for ${year}`)
    }

    // Normalise against the year's ceiling first, so a year exactly at the
    // ceiling lands on it rather than a rounding error either side.
    const earned = Math.max(0, earnings[year] ?? 0) / ympe
    const top = yampe === undefined ? 1 : yampe / ympe
    const band = Math.min(earned, 1) * ceiling
    const band2 = Math.max(0, Math.min(earned, top) - 1) * ceiling
    for (let month = 0; month < 12; month++) months.push({ year, band, band2 })
  }

  const allMonths = months
  const monthsInPeriod = allMonths.length

  let droppedChildRearing = 0
  if (childRearing && childRearing.length > 0) {
    const mean =
      months.reduce((total, month) => total + month.band, 0) / months.length
    const result = dropChildRearing(months, childRearing, mean)
    months = result.months
    droppedChildRearing = result.dropped
  }

  // Months after the 65th birthday come out before the general drop-out, so
  // deferral does not dilute the average it is about to multiply. Only the
  // lowest of those months go, never months from before 65. The split counts
  // the months that survived the child-rearing drop, which has already
  // shortened the period.
  const firstAfter65 =
    months.filter((month) => month.year < birthYear + 65).length + 1
  let droppedAfter65 = 0
  if (firstAfter65 < months.length && months.length > MIN_CONTRIBUTORY_MONTHS) {
    const before = months.slice(0, firstAfter65)
    const after = months.slice(firstAfter65)
    const wanted = Math.min(
      after.length,
      months.length - MIN_CONTRIBUTORY_MONTHS,
    )
    const kept = dropLowest(after, wanted)
    droppedAfter65 = after.length - kept.length
    months = before.concat(kept)
  }

  let droppedGeneral = 0
  if (months.length > MIN_CONTRIBUTORY_MONTHS) {
    const wanted = Math.ceil(GENERAL_DROPOUT * months.length)
    droppedGeneral = Math.min(wanted, months.length - MIN_CONTRIBUTORY_MONTHS)
    months = dropLowest(months, droppedGeneral)
  }

  const counted = months.length
  const base =
    (BASE_RATE * months.reduce((total, month) => total + month.band, 0)) /
    Math.max(counted, MIN_CONTRIBUTORY_MONTHS)

  // The ramp only scales the first additional credit. The month still counts
  // towards the 480-month divisor.
  const creditedFirst = allMonths
    .filter((month) => month.year >= FIRST_ADDITIONAL_START)
    .map((month) => month.band * firstAdditionalShare(month.year))
  const topFirst =
    creditedFirst.length > ENHANCED_DIVISOR_MONTHS
      ? [...creditedFirst]
          .sort((a, b) => b - a)
          .slice(0, ENHANCED_DIVISOR_MONTHS)
      : creditedFirst
  const firstAdditional =
    (FIRST_ADDITIONAL_RATE *
      topFirst.reduce((total, value) => total + value, 0)) /
    ENHANCED_DIVISOR_MONTHS

  const secondBand = allMonths
    .filter((month) => month.year >= SECOND_ADDITIONAL_START)
    .map((month) => month.band2)
  const topSecond =
    secondBand.length > ENHANCED_DIVISOR_MONTHS
      ? [...secondBand].sort((a, b) => b - a).slice(0, ENHANCED_DIVISOR_MONTHS)
      : secondBand
  const secondAdditional =
    (SECOND_ADDITIONAL_RATE *
      topSecond.reduce((total, value) => total + value, 0)) /
    ENHANCED_DIVISOR_MONTHS

  const enhancedMonths = allMonths.filter(
    (month) => month.year >= FIRST_ADDITIONAL_START && month.band > 0,
  ).length
  const earningMonths = allMonths.filter((month) => month.band > 0).length

  const factor = adjustmentFactor(claimAge)
  const monthly = (base + firstAdditional + secondAdditional) * factor

  return {
    claimAge,
    claimYear,
    ympeAverage: averageYmpe,
    monthsInPeriod,
    monthsDroppedChildRearing: droppedChildRearing,
    monthsDroppedAfter65: droppedAfter65,
    monthsDroppedGeneral: droppedGeneral,
    monthsCounted: counted,
    earningMonths,
    enhancedMonths,
    base,
    firstAdditional,
    secondAdditional,
    factor,
    monthly,
    annual: monthly * 12,
    monthlyIn: (year, cpi) => deflate(monthly, claimYear, year, cpi),
    annualIn: (year, cpi) => deflate(monthly, claimYear, year, cpi) * 12,
  }
}

/**
 * Earnings for one or more salary periods: each amount is given in `baseYear`
 * dollars and grows at `growth` for every other year, earlier or later. The
 * calculator passes the wage-growth assumption, so a salary keeps its place
 * against the earnings ceilings, which grow at the same rate.
 * Ages are inclusive, and a gap between periods is a year with no earnings.
 * The periods must not overlap: a year covered twice takes the salary of the
 * period later in the list, so `readInputs` rejects an overlapping set first.
 */
export function earningPeriodsEarnings(
  periods: readonly EarningPeriod[],
  birthYear: number,
  baseYear: number,
  growth: number,
): Earnings {
  const earnings: Record<number, number> = {}
  for (const period of periods) {
    for (
      let year = birthYear + period.fromAge;
      year <= birthYear + period.toAge;
      year++
    ) {
      earnings[year] = period.salary * (1 + growth) ** (year - baseYear)
    }
  }
  return earnings
}

export interface ChildRearingPeriod {
  readonly from: number
  readonly to: number
}

export const CHILD_REARING_DEFAULT_START_AGE = 30
export const CHILD_REARING_DEFAULT_YEARS = 5

/** A new period starts at age 30 and runs five calendar years. */
export function defaultChildRearingPeriod(
  birthYear: number,
): ChildRearingPeriod {
  const from = Math.floor(birthYear) + CHILD_REARING_DEFAULT_START_AGE
  return { from, to: from + CHILD_REARING_DEFAULT_YEARS - 1 }
}

/** The valid child-rearing windows, dropping reversed or non-finite periods. */
export function childRearingWindows(
  periods: readonly ChildRearingPeriod[],
): readonly (readonly [number, number])[] {
  return periods
    .filter(
      (period) =>
        Number.isFinite(period.from) &&
        Number.isFinite(period.to) &&
        period.to >= period.from,
    )
    .map((period) => [Math.floor(period.from), Math.floor(period.to)] as const)
}

/** Zero out earnings for the years covered by each child-rearing period. */
export function applyChildRearing(
  earnings: Earnings,
  periods: readonly ChildRearingPeriod[],
): Earnings {
  const result: Record<number, number | undefined> = { ...earnings }
  for (const [firstYear, lastYear] of childRearingWindows(periods)) {
    for (let year = firstYear; year <= lastYear; year++) result[year] = 0
  }
  return result
}
