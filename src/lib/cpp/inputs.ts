/**
 * Reading the calculator's form: the number behind each field, what the reader
 * still has to fix before an estimate means anything, and the rows the form
 * starts from.
 *
 * A cleared number input binds `null` rather than `undefined`, so every field
 * arrives as `unknown` and is parsed before anything reads it. The model falls
 * back to its own defaults whatever the parse produced; `problems` gates the
 * CPP estimate and `oasProblems` the OAS one.
 */

import {
  MAX_CLAIM_AGE,
  MIN_CLAIM_AGE,
  type ChildRearingPeriod,
  type EarningPeriod,
} from './estimator'
import {
  OAS_FULL_RESIDENCE_YEARS,
  OAS_MAX_START_AGE,
  OAS_MIN_START_AGE,
} from './oas'

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

/** The period the form starts from, and the fallback for any field of a row. */
export const DEFAULT_EARNING_PERIOD: EarningPeriod = {
  fromAge: 22,
  toAge: 65,
  salary: 70000,
}

export interface RawEarningPeriod {
  readonly fromAge?: number | null
  readonly toAge?: number | null
  readonly salary?: number | null
}

/** An earning period as the form holds it before `readInputs` parses it. */
export interface EarningPeriodFields {
  fromAge: number | undefined
  toAge: number | undefined
  salary: number | undefined
}

/** An earning period as storage holds it. */
export interface StoredEarningPeriod {
  fromAge?: unknown
  toAge?: unknown
  salary?: unknown
}

/** A child-rearing period as storage holds it. */
export interface StoredCarePeriod {
  from?: unknown
  to?: unknown
}

/**
 * The calculator's form as storage holds it. Every field is `unknown`: a saved
 * value is untrusted until `storedNumber` or a type check has read it.
 */
export interface StoredState {
  birthYear?: unknown
  claimAge?: unknown
  oasYears?: unknown
  oasStartAge?: unknown
  inflationText?: unknown
  wageGrowthText?: unknown
  earningPeriods?: StoredEarningPeriod[] | null
  periods?: StoredCarePeriod[] | null
}

/** A saved payload, or the fact that what was there could not be read. */
export type StoredResult =
  | { readonly ok: true; readonly saved: StoredState | null }
  | { readonly ok: false }

export const OAS_RESIDENCE_PROBLEM = `Years in Canada after 18 must be 0 to ${OAS_FULL_RESIDENCE_YEARS}.`

export const OAS_START_AGE_PROBLEM = `Age you start OAS must be ${OAS_MIN_START_AGE} to ${OAS_MAX_START_AGE}.`

export interface RawPeriod {
  readonly from?: number | null
  readonly to?: number | null
}

export interface RawInputs {
  readonly birthYear?: number | null
  readonly earningPeriods?: readonly RawEarningPeriod[] | null
  readonly claimAge?: number | null
  readonly oasYears?: number | null
  readonly oasStartAge?: number | null
  readonly inflationText?: string | null
  readonly wageGrowthText?: string | null
  readonly periods?: readonly RawPeriod[] | null
}

export interface Inputs {
  readonly birthYear?: number
  readonly earningPeriods: readonly EarningPeriod[]
  readonly earningProblems: readonly string[]
  readonly claimAge?: number
  readonly oasYears?: number
  readonly oasStartAge?: number
  readonly inflation?: number
  readonly wageGrowth?: number
  readonly carePeriods: readonly ChildRearingPeriod[]
  readonly careProblem: boolean
  /** What stops the CPP estimate. */
  readonly problems: readonly string[]
  /** What stops the OAS estimate. */
  readonly oasProblems: readonly string[]
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
 * A count of whole units, floored rather than rounded. Calendar years have to
 * match the windows `childRearingWindows` builds from the same entry, and a
 * year of residence drops its partial part the way the OAS pension does.
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

/**
 * The row "+ Add earning period" starts: after the latest period's end age and
 * five years long, or with blank ages when that would run past the years the
 * estimate counts — the pension stops at `claimAge - 1` and never past
 * `MAX_WORK_AGE - 1`, so a row placed beyond that adds nothing. The latest
 * period is the one with the greatest end age, and a period with no end is
 * treated as ending just before the youngest working age.
 */
export function nextEarningPeriod(
  rows: readonly RawEarningPeriod[],
  claimAge: number,
): EarningPeriodFields {
  if (rows.length === 0) return { ...DEFAULT_EARNING_PERIOD }

  const endAge = (row: RawEarningPeriod) =>
    parseWhole(row.toAge) ?? MIN_WORK_AGE - 1
  const last = rows.reduce((latest, row) =>
    endAge(row) >= endAge(latest) ? row : latest,
  )
  const from = clamp(
    parseWhole(last.fromAge) ?? DEFAULT_EARNING_PERIOD.fromAge,
    MIN_WORK_AGE,
    MAX_WORK_AGE,
  )
  const to = clamp(
    parseWhole(last.toAge) ??
      parseWhole(last.fromAge) ??
      DEFAULT_EARNING_PERIOD.toAge,
    from,
    MAX_WORK_AGE,
  )
  const salary = last.salary ?? DEFAULT_EARNING_PERIOD.salary
  const lastCounted = Math.min(claimAge - 1, MAX_WORK_AGE - 1)

  return to < lastCounted
    ? { fromAge: to + 1, toAge: Math.min(lastCounted, to + 5), salary }
    : { fromAge: undefined, toAge: undefined, salary }
}

/**
 * The saved form in `raw`, or `ok: false` when a value was there but none of it
 * parsed — the caller then leaves it on the device rather than overwrite it.
 */
export function parseStoredState(raw: string | null): StoredResult {
  if (!raw) return { ok: true, saved: null }
  try {
    const saved = JSON.parse(raw) as unknown
    return saved && typeof saved === 'object'
      ? { ok: true, saved: saved as StoredState }
      : { ok: false }
  } catch {
    return { ok: false }
  }
}

/**
 * The earning periods a saved form holds, with any value outside the range the
 * form accepts left blank so `readInputs` gates the estimate. `undefined` when
 * the payload has no array at all, so the caller keeps the rows already shown.
 */
export function restoreEarningPeriods(
  saved: StoredState,
): readonly EarningPeriodFields[] | undefined {
  if (!Array.isArray(saved.earningPeriods)) return undefined

  return saved.earningPeriods.map((period) => ({
    fromAge: storedNumber(period?.fromAge, MIN_WORK_AGE, MAX_WORK_AGE),
    toAge: storedNumber(period?.toAge, MIN_WORK_AGE, MAX_WORK_AGE),
    salary: storedNumber(period?.salary, 0, Number.POSITIVE_INFINITY),
  }))
}

export function readInputs(raw: RawInputs): Inputs {
  const birthYear = parseWhole(raw.birthYear)
  const claimAge = parseWhole(raw.claimAge)
  const oasYears = optionalYear(raw.oasYears)
  const oasStartAge = parseWhole(raw.oasStartAge)
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

  const oasProblems: string[] = []
  if (!inRange(oasYears, 0, OAS_FULL_RESIDENCE_YEARS)) {
    oasProblems.push(OAS_RESIDENCE_PROBLEM)
  }
  if (!inRange(oasStartAge, OAS_MIN_START_AGE, OAS_MAX_START_AGE)) {
    oasProblems.push(OAS_START_AGE_PROBLEM)
  }

  return {
    birthYear,
    earningPeriods,
    earningProblems,
    claimAge,
    oasYears,
    oasStartAge,
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
    oasProblems,
  }
}
