import { describe, it, expect } from 'vitest'
import { spellCheckDocument } from 'cspell-lib'
import { RESUME_DATA } from './resume.data'
import { ResumeDate } from './resume-date'

describe('RESUME_DATA', () => {
  describe('header', () => {
    it('should have a non-empty name', () => {
      const { name } = RESUME_DATA.header

      const isNonEmpty = name.length > 0

      expect(isNonEmpty).toBe(true)
    })

    it('should have a valid email format', () => {
      const { email } = RESUME_DATA.header

      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

      expect(isValidEmail).toBe(true)
    })

    it('should have an HTTPS LinkedIn URL', () => {
      const { linkedin } = RESUME_DATA.header

      const startsWithHttps = linkedin.startsWith('https://')

      expect(startsWithHttps).toBe(true)
    })

    it('should have an HTTPS GitHub URL', () => {
      const { github } = RESUME_DATA.header

      const startsWithHttps = github.startsWith('https://')

      expect(startsWithHttps).toBe(true)
    })
  })

  describe('skills', () => {
    it('should have at least one skill group', () => {
      const skillKeys = Object.keys(RESUME_DATA.skills)

      const count = skillKeys.length

      expect(count).toBeGreaterThan(0)
    })

    it('should have a non-empty label for every skill group', () => {
      const groups = Object.values(RESUME_DATA.skills)

      const allHaveLabels = groups.every((g) => g.label.length > 0)

      expect(allHaveLabels).toBe(true)
    })

    it('should have at least one item in every skill group', () => {
      const groups = Object.values(RESUME_DATA.skills)

      const allHaveItems = groups.every((g) => g.items.length > 0)

      expect(allHaveItems).toBe(true)
    })
  })

  describe('experience', () => {
    const jobs = Object.entries(RESUME_DATA.experience)

    it('should have at least one job entry', () => {
      const count = jobs.length

      expect(count).toBeGreaterThan(0)
    })

    it('should have non-empty title for every job', () => {
      const titles = jobs.map(([, job]) => job.title)

      const allNonEmpty = titles.every((t) => t.length > 0)

      expect(allNonEmpty).toBe(true)
    })

    it('should have non-empty company for every job', () => {
      const companies = jobs.map(([, job]) => job.company)

      const allNonEmpty = companies.every((c) => c.length > 0)

      expect(allNonEmpty).toBe(true)
    })

    it('should have non-empty location for every job', () => {
      const locations = jobs.map(([, job]) => job.location)

      const allNonEmpty = locations.every((l) => l.length > 0)

      expect(allNonEmpty).toBe(true)
    })

    it('should use ResumeDate instances for start dates', () => {
      const startDates = jobs.map(([, job]) => job.start)

      const allResumeDate = startDates.every((d) => d instanceof ResumeDate)

      expect(allResumeDate).toBe(true)
    })

    it('should use ResumeDate instances for end dates', () => {
      const endDates = jobs.map(([, job]) => job.end)

      const allResumeDate = endDates.every((d) => d instanceof ResumeDate)

      expect(allResumeDate).toBe(true)
    })

    it('should have at least one experience point per job', () => {
      const pointCounts = jobs.map(([, job]) => Object.keys(job.points).length)

      const allHavePoints = pointCounts.every((c) => c > 0)

      expect(allHavePoints).toBe(true)
    })

    it('should have non-empty text for every experience point', () => {
      const allPoints = jobs.flatMap(([, job]) => Object.values(job.points))

      const allNonEmpty = allPoints.every((p) => p.text.length > 0)

      expect(allNonEmpty).toBe(true)
    })

    it('should have start date before end date for completed jobs', () => {
      const completedJobs = jobs.filter(
        ([, job]) => job.end.display() !== 'Present',
      )

      const allOrdered = completedJobs.every(
        ([, job]) => job.start.datetime < job.end.datetime,
      )

      expect(allOrdered).toBe(true)
    })
  })

  describe('education', () => {
    it('should have a non-empty school name', () => {
      const { school } = RESUME_DATA.education

      const isNonEmpty = school.length > 0

      expect(isNonEmpty).toBe(true)
    })

    it('should have a non-empty degree', () => {
      const { degree } = RESUME_DATA.education

      const isNonEmpty = degree.length > 0

      expect(isNonEmpty).toBe(true)
    })

    it('should use a ResumeDate for the education date', () => {
      const { date } = RESUME_DATA.education

      const isResumeDate = date instanceof ResumeDate

      expect(isResumeDate).toBe(true)
    })
  })

  describe('interests', () => {
    it('should have at least one interest', () => {
      const count = RESUME_DATA.interests.length

      expect(count).toBeGreaterThan(0)
    })

    it('should have only non-empty interest strings', () => {
      const interests = RESUME_DATA.interests

      const allNonEmpty = interests.every((i) => i.length > 0)

      expect(allNonEmpty).toBe(true)
    })
  })

  describe('spell check', () => {
    /** Domain-specific terms that are correctly spelled but not in standard dictionaries. */
    const DOMAIN_WORDS = ['Kalman', 'scikit', 'DBSCAN']

    it('should have no misspelled words in experience point text', async () => {
      const allText = Object.values(RESUME_DATA.experience)
        .flatMap((job) => Object.values(job.points).map((p) => p.text))
        .join('\n')

      const result = await spellCheckDocument(
        {
          uri: 'stdin://resume',
          text: allText,
          languageId: 'plaintext',
          locale: 'en',
        },
        { generateSuggestions: false },
        { words: DOMAIN_WORDS },
      )
      const misspelled = result.issues.map((i) => i.text)

      expect(misspelled).toEqual([])
    })
  })
})
