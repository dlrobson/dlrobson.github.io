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
      'zone_filtering',
      'ekf_tracking',
      'clustering',
      'classification',
      'bbox_alignment',
      'eval_framework',
      'testing',
      'multi_instance',
      'auth',
      'installation',
      'code_quality',
      'dl_scaffolding',
      'multi_gpu',
      'event_system',
      'tbb',
      'devcontainers',
      'gcp_infra',
      'jenkins',
      'rust_testing',
      'argo_workflows',
    ]),
    selectJob('untether', ['throughput', 'multichip', 'tools']),
    selectJob('cepton', [
      'perception_sensor_fusion',
      'tracking_optimization',
      'system_integrity',
    ]),
  ],
}
