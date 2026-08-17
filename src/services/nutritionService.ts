import { nutritionRepository } from '@/repositories/nutritionRepository'
import { presetForProfile, presetGoalsForProfile, DIET_PRESET_VERSION } from '@/data/diets'
import { dietEditorService } from '@/services/dietEditorService'
import { profileService } from '@/services/profileService'
import { useAppStore } from '@/store/appStore'
import type {
  DietMeal,
  DietMealItem,
  DietPlan,
  DietSupplement,
  DietSupplementKind,
  FoodLog,
  MealCategory,
  Profile,
  UserRecord,
} from '@/types'
import { DIET_SUPPLEMENT_LABELS } from '@/types'
import {
  dietPresetInstalled,
  freshDietCache,
  markDietPresetInstalled,
  saveDietCache,
} from '@/utils/dietCache'
import { loadSupplementCache, saveSupplementCache } from '@/utils/supplementCache'
import { todayKey } from '@/utils/dates'
import { newId } from '@/utils/ids'

const ensuringPreset = new Map<string, Promise<void>>()
const FACTORY_CALORIE_GOAL = 3500

function planFitsProfile(plan: DietPlan | null, profile: Profile): boolean {
  const preset = presetForProfile(profile.name, profile.avatar)
  if (!preset) return true
  return Boolean(
    plan && !plan.isPlaceholder && plan.name === preset.name && plan.presetVersion === DIET_PRESET_VERSION,
  )
}

function applyGoalsLocally(
  profileId: string,
  goals: { calorieGoal: number; proteinGoal: number; carbGoal: number; fatGoal: number },
) {
  const state = useAppStore.getState()
  state.setProfiles(state.profiles.map((item) => (item.id === profileId ? { ...item, ...goals } : item)))
  if (state.activeProfile?.id === profileId) {
    state.setActiveProfile({ ...state.activeProfile, ...goals })
  }
}

export const dietService = {
  async ensurePresetDiet(profile: Profile): Promise<void> {
    const pending = ensuringPreset.get(profile.id)
    if (pending) return pending
    const run = (async () => {
      const preset = presetForProfile(profile.name, profile.avatar)
      const goals = presetGoalsForProfile(profile.name, profile.avatar)
      if (!preset || !goals) return
      const alreadyMarked = dietPresetInstalled(profile.id, `${preset.name}@${DIET_PRESET_VERSION}`)
      const factoryGoals = profile.calorieGoal === FACTORY_CALORIE_GOAL
      if (alreadyMarked && !factoryGoals) return

      const plans = await nutritionRepository.listPlans(profile.id)
      const active = plans.find((plan) => plan.isActive && !plan.archivedAt) ?? plans.find((plan) => !plan.archivedAt) ?? null
      const hasCorrect = planFitsProfile(active, profile)
      if (!hasCorrect) {
        await dietEditorService.installPreset({
          profile,
          diet: preset,
          userId: profile.ownerUserId,
        })
      }
      markDietPresetInstalled(profile.id, `${preset.name}@${DIET_PRESET_VERSION}`)

      const latest = useAppStore.getState().profiles.find((item) => item.id === profile.id) ?? profile
      if (latest.calorieGoal === FACTORY_CALORIE_GOAL || !hasCorrect) {
        await profileService.updateProfile(profile.id, goals, profile.ownerUserId)
        applyGoalsLocally(profile.id, goals)
      }
    })()
    ensuringPreset.set(profile.id, run)
    try {
      await run
    } finally {
      ensuringPreset.delete(profile.id)
    }
  },

  async getActivePlan(profile: Profile | string): Promise<{
    plan: DietPlan | null
    meals: Array<DietMeal & { items: DietMealItem[] }>
  }> {
    const profileId = typeof profile === 'string' ? profile : profile.id
    const fresh = freshDietCache(profileId)
    if (fresh?.plan && (typeof profile === 'string' || planFitsProfile(fresh.plan, profile))) {
      return fresh
    }

    const load = async () => {
      const plans = await nutritionRepository.listPlans(profileId)
      const plan = plans.find((p) => p.isActive && !p.archivedAt) ?? plans.find((p) => !p.archivedAt) ?? null
      if (!plan) return { plan: null, meals: [] as Array<DietMeal & { items: DietMealItem[] }> }
      const [meals, items] = await Promise.all([
        nutritionRepository.listMeals(plan.id),
        nutritionRepository.listMealItemsByProfile(profileId),
      ])
      const mealIds = new Set(meals.map((meal) => meal.id))
      return {
        plan,
        meals: meals
          .filter((meal) => meal.active !== false && !meal.archivedAt)
          .map((meal) => ({
            ...meal,
            items: items
              .filter((item) => item.dietMealId === meal.id && mealIds.has(item.dietMealId) && item.active !== false && !item.archivedAt)
              .sort((a, b) => a.order - b.order),
          })),
      }
    }

    let data = await load()
    if (typeof profile !== 'string' && !planFitsProfile(data.plan, profile)) {
      await this.ensurePresetDiet(profile)
      data = await load()
    }
    if (data.plan) saveDietCache(profileId, data)
    return data
  },

  subscribePlans: nutritionRepository.subscribePlans,

  async listSupplements(profileId: string): Promise<DietSupplement[]> {
    const cached = loadSupplementCache(profileId)
    try {
      const items = await nutritionRepository.listSupplements(profileId)
      saveSupplementCache(profileId, items)
      return items
    } catch (err) {
      if (cached) return cached
      throw err
    }
  },

  async saveSupplement(params: {
    profile: Profile
    userId: string
    kind: DietSupplementKind
    existingId?: string
    name: string
    dosesPerDay: number
    caloriesPerDose: number
    proteinPerDose: number
    carbsPerDose?: number
    fatPerDose?: number
  }): Promise<DietSupplement> {
    const dosesPerDay = Math.max(0, params.dosesPerDay)
    const caloriesPerDose = Math.max(0, params.caloriesPerDose)
    const proteinPerDose = Math.max(0, params.proteinPerDose)
    const carbsPerDose = Math.max(0, params.carbsPerDose ?? 0)
    const fatPerDose = Math.max(0, params.fatPerDose ?? 0)
    const name = params.name.trim() || DIET_SUPPLEMENT_LABELS[params.kind]

    const existingList = await nutritionRepository.listSupplements(params.profile.id)
    const existing =
      (params.existingId ? existingList.find((item) => item.id === params.existingId) : undefined) ??
      existingList.find((item) => item.kind === params.kind)

    const item: DietSupplement = {
      id: existing?.id || newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      kind: params.kind,
      name,
      dosesPerDay,
      caloriesPerDose,
      proteinPerDose,
      carbsPerDose,
      fatPerDose,
      active: true,
      archivedAt: null,
      updatedAt: Date.now(),
      updatedBy: params.userId,
    }
    await nutritionRepository.saveSupplement(item)
    const all = [
      ...existingList.filter((row) => row.id !== item.id && row.kind !== item.kind),
      item,
    ]
    saveSupplementCache(params.profile.id, all)
    return item
  },
}

export const nutritionService = {
  async logFood(params: {
    user: UserRecord
    profile: Profile
    category: MealCategory
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    date?: string
    fromDietMealId?: string | null
  }): Promise<FoodLog> {
    const log: FoodLog = {
      id: newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      userId: params.user.id,
      date: params.date ?? todayKey(),
      category: params.category,
      name: params.name,
      calories: params.calories,
      protein: params.protein,
      carbs: params.carbs,
      fat: params.fat,
      fromDietMealId: params.fromDietMealId ?? null,
      createdAt: Date.now(),
    }
    await nutritionRepository.saveLog(log)
    return log
  },

  async logPlannedMeal(params: {
    user: UserRecord
    profile: Profile
    meal: DietMeal & { items: DietMealItem[] }
    date?: string
    /** Multiplicador por item (ex.: 2 = dois ovos no lugar de 1). */
    itemMultipliers?: Record<string, number>
    /** true se a pessoa tirou/acrescentou algo só neste registro. */
    adjusted?: boolean
  }): Promise<FoodLog[]> {
    const multipliers = params.itemMultipliers ?? {}
    const kept = params.meal.items.filter((item) => Math.max(0, multipliers[item.id] ?? 1) > 0)
    if (kept.length === 0) return []
    const scaled = kept.map((item) => {
      const factor = Math.max(0, multipliers[item.id] ?? 1)
      return {
        calories: item.calories * factor,
        protein: item.protein * factor,
        carbs: item.carbs * factor,
        fat: item.fat * factor,
      }
    })
    const totals = scaled.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
    const changed =
      params.adjusted === true ||
      kept.length !== params.meal.items.length ||
      Object.values(multipliers).some((value) => value !== 1)
    const log = await this.logFood({
      user: params.user,
      profile: params.profile,
      category: params.meal.category,
      name: changed ? `${params.meal.name} (ajustado)` : params.meal.name,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      date: params.date,
      fromDietMealId: params.meal.id,
    })
    return [log]
  },

  totals(logs: FoodLog[]): { calories: number; protein: number; carbs: number; fat: number } {
    return logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  },

  subscribeLogsByDate: nutritionRepository.subscribeLogsByDate,
  listLogsByProfile: nutritionRepository.listLogsByProfile,
  listLogsByDate: nutritionRepository.listLogsByDate,
  listLogsSince: nutritionRepository.listLogsSince,
}
