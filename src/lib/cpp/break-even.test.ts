import { describe, it, expect } from 'vitest'
import { breakEvenAge, totalReceived } from './break-even'

describe('total received', () => {
  it('is zero until the claim age', () => {
    expect(totalReceived(1000, 65, 60)).toBe(0)
    expect(totalReceived(1000, 65, 64.9)).toBe(0)
    expect(totalReceived(1000, 65, 65)).toBe(0)
  })

  it('adds twelve monthly payments a year after claiming', () => {
    expect(totalReceived(1000, 65, 66)).toBe(12000)
    expect(totalReceived(1000, 65, 70)).toBe(60000)
    expect(totalReceived(1000, 65, 95)).toBe(360000)
  })

  it('grows by the same amount every year', () => {
    const steps = [70, 71, 72, 73].map((age) =>
      totalReceived(1500, 65, age + 1),
    )
    for (let index = 1; index < steps.length; index++) {
      expect(steps[index] - steps[index - 1]).toBeCloseTo(12 * 1500, 9)
    }
  })
})

describe('break-even age', () => {
  it('finds where 60, 65 and 70 cross', () => {
    expect(breakEvenAge(60, 65, 0.64, 1)).toBeCloseTo(73.9, 1)
    expect(breakEvenAge(60, 70, 0.64, 1.42)).toBeCloseTo(78.2, 1)
    expect(breakEvenAge(65, 70, 1, 1.42)).toBeCloseTo(81.9, 1)
  })

  it('does not depend on the order of the ages', () => {
    expect(breakEvenAge(65, 60, 1, 0.64)).toBeCloseTo(73.9, 1)
  })

  it('returns Infinity for equal pensions', () => {
    expect(breakEvenAge(60, 65, 1, 1)).toBe(Infinity)
    expect(breakEvenAge(60, 65, 0, 0)).toBe(Infinity)
  })

  it('returns Infinity when a pension is zero', () => {
    expect(breakEvenAge(60, 65, 0, 1)).toBe(Infinity)
    expect(breakEvenAge(60, 65, 1, 0)).toBe(Infinity)
  })
})
