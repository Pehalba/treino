export type WorkoutGroup = 'upper' | 'lower'
export type WorkoutVariant = 'a' | 'b'

export type WorkoutLabel = {
  group: WorkoutGroup | null
  variant: WorkoutVariant | null
}

export const WORKOUT_VARIANT_COLORS: Record<WorkoutVariant, string> = {
  a: '#B8FF3D',
  b: '#7EC8FF',
}

export function parseWorkoutLabel(name: string): WorkoutLabel {
  const text = name.trim().toLowerCase()
  const group: WorkoutGroup | null = text.includes('upper') ? 'upper' : text.includes('lower') ? 'lower' : null
  const variant: WorkoutVariant | null = /\bb\b/.test(text) ? 'b' : /\ba\b/.test(text) ? 'a' : null
  return { group, variant }
}
