import { describe, it, expect, vi, afterEach } from 'vitest'
import { ResumeDate } from './resume-date'

describe('ResumeDate', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    describe('datetime', () => {
        it('should return the ISO string when constructed with a date', () => {
            const date = new ResumeDate('2022-05')

            const result = date.datetime

            expect(result).toBe('2022-05')
        })

        it('should return current year-month when constructed with null', () => {
            vi.useFakeTimers()
            vi.setSystemTime(new Date('2025-03-15'))
            const date = new ResumeDate(null)

            const result = date.datetime

            expect(result).toBe('2025-03')
        })

        it('should zero-pad single-digit months for null dates', () => {
            vi.useFakeTimers()
            vi.setSystemTime(new Date('2025-01-10'))
            const date = new ResumeDate(null)

            const result = date.datetime

            expect(result).toBe('2025-01')
        })

        it('should preserve the exact ISO string provided', () => {
            const date = new ResumeDate('2018-12')

            const result = date.datetime

            expect(result).toBe('2018-12')
        })
    })

    describe('display', () => {
        it('should return "Present" when constructed with null', () => {
            const date = new ResumeDate(null)

            const result = date.display()

            expect(result).toBe('Present')
        })

        it('should format January correctly', () => {
            const date = new ResumeDate('2020-01')

            const result = date.display()

            expect(result).toBe('Jan 2020')
        })

        it('should format a mid-year month correctly', () => {
            const date = new ResumeDate('2022-05')

            const result = date.display()

            expect(result).toBe('May 2022')
        })

        it('should format December correctly', () => {
            const date = new ResumeDate('2018-12')

            const result = date.display()

            expect(result).toBe('Dec 2018')
        })

        it('should format each month abbreviation correctly', () => {
            const expected = [
                ['01', 'Jan'], ['02', 'Feb'], ['03', 'Mar'],
                ['04', 'Apr'], ['05', 'May'], ['06', 'Jun'],
                ['07', 'Jul'], ['08', 'Aug'], ['09', 'Sep'],
                ['10', 'Oct'], ['11', 'Nov'], ['12', 'Dec'],
            ]

            const results = expected.map(([month, abbr]) => ({
                actual: new ResumeDate(`2024-${month}`).display(),
                expected: `${abbr} 2024`,
            }))

            expect(results.every(r => r.actual === r.expected)).toBe(true)
        })
    })
})
