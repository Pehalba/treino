import { useEffect, useRef, useState } from 'react'
import { hapticAlert } from '@/utils/haptics'

export function useRestTimer() {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const endAt = useRef(0)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!running) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
      setRemaining(left)
      if (left > 0 || completedRef.current) return
      completedRef.current = true
      setRunning(false)
      setRemaining(0)
      setFinished(true)
      hapticAlert()
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [running])

  function start(seconds: number) {
    const safe = Math.max(1, Math.round(seconds))
    completedRef.current = false
    setFinished(false)
    endAt.current = Date.now() + safe * 1000
    setRemaining(safe)
    setRunning(true)
  }

  function add(seconds: number) {
    completedRef.current = false
    setFinished(false)
    endAt.current += seconds * 1000
    setRemaining((v) => v + seconds)
    setRunning(true)
  }

  function skip() {
    completedRef.current = true
    setFinished(false)
    setRunning(false)
    setRemaining(0)
  }

  function clearFinished() {
    setFinished(false)
  }

  return { remaining, running, finished, start, add, skip, clearFinished }
}
