import { increment } from 'firebase/firestore'

export function isLive(item: { active?: boolean; archivedAt?: number | null; isActive?: boolean }): boolean {
  if (item.archivedAt) return false
  if (item.active === false) return false
  if (item.isActive === false) return false
  return true
}

export function auditFields(userId: string) {
  return {
    updatedAt: Date.now(),
    updatedBy: userId,
    version: increment(1),
  }
}
