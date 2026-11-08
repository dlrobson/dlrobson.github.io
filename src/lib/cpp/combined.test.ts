import { describe, it, expect } from 'vitest'
import { combine } from './combined'

const BOTH = {
  cppMonthly: 1116.4,
  oasMonthly: 762.5,
  cppAge: 65,
  oasAge: 65,
  cppAvailable: true,
  oasAvailable: true,
}

describe('combine', () => {
  it('adds the two pensions and annualises the total', () => {
    const result = combine(BOTH)
    expect(result.monthly).toBeCloseTo(1878.9, 6)
    expect(result.annual).toBeCloseTo(1878.9 * 12, 6)
    expect(result.available).toBe(true)
  })

  it('splits the total between the two', () => {
    const result = combine(BOTH)
    expect(result.cppShare + result.oasShare).toBeCloseTo(100, 6)
    expect(result.cppShare).toBeCloseTo((1116.4 / 1878.9) * 100, 6)
    expect(result.oasShare).toBeCloseTo((762.5 / 1878.9) * 100, 6)
  })

  it('heads the total with the later of the two start ages', () => {
    expect(combine({ ...BOTH, cppAge: 60, oasAge: 70 }).label).toBe(
      'From age 70, once both are paying',
    )
  })

  it('names the pension that is paying alone', () => {
    expect(combine({ ...BOTH, oasMonthly: 0 }).label).toBe(
      'CPP only, from age 65',
    )
    expect(combine({ ...BOTH, cppMonthly: 0 }).label).toBe(
      'OAS only, from age 65',
    )
  })

  it('says so when neither pension pays', () => {
    const result = combine({ ...BOTH, cppMonthly: 0, oasMonthly: 0 })
    expect(result.label).toBe('Neither pension pays with these inputs')
    expect(result.monthly).toBe(0)
    expect(result.cppShare).toBe(0)
    expect(result.oasShare).toBe(0)
  })

  it('leaves out a pension whose own form is not usable', () => {
    const result = combine({ ...BOTH, oasAvailable: false })
    expect(result.oas).toBe(0)
    expect(result.monthly).toBeCloseTo(1116.4, 6)
    expect(result.available).toBe(false)
    expect(result.missing).toBe('OAS')
  })

  it('names both halves when neither is usable', () => {
    const result = combine({
      ...BOTH,
      cppAvailable: false,
      oasAvailable: false,
    })
    expect(result.available).toBe(false)
    expect(result.missing).toBe('CPP and OAS')
    expect(result.monthly).toBe(0)
  })
})
