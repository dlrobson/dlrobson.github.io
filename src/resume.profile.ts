import type { JobKey, PointKey, SkillKey } from './resume.store'

// Strict per-job type — used by selectJob to enforce correct point keys at authorship.
export interface ExperienceSelectionFor<K extends JobKey> {
    id: K
    points: readonly PointKey<K>[]
}

// Distributive union over all jobs — used for rendering where K is not known.
export type ExperienceSelection = { [K in JobKey]: ExperienceSelectionFor<K> }[JobKey]

export function selectJob<K extends JobKey>(id: K, points: readonly PointKey<K>[]): ExperienceSelectionFor<K> {
    return { id, points }
}

export const ACTIVE_PROFILE = {
    skillGroups: ['languages', 'infra', 'systems'] as const satisfies readonly SkillKey[],
    experience: [
        selectJob('ouster', ['arch', 'api', 'scale', 'devops', 'mentorship']),
        selectJob('untether', ['throughput', 'multichip']),
        selectJob('cepton', ['tracking', 'calibration']),
    ],
}
