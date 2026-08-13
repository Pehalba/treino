import type { Profile, ProfileGoal } from '@/types'

export type DietSex = 'male' | 'female'

export type MacroTargets = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type LayerAResult = {
  sex: DietSex
  ageYears: number
  weightKg: number
  heightCm: number
  bmr: number
  tdee: number
  activityMultiplier: number
  goal: ProfileGoal
  suggestedCalories: number
  calorieRange: [number, number]
  protein: number
  fatMin: number
  fatTarget: number
  carbs: number
  warnings: string[]
}

export function profileSex(profile: Profile): DietSex {
  const key = `${profile.avatar ?? ''} ${profile.name}`.toLowerCase()
  if (key.includes('carol')) return 'female'
  return 'male'
}

export function mifflinBmr(params: { sex: DietSex; weightKg: number; heightCm: number; ageYears: number }): number {
  const base = 10 * params.weightKg + 6.25 * params.heightCm - 5 * params.ageYears
  return params.sex === 'male' ? base + 5 : base - 161
}

function defaultCalories(tdee: number, goal: ProfileGoal): { suggested: number; range: [number, number] } {
  if (goal === 'cutting') return { suggested: Math.round(tdee * 0.88), range: [Math.round(tdee * 0.8), Math.round(tdee * 0.9)] }
  if (goal === 'maintain' || goal === 'recomp') {
    return { suggested: Math.round(tdee), range: [Math.round(tdee * 0.97), Math.round(tdee * 1.03)] }
  }
  return { suggested: Math.round(tdee * 1.08), range: [Math.round(tdee * 1.05), Math.round(tdee * 1.15)] }
}

export function calcLayerA(params: {
  profile: Profile
  weightKg: number | null
  dietKcal?: number
}): LayerAResult | { error: string } {
  const heightCm = params.profile.heightCm
  const weightKg = params.weightKg
  if (heightCm == null || heightCm <= 0) return { error: 'Cadastre a altura no perfil.' }
  if (weightKg == null || weightKg <= 0) return { error: 'Cadastre o peso atual no perfil.' }

  const sex = profileSex(params.profile)
  const ageYears = params.profile.ageYears && params.profile.ageYears > 0 ? params.profile.ageYears : 25
  const activityMultiplier = params.profile.activityMultiplier && params.profile.activityMultiplier > 0
    ? params.profile.activityMultiplier
    : 1.5
  const goal = params.profile.goal ?? 'bulking'
  const bmr = mifflinBmr({ sex, weightKg, heightCm, ageYears })
  const tdee = bmr * activityMultiplier
  const { suggested, range } = defaultCalories(tdee, goal)
  const proteinPerKg = goal === 'cutting' || goal === 'recomp' ? 2 : 1.8
  const protein = Math.round(weightKg * proteinPerKg)
  const fatMin = Math.round(weightKg * 0.6)
  const fatTarget = Math.max(fatMin, Math.round((suggested * 0.22) / 9))
  const carbs = Math.max(0, Math.round((suggested - protein * 4 - fatTarget * 9) / 4))
  const warnings: string[] = []
  if (params.dietKcal && goal === 'bulking' && params.dietKcal > range[1] * 1.05) {
    warnings.push(
      `A dieta atual (${Math.round(params.dietKcal)} kcal) está acima da faixa calculada (${range[0]}–${range[1]} kcal). Se o peso estiver estável ou subindo devagar, o gasto real pode ser maior — não reduza no automático só por causa da fórmula.`,
    )
  }
  if (goal === 'cutting' && suggested < tdee * 0.75) {
    warnings.push('Déficit acima de 25% não é gerado automaticamente.')
  }
  return {
    sex,
    ageYears,
    weightKg,
    heightCm,
    bmr: Math.round(bmr * 10) / 10,
    tdee: Math.round(tdee),
    activityMultiplier,
    goal,
    suggestedCalories: suggested,
    calorieRange: range,
    protein,
    fatMin,
    fatTarget,
    carbs,
    warnings,
  }
}

export function macrosFromCalories(params: {
  calories: number
  weightKg: number
  goal: ProfileGoal
}): MacroTargets {
  const proteinPerKg = params.goal === 'cutting' || params.goal === 'recomp' ? 2 : 1.8
  const protein = Math.round(params.weightKg * proteinPerKg)
  const fatMin = Math.round(params.weightKg * 0.6)
  const fat = Math.max(fatMin, Math.round((params.calories * 0.22) / 9))
  const carbs = Math.max(0, Math.round((params.calories - protein * 4 - fat * 9) / 4))
  return { calories: Math.round(params.calories), protein, carbs, fat }
}
