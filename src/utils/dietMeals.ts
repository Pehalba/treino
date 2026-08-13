import { MEAL_CATEGORIES, MEAL_LABELS, type MealCategory } from '@/types'

export type DietMenuCategory = (typeof MEAL_CATEGORIES)[number]

export function normalizeMealCategory(category: MealCategory): DietMenuCategory {
  if (category === 'snack') return 'afternoon_snack'
  return category
}

export function firstMealPerCategory<T extends { category: MealCategory }>(meals: T[]): T[] {
  const seen = new Set<string>()
  const typical: T[] = []
  for (const meal of meals) {
    const category = normalizeMealCategory(meal.category)
    if (seen.has(category)) continue
    seen.add(category)
    typical.push(meal)
  }
  return typical
}

export function groupMealsByMenuCategory<T extends { category: MealCategory }>(meals: T[]) {
  return MEAL_CATEGORIES.map((category) => ({
    category,
    label: MEAL_LABELS[category],
    meals: meals.filter((meal) => normalizeMealCategory(meal.category) === category),
  }))
}

export function nextDishName(category: MealCategory, existingCount: number): string {
  const label = MEAL_LABELS[normalizeMealCategory(category)]
  return existingCount <= 0 ? label : `${label} ${existingCount + 1}`
}

export function mealMacroTotals(items: Array<{ calories: number; protein: number; carbs: number; fat: number }>) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}
