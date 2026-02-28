// ResumeDate class lives in its own module; re-export for convenience.
export { ResumeDate } from './resume-date'
import type { ResumeDate } from './resume-date'

export interface ExperiencePoint {
  category?: string
  text: string
}

export interface Job {
  title: string
  company: string
  location: string
  start: ResumeDate
  end: ResumeDate
  points: Record<string, ExperiencePoint>
}

export interface ResumeData {
  header: {
    name: string
    email: string
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
