import { exerciseRepository } from '@/repositories/exerciseRepository'
import type { Exercise } from '@/types'

export const exerciseService = {
  listByHousehold: (householdId: string) => exerciseRepository.listByHousehold(householdId),
  subscribeByHousehold: exerciseRepository.subscribeByHousehold,
  alternativesOf(exercise: Exercise, catalog: Exercise[]): Exercise[] {
    const byId = new Map(catalog.map((item) => [item.id, item]))
    return exercise.alternativeIds.map((id) => byId.get(id)).filter((item): item is Exercise => Boolean(item))
  },
}
