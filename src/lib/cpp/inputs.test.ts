import { describe, it, expect } from 'vitest'
import {
  EARNING_OVERLAP_PROBLEM,
  EARNING_PERIOD_PROBLEM,
  EARNING_SALARY_PROBLEM,
  MAX_BIRTH_YEAR,
  MAX_CARE_YEAR,
  MIN_BIRTH_YEAR,
  MIN_CARE_YEAR,
  NO_EARNING_PERIOD_PROBLEM,
  OAS_RESIDENCE_PROBLEM,
  OAS_START_AGE_PROBLEM,
  PERIOD_PROBLEM,
  clamp,
  formatPercent,
  inRange,
  nextEarningPeriod,
  numbersToStored,
  optionalYear,
  parseStoredState,
  parseWhole,
  percentFraction,
  readInputs,
  restoreEarningPeriods,
  storedNumber,
  storedToNumbers,
} from './inputs'

const EARNING = { fromAge: 22, toAge: 65, salary: 70000 }
const FILLED = {
  birthYear: 1990,
  earningPeriods: [EARNING],
  claimAge: 65,
  oasYears: 40,
  oasStartAge: 65,
  inflationText: '2.50',
  wageGrowthText: '3.00',
  periods: [],
}

describe('clamp', () => {
  it('holds a value between the bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe('inRange', () => {
  it('includes both bounds', () => {
    expect(inRange(60, 60, 70)).toBe(true)
    expect(inRange(70, 60, 70)).toBe(true)
    expect(inRange(59, 60, 70)).toBe(false)
    expect(inRange(71, 60, 70)).toBe(false)
  })

  it('rejects an unparsed value', () => {
    expect(inRange(undefined, 60, 70)).toBe(false)
  })
})

describe('parseWhole', () => {
  it('rounds a fractional entry', () => {
    expect(parseWhole(1990.4)).toBe(1990)
    expect(parseWhole(1990.6)).toBe(1991)
  })

  it('treats a cleared or unusable field as nothing', () => {
    expect(parseWhole(null)).toBeUndefined()
    expect(parseWhole(undefined)).toBeUndefined()
    expect(parseWhole(Number.NaN)).toBeUndefined()
    expect(parseWhole(Number.POSITIVE_INFINITY)).toBeUndefined()
    expect(parseWhole('1990')).toBeUndefined()
  })
})

describe('storedNumber', () => {
  it('keeps a number inside the range', () => {
    expect(storedNumber(1990, MIN_BIRTH_YEAR, MAX_BIRTH_YEAR)).toBe(1990)
  })

  it('drops a number outside the range', () => {
    expect(storedNumber(1899, MIN_BIRTH_YEAR, MAX_BIRTH_YEAR)).toBeUndefined()
    expect(storedNumber(2011, MIN_BIRTH_YEAR, MAX_BIRTH_YEAR)).toBeUndefined()
  })

  it('drops anything that is not a finite number', () => {
    expect(storedNumber('1990', 0, 3000)).toBeUndefined()
    expect(storedNumber(null, 0, 3000)).toBeUndefined()
    expect(storedNumber(Number.NaN, 0, 3000)).toBeUndefined()
  })
})

describe('optionalYear', () => {
  it('floors a fractional year to match the child-rearing windows', () => {
    expect(optionalYear(2020.9)).toBe(2020)
    expect(optionalYear(2020)).toBe(2020)
  })

  it('treats a cleared field as nothing', () => {
    expect(optionalYear(null)).toBeUndefined()
    expect(optionalYear(undefined)).toBeUndefined()
    expect(optionalYear(Number.NaN)).toBeUndefined()
  })
})

describe('percentFraction', () => {
  it('divides a percentage into a fraction', () => {
    expect(percentFraction('2.5')).toBeCloseTo(0.025, 10)
    expect(percentFraction('3')).toBeCloseTo(0.03, 10)
    expect(percentFraction('-1.5')).toBeCloseTo(-0.015, 10)
  })

  it('accepts a decimal comma, a percent sign and padding', () => {
    expect(percentFraction('2,5')).toBeCloseTo(0.025, 10)
    expect(percentFraction('2.5%')).toBeCloseTo(0.025, 10)
    expect(percentFraction('  2.5  ')).toBeCloseTo(0.025, 10)
  })

  it('rejects text that is not a number', () => {
    expect(percentFraction('')).toBeUndefined()
    expect(percentFraction('   ')).toBeUndefined()
    expect(percentFraction('abc')).toBeUndefined()
    expect(percentFraction('2.5x')).toBeUndefined()
    expect(percentFraction(null)).toBeUndefined()
    expect(percentFraction(undefined)).toBeUndefined()
  })

  it('rejects a rate outside the modelled range', () => {
    expect(percentFraction('20')).toBeUndefined()
    expect(percentFraction('-6')).toBeUndefined()
    expect(percentFraction('15')).toBeCloseTo(0.15, 10)
    expect(percentFraction('-5')).toBeCloseTo(-0.05, 10)
  })
})

describe('formatPercent', () => {
  it('rewrites a parsable entry with two decimals', () => {
    expect(formatPercent('3')).toBe('3.00')
    expect(formatPercent('2,5')).toBe('2.50')
    expect(formatPercent('2.5%')).toBe('2.50')
  })

  it('leaves text it cannot parse alone', () => {
    expect(formatPercent('abc')).toBe('abc')
    expect(formatPercent('20')).toBe('20')
    expect(formatPercent('')).toBe('')
  })
})

describe('next earning period', () => {
  it('starts five years after the latest period ends', () => {
    expect(
      nextEarningPeriod([{ fromAge: 22, toAge: 40, salary: 50000 }], 65),
    ).toEqual({ fromAge: 41, toAge: 45, salary: 50000 })
  })

  it('finds the latest period whatever order the rows are in', () => {
    expect(
      nextEarningPeriod(
        [
          { fromAge: 45, toAge: 55, salary: 50000 },
          { fromAge: 22, toAge: 40, salary: 70000 },
        ],
        65,
      ),
    ).toEqual({ fromAge: 56, toAge: 60, salary: 50000 })
  })

  it('stops the new period at the last year the estimate counts', () => {
    expect(
      nextEarningPeriod([{ fromAge: 22, toAge: 60, salary: 70000 }], 65),
    ).toEqual({ fromAge: 61, toAge: 64, salary: 70000 })
    expect(
      nextEarningPeriod([{ fromAge: 60, toAge: 66, salary: 70000 }], 70),
    ).toEqual({ fromAge: 67, toAge: 69, salary: 70000 })
  })

  it('starts where the pension stops counting, not past it', () => {
    expect(
      nextEarningPeriod([{ fromAge: 22, toAge: 65, salary: 70000 }], 70),
    ).toEqual({ fromAge: 66, toAge: 69, salary: 70000 })
  })

  it('leaves the ages blank when the latest period already ends at the cap', () => {
    expect(
      nextEarningPeriod([{ fromAge: 22, toAge: 70, salary: 90000 }], 70),
    ).toEqual({ fromAge: undefined, toAge: undefined, salary: 90000 })
  })

  it('leaves the ages blank when no counted year follows the latest period', () => {
    expect(
      nextEarningPeriod([{ fromAge: 22, toAge: 65, salary: 70000 }], 65),
    ).toEqual({ fromAge: undefined, toAge: undefined, salary: 70000 })
  })

  it('falls back to the start age when the latest period has no end', () => {
    expect(nextEarningPeriod([{ fromAge: 30, salary: 70000 }], 65)).toEqual({
      fromAge: 31,
      toAge: 35,
      salary: 70000,
    })
  })

  it('starts from the default period when the form holds none', () => {
    expect(nextEarningPeriod([], 65)).toEqual({
      fromAge: 22,
      toAge: 65,
      salary: 70000,
    })
  })
})

describe('stored earning periods', () => {
  it('reads the array the current key stores', () => {
    expect(
      restoreEarningPeriods({
        earningPeriods: [
          { fromAge: 25, toAge: 60, salary: 55000 },
          { fromAge: 61, toAge: 65, salary: 70000 },
        ],
      }),
    ).toEqual([
      { fromAge: 25, toAge: 60, salary: 55000 },
      { fromAge: 61, toAge: 65, salary: 70000 },
    ])
  })

  it('keeps a blank saved row blank instead of filling it in', () => {
    expect(restoreEarningPeriods({ earningPeriods: [{}] })).toEqual([
      { fromAge: undefined, toAge: undefined, salary: undefined },
    ])
  })

  it('drops a saved value outside the range the form accepts', () => {
    expect(
      restoreEarningPeriods({
        earningPeriods: [{ fromAge: 71, toAge: 65, salary: 0 }],
      }),
    ).toEqual([{ fromAge: undefined, toAge: 65, salary: 0 }])
  })

  it('reports nothing to restore when the payload holds no earning period', () => {
    expect(restoreEarningPeriods({})).toBeUndefined()
  })
})

describe('parsing the saved form', () => {
  const SAVED = { birthYear: 1990, claimAge: 65 }

  it('reports nothing saved when the key is empty', () => {
    expect(parseStoredState(null)).toEqual({ ok: true, saved: null })
  })

  it('reads the saved form', () => {
    expect(parseStoredState(JSON.stringify(SAVED))).toEqual({
      ok: true,
      saved: SAVED,
    })
  })

  it('reports an unreadable value when none of it parses', () => {
    expect(parseStoredState('not json')).toEqual({ ok: false })
    expect(parseStoredState('null')).toEqual({ ok: false })
    expect(parseStoredState('5')).toEqual({ ok: false })
  })
})

describe('read inputs', () => {
  it('reports nothing for a filled form', () => {
    const inputs = readInputs(FILLED)
    expect(inputs.problems).toEqual([])
    expect(inputs.oasProblems).toEqual([])
    expect(inputs.birthYear).toBe(1990)
    expect(inputs.inflation).toBeCloseTo(0.025, 10)
    expect(inputs.wageGrowth).toBeCloseTo(0.03, 10)
  })

  it('reports a cleared field instead of filling it in', () => {
    const inputs = readInputs({ ...FILLED, birthYear: null })
    expect(inputs.birthYear).toBeUndefined()
    expect(inputs.problems).toEqual([
      `Year you were born must be ${MIN_BIRTH_YEAR} to ${MAX_BIRTH_YEAR}.`,
    ])
  })

  it('reports a birth year outside the range the input allows', () => {
    expect(readInputs({ ...FILLED, birthYear: 1800 }).problems).toHaveLength(1)
    expect(readInputs({ ...FILLED, birthYear: 2011 }).problems).toHaveLength(1)
  })

  it('parses each earning period', () => {
    const inputs = readInputs({
      ...FILLED,
      earningPeriods: [
        { fromAge: 22.4, toAge: 39.4, salary: 70000.4 },
        { fromAge: 40, toAge: 65, salary: 50000 },
      ],
    })
    expect(inputs.earningPeriods).toEqual([
      { fromAge: 22, toAge: 39, salary: 70000 },
      { fromAge: 40, toAge: 65, salary: 50000 },
    ])
    expect(inputs.earningProblems).toEqual([])
  })

  it('reports a cleared earning period instead of filling it in', () => {
    const inputs = readInputs({
      ...FILLED,
      earningPeriods: [{ fromAge: null, toAge: null, salary: null }],
    })
    expect(inputs.earningPeriods).toEqual([])
    expect(inputs.earningProblems).toEqual([
      EARNING_PERIOD_PROBLEM,
      EARNING_SALARY_PROBLEM,
    ])
  })

  it('reports a salary below zero', () => {
    const inputs = readInputs({
      ...FILLED,
      earningPeriods: [{ ...EARNING, salary: -1 }],
    })
    expect(inputs.earningPeriods).toEqual([])
    expect(inputs.earningProblems).toEqual([EARNING_SALARY_PROBLEM])
  })

  it('accepts a salary of zero', () => {
    const inputs = readInputs({
      ...FILLED,
      earningPeriods: [{ ...EARNING, salary: 0 }],
    })
    expect(inputs.earningPeriods).toEqual([{ ...EARNING, salary: 0 }])
    expect(inputs.problems).toEqual([])
  })

  it('reports an end age below the start age', () => {
    const inputs = readInputs({
      ...FILLED,
      earningPeriods: [{ ...EARNING, fromAge: 22, toAge: 18 }],
    })
    expect(inputs.earningPeriods).toEqual([])
    expect(inputs.earningProblems).toEqual([EARNING_PERIOD_PROBLEM])
  })

  it('accepts a period of one year', () => {
    const inputs = readInputs({
      ...FILLED,
      earningPeriods: [{ ...EARNING, fromAge: 65, toAge: 65 }],
    })
    expect(inputs.earningProblems).toEqual([])
  })

  it('reports an age outside 18 to 70', () => {
    expect(
      readInputs({
        ...FILLED,
        earningPeriods: [{ ...EARNING, fromAge: 17 }],
      }).earningProblems,
    ).toEqual([EARNING_PERIOD_PROBLEM])
    expect(
      readInputs({
        ...FILLED,
        earningPeriods: [{ ...EARNING, toAge: 71 }],
      }).earningProblems,
    ).toEqual([EARNING_PERIOD_PROBLEM])
  })

  it('accepts the ends of the working age range', () => {
    expect(
      readInputs({
        ...FILLED,
        earningPeriods: [{ ...EARNING, fromAge: 18, toAge: 18 }],
      }).problems,
    ).toEqual([])
    expect(
      readInputs({
        ...FILLED,
        earningPeriods: [{ ...EARNING, fromAge: 70, toAge: 70 }],
      }).problems,
    ).toEqual([])
  })

  it('reports an empty earning period list', () => {
    const inputs = readInputs({ ...FILLED, earningPeriods: [] })
    expect(inputs.earningPeriods).toEqual([])
    expect(inputs.earningProblems).toEqual([NO_EARNING_PERIOD_PROBLEM])
  })

  it('reports overlapping earning periods', () => {
    const inputs = readInputs({
      ...FILLED,
      earningPeriods: [
        { fromAge: 22, toAge: 40, salary: 70000 },
        { fromAge: 40, toAge: 65, salary: 50000 },
      ],
    })
    expect(inputs.earningPeriods).toHaveLength(2)
    expect(inputs.earningProblems).toEqual([EARNING_OVERLAP_PROBLEM])
  })

  it('finds an overlap whatever order the rows are in', () => {
    const separate = readInputs({
      ...FILLED,
      earningPeriods: [
        { fromAge: 45, toAge: 65, salary: 50000 },
        { fromAge: 22, toAge: 40, salary: 70000 },
      ],
    })
    expect(separate.earningPeriods).toEqual([
      { fromAge: 45, toAge: 65, salary: 50000 },
      { fromAge: 22, toAge: 40, salary: 70000 },
    ])
    expect(separate.earningProblems).toEqual([])

    expect(
      readInputs({
        ...FILLED,
        earningPeriods: [
          { fromAge: 40, toAge: 65, salary: 50000 },
          { fromAge: 22, toAge: 50, salary: 70000 },
        ],
      }).earningProblems,
    ).toEqual([EARNING_OVERLAP_PROBLEM])
  })

  it('accepts adjacent and separated earning periods', () => {
    expect(
      readInputs({
        ...FILLED,
        earningPeriods: [
          { fromAge: 22, toAge: 40, salary: 70000 },
          { fromAge: 41, toAge: 65, salary: 50000 },
        ],
      }).problems,
    ).toEqual([])
    expect(
      readInputs({
        ...FILLED,
        earningPeriods: [
          { fromAge: 22, toAge: 35, salary: 70000 },
          { fromAge: 45, toAge: 65, salary: 50000 },
        ],
      }).problems,
    ).toEqual([])
  })

  it('keeps the earning periods it can read and reports the rest', () => {
    const inputs = readInputs({
      ...FILLED,
      earningPeriods: [
        { fromAge: 22, toAge: 40, salary: 70000 },
        { fromAge: 41, toAge: 65, salary: null },
      ],
    })
    expect(inputs.earningPeriods).toEqual([
      { fromAge: 22, toAge: 40, salary: 70000 },
    ])
    expect(inputs.earningProblems).toEqual([EARNING_SALARY_PROBLEM])
  })

  it('reports a claim age outside 60 to 70', () => {
    expect(readInputs({ ...FILLED, claimAge: 59 }).problems).toEqual([
      'Age you start CPP must be 60 to 70.',
    ])
    expect(readInputs({ ...FILLED, claimAge: 71 }).problems).toEqual([
      'Age you start CPP must be 60 to 70.',
    ])
    expect(readInputs({ ...FILLED, claimAge: 60 }).problems).toEqual([])
    expect(readInputs({ ...FILLED, claimAge: 70 }).problems).toEqual([])
  })

  it('reports a cleared residence count instead of paying nothing', () => {
    const inputs = readInputs({ ...FILLED, oasYears: null })
    expect(inputs.oasYears).toBeUndefined()
    expect(inputs.oasProblems).toEqual([OAS_RESIDENCE_PROBLEM])
    expect(inputs.problems).toEqual([])
  })

  it('reports a residence count outside 0 to 40', () => {
    expect(readInputs({ ...FILLED, oasYears: 41 }).oasProblems).toEqual([
      OAS_RESIDENCE_PROBLEM,
    ])
    expect(readInputs({ ...FILLED, oasYears: -1 }).oasProblems).toEqual([
      OAS_RESIDENCE_PROBLEM,
    ])
  })

  it('accepts the ends of the residence range', () => {
    expect(readInputs({ ...FILLED, oasYears: 0 }).oasProblems).toEqual([])
    expect(readInputs({ ...FILLED, oasYears: 40 }).oasProblems).toEqual([])
  })

  it('drops a partial residence year rather than rounding it up', () => {
    const inputs = readInputs({ ...FILLED, oasYears: 39.9 })
    expect(inputs.oasYears).toBe(39)
    expect(inputs.oasProblems).toEqual([])
  })

  it('reports an OAS start age outside 65 to 70', () => {
    expect(readInputs({ ...FILLED, oasStartAge: 64 }).oasProblems).toEqual([
      OAS_START_AGE_PROBLEM,
    ])
    expect(readInputs({ ...FILLED, oasStartAge: 71 }).oasProblems).toEqual([
      OAS_START_AGE_PROBLEM,
    ])
    expect(readInputs({ ...FILLED, oasStartAge: 65 }).oasProblems).toEqual([])
    expect(readInputs({ ...FILLED, oasStartAge: 70 }).oasProblems).toEqual([])
    expect(readInputs({ ...FILLED, oasStartAge: 70 }).oasStartAge).toBe(70)
  })

  it('names the ranges in the OAS problems', () => {
    expect(OAS_RESIDENCE_PROBLEM).toContain('0 to 40')
    expect(OAS_START_AGE_PROBLEM).toContain('65 to 70')
  })

  it('reports an inflation entry that is not a number', () => {
    const inputs = readInputs({ ...FILLED, inflationText: 'abc' })
    expect(inputs.inflation).toBeUndefined()
    expect(inputs.problems).toEqual(['Annual inflation must be -5% to 15%.'])
  })

  it('keeps the periods it can read and reports the rest', () => {
    const inputs = readInputs({
      ...FILLED,
      periods: [
        { from: 2015, to: 2019 },
        { from: 2021, to: null },
      ],
    })
    expect(inputs.carePeriods).toEqual([{ from: 2015, to: 2019 }])
    expect(inputs.careProblem).toBe(true)
    expect(inputs.problems).toEqual([PERIOD_PROBLEM])
  })

  it('reports a child-rearing year outside the range the input allows', () => {
    const cases = [
      { from: 1800, to: 1950 },
      { from: 2020, to: 2200 },
      { from: 1900, to: 1910 },
    ]
    for (const period of cases) {
      const inputs = readInputs({ ...FILLED, periods: [period] })
      expect(inputs.carePeriods).toEqual([])
      expect(inputs.careProblem).toBe(true)
      expect(inputs.problems).toEqual([PERIOD_PROBLEM])
    }
  })

  it('accepts a period at the edge of the year range', () => {
    const inputs = readInputs({
      ...FILLED,
      periods: [{ from: MIN_CARE_YEAR, to: MAX_CARE_YEAR }],
    })
    expect(inputs.carePeriods).toEqual([
      { from: MIN_CARE_YEAR, to: MAX_CARE_YEAR },
    ])
    expect(inputs.problems).toEqual([])
  })

  it('names the year range in the period problem', () => {
    expect(PERIOD_PROBLEM).toContain(`${MIN_CARE_YEAR} to ${MAX_CARE_YEAR}`)
  })

  it('reports a reversed period', () => {
    const inputs = readInputs({
      ...FILLED,
      periods: [{ from: 2019, to: 2015 }],
    })
    expect(inputs.carePeriods).toEqual([])
    expect(inputs.careProblem).toBe(true)
  })

  it('accepts a period of one year', () => {
    const inputs = readInputs({
      ...FILLED,
      periods: [{ from: 2019, to: 2019 }],
    })
    expect(inputs.carePeriods).toEqual([{ from: 2019, to: 2019 }])
    expect(inputs.problems).toEqual([])
  })

  it('reports every problem at once', () => {
    const inputs = readInputs({
      birthYear: null,
      earningPeriods: [{ fromAge: null, toAge: null, salary: null }],
      claimAge: null,
      inflationText: '',
      wageGrowthText: '',
      periods: [],
    })
    expect(inputs.problems).toEqual([
      `Year you were born must be ${MIN_BIRTH_YEAR} to ${MAX_BIRTH_YEAR}.`,
      EARNING_PERIOD_PROBLEM,
      EARNING_SALARY_PROBLEM,
      'Age you start CPP must be 60 to 70.',
      'Annual inflation must be -5% to 15%.',
      'Annual wage growth must be -5% to 15%.',
    ])
    expect(inputs.oasProblems).toHaveLength(2)
  })
})

describe('the stored form', () => {
  const FIELDS = {
    birthYear: 1985,
    claimAge: 67,
    oasYears: 30,
    oasStartAge: 68,
  }

  it('writes a cleared field as a null key rather than dropping it', () => {
    const saved = numbersToStored({ ...FIELDS, oasYears: undefined })
    expect('oasYears' in saved).toBe(true)
    expect(saved.oasYears).toBeNull()
  })

  it('keeps a cleared field cleared across a JSON round trip', () => {
    const written = JSON.stringify(
      numbersToStored({ ...FIELDS, birthYear: undefined }),
    )
    const restored = storedToNumbers(JSON.parse(written))
    expect('birthYear' in restored).toBe(true)
    expect(restored.birthYear).toBeUndefined()
  })

  it('reports a cleared field instead of falling back to the default', () => {
    const written = JSON.stringify(
      numbersToStored({ ...FIELDS, birthYear: undefined }),
    )
    const inputs = readInputs(storedToNumbers(JSON.parse(written)))
    expect(inputs.problems).toContain(
      `Year you were born must be ${MIN_BIRTH_YEAR} to ${MAX_BIRTH_YEAR}.`,
    )
  })

  it('leaves the key out for a record that never had the field', () => {
    expect('birthYear' in storedToNumbers({})).toBe(false)
  })

  it('passes an out-of-range value through so readInputs reports it', () => {
    const restored = storedToNumbers({ birthYear: 1800 })
    expect(restored.birthYear).toBe(1800)
    expect(readInputs(restored).problems).not.toEqual([])
  })

  it('floors a residence count the way the field does', () => {
    expect(storedToNumbers({ oasYears: 39.9 }).oasYears).toBe(39)
  })

  it('keeps every field a usable record holds', () => {
    const written = JSON.stringify(numbersToStored(FIELDS))
    expect(storedToNumbers(JSON.parse(written))).toEqual(FIELDS)
  })
})
