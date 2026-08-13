import type { DietMeal, DietMealItem, DietPlan } from '@/types'

const PREFIX = 'fit.dietPlan.'
const FRESH_MS = 45_000

export type CachedDietPlan = {
  plan: DietPlan | null
  meals: Array<DietMeal & { items: DietMealItem[] }>
}

const memory = new Map<string, { at: number; data: CachedDietPlan }>()

export function loadDietCache(profileId: string): CachedDietPlan | null {
  const hit = memory.get(profileId)
  if (hit) return hit.data
  try {
    const raw = localStorage.getItem(PREFIX + profileId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedDietPlan
    if (!parsed || !Array.isArray(parsed.meals)) return null
    memory.set(profileId, { at: 0, data: parsed })
    return parsed
  } catch {
    return null
  }
}

export function saveDietCache(profileId: string, data: CachedDietPlan): void {
  memory.set(profileId, { at: Date.now(), data })
  try {
    localStorage.setItem(PREFIX + profileId, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

export function freshDietCache(profileId: string): CachedDietPlan | null {
  const hit = memory.get(profileId)
  if (hit && Date.now() - hit.at < FRESH_MS) return hit.data
  return null
}

export function invalidateDietCache(profileId?: string): void {
  if (profileId) {
    memory.delete(profileId)
    try {
      localStorage.removeItem(PREFIX + profileId)
    } catch {
      /* ignore */
    }
    return
  }
  memory.clear()
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key?.startsWith(PREFIX)) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    /* ignore */
  }
}

export function dietPresetInstalled(profileId: string, name: string): boolean {
  try {
    return localStorage.getItem(`fit.diet.preset.${profileId}`) === name
  } catch {
    return false
  }
}

export function markDietPresetInstalled(profileId: string, name: string): void {
  try {
    localStorage.setItem(`fit.diet.preset.${profileId}`, name)
  } catch {
    /* ignore */
  }
}
