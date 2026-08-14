import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
  subMonths,
  subYears,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ExerciseChartRange, ReportRange } from '@/types'

export function todayKey(date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatDate(ts: number | string): string {
  const date = typeof ts === 'number' ? new Date(ts) : parseISO(ts)
  return format(date, 'dd/MM', { locale: ptBR })
}

export function formatDateLong(ts: number | string): string {
  const date = typeof ts === 'number' ? new Date(ts) : parseISO(ts)
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) {
    return `${hours}h${String(minutes).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function weekStart(date = new Date()): Date {
  // Semana começa no domingo — a meta semanal zera a cada domingo.
  return startOfWeek(date, { weekStartsOn: 0 })
}

export function rangeToDates(
  range: ReportRange | ExerciseChartRange,
  custom?: { from: Date; to: Date },
): { from: Date; to: Date } | null {
  const to = endOfDay(new Date())
  if (range === 'all') return null
  if (range === 'custom') {
    return custom ?? { from: startOfDay(subDays(new Date(), 30)), to }
  }
  const map: Record<string, Date> = {
    '7d': startOfDay(subDays(new Date(), 6)),
    '30d': startOfDay(subDays(new Date(), 29)),
    '3m': startOfDay(subMonths(new Date(), 3)),
    '6m': startOfDay(subMonths(new Date(), 6)),
    '1y': startOfDay(subYears(new Date(), 1)),
  }
  return { from: map[range] ?? startOfDay(subDays(new Date(), 29)), to }
}

export function daysInRange(from: Date, to: Date): string[] {
  return eachDayOfInterval({ start: startOfDay(from), end: startOfDay(to) }).map((d) =>
    todayKey(d),
  )
}

export function addDaysKey(dateKey: string, amount: number): string {
  return todayKey(addDays(parseISO(dateKey), amount))
}

export function daysBetween(a: string, b: string): number {
  return differenceInCalendarDays(parseISO(b), parseISO(a))
}
