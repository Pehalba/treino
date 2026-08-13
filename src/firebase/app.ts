import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  type Firestore,
} from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { firebaseWebConfig, isFirebaseConfigured } from '@/firebase/config'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let persistenceReady: Promise<void> | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase não configurado. Preencha o arquivo .env.')
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseWebConfig)
  }
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
    persistenceReady = setPersistence(auth, browserLocalPersistence).catch(() => undefined)
  }
  return auth
}

export async function whenAuthPersistenceReady(): Promise<void> {
  getFirebaseAuth()
  if (!persistenceReady) return
  await Promise.race([
    persistenceReady,
    new Promise<void>((resolve) => {
      setTimeout(resolve, 2500)
    }),
  ])
}

export function getDb(): Firestore {
  if (db) return db
  const firebaseApp = getFirebaseApp()
  try {
    db = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    db = getFirestore(firebaseApp)
  }
  return db
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
  }
  return storage
}

export { isFirebaseConfigured }
