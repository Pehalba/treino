import { workoutRepository } from '@/repositories/workoutRepository'
import { exerciseRepository } from '@/repositories/exerciseRepository'
import type {
  Exercise,
  ExerciseSet,
  PersonalRecord,
  Profile,
  ProgressionSummary,
  RirValue,
  SkipReason,
  TemplateWithMeta,
  UserRecord,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutTemplate,
} from '@/types'
import { newId } from '@/utils/ids'
import { pickNextExercise, withMuscle } from '@/utils/muscleOrder'
import { detectNewRecords, summarizeProgression } from '@/utils/progression'
import { totalVolume } from '@/utils/volume'
import { clearLocalSession, saveLocalSession, type LocalWorkoutSnapshot } from '@/utils/localSession'

export const workoutService = {
  async getTemplatesWithMeta(profileId: string, householdId?: string): Promise<TemplateWithMeta[]> {
    const [templates, allTemplateExercises, sessions] = await Promise.all([
      workoutRepository.listTemplates(profileId),
      workoutRepository.listTemplateExercisesByProfile(profileId),
      workoutRepository.listSessions(profileId, 80),
    ])
    const hid = householdId || templates[0]?.householdId || allTemplateExercises[0]?.householdId || ''
    const exercises = hid ? await exerciseRepository.listByHousehold(hid) : []

    const exerciseMap = new Map(exercises.map((item) => [item.id, item]))
    return templates.map((template) => {
      const rows = allTemplateExercises
        .filter((item) => item.templateId === template.id)
        .sort((a, b) => a.order - b.order)
      const related = sessions.filter((s) => s.workoutTemplateId === template.id && s.completed)
      const last = related[0] ?? null
      const avg =
        related.length > 0
          ? Math.round(related.reduce((sum, s) => sum + s.durationSeconds, 0) / related.length)
          : null
      return {
        ...template,
        exercises: rows.map((row) => ({ ...row, exercise: exerciseMap.get(row.exerciseId) ?? null })),
        lastSessionAt: last?.startedAt ?? null,
        averageDurationSeconds: avg,
      }
    })
  },

  recommendedTemplate(templates: TemplateWithMeta[], sessions: WorkoutSession[]): TemplateWithMeta | null {
    if (templates.length === 0) return null
    const last = sessions.find((s) => s.completed)
    if (!last) return templates[0]
    const index = templates.findIndex((t) => t.id === last.workoutTemplateId)
    if (index < 0) return templates[0]
    return templates[(index + 1) % templates.length]
  },

  async startSession(params: {
    user: UserRecord
    profile: Profile
    template: WorkoutTemplate
  }): Promise<{ session: WorkoutSession; exercises: WorkoutSessionExercise[] }> {
    const rows = await workoutRepository.listTemplateExercises(params.template.id)
    const session: WorkoutSession = {
      id: newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      userId: params.user.id,
      workoutTemplateId: params.template.id,
      templateName: params.template.name,
      startedAt: Date.now(),
      finishedAt: null,
      durationSeconds: 0,
      completed: false,
      totalVolume: 0,
      exercisesCompleted: 0,
      notes: '',
    }
    await workoutRepository.saveSession(session)

    const exercises: WorkoutSessionExercise[] = []
    for (const row of rows.sort((a, b) => a.order - b.order)) {
      const item: WorkoutSessionExercise = {
        id: newId(),
        profileId: params.profile.id,
        householdId: params.profile.householdId,
        workoutSessionId: session.id,
        exerciseId: row.exerciseId,
        originalExerciseId: row.exerciseId,
        order: row.order,
        sets: row.sets,
        repMin: row.repMin,
        repMax: row.repMax,
        restSeconds: row.restSeconds,
        status: row.order === 0 ? 'active' : 'pending',
        substituted: false,
        substituteOnlyToday: false,
        skipReason: null,
        notes: '',
      }
      await workoutRepository.saveSessionExercise(item)
      exercises.push(item)
    }

    this.persistLocal({
      session,
      exercises,
      sets: [],
      currentExerciseId: exercises[0]?.id ?? null,
      updatedAt: Date.now(),
    })

    return { session, exercises }
  },

  async findActiveSession(profileId: string): Promise<WorkoutSession | null> {
    const open = await workoutRepository.listIncompleteSessions(profileId)
    return open[0] ?? null
  },

  async loadSessionBundle(sessionId: string): Promise<{
    session: WorkoutSession
    exercises: WorkoutSessionExercise[]
    sets: ExerciseSet[]
  } | null> {
    const session = await workoutRepository.getSession(sessionId)
    if (!session) return null
    const [exercises, sets] = await Promise.all([
      workoutRepository.listSessionExercises(sessionId),
      workoutRepository.listSetsBySession(sessionId),
    ])
    return { session, exercises, sets }
  },

  async lastSetsForExercise(profileId: string, exerciseId: string, excludeSessionId?: string): Promise<ExerciseSet[]> {
    const all = await workoutRepository.listSetsByExercise(profileId, exerciseId)
    const completed = all.filter((s) => s.completed && s.workoutSessionId !== excludeSessionId)
    if (completed.length === 0) return []
    const lastSessionId = completed[0].workoutSessionId
    return completed
      .filter((s) => s.workoutSessionId === lastSessionId)
      .sort((a, b) => a.setNumber - b.setNumber)
  },

  async completeSet(params: {
    user: UserRecord
    profile: Profile
    session: WorkoutSession
    sessionExercise: WorkoutSessionExercise
    setNumber: number
    weight: number
    reps: number
    rir: RirValue
    snapshot: LocalWorkoutSnapshot
  }): Promise<ExerciseSet> {
    const set: ExerciseSet = {
      id: newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      userId: params.user.id,
      exerciseId: params.sessionExercise.exerciseId,
      workoutSessionId: params.session.id,
      sessionExerciseId: params.sessionExercise.id,
      setNumber: params.setNumber,
      weight: params.weight,
      reps: params.reps,
      rir: params.rir,
      completed: true,
      createdAt: Date.now(),
    }
    await workoutRepository.saveSet(set)
    const sets = [...params.snapshot.sets.filter((s) => s.id !== set.id), set]
    this.persistLocal({ ...params.snapshot, sets, updatedAt: Date.now() })
    return set
  },

  async completeExercise(params: {
    profile: Profile
    session: WorkoutSession
    sessionExercise: WorkoutSessionExercise
    todaySets: ExerciseSet[]
  }): Promise<ProgressionSummary> {
    await workoutRepository.updateSessionExercise(params.sessionExercise.id, { status: 'completed' })
    const previous = await this.lastSetsForExercise(
      params.profile.id,
      params.sessionExercise.exerciseId,
      params.session.id,
    )
    const history = await workoutRepository.listSetsByExercise(
      params.profile.id,
      params.sessionExercise.exerciseId,
    )
    const records = detectNewRecords(params.todaySets, history, params.session.id)
    for (const record of records) {
      const row: PersonalRecord = {
        id: newId(),
        profileId: params.profile.id,
        householdId: params.profile.householdId,
        exerciseId: params.sessionExercise.exerciseId,
        ...record,
      }
      await workoutRepository.saveRecord(row)
    }
    const base = summarizeProgression(params.todaySets, previous, params.sessionExercise.repMax)
    return {
      ...base,
      isRecord: records.length > 0,
      recordTypes: records.map((r) => r.type),
    }
  },

  async deferAndGoNext(params: {
    exercises: WorkoutSessionExercise[]
    catalog: Exercise[]
    current: WorkoutSessionExercise
    reason: SkipReason
    preferDifferentMuscle: boolean
  }): Promise<WorkoutSessionExercise | null> {
    await workoutRepository.updateSessionExercise(params.current.id, {
      status: 'deferred',
      skipReason: params.reason,
    })
    const muscleByExerciseId = new Map(params.catalog.map((e) => [e.id, e.muscleGroup]))
    const decorated = withMuscle(
      params.exercises.map((item) =>
        item.id === params.current.id ? { ...item, status: 'deferred' as const } : item,
      ),
      muscleByExerciseId,
    )
    const next = pickNextExercise(decorated, params.current.id, params.preferDifferentMuscle)
    if (next) {
      await workoutRepository.updateSessionExercise(next.id, { status: 'active' })
    }
    return next
  },

  async substituteExercise(params: {
    sessionExercise: WorkoutSessionExercise
    newExerciseId: string
    onlyToday: boolean
  }): Promise<void> {
    await workoutRepository.updateSessionExercise(params.sessionExercise.id, {
      exerciseId: params.newExerciseId,
      substituted: true,
      substituteOnlyToday: params.onlyToday,
      notes: `Substituído de ${params.sessionExercise.originalExerciseId}`,
    })
  },

  async finishSession(params: {
    profileId: string
    session: WorkoutSession
    exercises: WorkoutSessionExercise[]
    sets: ExerciseSet[]
  }): Promise<WorkoutSession> {
    const finishedAt = Date.now()
    const completedExercises = params.exercises.filter((e) => e.status === 'completed').length
    const volume = totalVolume(params.sets)
    const updated: WorkoutSession = {
      ...params.session,
      finishedAt,
      durationSeconds: Math.max(0, Math.round((finishedAt - params.session.startedAt) / 1000)),
      completed: true,
      totalVolume: volume,
      exercisesCompleted: completedExercises,
    }
    await workoutRepository.saveSession(updated)
    clearLocalSession(params.profileId)
    return updated
  },

  persistLocal(snapshot: LocalWorkoutSnapshot): void {
    saveLocalSession(snapshot.session.profileId, snapshot)
  },

  subscribeTemplates: workoutRepository.subscribeTemplates,
  subscribeSessions: workoutRepository.subscribeSessions,
  subscribeSessionExercises: workoutRepository.subscribeSessionExercises,
  subscribeSetsBySession: workoutRepository.subscribeSetsBySession,
  listSessions: workoutRepository.listSessions,
  listSetsByExercise: workoutRepository.listSetsByExercise,
  listSetsByProfile: workoutRepository.listSetsByProfile,
  listRecords: workoutRepository.listRecords,
  updateSession: workoutRepository.updateSession,
  updateSessionExercise: workoutRepository.updateSessionExercise,
}
