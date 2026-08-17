import type { MuscleGroup, WorkoutSessionExercise } from '@/types'

export function isOpenExerciseStatus(item: { status: string; skipReason?: string | null }): boolean {
  if (item.status === 'skipped' || item.status === 'completed') return false
  if (item.status === 'deferred' && item.skipReason === 'cannot_today') return false
  return item.status === 'pending' || item.status === 'active' || item.status === 'deferred'
}

export function pickNextExercise<
  T extends { id: string; status: string; skipReason?: string | null; muscleGroup: MuscleGroup; order: number },
>(exercises: T[], currentId: string, preferDifferentMuscle: boolean): T | null {
  const current = exercises.find((e) => e.id === currentId)

  if (!current) return exercises.find((e) => isOpenExerciseStatus(e)) ?? null

  const incomplete = exercises
    .filter((e) => e.id !== currentId && isOpenExerciseStatus(e))
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
