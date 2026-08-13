import { nutritionRepository } from '@/repositories/nutritionRepository'
import type { DietMeal, DietMealItem, DietPlan, FoodLog, MealCategory, Profile, UserRecord } from '@/types'
import { todayKey } from '@/utils/dates'
import { newId } from '@/utils/ids'

export const dietService = {
  async getActivePlan(profileId: string): Promise<{
    plan: DietPlan | null
    meals: Array<DietMeal & { items: DietMealItem[] }>
  }> {
    const plans = await nutritionRepository.listPlans(profileId)
    const plan = plans.find((p) => p.isActive) ?? plans[0] ?? null
    if (!plan) return { plan: null, meals: [] }
    const meals = await nutritionRepository.listMeals(plan.id)
    const items = await nutritionRepository.listMealItemsByProfile(profileId)
    return {
      plan,
      meals: meals.map((meal) => ({
        ...meal,
        items: items.filter((item) => item.dietMealId === meal.id).sort((a, b) => a.order - b.order),
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
    const logs: FoodLog[] = []
    for (const item of params.meal.items) {
      logs.push(
        await this.logFood({
          user: params.user,
          profile: params.profile,
          category: params.meal.category,
          name: item.foodName,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          date: params.date,
          fromDietMealId: params.meal.id,
        }),
      )
    }
    return logs
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
}
