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

export function asRecord(data: DocumentData): Record<string, unknown> {
  return data
}
