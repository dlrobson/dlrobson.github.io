import { describe, it, expect } from 'vitest'
import {
  MAX_BIRTH_YEAR,
  MAX_CARE_YEAR,
  MIN_BIRTH_YEAR,
  MIN_CARE_YEAR,
  PERIOD_PROBLEM,
  clamp,
  formatPercent,
  inRange,
  optionalYear,
  parseWhole,
  percentFraction,
  readInputs,
  storedNumber,
} from './inputs'

const FILLED = {
  birthYear: 1990,
  salary: 70000,
  startedAge: 22,
  stoppedAge: 65,
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

  it('reports a negative salary', () => {
    const inputs = readInputs({ ...FILLED, salary: -1 })
    expect(inputs.salary).toBe(-1)
    expect(inputs.problems).toEqual(['Annual salary must be zero or more.'])
  })

  it('reports a stop age below the start age', () => {
    const inputs = readInputs({ ...FILLED, startedAge: 22, stoppedAge: 18 })
    expect(inputs.problems).toEqual([
      'Age you stop working must be on or after the age you started.',
    ])
  })

  it('accepts a stop age equal to the start age', () => {
    expect(
      readInputs({ ...FILLED, startedAge: 65, stoppedAge: 65 }).problems,
    ).toEqual([])
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
      salary: null,
      startedAge: null,
      stoppedAge: null,
      claimAge: null,
      inflationText: '',
      wageGrowthText: '',
      periods: [],
    })
    expect(inputs.problems).toHaveLength(7)
  })
})
