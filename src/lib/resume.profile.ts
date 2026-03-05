import type { JobKey, PointKey, SkillKey } from './resume.data'

// Strict per-job type — used by selectJob to enforce correct point keys at authorship.
export interface ExperienceSelectionFor<K extends JobKey> {
  id: K
  points: readonly PointKey<K>[]
}

// Distributive union over all jobs — used for rendering where K is not known.
export type ExperienceSelection = {
  [K in JobKey]: ExperienceSelectionFor<K>
}[JobKey]

function selectJob<K extends JobKey>(
  id: K,
  points: readonly PointKey<K>[],
): ExperienceSelectionFor<K> {
  return { id, points }
}

export const ACTIVE_PROFILE = {
  skillGroups: [
    'languages',
    'infra',
    'systems',
  ] as const satisfies readonly SkillKey[],
  experience: [
    selectJob('ouster', [
      'arch',
      'api',
      'scale',
      'devops',
      'mentorship',
      'auth',
      'perception_kalman',
      'eval_metrics',
      'classification',
      'tracking_perf',
      'rust_actuator',
      'integration_tests',
    ]),
    selectJob('untether', ['throughput', 'multichip']),
    selectJob('cepton', [
      'tracking_redesign',
      'lidar_camera_overlay',
      'background_detector',
    ]),
  ],
}
