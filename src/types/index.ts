export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'calves',
  'core',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quads: 'Quadríceps',
  hamstrings: 'Posteriores',
  calves: 'Panturrilha',
  core: 'Abdômen',
}

export const EQUIPMENT = [
  'dumbbell',
  'barbell',
  'machine',
  'cable',
  'bodyweight',
  'other',
] as const

export type Equipment = (typeof EQUIPMENT)[number]

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  dumbbell: 'Halteres',
  barbell: 'Barra',
  machine: 'Máquina',
  cable: 'Cabo',
  bodyweight: 'Peso corporal',
  other: 'Outro',
}

export const MEAL_CATEGORIES = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'supper',
  'other',
] as const

export type MealCategory = (typeof MEAL_CATEGORIES)[number] | 'snack'

export const MEAL_LABELS: Record<MealCategory, string> = {
  breakfast: 'Café da manhã',
  morning_snack: 'Lanche da manhã',
  lunch: 'Almoço',
  afternoon_snack: 'Lanche da tarde',
  snack: 'Lanche da tarde',
  dinner: 'Jantar',
  supper: 'Ceia',
  other: 'Extra',
}

export const SESSION_EXERCISE_STATUS = [
  'pending',
  'active',
  'completed',
  'deferred',
  'skipped',
] as const

export type SessionExerciseStatus = (typeof SESSION_EXERCISE_STATUS)[number]

export const SKIP_REASONS = [
  'occupied',
  'want_other',
  'cannot_today',
] as const

export type SkipReason = (typeof SKIP_REASONS)[number]

export const WEIGHT_INCREMENTS = [1, 2, 2.5, 5] as const
export type WeightIncrement = (typeof WEIGHT_INCREMENTS)[number]

export const RIR_VALUES = [0, 1, 2, 3] as const
export type RirValue = (typeof RIR_VALUES)[number]

export const REPORT_RANGES = ['7d', '30d', '3m', '6m', '1y', 'custom'] as const
export type ReportRange = (typeof REPORT_RANGES)[number]

export const EXERCISE_CHART_RANGES = ['30d', '3m', '6m', '1y', 'all'] as const
export type ExerciseChartRange = (typeof EXERCISE_CHART_RANGES)[number]

export type UserRecord = {
  id: string
  email: string
  displayName: string
  householdId: string
  createdAt: number
}

export type Household = {
  id: string
  name: string
  inviteCode: string
  createdAt: number
  createdBy: string
}

export const PROFILE_AVATARS = ['pedro', 'carol', 'guest'] as const
export type ProfileAvatar = (typeof PROFILE_AVATARS)[number]

export const PROFILE_GOALS = ['bulking', 'cutting', 'maintain', 'recomp'] as const
export type ProfileGoal = (typeof PROFILE_GOALS)[number]

export const PROFILE_GOAL_LABELS: Record<ProfileGoal, string> = {
  bulking: 'Bulking',
  cutting: 'Cutting',
  maintain: 'Manutenção',
  recomp: 'Recomposição',
}

export type Profile = {
  id: string
  householdId: string
  ownerUserId: string
  name: string
  avatar?: ProfileAvatar
  heightCm?: number | null
  weightGoalKg?: number | null
  goal?: ProfileGoal
  weeklyWorkoutGoal: number
  calorieGoal: number
  proteinGoal: number
  carbGoal: number
  fatGoal: number
  timerSeconds?: number
  ageYears?: number | null
  activityMultiplier?: number
  createdAt: number
  updatedAt?: number
  updatedBy?: string
  version?: number
}

export type ProfileMember = {
  id: string
  userId: string
  profileId: string
  householdId: string
  role: 'owner' | 'member'
}

export type Exercise = {
  id: string
  householdId: string
  name: string
  muscleGroup: MuscleGroup
  equipment: Equipment
  description: string
  youtubeUrl: string
  alternativeIds: string[]
  defaultSets: number
  defaultRepMin: number
  defaultRepMax: number
  defaultRestSeconds: number
  weightIncrement: WeightIncrement
  isPlaceholder: boolean
  active?: boolean
  archivedAt?: number | null
  createdAt: number
  updatedAt?: number
  updatedBy?: string
  version?: number
}

export type WorkoutTemplate = {
  id: string
  profileId: string
  householdId: string
  name: string
  order: number
  active?: boolean
  archivedAt?: number | null
  createdAt: number
  updatedAt?: number
  updatedBy?: string
  version?: number
}

export type WorkoutTemplateExercise = {
  id: string
  profileId: string
  householdId: string
  templateId: string
  exerciseId: string
  order: number
  sets: number
  repMin: number
  repMax: number
  restSeconds: number
  notes: string
  active?: boolean
  archivedAt?: number | null
  updatedAt?: number
  updatedBy?: string
  version?: number
}

export type WorkoutSession = {
  id: string
  profileId: string
  householdId: string
  userId: string
  workoutTemplateId: string
  templateName: string
  startedAt: number
  finishedAt: number | null
  durationSeconds: number
  completed: boolean
  totalVolume: number
  exercisesCompleted: number
  notes: string
}

export type WorkoutSessionExercise = {
  id: string
  profileId: string
  householdId: string
  workoutSessionId: string
  exerciseId: string
  originalExerciseId: string
  exerciseName?: string
  muscleGroup?: MuscleGroup
  equipment?: Equipment
  youtubeUrl?: string
  weightIncrement?: WeightIncrement
  setsPlanned?: number
  order: number
  sets: number
  repMin: number
  repMax: number
  restSeconds: number
  status: SessionExerciseStatus
  substituted: boolean
  substituteOnlyToday: boolean
  skipReason: SkipReason | null
  notes: string
}

export type ExerciseSet = {
  id: string
  profileId: string
  householdId: string
  userId: string
  exerciseId: string
  workoutSessionId: string
  sessionExerciseId: string
  setNumber: number
  weight: number
  reps: number
  rir: RirValue
  completed: boolean
  createdAt: number
}

export type PersonalRecord = {
  id: string
  profileId: string
  householdId: string
  exerciseId: string
  type: 'max_weight' | 'max_reps_at_weight' | 'max_volume'
  value: number
  weight: number | null
  sessionId: string
  createdAt: number
}

export type FoodSubstitute = {
  foodName: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantityLabel: string
}

export type DietPlan = {
  id: string
  profileId: string
  householdId: string
  name: string
  calorieGoal?: number | null
  notes?: string
  isActive: boolean
  isPlaceholder: boolean
  archivedAt?: number | null
  createdAt: number
  updatedAt?: number
  updatedBy?: string
  version?: number
}

export type DietMeal = {
  id: string
  profileId: string
  householdId: string
  dietPlanId: string
  category: MealCategory
  order: number
  name: string
  notes?: string
  youtubeUrl?: string
  active?: boolean
  archivedAt?: number | null
  updatedAt?: number
  updatedBy?: string
}

export type DietMealItem = {
  id: string
  profileId: string
  householdId: string
  dietMealId: string
  foodName: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantityLabel: string
  notes?: string
  substitutes?: FoodSubstitute[]
  order: number
  autoScalable?: boolean
  manualOverride?: boolean
  baseCalories?: number
  baseProtein?: number
  baseCarbs?: number
  baseFat?: number
  baseQuantityLabel?: string
  active?: boolean
  archivedAt?: number | null
  updatedAt?: number
  updatedBy?: string
}

export type Food = {
  id: string
  householdId: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  isPlaceholder: boolean
}

export type FoodLog = {
  id: string
  profileId: string
  householdId: string
  userId: string
  date: string
  category: MealCategory
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fromDietMealId: string | null
  createdAt: number
}

export type WeightEntry = {
  id: string
  profileId: string
  householdId: string
  userId: string
  date: string
  weight: number
  timestamp: number
}

export type BodyMeasurement = {
  id: string
  profileId: string
  householdId: string
  userId: string
  date: string
  chest: number | null
  waist: number | null
  hips: number | null
  arm: number | null
  thigh: number | null
  timestamp: number
}

export type TemplateWithMeta = WorkoutTemplate & {
  exercises: Array<WorkoutTemplateExercise & { exercise: Exercise | null }>
  lastSessionAt: number | null
  averageDurationSeconds: number | null
}

export type ProgressionKind = 'weight' | 'reps' | 'volume' | 'first' | 'none'

export type ProgressionSummary = {
  kind: ProgressionKind
  message: string
  targetHit: boolean
  isRecord: boolean
  recordTypes: Array<PersonalRecord['type']>
}

export const DASHBOARD_WIDGETS = [
  'today_workout',
  'workout_list',
  'week_workouts',
  'weekly_goal',
  'calories_consumed',
  'calories_remaining',
  'protein',
  'current_weight',
  'weekly_weight_avg',
  'bulk_progress',
  'last_records',
  'load_progression',
  'workout_streak',
  'diet_adherence',
] as const

export type DashboardWidgetId = (typeof DASHBOARD_WIDGETS)[number]

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  today_workout: 'Treino de hoje',
  workout_list: 'Lista de treinos',
  week_workouts: 'Treinos da semana',
  weekly_goal: 'Meta semanal',
  calories_consumed: 'Calorias consumidas',
  calories_remaining: 'Calorias restantes',
  protein: 'Proteína',
  current_weight: 'Peso atual',
  weekly_weight_avg: 'Média semanal de peso',
  bulk_progress: 'Progresso do peso',
  last_records: 'Últimos recordes',
  load_progression: 'Progressão de carga',
  workout_streak: 'Sequência de treinos',
  diet_adherence: 'Aderência à dieta',
}

export const DEFAULT_DASHBOARD_WIDGETS: Array<{ id: DashboardWidgetId; visible: boolean }> = [
  { id: 'today_workout', visible: false },
  { id: 'workout_list', visible: true },
  { id: 'weekly_goal', visible: true },
  { id: 'calories_consumed', visible: true },
  { id: 'protein', visible: true },
  { id: 'current_weight', visible: true },
  { id: 'week_workouts', visible: false },
  { id: 'calories_remaining', visible: false },
  { id: 'weekly_weight_avg', visible: false },
  { id: 'bulk_progress', visible: false },
  { id: 'last_records', visible: false },
  { id: 'load_progression', visible: false },
  { id: 'workout_streak', visible: false },
  { id: 'diet_adherence', visible: false },
]

export type DashboardPreferences = {
  id: string
  profileId: string
  householdId: string
  userId: string
  widgets: Array<{ id: DashboardWidgetId; visible: boolean }>
  updatedAt: number
  updatedBy: string
  version?: number
}

export type ImportPayload = {
  exercises?: Array<Partial<Exercise> & { name: string; muscleGroup: MuscleGroup }>
  templates?: Array<{
    name: string
    exercises: Array<{
      exerciseName: string
      sets?: number
      repMin?: number
      repMax?: number
      restSeconds?: number
    }>
  }>
  diet?: {
    name?: string
    meals: Array<{
      category: MealCategory
      name?: string
      youtubeUrl?: string
      items: Array<{
        foodName: string
        calories: number
        protein: number
        carbs: number
        fat: number
        quantityLabel?: string
      }>
    }>
  }
}
