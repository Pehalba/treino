import { commitAll, patchMany } from '@/repositories/base'
import { nutritionRepository } from '@/repositories/nutritionRepository'
import { DIET_PRESET_VERSION, dietPresetTotals, type DietPreset } from '@/data/diets'
import type { DietMeal, DietMealItem, DietPlan, FoodSubstitute, MealCategory, Profile } from '@/types'
import { auditFields, isLive } from '@/utils/audit'
import { invalidateDietCache, markDietPresetInstalled } from '@/utils/dietCache'
import { newId } from '@/utils/ids'

function touchDiet(): void {
  invalidateDietCache()
}

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
    touchDiet()
  },

  async updateMeal(
    mealId: string,
    data: Partial<Pick<DietMeal, 'name' | 'category' | 'notes' | 'youtubeUrl'>>,
    userId: string,
  ): Promise<void> {
    if (data.name != null) data.name = requireName(data.name, 'Nome da refeição')
    if (data.youtubeUrl != null) data.youtubeUrl = data.youtubeUrl.trim()
    await nutritionRepository.updateMeal(mealId, { ...data, ...auditFields(userId) })
    touchDiet()
  },

  async archiveMeal(mealId: string, userId: string): Promise<void> {
    await nutritionRepository.updateMeal(mealId, {
      active: false,
      archivedAt: Date.now(),
      ...auditFields(userId),
    })
    touchDiet()
  },

  async reorderMeals(meals: DietMeal[], userId: string): Promise<void> {
    await patchMany(
      meals.map((meal, index) => ({
        collection: 'dietMeals',
        id: meal.id,
        data: { order: index, ...auditFields(userId) },
      })),
    )
    touchDiet()
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
      youtubeUrl: '',
      active: true,
      archivedAt: null,
      updatedAt: Date.now(),
      updatedBy: params.userId,
    }
    await nutritionRepository.saveMeal(meal)
    await nutritionRepository.updatePlan(params.plan.id, auditFields(params.userId))
    touchDiet()
    return meal
  },

  async updateItem(
    itemId: string,
    data: Partial<
      Pick<
        DietMealItem,
        | 'foodName'
        | 'calories'
        | 'protein'
        | 'carbs'
        | 'fat'
        | 'quantityLabel'
        | 'notes'
        | 'substitutes'
        | 'manualOverride'
        | 'autoScalable'
        | 'baseCalories'
        | 'baseProtein'
        | 'baseCarbs'
        | 'baseFat'
        | 'baseQuantityLabel'
      >
    >,
    userId: string,
  ): Promise<void> {
    if (data.foodName != null) data.foodName = requireName(data.foodName, 'Alimento')
    for (const key of ['calories', 'protein', 'carbs', 'fat'] as const) {
      const value = data[key]
      if (value != null && value < 0) throw new Error('Valores nutricionais não podem ser negativos.')
    }
    await nutritionRepository.updateMealItem(itemId, { ...data, ...auditFields(userId) })
    touchDiet()
  },

  async archiveItem(itemId: string, userId: string): Promise<void> {
    await nutritionRepository.updateMealItem(itemId, {
      active: false,
      archivedAt: Date.now(),
      ...auditFields(userId),
    })
    touchDiet()
  },

  async reorderItems(items: DietMealItem[], userId: string): Promise<void> {
    await patchMany(
      items.map((item, index) => ({
        collection: 'dietMealItems',
        id: item.id,
        data: { order: index, ...auditFields(userId) },
      })),
    )
    touchDiet()
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
      autoScalable: true,
      manualOverride: true,
      baseCalories: params.calories,
      baseProtein: params.protein,
      baseCarbs: params.carbs,
      baseFat: params.fat,
      baseQuantityLabel: params.quantityLabel.trim(),
      active: true,
      archivedAt: null,
      updatedAt: Date.now(),
      updatedBy: params.userId,
    }
    await nutritionRepository.saveMealItem(item)
    touchDiet()
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
    touchDiet()
    return plan
  },

  async installPreset(params: { profile: Profile; diet: DietPreset; userId: string }): Promise<DietPlan | null> {
    const plans = await nutritionRepository.listPlans(params.profile.id)
    const already = plans.find((plan) => plan.name === params.diet.name && plan.isActive !== false && !plan.archivedAt)
    if (already && already.presetVersion === DIET_PRESET_VERSION) {
      markDietPresetInstalled(params.profile.id, `${params.diet.name}@${DIET_PRESET_VERSION}`)
      return already
    }

    const now = Date.now()
    const toArchive = plans.filter((plan) => !plan.archivedAt)
    if (toArchive.length > 0) {
      await patchMany(
        toArchive.map((plan) => ({
          collection: 'dietPlans',
          id: plan.id,
          data: { isActive: false, archivedAt: now, ...auditFields(params.userId) },
        })),
      )
    }

    const totals = dietPresetTotals(params.diet)
    const plan: DietPlan = {
      id: newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      name: params.diet.name,
      calorieGoal: Math.round(totals.calories),
      notes: '',
      isActive: true,
      isPlaceholder: false,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      updatedBy: params.userId,
      version: 1,
      presetVersion: DIET_PRESET_VERSION,
    }
    const docs: Array<{ collection: string; data: DietPlan | DietMeal | DietMealItem }> = [
      { collection: 'dietPlans', data: plan },
    ]
    params.diet.meals.forEach((mealDef, mealOrder) => {
      const meal: DietMeal = {
        id: newId(),
        profileId: params.profile.id,
        householdId: params.profile.householdId,
        dietPlanId: plan.id,
        category: mealDef.category,
        order: mealOrder,
        name: mealDef.name,
        notes: '',
        youtubeUrl: mealDef.youtubeUrl ?? '',
        active: true,
        archivedAt: null,
        updatedAt: now,
        updatedBy: params.userId,
      }
      docs.push({ collection: 'dietMeals', data: meal })
      mealDef.items.forEach((item, itemOrder) => {
        docs.push({
          collection: 'dietMealItems',
          data: {
            id: newId(),
            profileId: params.profile.id,
            householdId: params.profile.householdId,
            dietMealId: meal.id,
            foodName: item.foodName,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            quantityLabel: item.quantityLabel,
            notes: '',
            substitutes: [],
            order: itemOrder,
            autoScalable: true,
            manualOverride: false,
            baseCalories: item.calories,
            baseProtein: item.protein,
            baseCarbs: item.carbs,
            baseFat: item.fat,
            baseQuantityLabel: item.quantityLabel,
            active: true,
            archivedAt: null,
            updatedAt: now,
            updatedBy: params.userId,
          },
        })
      })
    })
    await commitAll(docs)
    markDietPresetInstalled(params.profile.id, `${params.diet.name}@${DIET_PRESET_VERSION}`)
    touchDiet()
    return plan
  },

  async applyScaledItems(items: DietMealItem[], userId: string): Promise<void> {
    if (items.length === 0) return
    await patchMany(
      items.map((item) => ({
        collection: 'dietMealItems',
        id: item.id,
        data: {
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          quantityLabel: item.quantityLabel,
          baseCalories: item.baseCalories ?? item.calories,
          baseProtein: item.baseProtein ?? item.protein,
          baseCarbs: item.baseCarbs ?? item.carbs,
          baseFat: item.baseFat ?? item.fat,
          baseQuantityLabel: item.baseQuantityLabel ?? item.quantityLabel,
          ...auditFields(userId),
        },
      })),
    )
    touchDiet()
  },

  liveMeals<T extends DietMeal>(meals: T[]): T[] {
    return meals.filter(isLive)
  },

  liveItems<T extends DietMealItem>(items: T[]): T[] {
    return items.filter(isLive)
  },
}
