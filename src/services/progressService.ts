import type { ExerciseSet, PersonalRecord } from '@/types'
import { isStagnant } from '@/utils/progression'
import { totalVolume, workingWeight } from '@/utils/volume'

export const progressService = {
  groupSetsBySession(sets: ExerciseSet[]): ExerciseSet[][] {
    const map = new Map<string, ExerciseSet[]>()
    const order: string[] = []
    const sorted = [...sets].filter((s) => s.completed).sort((a, b) => b.createdAt - a.createdAt)
    for (const set of sorted) {
      if (!map.has(set.workoutSessionId)) {
        map.set(set.workoutSessionId, [])
        order.push(set.workoutSessionId)
      }
      map.get(set.workoutSessionId)?.push(set)
    }
    return order.map((id) => (map.get(id) ?? []).sort((a, b) => a.setNumber - b.setNumber))
  },

  loadProgression(sets: ExerciseSet[]): {
    startWeight: number
    currentWeight: number
    percent: number
    stagnant: boolean
  } | null {
    const groups = this.groupSetsBySession(sets)
    if (groups.length === 0) return null
    const currentWeight = workingWeight(groups[0])
    const startWeight = workingWeight(groups[groups.length - 1])
    const percent = startWeight === 0 ? 0 : ((currentWeight - startWeight) / startWeight) * 100
    return {
      startWeight,
      currentWeight,
      percent,
      stagnant: isStagnant(groups),
    }
  },

  sessionVolume(sets: ExerciseSet[]): number {
    return totalVolume(sets)
  },

  recordsForExercise(records: PersonalRecord[], exerciseId: string): PersonalRecord[] {
    return records.filter((r) => r.exerciseId === exerciseId)
  },
}
