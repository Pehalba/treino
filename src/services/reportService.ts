import { nutritionService } from '@/services/nutritionService'
import { progressService } from '@/services/progressService'
import { weightService } from '@/services/weightService'
import type {
  Exercise,
  ExerciseSet,
  FoodLog,
  MealCategory,
  MuscleGroup,
  Profile,
  ReportRange,
  WeightEntry,
  WorkoutSession,
} from '@/types'
import { daysInRange, rangeToDates, todayKey, weekStart } from '@/utils/dates'
import { MUSCLE_GROUPS } from '@/types'
import { addDays, format, parseISO } from 'date-fns'
import { totalReps, totalVolume, workingWeight } from '@/utils/volume'

export type ReportFilter = {
  range: ReportRange
  from?: Date
  to?: Date
}

export type GeneralReport = {
  workoutsDone: number
  workoutsPlanned: number
  adherence: number
  weightStart: number | null
  weightEnd: number | null
  avgCalories: number | null
  avgProtein: number | null
  progressions: number
  records: number
}

export type WeeklyFrequency = {
  weekKey: string
  label: string
  done: number
  goal: number
  status: 'ok' | 'warn' | 'miss'
}

export type MuscleReport = {
  muscle: MuscleGroup
  sets: number
  volume: number
  sessions: number
}

function inRange(ts: number, from?: Date, to?: Date): boolean {
  if (from && ts < from.getTime()) return false
  if (to && ts > to.getTime()) return false
  return true
}

function dateInRange(date: string, from?: Date, to?: Date): boolean {
  const ts = parseISO(date).getTime()
  return inRange(ts, from, to)
}

export const reportService = {
  resolveBounds(filter: ReportFilter): { from?: Date; to?: Date } {
    const bounds = rangeToDates(filter.range, filter.from && filter.to ? { from: filter.from, to: filter.to } : undefined)
    if (!bounds) return {}
    return bounds
  },

  general(params: {
    profile: Profile
    sessions: WorkoutSession[]
    sets: ExerciseSet[]
    foodLogs: FoodLog[]
    weights: WeightEntry[]
    recordCount: number
    filter: ReportFilter
  }): GeneralReport {
    const { from, to } = this.resolveBounds(params.filter)
    const sessions = params.sessions.filter((s) => s.completed && inRange(s.startedAt, from, to))
    const days = from && to ? daysInRange(from, to).length : 30
    const weeks = Math.max(1, days / 7)
    const planned = Math.round(params.profile.weeklyWorkoutGoal * weeks)
    const weights = [...params.weights]
      .filter((w) => dateInRange(w.date, from, to))
      .sort((a, b) => a.date.localeCompare(b.date))
    const food = params.foodLogs.filter((l) => dateInRange(l.date, from, to))
    const byDay = new Map<string, FoodLog[]>()
    for (const log of food) {
      byDay.set(log.date, [...(byDay.get(log.date) ?? []), log])
    }
    const dailyCalories = [...byDay.values()].map((logs) => nutritionService.totals(logs).calories)
    const dailyProtein = [...byDay.values()].map((logs) => nutritionService.totals(logs).protein)

    const grouped = new Map<string, Map<string, ExerciseSet[]>>()
    for (const set of params.sets.filter((s) => s.completed && inRange(s.createdAt, from, to))) {
      if (!grouped.has(set.exerciseId)) grouped.set(set.exerciseId, new Map())
      const sessionsMap = grouped.get(set.exerciseId)
      if (!sessionsMap) continue
      if (!sessionsMap.has(set.workoutSessionId)) sessionsMap.set(set.workoutSessionId, [])
      sessionsMap.get(set.workoutSessionId)?.push(set)
    }
    let progressions = 0
    for (const sessionsMap of grouped.values()) {
      const groups = [...sessionsMap.values()]
      if (groups.length < 2) continue
      const newest = groups[0]
      const prev = groups[1]
      if (
        workingWeight(newest) > workingWeight(prev) ||
        totalReps(newest) > totalReps(prev) ||
        totalVolume(newest) > totalVolume(prev)
      ) {
        progressions += 1
      }
    }

    return {
      workoutsDone: sessions.length,
      workoutsPlanned: planned,
      adherence: planned === 0 ? 0 : (sessions.length / planned) * 100,
      weightStart: weights[0]?.weight ?? null,
      weightEnd: weights[weights.length - 1]?.weight ?? null,
      avgCalories: dailyCalories.length ? dailyCalories.reduce((a, b) => a + b, 0) / dailyCalories.length : null,
      avgProtein: dailyProtein.length ? dailyProtein.reduce((a, b) => a + b, 0) / dailyProtein.length : null,
      progressions,
      records: params.recordCount,
    }
  },

  weeklyFrequency(sessions: WorkoutSession[], goal: number, weeks = 8): WeeklyFrequency[] {
    const result: WeeklyFrequency[] = []
    const now = weekStart(new Date())
    for (let i = 0; i < weeks; i += 1) {
      const start = addDays(now, -7 * i)
      const end = addDays(start, 6)
      const done = sessions.filter((s) => {
        if (!s.completed) return false
        const d = new Date(s.startedAt)
        return d >= start && d <= addDays(end, 1)
      }).length
      const status: WeeklyFrequency['status'] = done >= goal ? 'ok' : done >= goal - 1 ? 'warn' : 'miss'
      result.push({
        weekKey: todayKey(start),
        label: `Semana ${format(start, 'dd/MM')}`,
        done,
        goal,
        status,
      })
    }
    return result
  },

  thisWeekCount(sessions: WorkoutSession[]): number {
    const start = weekStart(new Date()).getTime()
    return sessions.filter((s) => s.completed && s.startedAt >= start).length
  },

  missedTemplates(
    templates: Array<{ id: string; name: string }>,
    sessions: WorkoutSession[],
    goal: number,
  ): { done: number; planned: number; missingNames: string[] } {
    const start = weekStart(new Date()).getTime()
    const weekSessions = sessions.filter((s) => s.completed && s.startedAt >= start)
    const counts = new Map<string, number>()
    for (const t of templates) counts.set(t.id, 0)
    for (const s of weekSessions) counts.set(s.workoutTemplateId, (counts.get(s.workoutTemplateId) ?? 0) + 1)
    const missingNames = templates
      .filter((t) => (counts.get(t.id) ?? 0) === 0)
      .map((t) => t.name)
    return { done: weekSessions.length, planned: goal, missingNames }
  },

  calendarDays(
    sessions: WorkoutSession[],
    days: string[],
  ): Array<{ date: string; status: 'done' | 'planned' | 'missed' | 'rest'; sessions: WorkoutSession[] }> {
    const byDate = new Map<string, WorkoutSession[]>()
    for (const s of sessions.filter((x) => x.completed)) {
      const key = todayKey(new Date(s.startedAt))
      byDate.set(key, [...(byDate.get(key) ?? []), s])
    }
    const today = todayKey()
    return days.map((date) => {
      const daySessions = byDate.get(date) ?? []
      if (daySessions.length > 0) return { date, status: 'done' as const, sessions: daySessions }
      if (date > today) return { date, status: 'planned' as const, sessions: [] }
      return { date, status: 'rest' as const, sessions: [] }
    })
  },

  byTemplate(templates: Array<{ id: string; name: string }>, sessions: WorkoutSession[], filter: ReportFilter) {
    const { from, to } = this.resolveBounds(filter)
    const filtered = sessions.filter((s) => s.completed && inRange(s.startedAt, from, to))
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      count: filtered.filter((s) => s.workoutTemplateId === t.id).length,
    }))
  },

  byMuscle(catalog: Exercise[], sets: ExerciseSet[], sessions: WorkoutSession[], filter: ReportFilter): MuscleReport[] {
    const { from, to } = this.resolveBounds(filter)
    const sessionIds = new Set(
      sessions.filter((s) => s.completed && inRange(s.startedAt, from, to)).map((s) => s.id),
    )
    const exerciseMap = new Map(catalog.map((e) => [e.id, e]))
    return MUSCLE_GROUPS.map((muscle) => {
      const muscleSets = sets.filter((s) => {
        if (!s.completed || !sessionIds.has(s.workoutSessionId)) return false
        return exerciseMap.get(s.exerciseId)?.muscleGroup === muscle
      })
      const sessionSet = new Set(muscleSets.map((s) => s.workoutSessionId))
      return {
        muscle,
        sets: muscleSets.length,
        volume: totalVolume(muscleSets),
        sessions: sessionSet.size,
      }
    })
  },

  calorieSeries(logs: FoodLog[], goal: number, filter: ReportFilter) {
    const { from, to } = this.resolveBounds(filter)
    const days = from && to ? daysInRange(from, to) : []
    const byDay = new Map<string, number>()
    for (const log of logs) {
      if (!dateInRange(log.date, from, to)) continue
      byDay.set(log.date, (byDay.get(log.date) ?? 0) + log.calories)
    }
    return days.map((date) => ({ date, calories: byDay.get(date) ?? 0, goal }))
  },

  calorieSummary(logs: FoodLog[], profile: Profile, filter: ReportFilter) {
    const series = this.calorieSeries(logs, profile.calorieGoal, filter)
    const withData = series.filter((d) => d.calories > 0)
    const avg = withData.length ? withData.reduce((s, d) => s + d.calories, 0) / withData.length : 0
    const within = withData.filter((d) => Math.abs(d.calories - profile.calorieGoal) <= profile.calorieGoal * 0.1).length
    const proteinDays = new Map<string, { p: number; c: number; f: number }>()
    const { from, to } = this.resolveBounds(filter)
    for (const log of logs) {
      if (!dateInRange(log.date, from, to)) continue
      const cur = proteinDays.get(log.date) ?? { p: 0, c: 0, f: 0 }
      cur.p += log.protein
      cur.c += log.carbs
      cur.f += log.fat
      proteinDays.set(log.date, cur)
    }
    const macros = [...proteinDays.values()]
    const avgP = macros.length ? macros.reduce((s, m) => s + m.p, 0) / macros.length : 0
    const avgC = macros.length ? macros.reduce((s, m) => s + m.c, 0) / macros.length : 0
    const avgF = macros.length ? macros.reduce((s, m) => s + m.f, 0) / macros.length : 0
    return {
      goal: profile.calorieGoal,
      avg,
      diff: avg - profile.calorieGoal,
      daysWithin: within,
      daysTracked: withData.length,
      protein: { goal: profile.proteinGoal, avg: avgP },
      carbs: { goal: profile.carbGoal, avg: avgC },
      fat: { goal: profile.fatGoal, avg: avgF },
    }
  },

  dietAdherence(
    logs: FoodLog[],
    meals: Array<{ category: MealCategory }>,
    days: number,
  ): Array<{ category: MealCategory; done: number; total: number }> {
    const start = todayKey(addDays(new Date(), -(days - 1)))
    const relevant = logs.filter((l) => l.date >= start && l.fromDietMealId)
    const unique = new Set(relevant.map((l) => `${l.date}:${l.category}`))
    const cats = [...new Set(meals.map((m) => m.category))]
    return cats.map((category) => ({
      category,
      done: [...unique].filter((k) => k.endsWith(`:${category}`)).length,
      total: days,
    }))
  },

  weightVsCalories(weights: WeightEntry[], logs: FoodLog[], weeks = 8) {
    const rows: Array<{ week: string; kcal: number; weight: number | null }> = []
    const now = weekStart(new Date())
    for (let i = weeks - 1; i >= 0; i -= 1) {
      const start = addDays(now, -7 * i)
      const end = addDays(start, 6)
      const startKey = todayKey(start)
      const endKey = todayKey(end)
      const weekLogs = logs.filter((l) => l.date >= startKey && l.date <= endKey)
      const byDay = new Map<string, number>()
      for (const log of weekLogs) byDay.set(log.date, (byDay.get(log.date) ?? 0) + log.calories)
      const daily = [...byDay.values()]
      const kcal = daily.length ? daily.reduce((a, b) => a + b, 0) / daily.length : 0
      const weekWeights = weights.filter((w) => w.date >= startKey && w.date <= endKey)
      const weight = weekWeights.length
        ? weekWeights.reduce((s, w) => s + w.weight, 0) / weekWeights.length
        : null
      rows.push({ week: format(start, 'dd/MM'), kcal, weight })
    }
    return rows
  },

  bulking(params: {
    weights: WeightEntry[]
    logs: FoodLog[]
    sessions: WorkoutSession[]
    sets: ExerciseSet[]
  }) {
    const sorted = [...params.weights].sort((a, b) => a.date.localeCompare(b.date))
    const start = sorted[0]?.weight ?? null
    const current = weightService.sevenDayAverage(params.weights)
    const gained = start != null && current != null ? current - start : null
    const weeks = sorted.length >= 2 ? Math.max(1, (parseISO(sorted[sorted.length - 1].date).getTime() - parseISO(sorted[0].date).getTime()) / (7 * 86400000)) : 1
    const weekly = gained != null ? gained / weeks : null
    const totals = nutritionService.totals(params.logs)
    const days = new Set(params.logs.map((l) => l.date)).size || 1
    const progressions = progressService.groupSetsBySession(params.sets).length
    return {
      start,
      current,
      gained,
      weekly,
      avgCalories: totals.calories / days,
      avgProtein: totals.protein / days,
      workouts: params.sessions.filter((s) => s.completed).length,
      progressions,
    }
  },

  exerciseHistory(sets: ExerciseSet[]) {
    return progressService.groupSetsBySession(sets).map((group) => ({
      date: group[0]?.createdAt ?? 0,
      sessionId: group[0]?.workoutSessionId ?? '',
      weight: workingWeight(group),
      reps: group.map((s) => s.reps),
      volume: totalVolume(group),
      bestSet: group.reduce((max, s) => Math.max(max, s.weight * s.reps), 0),
    }))
  },
}

