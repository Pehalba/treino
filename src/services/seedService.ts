import { PLACEHOLDER_DIET, PLACEHOLDER_EXERCISES, PLACEHOLDER_TEMPLATES } from '@/data/placeholders'
import { exerciseRepository } from '@/repositories/exerciseRepository'
import { nutritionRepository } from '@/repositories/nutritionRepository'
import { workoutRepository } from '@/repositories/workoutRepository'
import type { DietMeal, DietMealItem, DietPlan, Exercise, ImportPayload, WorkoutTemplate, WorkoutTemplateExercise } from '@/types'
import { newId } from '@/utils/ids'

export const seedService = {
  async ensureHouseholdCatalog(householdId: string): Promise<Map<string, Exercise>> {
    const existing = await exerciseRepository.listByHousehold(householdId)
    if (existing.length > 0) {
      return new Map(existing.map((item) => [item.name.toLowerCase(), item]))
    }

    const byKey = new Map<string, Exercise>()
    for (const item of PLACEHOLDER_EXERCISES) {
      const exercise: Exercise = {
        id: newId(),
        householdId,
        name: item.name,
        muscleGroup: item.muscleGroup,
        equipment: item.equipment,
        description: item.description,
        youtubeUrl: item.youtubeUrl,
        alternativeIds: [],
        defaultSets: item.defaultSets,
        defaultRepMin: item.defaultRepMin,
        defaultRepMax: item.defaultRepMax,
        defaultRestSeconds: item.defaultRestSeconds,
        weightIncrement: item.weightIncrement,
        isPlaceholder: true,
        createdAt: Date.now(),
      }
      byKey.set(item.key, exercise)
    }

    for (const item of PLACEHOLDER_EXERCISES) {
      const exercise = byKey.get(item.key)
      if (!exercise) continue
      exercise.alternativeIds = item.alternativeKeys
        .map((key) => byKey.get(key)?.id)
        .filter((id): id is string => Boolean(id))
      await exerciseRepository.save(exercise)
    }

    return new Map([...byKey.values()].map((item) => [item.name.toLowerCase(), item]))
  },

  async seedProfile(profileId: string, householdId: string): Promise<void> {
    await this.ensureHouseholdCatalog(householdId)
    const templates = await workoutRepository.listTemplates(profileId)
    if (templates.length === 0) {
      const byKey = new Map<string, Exercise>()
      const exercises = await exerciseRepository.listByHousehold(householdId)
      for (const placeholder of PLACEHOLDER_EXERCISES) {
        const found = exercises.find((e) => e.name === placeholder.name)
        if (found) byKey.set(placeholder.key, found)
      }

      let order = 0
      for (const templateDef of PLACEHOLDER_TEMPLATES) {
        const template: WorkoutTemplate = {
          id: newId(),
          profileId,
          householdId,
          name: templateDef.name,
          order,
          createdAt: Date.now(),
        }
        order += 1
        await workoutRepository.saveTemplate(template)
        let exerciseOrder = 0
        for (const key of templateDef.exerciseKeys) {
          const exercise = byKey.get(key)
          if (!exercise) continue
          const row: WorkoutTemplateExercise = {
            id: newId(),
            profileId,
            householdId,
            templateId: template.id,
            exerciseId: exercise.id,
            order: exerciseOrder,
            sets: exercise.defaultSets,
            repMin: exercise.defaultRepMin,
            repMax: exercise.defaultRepMax,
            restSeconds: exercise.defaultRestSeconds,
            notes: '',
          }
          exerciseOrder += 1
          await workoutRepository.saveTemplateExercise(row)
        }
      }
    }

    const plans = await nutritionRepository.listPlans(profileId)
    if (plans.length === 0) {
      await this.seedPlaceholderDiet(profileId, householdId)
    }
  },

  async seedPlaceholderDiet(profileId: string, householdId: string): Promise<void> {
    const plan: DietPlan = {
      id: newId(),
      profileId,
      householdId,
      name: PLACEHOLDER_DIET.name,
      isActive: true,
      isPlaceholder: true,
      createdAt: Date.now(),
    }
    await nutritionRepository.savePlan(plan)
    let mealOrder = 0
    for (const mealDef of PLACEHOLDER_DIET.meals) {
      const meal: DietMeal = {
        id: newId(),
        profileId,
        householdId,
        dietPlanId: plan.id,
        category: mealDef.category,
        order: mealOrder,
        name: mealDef.name,
      }
      mealOrder += 1
      await nutritionRepository.saveMeal(meal)
      let itemOrder = 0
      for (const item of mealDef.items) {
        const row: DietMealItem = {
          id: newId(),
          profileId,
          householdId,
          dietMealId: meal.id,
          foodName: item.foodName,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          quantityLabel: item.quantityLabel,
          order: itemOrder,
        }
        itemOrder += 1
        await nutritionRepository.saveMealItem(row)
      }
    }
  },

  async importPayload(
    profileId: string,
    householdId: string,
    payload: ImportPayload,
  ): Promise<void> {
    const catalog = new Map<string, Exercise>()
    const existing = await exerciseRepository.listByHousehold(householdId)
    for (const item of existing) catalog.set(item.name.toLowerCase(), item)

    for (const item of payload.exercises ?? []) {
      const current = catalog.get(item.name.toLowerCase())
      if (current) {
        await exerciseRepository.update(current.id, {
          muscleGroup: item.muscleGroup ?? current.muscleGroup,
          equipment: item.equipment ?? current.equipment,
          description: item.description ?? current.description,
          youtubeUrl: item.youtubeUrl ?? current.youtubeUrl,
          defaultSets: item.defaultSets ?? current.defaultSets,
          defaultRepMin: item.defaultRepMin ?? current.defaultRepMin,
          defaultRepMax: item.defaultRepMax ?? current.defaultRepMax,
          defaultRestSeconds: item.defaultRestSeconds ?? current.defaultRestSeconds,
          weightIncrement: item.weightIncrement ?? current.weightIncrement,
          isPlaceholder: false,
        })
        continue
      }
      const exercise: Exercise = {
        id: newId(),
        householdId,
        name: item.name,
        muscleGroup: item.muscleGroup,
        equipment: item.equipment ?? 'other',
        description: item.description ?? '',
        youtubeUrl: item.youtubeUrl ?? '',
        alternativeIds: item.alternativeIds ?? [],
        defaultSets: item.defaultSets ?? 3,
        defaultRepMin: item.defaultRepMin ?? 6,
        defaultRepMax: item.defaultRepMax ?? 10,
        defaultRestSeconds: item.defaultRestSeconds ?? 120,
        weightIncrement: item.weightIncrement ?? 2,
        isPlaceholder: false,
        createdAt: Date.now(),
      }
      await exerciseRepository.save(exercise)
      catalog.set(exercise.name.toLowerCase(), exercise)
    }

    if (payload.templates) {
      const currentTemplates = await workoutRepository.listTemplates(profileId)
      const startOrder = currentTemplates.length
      let order = startOrder
      for (const templateDef of payload.templates) {
        const template: WorkoutTemplate = {
          id: newId(),
          profileId,
          householdId,
          name: templateDef.name,
          order,
          createdAt: Date.now(),
        }
        order += 1
        await workoutRepository.saveTemplate(template)
        let exerciseOrder = 0
        for (const row of templateDef.exercises) {
          const exercise = catalog.get(row.exerciseName.toLowerCase())
          if (!exercise) continue
          await workoutRepository.saveTemplateExercise({
            id: newId(),
            profileId,
            householdId,
            templateId: template.id,
            exerciseId: exercise.id,
            order: exerciseOrder,
            sets: row.sets ?? exercise.defaultSets,
            repMin: row.repMin ?? exercise.defaultRepMin,
            repMax: row.repMax ?? exercise.defaultRepMax,
            restSeconds: row.restSeconds ?? exercise.defaultRestSeconds,
            notes: '',
          })
          exerciseOrder += 1
        }
      }
    }

    if (payload.diet) {
      const plan: DietPlan = {
        id: newId(),
        profileId,
        householdId,
        name: payload.diet.name ?? 'Minha dieta',
        isActive: true,
        isPlaceholder: false,
        createdAt: Date.now(),
      }
      await nutritionRepository.savePlan(plan)
      let mealOrder = 0
      for (const mealDef of payload.diet.meals) {
        const meal: DietMeal = {
          id: newId(),
          profileId,
          householdId,
          dietPlanId: plan.id,
          category: mealDef.category,
          order: mealOrder,
          name: mealDef.name ?? mealDef.category,
        }
        mealOrder += 1
        await nutritionRepository.saveMeal(meal)
        let itemOrder = 0
        for (const item of mealDef.items) {
          await nutritionRepository.saveMealItem({
            id: newId(),
            profileId,
            householdId,
            dietMealId: meal.id,
            foodName: item.foodName,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            quantityLabel: item.quantityLabel ?? '',
            order: itemOrder,
          })
          itemOrder += 1
        }
      }
    }
  },
}
