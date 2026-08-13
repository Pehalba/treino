import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { Profile, UserRecord } from '@/types'
import { loadActiveProfileId, loadBootCache } from '@/utils/localSession'

export type MinimizedWorkout = {
  id: string
  name: string
}

const cachedBoot = loadBootCache()
const cachedActive = cachedBoot
  ? (cachedBoot.profiles.find((item) => item.id === loadActiveProfileId(cachedBoot.user.id)) ?? null)
  : null

type AppState = {
  firebaseUser: User | null
  user: UserRecord | null
  profiles: Profile[]
  activeProfile: Profile | null
  bootstrapping: boolean
  bootError: string | null
  minimizedWorkout: MinimizedWorkout | null
  setFirebaseUser: (user: User | null) => void
  setUser: (user: UserRecord | null) => void
  setProfiles: (profiles: Profile[]) => void
  setActiveProfile: (profile: Profile | null) => void
  setBootstrapping: (value: boolean) => void
  setBootError: (value: string | null) => void
  setMinimizedWorkout: (workout: MinimizedWorkout | null) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  firebaseUser: null,
  user: cachedBoot?.user ?? null,
  profiles: cachedBoot?.profiles ?? [],
  activeProfile: cachedActive,
  bootstrapping: !cachedBoot,
  bootError: null,
  minimizedWorkout: null,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setUser: (user) => set({ user }),
  setProfiles: (profiles) => set({ profiles }),
  setActiveProfile: (activeProfile) => set({ activeProfile }),
  setBootstrapping: (bootstrapping) => set({ bootstrapping }),
  setBootError: (bootError) => set({ bootError }),
  setMinimizedWorkout: (minimizedWorkout) => set({ minimizedWorkout }),
  reset: () =>
    set({
      firebaseUser: null,
      user: null,
      profiles: [],
      activeProfile: null,
      bootstrapping: false,
      bootError: null,
      minimizedWorkout: null,
    }),
}))
