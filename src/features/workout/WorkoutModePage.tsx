import { WorkoutName } from '@/components/workout/WorkoutName'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  AfterSkipModal,
  ExerciseDone,
  ExerciseTimer,
  EditSetModal,
  PickWorkoutExerciseModal,
  SetForm,
  SkipModal,
  TimerDoneModal,
  TimerEditModal,
  ImageModal,
  VideoModal,
  WorkoutSummary,
} from '@/features/workout/WorkoutPieces'
import { resolveExerciseImage } from '@/data/exerciseImages'
import { useRestTimer } from '@/hooks/useRestTimer'
import { useSession } from '@/hooks/useSession'
import { exerciseService } from '@/services/exerciseService'
import { profileService } from '@/services/profileService'
import { workoutService, MAX_WORKOUT_DURATION_MS } from '@/services/workoutService'
import type {
  Exercise,
  ExerciseSet,
  ProgressionSummary,
  SkipReason,
  WorkoutSession,
  WorkoutSessionExercise,
} from '@/types'
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/types'
import { formatDateLong, formatTimer } from '@/utils/dates'
import { hapticSuccess, hapticRecord } from '@/utils/haptics'
import { loadLocalSession } from '@/utils/localSession'
import { isOpenExerciseStatus, pickNextExercise, withMuscle } from '@/utils/muscleOrder'
import { getLastLoad, saveLastLoad } from '@/utils/exerciseLoad'
import { workingWeight } from '@/utils/volume'
import { useAppStore } from '@/store/appStore'
import { AnimatePresence, motion } from 'framer-motion'
import { Minimize2, Pencil, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function WorkoutModePage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user, activeProfile, patchActiveProfile } = useSession()
  const rest = useRestTimer()

  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [exercises, setExercises] = useState<WorkoutSessionExercise[]>([])
  const [sets, setSets] = useState<ExerciseSet[]>([])
  const [catalog, setCatalog] = useState<Exercise[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [lastSets, setLastSets] = useState<ExerciseSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [weight, setWeight] = useState(0)
  const [reps, setReps] = useState(8)
  const [doneSummary, setDoneSummary] = useState<ProgressionSummary | null>(null)
  const [finished, setFinished] = useState<WorkoutSession | null>(null)
  const [closing, setClosing] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const [skipOpen, setSkipOpen] = useState(false)
  const [pendingSkipReason, setPendingSkipReason] = useState<SkipReason | null>(null)
  const [afterSkipOpen, setAfterSkipOpen] = useState(false)
  const [pickExerciseOpen, setPickExerciseOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const leavingRef = useRef(false)
  const [finishAsLastOpen, setFinishAsLastOpen] = useState(false)
  const [finishingAsLast, setFinishingAsLast] = useState(false)
  const [finishExerciseOpen, setFinishExerciseOpen] = useState(false)
  const [finishingExercise, setFinishingExercise] = useState(false)
  const [actionError, setActionError] = useState('')
  const [editingSet, setEditingSet] = useState<ExerciseSet | null>(null)
  const [editWeight, setEditWeight] = useState(0)
  const [editReps, setEditReps] = useState(0)
  const [savingEdit, setSavingEdit] = useState(false)
  const [savingSet, setSavingSet] = useState(false)
  const savingSetRef = useRef(false)
  const [timerOpen, setTimerOpen] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(2)
  const setMinimizedWorkout = useAppStore((s) => s.setMinimizedWorkout)
  const restEndsAt = useAppStore((s) => s.restEndsAt)
  const [progressions, setProgressions] = useState(0)
  const [records, setRecords] = useState(0)

  const current =
    exercises.find((e) => e.id === currentId && (e.status === 'completed' || isOpenExerciseStatus(e))) ??
    exercises.find((e) => e.status === 'active') ??
    exercises.find((e) => isOpenExerciseStatus(e))
  const exercise = catalog.find((e) => e.id === current?.exerciseId)
  const currentSets = sets.filter((s) => s.sessionExerciseId === current?.id && s.completed).sort((a, b) => a.setNumber - b.setNumber)
  const nextSetNumber = (currentSets[currentSets.length - 1]?.setNumber ?? 0) + 1
  const hasNextExercise = !!current && exercises.some((e) => e.id !== current.id && isOpenExerciseStatus(e))
  const timerSeconds = activeProfile?.timerSeconds && activeProfile.timerSeconds > 0 ? activeProfile.timerSeconds : 120

  useEffect(() => {
    setTimerMinutes(Math.round((timerSeconds / 60) * 2) / 2)
  }, [timerSeconds])

  async function saveTimer() {
    if (!user || !activeProfile) return
    const seconds = Math.round(Math.max(0.5, timerMinutes) * 60)
    await profileService.updateProfile(activeProfile.id, { timerSeconds: seconds }, user.id)
    patchActiveProfile({ timerSeconds: seconds })
    setTimerOpen(false)
  }

  useEffect(() => {
    if (!session) return
    const tick = () => setElapsed(Math.floor((Date.now() - session.startedAt) / 1000))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [session?.id, session?.startedAt])

  useEffect(() => {
    if (!sessionId || !activeProfile) return
    const id = sessionId
    const profile = activeProfile
    let unsubEx: (() => void) | undefined
    let unsubSets: (() => void) | undefined
    let alive = true

    async function boot() {
      setLoading(true)
      setError('')
      try {
        const local = loadLocalSession(profile.id)
        const localMatch = local && local.session.id === id ? local : null
        const localStale =
          localMatch &&
          !localMatch.session.completed &&
          Date.now() - localMatch.session.startedAt >= MAX_WORKOUT_DURATION_MS

        // Mostra na hora o que já está no aparelho (evita tela de loading depois de iniciar).
        if (localMatch && !localStale) {
          setSession(localMatch.session)
          setExercises(localMatch.exercises)
          setSets(localMatch.sets)
          const active =
            localMatch.exercises.find((e) => e.status === 'active') ??
            localMatch.exercises.find((e) => isOpenExerciseStatus(e)) ??
            localMatch.exercises[0]
          setCurrentId(active?.id ?? localMatch.currentExerciseId)
          setLoading(false)
          if (localMatch.restEndsAt) rest.restore(localMatch.restEndsAt)
        }

        const bundle = await workoutService.loadSessionBundle(id)
        if (!alive) return
        const exercisesData = bundle?.exercises?.length
          ? bundle.exercises
          : (localMatch?.exercises ?? [])
        const sessionData =
          bundle?.session ?? (localMatch?.session ?? null)
        const setsData = bundle?.sets?.length ? bundle.sets : (localMatch?.sets ?? [])
        if (!sessionData) {
          setError('Treino não encontrado.')
          setLoading(false)
          return
        }
        setSession(sessionData)
        setExercises(exercisesData)
        setSets(setsData)
        const stale = !sessionData.completed && Date.now() - sessionData.startedAt >= MAX_WORKOUT_DURATION_MS
        if (stale && user) {
          leavingRef.current = true
          const result = await workoutService.completeSessionAsLastTime({
            user,
            profile,
            session: sessionData,
            exercises: exercisesData,
            sets: setsData,
            autoExpired: true,
          })
          if (!alive) return
          setExercises(result.exercises)
          setSets(result.sets)
          setFinished(result.session)
          setDoneSummary(null)
          setMinimizedWorkout(null)
          setLoading(false)
          return
        }
        const active =
          exercisesData.find((e) => e.status === 'active') ??
          exercisesData.find((e) => isOpenExerciseStatus(e)) ??
          exercisesData[0]
        setCurrentId(active?.id ?? null)
        for (const row of exercisesData) {
          void workoutService.lastSetsForExercise(profile.id, row.exerciseId, id)
        }
        unsubEx = workoutService.subscribeSessionExercises(id, (items) => {
          if (leavingRef.current) return
          // Evita limpar a UI se o snapshot local chegou antes da gravação no Firestore.
          if (items.length > 0) setExercises(items)
        })
        unsubSets = workoutService.subscribeSetsBySession(id, (items) => {
          if (!leavingRef.current) setSets(items)
        })

        // Catálogo só para substitutos/foto — não bloqueia a abertura.
        void exerciseService.listByHousehold(profile.householdId).then((list) => {
          if (alive) setCatalog(list)
        })
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Falha ao abrir o treino.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void boot()
    return () => {
      alive = false
      unsubEx?.()
      unsubSets?.()
    }
  }, [sessionId, activeProfile?.id, activeProfile?.householdId, user?.id])

  useEffect(() => {
    if (!activeProfile || !current) return
    let alive = true
    setDoneSummary(null)

    const today = sets
      .filter((s) => s.sessionExerciseId === current.id && s.completed)
      .sort((a, b) => a.setNumber - b.setNumber)
    const remembered = getLastLoad(activeProfile.id, current.exerciseId)

    if (today.length) {
      const last = today[today.length - 1]
      setWeight(last.weight)
      setReps(last.reps)
    } else if (remembered && remembered.weight > 0) {
      setWeight(remembered.weight)
      setReps(remembered.reps || current.repMin)
    }

    workoutService.lastSetsForExercise(activeProfile.id, current.exerciseId, session?.id).then((prev) => {
      if (!alive) return
      setLastSets(prev)
      if (today.length) return
      if (remembered && remembered.weight > 0) return
      if (prev.length) {
        const last = prev[prev.length - 1]
        const load = workingWeight(prev)
        setWeight(load)
        setReps(last?.reps ?? current.repMin)
        saveLastLoad(activeProfile.id, current.exerciseId, { weight: load, reps: last?.reps ?? current.repMin })
      } else {
        setWeight(0)
        setReps(current.repMin)
      }
    }).catch(() => {
      if (!alive) return
      setLastSets([])
    })

    return () => {
      alive = false
    }
  }, [current?.id, current?.exerciseId, activeProfile?.id, session?.id])

  useEffect(() => {
    if (!session || !activeProfile || leavingRef.current) return
    workoutService.persistLocal({
      session,
      exercises,
      sets,
      currentExerciseId: currentId,
      updatedAt: Date.now(),
    })
  }, [session, exercises, sets, currentId, activeProfile?.id, restEndsAt])

  const pickableExercises = useMemo(() => {
    if (!current) return []
    return [...exercises]
      .filter((row) => row.id !== current.id)
      .sort((a, b) => a.order - b.order)
      .map((row) => {
        const fromCatalog = catalog.find((item) => item.id === row.exerciseId)
        const name = row.exerciseName || fromCatalog?.name || 'Exercício'
        const imageUrl = resolveExerciseImage({
          name,
          imageUrl: row.imageUrl || fromCatalog?.imageUrl,
        })
        const muscle = row.muscleGroup ?? fromCatalog?.muscleGroup ?? 'chest'
        return {
          row,
          name,
          imageUrl,
          muscleLabel: MUSCLE_LABELS[muscle],
        }
      })
  }, [catalog, current, exercises])

  function rememberLoad(nextWeight = weight, nextReps = reps) {
    if (!activeProfile || !current) return
    saveLastLoad(activeProfile.id, current.exerciseId, { weight: nextWeight, reps: nextReps })
  }

  function changeWeight(value: number) {
    setWeight(value)
    rememberLoad(value, reps)
  }

  function changeReps(value: number) {
    setReps(value)
    rememberLoad(weight, value)
  }

  function persistSnapshot(
    nextExercises: WorkoutSessionExercise[] = exercises,
    nextSets: ExerciseSet[] = sets,
    nextCurrentId: string | null = currentId,
  ) {
    if (!session) return
    workoutService.persistLocal({
      session,
      exercises: nextExercises,
      sets: nextSets,
      currentExerciseId: nextCurrentId,
      updatedAt: Date.now(),
    })
  }

  function trackSummary(summary: ProgressionSummary) {
    if (summary.kind !== 'none' && summary.kind !== 'first') setProgressions((v) => v + 1)
    if (summary.isRecord) {
      setRecords((v) => v + 1)
      hapticRecord()
    }
  }

  async function finish(
    nextExercises: WorkoutSessionExercise[] = exercises,
    nextSets: ExerciseSet[] = sets,
  ) {
    if (!session || !activeProfile) return
    leavingRef.current = true
    setClosing(true)
    setMinimizedWorkout(null)
    rest.skip()
    try {
      const updated = await workoutService.finishSession({
        profileId: activeProfile.id,
        session,
        exercises: nextExercises,
        sets: nextSets,
      })
      setSession(updated)
      setFinished(updated)
      setClosing(false)
    } catch (err) {
      leavingRef.current = false
      setClosing(false)
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o treino.')
    }
  }

  /** Sai do exercício atual e vai pro próximo (ou encerra o treino) sem tela intermediária. */
  function advanceAfterExercise(
    completedId: string,
    nextExercises: WorkoutSessionExercise[],
    nextSets: ExerciseSet[] = sets,
  ) {
    setDoneSummary(null)
    const muscleByExerciseId = new Map(catalog.map((e) => [e.id, e.muscleGroup]))
    const decorated = withMuscle(nextExercises, muscleByExerciseId)
    const next = pickNextExercise(
      decorated.map((e) => (e.id === completedId ? { ...e, status: 'completed' as const } : e)),
      completedId,
      false,
    )
    if (!next) {
      setExercises(nextExercises)
      // Não grava snapshot incompleto antes do finish — evita “treino ainda rolando” ao reabrir.
      void finish(nextExercises, nextSets)
      return
    }
    const moved = nextExercises.map((e) => {
      if (e.id === completedId) return { ...e, status: 'completed' as const }
      if (e.id === next.id) return { ...e, status: 'active' as const }
      return e
    })
    setExercises(moved)
    setCurrentId(next.id)
    persistSnapshot(moved, nextSets, next.id)
    void workoutService.updateSessionExercise(completedId, { status: 'completed' })
    void workoutService.updateSessionExercise(next.id, { status: 'active' })
  }

  async function completeSet() {
    if (!user || !activeProfile || !session || !current) return
    if (savingSetRef.current) return
    savingSetRef.current = true
    setSavingSet(true)
    const set = workoutService.buildCompletedSet({
      user,
      profile: activeProfile,
      session,
      sessionExercise: current,
      setNumber: nextSetNumber,
      weight,
      reps,
      rir: 1,
    })
    const nextSets = [...sets, set]
    const lastSet = nextSetNumber >= current.sets
    setSets(nextSets)
    hapticSuccess()
    persistSnapshot(exercises, nextSets)
    saveLastLoad(activeProfile.id, current.exerciseId, { weight, reps })

    if (lastSet) {
      const completedId = current.id
      const nextExercises = exercises.map((e) =>
        e.id === completedId ? { ...e, status: 'completed' as const } : e,
      )
      void workoutService
        .completeSet({
          user,
          profile: activeProfile,
          session,
          sessionExercise: current,
          setNumber: set.setNumber,
          weight,
          reps,
          rir: 1,
          snapshot: { session, exercises: nextExercises, sets: nextSets, currentExerciseId: currentId, updatedAt: Date.now() },
        })
        .catch((err) => console.error(err))
      void workoutService
        .completeExercise({
          profile: activeProfile,
          session,
          sessionExercise: current,
          todaySets: nextSets.filter((s) => s.sessionExerciseId === completedId),
        })
        .then(trackSummary)
        .catch((err) => console.error(err))
      window.setTimeout(() => {
        advanceAfterExercise(completedId, nextExercises, nextSets)
        savingSetRef.current = false
        setSavingSet(false)
      }, 450)
      return
    }

    try {
      await workoutService.completeSet({
        user,
        profile: activeProfile,
        session,
        sessionExercise: current,
        setNumber: set.setNumber,
        weight,
        reps,
        rir: 1,
        snapshot: { session, exercises, sets: nextSets, currentExerciseId: currentId, updatedAt: Date.now() },
      })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível salvar a série.')
    } finally {
      savingSetRef.current = false
      setSavingSet(false)
    }
  }

  function openEditSet(set: ExerciseSet) {
    setEditingSet(set)
    setEditWeight(set.weight)
    setEditReps(set.reps)
  }

  async function saveEditedSet() {
    if (!activeProfile || !session || !current || !editingSet) return
    setSavingEdit(true)
    try {
      const updated = await workoutService.updateSet({
        set: editingSet,
        weight: editWeight,
        reps: editReps,
        profileId: activeProfile.id,
        exerciseId: current.exerciseId,
        snapshot: { session, exercises, sets, currentExerciseId: currentId, updatedAt: Date.now() },
      })
      const nextSets = sets.map((item) => (item.id === updated.id ? updated : item))
      setSets(nextSets)
      persistSnapshot(exercises, nextSets)
      setEditingSet(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível editar a série.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function changePlannedSets(count: number) {
    if (!activeProfile || !session || !current) return
    const completedCount = currentSets.length
    const nextCount = Math.max(count, completedCount)
    const updated = { ...current, sets: nextCount }
    setExercises((items) => items.map((e) => (e.id === current.id ? updated : e)))
    await workoutService.updateSessionExercise(current.id, { sets: nextCount })
    persistSnapshot(
      exercises.map((e) => (e.id === current.id ? updated : e)),
      sets,
    )

    if (completedCount > 0 && nextCount <= completedCount) {
      const completedId = current.id
      const nextExercises = exercises.map((e) =>
        e.id === completedId ? { ...e, status: 'completed' as const, sets: nextCount } : e,
      )
      advanceAfterExercise(completedId, nextExercises, currentSets)
      void workoutService
        .completeExercise({
          profile: activeProfile,
          session,
          sessionExercise: updated,
          todaySets: currentSets,
        })
        .then(trackSummary)
        .catch((err) => console.error(err))
    }
  }

  function goNext() {
    if (!current) return
    const nextExercises = exercises.map((e) =>
      e.id === current.id ? { ...e, status: 'completed' as const } : e,
    )
    advanceAfterExercise(current.id, nextExercises, sets)
  }

  function applySkip(reason: SkipReason) {
    setSkipOpen(false)
    setPendingSkipReason(reason)
    setAfterSkipOpen(true)
  }

  async function leaveCurrent(targetId?: string | null) {
    if (!current || !pendingSkipReason) return
    setActionError('')
    try {
      rest.skip()
      const leaveStatus = pendingSkipReason === 'cannot_today' ? ('skipped' as const) : ('deferred' as const)
      const next = await workoutService.leaveCurrentAndGoTo({
        exercises,
        catalog,
        current,
        reason: pendingSkipReason,
        targetId,
      })
      const moved = exercises.map((e) => {
        if (e.id === current.id) return { ...e, status: leaveStatus, skipReason: pendingSkipReason }
        if (next && e.id === next.id) return { ...e, status: 'active' as const }
        return e
      })
      setExercises(moved)
      setAfterSkipOpen(false)
      setPickExerciseOpen(false)
      setPendingSkipReason(null)
      if (next) {
        setCurrentId(next.id)
        persistSnapshot(moved, sets, next.id)
      } else {
        await finish(moved)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível mudar de exercício.')
    }
  }

  async function finishAsLastTime() {
    if (!user || !session || !activeProfile) return
    setFinishingAsLast(true)
    leavingRef.current = true
    setClosing(true)
    setMinimizedWorkout(null)
    setActionError('')
    try {
      rest.skip()
      const result = await workoutService.completeSessionAsLastTime({
        user,
        profile: activeProfile,
        session,
        exercises,
        sets,
      })
      setExercises(result.exercises)
      setSets(result.sets)
      setSession(result.session)
      setFinished(result.session)
      setDoneSummary(null)
      setFinishAsLastOpen(false)
      setFinishingAsLast(false)
      setClosing(false)
    } catch (err) {
      leavingRef.current = false
      setClosing(false)
      setActionError(err instanceof Error ? err.message : 'Não foi possível concluir o treino.')
      setFinishingAsLast(false)
    }
  }

  async function finishExerciseAsLastTime() {
    if (!user || !session || !activeProfile || !current) return
    setFinishingExercise(true)
    setActionError('')
    try {
      rest.skip()
      const result = await workoutService.completeExerciseAsLastTime({
        user,
        profile: activeProfile,
        session,
        exercise: current,
        sets,
      })
      const nextExercises = exercises.map((e) => (e.id === current.id ? result.exercise : e))
      setExercises(nextExercises)
      setSets(result.sets)
      persistSnapshot(nextExercises, result.sets)
      setFinishExerciseOpen(false)
      setFinishingExercise(false)
      hapticSuccess()
      advanceAfterExercise(current.id, nextExercises, result.sets)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível concluir o exercício.')
      setFinishingExercise(false)
    }
  }

  function reopenCompletedExercise(exercise: WorkoutSessionExercise) {
    if (exercise.status !== 'completed') return
    setCurrentId(exercise.id)
    setDoneSummary({
      kind: 'none',
      message: 'Exercício já concluído — você pode editar as séries.',
      targetHit: false,
      isRecord: false,
      recordTypes: [],
    })
  }

  function minimize() {
    if (!session) return
    setMinimizedWorkout({ id: session.id, name: session.templateName })
    navigate('/')
  }

  async function discard() {
    if (!session || !activeProfile) return
    setCancelling(true)
    leavingRef.current = true
    setMinimizedWorkout(null)
    try {
      rest.skip()
      await workoutService.discardSession({
        profileId: activeProfile.id,
        session,
        exercises,
        sets,
      })
      setCancelOpen(false)
      setSession(null)
      setExercises([])
      setSets([])
      navigate('/', { replace: true })
    } catch (err) {
      leavingRef.current = false
      setCancelling(false)
      setError(err instanceof Error ? err.message : 'Não foi possível cancelar o treino.')
    }
  }

  if ((loading || cancelling || closing) && !finished) {
    return (
      <div className="min-h-svh bg-bg p-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="mt-6 h-72" />
        {closing ? (
          <p className="mt-4 text-center text-sm text-muted">Encerrando treino…</p>
        ) : null}
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-svh bg-bg p-4">
        <ErrorState message={error || 'Não foi possível abrir o treino.'} onRetry={() => navigate('/')} />
      </div>
    )
  }

  if (finished || session.completed) {
    const done = finished ?? session
    const historyMode = session.completed && !finished
    const orderedExercises = [...exercises].sort((a, b) => a.order - b.order)
    const exerciseDetails = orderedExercises.map((ex) => ({
      name: ex.exerciseName || catalog.find((c) => c.id === ex.exerciseId)?.name || 'Exercício',
      status: ex.status,
      sets: sets
        .filter((s) => s.sessionExerciseId === ex.id && s.completed)
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((s) => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps })),
    }))
    return (
      <WorkoutSummary
        name={done.templateName}
        duration={done.durationSeconds || elapsed}
        completed={done.exercisesCompleted || exercises.filter((e) => e.status === 'completed').length}
        total={exercises.length}
        sets={sets.filter((s) => s.completed).length}
        progressions={progressions}
        records={records}
        volume={done.totalVolume}
        withoutData={done.completedWithoutData === true}
        historyMode={historyMode}
        dateLabel={historyMode ? formatDateLong(done.startedAt) : undefined}
        exerciseDetails={exerciseDetails}
        onHome={() => navigate(historyMode ? '/treinos' : '/')}
      />
    )
  }

  if (!current) {
    // Sessão sem exercício ativo (ex.: cancelamento) — volta pra home em vez de erro falso.
    return (
      <div className="min-h-svh bg-bg p-4">
        <ErrorState
          message="Este treino não tem exercício em andamento."
          onRetry={() => navigate('/', { replace: true })}
        />
      </div>
    )
  }

  const exerciseName = current.exerciseName || exercise?.name || 'Exercício'
  const muscleGroup = current.muscleGroup || exercise?.muscleGroup || 'chest'
  const equipment = current.equipment || exercise?.equipment || 'other'
  const youtubeUrl = current.youtubeUrl || exercise?.youtubeUrl || ''
  const imageUrl = resolveExerciseImage({
    name: exerciseName,
    imageUrl: current.imageUrl || exercise?.imageUrl,
  })
  const weightIncrement = current.weightIncrement || exercise?.weightIncrement || 2

  const index = exercises.findIndex((e) => e.id === current.id)

  return (
    <div className="min-h-svh bg-bg px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:pt-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg">
            <WorkoutName name={session.templateName} iconClassName="h-6 w-6" />
          </p>
          <p className="mt-1 text-sm">
            Exercício {index + 1} de {exercises.length}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {exercises.map((e, i) => {
              const done = e.status === 'completed'
              const skipped = e.status === 'skipped'
              const active = e.id === current.id
              return (
                <button
                  key={e.id}
                  type="button"
                  disabled={!done && !active}
                  title={
                    skipped
                      ? `Exercício ${i + 1} pulado hoje`
                      : done
                        ? `Revisar exercício ${i + 1}`
                        : `Exercício ${i + 1}`
                  }
                  aria-label={
                    skipped
                      ? `Exercício ${i + 1} pulado`
                      : done
                        ? `Editar séries do exercício ${i + 1}`
                        : `Exercício ${i + 1}`
                  }
                  onClick={() => {
                    if (done) reopenCompletedExercise(e)
                  }}
                  className={
                    done
                      ? 'h-2.5 w-2.5 rounded-full bg-accent'
                      : skipped
                        ? 'h-2.5 w-2.5 rounded-full bg-card2 opacity-40'
                        : e.status === 'deferred'
                          ? 'h-2.5 w-2.5 rounded-full bg-warn'
                          : active
                            ? 'h-2.5 w-2.5 rounded-full bg-ink'
                            : 'h-2.5 w-2.5 rounded-full bg-card2'
                  }
                />
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted">Pontinho verde = exercício feito (toque para editar)</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-11 items-center gap-1 rounded-2xl bg-card2 px-3 text-sm font-semibold"
              onClick={minimize}
            >
              <Minimize2 size={16} />
              Minimizar
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card2 text-danger"
              aria-label="Cancelar treino"
              onClick={() => setCancelOpen(true)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Tempo</p>
            <p className="font-display text-lg">{formatTimer(elapsed)}</p>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + (doneSummary ? '-done' : '')}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
        >
          <h1 className="mt-8 font-display text-3xl leading-tight sm:text-4xl">{exerciseName}</h1>
          <p className="mt-2 text-muted">
            {MUSCLE_LABELS[muscleGroup]} · {EQUIPMENT_LABELS[equipment]}
          </p>
          <p className="mt-4 text-sm">
            Meta: <strong>{current.sets} séries</strong> · <strong>{current.repMin}–{current.repMax} repetições</strong>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {imageUrl ? (
              <Button variant="secondary" onClick={() => setImageOpen(true)}>
                Ver foto
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setVideoOpen(true)}>
              ▶ Ver execução
            </Button>
          </div>

          {!doneSummary ? (
            <>
              <ExerciseTimer
                durationSeconds={timerSeconds}
                remaining={rest.remaining}
                running={rest.running}
                onStart={() => rest.start(timerSeconds)}
                onStop={rest.skip}
                onAdd={() => rest.add(30)}
                onEdit={() => setTimerOpen(true)}
              />
              <div className="mt-4 space-y-2">
                {currentSets.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-card2 px-4 py-3 text-sm"
                  >
                    <p>
                      Série {s.setNumber} · {s.weight} kg · {s.reps} reps
                    </p>
                    <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted"
                      aria-label={`Editar série ${s.setNumber}`}
                      onClick={() => openEditSet(s)}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <SetForm
                setNumber={nextSetNumber}
                plannedSets={current.sets}
                weight={weight}
                reps={reps}
                increment={weightIncrement}
                saving={savingSet}
                savingLabel={nextSetNumber > current.sets ? 'Carregando…' : 'Salvando…'}
                onWeight={changeWeight}
                onReps={changeReps}
                onPlannedSets={(value) => void changePlannedSets(value)}
                onComplete={() => void completeSet()}
              />
              <Button className="mt-4 w-full" variant="ghost" onClick={() => setSkipOpen(true)} disabled={savingSet}>
                Trocar / Pular
              </Button>
            </>
          ) : (
            <ExerciseDone
              today={currentSets}
              previous={lastSets}
              message={doneSummary.message}
              targetHit={doneSummary.targetHit}
              isRecord={doneSummary.isRecord}
              isLast={!hasNextExercise}
              onEditSet={openEditSet}
              onNext={goNext}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {!doneSummary ? (
        <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="ghost" onClick={() => setFinishExerciseOpen(true)} disabled={savingSet}>
            Finalizar exercício
          </Button>
          <Button variant="ghost" onClick={() => setFinishAsLastOpen(true)} disabled={savingSet}>
            Finalizar todo o treino
          </Button>
        </div>
      ) : null}

      <VideoModal url={youtubeUrl} open={videoOpen} onClose={() => setVideoOpen(false)} />
      <ImageModal
        url={imageUrl ?? ''}
        open={imageOpen}
        onClose={() => setImageOpen(false)}
        title={exerciseName}
      />
      <EditSetModal
        open={Boolean(editingSet)}
        setNumber={editingSet?.setNumber ?? 1}
        weight={editWeight}
        reps={editReps}
        increment={weightIncrement}
        saving={savingEdit}
        onWeight={setEditWeight}
        onReps={setEditReps}
        onClose={() => !savingEdit && setEditingSet(null)}
        onSave={() => void saveEditedSet()}
      />
      <TimerEditModal
        open={timerOpen}
        minutes={timerMinutes}
        onMinutes={setTimerMinutes}
        onClose={() => setTimerOpen(false)}
        onSave={() => void saveTimer()}
      />
      <TimerDoneModal open={rest.finished} onClose={rest.clearFinished} />
      <SkipModal open={skipOpen} onClose={() => setSkipOpen(false)} onReason={(r) => applySkip(r)} />
      <AfterSkipModal
        open={afterSkipOpen}
        onClose={() => {
          setAfterSkipOpen(false)
          setPendingSkipReason(null)
        }}
        onNext={() => void leaveCurrent(null)}
        onChoose={() => {
          setAfterSkipOpen(false)
          setPickExerciseOpen(true)
        }}
      />
      <PickWorkoutExerciseModal
        open={pickExerciseOpen}
        onClose={() => {
          setPickExerciseOpen(false)
          setAfterSkipOpen(true)
        }}
        exercises={pickableExercises}
        onPick={(id) => void leaveCurrent(id)}
      />
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancelar treino?">
        <p className="text-sm text-muted">
          Se cancelar, todo o progresso deste treino será perdido. As séries já registradas não entram no histórico.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-2">
          <Button variant="danger" size="xl" onClick={() => void discard()} disabled={cancelling}>
            {cancelling ? 'Cancelando…' : 'Cancelar e perder progresso'}
          </Button>
          <Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={cancelling}>
            Continuar treino
          </Button>
        </div>
      </Modal>
      <Modal
        open={finishExerciseOpen}
        onClose={() => !finishingExercise && setFinishExerciseOpen(false)}
        title="Finalizar exercício?"
      >
        <p className="text-sm text-muted">
          Este exercício será marcado como feito com as mesmas cargas da última vez. A próxima vez
          continua com esses pesos. Sem progressão nem recorde novos.
        </p>
        {actionError && finishExerciseOpen ? (
          <p className="mt-3 text-sm text-danger">{actionError}</p>
        ) : null}
        <div className="mt-5 grid grid-cols-1 gap-2">
          <Button
            variant="primary"
            size="xl"
            onClick={() => void finishExerciseAsLastTime()}
            disabled={finishingExercise}
          >
            {finishingExercise ? 'Finalizando…' : 'Finalizar com cargas da última vez'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setFinishExerciseOpen(false)}
            disabled={finishingExercise}
          >
            Voltar
          </Button>
        </div>
      </Modal>
      <Modal
        open={finishAsLastOpen}
        onClose={() => !finishingAsLast && setFinishAsLastOpen(false)}
        title="Finalizar todo o treino?"
      >
        <p className="text-sm text-muted">
          O treino inteiro será marcado como feito usando as mesmas cargas da última vez em cada
          exercício. Nada novo de progressão ou recorde. Ideal quando você treinou mas esqueceu de
          anotar.
        </p>
        {actionError && finishAsLastOpen ? (
          <p className="mt-3 text-sm text-danger">{actionError}</p>
        ) : null}
        <div className="mt-5 grid grid-cols-1 gap-2">
          <Button
            variant="primary"
            size="xl"
            onClick={() => void finishAsLastTime()}
            disabled={finishingAsLast}
          >
            {finishingAsLast ? 'Concluindo…' : 'Finalizar com cargas da última vez'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setFinishAsLastOpen(false)}
            disabled={finishingAsLast}
          >
            Voltar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
