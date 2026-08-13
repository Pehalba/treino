import { where } from 'firebase/firestore'
import { createDoc, listDocs, subscribeDocs } from '@/repositories/base'
import type { BodyMeasurement, WeightEntry } from '@/types'
import type { Unsubscribe } from 'firebase/firestore'

export const weightRepository = {
  save: (entry: WeightEntry) => createDoc('weightEntries', entry),
  list: async (profileId: string) =>
    (await listDocs<WeightEntry>('weightEntries', where('profileId', '==', profileId))).sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
  subscribe: (
    profileId: string,
    onData: (items: WeightEntry[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe =>
    subscribeDocs<WeightEntry>(
      'weightEntries',
      [where('profileId', '==', profileId)],
      (items) => onData(items.sort((a, b) => b.date.localeCompare(a.date))),
      onError,
    ),
  saveMeasurement: (entry: BodyMeasurement) => createDoc('bodyMeasurements', entry),
  listMeasurements: async (profileId: string) =>
    (await listDocs<BodyMeasurement>('bodyMeasurements', where('profileId', '==', profileId))).sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
}
