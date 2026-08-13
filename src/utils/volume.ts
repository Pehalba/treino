import type { ExerciseSet } from '@/types'

export function setVolume(set: Pick<ExerciseSet, 'weight' | 'reps'>): number {
  return set.weight * set.reps
}

export function totalVolume(sets: Array<Pick<ExerciseSet, 'weight' | 'reps' | 'completed'>>): number {
  return sets.filter((s) => s.completed).reduce((sum, s) => sum + setVolume(s), 0)
}

export function totalReps(sets: Array<Pick<ExerciseSet, 'reps' | 'completed'>>): number {
  return sets.filter((s) => s.completed).reduce((sum, s) => sum + s.reps, 0)
}

export function workingWeight(sets: Array<Pick<ExerciseSet, 'weight' | 'completed'>>): number {
  const completed = sets.filter((s) => s.completed)
  if (completed.length === 0) return 0
  const counts = new Map<number, number>()
  for (const s of completed) {
    counts.set(s.weight, (counts.get(s.weight) ?? 0) + 1)
  }
  let best = completed[0].weight
  let bestCount = 0
  for (const [weight, count] of counts) {
    if (count > bestCount) {
      best = weight
      bestCount = count
    }
  }
  return best
}

export function bestSetScore(sets: Array<Pick<ExerciseSet, 'weight' | 'reps' | 'completed'>>): number {
  return sets
    .filter((s) => s.completed)
    .reduce((max, s) => Math.max(max, setVolume(s)), 0)
}

export function repsPattern(sets: Array<Pick<ExerciseSet, 'reps' | 'completed'>>): string {
  return sets
    .filter((s) => s.completed)
    .map((s) => s.reps)
    .join(' / ')
}
