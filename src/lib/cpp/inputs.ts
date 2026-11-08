/**
 * Reading the calculator's form: the number behind each field, and what the
 * reader still has to fix before an estimate means anything.
 *
 * A cleared number input binds `null` rather than `undefined`, so every field
 * arrives as `unknown` and is parsed before anything reads it. The model falls
 * back to its own defaults whatever the parse produced; `problems` is what
 * decides whether the result is shown.
 */

import {
  MAX_CLAIM_AGE,
  MIN_CLAIM_AGE,
  type ChildRearingPeriod,
  type EarningPeriod,
} from './estimator'

export const MIN_BIRTH_YEAR = 1930
export const MAX_BIRTH_YEAR = 2010
export const MIN_WORK_AGE = 18
export const MAX_WORK_AGE = 70
export const MIN_CARE_YEAR = 1930
export const MAX_CARE_YEAR = 2100
export const MIN_RATE = -0.05
export const MAX_RATE = 0.15

export const PERIOD_PROBLEM = `Each child-rearing period needs a start and an end year from ${MIN_CARE_YEAR} to ${MAX_CARE_YEAR}, with the end on or after the start.`
export const EARNING_PERIOD_PROBLEM = `Each earning period needs a start and an end age from ${MIN_WORK_AGE} to ${MAX_WORK_AGE}, with the end on or after the start.`
export const EARNING_SALARY_PROBLEM =
  'Each earning period needs a salary of zero or more.'
export const EARNING_OVERLAP_PROBLEM =
  'Earning periods cannot overlap. Leave a gap for years without earnings.'
export const NO_EARNING_PERIOD_PROBLEM = 'Add at least one earning period.'

export interface RawEarningPeriod {
  readonly fromAge?: number | null
  readonly toAge?: number | null
  readonly salary?: number | null
}

export interface RawPeriod {
  readonly from?: number | null
  readonly to?: number | null
}

export interface RawInputs {
  readonly birthYear?: number | null
  readonly earningPeriods?: readonly RawEarningPeriod[] | null
  readonly claimAge?: number | null
  readonly inflationText?: string | null
  readonly wageGrowthText?: string | null
  readonly periods?: readonly RawPeriod[] | null
}

export interface Inputs {
  readonly birthYear?: number
  readonly earningPeriods: readonly EarningPeriod[]
  readonly earningProblems: readonly string[]
  readonly claimAge?: number
  readonly inflation?: number
  readonly wageGrowth?: number
  readonly carePeriods: readonly ChildRearingPeriod[]
  readonly careProblem: boolean
  readonly problems: readonly string[]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function inRange(
  value: number | undefined,
  min: number,
  max: number,
): value is number {
  return value !== undefined && value >= min && value <= max
}

/** A whole number, or nothing when the field holds no usable number. */
export function parseWhole(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value)
    : undefined
}

/** A year inside a calendar range, used to vet values coming from storage. */
export function storedNumber(
  value: unknown,
  min: number,
  max: number,
): number | undefined {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
    ? value
    : undefined
}

/**
 * A calendar year as a whole number. Years are floored, not rounded, to match
 * the windows `childRearingWindows` builds from the same entry.
 */
export function optionalYear(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.floor(value)
    : undefined
}

/**
 * A percentage typed as text, as a fraction in `[MIN_RATE, MAX_RATE]`.
 * Undefined when the text is not a number or the number is outside the range.
 */
export function percentFraction(
  text: string | null | undefined,
): number | undefined {
  const cleaned = (text ?? '').replace('%', '').replace(',', '.').trim()
  if (cleaned === '') return undefined
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return undefined
  const fraction = value / 100
  return inRange(fraction, MIN_RATE, MAX_RATE) ? fraction : undefined
}

/** The text rewritten with two decimals, or left alone when it does not parse. */
export function formatPercent(text: string): string {
  const fraction = percentFraction(text)
  return fraction === undefined ? text : (fraction * 100).toFixed(2)
}

/** A period whose ages and salary have all been read as usable numbers. */
export function isEarningPeriod(row: {
  fromAge?: number
  toAge?: number
  salary?: number
}): row is EarningPeriod {
  return (
    inRange(row.fromAge, MIN_WORK_AGE, MAX_WORK_AGE) &&
    inRange(row.toAge, MIN_WORK_AGE, MAX_WORK_AGE) &&
    row.toAge >= row.fromAge &&
    row.salary !== undefined &&
    row.salary >= 0
  )
}

export function readInputs(raw: RawInputs): Inputs {
  const birthYear = parseWhole(raw.birthYear)
  const claimAge = parseWhole(raw.claimAge)
  const inflation = percentFraction(raw.inflationText)
  const wageGrowth = percentFraction(raw.wageGrowthText)

  const earningRows = (raw.earningPeriods ?? []).map((period) => ({
    fromAge: parseWhole(period?.fromAge),
    toAge: parseWhole(period?.toAge),
    salary: parseWhole(period?.salary),
  }))

  const earningProblems: string[] = []
  if (earningRows.length === 0) {
    earningProblems.push(NO_EARNING_PERIOD_PROBLEM)
  }
  if (
    earningRows.some(
      (row) =>
        !inRange(row.fromAge, MIN_WORK_AGE, MAX_WORK_AGE) ||
        !inRange(row.toAge, MIN_WORK_AGE, MAX_WORK_AGE) ||
        (row.fromAge !== undefined &&
          row.toAge !== undefined &&
          row.toAge < row.fromAge),
    )
  ) {
    earningProblems.push(EARNING_PERIOD_PROBLEM)
  }
  if (earningRows.some((row) => row.salary === undefined || row.salary < 0)) {
    earningProblems.push(EARNING_SALARY_PROBLEM)
  }

  const earningPeriods = earningRows.filter(isEarningPeriod)
  const sorted = [...earningPeriods].sort(
    (a, b) => a.fromAge - b.fromAge || a.toAge - b.toAge,
  )
  if (
    sorted.some(
      (period, index) => index > 0 && period.fromAge <= sorted[index - 1].toAge,
    )
  ) {
    earningProblems.push(EARNING_OVERLAP_PROBLEM)
  }

  const rows = (raw.periods ?? []).map((period) => ({
    from: optionalYear(period?.from),
    to: optionalYear(period?.to),
  }))
  const careProblem = rows.some(
    (row) =>
      !inRange(row.from, MIN_CARE_YEAR, MAX_CARE_YEAR) ||
      !inRange(row.to, MIN_CARE_YEAR, MAX_CARE_YEAR) ||
      row.to < row.from,
  )

  const problems: string[] = []
  if (!inRange(birthYear, MIN_BIRTH_YEAR, MAX_BIRTH_YEAR)) {
    problems.push(
      `Year you were born must be ${MIN_BIRTH_YEAR} to ${MAX_BIRTH_YEAR}.`,
    )
  }
  problems.push(...earningProblems)
  if (!inRange(claimAge, MIN_CLAIM_AGE, MAX_CLAIM_AGE)) {
    problems.push(
      `Age you start CPP must be ${MIN_CLAIM_AGE} to ${MAX_CLAIM_AGE}.`,
    )
  }
  if (inflation === undefined) {
    problems.push(
      `Annual inflation must be ${MIN_RATE * 100}% to ${MAX_RATE * 100}%.`,
    )
  }
  if (wageGrowth === undefined) {
    problems.push(
      `Annual wage growth must be ${MIN_RATE * 100}% to ${MAX_RATE * 100}%.`,
    )
  }
  if (careProblem) problems.push(PERIOD_PROBLEM)

  return {
    birthYear,
    earningPeriods,
    earningProblems,
    claimAge,
    inflation,
    wageGrowth,
    carePeriods: rows.filter(
      (row): row is ChildRearingPeriod =>
        inRange(row.from, MIN_CARE_YEAR, MAX_CARE_YEAR) &&
        inRange(row.to, MIN_CARE_YEAR, MAX_CARE_YEAR) &&
        row.to >= row.from,
    ),
    careProblem,
    problems,
  }
}
