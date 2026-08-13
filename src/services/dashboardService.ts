import { increment } from 'firebase/firestore'
import { dashboardRepository } from '@/repositories/dashboardRepository'
import {
  DEFAULT_DASHBOARD_WIDGETS,
  DASHBOARD_WIDGETS,
  type DashboardPreferences,
  type DashboardWidgetId,
  type Profile,
  type UserRecord,
} from '@/types'

function mergeWidgets(
  saved: DashboardPreferences['widgets'] | undefined,
): Array<{ id: DashboardWidgetId; visible: boolean }> {
  const byId = new Map((saved ?? []).map((item) => [item.id, item]))
  const known = new Set<string>(DASHBOARD_WIDGETS)
  const merged = DEFAULT_DASHBOARD_WIDGETS.map((item) => byId.get(item.id) ?? item)
  for (const item of saved ?? []) {
    if (!known.has(item.id)) continue
    if (!merged.some((row) => row.id === item.id)) merged.push(item)
  }
  return merged
}

export const dashboardService = {
  defaults(): Array<{ id: DashboardWidgetId; visible: boolean }> {
    return DEFAULT_DASHBOARD_WIDGETS.map((item) => ({ ...item }))
  },

  async get(profileId: string): Promise<Array<{ id: DashboardWidgetId; visible: boolean }>> {
    const prefs = await dashboardRepository.get(profileId)
    return mergeWidgets(prefs?.widgets)
  },

  async save(params: {
    user: UserRecord
    profile: Profile
    widgets: Array<{ id: DashboardWidgetId; visible: boolean }>
  }): Promise<DashboardPreferences> {
    const prefs: DashboardPreferences = {
      id: params.profile.id,
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      userId: params.user.id,
      widgets: params.widgets,
      updatedAt: Date.now(),
      updatedBy: params.user.id,
      version: increment(1) as unknown as number,
    }
    await dashboardRepository.save(prefs)
    return { ...prefs, version: (prefs.version as number) || 1 }
  },
}
