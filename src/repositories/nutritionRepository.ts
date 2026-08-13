import { where } from 'firebase/firestore'
import { createDoc, listDocs, patchDoc, subscribeDocs } from '@/repositories/base'
import type { DietMeal, DietMealItem, DietPlan, Food, FoodLog } from '@/types'
import type { Unsubscribe } from 'firebase/firestore'

export const nutritionRepository = {
  listPlans: async (profileId: string) =>
    (await listDocs<DietPlan>('dietPlans', where('profileId', '==', profileId))).sort(
      (a, b) => b.createdAt - a.createdAt,
    ),
  subscribePlans: (
    profileId: string,
    onData: (items: DietPlan[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe => subscribeDocs<DietPlan>('dietPlans', [where('profileId', '==', profileId)], onData, onError),
  savePlan: (plan: DietPlan) => createDoc('dietPlans', plan),
  updatePlan: (id: string, data: Partial<DietPlan> | Record<string, unknown>) => patchDoc('dietPlans', id, data),

  listMeals: async (dietPlanId: string) =>
    (await listDocs<DietMeal>('dietMeals', where('dietPlanId', '==', dietPlanId))).sort((a, b) => a.order - b.order),
  saveMeal: (meal: DietMeal) => createDoc('dietMeals', meal),
  updateMeal: (id: string, data: Partial<DietMeal> | Record<string, unknown>) => patchDoc('dietMeals', id, data),

  listMealItems: async (dietMealId: string) =>
    (await listDocs<DietMealItem>('dietMealItems', where('dietMealId', '==', dietMealId))).sort(
      (a, b) => a.order - b.order,
    ),
  listMealItemsByProfile: (profileId: string) =>
    listDocs<DietMealItem>('dietMealItems', where('profileId', '==', profileId)),
  saveMealItem: (item: DietMealItem) => createDoc('dietMealItems', item),
  updateMealItem: (id: string, data: Partial<DietMealItem> | Record<string, unknown>) =>
    patchDoc('dietMealItems', id, data),

  saveFood: (food: Food) => createDoc('foods', food),
  listFoods: (householdId: string) => listDocs<Food>('foods', where('householdId', '==', householdId)),

  saveLog: (log: FoodLog) => createDoc('foodLogs', log),
  listLogsByDate: async (profileId: string, date: string) =>
    listDocs<FoodLog>('foodLogs', where('profileId', '==', profileId), where('date', '==', date)),
  listLogsSince: async (profileId: string, fromDate: string) =>
    listDocs<FoodLog>('foodLogs', where('profileId', '==', profileId), where('date', '>=', fromDate)),
  subscribeLogsByDate: (
    profileId: string,
    date: string,
    onData: (items: FoodLog[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe =>
    subscribeDocs<FoodLog>(
      'foodLogs',
      [where('profileId', '==', profileId), where('date', '==', date)],
      onData,
      onError,
    ),
  listLogsByProfile: async (profileId: string) =>
    (await listDocs<FoodLog>('foodLogs', where('profileId', '==', profileId))).sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
}
