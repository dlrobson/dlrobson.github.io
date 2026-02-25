import { describe, it, expect } from 'vitest'
import { ACTIVE_PROFILE } from './resume.profile'
import { RESUME_DATA } from './resume.data'

describe('ACTIVE_PROFILE', () => {
    describe('skillGroups', () => {
        it('should reference at least one skill group', () => {
            const count = ACTIVE_PROFILE.skillGroups.length

            expect(count).toBeGreaterThan(0)
        })

        it('should only reference skill keys that exist in RESUME_DATA', () => {
            const validKeys = Object.keys(RESUME_DATA.skills)

            const allValid = ACTIVE_PROFILE.skillGroups.every(key =>
                validKeys.includes(key),
            )

            expect(allValid).toBe(true)
        })
    })

    describe('experience', () => {
        it('should reference at least one job', () => {
            const count = ACTIVE_PROFILE.experience.length

            expect(count).toBeGreaterThan(0)
        })

        it('should only reference job IDs that exist in RESUME_DATA', () => {
            const validJobIds = Object.keys(RESUME_DATA.experience)

            const allValid = ACTIVE_PROFILE.experience.every(sel =>
                validJobIds.includes(sel.id),
            )

            expect(allValid).toBe(true)
        })

        it('should only reference point keys that exist in each respective job', () => {
            const experience = RESUME_DATA.experience as Record<string, { points: Record<string, unknown> }>

            const allValid = ACTIVE_PROFILE.experience.every(sel => {
                const job = experience[sel.id]
                const validPointKeys = Object.keys(job.points)
                return sel.points.every(pk => validPointKeys.includes(pk as string))
            })

            expect(allValid).toBe(true)
        })

        it('should not have duplicate job IDs', () => {
            const ids = ACTIVE_PROFILE.experience.map(sel => sel.id)

            const uniqueCount = new Set(ids).size

            expect(uniqueCount).toBe(ids.length)
        })

        it('should select at least one point per job', () => {
            const pointCounts = ACTIVE_PROFILE.experience.map(sel => sel.points.length)

            const allHavePoints = pointCounts.every(c => c > 0)

            expect(allHavePoints).toBe(true)
        })

        it('should not have duplicate point keys within each job', () => {
            const allUnique = ACTIVE_PROFILE.experience.every(sel => {
                const uniqueCount = new Set(sel.points).size
                return uniqueCount === sel.points.length
            })

            expect(allUnique).toBe(true)
        })
    })
})
