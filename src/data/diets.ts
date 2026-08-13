import type { MealCategory } from '@/types'

export type DietPresetItem = {
  foodName: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantityLabel: string
}

export type DietPresetMeal = {
  category: MealCategory
  name: string
  youtubeUrl?: string
  items: DietPresetItem[]
}

export type DietPreset = {
  name: string
  meals: DietPresetMeal[]
}

export const PEDRO_DIET: DietPreset = {
  name: 'Dieta Bulking Pedro',
  meals: [
    {
      category: 'breakfast',
      name: 'Café da manhã',
      items: [
        { foodName: 'Leite integral', calories: 195, protein: 7, carbs: 21.5, fat: 9.1, quantityLabel: '1 copo grande (300 ml / 300 g)' },
        { foodName: 'Aveia em flocos', calories: 197, protein: 7, carbs: 33.3, fat: 4.2, quantityLabel: '5 colheres de sopa rasas (50 g)' },
        { foodName: 'Banana nanica', calories: 110.4, protein: 1.7, carbs: 28.6, fat: 0.1, quantityLabel: '1 unidade média (120 g)' },
        { foodName: 'Ovo cozido ou mexido sem óleo', calories: 73, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: '1 unidade (50 g)' },
      ],
    },
    {
      category: 'morning_snack',
      name: 'Lanche da manhã',
      items: [
        { foodName: 'Iogurte natural', calories: 86.7, protein: 7, carbs: 3.2, fat: 5.1, quantityLabel: '1 pote (170 g)' },
        { foodName: 'Banana nanica', calories: 92, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: '1 unidade pequena (100 g)' },
        { foodName: 'Aveia em flocos', calories: 78.8, protein: 2.8, carbs: 13.3, fat: 1.7, quantityLabel: '2 colheres de sopa rasas (20 g)' },
        { foodName: 'Mel', calories: 46.4, protein: 0, carbs: 12.6, fat: 0, quantityLabel: '1 colher de sopa rasa (15 g)' },
      ],
    },
    {
      category: 'lunch',
      name: 'Almoço',
      items: [
        { foodName: 'Arroz branco cozido', calories: 384, protein: 7.5, carbs: 84.3, fat: 0.6, quantityLabel: '2 xícaras de chá rasas (300 g)' },
        { foodName: 'Feijão carioca cozido', calories: 114, protein: 7.2, carbs: 20.4, fat: 0.8, quantityLabel: '1 concha média cheia (150 g)' },
        { foodName: 'Peito de frango grelhado/ao molho', calories: 143.1, protein: 28.8, carbs: 0, fat: 2.2, quantityLabel: '1 filé médio (90 g)' },
        { foodName: 'Azeite de oliva', calories: 88.4, protein: 0, carbs: 0, fat: 10, quantityLabel: '1 colher de sobremesa (10 g)' },
        { foodName: 'Tomate cru', calories: 15, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: '1 unidade média (100 g)' },
      ],
    },
    {
      category: 'afternoon_snack',
      name: 'Lanche da tarde',
      items: [
        { foodName: 'Tapioca sem recheio', calories: 231.2, protein: 0.3, carbs: 57.5, fat: 0, quantityLabel: '1 disco grande (80 g pronto)' },
        { foodName: 'Ovo', calories: 73, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: '1 unidade (50 g)' },
        { foodName: 'Queijo minas frescal', calories: 79.2, protein: 5.2, carbs: 1, fat: 6.1, quantityLabel: '1 fatia média (30 g)' },
      ],
    },
    {
      category: 'dinner',
      name: 'Jantar',
      items: [
        { foodName: 'Macarrão de trigo cozido', calories: 375, protein: 10.5, carbs: 81.9, fat: 1.4, quantityLabel: '≈ 3 escumadeiras cheias (300 g)' },
        { foodName: 'Patinho bovino grelhado/moído', calories: 197.1, protein: 32.3, carbs: 0, fat: 6.6, quantityLabel: '≈ 1/2 xícara (90 g)' },
        { foodName: 'Molho de tomate', calories: 57, protein: 2.1, carbs: 11.6, fat: 1.4, quantityLabel: '≈ 3/4 xícara (150 g)' },
        { foodName: 'Azeite de oliva', calories: 88.4, protein: 0, carbs: 0, fat: 10, quantityLabel: '1 colher de sobremesa (10 g)' },
      ],
    },
    {
      category: 'supper',
      name: 'Ceia',
      items: [
        { foodName: 'Leite integral', calories: 195, protein: 7, carbs: 21.5, fat: 9.1, quantityLabel: '1 copo grande (300 ml / 300 g)' },
        { foodName: 'Aveia em flocos', calories: 118.2, protein: 4.2, carbs: 20, fat: 2.5, quantityLabel: '3 colheres de sopa rasas (30 g)' },
        { foodName: 'Mel', calories: 46.4, protein: 0, carbs: 12.6, fat: 0, quantityLabel: '1 colher de sopa rasa (15 g)' },
      ],
    },
    {
      category: 'other',
      name: 'Extra / pré-treino',
      items: [
        { foodName: 'Pão integral', calories: 202.4, protein: 7.5, carbs: 39.9, fat: 3, quantityLabel: '3 fatias (80 g)' },
        { foodName: 'Banana nanica', calories: 110.4, protein: 1.7, carbs: 28.6, fat: 0.1, quantityLabel: '1 unidade média (120 g)' },
        { foodName: 'Mel', calories: 61.8, protein: 0, carbs: 16.8, fat: 0, quantityLabel: '1 colher de sopa cheia (20 g)' },
      ],
    },
  ],
}

export const CAROL_DIET: DietPreset = {
  name: 'Dieta Bulking Carol',
  meals: [
    {
      category: 'breakfast',
      name: 'Café da manhã',
      items: [
        { foodName: 'Leite integral', calories: 117, protein: 4.2, carbs: 12.9, fat: 5.5, quantityLabel: '3/4 de copo (180 ml / 180 g)' },
        { foodName: 'Aveia em flocos', calories: 98.5, protein: 3.5, carbs: 16.6, fat: 2.1, quantityLabel: '2 1/2 colheres de sopa rasas (25 g)' },
        { foodName: 'Banana nanica', calories: 82.8, protein: 1.3, carbs: 21.4, fat: 0.1, quantityLabel: '1 unidade pequena (90 g)' },
        { foodName: 'Ovo cozido ou mexido sem óleo', calories: 73, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: '1 unidade (50 g)' },
      ],
    },
    {
      category: 'morning_snack',
      name: 'Lanche da manhã',
      items: [
        { foodName: 'Iogurte natural', calories: 61.2, protein: 4.9, carbs: 2.3, fat: 3.6, quantityLabel: '≈ 3/4 de pote (120 g)' },
        { foodName: 'Banana nanica', calories: 64.4, protein: 1, carbs: 16.7, fat: 0.1, quantityLabel: '≈ 2/3 de unidade pequena (70 g)' },
        { foodName: 'Aveia em flocos', calories: 39.4, protein: 1.4, carbs: 6.7, fat: 0.8, quantityLabel: '1 colher de sopa rasa (10 g)' },
        { foodName: 'Mel', calories: 30.9, protein: 0, carbs: 8.4, fat: 0, quantityLabel: '2 colheres de chá (10 g)' },
      ],
    },
    {
      category: 'lunch',
      name: 'Almoço',
      items: [
        { foodName: 'Arroz branco cozido', calories: 192, protein: 3.8, carbs: 42.1, fat: 0.3, quantityLabel: '1 xícara de chá rasa (150 g)' },
        { foodName: 'Feijão carioca cozido', calories: 68.4, protein: 4.3, carbs: 12.2, fat: 0.5, quantityLabel: '≈ 2/3 de concha média (90 g)' },
        { foodName: 'Peito de frango grelhado/ao molho', calories: 79.5, protein: 16, carbs: 0, fat: 1.2, quantityLabel: '≈ 1/2 filé médio (50 g)' },
        { foodName: 'Azeite de oliva', calories: 44.2, protein: 0, carbs: 0, fat: 5, quantityLabel: '1 colher de chá (5 g)' },
        { foodName: 'Tomate cru', calories: 15, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: '1 unidade média (100 g)' },
      ],
    },
    {
      category: 'afternoon_snack',
      name: 'Lanche da tarde',
      items: [
        { foodName: 'Tapioca sem recheio', calories: 130.1, protein: 0.2, carbs: 32.4, fat: 0, quantityLabel: '1 disco pequeno (45 g pronto)' },
        { foodName: 'Ovo', calories: 73, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: '1 unidade (50 g)' },
        { foodName: 'Queijo minas frescal', calories: 39.6, protein: 2.6, carbs: 0.5, fat: 3, quantityLabel: '1/2 fatia média (15 g)' },
      ],
    },
    {
      category: 'dinner',
      name: 'Jantar',
      items: [
        { foodName: 'Macarrão de trigo cozido', calories: 187.5, protein: 5.2, carbs: 41, fat: 0.7, quantityLabel: '≈ 1 1/2 escumadeira cheia (150 g)' },
        { foodName: 'Patinho bovino grelhado/moído', calories: 109.5, protein: 17.9, carbs: 0, fat: 3.6, quantityLabel: '≈ 3 colheres de sopa cheias (50 g)' },
        { foodName: 'Molho de tomate', calories: 38, protein: 1.4, carbs: 7.7, fat: 0.9, quantityLabel: '1/2 xícara (100 g)' },
        { foodName: 'Azeite de oliva', calories: 44.2, protein: 0, carbs: 0, fat: 5, quantityLabel: '1 colher de chá (5 g)' },
      ],
    },
    {
      category: 'supper',
      name: 'Ceia',
      items: [
        { foodName: 'Leite integral', calories: 117, protein: 4.2, carbs: 12.9, fat: 5.5, quantityLabel: '3/4 de copo (180 ml / 180 g)' },
        { foodName: 'Aveia em flocos', calories: 59.1, protein: 2.1, carbs: 10, fat: 1.3, quantityLabel: '1 1/2 colher de sopa rasa (15 g)' },
        { foodName: 'Mel', calories: 30.9, protein: 0, carbs: 8.4, fat: 0, quantityLabel: '2 colheres de chá (10 g)' },
      ],
    },
    {
      category: 'other',
      name: 'Extra / pré-treino',
      items: [
        { foodName: 'Pão integral', calories: 75.9, protein: 2.8, carbs: 15, fat: 1.1, quantityLabel: '1 fatia grande (30 g)' },
        { foodName: 'Banana nanica', calories: 55.2, protein: 0.8, carbs: 14.3, fat: 0.1, quantityLabel: '1/2 unidade pequena (60 g)' },
        { foodName: 'Mel', calories: 24.7, protein: 0, carbs: 6.7, fat: 0, quantityLabel: '≈ 1 colher de chá cheia (8 g)' },
      ],
    },
  ],
}

export function presetForProfile(name: string, avatar?: string | null): DietPreset | null {
  const key = (avatar || name).trim().toLowerCase()
  if (key === 'pedro') return PEDRO_DIET
  if (key === 'carol') return CAROL_DIET
  return null
}

export function dietPresetTotals(diet: DietPreset) {
  return diet.meals.flatMap((meal) => meal.items).reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}
