import type { JobKey, PointKey, SkillKey, ExperiencePoint, Job } from './resume.store'

// Strict per-job type — used by selectJob to enforce correct point keys at authorship.
export interface ExperienceSelectionFor<K extends JobKey> {
    id: K
    points: readonly PointKey<K>[]
}

// Distributive union over all jobs — used for rendering where K is not known.
export type ExperienceSelection = { [K in JobKey]: ExperienceSelectionFor<K> }[JobKey]

function selectJob<K extends JobKey>(id: K, points: readonly PointKey<K>[]): ExperienceSelectionFor<K> {
    return { id, points }
}

// Helper to safely access a job point from a job object.
// The selection.points array is guaranteed to contain only valid keys for its job
// because selectJob<K> validated them at authorship time.
export function getPoint(job: Job, pointKey: string): ExperiencePoint {
    return (job.points as Record<string, ExperiencePoint>)[pointKey]
}

export const ACTIVE_PROFILE = {
    skillGroups: ['languages', 'infra', 'systems'] as const satisfies readonly SkillKey[],
    experience: [
        selectJob('ouster', ['arch', 'api', 'scale', 'devops', 'mentorship']),
        selectJob('untether', ['throughput', 'multichip']),
        selectJob('cepton', ['tracking_redesign', 'lidar_camera_overlay', 'background_detector']),
        selectJob('linamar', ['cad_design', 'vba', 'ventilation']),
    ],
}
