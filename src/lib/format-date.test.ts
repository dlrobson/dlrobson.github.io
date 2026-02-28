import { describe, it, expect } from 'vitest'
import { formatDate, formatDateShort } from './format-date'

describe('formatDate', () => {
  describe('valid dates', () => {
    it('formats a mid-year date in long form', () => {
      expect(formatDate('2026-02-28')).toBe('February 28, 2026')
    })

    it('formats January correctly', () => {
      expect(formatDate('2026-01-01')).toBe('January 1, 2026')
    })

    it('formats December correctly', () => {
      expect(formatDate('2026-12-31')).toBe('December 31, 2026')
    })

    it('is stable regardless of local timezone (UTC anchoring)', () => {
      // This date at midnight local time would be the previous day in UTC-X timezones
      // if not handled correctly. With timeZone: 'UTC' it must always return March 1.
      expect(formatDate('2026-03-01')).toBe('March 1, 2026')
    })

    it('handles a leap day', () => {
      expect(formatDate('2024-02-29')).toBe('February 29, 2024')
    })
  })

  describe('invalid dates', () => {
    it('throws for wrong format', () => {
      expect(() => formatDate('28-02-2026')).toThrow(/Invalid date format/)
    })

    it('throws for a missing day', () => {
      expect(() => formatDate('2026-02')).toThrow(/Invalid date format/)
    })

    it('throws for month 0', () => {
      expect(() => formatDate('2026-00-01')).toThrow(/Invalid month/)
    })

    it('throws for month 13', () => {
      expect(() => formatDate('2026-13-01')).toThrow(/Invalid month/)
    })

    it('throws for day 0', () => {
      expect(() => formatDate('2026-02-00')).toThrow(/Invalid day/)
    })

    it('throws for day 32', () => {
      expect(() => formatDate('2026-02-32')).toThrow(/Invalid day/)
    })

    it('throws for an impossible date like Feb 30', () => {
      expect(() => formatDate('2026-02-30')).toThrow(/Invalid calendar date/)
    })

    it('throws for a non-leap-year Feb 29', () => {
      expect(() => formatDate('2026-02-29')).toThrow(/Invalid calendar date/)
    })

    it('throws for an empty string', () => {
      expect(() => formatDate('')).toThrow(/Invalid date format/)
    })
  })
})

describe('formatDateShort', () => {
  it('formats a date in abbreviated month form', () => {
    expect(formatDateShort('2026-02-28')).toBe('Feb 28, 2026')
  })

  it('formats January correctly', () => {
    expect(formatDateShort('2026-01-01')).toBe('Jan 1, 2026')
  })

  it('is stable regardless of local timezone (UTC anchoring)', () => {
    expect(formatDateShort('2026-03-01')).toBe('Mar 1, 2026')
  })

  it('throws for an invalid date', () => {
    expect(() => formatDateShort('not-a-date')).toThrow(/Invalid date format/)
  })
})
