import { nutritionRepository } from '@/repositories/nutritionRepository'
import { presetForProfile, dietPresetTotals } from '@/data/diets'
import { dietEditorService } from '@/services/dietEditorService'
import { profileService } from '@/services/profileService'
import type { DietMeal, DietMealItem, DietPlan, FoodLog, MealCategory, Profile, UserRecord } from '@/types'
import { todayKey } from '@/utils/dates'
import { newId } from '@/utils/ids'

export const dietService = {
  async ensurePresetDiet(profile: Profile): Promise<void> {
    const preset = presetForProfile(profile.name, profile.avatar)
    if (!preset) return
    const installed = await dietEditorService.installPreset({
      profile,
      diet: preset,
      userId: profile.ownerUserId,
    })
    if (!installed) return
    const totals = dietPresetTotals(preset)
    await profileService.updateProfile(
      profile.id,
      {
        calorieGoal: Math.round(totals.calories),
        proteinGoal: Math.round(totals.protein),
        carbGoal: Math.round(totals.carbs),
        fatGoal: Math.round(totals.fat),
      },
      profile.ownerUserId,
    )
  },

  async getActivePlan(profile: Profile | string): Promise<{
    plan: DietPlan | null
    meals: Array<DietMeal & { items: DietMealItem[] }>
  }> {
    const profileId = typeof profile === 'string' ? profile : profile.id
    if (typeof profile !== 'string') await this.ensurePresetDiet(profile)
    const plans = await nutritionRepository.listPlans(profileId)
    const plan = plans.find((p) => p.isActive && !p.archivedAt) ?? plans.find((p) => !p.archivedAt) ?? null
    if (!plan) return { plan: null, meals: [] }
    const meals = await nutritionRepository.listMeals(plan.id)
    const items = await nutritionRepository.listMealItemsByProfile(profileId)
    return {
      plan,
      meals: meals
        .filter((meal) => meal.active !== false && !meal.archivedAt)
        .map((meal) => ({
        ...meal,
        items: items
          .filter((item) => item.dietMealId === meal.id && item.active !== false && !item.archivedAt)
          .sort((a, b) => a.order - b.order),
      })),
    }
  },

  subscribePlans: nutritionRepository.subscribePlans,
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
  }): Promise<FoodLog[]> {
    if (params.meal.items.length === 0) return []
    const totals = params.meal.items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
    const log = await this.logFood({
      user: params.user,
      profile: params.profile,
      category: params.meal.category,
      name: params.meal.name,
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
