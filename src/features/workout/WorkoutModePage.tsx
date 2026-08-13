import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ExerciseDone,
  ExerciseTimer,
  LastTime,
  OccupiedModal,
  ReplaceModal,
  SetForm,
  SkipModal,
  TimerEditModal,
  VideoModal,
  WorkoutSummary,
} from '@/features/workout/WorkoutPieces'
import { useRestTimer } from '@/hooks/useRestTimer'
import { useSession } from '@/hooks/useSession'
import { exerciseService } from '@/services/exerciseService'
import { profileService } from '@/services/profileService'
import { workoutService } from '@/services/workoutService'
import type {
  Exercise,
  ExerciseSet,
  ProgressionSummary,
  SkipReason,
  WorkoutSession,
  WorkoutSessionExercise,
} from '@/types'
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/types'
import { formatTimer } from '@/utils/dates'
import { hapticSuccess, hapticRecord } from '@/utils/haptics'
import { loadLocalSession } from '@/utils/localSession'
import { pickNextExercise, withMuscle } from '@/utils/muscleOrder'
import { getLastLoad, saveLastLoad } from '@/utils/exerciseLoad'
import { workingWeight } from '@/utils/volume'
import { useAppStore } from '@/store/appStore'
import { AnimatePresence, motion } from 'framer-motion'
import { Minimize2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
  const [videoOpen, setVideoOpen] = useState(false)
  const [skipOpen, setSkipOpen] = useState(false)
  const [occupiedOpen, setOccupiedOpen] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [timerOpen, setTimerOpen] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(2)
  const setMinimizedWorkout = useAppStore((s) => s.setMinimizedWorkout)
  const [progressions, setProgressions] = useState(0)
  const [records, setRecords] = useState(0)

  const current = exercises.find((e) => e.id === currentId) ?? exercises.find((e) => e.status === 'active') ?? exercises.find((e) => e.status !== 'completed')
  const exercise = catalog.find((e) => e.id === current?.exerciseId)
  const currentSets = sets.filter((s) => s.sessionExerciseId === current?.id && s.completed).sort((a, b) => a.setNumber - b.setNumber)
  const nextSetNumber = (currentSets[currentSets.length - 1]?.setNumber ?? 0) + 1
  const allDone = exercises.length > 0 && exercises.every((e) => e.status === 'completed' || e.status === 'skipped')
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
        const bundle = await workoutService.loadSessionBundle(id)
        const local = loadLocalSession(profile.id)
        const exercisesData = bundle?.exercises ?? local?.exercises ?? []
        const sessionData = bundle?.session ?? (local && local.session.id === id ? local.session : null)
        const setsData = bundle?.sets?.length ? bundle.sets : (local?.sets ?? [])
        if (!alive) return
        if (!sessionData) {
          setError('Treino não encontrado.')
          setLoading(false)
          return
        }
        const list = await exerciseService.listByHousehold(profile.householdId)
        if (!alive) return
        setCatalog(list)
        setSession(sessionData)
        setExercises(exercisesData)
        setSets(setsData)
        const active =
          exercisesData.find((e) => e.status === 'active') ??
          exercisesData.find((e) => e.status === 'deferred' || e.status === 'pending') ??
          exercisesData[0]
        setCurrentId(active?.id ?? null)
        unsubEx = workoutService.subscribeSessionExercises(id, (items) => setExercises(items))
        unsubSets = workoutService.subscribeSetsBySession(id, (items) => setSets(items))
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
  }, [sessionId, activeProfile?.id, activeProfile?.householdId])

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
    })

    return () => {
      alive = false
    }
  }, [current?.id, current?.exerciseId, activeProfile?.id, session?.id])

  useEffect(() => {
    if (!session || !activeProfile) return
    workoutService.persistLocal({
      session,
      exercises,
      sets,
      currentExerciseId: currentId,
      updatedAt: Date.now(),
    })
  }, [session, exercises, sets, currentId, activeProfile?.id])

  const alternatives = useMemo(() => {
    if (!exercise) return []
    return exerciseService.alternativesOf(exercise, catalog)
  }, [exercise, catalog])

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
  ) {
    if (!session) return
    workoutService.persistLocal({
      session,
      exercises: nextExercises,
      sets: nextSets,
      currentExerciseId: currentId,
      updatedAt: Date.now(),
    })
  }

  async function completeSet() {
    if (!user || !activeProfile || !session || !current) return
    const set = await workoutService.completeSet({
      user,
      profile: activeProfile,
      session,
      sessionExercise: current,
      setNumber: nextSetNumber,
      weight,
      reps,
      rir: 1,
      snapshot: { session, exercises, sets, currentExerciseId: currentId, updatedAt: Date.now() },
    })
    const nextSets = [...sets, set]
    setSets(nextSets)
    hapticSuccess()
    persistSnapshot(exercises, nextSets)
    saveLastLoad(activeProfile.id, current.exerciseId, { weight, reps })

    if (nextSetNumber >= current.sets) {
      const summary = await workoutService.completeExercise({
        profile: activeProfile,
        session,
        sessionExercise: current,
        todaySets: nextSets.filter((s) => s.sessionExerciseId === current.id),
      })
      setDoneSummary(summary)
      if (summary.kind !== 'none' && summary.kind !== 'first') setProgressions((v) => v + 1)
      if (summary.isRecord) {
        setRecords((v) => v + 1)
        hapticRecord()
      }
      setExercises((items) => items.map((e) => (e.id === current.id ? { ...e, status: 'completed' } : e)))
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
      const summary = await workoutService.completeExercise({
        profile: activeProfile,
        session,
        sessionExercise: updated,
        todaySets: currentSets,
      })
      setDoneSummary(summary)
      if (summary.kind !== 'none' && summary.kind !== 'first') setProgressions((v) => v + 1)
      if (summary.isRecord) {
        setRecords((v) => v + 1)
        hapticRecord()
      }
      setExercises((items) => items.map((e) => (e.id === current.id ? { ...e, status: 'completed', sets: nextCount } : e)))
    }
  }

  function goNext() {
    if (!current) return
    const muscleByExerciseId = new Map(catalog.map((e) => [e.id, e.muscleGroup]))
    const decorated = withMuscle(exercises, muscleByExerciseId)
    const next = pickNextExercise(
      decorated.map((e) => (e.id === current.id ? { ...e, status: 'completed' } : e)),
      current.id,
      false,
    )
    setDoneSummary(null)
    if (!next) {
      void finish()
      return
    }
    setCurrentId(next.id)
    void workoutService.updateSessionExercise(next.id, { status: 'active' })
  }

  async function applySkip(reason: SkipReason) {
    setSkipOpen(false)
    if (reason === 'occupied') {
      setOccupiedOpen(true)
      return
    }
    await defer(reason === 'cannot_today' ? 'cannot_today' : 'want_other', false)
  }

  async function defer(reason: SkipReason, preferDifferentMuscle: boolean) {
    if (!current) return
    const next = await workoutService.deferAndGoNext({
      exercises,
      catalog,
      current,
      reason,
      preferDifferentMuscle,
    })
    setOccupiedOpen(false)
    setExercises((items) =>
      items.map((e) => {
        if (e.id === current.id) return { ...e, status: 'deferred', skipReason: reason }
        if (next && e.id === next.id) return { ...e, status: 'active' }
        return e
      }),
    )
    if (next) setCurrentId(next.id)
    else await finish()
  }

  async function replace(ex: Exercise) {
    if (!current) return
    await workoutService.substituteExercise({
      sessionExercise: current,
      newExercise: ex,
      onlyToday: true,
    })
    setExercises((items) =>
      items.map((e) =>
        e.id === current.id
          ? {
              ...e,
              exerciseId: ex.id,
              exerciseName: ex.name,
              muscleGroup: ex.muscleGroup,
              equipment: ex.equipment,
              youtubeUrl: ex.youtubeUrl,
              weightIncrement: ex.weightIncrement,
              substituted: true,
              substituteOnlyToday: true,
            }
          : e,
      ),
    )
    setReplaceOpen(false)
    setOccupiedOpen(false)
  }

  async function finish() {
    if (!session || !activeProfile) return
    const updated = await workoutService.finishSession({
      profileId: activeProfile.id,
      session,
      exercises,
      sets,
    })
    setFinished(updated)
    setMinimizedWorkout(null)
  }

  function minimize() {
    if (!session) return
    rest.skip()
    setMinimizedWorkout({ id: session.id, name: session.templateName })
    navigate('/')
  }

  async function discard() {
    if (!session || !activeProfile) return
    setCancelling(true)
    try {
      rest.skip()
      await workoutService.discardSession({
        profileId: activeProfile.id,
        session,
        exercises,
        sets,
      })
      setMinimizedWorkout(null)
      navigate('/')
    } catch (err) {
      setCancelling(false)
      setError(err instanceof Error ? err.message : 'Não foi possível cancelar o treino.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-svh bg-bg p-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="mt-6 h-72" />
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

  if (finished || session.completed || (allDone && !doneSummary)) {
    const done = finished ?? session
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
        onHome={() => navigate('/')}
      />
    )
  }

  if (!current) {
    return (
      <div className="min-h-svh bg-bg p-4">
        <ErrorState message="Não foi possível abrir o exercício atual." onRetry={() => navigate('/')} />
      </div>
    )
  }

  const exerciseName = current.exerciseName || exercise?.name || 'Exercício'
  const muscleGroup = current.muscleGroup || exercise?.muscleGroup || 'chest'
  const equipment = current.equipment || exercise?.equipment || 'other'
  const youtubeUrl = current.youtubeUrl || exercise?.youtubeUrl || ''
  const weightIncrement = current.weightIncrement || exercise?.weightIncrement || 2

  const index = exercises.findIndex((e) => e.id === current.id)

  return (
    <div className="min-h-svh bg-bg px-4 pb-8 pt-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">{session.templateName}</p>
          <p className="mt-1 text-sm">
            Exercício {index + 1} de {exercises.length}
          </p>
          <div className="mt-2 flex gap-1">
            {exercises.map((e) => (
              <span
                key={e.id}
                className={
                  e.status === 'completed'
                    ? 'h-2.5 w-2.5 rounded-full bg-accent'
                    : e.status === 'deferred'
                      ? 'h-2.5 w-2.5 rounded-full bg-warn'
                      : e.id === current.id
                        ? 'h-2.5 w-2.5 rounded-full bg-ink'
                        : 'h-2.5 w-2.5 rounded-full bg-card2'
                }
              />
            ))}
          </div>
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

          <Button className="mt-4" variant="secondary" onClick={() => setVideoOpen(true)}>
            ▶ Ver execução
          </Button>

          {!doneSummary ? (
            <>
              <div className="mt-6">
                <LastTime sets={lastSets} />
              </div>
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
                  <p key={s.id} className="rounded-2xl bg-card2 px-4 py-3 text-sm">
                    Série {s.setNumber} · {s.weight} kg · {s.reps} reps
                  </p>
                ))}
              </div>
              <SetForm
                setNumber={nextSetNumber}
                plannedSets={current.sets}
                weight={weight}
                reps={reps}
                increment={weightIncrement}
                onWeight={changeWeight}
                onReps={changeReps}
                onPlannedSets={(value) => void changePlannedSets(value)}
                onComplete={() => void completeSet()}
              />
              <Button className="mt-4 w-full" variant="ghost" onClick={() => setSkipOpen(true)}>
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
              onNext={goNext}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <VideoModal url={youtubeUrl} open={videoOpen} onClose={() => setVideoOpen(false)} />
      <TimerEditModal
        open={timerOpen}
        minutes={timerMinutes}
        onMinutes={setTimerMinutes}
        onClose={() => setTimerOpen(false)}
        onSave={() => void saveTimer()}
      />
      <SkipModal open={skipOpen} onClose={() => setSkipOpen(false)} onReason={(r) => void applySkip(r)} />
      <OccupiedModal
        open={occupiedOpen}
        onClose={() => setOccupiedOpen(false)}
        onDefer={() => void defer('occupied', true)}
        onReplace={() => {
          setOccupiedOpen(false)
          setReplaceOpen(true)
        }}
      />
      <ReplaceModal
        open={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        alternatives={alternatives}
        onPick={(ex) => void replace(ex)}
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
    </div>
  )
}
