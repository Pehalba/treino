import { where } from 'firebase/firestore'
import { createDoc, listDocs, patchDoc, subscribeDocs } from '@/repositories/base'
import type { Exercise } from '@/types'
import type { Unsubscribe } from 'firebase/firestore'

export const exerciseRepository = {
  listByHousehold: async (householdId: string) => {
    const items = await listDocs<Exercise>('exercises', where('householdId', '==', householdId))
    return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  },
  subscribeByHousehold: (
    householdId: string,
    onData: (items: Exercise[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe =>
    subscribeDocs<Exercise>('exercises', [where('householdId', '==', householdId)], (items) => {
      onData(items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
    }, onError),
  save: (exercise: Exercise) => createDoc('exercises', exercise),
  update: (id: string, data: Partial<Exercise>) => patchDoc('exercises', id, data),
}
