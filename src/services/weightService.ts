import { weightRepository } from '@/repositories/weightRepository'
import type { Profile, UserRecord, WeightEntry } from '@/types'
import { todayKey } from '@/utils/dates'
import { newId } from '@/utils/ids'

export const weightService = {
  async logWeight(params: { user: UserRecord; profile: Profile; weight: number; date?: string }): Promise<WeightEntry> {
    const entry: WeightEntry = {
      id: newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      userId: params.user.id,
      date: params.date ?? todayKey(),
      weight: params.weight,
      timestamp: Date.now(),
    }
    await weightRepository.save(entry)
    return entry
  },

  sevenDayAverage(entries: WeightEntry[]): number | null {
    const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
    if (recent.length === 0) return null
    return recent.reduce((sum, e) => sum + e.weight, 0) / recent.length
  },

  trend(entries: WeightEntry[]): 'up' | 'down' | 'flat' | null {
    const avg = this.sevenDayAverage(entries)
    const older = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(7, 14)
    if (!avg || older.length === 0) return null
    const prev = older.reduce((sum, e) => sum + e.weight, 0) / older.length
    const delta = avg - prev
    if (Math.abs(delta) < 0.15) return 'flat'
    return delta > 0 ? 'up' : 'down'
  },

  subscribe: weightRepository.subscribe,
  list: weightRepository.list,
}
