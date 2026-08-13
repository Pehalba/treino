import { create } from 'zustand'
import type { Profile, UserRecord } from '@/types'
import type { User } from 'firebase/auth'

type AppState = {
  firebaseUser: User | null
  user: UserRecord | null
  profiles: Profile[]
  activeProfile: Profile | null
  bootstrapping: boolean
  setFirebaseUser: (user: User | null) => void
  setUser: (user: UserRecord | null) => void
  setProfiles: (profiles: Profile[]) => void
  setActiveProfile: (profile: Profile | null) => void
  setBootstrapping: (value: boolean) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  firebaseUser: null,
  user: null,
  profiles: [],
  activeProfile: null,
  bootstrapping: true,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setUser: (user) => set({ user }),
  setProfiles: (profiles) => set({ profiles }),
  setActiveProfile: (activeProfile) => set({ activeProfile }),
  setBootstrapping: (bootstrapping) => set({ bootstrapping }),
  reset: () =>
    set({
      firebaseUser: null,
      user: null,
      profiles: [],
      activeProfile: null,
      bootstrapping: false,
    }),
}))
