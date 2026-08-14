import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/hooks/useSession'
import { workoutService, MAX_WORKOUT_DURATION_MS } from '@/services/workoutService'
import { useAppStore } from '@/store/appStore'
import { clearLocalSession, loadLocalSession } from '@/utils/localSession'

export function ActiveWorkoutBar() {
  const { user, activeProfile } = useSession()
  const workout = useAppStore((s) => s.minimizedWorkout)
  const setMinimizedWorkout = useAppStore((s) => s.setMinimizedWorkout)
  const navigate = useNavigate()

  useEffect(() => {
    if (!activeProfile) {
      setMinimizedWorkout(null)
      return
    }
    setMinimizedWorkout(null)
    let cancelled = false

    void (async () => {
      if (user) {
        await workoutService.expireStaleOpenSessions({ user, profile: activeProfile })
      }
      if (cancelled) return

      const local = loadLocalSession(activeProfile.id)
      if (local?.session.completed) {
        clearLocalSession(activeProfile.id)
      }

      let open = null as Awaited<ReturnType<typeof workoutService.findActiveSession>>
      let cloudOk = false
      try {
        open = await workoutService.findActiveSession(activeProfile.id)
        cloudOk = true
      } catch {
        cloudOk = false
      }
      if (cancelled) return

      if (open) {
        setMinimizedWorkout({ id: open.id, name: open.templateName })
        return
      }

      const localFresh =
        local &&
        !local.session.completed &&
        Date.now() - local.session.startedAt < MAX_WORKOUT_DURATION_MS

      if (localFresh && cloudOk) {
        // Nuvem sem sessão aberta → snapshot local é fantasma (ex.: cancelou/finalizou e o app fechou no meio).
        try {
          const bundle = await workoutService.loadSessionBundle(local.session.id)
          if (!bundle || bundle.session.completed) {
            clearLocalSession(activeProfile.id)
            setMinimizedWorkout(null)
            return
          }
          setMinimizedWorkout({ id: local.session.id, name: local.session.templateName })
          return
        } catch {
          clearLocalSession(activeProfile.id)
          setMinimizedWorkout(null)
          return
        }
      }

      if (localFresh && !cloudOk) {
        // Offline: confia no aparelho.
        setMinimizedWorkout({ id: local.session.id, name: local.session.templateName })
        return
      }

      if (local && !local.session.completed) {
        clearLocalSession(activeProfile.id)
      }
      setMinimizedWorkout(null)
    })()

    return () => {
      cancelled = true
    }
  }, [activeProfile?.id, user?.id, setMinimizedWorkout])

  if (!workout) return null

  return (
    <button
      type="button"
      onClick={() => navigate(`/treino/${workout.id}`)}
      className="fixed inset-x-3 bottom-[5.75rem] z-30 flex items-center justify-between gap-3 rounded-2xl bg-accent px-4 py-3 text-left text-bg shadow-lg lg:bottom-6 lg:left-auto lg:right-8 lg:w-96"
    >
      <span>
        <span className="block text-[11px] font-semibold tracking-widest uppercase">Treino minimizado</span>
        <span className="block font-display text-lg leading-tight">{workout.name}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold">Continuar</span>
    </button>
  )
}
