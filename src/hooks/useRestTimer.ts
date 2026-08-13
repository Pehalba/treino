import { useEffect, useRef, useState } from 'react'
import { hapticAlert } from '@/utils/haptics'

export function useRestTimer() {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const endAt = useRef(0)

  useEffect(() => {
    if (!running) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        setRunning(false)
        hapticAlert()
      }
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [running])

  function start(seconds: number) {
    endAt.current = Date.now() + seconds * 1000
    setRemaining(seconds)
    setRunning(true)
  }

  function add(seconds: number) {
    endAt.current += seconds * 1000
    setRemaining((v) => v + seconds)
    setRunning(true)
  }

  function skip() {
    setRunning(false)
    setRemaining(0)
  }

  return { remaining, running, start, add, skip }
}
