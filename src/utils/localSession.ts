import type { WorkoutSession, WorkoutSessionExercise, ExerciseSet } from '@/types'

const PREFIX = 'fit.session.'

export type LocalWorkoutSnapshot = {
  session: WorkoutSession
  exercises: WorkoutSessionExercise[]
  sets: ExerciseSet[]
  currentExerciseId: string | null
  updatedAt: number
}

function key(profileId: string): string {
  return `${PREFIX}${profileId}`
}

export function saveLocalSession(profileId: string, snapshot: LocalWorkoutSnapshot): void {
  try {
    localStorage.setItem(key(profileId), JSON.stringify(snapshot))
  } catch {
    /* quota / private mode */
  }
}

export function loadLocalSession(profileId: string): LocalWorkoutSnapshot | null {
  try {
    const raw = localStorage.getItem(key(profileId))
    if (!raw) return null
    return JSON.parse(raw) as LocalWorkoutSnapshot
  } catch {
    return null
  }
}

export function clearLocalSession(profileId: string): void {
  try {
    localStorage.removeItem(key(profileId))
  } catch {
    /* ignore */
  }
}

export function saveActiveProfileId(userId: string, profileId: string): void {
  try {
    localStorage.setItem(`fit.activeProfile.${userId}`, profileId)
  } catch {
    /* ignore */
  }
}

export function loadActiveProfileId(userId: string): string | null {
  try {
    return localStorage.getItem(`fit.activeProfile.${userId}`)
  } catch {
    return null
  }
}
