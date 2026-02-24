const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Represents a year-month date (e.g. "2022-05"), or null for an ongoing/present date.
 */
export class ResumeDate {
    constructor(private readonly iso: string | null) {}

    /** ISO month string for use in <time datetime="...">. Returns today's YYYY-MM for null. */
    get datetime(): string {
        if (this.iso === null) {
            const now = new Date()
            const m = String(now.getMonth() + 1).padStart(2, '0')
            return `${now.getFullYear()}-${m}`
        }
        return this.iso
    }

    /** Human-readable label, e.g. "May 2022" or "Present". */
    display(): string {
        if (this.iso === null) return 'Present'
        const [year, month] = this.iso.split('-')
        return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`
    }
}

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
    }
    skills: Record<string, {
        label: string
        items: readonly string[]
    }>
    experience: Record<string, Job>
    education: {
        school: string
        degree: string
        date: ResumeDate
    }
    interests: string
}
