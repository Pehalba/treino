import type { MealCategory } from '@/types'
import { firstMealPerCategory } from '@/utils/dietMeals'

export const DIET_PRESET_VERSION = '7opcoes'

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
  name: "Dieta Bulking Pedro",
  meals: [
    {
      category: "breakfast",
      name: "Café aveia e banana",
      items: [
        { foodName: "Leite integral", calories: 195.0, protein: 7.0, carbs: 21.5, fat: 9.1, quantityLabel: "300 ml (300 g)" },
        { foodName: "Aveia em flocos", calories: 197.0, protein: 7.0, carbs: 33.3, fat: 4.2, quantityLabel: "aprox. 5 colheres de sopa rasas (50 g)" },
        { foodName: "Banana nanica", calories: 110.4, protein: 1.7, carbs: 28.6, fat: 0.1, quantityLabel: "aprox. 1 unidade média (120 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
      ],
    },
    {
      category: "breakfast",
      name: "Café cuscuz, ovos e banana",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 169.5, protein: 3.3, carbs: 38.0, fat: 1.1, quantityLabel: "aprox. 1.5 xícara(s) pequena(s) (150 g)" },
        { foodName: "Ovo", calories: 146.0, protein: 13.4, carbs: 0.6, fat: 9.6, quantityLabel: "2 unidades (100 g)" },
        { foodName: "Leite integral", calories: 130.0, protein: 4.7, carbs: 14.3, fat: 6.1, quantityLabel: "200 ml (200 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
      ],
    },
    {
      category: "breakfast",
      name: "Café pão francês e mamão",
      items: [
        { foodName: "Pão francês", calories: 270.0, protein: 7.2, carbs: 52.7, fat: 2.8, quantityLabel: "aprox. 1.8 unidade(s) (90 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Queijo minas frescal", calories: 39.6, protein: 2.6, carbs: 0.5, fat: 3.0, quantityLabel: "aprox. 0.5 fatia(s) média(s) (15 g)" },
        { foodName: "Leite integral", calories: 130.0, protein: 4.7, carbs: 14.3, fat: 6.1, quantityLabel: "200 ml (200 g)" },
        { foodName: "Mamão formosa", calories: 45.0, protein: 0.8, carbs: 11.6, fat: 0.1, quantityLabel: "aprox. 100 g em cubos/fatia" },
      ],
    },
    {
      category: "breakfast",
      name: "Café tapioca com ovos",
      items: [
        { foodName: "Tapioca", calories: 173.4, protein: 0.2, carbs: 43.1, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 60 g pronto" },
        { foodName: "Ovo", calories: 146.0, protein: 13.4, carbs: 0.6, fat: 9.6, quantityLabel: "2 unidades (100 g)" },
        { foodName: "Queijo minas frescal", calories: 79.2, protein: 5.2, carbs: 1.0, fat: 6.1, quantityLabel: "aprox. 1.0 fatia(s) média(s) (30 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
        { foodName: "Leite integral", calories: 97.5, protein: 3.5, carbs: 10.8, fat: 4.5, quantityLabel: "150 ml (150 g)" },
      ],
    },
    {
      category: "breakfast",
      name: "Café pão, iogurte e banana",
      items: [
        { foodName: "Pão integral", calories: 202.4, protein: 7.5, carbs: 39.9, fat: 3.0, quantityLabel: "aprox. 3.0 fatia(s) (80 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Iogurte natural", calories: 86.7, protein: 7.0, carbs: 3.2, fat: 5.1, quantityLabel: "1 pote (170 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
        { foodName: "Pasta de amendoim", calories: 58.8, protein: 2.5, carbs: 2.0, fat: 5.0, quantityLabel: "2 colheres de chá rasas (10 g)" },
        { foodName: "Mel", calories: 61.9, protein: 0.0, carbs: 16.8, fat: 0.0, quantityLabel: "1 colher de sopa cheia (20 g)" },
      ],
    },
    {
      category: "breakfast",
      name: "Panqueca de banana e aveia",
      items: [
        { foodName: "Aveia em flocos", calories: 275.8, protein: 9.8, carbs: 46.6, fat: 5.9, quantityLabel: "aprox. 7 colheres de sopa rasas (70 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Banana nanica", calories: 110.4, protein: 1.7, carbs: 28.6, fat: 0.1, quantityLabel: "aprox. 1 unidade média (120 g)" },
        { foodName: "Iogurte natural", calories: 51.0, protein: 4.1, carbs: 1.9, fat: 3.0, quantityLabel: "aprox. 100 g" },
        { foodName: "Mel", calories: 61.9, protein: 0.0, carbs: 16.8, fat: 0.0, quantityLabel: "1 colher de sopa cheia (20 g)" },
      ],
    },
    {
      category: "breakfast",
      name: "Café batata-doce e ovos",
      items: [
        { foodName: "Batata-doce cozida", calories: 192.5, protein: 1.5, carbs: 46.0, fat: 0.2, quantityLabel: "aprox. 2.5 unidade(s) pequena(s) (250 g)" },
        { foodName: "Ovo", calories: 146.0, protein: 13.4, carbs: 0.6, fat: 9.6, quantityLabel: "2 unidades (100 g)" },
        { foodName: "Leite integral", calories: 162.5, protein: 5.8, carbs: 17.9, fat: 7.6, quantityLabel: "250 ml (250 g)" },
        { foodName: "Mamão formosa", calories: 67.5, protein: 1.2, carbs: 17.4, fat: 0.1, quantityLabel: "aprox. 150 g em cubos/fatia" },
      ],
    },
    {
      category: "morning_snack",
      name: "Iogurte com banana e aveia",
      items: [
        { foodName: "Iogurte natural", calories: 86.7, protein: 7.0, carbs: 3.2, fat: 5.1, quantityLabel: "1 pote (170 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
        { foodName: "Aveia em flocos", calories: 78.8, protein: 2.8, carbs: 13.3, fat: 1.7, quantityLabel: "aprox. 2 colheres de sopa rasas (20 g)" },
        { foodName: "Mel", calories: 46.4, protein: 0.0, carbs: 12.6, fat: 0.0, quantityLabel: "1 colher de sopa rasa (15 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Vitamina leve de banana",
      items: [
        { foodName: "Leite integral", calories: 130.0, protein: 4.7, carbs: 14.3, fat: 6.1, quantityLabel: "200 ml (200 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
        { foodName: "Aveia em flocos", calories: 98.5, protein: 3.5, carbs: 16.6, fat: 2.1, quantityLabel: "aprox. 2.5 colheres de sopa rasas (25 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Pão integral com minas e mamão",
      items: [
        { foodName: "Pão integral", calories: 177.1, protein: 6.6, carbs: 34.9, fat: 2.6, quantityLabel: "aprox. 2.6 fatia(s) (70 g)" },
        { foodName: "Queijo minas frescal", calories: 79.2, protein: 5.2, carbs: 1.0, fat: 6.1, quantityLabel: "aprox. 1.0 fatia(s) média(s) (30 g)" },
        { foodName: "Mamão formosa", calories: 45.0, protein: 0.8, carbs: 11.6, fat: 0.1, quantityLabel: "aprox. 100 g em cubos/fatia" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Tapioca com ovo e minas",
      items: [
        { foodName: "Tapioca", calories: 144.5, protein: 0.2, carbs: 35.9, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 50 g pronto" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Queijo minas frescal", calories: 79.2, protein: 5.2, carbs: 1.0, fat: 6.1, quantityLabel: "aprox. 1.0 fatia(s) média(s) (30 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Meio pão francês com leite e minas",
      items: [
        { foodName: "Pão francês", calories: 150.0, protein: 4.0, carbs: 29.3, fat: 1.6, quantityLabel: "aprox. 1.0 unidade(s) (50 g)" },
        { foodName: "Leite integral", calories: 130.0, protein: 4.7, carbs: 14.3, fat: 6.1, quantityLabel: "200 ml (200 g)" },
        { foodName: "Queijo minas frescal", calories: 26.4, protein: 1.7, carbs: 0.3, fat: 2.0, quantityLabel: "aprox. 0.3 fatia(s) média(s) (10 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Iogurte com mamão e aveia",
      items: [
        { foodName: "Iogurte natural", calories: 86.7, protein: 7.0, carbs: 3.2, fat: 5.1, quantityLabel: "1 pote (170 g)" },
        { foodName: "Mamão formosa", calories: 67.5, protein: 1.2, carbs: 17.4, fat: 0.1, quantityLabel: "aprox. 150 g em cubos/fatia" },
        { foodName: "Aveia em flocos", calories: 98.5, protein: 3.5, carbs: 16.6, fat: 2.1, quantityLabel: "aprox. 2.5 colheres de sopa rasas (25 g)" },
        { foodName: "Mel", calories: 46.4, protein: 0.0, carbs: 12.6, fat: 0.0, quantityLabel: "1 colher de sopa rasa (15 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Batata-doce com leite e minas",
      items: [
        { foodName: "Batata-doce cozida", calories: 77.0, protein: 0.6, carbs: 18.4, fat: 0.1, quantityLabel: "aprox. 1.0 unidade(s) pequena(s) (100 g)" },
        { foodName: "Leite integral", calories: 130.0, protein: 4.7, carbs: 14.3, fat: 6.1, quantityLabel: "200 ml (200 g)" },
        { foodName: "Pasta de amendoim", calories: 58.8, protein: 2.5, carbs: 2.0, fat: 5.0, quantityLabel: "2 colheres de chá rasas (10 g)" },
        { foodName: "Queijo minas frescal", calories: 39.6, protein: 2.6, carbs: 0.5, fat: 3.0, quantityLabel: "aprox. 0.5 fatia(s) média(s) (15 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço frango, arroz e feijão",
      items: [
        { foodName: "Arroz branco cozido", calories: 384.0, protein: 7.5, carbs: 84.3, fat: 0.6, quantityLabel: "aprox. 2.0 xícara(s) rasa(s) (300 g)" },
        { foodName: "Feijão carioca cozido", calories: 114.0, protein: 7.2, carbs: 20.4, fat: 0.8, quantityLabel: "aprox. 1.0 concha(s) média(s) (150 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 143.1, protein: 28.8, carbs: 0.0, fat: 2.2, quantityLabel: "aprox. 90 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço patinho, arroz e feijão",
      items: [
        { foodName: "Arroz branco cozido", calories: 384.0, protein: 7.5, carbs: 84.3, fat: 0.6, quantityLabel: "aprox. 2.0 xícara(s) rasa(s) (300 g)" },
        { foodName: "Feijão carioca cozido", calories: 114.0, protein: 7.2, carbs: 20.4, fat: 0.8, quantityLabel: "aprox. 1.0 concha(s) média(s) (150 g)" },
        { foodName: "Patinho bovino moído/grelhado", calories: 175.2, protein: 28.7, carbs: 0.0, fat: 5.9, quantityLabel: "aprox. 80 g pronto" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço macarrão com frango",
      items: [
        { foodName: "Macarrão de trigo cozido", calories: 437.5, protein: 12.2, carbs: 95.5, fat: 1.6, quantityLabel: "aprox. 3.5 escumadeira(s) cheia(s) (350 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 143.1, protein: 28.8, carbs: 0.0, fat: 2.2, quantityLabel: "aprox. 90 g de frango pronto" },
        { foodName: "Molho de tomate", calories: 57.0, protein: 2.1, carbs: 11.6, fat: 1.4, quantityLabel: "aprox. 0.75 xícara(s) (150 g)" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço arroz, feijão e atum",
      items: [
        { foodName: "Arroz branco cozido", calories: 384.0, protein: 7.5, carbs: 84.3, fat: 0.6, quantityLabel: "aprox. 2.0 xícara(s) rasa(s) (300 g)" },
        { foodName: "Feijão carioca cozido", calories: 114.0, protein: 7.2, carbs: 20.4, fat: 0.8, quantityLabel: "aprox. 1.0 concha(s) média(s) (150 g)" },
        { foodName: "Atum em água drenado", calories: 127.6, protein: 28.6, carbs: 0.0, fat: 1.1, quantityLabel: "aprox. 0.9 lata(s) drenada(s) (110 g)" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço cuscuz com frango",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 339.0, protein: 6.6, carbs: 75.9, fat: 2.1, quantityLabel: "aprox. 3.0 xícara(s) pequena(s) (300 g)" },
        { foodName: "Feijão carioca cozido", calories: 114.0, protein: 7.2, carbs: 20.4, fat: 0.8, quantityLabel: "aprox. 1.0 concha(s) média(s) (150 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 159.0, protein: 32.0, carbs: 0.0, fat: 2.4, quantityLabel: "aprox. 100 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço mandioca com frango",
      items: [
        { foodName: "Mandioca cozida", calories: 312.5, protein: 1.5, carbs: 75.2, fat: 0.8, quantityLabel: "aprox. 2.5 pedaço(s) médio(s) (250 g)" },
        { foodName: "Feijão carioca cozido", calories: 114.0, protein: 7.2, carbs: 20.4, fat: 0.8, quantityLabel: "aprox. 1.0 concha(s) média(s) (150 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 159.0, protein: 32.0, carbs: 0.0, fat: 2.4, quantityLabel: "aprox. 100 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço batata, arroz e patinho",
      items: [
        { foodName: "Batata inglesa cozida", calories: 130.0, protein: 3.0, carbs: 29.8, fat: 0.0, quantityLabel: "aprox. 2.5 unidade(s) média(s) (250 g)" },
        { foodName: "Arroz branco cozido", calories: 320.0, protein: 6.2, carbs: 70.2, fat: 0.5, quantityLabel: "aprox. 1.7 xícara(s) rasa(s) (250 g)" },
        { foodName: "Patinho bovino moído/grelhado", calories: 197.1, protein: 32.3, carbs: 0.0, fat: 6.6, quantityLabel: "aprox. 90 g pronto" },
        { foodName: "Azeite de oliva", calories: 70.7, protein: 0.0, carbs: 0.0, fat: 8.0, quantityLabel: "1 colher de sobremesa (8 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Tapioca com ovo e minas",
      items: [
        { foodName: "Tapioca", calories: 231.2, protein: 0.3, carbs: 57.5, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 80 g pronto" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Queijo minas frescal", calories: 79.2, protein: 5.2, carbs: 1.0, fat: 6.1, quantityLabel: "aprox. 1.0 fatia(s) média(s) (30 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Pão com ovo e banana",
      items: [
        { foodName: "Pão integral", calories: 151.8, protein: 5.6, carbs: 29.9, fat: 2.2, quantityLabel: "aprox. 2.2 fatia(s) (60 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Banana nanica", calories: 110.4, protein: 1.7, carbs: 28.6, fat: 0.1, quantityLabel: "aprox. 1 unidade média (120 g)" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Cuscuz com ovo e minas",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 265.6, protein: 5.2, carbs: 59.5, fat: 1.6, quantityLabel: "aprox. 2.4 xícara(s) pequena(s) (235 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Queijo minas frescal", calories: 31.7, protein: 2.1, carbs: 0.4, fat: 2.4, quantityLabel: "aprox. 0.4 fatia(s) média(s) (12 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Iogurte com banana e pasta",
      items: [
        { foodName: "Iogurte natural", calories: 61.2, protein: 4.9, carbs: 2.3, fat: 3.6, quantityLabel: "aprox. 120 g" },
        { foodName: "Aveia em flocos", calories: 118.2, protein: 4.2, carbs: 20.0, fat: 2.5, quantityLabel: "aprox. 3 colheres de sopa rasas (30 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
        { foodName: "Pasta de amendoim", calories: 58.8, protein: 2.5, carbs: 2.0, fat: 5.0, quantityLabel: "2 colheres de chá rasas (10 g)" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Pão francês com minas e tomate",
      items: [
        { foodName: "Pão francês", calories: 210.0, protein: 5.6, carbs: 41.0, fat: 2.2, quantityLabel: "aprox. 1.4 unidade(s) (70 g)" },
        { foodName: "Queijo minas frescal", calories: 92.4, protein: 6.1, carbs: 1.2, fat: 7.1, quantityLabel: "aprox. 1.2 fatia(s) média(s) (35 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Batata-doce com ovo e leite",
      items: [
        { foodName: "Batata-doce cozida", calories: 154.0, protein: 1.2, carbs: 36.8, fat: 0.2, quantityLabel: "aprox. 2.0 unidade(s) pequena(s) (200 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Leite integral", calories: 130.0, protein: 4.7, carbs: 14.3, fat: 6.1, quantityLabel: "200 ml (200 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Tapioca com frango e minas",
      items: [
        { foodName: "Tapioca", calories: 260.1, protein: 0.3, carbs: 64.7, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 90 g pronto" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 35.0, protein: 7.0, carbs: 0.0, fat: 0.5, quantityLabel: "aprox. 22 g de frango pronto" },
        { foodName: "Queijo minas frescal", calories: 52.8, protein: 3.5, carbs: 0.7, fat: 4.1, quantityLabel: "aprox. 0.7 fatia(s) média(s) (20 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar macarrão com patinho",
      items: [
        { foodName: "Macarrão de trigo cozido", calories: 375.0, protein: 10.5, carbs: 81.9, fat: 1.4, quantityLabel: "aprox. 3.0 escumadeira(s) cheia(s) (300 g)" },
        { foodName: "Patinho bovino moído/grelhado", calories: 197.1, protein: 32.3, carbs: 0.0, fat: 6.6, quantityLabel: "aprox. 90 g pronto" },
        { foodName: "Molho de tomate", calories: 57.0, protein: 2.1, carbs: 11.6, fat: 1.4, quantityLabel: "aprox. 0.75 xícara(s) (150 g)" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar arroz, feijão e frango",
      items: [
        { foodName: "Arroz branco cozido", calories: 358.4, protein: 7.0, carbs: 78.7, fat: 0.6, quantityLabel: "aprox. 1.9 xícara(s) rasa(s) (280 g)" },
        { foodName: "Feijão carioca cozido", calories: 98.8, protein: 6.2, carbs: 17.7, fat: 0.7, quantityLabel: "aprox. 0.9 concha(s) média(s) (130 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 143.1, protein: 28.8, carbs: 0.0, fat: 2.2, quantityLabel: "aprox. 90 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar batata, arroz e frango",
      items: [
        { foodName: "Batata inglesa cozida", calories: 130.0, protein: 3.0, carbs: 29.8, fat: 0.0, quantityLabel: "aprox. 2.5 unidade(s) média(s) (250 g)" },
        { foodName: "Arroz branco cozido", calories: 320.0, protein: 6.2, carbs: 70.2, fat: 0.5, quantityLabel: "aprox. 1.7 xícara(s) rasa(s) (250 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 159.0, protein: 32.0, carbs: 0.0, fat: 2.4, quantityLabel: "aprox. 100 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar mandioca com patinho",
      items: [
        { foodName: "Mandioca cozida", calories: 312.5, protein: 1.5, carbs: 75.2, fat: 0.8, quantityLabel: "aprox. 2.5 pedaço(s) médio(s) (250 g)" },
        { foodName: "Feijão carioca cozido", calories: 76.0, protein: 4.8, carbs: 13.6, fat: 0.5, quantityLabel: "aprox. 0.7 concha(s) média(s) (100 g)" },
        { foodName: "Patinho bovino moído/grelhado", calories: 197.1, protein: 32.3, carbs: 0.0, fat: 6.6, quantityLabel: "aprox. 90 g pronto" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar cuscuz com frango",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 316.4, protein: 6.2, carbs: 70.8, fat: 2.0, quantityLabel: "aprox. 2.8 xícara(s) pequena(s) (280 g)" },
        { foodName: "Feijão carioca cozido", calories: 91.2, protein: 5.8, carbs: 16.3, fat: 0.6, quantityLabel: "aprox. 0.8 concha(s) média(s) (120 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 159.0, protein: 32.0, carbs: 0.0, fat: 2.4, quantityLabel: "aprox. 100 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar macarrão com atum",
      items: [
        { foodName: "Macarrão de trigo cozido", calories: 437.5, protein: 12.2, carbs: 95.5, fat: 1.6, quantityLabel: "aprox. 3.5 escumadeira(s) cheia(s) (350 g)" },
        { foodName: "Atum em água drenado", calories: 127.6, protein: 28.6, carbs: 0.0, fat: 1.1, quantityLabel: "aprox. 0.9 lata(s) drenada(s) (110 g)" },
        { foodName: "Molho de tomate", calories: 57.0, protein: 2.1, carbs: 11.6, fat: 1.4, quantityLabel: "aprox. 0.75 xícara(s) (150 g)" },
        { foodName: "Azeite de oliva", calories: 88.4, protein: 0.0, carbs: 0.0, fat: 10.0, quantityLabel: "1 colher de sobremesa (10 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar arroz com patinho e feijão",
      items: [
        { foodName: "Arroz branco cozido", calories: 384.0, protein: 7.5, carbs: 84.3, fat: 0.6, quantityLabel: "aprox. 2.0 xícara(s) rasa(s) (300 g)" },
        { foodName: "Patinho bovino moído/grelhado", calories: 197.1, protein: 32.3, carbs: 0.0, fat: 6.6, quantityLabel: "aprox. 90 g pronto" },
        { foodName: "Feijão carioca cozido", calories: 76.0, protein: 4.8, carbs: 13.6, fat: 0.5, quantityLabel: "aprox. 0.7 concha(s) média(s) (100 g)" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia leite, aveia e mel",
      items: [
        { foodName: "Leite integral", calories: 195.0, protein: 7.0, carbs: 21.5, fat: 9.1, quantityLabel: "300 ml (300 g)" },
        { foodName: "Aveia em flocos", calories: 118.2, protein: 4.2, carbs: 20.0, fat: 2.5, quantityLabel: "aprox. 3 colheres de sopa rasas (30 g)" },
        { foodName: "Mel", calories: 46.4, protein: 0.0, carbs: 12.6, fat: 0.0, quantityLabel: "1 colher de sopa rasa (15 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia iogurte, banana e aveia",
      items: [
        { foodName: "Iogurte natural", calories: 86.7, protein: 7.0, carbs: 3.2, fat: 5.1, quantityLabel: "1 pote (170 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
        { foodName: "Aveia em flocos", calories: 118.2, protein: 4.2, carbs: 20.0, fat: 2.5, quantityLabel: "aprox. 3 colheres de sopa rasas (30 g)" },
        { foodName: "Mel", calories: 61.9, protein: 0.0, carbs: 16.8, fat: 0.0, quantityLabel: "1 colher de sopa cheia (20 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia leite, pão e banana",
      items: [
        { foodName: "Leite integral", calories: 130.0, protein: 4.7, carbs: 14.3, fat: 6.1, quantityLabel: "200 ml (200 g)" },
        { foodName: "Pão integral", calories: 126.5, protein: 4.7, carbs: 24.9, fat: 1.9, quantityLabel: "aprox. 1.9 fatia(s) (50 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia cuscuz com leite e minas",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 203.4, protein: 4.0, carbs: 45.5, fat: 1.3, quantityLabel: "aprox. 1.8 xícara(s) pequena(s) (180 g)" },
        { foodName: "Leite integral", calories: 130.0, protein: 4.7, carbs: 14.3, fat: 6.1, quantityLabel: "200 ml (200 g)" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
        { foodName: "Queijo minas frescal", calories: 26.4, protein: 1.7, carbs: 0.3, fat: 2.0, quantityLabel: "aprox. 0.3 fatia(s) média(s) (10 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia tapioca, minas e iogurte",
      items: [
        { foodName: "Tapioca", calories: 202.3, protein: 0.3, carbs: 50.3, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 70 g pronto" },
        { foodName: "Queijo minas frescal", calories: 66.0, protein: 4.3, carbs: 0.8, fat: 5.1, quantityLabel: "aprox. 0.8 fatia(s) média(s) (25 g)" },
        { foodName: "Leite integral", calories: 84.5, protein: 3.0, carbs: 9.3, fat: 3.9, quantityLabel: "130 ml (130 g)" },
        { foodName: "Iogurte natural", calories: 30.6, protein: 2.5, carbs: 1.1, fat: 1.8, quantityLabel: "aprox. 60 g" },
      ],
    },
    {
      category: "supper",
      name: "Ceia pão integral com leite",
      items: [
        { foodName: "Pão integral", calories: 202.4, protein: 7.5, carbs: 39.9, fat: 3.0, quantityLabel: "aprox. 3.0 fatia(s) (80 g)" },
        { foodName: "Leite integral", calories: 130.0, protein: 4.7, carbs: 14.3, fat: 6.1, quantityLabel: "200 ml (200 g)" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia mamão, iogurte e aveia",
      items: [
        { foodName: "Mamão formosa", calories: 90.0, protein: 1.6, carbs: 23.2, fat: 0.2, quantityLabel: "aprox. 200 g em cubos/fatia" },
        { foodName: "Iogurte natural", calories: 86.7, protein: 7.0, carbs: 3.2, fat: 5.1, quantityLabel: "1 pote (170 g)" },
        { foodName: "Aveia em flocos", calories: 118.2, protein: 4.2, carbs: 20.0, fat: 2.5, quantityLabel: "aprox. 3 colheres de sopa rasas (30 g)" },
        { foodName: "Mel", calories: 61.9, protein: 0.0, carbs: 16.8, fat: 0.0, quantityLabel: "1 colher de sopa cheia (20 g)" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino pão, banana e mel",
      items: [
        { foodName: "Pão integral", calories: 202.4, protein: 7.5, carbs: 39.9, fat: 3.0, quantityLabel: "aprox. 3.0 fatia(s) (80 g)" },
        { foodName: "Banana nanica", calories: 110.4, protein: 1.7, carbs: 28.6, fat: 0.1, quantityLabel: "aprox. 1 unidade média (120 g)" },
        { foodName: "Mel", calories: 61.9, protein: 0.0, carbs: 16.8, fat: 0.0, quantityLabel: "1 colher de sopa cheia (20 g)" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino tapioca e banana",
      items: [
        { foodName: "Tapioca", calories: 173.4, protein: 0.2, carbs: 43.1, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 60 g pronto" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
        { foodName: "Iogurte natural", calories: 79.0, protein: 6.4, carbs: 2.9, fat: 4.7, quantityLabel: "aprox. 155 g" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino cuscuz e banana",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 169.5, protein: 3.3, carbs: 38.0, fat: 1.1, quantityLabel: "aprox. 1.5 xícara(s) pequena(s) (150 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
        { foodName: "Leite integral", calories: 97.5, protein: 3.5, carbs: 10.8, fat: 4.5, quantityLabel: "150 ml (150 g)" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino pão francês e banana",
      items: [
        { foodName: "Pão francês", calories: 210.0, protein: 5.6, carbs: 41.0, fat: 2.2, quantityLabel: "aprox. 1.4 unidade(s) (70 g)" },
        { foodName: "Banana nanica", calories: 110.4, protein: 1.7, carbs: 28.6, fat: 0.1, quantityLabel: "aprox. 1 unidade média (120 g)" },
        { foodName: "Mel", calories: 46.4, protein: 0.0, carbs: 12.6, fat: 0.0, quantityLabel: "1 colher de sopa rasa (15 g)" },
        { foodName: "Iogurte natural", calories: 15.3, protein: 1.2, carbs: 0.6, fat: 0.9, quantityLabel: "aprox. 30 g" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino batata-doce e banana",
      items: [
        { foodName: "Batata-doce cozida", calories: 154.0, protein: 1.2, carbs: 36.8, fat: 0.2, quantityLabel: "aprox. 2.0 unidade(s) pequena(s) (200 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
        { foodName: "Leite integral", calories: 97.5, protein: 3.5, carbs: 10.8, fat: 4.5, quantityLabel: "150 ml (150 g)" },
        { foodName: "Iogurte natural", calories: 25.5, protein: 2.1, carbs: 0.9, fat: 1.5, quantityLabel: "aprox. 50 g" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino aveia e banana",
      items: [
        { foodName: "Aveia em flocos", calories: 157.6, protein: 5.6, carbs: 26.6, fat: 3.4, quantityLabel: "aprox. 4 colheres de sopa rasas (40 g)" },
        { foodName: "Banana nanica", calories: 92.0, protein: 1.4, carbs: 23.8, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (100 g)" },
        { foodName: "Mel", calories: 61.9, protein: 0.0, carbs: 16.8, fat: 0.0, quantityLabel: "1 colher de sopa cheia (20 g)" },
        { foodName: "Iogurte natural", calories: 40.8, protein: 3.3, carbs: 1.5, fat: 2.4, quantityLabel: "aprox. 80 g" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino mandioca e banana",
      items: [
        { foodName: "Mandioca cozida", calories: 187.5, protein: 0.9, carbs: 45.1, fat: 0.5, quantityLabel: "aprox. 1.5 pedaço(s) médio(s) (150 g)" },
        { foodName: "Banana nanica", calories: 73.6, protein: 1.1, carbs: 19.1, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (80 g)" },
        { foodName: "Mel", calories: 46.4, protein: 0.0, carbs: 12.6, fat: 0.0, quantityLabel: "1 colher de sopa rasa (15 g)" },
        { foodName: "Iogurte natural", calories: 76.5, protein: 6.2, carbs: 2.8, fat: 4.5, quantityLabel: "aprox. 150 g" },
      ],
    },
  ],
}

export const CAROL_DIET: DietPreset = {
  name: "Dieta Bulking Carol",
  meals: [
    {
      category: "breakfast",
      name: "Café aveia e banana",
      items: [
        { foodName: "Leite integral", calories: 117.0, protein: 4.2, carbs: 12.9, fat: 5.5, quantityLabel: "180 ml (180 g)" },
        { foodName: "Aveia em flocos", calories: 98.5, protein: 3.5, carbs: 16.6, fat: 2.1, quantityLabel: "aprox. 2.5 colheres de sopa rasas (25 g)" },
        { foodName: "Banana nanica", calories: 82.8, protein: 1.3, carbs: 21.4, fat: 0.1, quantityLabel: "aprox. 1 unidade pequena (90 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
      ],
    },
    {
      category: "breakfast",
      name: "Café cuscuz, ovos e banana",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 146.9, protein: 2.9, carbs: 32.9, fat: 0.9, quantityLabel: "aprox. 1.3 xícara(s) pequena(s) (130 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Leite integral", calories: 97.5, protein: 3.5, carbs: 10.8, fat: 4.5, quantityLabel: "150 ml (150 g)" },
        { foodName: "Banana nanica", calories: 64.4, protein: 1.0, carbs: 16.7, fat: 0.1, quantityLabel: "aprox. 1/2 a 2/3 unidade (70 g)" },
      ],
    },
    {
      category: "breakfast",
      name: "Café pão francês e mamão",
      items: [
        { foodName: "Pão francês", calories: 150.0, protein: 4.0, carbs: 29.3, fat: 1.6, quantityLabel: "aprox. 1.0 unidade(s) (50 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Queijo minas frescal", calories: 39.6, protein: 2.6, carbs: 0.5, fat: 3.0, quantityLabel: "aprox. 0.5 fatia(s) média(s) (15 g)" },
        { foodName: "Leite integral", calories: 65.0, protein: 2.3, carbs: 7.2, fat: 3.0, quantityLabel: "100 ml (100 g)" },
        { foodName: "Mamão formosa", calories: 45.0, protein: 0.8, carbs: 11.6, fat: 0.1, quantityLabel: "aprox. 100 g em cubos/fatia" },
      ],
    },
    {
      category: "breakfast",
      name: "Café tapioca com ovos",
      items: [
        { foodName: "Tapioca", calories: 115.6, protein: 0.1, carbs: 28.8, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 40 g pronto" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Queijo minas frescal", calories: 39.6, protein: 2.6, carbs: 0.5, fat: 3.0, quantityLabel: "aprox. 0.5 fatia(s) média(s) (15 g)" },
        { foodName: "Banana nanica", calories: 64.4, protein: 1.0, carbs: 16.7, fat: 0.1, quantityLabel: "aprox. 1/2 a 2/3 unidade (70 g)" },
        { foodName: "Leite integral", calories: 84.5, protein: 3.0, carbs: 9.3, fat: 3.9, quantityLabel: "130 ml (130 g)" },
      ],
    },
    {
      category: "breakfast",
      name: "Café pão, iogurte e banana",
      items: [
        { foodName: "Pão integral", calories: 101.2, protein: 3.8, carbs: 19.9, fat: 1.5, quantityLabel: "aprox. 1.5 fatia(s) (40 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Iogurte natural", calories: 51.0, protein: 4.1, carbs: 1.9, fat: 3.0, quantityLabel: "aprox. 100 g" },
        { foodName: "Banana nanica", calories: 64.4, protein: 1.0, carbs: 16.7, fat: 0.1, quantityLabel: "aprox. 1/2 a 2/3 unidade (70 g)" },
        { foodName: "Pasta de amendoim", calories: 29.4, protein: 1.2, carbs: 1.0, fat: 2.5, quantityLabel: "1 colher de chá rasa (5 g)" },
        { foodName: "Mel", calories: 52.6, protein: 0.0, carbs: 14.3, fat: 0.0, quantityLabel: "aprox. 17 g" },
      ],
    },
    {
      category: "breakfast",
      name: "Panqueca de banana e aveia",
      items: [
        { foodName: "Aveia em flocos", calories: 137.9, protein: 4.9, carbs: 23.3, fat: 2.9, quantityLabel: "aprox. 3.5 colheres de sopa rasas (35 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Banana nanica", calories: 64.4, protein: 1.0, carbs: 16.7, fat: 0.1, quantityLabel: "aprox. 1/2 a 2/3 unidade (70 g)" },
        { foodName: "Iogurte natural", calories: 35.7, protein: 2.9, carbs: 1.3, fat: 2.1, quantityLabel: "aprox. 70 g" },
        { foodName: "Mel", calories: 61.9, protein: 0.0, carbs: 16.8, fat: 0.0, quantityLabel: "1 colher de sopa cheia (20 g)" },
      ],
    },
    {
      category: "breakfast",
      name: "Café batata-doce e ovos",
      items: [
        { foodName: "Batata-doce cozida", calories: 115.5, protein: 0.9, carbs: 27.6, fat: 0.1, quantityLabel: "aprox. 1.5 unidade(s) pequena(s) (150 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Leite integral", calories: 97.5, protein: 3.5, carbs: 10.8, fat: 4.5, quantityLabel: "150 ml (150 g)" },
        { foodName: "Mamão formosa", calories: 54.0, protein: 1.0, carbs: 13.9, fat: 0.1, quantityLabel: "aprox. 120 g em cubos/fatia" },
        { foodName: "Queijo minas frescal", calories: 39.6, protein: 2.6, carbs: 0.5, fat: 3.0, quantityLabel: "aprox. 0.5 fatia(s) média(s) (15 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Iogurte com banana e aveia",
      items: [
        { foodName: "Iogurte natural", calories: 61.2, protein: 4.9, carbs: 2.3, fat: 3.6, quantityLabel: "aprox. 120 g" },
        { foodName: "Banana nanica", calories: 64.4, protein: 1.0, carbs: 16.7, fat: 0.1, quantityLabel: "aprox. 1/2 a 2/3 unidade (70 g)" },
        { foodName: "Aveia em flocos", calories: 39.4, protein: 1.4, carbs: 6.7, fat: 0.8, quantityLabel: "aprox. 1 colheres de sopa rasas (10 g)" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Vitamina leve de banana",
      items: [
        { foodName: "Leite integral", calories: 78.0, protein: 2.8, carbs: 8.6, fat: 3.6, quantityLabel: "120 ml (120 g)" },
        { foodName: "Banana nanica", calories: 55.2, protein: 0.9, carbs: 14.3, fat: 0.0, quantityLabel: "aprox. 1/2 a 2/3 unidade (60 g)" },
        { foodName: "Aveia em flocos", calories: 39.4, protein: 1.4, carbs: 6.7, fat: 0.8, quantityLabel: "aprox. 1 colheres de sopa rasas (10 g)" },
        { foodName: "Iogurte natural", calories: 20.4, protein: 1.6, carbs: 0.8, fat: 1.2, quantityLabel: "aprox. 40 g" },
      ],
    },
    {
      category: "morning_snack",
      name: "Pão integral com minas e mamão",
      items: [
        { foodName: "Pão integral", calories: 75.9, protein: 2.8, carbs: 15.0, fat: 1.1, quantityLabel: "aprox. 1.1 fatia(s) (30 g)" },
        { foodName: "Queijo minas frescal", calories: 44.9, protein: 2.9, carbs: 0.6, fat: 3.5, quantityLabel: "aprox. 0.6 fatia(s) média(s) (17 g)" },
        { foodName: "Mamão formosa", calories: 36.0, protein: 0.6, carbs: 9.3, fat: 0.1, quantityLabel: "aprox. 80 g em cubos/fatia" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Tapioca com ovo e minas",
      items: [
        { foodName: "Tapioca", calories: 115.6, protein: 0.1, carbs: 28.8, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 40 g pronto" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Queijo minas frescal", calories: 13.2, protein: 0.9, carbs: 0.2, fat: 1.0, quantityLabel: "aprox. 0.2 fatia(s) média(s) (5 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Meio pão francês com leite e minas",
      items: [
        { foodName: "Pão francês", calories: 75.0, protein: 2.0, carbs: 14.7, fat: 0.8, quantityLabel: "aprox. 0.5 unidade(s) (25 g)" },
        { foodName: "Leite integral", calories: 65.0, protein: 2.3, carbs: 7.2, fat: 3.0, quantityLabel: "100 ml (100 g)" },
        { foodName: "Queijo minas frescal", calories: 39.6, protein: 2.6, carbs: 0.5, fat: 3.0, quantityLabel: "aprox. 0.5 fatia(s) média(s) (15 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Iogurte com mamão e aveia",
      items: [
        { foodName: "Iogurte natural", calories: 61.2, protein: 4.9, carbs: 2.3, fat: 3.6, quantityLabel: "aprox. 120 g" },
        { foodName: "Mamão formosa", calories: 45.0, protein: 0.8, carbs: 11.6, fat: 0.1, quantityLabel: "aprox. 100 g em cubos/fatia" },
        { foodName: "Aveia em flocos", calories: 39.4, protein: 1.4, carbs: 6.7, fat: 0.8, quantityLabel: "aprox. 1 colheres de sopa rasas (10 g)" },
        { foodName: "Mel", calories: 46.4, protein: 0.0, carbs: 12.6, fat: 0.0, quantityLabel: "1 colher de sopa rasa (15 g)" },
      ],
    },
    {
      category: "morning_snack",
      name: "Batata-doce com leite e minas",
      items: [
        { foodName: "Batata-doce cozida", calories: 46.2, protein: 0.4, carbs: 11.0, fat: 0.1, quantityLabel: "aprox. 0.6 unidade(s) pequena(s) (60 g)" },
        { foodName: "Leite integral", calories: 65.0, protein: 2.3, carbs: 7.2, fat: 3.0, quantityLabel: "100 ml (100 g)" },
        { foodName: "Pasta de amendoim", calories: 29.4, protein: 1.2, carbs: 1.0, fat: 2.5, quantityLabel: "1 colher de chá rasa (5 g)" },
        { foodName: "Queijo minas frescal", calories: 39.6, protein: 2.6, carbs: 0.5, fat: 3.0, quantityLabel: "aprox. 0.5 fatia(s) média(s) (15 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço frango, arroz e feijão",
      items: [
        { foodName: "Arroz branco cozido", calories: 192.0, protein: 3.8, carbs: 42.1, fat: 0.3, quantityLabel: "aprox. 1.0 xícara(s) rasa(s) (150 g)" },
        { foodName: "Feijão carioca cozido", calories: 68.4, protein: 4.3, carbs: 12.2, fat: 0.5, quantityLabel: "aprox. 0.6 concha(s) média(s) (90 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 79.5, protein: 16.0, carbs: 0.0, fat: 1.2, quantityLabel: "aprox. 50 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço patinho, arroz e feijão",
      items: [
        { foodName: "Arroz branco cozido", calories: 192.0, protein: 3.8, carbs: 42.1, fat: 0.3, quantityLabel: "aprox. 1.0 xícara(s) rasa(s) (150 g)" },
        { foodName: "Feijão carioca cozido", calories: 68.4, protein: 4.3, carbs: 12.2, fat: 0.5, quantityLabel: "aprox. 0.6 concha(s) média(s) (90 g)" },
        { foodName: "Patinho bovino moído/grelhado", calories: 98.5, protein: 16.2, carbs: 0.0, fat: 3.3, quantityLabel: "aprox. 45 g pronto" },
        { foodName: "Azeite de oliva", calories: 17.7, protein: 0.0, carbs: 0.0, fat: 2.0, quantityLabel: "1 colher de chá (2 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço macarrão com frango",
      items: [
        { foodName: "Macarrão de trigo cozido", calories: 225.0, protein: 6.3, carbs: 49.1, fat: 0.8, quantityLabel: "aprox. 1.8 escumadeira(s) cheia(s) (180 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 79.5, protein: 16.0, carbs: 0.0, fat: 1.2, quantityLabel: "aprox. 50 g de frango pronto" },
        { foodName: "Molho de tomate", calories: 38.0, protein: 1.4, carbs: 7.7, fat: 0.9, quantityLabel: "aprox. 0.5 xícara(s) (100 g)" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
        { foodName: "Tomate cru", calories: 12.0, protein: 0.9, carbs: 2.5, fat: 0.2, quantityLabel: "aprox. 80 g" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço arroz, feijão e atum",
      items: [
        { foodName: "Arroz branco cozido", calories: 192.0, protein: 3.8, carbs: 42.1, fat: 0.3, quantityLabel: "aprox. 1.0 xícara(s) rasa(s) (150 g)" },
        { foodName: "Feijão carioca cozido", calories: 68.4, protein: 4.3, carbs: 12.2, fat: 0.5, quantityLabel: "aprox. 0.6 concha(s) média(s) (90 g)" },
        { foodName: "Atum em água drenado", calories: 69.6, protein: 15.6, carbs: 0.0, fat: 0.6, quantityLabel: "aprox. 0.5 lata(s) drenada(s) (60 g)" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço cuscuz com frango",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 192.1, protein: 3.7, carbs: 43.0, fat: 1.2, quantityLabel: "aprox. 1.7 xícara(s) pequena(s) (170 g)" },
        { foodName: "Feijão carioca cozido", calories: 60.8, protein: 3.8, carbs: 10.9, fat: 0.4, quantityLabel: "aprox. 0.5 concha(s) média(s) (80 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 87.5, protein: 17.6, carbs: 0.0, fat: 1.3, quantityLabel: "aprox. 55 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço mandioca com frango",
      items: [
        { foodName: "Mandioca cozida", calories: 156.2, protein: 0.8, carbs: 37.6, fat: 0.4, quantityLabel: "aprox. 1.2 pedaço(s) médio(s) (125 g)" },
        { foodName: "Feijão carioca cozido", calories: 60.8, protein: 3.8, carbs: 10.9, fat: 0.4, quantityLabel: "aprox. 0.5 concha(s) média(s) (80 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 87.5, protein: 17.6, carbs: 0.0, fat: 1.3, quantityLabel: "aprox. 55 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "lunch",
      name: "Almoço batata, arroz e patinho",
      items: [
        { foodName: "Batata inglesa cozida", calories: 78.0, protein: 1.8, carbs: 17.9, fat: 0.0, quantityLabel: "aprox. 1.5 unidade(s) média(s) (150 g)" },
        { foodName: "Arroz branco cozido", calories: 153.6, protein: 3.0, carbs: 33.7, fat: 0.2, quantityLabel: "aprox. 0.8 xícara(s) rasa(s) (120 g)" },
        { foodName: "Patinho bovino moído/grelhado", calories: 109.5, protein: 17.9, carbs: 0.0, fat: 3.7, quantityLabel: "aprox. 50 g pronto" },
        { foodName: "Azeite de oliva", calories: 35.4, protein: 0.0, carbs: 0.0, fat: 4.0, quantityLabel: "1 colher de chá (4 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Tapioca com ovo e minas",
      items: [
        { foodName: "Tapioca", calories: 130.1, protein: 0.2, carbs: 32.3, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 45 g pronto" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Queijo minas frescal", calories: 39.6, protein: 2.6, carbs: 0.5, fat: 3.0, quantityLabel: "aprox. 0.5 fatia(s) média(s) (15 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Pão com ovo e banana",
      items: [
        { foodName: "Pão integral", calories: 75.9, protein: 2.8, carbs: 15.0, fat: 1.1, quantityLabel: "aprox. 1.1 fatia(s) (30 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Banana nanica", calories: 64.4, protein: 1.0, carbs: 16.7, fat: 0.1, quantityLabel: "aprox. 1/2 a 2/3 unidade (70 g)" },
        { foodName: "Mel", calories: 15.5, protein: 0.0, carbs: 4.2, fat: 0.0, quantityLabel: "1 colher de chá rasa (5 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Cuscuz com ovo e minas",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 135.6, protein: 2.6, carbs: 30.4, fat: 0.8, quantityLabel: "aprox. 1.2 xícara(s) pequena(s) (120 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Queijo minas frescal", calories: 13.2, protein: 0.9, carbs: 0.2, fat: 1.0, quantityLabel: "aprox. 0.2 fatia(s) média(s) (5 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Iogurte com banana e pasta",
      items: [
        { foodName: "Iogurte natural", calories: 51.0, protein: 4.1, carbs: 1.9, fat: 3.0, quantityLabel: "aprox. 100 g" },
        { foodName: "Aveia em flocos", calories: 59.1, protein: 2.1, carbs: 10.0, fat: 1.3, quantityLabel: "aprox. 1.5 colheres de sopa rasas (15 g)" },
        { foodName: "Banana nanica", calories: 55.2, protein: 0.9, carbs: 14.3, fat: 0.0, quantityLabel: "aprox. 1/2 a 2/3 unidade (60 g)" },
        { foodName: "Pasta de amendoim", calories: 29.4, protein: 1.2, carbs: 1.0, fat: 2.5, quantityLabel: "1 colher de chá rasa (5 g)" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Pão francês com minas e tomate",
      items: [
        { foodName: "Pão francês", calories: 120.0, protein: 3.2, carbs: 23.4, fat: 1.2, quantityLabel: "aprox. 0.8 unidade(s) (40 g)" },
        { foodName: "Queijo minas frescal", calories: 66.0, protein: 4.3, carbs: 0.8, fat: 5.1, quantityLabel: "aprox. 0.8 fatia(s) média(s) (25 g)" },
        { foodName: "Tomate cru", calories: 12.0, protein: 0.9, carbs: 2.5, fat: 0.2, quantityLabel: "aprox. 80 g" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Batata-doce com ovo e leite",
      items: [
        { foodName: "Batata-doce cozida", calories: 77.0, protein: 0.6, carbs: 18.4, fat: 0.1, quantityLabel: "aprox. 1.0 unidade(s) pequena(s) (100 g)" },
        { foodName: "Ovo", calories: 73.0, protein: 6.7, carbs: 0.3, fat: 4.8, quantityLabel: "1 unidade (50 g)" },
        { foodName: "Leite integral", calories: 78.0, protein: 2.8, carbs: 8.6, fat: 3.6, quantityLabel: "120 ml (120 g)" },
      ],
    },
    {
      category: "afternoon_snack",
      name: "Tapioca com frango e minas",
      items: [
        { foodName: "Tapioca", calories: 158.9, protein: 0.2, carbs: 39.5, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 55 g pronto" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 27.0, protein: 5.4, carbs: 0.0, fat: 0.4, quantityLabel: "aprox. 17 g de frango pronto" },
        { foodName: "Queijo minas frescal", calories: 39.6, protein: 2.6, carbs: 0.5, fat: 3.0, quantityLabel: "aprox. 0.5 fatia(s) média(s) (15 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar macarrão com patinho",
      items: [
        { foodName: "Macarrão de trigo cozido", calories: 187.5, protein: 5.2, carbs: 41.0, fat: 0.7, quantityLabel: "aprox. 1.5 escumadeira(s) cheia(s) (150 g)" },
        { foodName: "Patinho bovino moído/grelhado", calories: 109.5, protein: 17.9, carbs: 0.0, fat: 3.7, quantityLabel: "aprox. 50 g pronto" },
        { foodName: "Molho de tomate", calories: 38.0, protein: 1.4, carbs: 7.7, fat: 0.9, quantityLabel: "aprox. 0.5 xícara(s) (100 g)" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar arroz, feijão e frango",
      items: [
        { foodName: "Arroz branco cozido", calories: 179.2, protein: 3.5, carbs: 39.3, fat: 0.3, quantityLabel: "aprox. 0.9 xícara(s) rasa(s) (140 g)" },
        { foodName: "Feijão carioca cozido", calories: 60.8, protein: 3.8, carbs: 10.9, fat: 0.4, quantityLabel: "aprox. 0.5 concha(s) média(s) (80 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 79.5, protein: 16.0, carbs: 0.0, fat: 1.2, quantityLabel: "aprox. 50 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar batata, arroz e frango",
      items: [
        { foodName: "Batata inglesa cozida", calories: 62.4, protein: 1.4, carbs: 14.3, fat: 0.0, quantityLabel: "aprox. 1.2 unidade(s) média(s) (120 g)" },
        { foodName: "Arroz branco cozido", calories: 153.6, protein: 3.0, carbs: 33.7, fat: 0.2, quantityLabel: "aprox. 0.8 xícara(s) rasa(s) (120 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 79.5, protein: 16.0, carbs: 0.0, fat: 1.2, quantityLabel: "aprox. 50 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar mandioca com patinho",
      items: [
        { foodName: "Mandioca cozida", calories: 137.5, protein: 0.7, carbs: 33.1, fat: 0.3, quantityLabel: "aprox. 1.1 pedaço(s) médio(s) (110 g)" },
        { foodName: "Feijão carioca cozido", calories: 38.0, protein: 2.4, carbs: 6.8, fat: 0.3, quantityLabel: "aprox. 0.3 concha(s) média(s) (50 g)" },
        { foodName: "Patinho bovino moído/grelhado", calories: 109.5, protein: 17.9, carbs: 0.0, fat: 3.7, quantityLabel: "aprox. 50 g pronto" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar cuscuz com frango",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 169.5, protein: 3.3, carbs: 38.0, fat: 1.1, quantityLabel: "aprox. 1.5 xícara(s) pequena(s) (150 g)" },
        { foodName: "Feijão carioca cozido", calories: 45.6, protein: 2.9, carbs: 8.2, fat: 0.3, quantityLabel: "aprox. 0.4 concha(s) média(s) (60 g)" },
        { foodName: "Peito de frango grelhado/ao molho", calories: 87.5, protein: 17.6, carbs: 0.0, fat: 1.3, quantityLabel: "aprox. 55 g de frango pronto" },
        { foodName: "Azeite de oliva", calories: 35.4, protein: 0.0, carbs: 0.0, fat: 4.0, quantityLabel: "1 colher de chá (4 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar macarrão com atum",
      items: [
        { foodName: "Macarrão de trigo cozido", calories: 212.5, protein: 6.0, carbs: 46.4, fat: 0.8, quantityLabel: "aprox. 1.7 escumadeira(s) cheia(s) (170 g)" },
        { foodName: "Atum em água drenado", calories: 69.6, protein: 15.6, carbs: 0.0, fat: 0.6, quantityLabel: "aprox. 0.5 lata(s) drenada(s) (60 g)" },
        { foodName: "Molho de tomate", calories: 38.0, protein: 1.4, carbs: 7.7, fat: 0.9, quantityLabel: "aprox. 0.5 xícara(s) (100 g)" },
        { foodName: "Azeite de oliva", calories: 44.2, protein: 0.0, carbs: 0.0, fat: 5.0, quantityLabel: "1 colher de chá (5 g)" },
      ],
    },
    {
      category: "dinner",
      name: "Jantar arroz com patinho e feijão",
      items: [
        { foodName: "Arroz branco cozido", calories: 192.0, protein: 3.8, carbs: 42.1, fat: 0.3, quantityLabel: "aprox. 1.0 xícara(s) rasa(s) (150 g)" },
        { foodName: "Patinho bovino moído/grelhado", calories: 109.5, protein: 17.9, carbs: 0.0, fat: 3.7, quantityLabel: "aprox. 50 g pronto" },
        { foodName: "Feijão carioca cozido", calories: 38.0, protein: 2.4, carbs: 6.8, fat: 0.3, quantityLabel: "aprox. 0.3 concha(s) média(s) (50 g)" },
        { foodName: "Azeite de oliva", calories: 26.5, protein: 0.0, carbs: 0.0, fat: 3.0, quantityLabel: "1 colher de chá (3 g)" },
        { foodName: "Tomate cru", calories: 15.0, protein: 1.1, carbs: 3.1, fat: 0.2, quantityLabel: "aprox. 1 tomate médio (100 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia leite, aveia e mel",
      items: [
        { foodName: "Leite integral", calories: 117.0, protein: 4.2, carbs: 12.9, fat: 5.5, quantityLabel: "180 ml (180 g)" },
        { foodName: "Aveia em flocos", calories: 59.1, protein: 2.1, carbs: 10.0, fat: 1.3, quantityLabel: "aprox. 1.5 colheres de sopa rasas (15 g)" },
        { foodName: "Mel", calories: 30.9, protein: 0.0, carbs: 8.4, fat: 0.0, quantityLabel: "2 colheres de chá (10 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia iogurte, banana e aveia",
      items: [
        { foodName: "Iogurte natural", calories: 51.0, protein: 4.1, carbs: 1.9, fat: 3.0, quantityLabel: "aprox. 100 g" },
        { foodName: "Banana nanica", calories: 55.2, protein: 0.9, carbs: 14.3, fat: 0.0, quantityLabel: "aprox. 1/2 a 2/3 unidade (60 g)" },
        { foodName: "Aveia em flocos", calories: 59.1, protein: 2.1, carbs: 10.0, fat: 1.3, quantityLabel: "aprox. 1.5 colheres de sopa rasas (15 g)" },
        { foodName: "Mel", calories: 46.4, protein: 0.0, carbs: 12.6, fat: 0.0, quantityLabel: "1 colher de sopa rasa (15 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia leite, pão e banana",
      items: [
        { foodName: "Leite integral", calories: 65.0, protein: 2.3, carbs: 7.2, fat: 3.0, quantityLabel: "100 ml (100 g)" },
        { foodName: "Pão integral", calories: 63.2, protein: 2.3, carbs: 12.5, fat: 0.9, quantityLabel: "aprox. 0.9 fatia(s) (25 g)" },
        { foodName: "Banana nanica", calories: 64.4, protein: 1.0, carbs: 16.7, fat: 0.1, quantityLabel: "aprox. 1/2 a 2/3 unidade (70 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia cuscuz com leite e minas",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 101.7, protein: 2.0, carbs: 22.8, fat: 0.6, quantityLabel: "aprox. 0.9 xícara(s) pequena(s) (90 g)" },
        { foodName: "Leite integral", calories: 65.0, protein: 2.3, carbs: 7.2, fat: 3.0, quantityLabel: "100 ml (100 g)" },
        { foodName: "Mel", calories: 15.5, protein: 0.0, carbs: 4.2, fat: 0.0, quantityLabel: "1 colher de chá rasa (5 g)" },
        { foodName: "Queijo minas frescal", calories: 18.5, protein: 1.2, carbs: 0.2, fat: 1.4, quantityLabel: "aprox. 0.2 fatia(s) média(s) (7 g)" },
      ],
    },
    {
      category: "supper",
      name: "Ceia tapioca, minas e iogurte",
      items: [
        { foodName: "Tapioca", calories: 101.2, protein: 0.1, carbs: 25.2, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 35 g pronto" },
        { foodName: "Queijo minas frescal", calories: 26.4, protein: 1.7, carbs: 0.3, fat: 2.0, quantityLabel: "aprox. 0.3 fatia(s) média(s) (10 g)" },
        { foodName: "Leite integral", calories: 52.0, protein: 1.9, carbs: 5.7, fat: 2.4, quantityLabel: "80 ml (80 g)" },
        { foodName: "Iogurte natural", calories: 22.9, protein: 1.9, carbs: 0.8, fat: 1.4, quantityLabel: "aprox. 45 g" },
      ],
    },
    {
      category: "supper",
      name: "Ceia pão integral com leite",
      items: [
        { foodName: "Pão integral", calories: 75.9, protein: 2.8, carbs: 15.0, fat: 1.1, quantityLabel: "aprox. 1.1 fatia(s) (30 g)" },
        { foodName: "Leite integral", calories: 65.0, protein: 2.3, carbs: 7.2, fat: 3.0, quantityLabel: "100 ml (100 g)" },
        { foodName: "Mel", calories: 61.9, protein: 0.0, carbs: 16.8, fat: 0.0, quantityLabel: "1 colher de sopa cheia (20 g)" },
        { foodName: "Iogurte natural", calories: 5.1, protein: 0.4, carbs: 0.2, fat: 0.3, quantityLabel: "aprox. 10 g" },
      ],
    },
    {
      category: "supper",
      name: "Ceia mamão, iogurte e aveia",
      items: [
        { foodName: "Mamão formosa", calories: 45.0, protein: 0.8, carbs: 11.6, fat: 0.1, quantityLabel: "aprox. 100 g em cubos/fatia" },
        { foodName: "Iogurte natural", calories: 51.0, protein: 4.1, carbs: 1.9, fat: 3.0, quantityLabel: "aprox. 100 g" },
        { foodName: "Aveia em flocos", calories: 59.1, protein: 2.1, carbs: 10.0, fat: 1.3, quantityLabel: "aprox. 1.5 colheres de sopa rasas (15 g)" },
        { foodName: "Mel", calories: 46.4, protein: 0.0, carbs: 12.6, fat: 0.0, quantityLabel: "1 colher de sopa rasa (15 g)" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino pão, banana e mel",
      items: [
        { foodName: "Pão integral", calories: 75.9, protein: 2.8, carbs: 15.0, fat: 1.1, quantityLabel: "aprox. 1.1 fatia(s) (30 g)" },
        { foodName: "Banana nanica", calories: 55.2, protein: 0.9, carbs: 14.3, fat: 0.0, quantityLabel: "aprox. 1/2 a 2/3 unidade (60 g)" },
        { foodName: "Mel", calories: 24.7, protein: 0.0, carbs: 6.7, fat: 0.0, quantityLabel: "aprox. 8 g" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino tapioca e banana",
      items: [
        { foodName: "Tapioca", calories: 72.2, protein: 0.1, carbs: 18.0, fat: 0.0, quantityLabel: "1 disco de tapioca, aprox. 25 g pronto" },
        { foodName: "Banana nanica", calories: 36.8, protein: 0.6, carbs: 9.5, fat: 0.0, quantityLabel: "aprox. 1/3 unidade (40 g)" },
        { foodName: "Mel", calories: 15.5, protein: 0.0, carbs: 4.2, fat: 0.0, quantityLabel: "1 colher de chá rasa (5 g)" },
        { foodName: "Iogurte natural", calories: 30.6, protein: 2.5, carbs: 1.1, fat: 1.8, quantityLabel: "aprox. 60 g" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino cuscuz e banana",
      items: [
        { foodName: "Cuscuz de milho cozido", calories: 67.8, protein: 1.3, carbs: 15.2, fat: 0.4, quantityLabel: "aprox. 0.6 xícara(s) pequena(s) (60 g)" },
        { foodName: "Banana nanica", calories: 36.8, protein: 0.6, carbs: 9.5, fat: 0.0, quantityLabel: "aprox. 1/3 unidade (40 g)" },
        { foodName: "Leite integral", calories: 39.0, protein: 1.4, carbs: 4.3, fat: 1.8, quantityLabel: "60 ml (60 g)" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino pão francês e banana",
      items: [
        { foodName: "Pão francês", calories: 75.0, protein: 2.0, carbs: 14.7, fat: 0.8, quantityLabel: "aprox. 0.5 unidade(s) (25 g)" },
        { foodName: "Banana nanica", calories: 36.8, protein: 0.6, carbs: 9.5, fat: 0.0, quantityLabel: "aprox. 1/3 unidade (40 g)" },
        { foodName: "Mel", calories: 15.5, protein: 0.0, carbs: 4.2, fat: 0.0, quantityLabel: "1 colher de chá rasa (5 g)" },
        { foodName: "Iogurte natural", calories: 15.3, protein: 1.2, carbs: 0.6, fat: 0.9, quantityLabel: "aprox. 30 g" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino batata-doce e banana",
      items: [
        { foodName: "Batata-doce cozida", calories: 61.6, protein: 0.5, carbs: 14.7, fat: 0.1, quantityLabel: "aprox. 0.8 unidade(s) pequena(s) (80 g)" },
        { foodName: "Banana nanica", calories: 36.8, protein: 0.6, carbs: 9.5, fat: 0.0, quantityLabel: "aprox. 1/3 unidade (40 g)" },
        { foodName: "Leite integral", calories: 32.5, protein: 1.2, carbs: 3.6, fat: 1.5, quantityLabel: "50 ml (50 g)" },
        { foodName: "Iogurte natural", calories: 11.2, protein: 0.9, carbs: 0.4, fat: 0.7, quantityLabel: "aprox. 22 g" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino aveia e banana",
      items: [
        { foodName: "Aveia em flocos", calories: 39.4, protein: 1.4, carbs: 6.7, fat: 0.8, quantityLabel: "aprox. 1 colheres de sopa rasas (10 g)" },
        { foodName: "Banana nanica", calories: 55.2, protein: 0.9, carbs: 14.3, fat: 0.0, quantityLabel: "aprox. 1/2 a 2/3 unidade (60 g)" },
        { foodName: "Mel", calories: 46.4, protein: 0.0, carbs: 12.6, fat: 0.0, quantityLabel: "1 colher de sopa rasa (15 g)" },
        { foodName: "Iogurte natural", calories: 15.3, protein: 1.2, carbs: 0.6, fat: 0.9, quantityLabel: "aprox. 30 g" },
      ],
    },
    {
      category: "other",
      name: "Pré-treino mandioca e banana",
      items: [
        { foodName: "Mandioca cozida", calories: 75.0, protein: 0.4, carbs: 18.1, fat: 0.2, quantityLabel: "aprox. 0.6 pedaço(s) médio(s) (60 g)" },
        { foodName: "Banana nanica", calories: 27.6, protein: 0.4, carbs: 7.1, fat: 0.0, quantityLabel: "aprox. 1/3 unidade (30 g)" },
        { foodName: "Mel", calories: 15.5, protein: 0.0, carbs: 4.2, fat: 0.0, quantityLabel: "1 colher de chá rasa (5 g)" },
        { foodName: "Iogurte natural", calories: 30.6, protein: 2.5, carbs: 1.1, fat: 1.8, quantityLabel: "aprox. 60 g" },
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
  const typical = firstMealPerCategory(diet.meals)
  return typical.flatMap((meal) => meal.items).reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export function presetGoalsForProfile(name: string, avatar?: string | null) {
  const preset = presetForProfile(name, avatar)
  if (!preset) return null
  const totals = dietPresetTotals(preset)
  return {
    calorieGoal: Math.round(totals.calories),
    proteinGoal: Math.round(totals.protein),
    carbGoal: Math.round(totals.carbs),
    fatGoal: Math.round(totals.fat),
  }
}
