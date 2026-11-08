import { describe, expect, it } from 'vitest'
import { CEILINGS, LAST_PUBLISHED_YEAR } from './params'
import {
  deflate,
  estimate,
  project,
  steadySalaryEarnings,
  ympeAverage,
} from './estimator'
import {
  SURFACE_SHARE_MAX,
  SURFACE_STOP_FIRST,
  SURFACE_STOP_LAST,
  pensionSurface,
} from './surface'

const BASE_YEAR = LAST_PUBLISHED_YEAR
const DEFAULTS = {
  birthYear: 1990,
  startedAge: 22,
  claimAge: 65,
  cpi: 0.025,
  wageGrowth: 0.03,
  baseYear: BASE_YEAR,
}

const grid = pensionSurface(DEFAULTS)
const column = (share: number) => grid.shares.indexOf(share)
const row = (stopAge: number) => grid.stopAges.indexOf(stopAge)

describe('pension surface', () => {
  it('reports the ceiling the estimate uses, in today dollars', () => {
    const claimYear = DEFAULTS.birthYear + DEFAULTS.claimAge
    const ceilings = project(
      CEILINGS,
      DEFAULTS.birthYear + 71,
      DEFAULTS.wageGrowth,
    )
    expect(grid.ceiling).toBeCloseTo(
      deflate(
        ympeAverage(ceilings.ympe, claimYear),
        claimYear,
        BASE_YEAR,
        DEFAULTS.cpi,
      ),
      6,
    )
  })

  it('covers every salary step and stop age', () => {
    expect(grid.shares[0]).toBe(0)
    expect(grid.shares.at(-1)).toBe(SURFACE_SHARE_MAX)
    expect(grid.shares).toHaveLength(27)
    expect(grid.stopAges[0]).toBe(SURFACE_STOP_FIRST)
    expect(grid.stopAges.at(-1)).toBe(SURFACE_STOP_LAST)
    expect(grid.stopAges).toHaveLength(14)
    for (const row of grid.values) expect(row).toHaveLength(grid.shares.length)
  })

  it('rises with salary', () => {
    for (const stopAge of grid.stopAges) {
      for (let index = 1; index < grid.shares.length; index++) {
        expect(grid.values[row(stopAge)][index]).toBeGreaterThanOrEqual(
          grid.values[row(stopAge)][index - 1] - 1e-9,
        )
      }
    }
  })

  it('rises with the age work stops', () => {
    for (let index = 0; index < grid.shares.length; index++) {
      for (let stop = 1; stop < grid.stopAges.length; stop++) {
        expect(grid.values[stop][index]).toBeGreaterThanOrEqual(
          grid.values[stop - 1][index] - 1e-9,
        )
      }
    }
  })

  it('matches a direct estimate at the first ceiling', () => {
    const earnings = steadySalaryEarnings(
      grid.ceiling,
      DEFAULTS.startedAge,
      66,
      DEFAULTS.birthYear,
      BASE_YEAR,
      DEFAULTS.cpi,
    )
    const ceilings = project(
      CEILINGS,
      DEFAULTS.birthYear + 71,
      DEFAULTS.wageGrowth,
    )
    const direct = estimate(
      DEFAULTS.birthYear,
      DEFAULTS.claimAge,
      earnings,
      ceilings,
    ).monthlyIn(BASE_YEAR, DEFAULTS.cpi)
    expect(grid.values[row(66)][column(1)]).toBeCloseTo(direct, 6)
  })

  it('adds nothing above the second ceiling', () => {
    const values = grid.values[row(66)]
    expect(values[column(1.3)] - values[column(1.25)]).toBeLessThan(1)
    expect(values[column(1.3)]).toBeGreaterThan(values[column(1)])
  })

  it('stops counting years after the claim age', () => {
    expect(grid.values[row(66)]).toEqual(grid.values[row(70)])
  })

  it('is zero without a salary', () => {
    for (const stopAge of grid.stopAges) {
      expect(grid.values[row(stopAge)][column(0)]).toBe(0)
    }
  })

  it('lowers the pension for child-rearing time off', () => {
    const withBreak = pensionSurface({
      ...DEFAULTS,
      childRearing: [{ from: 2015, to: 2019 }],
    })
    expect(withBreak.values[row(66)][column(1)]).toBeLessThan(
      grid.values[row(66)][column(1)],
    )
  })

  it('scales with the claim age', () => {
    const later = pensionSurface({ ...DEFAULTS, claimAge: 70 })
    const early = pensionSurface({ ...DEFAULTS, claimAge: 60 })
    expect(later.max).toBeGreaterThan(grid.max)
    expect(grid.max).toBeGreaterThan(early.max)
  })

  it('recomputes when a keyed input changes', () => {
    const cell = (surface: ReturnType<typeof pensionSurface>) =>
      surface.values[row(66)][column(1)]
    const variants = [
      { birthYear: 1985 },
      { startedAge: 25 },
      { cpi: 0.04 },
      { wageGrowth: 0.05 },
      { baseYear: BASE_YEAR - 1 },
    ]
    for (const variant of variants) {
      expect(cell(pensionSurface({ ...DEFAULTS, ...variant }))).not.toBeCloseTo(
        cell(grid),
        0,
      )
    }
  })

  it('reports the largest value', () => {
    const values = grid.values.flat()
    expect(grid.max).toBe(Math.max(...values))
  })
})
