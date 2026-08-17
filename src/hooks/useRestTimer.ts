import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'

export function remainingFromEndsAt(endsAt: number | null | undefined): number {
  if (!endsAt) return 0
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
}

export function useRestClock() {
  const endsAt = useAppStore((s) => s.restEndsAt)
  const finished = useAppStore((s) => s.restFinished)
  const completeRest = useAppStore((s) => s.completeRest)
  const [remaining, setRemaining] = useState(() => remainingFromEndsAt(endsAt))

  useEffect(() => {
    const tick = () => {
      const left = remainingFromEndsAt(endsAt)
      setRemaining(left)
      if (endsAt && left <= 0) completeRest()
    }
    tick()
    if (!endsAt) return
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [endsAt, completeRest])

  return { remaining, running: remaining > 0, finished, endsAt }
}

export function useRestTimer() {
  const clock = useRestClock()
  const setRestEndsAt = useAppStore((s) => s.setRestEndsAt)
  const clearRestFinished = useAppStore((s) => s.clearRestFinished)

  function start(seconds: number) {
    const safe = Math.max(1, Math.round(seconds))
    setRestEndsAt(Date.now() + safe * 1000)
  }

  function restore(endAt: number) {
    if (endAt <= Date.now()) return
    setRestEndsAt(endAt)
  }

  function add(seconds: number) {
    const current = useAppStore.getState().restEndsAt
    const base = current && current > Date.now() ? current : Date.now()
    setRestEndsAt(base + seconds * 1000)
  }

  function skip() {
    setRestEndsAt(null)
    clearRestFinished()
  }

  return {
    remaining: clock.remaining,
    running: clock.running,
    finished: clock.finished,
    start,
    restore,
    add,
    skip,
    clearFinished: clearRestFinished,
  }
}
