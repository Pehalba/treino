import type { MuscleGroup, WorkoutSessionExercise } from '@/types'

export function pickNextExercise<T extends { id: string; status: string; muscleGroup: MuscleGroup; order: number }>(
  exercises: T[],
  currentId: string,
  preferDifferentMuscle: boolean,
): T | null {
  const current = exercises.find((e) => e.id === currentId)
  const stillOpen = (status: string) =>
    status === 'pending' || status === 'active' || status === 'deferred'

  if (!current) return exercises.find((e) => stillOpen(e.status)) ?? null

  const incomplete = exercises
    .filter((e) => e.id !== currentId && stillOpen(e.status))
    .sort((a, b) => a.order - b.order)

  if (incomplete.length === 0) return null

  if (preferDifferentMuscle) {
    const different = incomplete.find((e) => e.muscleGroup !== current.muscleGroup)
    if (different) return different
  }

  const after = incomplete.find((e) => e.order > current.order)
  return after ?? incomplete[0]
}

export function withMuscle<T extends WorkoutSessionExercise>(
  items: T[],
  muscleByExerciseId: Map<string, MuscleGroup>,
): Array<T & { muscleGroup: MuscleGroup }> {
  return items.map((item) => ({
    ...item,
    muscleGroup: item.muscleGroup ?? muscleByExerciseId.get(item.exerciseId) ?? 'chest',
  }))
}
