export type Theme = 'light' | 'system' | 'dark'

/**
 * Themes that are stored explicitly in localStorage.
 * 'system' is represented by the *absence* of a saved value.
 *
 * Note: the anti-FOUC script in src/app.html mirrors these values inline
 * because it runs before any module can be imported. Keep them in sync if
 * this list ever changes.
 */
export const EXPLICIT_THEMES = [
  'light',
  'dark',
] as const satisfies readonly Theme[]

export const CYCLE: readonly Theme[] = ['system', 'light', 'dark']
