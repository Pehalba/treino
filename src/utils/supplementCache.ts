import type { DietSupplement } from '@/types'

const PREFIX = 'fit.dietSupplements.'

export function loadSupplementCache(profileId: string): DietSupplement[] | null {
  try {
    const raw = localStorage.getItem(PREFIX + profileId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DietSupplement[]
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveSupplementCache(profileId: string, items: DietSupplement[]): void {
  try {
    localStorage.setItem(PREFIX + profileId, JSON.stringify(items))
  } catch {
    /* quota */
  }
}
