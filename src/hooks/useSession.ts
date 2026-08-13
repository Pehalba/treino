import { useEffect } from 'react'
import { isFirebaseConfigured } from '@/firebase/config'
import { authService } from '@/services/authService'
import { profileService, sortProfiles } from '@/services/profileService'
import { useAppStore } from '@/store/appStore'
import { loadActiveProfileId, saveActiveProfileId } from '@/utils/localSession'

export function useAuthBootstrap(): void {
  const setFirebaseUser = useAppStore((s) => s.setFirebaseUser)
  const setUser = useAppStore((s) => s.setUser)
  const setProfiles = useAppStore((s) => s.setProfiles)
  const setActiveProfile = useAppStore((s) => s.setActiveProfile)
  const setBootstrapping = useAppStore((s) => s.setBootstrapping)
  const reset = useAppStore((s) => s.reset)

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setBootstrapping(false)
      return
    }

    let unsubProfiles: (() => void) | undefined
    let cancelled = false

    const unsubAuth = authService.subscribe(async (firebaseUser) => {
      unsubProfiles?.()
      if (!firebaseUser) {
        setBootstrapping(true)
        try {
          await authService.ensureAnonymous()
        } catch (error) {
          console.error(error)
          reset()
        }
        return
      }
      setBootstrapping(true)
      setFirebaseUser(firebaseUser)
      try {
        const { user, profile } = await profileService.bootstrapUser(
          firebaseUser.uid,
          firebaseUser.email ?? '',
          firebaseUser.displayName ?? 'Pedro & Carol',
        )
        if (cancelled) return
        setUser(user)
        const profiles = await profileService.listAccessibleProfiles(user.id)
        if (cancelled) return
        setProfiles(profiles)
        const savedId = loadActiveProfileId(user.id)
        const active = profiles.find((p) => p.id === savedId) ?? profiles.find((p) => p.id === profile.id) ?? profiles[0]
        if (active) {
          setActiveProfile(active)
          saveActiveProfileId(user.id, active.id)
        }
        unsubProfiles = profileService.subscribeHouseholdProfiles(user.householdId, (items) => {
          const sorted = sortProfiles(items)
          setProfiles(sorted)
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
      unsubAuth()
      unsubProfiles?.()
    }
  }, [reset, setActiveProfile, setBootstrapping, setFirebaseUser, setProfiles, setUser])
}

export function useSession() {
  const firebaseUser = useAppStore((s) => s.firebaseUser)
  const user = useAppStore((s) => s.user)
  const profiles = useAppStore((s) => s.profiles)
  const activeProfile = useAppStore((s) => s.activeProfile)
  const bootstrapping = useAppStore((s) => s.bootstrapping)
  const setActiveProfile = useAppStore((s) => s.setActiveProfile)

  function selectProfile(profileId: string) {
    const profile = profiles.find((p) => p.id === profileId)
    if (!profile || !user) return
    setActiveProfile(profile)
    saveActiveProfileId(user.id, profile.id)
  }

  return { firebaseUser, user, profiles, activeProfile, bootstrapping, selectProfile }
}
