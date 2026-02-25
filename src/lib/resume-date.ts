/**
 * Full month names for display formatting.
 * Using Intl.DateTimeFormat would be more locale-aware, but a static array
 * keeps the output deterministic and avoids locale-dependent surprises.
 */
const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Represents a year-month date (e.g. "2022-05"), or null for an ongoing/present date.
 */
export class ResumeDate {
    constructor(private readonly iso: string | null) { }

    /**
     * ISO month string for use in `<time datetime="...">`.
     *
     * **Note:** When `iso` is null (i.e. the date represents "Present"),
     * this getter returns today's YYYY-MM. This means the return value
     * is not stable across months — it intentionally tracks the current
     * date so that "Present" jobs always show an up-to-date datetime attribute.
     */
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
