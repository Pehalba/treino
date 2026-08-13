import { carbPriorityIndex, foodRole, isProtectedFood } from '@/data/foodRoles'
import type { DietMeal, DietMealItem } from '@/types'
import { mealMacroTotals, firstMealPerCategory, normalizeMealCategory } from '@/utils/dietMeals'

export type MealWithItems = DietMeal & { items: DietMealItem[] }

const MEAL_WEIGHT: Record<ReturnType<typeof normalizeMealCategory>, number> = {
  breakfast: 0.1,
  morning_snack: 0.1,
  lunch: 0.2,
  afternoon_snack: 0.15,
  dinner: 0.2,
  supper: 0.1,
  other: 0.15,
}

function gramsFromLabel(label: string): number | null {
  const match = label.match(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i)
  if (!match?.[1]) return null
  return Number(match[1].replace(',', '.'))
}

function roundGrams(grams: number, foodName: string): number {
  const key = foodName.toLowerCase()
  const step = key.includes('ovo')
    ? 50
    : key.includes('azeite') || key.includes('mel') || key.includes('aveia') || key.includes('tapioca')
      ? 5
      : 10
  return Math.max(step, Math.round(grams / step) * step)
}

function scaleLabel(label: string, fromGrams: number, toGrams: number): string {
  if (fromGrams <= 0) return `${Math.round(toGrams)} g`
  const ratio = toGrams / fromGrams
  let next = label.replace(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/gi, `${Math.round(toGrams)} $2`)
  next = next.replace(/^(\d+(?:[.,]\d+)?)/, (_, raw: string) => {
    const value = Number(raw.replace(',', '.')) * ratio
    const rounded = Math.abs(value - Math.round(value)) < 0.15 ? Math.round(value) : Math.round(value * 2) / 2
    return String(rounded).replace('.', ',')
  })
  return next
}

function isFrozen(item: DietMealItem): boolean {
  if (item.manualOverride) return true
  if (item.autoScalable === false) return true
  return foodRole(item.foodName) === 'free_vegetable'
}

function baseGrams(item: DietMealItem): number {
  return gramsFromLabel(item.baseQuantityLabel ?? item.quantityLabel) ?? gramsFromLabel(item.quantityLabel) ?? 0
}

function currentGrams(item: DietMealItem): number {
  return gramsFromLabel(item.quantityLabel) ?? baseGrams(item)
}

function withBase(item: DietMealItem): DietMealItem {
  if (item.baseCalories != null) return item
  return {
    ...item,
    baseCalories: item.calories,
    baseProtein: item.protein,
    baseCarbs: item.carbs,
    baseFat: item.fat,
    baseQuantityLabel: item.quantityLabel,
  }
}

function applyRatio(item: DietMealItem, newGrams: number): DietMealItem {
  const grams = currentGrams(item)
  if (grams <= 0) return item
  const ratio = newGrams / grams
  return {
    ...item,
    calories: Math.round(item.calories * ratio * 10) / 10,
    protein: Math.round(item.protein * ratio * 10) / 10,
    carbs: Math.round(item.carbs * ratio * 10) / 10,
    fat: Math.round(item.fat * ratio * 10) / 10,
    quantityLabel: scaleLabel(item.quantityLabel, grams, newGrams),
  }
}

function room(item: DietMealItem, direction: 'add' | 'remove'): number {
  const grams = currentGrams(item)
  const mold = baseGrams(item) || grams
  if (grams <= 0 || item.calories <= 0) return 0
  const kcalPerG = item.calories / grams
  const role = foodRole(item.foodName)
  const protectedFood = isProtectedFood(item.foodName)
  if (direction === 'add') {
    const maxG = role === 'protein_anchor' ? mold * 1.5 : mold * 2
    return Math.max(0, (maxG - grams) * kcalPerG)
  }
  const minRatio = role === 'protein_anchor' ? 1 : protectedFood ? 0.5 : 0.35
  const minG = Math.max(roundGrams(mold * minRatio, item.foodName), role === 'protein_anchor' ? mold : 0)
  return Math.max(0, (grams - minG) * kcalPerG)
}

function shiftItem(item: DietMealItem, deltaKcal: number): { item: DietMealItem; used: number } {
  const grams = currentGrams(item)
  if (grams <= 0 || item.calories <= 0 || deltaKcal === 0) return { item, used: 0 }
  const direction = deltaKcal > 0 ? 'add' : 'remove'
  const available = room(item, direction)
  if (available <= 0) return { item, used: 0 }
  const used = Math.sign(deltaKcal) * Math.min(Math.abs(deltaKcal), available)
  const kcalPerG = item.calories / grams
  const newGrams = roundGrams(grams + used / kcalPerG, item.foodName)
  if (newGrams === grams) return { item, used: 0 }
  const next = applyRatio(item, newGrams)
  return { item: next, used: next.calories - item.calories }
}

function sortCarbs(items: DietMealItem[], direction: 'add' | 'remove') {
  return [...items].sort((a, b) => carbPriorityIndex(a.foodName, direction) - carbPriorityIndex(b.foodName, direction))
}

function applyDeltaToItems(items: DietMealItem[], deltaKcal: number): DietMealItem[] {
  let remaining = deltaKcal
  const next = items.map((item) => withBase(item))
  const direction = deltaKcal >= 0 ? 'add' : 'remove'

  const run = (kind: 'carb' | 'fat') => {
    const eligible = next.filter((item) => {
      if (isFrozen(item)) return false
      const role = foodRole(item.foodName)
      return kind === 'carb' ? role === 'carb_adjust' : role === 'fat_adjust'
    })
    const order = kind === 'carb' ? sortCarbs(eligible, direction) : eligible
    for (const current of order) {
      if (Math.abs(remaining) < 8) break
      const index = next.findIndex((item) => item.id === current.id)
      if (index < 0) continue
      const row = next[index]
      if (!row) continue
      const shifted = shiftItem(row, remaining)
      next[index] = shifted.item
      remaining -= shifted.used
    }
  }

  run('carb')
  run('fat')
  return next
}

export type ScaleDietResult = {
  meals: MealWithItems[]
  warnings: string[]
  largeChange: boolean
  before: ReturnType<typeof mealMacroTotals>
  after: ReturnType<typeof mealMacroTotals>
}

export function scaleDiet(params: {
  meals: MealWithItems[]
  targetKcal: number
  targetProtein: number
}): ScaleDietResult {
  const warnings: string[] = []
  const typical = () => firstMealPerCategory(meals)
  const before = mealMacroTotals(firstMealPerCategory(params.meals).flatMap((meal) => meal.items))
  const largeChange = before.calories > 0 && Math.abs(params.targetKcal - before.calories) / before.calories > 0.25
  if (largeChange) {
    warnings.push(
      'A meta está distante demais da dieta-base para um ajuste automático confortável. Revise o plano se as porções ficarem estranhas.',
    )
  }

  let meals = params.meals.map((meal) => ({
    ...meal,
    items: meal.items.map((item) => withBase(item)),
  }))

  meals = meals.map((meal) => {
    const weight = MEAL_WEIGHT[normalizeMealCategory(meal.category)] ?? 0.1
    const current = mealMacroTotals(meal.items).calories
    const delta = params.targetKcal * weight - current
    return {
      ...meal,
      items: applyDeltaToItems(meal.items, delta),
    }
  })

  let after = mealMacroTotals(typical().flatMap((meal) => meal.items))
  let leftover = params.targetKcal - after.calories
  if (Math.abs(leftover) >= 12) {
    const count = Math.max(1, typical().length)
    meals = meals.map((meal) => ({
      ...meal,
      items: applyDeltaToItems(meal.items, leftover / count),
    }))
    after = mealMacroTotals(typical().flatMap((meal) => meal.items))
  }

  if (after.protein + 4 < params.targetProtein) {
    const anchors = typical().flatMap((meal) =>
      meal.items.filter((item) => foodRole(item.foodName) === 'protein_anchor' && !item.manualOverride),
    )
    if (anchors.length > 0) {
      const share = ((params.targetProtein - after.protein) * 4) / anchors.length
      const names = new Set(anchors.map((item) => item.foodName))
      meals = meals.map((meal) => ({
        ...meal,
        items: meal.items.map((item) => (names.has(item.foodName) ? shiftItem(item, share).item : item)),
      }))
      after = mealMacroTotals(typical().flatMap((meal) => meal.items))
    }
  }

  if (Math.abs(after.calories - params.targetKcal) / Math.max(params.targetKcal, 1) > 0.08) {
    warnings.push('Não deu para chegar exatamente na meta só com os alimentos atuais. Ajuste um prato na mão se precisar.')
  }

  return { meals, warnings, largeChange, before, after }
}
