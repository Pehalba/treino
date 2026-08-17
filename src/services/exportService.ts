import { where } from 'firebase/firestore'
import { listDocs } from '@/repositories/base'
import { dashboardRepository } from '@/repositories/dashboardRepository'
import { exerciseRepository } from '@/repositories/exerciseRepository'
import { nutritionRepository } from '@/repositories/nutritionRepository'
import { weightRepository } from '@/repositories/weightRepository'
import { workoutRepository } from '@/repositories/workoutRepository'
import type {
  BodyMeasurement,
  DietMeal,
  DietMealItem,
  DietPlan,
  DietSupplement,
  Exercise,
  ExerciseSet,
  FoodLog,
  PersonalRecord,
  Profile,
  ReportRange,
  WeightEntry,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from '@/types'
import { calendarMonthBounds, rangeToDates, todayKey } from '@/utils/dates'
import { format } from 'date-fns'

export type ExportMode = 'month' | 'period' | 'total'

export type ExportScope =
  | { mode: 'month'; year: number; monthIndex: number }
  | { mode: 'period'; range: Exclude<ReportRange, 'custom'> }
  | { mode: 'total' }

export type DataExportPayload = {
  version: 1
  exportedAt: string
  scope: ExportScope & { from: string | null; to: string | null; label: string }
  profile: Profile
  exercises: Exercise[]
  workoutTemplates: WorkoutTemplate[]
  workoutTemplateExercises: WorkoutTemplateExercise[]
  dietPlans: DietPlan[]
  dietMeals: DietMeal[]
  dietMealItems: DietMealItem[]
  dietSupplements: DietSupplement[]
  workoutSessions: WorkoutSession[]
  workoutSessionExercises: WorkoutSessionExercise[]
  exerciseSets: ExerciseSet[]
  personalRecords: PersonalRecord[]
  foodLogs: FoodLog[]
  weightEntries: WeightEntry[]
  bodyMeasurements: BodyMeasurement[]
  dashboardPreferences: Awaited<ReturnType<typeof dashboardRepository.get>>
}

const PERIOD_LABELS: Record<Exclude<ReportRange, 'custom'>, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '3m': '3 meses',
  '6m': '6 meses',
  '1y': '1 ano',
}

function resolveBounds(scope: ExportScope): { from: Date | null; to: Date | null; label: string } {
  if (scope.mode === 'total') {
    return { from: null, to: null, label: 'Total' }
  }
  if (scope.mode === 'month') {
    const bounds = calendarMonthBounds(scope.year, scope.monthIndex)
    const label = format(new Date(scope.year, scope.monthIndex, 1), 'yyyy-MM')
    return { from: bounds.from, to: bounds.to, label }
  }
  const bounds = rangeToDates(scope.range)
  return {
    from: bounds?.from ?? null,
    to: bounds?.to ?? null,
    label: PERIOD_LABELS[scope.range],
  }
}

function inTsRange(ts: number, from: Date | null, to: Date | null): boolean {
  if (from && ts < from.getTime()) return false
  if (to && ts > to.getTime()) return false
  return true
}

function inDateKeyRange(date: string, from: Date | null, to: Date | null): boolean {
  if (from && date < todayKey(from)) return false
  if (to && date > todayKey(to)) return false
  return true
}

function safeFilePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export const exportService = {
  async build(profile: Profile, scope: ExportScope): Promise<DataExportPayload> {
    const { from, to, label } = resolveBounds(scope)

    const [
      exercises,
      templates,
      templateExercises,
      plans,
      mealItems,
      supplements,
      allSessions,
      allSessionExercises,
      allSets,
      records,
      allLogs,
      allWeights,
      measurements,
      dashboardPreferences,
    ] = await Promise.all([
      exerciseRepository.listByHousehold(profile.householdId),
      workoutRepository.listTemplates(profile.id),
      workoutRepository.listTemplateExercisesByProfile(profile.id),
      nutritionRepository.listPlans(profile.id),
      nutritionRepository.listMealItemsByProfile(profile.id),
      nutritionRepository.listSupplements(profile.id),
      listDocs<WorkoutSession>('workoutSessions', where('profileId', '==', profile.id)),
      listDocs<WorkoutSessionExercise>('workoutSessionExercises', where('profileId', '==', profile.id)),
      listDocs<ExerciseSet>('exerciseSets', where('profileId', '==', profile.id)),
      workoutRepository.listRecords(profile.id),
      nutritionRepository.listLogsByProfile(profile.id),
      listDocs<WeightEntry>('weightEntries', where('profileId', '==', profile.id)),
      weightRepository.listMeasurements(profile.id),
      dashboardRepository.get(profile.id),
    ])

    const mealsNested = await Promise.all(plans.map((plan) => nutritionRepository.listMeals(plan.id)))
    const dietMeals = mealsNested.flat()

    const workoutSessions = allSessions
      .filter((session) => inTsRange(session.startedAt, from, to))
      .sort((a, b) => b.startedAt - a.startedAt)
    const sessionIds = new Set(workoutSessions.map((session) => session.id))

    const workoutSessionExercises = allSessionExercises.filter((row) => sessionIds.has(row.workoutSessionId))
    const exerciseSets = allSets.filter(
      (set) => sessionIds.has(set.workoutSessionId) || inTsRange(set.createdAt, from, to),
    )
    const personalRecords = records.filter(
      (record) => sessionIds.has(record.sessionId) || inTsRange(record.createdAt, from, to),
    )
    const foodLogs = allLogs.filter((log) => inDateKeyRange(log.date, from, to))
    const weightEntries = allWeights
      .filter((entry) => inDateKeyRange(entry.date, from, to))
      .sort((a, b) => b.date.localeCompare(a.date))
    const bodyMeasurements = measurements.filter((entry) => inDateKeyRange(entry.date, from, to))

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      scope: {
        ...scope,
        from: from ? todayKey(from) : null,
        to: to ? todayKey(to) : null,
        label,
      },
      profile,
      exercises,
      workoutTemplates: templates,
      workoutTemplateExercises: templateExercises,
      dietPlans: plans,
      dietMeals,
      dietMealItems: mealItems,
      dietSupplements: supplements,
      workoutSessions,
      workoutSessionExercises,
      exerciseSets,
      personalRecords,
      foodLogs,
      weightEntries,
      bodyMeasurements,
      dashboardPreferences,
    }
  },

  filename(profile: Profile, scope: ExportScope): string {
    const { label } = resolveBounds(scope)
    const who = safeFilePart(profile.name) || 'perfil'
    const when = safeFilePart(label) || 'dados'
    return `treinos-${who}-${when}.json`
  },

  download(payload: DataExportPayload, filename: string): void {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  },
}
