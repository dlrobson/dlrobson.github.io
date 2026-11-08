/**
 * Monthly pension at one claim age, across salary and the age work stops.
 *
 * Salary is a share of the modelled earnings ceiling rather than dollars. The
 * ceiling moves with the birth year and the wage-growth assumption, so a share
 * holds the first and second ceilings in one place on the chart; `ceiling`
 * converts a share back to today's dollars.
 *
 * Amounts are in today's dollars, indexed [stop age][salary share].
 */

import {
  applyChildRearing,
  childRearingWindows,
  deflate,
  estimate,
  project,
  steadySalaryEarnings,
  ympeAverage,
  type ChildRearingPeriod,
} from './estimator'
import { CEILINGS } from './params'

export interface SurfaceOptions {
  readonly birthYear: number
  readonly startedAge: number
  readonly claimAge: number
  readonly cpi: number
  readonly wageGrowth: number
  readonly baseYear: number
  readonly childRearing?: readonly ChildRearingPeriod[]
}

export interface Surface {
  /** Five-year average of the first ceiling, in today's dollars. */
  readonly ceiling: number
  /** Salary as a share of the ceiling, one entry per column edge. */
  readonly shares: readonly number[]
  /** Age work stops, one entry per row, ascending. */
  readonly stopAges: readonly number[]
  /** Monthly pension in today's dollars, [row][column edge]. */
  readonly values: readonly (readonly number[])[]
  readonly max: number
}

export const SURFACE_SHARE_STEP = 0.05
export const SURFACE_SHARE_MAX = 1.3
export const SURFACE_STOP_FIRST = 18
export const SURFACE_STOP_LAST = 70
export const SURFACE_STOP_STEP = 4

/**
 * A grid costs a few hundred pension estimates, which is more than a keystroke
 * should pay. Surfaces are cached by their inputs so that editing anything the
 * grid does not depend on — salary, the age work stops — reuses the last one.
 */
const CACHE_SIZE = 16
const cache = new Map<string, Surface>()

function cacheKey(options: SurfaceOptions): string {
  const periods = childRearingWindows(options.childRearing ?? [])
  return [
    options.birthYear,
    options.startedAge,
    options.claimAge,
    options.cpi,
    options.wageGrowth,
    options.baseYear,
    ...periods.map(([from, to]) => `${from}-${to}`),
  ].join('|')
}

export function pensionSurface(options: SurfaceOptions): Surface {
  const key = cacheKey(options)
  const hit = cache.get(key)
  if (hit) {
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }

  const surface = buildSurface(options)
  cache.set(key, surface)
  if (cache.size > CACHE_SIZE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  return surface
}

function buildSurface(options: SurfaceOptions): Surface {
  const { birthYear, startedAge, claimAge, cpi, wageGrowth, baseYear } = options

  const ceilings = project(CEILINGS, birthYear + 71, wageGrowth)
  const claimYear = birthYear + claimAge
  const ceiling = deflate(
    ympeAverage(ceilings.ympe, claimYear),
    claimYear,
    baseYear,
    cpi,
  )

  const periods = options.childRearing ?? []
  const windows = childRearingWindows(periods)

  const columns = Math.round(SURFACE_SHARE_MAX / SURFACE_SHARE_STEP) + 1
  const shares = Array.from(
    { length: columns },
    (_, index) => Math.round(index * SURFACE_SHARE_STEP * 100) / 100,
  )

  const stopAges: number[] = []
  for (
    let age = SURFACE_STOP_FIRST;
    age <= SURFACE_STOP_LAST;
    age += SURFACE_STOP_STEP
  ) {
    stopAges.push(age)
  }

  const values = stopAges.map((stopAge) =>
    shares.map((share) => {
      const earnings = applyChildRearing(
        steadySalaryEarnings(
          share * ceiling,
          startedAge,
          stopAge,
          birthYear,
          baseYear,
          cpi,
        ),
        periods,
      )
      return estimate(
        birthYear,
        claimAge,
        earnings,
        ceilings,
        windows,
      ).monthlyIn(baseYear, cpi)
    }),
  )

  let max = 0
  for (const row of values) {
    for (const value of row) {
      if (value > max) max = value
    }
  }

  return { ceiling, shares, stopAges, values, max }
}
