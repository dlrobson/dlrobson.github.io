import {
  RESUME_DATA,
  type JobKey,
  type PointKey,
  type SkillKey,
} from './resume.data'

// Strict per-job type — used by selectJob to enforce correct point keys at authorship.
export interface ExperienceSelectionFor<K extends JobKey> {
  id: K
  points: readonly PointKey<K>[]
}

// Distributive union over all jobs — used for rendering where K is not known.
export type ExperienceSelection = {
  [K in JobKey]: ExperienceSelectionFor<K>
}[JobKey]

export function selectJob<K extends JobKey>(
  id: K,
  points: readonly PointKey<K>[] = [],
): ExperienceSelectionFor<K> {
  const resolved =
    points.length > 0
      ? points
      : (Object.keys(RESUME_DATA.experience[id].points) as PointKey<K>[])
  return { id, points: resolved }
}

export const ACTIVE_PROFILE = {
  skillGroups: [
    'languages',
    'infra',
    'systems',
  ] as const satisfies readonly SkillKey[],
  experience: [
    selectJob('ouster'),
    selectJob('untether', ['throughput', 'multichip', 'tools']),
    selectJob('cepton', [
      'perception_sensor_fusion',
      'tracking_optimization',
      'system_integrity',
    ]),
  ],
}
