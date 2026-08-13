import { useEffect } from 'react'
import { getDb } from '@/firebase/app'
import { isFirebaseConfigured } from '@/firebase/config'
import { authService } from '@/services/authService'
import { dietService } from '@/services/nutritionService'
import { profileService, sortProfiles } from '@/services/profileService'
import { useAppStore } from '@/store/appStore'
import {
  saveActiveProfileId,
  loadActiveProfileId,
  loadBootCache,
  saveBootCache,
  clearBootCache,
} from '@/utils/localSession'
import type { Profile, UserRecord } from '@/types'

function samePerson(profile: Profile, nameOrId: string | null | undefined): boolean {
  if (!nameOrId) return false
  if (profile.id === nameOrId) return true
  return profile.name.trim().toLowerCase() === nameOrId.trim().toLowerCase()
}

function applySession(user: UserRecord, profiles: Profile[]) {
  const setUser = useAppStore.getState().setUser
  const setProfiles = useAppStore.getState().setProfiles
  const setActiveProfile = useAppStore.getState().setActiveProfile
  setUser(user)
  setProfiles(profiles)
  const savedId = loadActiveProfileId(user.id)
  const current = useAppStore.getState().activeProfile
  const active =
    (current && profiles.find((p) => p.id === current.id)) ||
    (current && profiles.find((p) => samePerson(p, current.name))) ||
    profiles.find((p) => p.id === savedId) ||
    profiles.find((p) => samePerson(p, 'Pedro')) ||
    null
  if (active) {
    setActiveProfile(active)
    saveActiveProfileId(user.id, active.id)
  }
}

function hydrateFromCache(): boolean {
  const cached = loadBootCache()
  if (!cached) return false
  applySession(cached.user, cached.profiles)
  return true
}

export function useAuthBootstrap(): void {
  const setFirebaseUser = useAppStore((s) => s.setFirebaseUser)
  const setProfiles = useAppStore((s) => s.setProfiles)
  const setActiveProfile = useAppStore((s) => s.setActiveProfile)
  const setBootstrapping = useAppStore((s) => s.setBootstrapping)
  const reset = useAppStore((s) => s.reset)

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setBootstrapping(false)
      return
    }

    const cached = hydrateFromCache()
    if (cached) setBootstrapping(false)

    let unsubProfiles: (() => void) | undefined
    let cancelled = false
    let unsubAuth: (() => void) | undefined

    try {
      getDb()
    } catch (error) {
      console.error(error)
    }

    unsubAuth = authService.subscribe(async (firebaseUser) => {
      unsubProfiles?.()
      if (!firebaseUser) {
        if (!useAppStore.getState().user) setBootstrapping(true)
        try {
          await authService.ensureAnonymous()
        } catch (error) {
          console.error(error)
          clearBootCache()
          reset()
        }
        return
      }
      setFirebaseUser(firebaseUser)
      const boot = loadBootCache()
      const cacheHit = boot?.uid === firebaseUser.uid && boot.profiles.length > 0
      if (cacheHit) {
        applySession(boot.user, boot.profiles)
        setBootstrapping(false)
      } else {
        setBootstrapping(true)
      }
      try {
        const { user, profiles } = await profileService.bootstrapUser(
          firebaseUser.uid,
          firebaseUser.email ?? '',
          firebaseUser.displayName ?? 'Pedro & Carol',
        )
        if (cancelled) return
        applySession(user, profiles)
        saveBootCache(firebaseUser.uid, user, profiles)
        const active = useAppStore.getState().activeProfile
        if (active) {
          const run = () => void dietService.ensurePresetDiet(active)
          if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(run, { timeout: 4000 })
          } else {
            window.setTimeout(run, 2500)
          }
        }
        unsubProfiles = profileService.subscribeHouseholdProfiles(user.householdId, (items) => {
          const sorted = sortProfiles(items)
          setProfiles(sorted)
          saveBootCache(firebaseUser.uid, user, sorted)
          const current = useAppStore.getState().activeProfile
          if (current && sorted.some((p) => p.id === current.id)) {
            setActiveProfile(sorted.find((p) => p.id === current.id) ?? current)
          }
        })
      } catch (error) {
        console.error(error)
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })

    return () => {
      cancelled = true
      unsubAuth?.()
      unsubProfiles?.()
    }
  }, [reset, setActiveProfile, setBootstrapping, setFirebaseUser, setProfiles])
}

export function useSession() {
  const firebaseUser = useAppStore((s) => s.firebaseUser)
  const user = useAppStore((s) => s.user)
  const profiles = useAppStore((s) => s.profiles)
  const activeProfile = useAppStore((s) => s.activeProfile)
  const bootstrapping = useAppStore((s) => s.bootstrapping)
  const setActiveProfile = useAppStore((s) => s.setActiveProfile)
  const setProfiles = useAppStore((s) => s.setProfiles)

  function selectProfile(profileId: string) {
    const profile = profiles.find((p) => p.id === profileId)
    if (!profile || !user) return
    setActiveProfile(profile)
    saveActiveProfileId(user.id, profile.id)
    void dietService.ensurePresetDiet(profile)
  }

  function patchActiveProfile(data: Partial<Profile>) {
    if (!activeProfile) return
    const next = { ...activeProfile, ...data }
    const nextProfiles = profiles.map((item) => (item.id === next.id ? next : item))
    setActiveProfile(next)
    setProfiles(nextProfiles)
    if (user && firebaseUser) saveBootCache(firebaseUser.uid, user, nextProfiles)
  }

  return { firebaseUser, user, profiles, activeProfile, bootstrapping, selectProfile, patchActiveProfile }
}
