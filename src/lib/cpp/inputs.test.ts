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
  PERIOD_PROBLEM,
  clamp,
  formatPercent,
  inRange,
  nextEarningPeriod,
  optionalYear,
  parseWhole,
  percentFraction,
  pickStoredState,
  readInputs,
  restoreEarningPeriods,
  storedNumber,
} from './inputs'

const EARNING = { fromAge: 22, toAge: 65, salary: 70000 }
const FILLED = {
  birthYear: 1990,
  earningPeriods: [EARNING],
  claimAge: 65,
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
      nextEarningPeriod([{ fromAge: 22, toAge: 40, salary: 50000 }]),
    ).toEqual({ fromAge: 41, toAge: 45, salary: 50000 })
  })

  it('finds the latest period whatever order the rows are in', () => {
    expect(
      nextEarningPeriod([
        { fromAge: 45, toAge: 65, salary: 50000 },
        { fromAge: 22, toAge: 40, salary: 70000 },
      ]),
    ).toEqual({ fromAge: 66, toAge: 70, salary: 50000 })
  })

  it('caps the new period at the oldest working age', () => {
    expect(
      nextEarningPeriod([{ fromAge: 60, toAge: 66, salary: 70000 }]),
    ).toEqual({ fromAge: 67, toAge: 70, salary: 70000 })
  })

  it('leaves the ages blank when the latest period reaches the cap', () => {
    expect(
      nextEarningPeriod([{ fromAge: 22, toAge: 70, salary: 90000 }]),
    ).toEqual({ fromAge: undefined, toAge: undefined, salary: 90000 })
  })

  it('falls back to the start age when the latest period has no end', () => {
    expect(nextEarningPeriod([{ fromAge: 30, salary: 70000 }])).toEqual({
      fromAge: 31,
      toAge: 35,
      salary: 70000,
    })
  })

  it('starts from the default period when the form holds none', () => {
    expect(nextEarningPeriod([])).toEqual({
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

  it('turns the legacy salary and working span into one period', () => {
    expect(
      restoreEarningPeriods({ salary: 55000, startedAge: 25, stoppedAge: 60 }),
    ).toEqual([{ fromAge: 25, toAge: 60, salary: 55000 }])
  })

  it('fills a legacy field the old form left empty with the defaults', () => {
    expect(restoreEarningPeriods({ salary: 55000 })).toEqual([
      { fromAge: 22, toAge: 65, salary: 55000 },
    ])
  })

  it('prefers the stored array over the legacy fields', () => {
    expect(
      restoreEarningPeriods({
        earningPeriods: [{ fromAge: 30, toAge: 40, salary: 1000 }],
        salary: 55000,
        startedAge: 25,
        stoppedAge: 60,
      }),
    ).toEqual([{ fromAge: 30, toAge: 40, salary: 1000 }])
  })

  it('reports nothing to restore when the payload holds no earning period', () => {
    expect(restoreEarningPeriods({})).toBeUndefined()
  })
})

describe('picking the saved form', () => {
  const SAVED = { birthYear: 1990, claimAge: 65 }

  it('reports nothing saved when both keys are empty', () => {
    expect(pickStoredState(null, null)).toEqual({ ok: true, saved: null })
  })

  it('reads the current key', () => {
    expect(pickStoredState(JSON.stringify(SAVED), null)).toEqual({
      ok: true,
      saved: SAVED,
    })
  })

  it('reads the legacy key when the current one is empty', () => {
    expect(pickStoredState(null, JSON.stringify(SAVED))).toEqual({
      ok: true,
      saved: SAVED,
    })
  })

  it('prefers the current key when both hold a value', () => {
    expect(
      pickStoredState(JSON.stringify({ claimAge: 60 }), JSON.stringify(SAVED)),
    ).toEqual({ ok: true, saved: { claimAge: 60 } })
  })

  it('falls back to the legacy key when the current value does not parse', () => {
    expect(pickStoredState('{"claimAge":', JSON.stringify(SAVED))).toEqual({
      ok: true,
      saved: SAVED,
    })
  })

  it('reports an unreadable value when nothing parses', () => {
    expect(pickStoredState('not json', null)).toEqual({ ok: false })
    expect(pickStoredState('null', '5')).toEqual({ ok: false })
  })
})

describe('read inputs', () => {
  it('reports nothing for a filled form', () => {
    const inputs = readInputs(FILLED)
    expect(inputs.problems).toEqual([])
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
  })
})
