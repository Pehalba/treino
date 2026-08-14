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
  WorkoutTemplateExercise,
} from '@/types'
import { isLive } from '@/utils/audit'
import { newId } from '@/utils/ids'
import { pickNextExercise, withMuscle } from '@/utils/muscleOrder'
import { detectNewRecords, summarizeProgression } from '@/utils/progression'
import { totalVolume } from '@/utils/volume'
import { getLastLoad, saveLastLoad } from '@/utils/exerciseLoad'
import { clearLocalSession, loadLocalSession, saveLocalSession, type LocalWorkoutSnapshot } from '@/utils/localSession'

/** Treino aberto há mais que isso é encerrado sozinho (como “Finalizar todo o treino”). */
export const MAX_WORKOUT_DURATION_MS = 2.5 * 60 * 60 * 1000

/** Evita cancelar um treino antes da criação no Firestore terminar (senão a gravação “ressuscita” a sessão). */
const pendingSessionWrites = new Map<string, Promise<void>>()
const expiringSessions = new Set<string>()
/** Sessões em encerramento/cancelamento — ignora persistLocal para não “ressuscitar” no aparelho. */
const sealedSessionIds = new Set<string>()

function isStaleOpenSession(session: WorkoutSession): boolean {
  if (session.completed) return false
  return Date.now() - session.startedAt >= MAX_WORKOUT_DURATION_MS
}

function sealSession(sessionId: string, profileId: string): void {
  sealedSessionIds.add(sessionId)
  clearLocalSession(profileId)
}

function unsealSession(sessionId: string): void {
  sealedSessionIds.delete(sessionId)
}

export const workoutService = {
  async getHomeBundle(
    profileId: string,
    householdId?: string,
  ): Promise<{ templates: TemplateWithMeta[]; sessions: WorkoutSession[] }> {
    const hid = householdId ?? ''
    const [templates, allTemplateExercises, sessions] = await Promise.all([
      workoutRepository.listTemplates(profileId),
      workoutRepository.listTemplateExercisesByProfile(profileId),
      workoutRepository.listSessions(profileId, 40),
    ])
    // Catálogo não bloqueia a home — nomes completos entram ao iniciar o treino.
    let catalog: Exercise[] = []
    if (hid) {
      try {
        catalog = await Promise.race([
          exerciseRepository.listByHousehold(hid),
          new Promise<Exercise[]>((resolve) => {
            setTimeout(() => resolve([]), 1500)
          }),
        ])
      } catch {
        catalog = []
      }
    }

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
    template: WorkoutTemplate | TemplateWithMeta
  }): Promise<{ session: WorkoutSession; exercises: WorkoutSessionExercise[] }> {
    const meta = params.template as TemplateWithMeta
    const fromMeta =
      Array.isArray(meta.exercises) &&
      meta.exercises.length > 0 &&
      meta.exercises.some((row) => row.exercise?.name)
        ? meta.exercises.filter(isLive).sort((a, b) => a.order - b.order)
        : null

    let rows: Array<WorkoutTemplateExercise & { exercise?: Exercise | null }>
    if (fromMeta) {
      rows = fromMeta
    } else {
      const [allRows, catalog] = await Promise.all([
        workoutRepository.listTemplateExercises(params.template.id),
        exerciseRepository.listByHousehold(params.profile.householdId),
      ])
      const catalogMap = new Map(catalog.map((item) => [item.id, item]))
      rows = allRows
        .filter(isLive)
        .sort((a, b) => a.order - b.order)
        .map((row) => ({ ...row, exercise: catalogMap.get(row.exerciseId) ?? null }))
    }

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
      const exercise = row.exercise
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

    const snapshot = {
      session,
      exercises,
      sets: [] as ExerciseSet[],
      currentExerciseId: exercises[0]?.id ?? null,
      updatedAt: Date.now(),
    }
    this.persistLocal(snapshot)

    const write = commitAll([
      { collection: 'workoutSessions', data: session },
      ...exercises.map((item) => ({ collection: 'workoutSessionExercises', data: item })),
    ]).then(() => undefined)
    pendingSessionWrites.set(session.id, write)
    void write
      .catch((err) => {
        console.error('Falha ao gravar sessão do treino', err)
      })
      .finally(() => {
        pendingSessionWrites.delete(session.id)
      })

    return { session, exercises }
  },

  async findActiveSession(profileId: string): Promise<WorkoutSession | null> {
    const open = await workoutRepository.listIncompleteSessions(profileId)
    return open.find((session) => !isStaleOpenSession(session)) ?? null
  },

  /**
   * Encerra treinos esquecidos (abertos há mais de 2h30) com as cargas da última vez.
   */
  async expireStaleOpenSessions(params: {
    user: UserRecord
    profile: Profile
  }): Promise<WorkoutSession[]> {
    const open = await workoutRepository.listIncompleteSessions(params.profile.id)
    const local = loadLocalSession(params.profile.id)
    const candidates = [...open]
    if (
      local &&
      !local.session.completed &&
      !candidates.some((item) => item.id === local.session.id)
    ) {
      candidates.push(local.session)
    }

    const closed: WorkoutSession[] = []
    for (const session of candidates) {
      if (!isStaleOpenSession(session)) continue
      if (expiringSessions.has(session.id)) continue
      expiringSessions.add(session.id)
      try {
        const bundle = await this.loadSessionBundle(session.id)
        const localMatch = local?.session.id === session.id ? local : null
        const exercises = bundle?.exercises?.length
          ? bundle.exercises
          : (localMatch?.exercises ?? [])
        const sets = bundle?.sets?.length ? bundle.sets : (localMatch?.sets ?? [])
        const result = await this.completeSessionAsLastTime({
          user: params.user,
          profile: params.profile,
          session: bundle?.session ?? session,
          exercises,
          sets,
          autoExpired: true,
        })
        closed.push(result.session)
      } catch (err) {
        console.error(err)
      } finally {
        expiringSessions.delete(session.id)
      }
    }
    return closed
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
    try {
      const all = await workoutRepository.listSetsByExercise(profileId, exerciseId)
      const completed = all.filter((s) => s.completed && s.workoutSessionId !== excludeSessionId)
      if (completed.length === 0) return []
      const lastSessionId = completed[0].workoutSessionId
      return completed
        .filter((s) => s.workoutSessionId === lastSessionId)
        .sort((a, b) => a.setNumber - b.setNumber)
    } catch (err) {
      console.error(err)
      return []
    }
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

  async updateSet(params: {
    set: ExerciseSet
    weight: number
    reps: number
    profileId: string
    exerciseId: string
    snapshot: LocalWorkoutSnapshot
  }): Promise<ExerciseSet> {
    const weight = Math.max(0, params.weight)
    const reps = Math.max(0, Math.round(params.reps))
    const updated: ExerciseSet = {
      ...params.set,
      weight,
      reps,
    }
    await workoutRepository.saveSet(updated)
    const sets = params.snapshot.sets.map((item) => (item.id === updated.id ? updated : item))
    this.persistLocal({ ...params.snapshot, sets, updatedAt: Date.now() })
    saveLastLoad(params.profileId, params.exerciseId, { weight, reps })
    return updated
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
    autoExpired?: boolean
  }): Promise<WorkoutSession> {
    // Limpa o aparelho na hora — se o app fechar no meio da rede, não reabre como “em andamento”.
    sealSession(params.session.id, params.profileId)

    const maxMs = MAX_WORKOUT_DURATION_MS
    const elapsedMs = Math.max(0, Date.now() - params.session.startedAt)
    const finishedAt = params.autoExpired
      ? params.session.startedAt + Math.min(elapsedMs, maxMs)
      : Date.now()
    const completedExercises = params.exercises.filter((e) => e.status === 'completed').length
    const volume = totalVolume(params.sets)
    const withoutData = params.completedWithoutData === true || params.autoExpired === true
    const note = params.autoExpired
      ? 'Encerrado automaticamente após 2h30 (igual à última vez).'
      : 'Concluído sem registrar (igual à última vez).'
    const updated: WorkoutSession = {
      ...params.session,
      finishedAt,
      durationSeconds: Math.max(0, Math.round((finishedAt - params.session.startedAt) / 1000)),
      completed: true,
      completedWithoutData: withoutData,
      totalVolume: volume,
      exercisesCompleted: completedExercises,
      notes: withoutData
        ? params.session.notes
          ? `${params.session.notes}\n${note}`
          : note
        : params.session.notes,
    }
    try {
      await workoutRepository.saveSession(updated)
    } catch (err) {
      unsealSession(params.session.id)
      throw err
    } finally {
      clearLocalSession(params.profileId)
    }
    return updated
  },

  /** Preenche séries faltantes com as cargas da última vez e marca o exercício como concluído. */
  async completeExerciseAsLastTime(params: {
    user: UserRecord
    profile: Profile
    session: WorkoutSession
    exercise: WorkoutSessionExercise
    sets: ExerciseSet[]
  }): Promise<{ exercise: WorkoutSessionExercise; sets: ExerciseSet[] }> {
    let nextSets = [...params.sets]
    const exercise = params.exercise

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

    await workoutRepository.updateSessionExercise(exercise.id, { status: 'completed' })
    const updatedExercise = { ...exercise, status: 'completed' as const }

    const lastDone = todaySets[todaySets.length - 1]
    if (lastDone) {
      saveLastLoad(params.profile.id, exercise.exerciseId, {
        weight: lastDone.weight,
        reps: lastDone.reps,
      })
    }

    return { exercise: updatedExercise, sets: nextSets }
  },

  /**
   * Fecha o treino sem a pessoa digitar série a série.
   * Para cada exercício pendente, copia peso/reps da última sessão (ou da última carga salva).
   */
  async completeSessionAsLastTime(params: {
    user: UserRecord
    profile: Profile
    session: WorkoutSession
    exercises: WorkoutSessionExercise[]
    sets: ExerciseSet[]
    autoExpired?: boolean
  }): Promise<{ session: WorkoutSession; exercises: WorkoutSessionExercise[]; sets: ExerciseSet[] }> {
    let nextExercises = [...params.exercises]
    let nextSets = [...params.sets]

    for (const exercise of params.exercises) {
      if (exercise.status === 'skipped' || exercise.status === 'completed') continue
      const result = await this.completeExerciseAsLastTime({
        user: params.user,
        profile: params.profile,
        session: params.session,
        exercise,
        sets: nextSets,
      })
      nextSets = result.sets
      nextExercises = nextExercises.map((item) =>
        item.id === exercise.id ? result.exercise : item,
      )
    }

    const finished = await this.finishSession({
      profileId: params.profile.id,
      session: params.session,
      exercises: nextExercises,
      sets: nextSets,
      completedWithoutData: true,
      autoExpired: params.autoExpired === true,
    })

    return { session: finished, exercises: nextExercises, sets: nextSets }
  },

  async discardSession(params: {
    profileId: string
    session: WorkoutSession
    exercises: WorkoutSessionExercise[]
    sets: ExerciseSet[]
  }): Promise<void> {
    // Some imediatamente do aparelho (X / cancelar); a limpeza na nuvem segue em seguida.
    sealSession(params.session.id, params.profileId)

    const pending = pendingSessionWrites.get(params.session.id)
    if (pending) {
      try {
        await pending
      } catch {
        /* criação falhou — ainda assim limpamos o que existir */
      }
    }

    const records = (await workoutRepository.listRecords(params.profileId)).filter(
      (record) => record.sessionId === params.session.id,
    )
    try {
      await deleteAll([
        ...params.sets.map((item) => ({ collection: 'exerciseSets', id: item.id })),
        ...params.exercises.map((item) => ({ collection: 'workoutSessionExercises', id: item.id })),
        ...records.map((item) => ({ collection: 'personalRecords', id: item.id })),
        { collection: 'workoutSessions', id: params.session.id },
      ])
    } catch (err) {
      unsealSession(params.session.id)
      throw err
    } finally {
      clearLocalSession(params.profileId)
      pendingSessionWrites.delete(params.session.id)
    }
  },

  persistLocal(snapshot: LocalWorkoutSnapshot): void {
    if (sealedSessionIds.has(snapshot.session.id) || snapshot.session.completed) return
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
