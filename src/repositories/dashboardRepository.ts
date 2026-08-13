import { getById, upsertDoc } from '@/repositories/base'
import type { DashboardPreferences } from '@/types'

export const dashboardRepository = {
  get: (profileId: string) => getById<DashboardPreferences>('dashboardPreferences', profileId),
  save: (prefs: DashboardPreferences) => upsertDoc('dashboardPreferences', prefs),
}
