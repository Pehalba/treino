import { PLACEHOLDER_DIET, PLACEHOLDER_EXERCISES, PLACEHOLDER_TEMPLATES } from '@/data/placeholders'
import { commitAll } from '@/repositories/base'
import { exerciseRepository } from '@/repositories/exerciseRepository'
import { nutritionRepository } from '@/repositories/nutritionRepository'
import { workoutRepository } from '@/repositories/workoutRepository'
import type { DietMeal, DietMealItem, DietPlan, Exercise, ImportPayload, WorkoutTemplate, WorkoutTemplateExercise } from '@/types'
import { newId } from '@/utils/ids'

function seededKey(profileId: string): string {
  return `fit.seeded.${profileId}`
}

function alreadySeeded(profileId: string): boolean {
  try {
    return localStorage.getItem(seededKey(profileId)) === '1'
  } catch {
    return false
  }
}

function markSeeded(profileId: string): void {
  try {
    localStorage.setItem(seededKey(profileId), '1')
  } catch {
    /* ignore */
  }
}

export const seedService = {
  async ensureHouseholdCatalog(householdId: string): Promise<Map<string, Exercise>> {
    const existing = await exerciseRepository.listByHousehold(householdId)
    if (existing.length > 0) {
      return new Map(existing.map((item) => [item.name.toLowerCase(), item]))
    }

    const byKey = new Map<string, Exercise>()
    for (const item of PLACEHOLDER_EXERCISES) {
      byKey.set(item.key, {
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
        active: true,
        archivedAt: null,
        createdAt: Date.now(),
      })
    }

    const docs: Array<{ collection: string; data: Exercise }> = []
    for (const item of PLACEHOLDER_EXERCISES) {
      const exercise = byKey.get(item.key)
      if (!exercise) continue
      exercise.alternativeIds = item.alternativeKeys
        .map((key) => byKey.get(key)?.id)
        .filter((id): id is string => Boolean(id))
      docs.push({ collection: 'exercises', data: exercise })
    }
    await commitAll(docs)

    return new Map([...byKey.values()].map((item) => [item.name.toLowerCase(), item]))
  },

  async seedProfile(profileId: string, householdId: string): Promise<void> {
    if (alreadySeeded(profileId)) return
    const [templates, plans] = await Promise.all([
      workoutRepository.listTemplates(profileId),
      nutritionRepository.listPlans(profileId),
    ])
    if (templates.length > 0 && plans.length > 0) {
      markSeeded(profileId)
      return
    }

    const catalog = await this.ensureHouseholdCatalog(householdId)
    const docs: Array<{ collection: string; data: { id: string } & Record<string, unknown> }> = []

    if (templates.length === 0) {
      const byKey = new Map<string, Exercise>()
      for (const placeholder of PLACEHOLDER_EXERCISES) {
        const found = [...catalog.values()].find((e) => e.name === placeholder.name)
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
        docs.push({ collection: 'workoutTemplates', data: template })
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
            active: true,
            archivedAt: null,
          }
          exerciseOrder += 1
          docs.push({ collection: 'workoutTemplateExercises', data: row })
        }
      }
    }

    if (plans.length === 0) {
      docs.push(...this.dietDocs(profileId, householdId))
    }

    if (docs.length > 0) await commitAll(docs)
    markSeeded(profileId)
  },

  async seedFromProfile(sourceProfileId: string, targetProfileId: string, householdId: string): Promise<void> {
    if (alreadySeeded(targetProfileId)) return
    const existing = await workoutRepository.listTemplates(targetProfileId)
    if (existing.length > 0) {
      await this.seedProfile(targetProfileId, householdId)
      return
    }

    const sourceTemplates = await workoutRepository.listTemplates(sourceProfileId)
    if (sourceTemplates.length === 0) {
      await this.seedProfile(targetProfileId, householdId)
      return
    }

    const sourceRows = await workoutRepository.listTemplateExercisesByProfile(sourceProfileId)
    const docs: Array<{ collection: string; data: { id: string } & Record<string, unknown> }> = []
    for (const template of sourceTemplates) {
      const copy: WorkoutTemplate = {
        ...template,
        id: newId(),
        profileId: targetProfileId,
        householdId,
        createdAt: Date.now(),
      }
      docs.push({ collection: 'workoutTemplates', data: copy })
      for (const row of sourceRows.filter((item) => item.templateId === template.id)) {
        docs.push({
          collection: 'workoutTemplateExercises',
          data: {
            ...row,
            id: newId(),
            profileId: targetProfileId,
            householdId,
            templateId: copy.id,
          },
        })
      }
    }

    const plans = await nutritionRepository.listPlans(targetProfileId)
    if (plans.length === 0) docs.push(...this.dietDocs(targetProfileId, householdId))
    if (docs.length > 0) await commitAll(docs)
    markSeeded(targetProfileId)
  },

  dietDocs(profileId: string, householdId: string): Array<{ collection: string; data: DietPlan | DietMeal | DietMealItem }> {
    const plan: DietPlan = {
      id: newId(),
      profileId,
      householdId,
      name: PLACEHOLDER_DIET.name,
      calorieGoal: null,
      notes: '',
      isActive: true,
      isPlaceholder: true,
      archivedAt: null,
      createdAt: Date.now(),
    }
    const docs: Array<{ collection: string; data: DietPlan | DietMeal | DietMealItem }> = [
      { collection: 'dietPlans', data: plan },
    ]
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
        notes: '',
        youtubeUrl: mealDef.youtubeUrl ?? '',
        active: true,
        archivedAt: null,
      }
      mealOrder += 1
      docs.push({ collection: 'dietMeals', data: meal })
      let itemOrder = 0
      for (const item of mealDef.items) {
        docs.push({
          collection: 'dietMealItems',
          data: {
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
            notes: '',
            substitutes: [],
            order: itemOrder,
            active: true,
            archivedAt: null,
          },
        })
        itemOrder += 1
      }
    }
    return docs
  },

  async seedPlaceholderDiet(profileId: string, householdId: string): Promise<void> {
    await commitAll(this.dietDocs(profileId, householdId))
  },

  async importPayload(
    profileId: string,
    householdId: string,
    payload: ImportPayload,
  ): Promise<void> {
    const catalog = await this.ensureHouseholdCatalog(householdId)
    const existing = await exerciseRepository.listByHousehold(householdId)
    for (const item of existing) catalog.set(item.name.toLowerCase(), item)
    const docs: Array<{ collection: string; data: { id: string } & Record<string, unknown> }> = []

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
      docs.push({ collection: 'exercises', data: exercise })
      catalog.set(exercise.name.toLowerCase(), exercise)
    }

    if (payload.templates) {
      const currentTemplates = await workoutRepository.listTemplates(profileId)
      let order = currentTemplates.length
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
        docs.push({ collection: 'workoutTemplates', data: template })
        let exerciseOrder = 0
        for (const row of templateDef.exercises) {
          const exercise = catalog.get(row.exerciseName.toLowerCase())
          if (!exercise) continue
          docs.push({
            collection: 'workoutTemplateExercises',
            data: {
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
            },
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
      docs.push({ collection: 'dietPlans', data: plan })
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
          youtubeUrl: mealDef.youtubeUrl ?? '',
        }
        mealOrder += 1
        docs.push({ collection: 'dietMeals', data: meal })
        let itemOrder = 0
        for (const item of mealDef.items) {
          docs.push({
            collection: 'dietMealItems',
            data: {
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
            },
          })
          itemOrder += 1
        }
      }
    }

    if (docs.length > 0) await commitAll(docs)
  },
}
