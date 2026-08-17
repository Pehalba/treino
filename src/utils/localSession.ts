import type { ExerciseSet, Profile, UserRecord, WorkoutSession, WorkoutSessionExercise } from '@/types'

const PREFIX = 'fit.session.'

export type LocalWorkoutSnapshot = {
  session: WorkoutSession
  exercises: WorkoutSessionExercise[]
  sets: ExerciseSet[]
  currentExerciseId: string | null
  updatedAt: number
  restEndsAt?: number | null
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

const BOOT_KEY = 'fit.boot'

export type BootCache = {
  uid: string
  user: UserRecord
  profiles: Profile[]
}

export function saveBootCache(uid: string, user: UserRecord, profiles: Profile[]): void {
  try {
    localStorage.setItem(BOOT_KEY, JSON.stringify({ uid, user, profiles }))
  } catch {
    /* ignore */
  }
}

export function loadBootCache(): BootCache | null {
  try {
    const raw = localStorage.getItem(BOOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BootCache
    if (!parsed?.uid || !parsed.user || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

export function clearBootCache(): void {
  try {
    localStorage.removeItem(BOOT_KEY)
  } catch {
    /* ignore */
  }
}
