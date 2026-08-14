import { limit, orderBy, where } from 'firebase/firestore'
import { createDoc, getById, listDocs, patchDoc, subscribeDocs, upsertDoc } from '@/repositories/base'
import type {
  ExerciseSet,
  PersonalRecord,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from '@/types'
import type { Unsubscribe } from 'firebase/firestore'

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order)
}

function sortSessions(items: WorkoutSession[]): WorkoutSession[] {
  return [...items].sort((a, b) => b.startedAt - a.startedAt)
}

export const workoutRepository = {
  listTemplates: async (profileId: string) =>
    sortByOrder(await listDocs<WorkoutTemplate>('workoutTemplates', where('profileId', '==', profileId))),
  subscribeTemplates: (
    profileId: string,
    onData: (items: WorkoutTemplate[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe =>
    subscribeDocs<WorkoutTemplate>('workoutTemplates', [where('profileId', '==', profileId)], (items) => onData(sortByOrder(items)), onError),
  saveTemplate: (template: WorkoutTemplate) => createDoc('workoutTemplates', template),
  getTemplate: (id: string) => getById<WorkoutTemplate>('workoutTemplates', id),
  updateTemplate: (id: string, data: Partial<WorkoutTemplate> | Record<string, unknown>) =>
    patchDoc('workoutTemplates', id, data),

  listTemplateExercises: async (templateId: string) =>
    sortByOrder(
      await listDocs<WorkoutTemplateExercise>('workoutTemplateExercises', where('templateId', '==', templateId)),
    ),
  listTemplateExercisesByProfile: (profileId: string) =>
    listDocs<WorkoutTemplateExercise>('workoutTemplateExercises', where('profileId', '==', profileId)),
  listTemplateExercisesByExercise: (exerciseId: string) =>
    listDocs<WorkoutTemplateExercise>('workoutTemplateExercises', where('exerciseId', '==', exerciseId)),
  saveTemplateExercise: (item: WorkoutTemplateExercise) => createDoc('workoutTemplateExercises', item),
  updateTemplateExercise: (id: string, data: Partial<WorkoutTemplateExercise> | Record<string, unknown>) =>
    patchDoc('workoutTemplateExercises', id, data),

  getSession: (id: string) => getById<WorkoutSession>('workoutSessions', id),
  saveSession: (session: WorkoutSession) => upsertDoc('workoutSessions', session),
  updateSession: (id: string, data: Partial<WorkoutSession>) => patchDoc('workoutSessions', id, data),
  listSessions: async (profileId: string, max = 200) =>
    sortSessions(await listDocs<WorkoutSession>('workoutSessions', where('profileId', '==', profileId))).slice(0, max),
  subscribeSessions: (
    profileId: string,
    onData: (items: WorkoutSession[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe =>
    subscribeDocs<WorkoutSession>(
      'workoutSessions',
      [where('profileId', '==', profileId)],
      (items) => onData(sortSessions(items).slice(0, 40)),
      onError,
    ),
  listIncompleteSessions: async (profileId: string) =>
    sortSessions(await listDocs<WorkoutSession>('workoutSessions', where('profileId', '==', profileId)))
      .filter((s) => !s.completed)
      .slice(0, 5),

  saveSessionExercise: (item: WorkoutSessionExercise) => upsertDoc('workoutSessionExercises', item),
  updateSessionExercise: (id: string, data: Partial<WorkoutSessionExercise>) =>
    patchDoc('workoutSessionExercises', id, data),
  listSessionExercises: async (workoutSessionId: string) =>
    sortByOrder(
      await listDocs<WorkoutSessionExercise>(
        'workoutSessionExercises',
        where('workoutSessionId', '==', workoutSessionId),
      ),
    ),
  subscribeSessionExercises: (
    workoutSessionId: string,
    onData: (items: WorkoutSessionExercise[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe =>
    subscribeDocs<WorkoutSessionExercise>(
      'workoutSessionExercises',
      [where('workoutSessionId', '==', workoutSessionId)],
      (items) => onData(sortByOrder(items)),
      onError,
    ),

  saveSet: (set: ExerciseSet) => upsertDoc('exerciseSets', set),
  listSetsBySession: async (workoutSessionId: string) =>
    (await listDocs<ExerciseSet>('exerciseSets', where('workoutSessionId', '==', workoutSessionId))).sort(
      (a, b) => a.setNumber - b.setNumber,
    ),
  subscribeSetsBySession: (
    workoutSessionId: string,
    onData: (items: ExerciseSet[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe =>
    subscribeDocs<ExerciseSet>('exerciseSets', [where('workoutSessionId', '==', workoutSessionId)], onData, onError),
  listSetsByExercise: async (profileId: string, exerciseId: string) =>
    listDocs<ExerciseSet>(
      'exerciseSets',
      where('profileId', '==', profileId),
      where('exerciseId', '==', exerciseId),
      orderBy('createdAt', 'desc'),
      limit(40),
    ),
  listSetsByProfile: async (profileId: string, max = 2000) =>
    (await listDocs<ExerciseSet>('exerciseSets', where('profileId', '==', profileId), limit(max))).sort(
      (a, b) => b.createdAt - a.createdAt,
    ),

  saveRecord: (record: PersonalRecord) => createDoc('personalRecords', record),
  listRecords: (profileId: string) =>
    listDocs<PersonalRecord>('personalRecords', where('profileId', '==', profileId)),
}
