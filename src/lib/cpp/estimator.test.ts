import { describe, it, expect } from 'vitest'
import { CEILINGS, LAST_PUBLISHED_YEAR } from './params'
import {
  adjustmentFactor,
  applyChildRearing,
  childRearingWindows,
  DEFAULT_CPI,
  defaultChildRearingPeriod,
  deflate,
  ENHANCED_DIVISOR_MONTHS,
  estimate,
  FIRST_ADDITIONAL_RATE,
  firstAdditionalShare,
  GENERAL_DROPOUT,
  project,
  SECOND_ADDITIONAL_RATE,
  steadySalaryEarnings,
  ympeAverage,
  type Earnings,
} from './estimator'

const PROJECTED = project(CEILINGS, 2100, DEFAULT_CPI)

function years(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index)
}

function atCeiling(
  span: number[],
  table: Readonly<Record<number, number>> = PROJECTED.ympe,
): Earnings {
  return Object.fromEntries(span.map((year) => [year, table[year]]))
}

function fillEarnings(
  birthYear: number,
  retireAge: number,
  ceiling: 'ympe' | 'yampe',
): Earnings {
  const table = ceiling === 'yampe' ? PROJECTED.yampe : PROJECTED.ympe
  const earnings: Record<number, number> = {}
  for (let year = birthYear + 18; year <= birthYear + retireAge; year++) {
    // The second ceiling did not exist before 2024; the first one is the top of
    // the band there, so a second-ceiling filler earns at the YMPE.
    earnings[year] = table[year] ?? PROJECTED.ympe[year]
  }
  return earnings
}

describe('published amounts', () => {
  it('reproduces the 2018 maximum pension exactly', () => {
    const result = estimate(1953, 65, atCeiling(years(1971, 2017)), CEILINGS)
    expect(result.monthly).toBeCloseTo(1134.17, 2)
    expect(result.firstAdditional).toBe(0)
  })

  it('uses the five-year average YMPE for the base ceiling', () => {
    expect(ympeAverage(CEILINGS.ympe, 2026)).toBeCloseTo(69180, 2)
    expect((0.25 * 69180) / 12).toBeCloseTo(1441.25, 2)
    expect(ympeAverage(CEILINGS.ympe, 2018)).toBeCloseTo(54440, 2)
  })

  it('reproduces the 2026 maximum within a dollar once the ramp is modelled', () => {
    const result = estimate(1961, 65, atCeiling(years(1979, 2025)), CEILINGS)
    expect(result.base).toBeCloseTo(1441.25, 2)
    expect(Math.abs(result.monthly - 1507.65)).toBeLessThan(1)
  })

  it('projects ceilings forward from the last published year', () => {
    expect(LAST_PUBLISHED_YEAR).toBe(2026)
    const projected = project(CEILINGS, 2028, 0.03)
    expect(projected.ympe[2027]).toBe(
      Math.floor((74600 * 1.03) / 100 + 0.5) * 100,
    )
    expect(projected.yampe[2027]).toBe(
      Math.floor((projected.ympe[2027] * 1.14) / 100 + 0.5) * 100,
    )
  })
})

describe('enhancement ramp', () => {
  it('credits the 2019-2022 contribution rates in proportion', () => {
    expect(firstAdditionalShare(2018)).toBe(0)
    expect(firstAdditionalShare(2019)).toBe(0.25)
    expect(firstAdditionalShare(2020)).toBe(0.5)
    expect(firstAdditionalShare(2021)).toBe(0.75)
    expect(firstAdditionalShare(2022)).toBe(1)
    expect(firstAdditionalShare(2026)).toBe(1)
  })

  it('pays a 2019 year a quarter of a 2022 year', () => {
    const ceiling = ympeAverage(PROJECTED.ympe, 2064) / 12
    const in2019 = estimate(1999, 65, { 2019: PROJECTED.ympe[2019] }, PROJECTED)
    const in2022 = estimate(1999, 65, { 2022: PROJECTED.ympe[2022] }, PROJECTED)
    expect(in2019.firstAdditional).toBeCloseTo(
      (FIRST_ADDITIONAL_RATE * 12 * ceiling * 0.25) / ENHANCED_DIVISOR_MONTHS,
      6,
    )
    expect(in2022.firstAdditional).toBeCloseTo(
      (FIRST_ADDITIONAL_RATE * 12 * ceiling) / ENHANCED_DIVISOR_MONTHS,
      6,
    )
  })

  it('keeps full-rate months ahead of ramped months when trimming to 480', () => {
    const ympe: Record<number, number> = {}
    const yampe: Record<number, number> = {}
    for (let year = 2017; year <= 2064; year++) {
      ympe[year] = 60000
      yampe[year] = 68400
    }
    const earnings: Record<number, number> = {}
    for (let year = 2019; year <= 2021; year++) earnings[year] = 60000
    for (let year = 2022; year <= 2063; year++) earnings[year] = 24000

    const result = estimate(1999, 65, earnings, { ympe, yampe })

    // 540 credited months, trimmed to the best 480: drop the twelve 2019 months
    // and forty-eight of the 2000-dollar months. Raw-band selection would have
    // kept the 2019-2021 ceiling years and dropped 2000-dollar months instead.
    const expected = (FIRST_ADDITIONAL_RATE * 987000) / ENHANCED_DIVISOR_MONTHS
    expect(result.firstAdditional).toBeCloseTo(expected, 6)
  })

  it('still dilutes ten enhanced years over 480 months', () => {
    const result = estimate(1999, 65, atCeiling(years(2019, 2028)), PROJECTED)
    expect(result.enhancedMonths).toBe(120)
    const creditedMonths = 12 * (0.25 + 0.5 + 0.75) + 7 * 12
    expect(result.firstAdditional).toBeCloseTo(
      (FIRST_ADDITIONAL_RATE * creditedMonths * (result.ympeAverage / 12)) /
        ENHANCED_DIVISOR_MONTHS,
      6,
    )
  })

  it('pays nothing extra before 2019', () => {
    const result = estimate(1999, 65, atCeiling(years(2017, 2018)), PROJECTED)
    expect(result.firstAdditional).toBe(0)
    expect(result.secondAdditional).toBe(0)
  })
})

describe('drop-outs', () => {
  it('absorbs zero years once a career reaches forty years', () => {
    const result = estimate(1980, 65, atCeiling(years(1998, 2037)), PROJECTED)
    expect(result.base).toBeCloseTo((0.25 * result.ympeAverage) / 12, 6)
    expect(result.monthsCounted).toBe(468)
  })

  it('keeps gap years beyond the drop-out in the denominator', () => {
    const short = estimate(1980, 65, atCeiling(years(1998, 2027)), PROJECTED)
    const full = estimate(1980, 65, atCeiling(years(1998, 2037)), PROJECTED)
    expect(short.base).toBeLessThan(full.base)
    expect(short.monthsCounted).toBeGreaterThan(300)
  })

  it('uses only post-65 months for the deferral drop-out', () => {
    const earnings: Record<number, number> = {}
    for (let year = 2017; year <= 2030; year++) {
      earnings[year] = PROJECTED.ympe[year] * 0.5
    }
    for (let year = 2031; year <= 2068; year++) {
      earnings[year] = PROJECTED.ympe[year]
    }

    const result = estimate(1999, 70, earnings, PROJECTED)
    const perMonth = result.ympeAverage / 12
    expect(result.monthsDroppedAfter65).toBe(59)
    expect(result.base).toBeCloseTo(
      (0.25 * (71 * 0.5 + 397) * perMonth) / 468,
      6,
    )
  })

  it('keeps the deferral drop-out after child-rearing months come out', () => {
    const earnings: Record<number, number> = {
      ...fillEarnings(1999, 70, 'ympe'),
    }
    for (let year = 2019; year <= 2023; year++) earnings[year] = 0

    const plain = estimate(1999, 70, earnings, PROJECTED)
    const helped = estimate(1999, 70, earnings, PROJECTED, [[2019, 2023]])
    expect(plain.monthsDroppedAfter65).toBe(59)
    expect(helped.monthsDroppedChildRearing).toBe(60)
    expect(helped.monthsDroppedAfter65).toBe(59)
  })

  it('counts the deferral drop-out month by month', () => {
    const earnings = fillEarnings(1999, 70, 'ympe')
    const counts = years(61, 70).map(
      (age) => estimate(1999, age, earnings, PROJECTED).monthsDroppedAfter65,
    )
    expect(counts).toEqual([0, 0, 0, 0, 0, 11, 23, 35, 47, 59])
  })
})

describe('child rearing', () => {
  const earnings: Record<number, number> = {}
  for (let year = 2017; year <= 2029; year++) {
    earnings[year] = PROJECTED.ympe[year]
  }
  for (let year = 2030; year <= 2040; year++) earnings[year] = 0
  for (let year = 2041; year <= 2063; year++) {
    earnings[year] = PROJECTED.ympe[year]
  }

  it('penalises the gap without the provision', () => {
    const result = estimate(1999, 65, earnings, PROJECTED)
    const perMonth = result.ympeAverage / 12
    expect(result.monthsDroppedChildRearing).toBe(0)
    expect(result.base).toBeCloseTo((0.25 * 432 * perMonth) / 468, 6)
  })

  it('drops low-earning months inside the window', () => {
    const result = estimate(1999, 65, earnings, PROJECTED, [[2030, 2031]])
    const perMonth = result.ympeAverage / 12
    expect(result.monthsDroppedChildRearing).toBe(24)
    expect(result.base).toBeCloseTo((0.25 * 432 * perMonth) / 448, 6)
  })

  it('does not help the enhanced components', () => {
    const plain = estimate(1999, 65, earnings, PROJECTED)
    const helped = estimate(1999, 65, earnings, PROJECTED, [[2030, 2031]])
    expect(helped.base).toBeGreaterThan(plain.base)
    expect(helped.firstAdditional).toBeCloseTo(plain.firstAdditional, 9)
  })
})

describe('second additional', () => {
  it('is zero at the first ceiling', () => {
    const result = estimate(1999, 65, fillEarnings(1999, 55, 'ympe'), PROJECTED)
    expect(result.secondAdditional).toBe(0)
  })

  it('pays above the first ceiling without changing the lower components', () => {
    const above = estimate(1999, 65, fillEarnings(1999, 55, 'yampe'), PROJECTED)
    const at = estimate(1999, 65, fillEarnings(1999, 55, 'ympe'), PROJECTED)
    expect(above.secondAdditional).toBeGreaterThan(0)
    expect(above.base).toBeCloseTo(at.base, 6)
    expect(above.firstAdditional).toBeCloseTo(at.firstAdditional, 6)
  })

  it('cannot start before 2024', () => {
    const result = estimate(1999, 65, atCeiling(years(2019, 2023)), PROJECTED)
    expect(result.secondAdditional).toBe(0)
  })

  it('takes the best 480 months of a longer enhanced period', () => {
    const result = estimate(1999, 70, fillEarnings(1999, 70, 'ympe'), PROJECTED)
    expect(result.enhancedMonths).toBe(600)
    expect(result.secondAdditional).toBe(0)
    expect(result.firstAdditional).toBeCloseTo(
      FIRST_ADDITIONAL_RATE * (result.ympeAverage / 12),
      6,
    )
  })

  it('pays the second additional rate on the best 480 months', () => {
    const ympe: Record<number, number> = {}
    const yampe: Record<number, number> = {}
    for (let year = 2017; year <= 2069; year++) {
      ympe[year] = 60000
      yampe[year] = 90000
    }
    const earnings: Record<number, number> = {}
    for (let year = 2024; year <= 2033; year++) earnings[year] = 75000
    for (let year = 2034; year <= 2068; year++) earnings[year] = 90000

    const result = estimate(1999, 70, earnings, { ympe, yampe })

    // 540 months between the ceilings: 120 at 1250 and 420 at 2500. The best
    // 480 drop sixty of the cheaper months.
    const best480 = 60 * 1250 + 420 * 2500
    expect(result.secondAdditional).toBeCloseTo(
      (SECOND_ADDITIONAL_RATE * best480) / ENHANCED_DIVISOR_MONTHS,
      6,
    )
  })
})

describe('claim age', () => {
  it('applies the early and late adjustment factors', () => {
    expect(adjustmentFactor(60)).toBeCloseTo(0.64, 10)
    expect(adjustmentFactor(65)).toBe(1)
    expect(adjustmentFactor(70)).toBeCloseTo(1.42, 10)
  })

  it('rejects ages outside 60-70', () => {
    expect(() => adjustmentFactor(59)).toThrow()
    expect(() => adjustmentFactor(71)).toThrow()
  })

  it('does not dilute post-65 months when deferring', () => {
    const earnings = fillEarnings(1999, 55, 'ympe')
    const at65 = estimate(1999, 65, earnings, PROJECTED)
    const at70 = estimate(1999, 70, earnings, PROJECTED)
    expect(at65.base / at65.ympeAverage).toBeCloseTo(
      at70.base / at70.ympeAverage,
      12,
    )
    expect(at65.monthsCounted).toBe(at70.monthsCounted)
    expect(at70.monthsDroppedAfter65).toBe(59)
    expect(at65.monthsDroppedAfter65).toBe(0)
    expect(at70.monthly).toBeGreaterThan(at65.monthly)
  })

  it('applies the adjustment to every component', () => {
    const result = estimate(
      1999,
      70,
      fillEarnings(1999, 70, 'yampe'),
      PROJECTED,
    )
    expect(result.secondAdditional).toBeGreaterThan(0)
    expect(result.monthly).toBeCloseTo(
      (result.base + result.firstAdditional + result.secondAdditional) * 1.42,
      6,
    )
  })
})

describe('today dollars', () => {
  const base = LAST_PUBLISHED_YEAR
  const cpi = 0.025
  const result = estimate(1999, 65, fillEarnings(1999, 65, 'ympe'), PROJECTED)
  const deflated = result.monthly / (1 + cpi) ** (result.claimYear - base)

  it('divides the pension by the inflation to the base year', () => {
    expect(deflate(result.monthly, result.claimYear, base, cpi)).toBeCloseTo(
      deflated,
      6,
    )
    expect(result.monthlyIn(base, cpi)).toBeCloseTo(deflated, 6)
  })

  it('counts twelve payments in the annual figure', () => {
    expect(result.annual).toBeCloseTo(12 * result.monthly, 9)
    expect(result.annualIn(base, cpi)).toBeCloseTo(12 * deflated, 6)
  })

  it('leaves the pension alone in its own claim year', () => {
    expect(result.monthlyIn(result.claimYear, cpi)).toBeCloseTo(
      result.monthly,
      9,
    )
  })
})

describe('steady salary', () => {
  it('holds the salary flat in real terms', () => {
    const earnings = steadySalaryEarnings(70000, 22, 65, 1990, 2026, 0.025)
    expect(earnings[2026]).toBe(70000)
    for (const year of years(2012, 2055)) {
      expect(earnings[year] / 1.025 ** (year - 2026)).toBeCloseTo(70000, 6)
    }
  })

  it('leaves the years outside the working span empty', () => {
    const earnings = steadySalaryEarnings(70000, 22, 65, 1990, 2026, 0.025)
    expect(earnings[2011]).toBeUndefined()
    expect(earnings[2056]).toBeUndefined()
  })
})

describe('child-rearing periods', () => {
  const salary = steadySalaryEarnings(70000, 22, 65, 1990, 2026, DEFAULT_CPI)

  it('defaults a new period to age 30 for five years', () => {
    expect(defaultChildRearingPeriod(1990)).toEqual({ from: 2020, to: 2024 })
  })

  it('builds a window for each period', () => {
    expect(
      childRearingWindows([
        { from: 2020, to: 2024 },
        { from: 2027, to: 2029 },
      ]),
    ).toEqual([
      [2020, 2024],
      [2027, 2029],
    ])
  })

  it('ignores reversed and non-finite periods', () => {
    expect(
      childRearingWindows([
        { from: 2024, to: 2020 },
        { from: Number.NaN, to: 2024 },
        { from: 2020, to: Number.NaN },
      ]),
    ).toEqual([])
  })

  it('zeroes earnings across every period', () => {
    const earnings = applyChildRearing(
      { 2020: 50000, 2021: 50000, 2022: 50000, 2023: 50000 },
      [
        { from: 2020, to: 2021 },
        { from: 2022, to: 2023 },
      ],
    )
    expect(earnings).toEqual({ 2020: 0, 2021: 0, 2022: 0, 2023: 0 })
  })

  it('drops overlapping periods once', () => {
    const periods = [
      { from: 2030, to: 2036 },
      { from: 2033, to: 2039 },
    ]
    expect(childRearingWindows(periods)).toEqual([
      [2030, 2036],
      [2033, 2039],
    ])

    const broken = applyChildRearing(salary, periods)
    const plain = estimate(1990, 65, broken, PROJECTED)
    const helped = estimate(
      1990,
      65,
      broken,
      PROJECTED,
      childRearingWindows(periods),
    )

    expect(helped.monthsDroppedChildRearing).toBe(120)
    expect(helped.base).toBeGreaterThan(plain.base)
  })

  it('lowers the estimate and the provision recovers part of it', () => {
    const periods = [{ from: 2030, to: 2036 }]
    const broken = applyChildRearing(salary, periods)
    const plain = estimate(1990, 65, broken, PROJECTED)
    const helped = estimate(
      1990,
      65,
      broken,
      PROJECTED,
      childRearingWindows(periods),
    )
    const noBreak = estimate(1990, 65, salary, PROJECTED)

    expect(plain.monthly).toBeLessThan(noBreak.monthly)
    expect(helped.base).toBeGreaterThan(plain.base)
    expect(helped.monthsDroppedChildRearing).toBe(84)
  })
})

describe('constants', () => {
  it('keeps the drop-out and divisor in step with the legislation', () => {
    expect(GENERAL_DROPOUT).toBe(0.17)
    expect(ENHANCED_DIVISOR_MONTHS).toBe(480)
    expect(SECOND_ADDITIONAL_RATE).toBeCloseTo(0.3333, 4)
  })
})
