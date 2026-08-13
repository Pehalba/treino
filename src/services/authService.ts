import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, whenAuthPersistenceReady } from '@/firebase/app'

export const authService = {
  async ready(): Promise<void> {
    await whenAuthPersistenceReady()
  },

  async ensureAnonymous(): Promise<User> {
    await this.ready()
    const auth = getFirebaseAuth()
    if (auth.currentUser) return auth.currentUser
    const cred = await signInAnonymously(auth)
    return cred.user
  },

  subscribe(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(getFirebaseAuth(), callback)
  },

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
    await updateProfile(cred.user, { displayName })
    return cred.user
  },

  async signIn(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
    return cred.user
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(getFirebaseAuth(), email)
  },

  async logout(): Promise<void> {
    await signOut(getFirebaseAuth())
  },
}
