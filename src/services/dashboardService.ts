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
  const known = new Set<string>(DASHBOARD_WIDGETS)
  const merged: Array<{ id: DashboardWidgetId; visible: boolean }> = []
  const seen = new Set<string>()

  // Preserva a ordem e a visibilidade salvas pelo usuário
  for (const item of saved ?? []) {
    if (!known.has(item.id) || seen.has(item.id)) continue
    seen.add(item.id)
    merged.push({
      id: item.id as DashboardWidgetId,
      visible: Boolean(item.visible),
    })
  }

  // Inclui widgets novos do app que ainda não estavam salvos
  for (const item of DEFAULT_DASHBOARD_WIDGETS) {
    if (seen.has(item.id)) continue
    merged.push({ ...item })
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
    const existing = await dashboardRepository.get(params.profile.id)
    const prefs: DashboardPreferences = {
      id: params.profile.id,
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      userId: params.user.id,
      widgets: params.widgets.map((item) => ({ id: item.id, visible: Boolean(item.visible) })),
      updatedAt: Date.now(),
      updatedBy: params.user.id,
      version: (existing?.version ?? 0) + 1,
    }
    await dashboardRepository.save(prefs)
    return prefs
  },
}
