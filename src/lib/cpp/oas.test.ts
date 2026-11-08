import { describe, it, expect } from 'vitest'
import {
  OAS_MAX_MONTHLY,
  OAS_START_AGES,
  deferralFactor,
  oasMonthly,
  residenceShare,
} from './oas'

describe('residence share', () => {
  it('pays the full pension at forty years', () => {
    expect(residenceShare(40)).toBe(1)
  })

  it('pays half the pension at twenty years', () => {
    expect(residenceShare(20)).toBe(0.5)
  })

  it('rounds a partial year down', () => {
    expect(residenceShare(39.9)).toBeCloseTo(39 / 40, 9)
    expect(residenceShare(20.1)).toBe(0.5)
  })

  it('caps residence at forty years', () => {
    expect(residenceShare(55)).toBe(1)
    expect(residenceShare(40.1)).toBe(1)
  })

  it('pays nothing without residence', () => {
    expect(residenceShare(0)).toBe(0)
    expect(residenceShare(-5)).toBe(0)
    expect(residenceShare(Number.NaN)).toBe(0)
  })
})

describe('deferral factor', () => {
  it('does not increase the pension at sixty-five', () => {
    expect(deferralFactor(65)).toBe(1)
  })

  it('adds 7.2 percent for each year after sixty-five', () => {
    expect(deferralFactor(66)).toBeCloseTo(1.072, 9)
    expect(deferralFactor(67)).toBeCloseTo(1.144, 9)
    expect(deferralFactor(69)).toBeCloseTo(1.288, 9)
  })

  it('caps the increase at 36 percent from seventy', () => {
    expect(deferralFactor(70)).toBeCloseTo(1.36, 9)
    expect(deferralFactor(72)).toBeCloseTo(1.36, 9)
  })

  it('does not apply before sixty-five', () => {
    expect(deferralFactor(64)).toBe(1)
  })

  it('pays nothing for a start age that is not a number', () => {
    expect(deferralFactor(Number.NaN)).toBe(0)
  })
})

describe('monthly OAS', () => {
  it('pays the maximum at sixty-five with full residence', () => {
    expect(oasMonthly(40, 65)).toBeCloseTo(OAS_MAX_MONTHLY, 9)
  })

  it('scales a partial pension by residence', () => {
    expect(oasMonthly(20, 65)).toBeCloseTo(OAS_MAX_MONTHLY / 2, 9)
  })

  it('increases a full pension when deferred to seventy', () => {
    expect(oasMonthly(40, 70)).toBeCloseTo(OAS_MAX_MONTHLY * 1.36, 9)
  })

  it('combines partial residence and deferral', () => {
    expect(oasMonthly(20, 70)).toBeCloseTo(OAS_MAX_MONTHLY * 0.5 * 1.36, 9)
  })

  it('pays nothing without residence', () => {
    expect(oasMonthly(0, 70)).toBe(0)
  })
})

describe('published amounts', () => {
  it('keeps the maximum at the published fourth-quarter 2026 figure', () => {
    expect(OAS_MAX_MONTHLY).toBe(762.5)
  })
})

describe('start ages', () => {
  it('covers every whole start age from sixty-five to seventy', () => {
    expect(OAS_START_AGES).toEqual([65, 66, 67, 68, 69, 70])
  })
})
