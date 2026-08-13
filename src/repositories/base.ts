import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from '@/firebase/app'

export async function createDoc<T extends { id: string }>(
  collectionName: string,
  data: T,
): Promise<T> {
  await setDoc(doc(getDb(), collectionName, data.id), data)
  return data
}

export async function upsertDoc<T extends { id: string }>(
  collectionName: string,
  data: T,
): Promise<T> {
  await setDoc(doc(getDb(), collectionName, data.id), data, { merge: true })
  return data
}

export async function patchDoc(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(getDb(), collectionName, id), data)
}

export async function removeDoc(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(getDb(), collectionName, id))
}

export async function getById<T>(collectionName: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(getDb(), collectionName, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as T
}

export async function listDocs<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(getDb(), collectionName), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as T)
}

export function subscribeDocs<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  onData: (items: T[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(getDb(), collectionName), ...constraints)
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as T))
    },
    (error) => onError?.(error),
  )
}

export async function commitAll(items: Array<{ collection: string; data: { id: string } }>): Promise<void> {
  const db = getDb()
  const size = 450
  for (let i = 0; i < items.length; i += size) {
    const batch = writeBatch(db)
    for (const item of items.slice(i, i + size)) {
      batch.set(doc(db, item.collection, item.data.id), item.data)
    }
    await batch.commit()
  }
}

export async function deleteAll(items: Array<{ collection: string; id: string }>): Promise<void> {
  const db = getDb()
  const size = 450
  for (let i = 0; i < items.length; i += size) {
    const batch = writeBatch(db)
    for (const item of items.slice(i, i + size)) {
      batch.delete(doc(db, item.collection, item.id))
    }
    await batch.commit()
  }
}

export function asRecord(data: DocumentData): Record<string, unknown> {
  return data
}
