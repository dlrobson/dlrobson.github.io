// ResumeDate class lives in its own module; re-export for convenience.
export { ResumeDate } from './resume-date'
import type { ResumeDate } from './resume-date'

export const EXPERIENCE_TAGS = [
  'API Design',
  'Auth',
  'C++',
  'CI/CD',
  'DevOps',
  'Docker',
  'Embedded',
  'Leadership',
  'LiDAR',
  'Machine Learning',
  'Perception',
  'Performance',
  'Python',
  'Rust',
  'Sensor Fusion',
  'Testing',
] as const

export type ExperienceTag = (typeof EXPERIENCE_TAGS)[number]

export interface ExperiencePoint {
  text: string
  tags?: readonly ExperienceTag[]
}

export interface JobPeriod {
  title: string
  start: ResumeDate
  end: ResumeDate
}

export interface Job {
  company: string
  location: string
  periods: readonly JobPeriod[]
  points: Record<string, ExperiencePoint>
}

export interface ResumeData {
  header: {
    name: string
    email?: string
    linkedin: string
    github: string
    website: string
  }
  skills: Record<
    string,
    {
      label: string
      items: readonly string[]
    }
  >
  experience: Record<string, Job>
  education: {
    school: string
    degree: string
    date: ResumeDate
  }
  interests: readonly string[]
}
