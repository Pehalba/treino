import { commitAll, deleteAll } from '@/repositories/base'
import { exerciseRepository } from '@/repositories/exerciseRepository'
import { workoutRepository } from '@/repositories/workoutRepository'
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
import { isLive } from '@/utils/audit'
import { newId } from '@/utils/ids'
import { pickNextExercise, withMuscle } from '@/utils/muscleOrder'
import { detectNewRecords, summarizeProgression } from '@/utils/progression'
import { totalVolume } from '@/utils/volume'
import { getLastLoad, saveLastLoad } from '@/utils/exerciseLoad'
import { clearLocalSession, saveLocalSession, type LocalWorkoutSnapshot } from '@/utils/localSession'

export const workoutService = {
  async getHomeBundle(
    profileId: string,
    householdId?: string,
  ): Promise<{ templates: TemplateWithMeta[]; sessions: WorkoutSession[] }> {
    const hid = householdId ?? ''
    const [templates, allTemplateExercises, sessions, exercises] = await Promise.all([
      workoutRepository.listTemplates(profileId),
      workoutRepository.listTemplateExercisesByProfile(profileId),
      workoutRepository.listSessions(profileId, 40),
      hid ? exerciseRepository.listByHousehold(hid) : Promise.resolve([]),
    ])
    const catalog = exercises.length
      ? exercises
      : templates[0]?.householdId
        ? await exerciseRepository.listByHousehold(templates[0].householdId)
        : []

    const exerciseMap = new Map(catalog.map((item) => [item.id, item]))
    return {
      sessions,
      templates: templates.filter(isLive).map((template) => {
        const rows = allTemplateExercises
          .filter((item) => item.templateId === template.id && isLive(item))
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
      }),
    }
  },

  async getTemplatesWithMeta(profileId: string, householdId?: string): Promise<TemplateWithMeta[]> {
    const { templates } = await this.getHomeBundle(profileId, householdId)
    return templates
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
    const [allRows, catalog] = await Promise.all([
      workoutRepository.listTemplateExercises(params.template.id),
      exerciseRepository.listByHousehold(params.profile.householdId),
    ])
    const rows = allRows.filter(isLive).sort((a, b) => a.order - b.order)
    const catalogMap = new Map(catalog.map((item) => [item.id, item]))
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

    const exercises: WorkoutSessionExercise[] = rows.map((row, index) => {
      const exercise = catalogMap.get(row.exerciseId)
      return {
        id: newId(),
        profileId: params.profile.id,
        householdId: params.profile.householdId,
        workoutSessionId: session.id,
        exerciseId: row.exerciseId,
        originalExerciseId: row.exerciseId,
        exerciseName: exercise?.name ?? 'Exercício',
        muscleGroup: exercise?.muscleGroup ?? 'chest',
        equipment: exercise?.equipment ?? 'other',
        youtubeUrl: exercise?.youtubeUrl ?? '',
        imageUrl: exercise?.imageUrl ?? '',
        weightIncrement: exercise?.weightIncrement ?? 2,
        setsPlanned: row.sets,
        order: row.order,
        sets: row.sets,
        repMin: row.repMin,
        repMax: row.repMax,
        restSeconds: row.restSeconds,
        status: index === 0 ? 'active' : 'pending',
        substituted: false,
        substituteOnlyToday: false,
        skipReason: null,
        notes: row.notes,
      }
    })

    await commitAll([
      { collection: 'workoutSessions', data: session },
      ...exercises.map((item) => ({ collection: 'workoutSessionExercises', data: item })),
    ])

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
    newExercise: Exercise
    onlyToday: boolean
  }): Promise<void> {
    await workoutRepository.updateSessionExercise(params.sessionExercise.id, {
      exerciseId: params.newExercise.id,
      exerciseName: params.newExercise.name,
      muscleGroup: params.newExercise.muscleGroup,
      equipment: params.newExercise.equipment,
      youtubeUrl: params.newExercise.youtubeUrl,
      imageUrl: params.newExercise.imageUrl ?? '',
      weightIncrement: params.newExercise.weightIncrement,
      substituted: true,
      substituteOnlyToday: params.onlyToday,
      notes: `Substituído de ${params.sessionExercise.exerciseName || params.sessionExercise.originalExerciseId}`,
    })
  },

  async finishSession(params: {
    profileId: string
    session: WorkoutSession
    exercises: WorkoutSessionExercise[]
    sets: ExerciseSet[]
    completedWithoutData?: boolean
  }): Promise<WorkoutSession> {
    const finishedAt = Date.now()
    const completedExercises = params.exercises.filter((e) => e.status === 'completed').length
    const volume = totalVolume(params.sets)
    const updated: WorkoutSession = {
      ...params.session,
      finishedAt,
      durationSeconds: Math.max(0, Math.round((finishedAt - params.session.startedAt) / 1000)),
      completed: true,
      completedWithoutData: params.completedWithoutData === true,
      totalVolume: volume,
      exercisesCompleted: completedExercises,
      notes: params.completedWithoutData
        ? params.session.notes
          ? `${params.session.notes}\nConcluído sem registrar (igual à última vez).`
          : 'Concluído sem registrar (igual à última vez).'
        : params.session.notes,
    }
    await workoutRepository.saveSession(updated)
    clearLocalSession(params.profileId)
    return updated
  },

  /**
   * Fecha o treino sem a pessoa digitar série a série.
   * Para cada exercício pendente, copia peso/reps da última sessão (ou da última carga salva).
   * Assim a próxima abertura continua com a mesma carga — o sistema entende que foi igual.
   */
  async completeSessionAsLastTime(params: {
    user: UserRecord
    profile: Profile
    session: WorkoutSession
    exercises: WorkoutSessionExercise[]
    sets: ExerciseSet[]
  }): Promise<{ session: WorkoutSession; exercises: WorkoutSessionExercise[]; sets: ExerciseSet[] }> {
    let nextExercises = [...params.exercises]
    let nextSets = [...params.sets]

    for (const exercise of params.exercises) {
      if (exercise.status === 'skipped' || exercise.status === 'completed') continue

      const existing = nextSets
        .filter((s) => s.sessionExerciseId === exercise.id && s.completed)
        .sort((a, b) => a.setNumber - b.setNumber)
      const previous = await this.lastSetsForExercise(
        params.profile.id,
        exercise.exerciseId,
        params.session.id,
      )
      const cached = getLastLoad(params.profile.id, exercise.exerciseId)
      const fallbackWeight = previous[0]?.weight ?? cached?.weight ?? 0
      const fallbackReps = previous[0]?.reps ?? cached?.reps ?? exercise.repMin

      for (let setNumber = 1; setNumber <= exercise.sets; setNumber += 1) {
        if (existing.some((s) => s.setNumber === setNumber)) continue
        const fromLast =
          previous.find((s) => s.setNumber === setNumber) ?? previous[previous.length - 1]
        const weight = fromLast?.weight ?? fallbackWeight
        const reps = fromLast?.reps ?? fallbackReps
        const rir = (fromLast?.rir ?? 1) as RirValue
        const set: ExerciseSet = {
          id: newId(),
          profileId: params.profile.id,
          householdId: params.profile.householdId,
          userId: params.user.id,
          exerciseId: exercise.exerciseId,
          workoutSessionId: params.session.id,
          sessionExerciseId: exercise.id,
          setNumber,
          weight,
          reps,
          rir,
          completed: true,
          createdAt: Date.now(),
        }
        await workoutRepository.saveSet(set)
        nextSets = [...nextSets, set]
      }

      const todaySets = nextSets
        .filter((s) => s.sessionExerciseId === exercise.id && s.completed)
        .sort((a, b) => a.setNumber - b.setNumber)

      // Marca concluído sem gerar recorde/progressão falsa (cargas = última vez).
      await workoutRepository.updateSessionExercise(exercise.id, { status: 'completed' })
      nextExercises = nextExercises.map((item) =>
        item.id === exercise.id ? { ...item, status: 'completed' as const } : item,
      )

      const lastDone = todaySets[todaySets.length - 1]
      if (lastDone) {
        saveLastLoad(params.profile.id, exercise.exerciseId, {
          weight: lastDone.weight,
          reps: lastDone.reps,
        })
      }
    }

    const finished = await this.finishSession({
      profileId: params.profile.id,
      session: params.session,
      exercises: nextExercises,
      sets: nextSets,
      completedWithoutData: true,
    })

    return { session: finished, exercises: nextExercises, sets: nextSets }
  },

  async discardSession(params: {
    profileId: string
    session: WorkoutSession
    exercises: WorkoutSessionExercise[]
    sets: ExerciseSet[]
  }): Promise<void> {
    const records = (await workoutRepository.listRecords(params.profileId)).filter(
      (record) => record.sessionId === params.session.id,
    )
    await deleteAll([
      ...params.sets.map((item) => ({ collection: 'exerciseSets', id: item.id })),
      ...params.exercises.map((item) => ({ collection: 'workoutSessionExercises', id: item.id })),
      ...records.map((item) => ({ collection: 'personalRecords', id: item.id })),
      { collection: 'workoutSessions', id: params.session.id },
    ])
    clearLocalSession(params.profileId)
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
