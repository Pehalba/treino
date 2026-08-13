import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ExerciseDone,
  LastTime,
  OccupiedModal,
  ReplaceModal,
  RestOverlay,
  SetForm,
  SkipModal,
  VideoModal,
  WorkoutSummary,
} from '@/features/workout/WorkoutPieces'
import { useRestTimer } from '@/hooks/useRestTimer'
import { useSession } from '@/hooks/useSession'
import { exerciseService } from '@/services/exerciseService'
import { workoutService } from '@/services/workoutService'
import type {
  Exercise,
  ExerciseSet,
  ProgressionSummary,
  RirValue,
  SkipReason,
  WorkoutSession,
  WorkoutSessionExercise,
} from '@/types'
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/types'
import { formatTimer } from '@/utils/dates'
import { hapticSuccess, hapticRecord } from '@/utils/haptics'
import { loadLocalSession } from '@/utils/localSession'
import { pickNextExercise, withMuscle } from '@/utils/muscleOrder'
import { workingWeight } from '@/utils/volume'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function WorkoutModePage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user, activeProfile } = useSession()
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
  const [rir, setRir] = useState<RirValue>(1)
  const [doneSummary, setDoneSummary] = useState<ProgressionSummary | null>(null)
  const [finished, setFinished] = useState<WorkoutSession | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const [skipOpen, setSkipOpen] = useState(false)
  const [occupiedOpen, setOccupiedOpen] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [progressions, setProgressions] = useState(0)
  const [records, setRecords] = useState(0)

  const current = exercises.find((e) => e.id === currentId) ?? exercises.find((e) => e.status === 'active') ?? exercises.find((e) => e.status !== 'completed')
  const exercise = catalog.find((e) => e.id === current?.exerciseId)
  const currentSets = sets.filter((s) => s.sessionExerciseId === current?.id && s.completed).sort((a, b) => a.setNumber - b.setNumber)
  const nextSetNumber = (currentSets[currentSets.length - 1]?.setNumber ?? 0) + 1
  const allDone = exercises.length > 0 && exercises.every((e) => e.status === 'completed' || e.status === 'skipped')

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
    workoutService.lastSetsForExercise(activeProfile.id, current.exerciseId, session?.id).then((prev) => {
      setLastSets(prev)
      if (prev.length) {
        setWeight(workingWeight(prev))
        setReps(prev[0]?.reps ?? current.repMin)
      } else {
        setWeight(0)
        setReps(current.repMin)
      }
    })
    setDoneSummary(null)
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

  function persistSnapshot(nextExercises = exercises, nextSets = sets) {
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
      rir,
      snapshot: { session, exercises, sets, currentExerciseId: currentId, updatedAt: Date.now() },
    })
    const nextSets = [...sets, set]
    setSets(nextSets)
    hapticSuccess()
    persistSnapshot(exercises, nextSets)

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
    } else {
      rest.start(current.restSeconds)
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
      newExerciseId: ex.id,
      onlyToday: true,
    })
    setExercises((items) =>
      items.map((e) => (e.id === current.id ? { ...e, exerciseId: ex.id, substituted: true, substituteOnlyToday: true } : e)),
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

  if (!current || !exercise) {
    return (
      <div className="min-h-svh bg-bg p-4">
        <ErrorState message="Não foi possível abrir o exercício atual." onRetry={() => navigate('/')} />
      </div>
    )
  }

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
        <div className="text-right">
          <p className="text-xs text-muted">Tempo</p>
          <p className="font-display text-lg">{formatTimer(elapsed)}</p>
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
          <h1 className="mt-8 font-display text-3xl leading-tight sm:text-4xl">{exercise.name}</h1>
          <p className="mt-2 text-muted">
            {MUSCLE_LABELS[exercise.muscleGroup]} · {EQUIPMENT_LABELS[exercise.equipment]}
          </p>
          <p className="mt-4 text-sm">
            Meta: <strong>{current.sets} séries</strong> · <strong>{current.repMin}–{current.repMax} repetições</strong>
          </p>
          <p className="text-sm text-muted">
            Descanso: {Math.floor(current.restSeconds / 60)}:{String(current.restSeconds % 60).padStart(2, '0')}
          </p>

          <Button className="mt-4" variant="secondary" onClick={() => setVideoOpen(true)}>
            ▶ Ver execução
          </Button>

          {!doneSummary ? (
            <>
              <div className="mt-6">
                <LastTime sets={lastSets} />
              </div>
              <div className="mt-4 space-y-2">
                {currentSets.map((s) => (
                  <p key={s.id} className="rounded-2xl bg-card2 px-4 py-3 text-sm">
                    Série {s.setNumber} · {s.weight} kg · {s.reps} reps
                  </p>
                ))}
              </div>
              <SetForm
                setNumber={nextSetNumber}
                weight={weight}
                reps={reps}
                rir={rir}
                increment={exercise.weightIncrement}
                onWeight={setWeight}
                onReps={setReps}
                onRir={setRir}
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

      {rest.running ? (
        <RestOverlay remaining={rest.remaining} onAdd={() => rest.add(30)} onSkip={rest.skip} />
      ) : null}

      <VideoModal url={exercise.youtubeUrl} open={videoOpen} onClose={() => setVideoOpen(false)} />
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
    </div>
  )
}
