import { commitAll, patchMany } from '@/repositories/base'
import { nutritionRepository } from '@/repositories/nutritionRepository'
import type { DietMeal, DietMealItem, DietPlan, FoodSubstitute, MealCategory, Profile } from '@/types'
import { auditFields, isLive } from '@/utils/audit'
import { newId } from '@/utils/ids'

function requireName(value: string, label: string): string {
  const name = value.trim()
  if (!name) throw new Error(`${label} não pode ficar vazio.`)
  return name
}

export const dietEditorService = {
  async updatePlan(
    planId: string,
    data: Partial<Pick<DietPlan, 'name' | 'calorieGoal' | 'notes'>>,
    userId: string,
  ): Promise<void> {
    if (data.name != null) data.name = requireName(data.name, 'Nome da dieta')
    if (data.calorieGoal != null && data.calorieGoal < 0) throw new Error('Meta calórica inválida.')
    await nutritionRepository.updatePlan(planId, { ...data, ...auditFields(userId) })
  },

  async updateMeal(
    mealId: string,
    data: Partial<Pick<DietMeal, 'name' | 'category' | 'notes'>>,
    userId: string,
  ): Promise<void> {
    if (data.name != null) data.name = requireName(data.name, 'Nome da refeição')
    await nutritionRepository.updateMeal(mealId, { ...data, ...auditFields(userId) })
  },

  async archiveMeal(mealId: string, userId: string): Promise<void> {
    await nutritionRepository.updateMeal(mealId, {
      active: false,
      archivedAt: Date.now(),
      ...auditFields(userId),
    })
  },

  async reorderMeals(meals: DietMeal[], userId: string): Promise<void> {
    await patchMany(
      meals.map((meal, index) => ({
        collection: 'dietMeals',
        id: meal.id,
        data: { order: index, ...auditFields(userId) },
      })),
    )
  },

  async addMeal(params: {
    profile: Profile
    plan: DietPlan
    userId: string
    name: string
    category: MealCategory
    order: number
  }): Promise<DietMeal> {
    const meal: DietMeal = {
      id: newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      dietPlanId: params.plan.id,
      category: params.category,
      order: params.order,
      name: requireName(params.name, 'Nome da refeição'),
      notes: '',
      active: true,
      archivedAt: null,
      updatedAt: Date.now(),
      updatedBy: params.userId,
    }
    await nutritionRepository.saveMeal(meal)
    await nutritionRepository.updatePlan(params.plan.id, auditFields(params.userId))
    return meal
  },

  async updateItem(
    itemId: string,
    data: Partial<Pick<DietMealItem, 'foodName' | 'calories' | 'protein' | 'carbs' | 'fat' | 'quantityLabel' | 'notes' | 'substitutes'>>,
    userId: string,
  ): Promise<void> {
    if (data.foodName != null) data.foodName = requireName(data.foodName, 'Alimento')
    for (const key of ['calories', 'protein', 'carbs', 'fat'] as const) {
      const value = data[key]
      if (value != null && value < 0) throw new Error('Valores nutricionais não podem ser negativos.')
    }
    await nutritionRepository.updateMealItem(itemId, { ...data, ...auditFields(userId) })
  },

  async archiveItem(itemId: string, userId: string): Promise<void> {
    await nutritionRepository.updateMealItem(itemId, {
      active: false,
      archivedAt: Date.now(),
      ...auditFields(userId),
    })
  },

  async reorderItems(items: DietMealItem[], userId: string): Promise<void> {
    await patchMany(
      items.map((item, index) => ({
        collection: 'dietMealItems',
        id: item.id,
        data: { order: index, ...auditFields(userId) },
      })),
    )
  },

  async addItem(params: {
    profile: Profile
    meal: DietMeal
    userId: string
    order: number
    foodName: string
    calories: number
    protein: number
    carbs: number
    fat: number
    quantityLabel: string
    notes?: string
    substitutes?: FoodSubstitute[]
  }): Promise<DietMealItem> {
    const item: DietMealItem = {
      id: newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      dietMealId: params.meal.id,
      foodName: requireName(params.foodName, 'Alimento'),
      calories: params.calories,
      protein: params.protein,
      carbs: params.carbs,
      fat: params.fat,
      quantityLabel: params.quantityLabel.trim(),
      notes: params.notes ?? '',
      substitutes: params.substitutes ?? [],
      order: params.order,
      active: true,
      archivedAt: null,
      updatedAt: Date.now(),
      updatedBy: params.userId,
    }
    await nutritionRepository.saveMealItem(item)
    return item
  },

  async createEmptyPlan(params: { profile: Profile; userId: string; name?: string }): Promise<DietPlan> {
    const plan: DietPlan = {
      id: newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      name: params.name?.trim() || 'Minha dieta',
      calorieGoal: params.profile.calorieGoal,
      notes: '',
      isActive: true,
      isPlaceholder: false,
      archivedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      updatedBy: params.userId,
      version: 1,
    }
    await commitAll([{ collection: 'dietPlans', data: plan }])
    return plan
  },

  liveMeals<T extends DietMeal>(meals: T[]): T[] {
    return meals.filter(isLive)
  },

  liveItems<T extends DietMealItem>(items: T[]): T[] {
    return items.filter(isLive)
  },
}
