import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { WeightPage } from '@/features/weight/WeightPage'
import { useSession } from '@/hooks/useSession'
import { exerciseService } from '@/services/exerciseService'
import { dietService, nutritionService } from '@/services/nutritionService'
import { reportService, type ReportFilter } from '@/services/reportService'
import { weightService } from '@/services/weightService'
import { workoutService } from '@/services/workoutService'
import { progressService } from '@/services/progressService'
import { MUSCLE_LABELS, MEAL_LABELS, REPORT_RANGES, type Exercise, type ExerciseSet, type FoodLog, type ReportRange, type WeightEntry, type WorkoutSession } from '@/types'
import { formatDate, formatDuration, todayKey } from '@/utils/dates'
import { formatKcal, formatKg, formatNumber, formatPercent } from '@/utils/format'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const RANGE_LABELS: Record<ReportRange, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '3m': '3 meses',
  '6m': '6 meses',
  '1y': '1 ano',
  custom: 'Personalizado',
}

export function ReportsPage() {
  const { activeProfile } = useSession()
  const [range, setRange] = useState<ReportRange>('30d')
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [sets, setSets] = useState<ExerciseSet[]>([])
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [catalog, setCatalog] = useState<Exercise[]>([])
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([])
  const [recordCount, setRecordCount] = useState(0)
  const [meals, setMeals] = useState<Array<{ category: FoodLog['category'] }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exerciseId, setExerciseId] = useState('')

  async function load() {
    if (!activeProfile) return
    setLoading(true)
    setError('')
    try {
      const [sess, allSets, food, w, exercises, tpl, records, diet] = await Promise.all([
        workoutService.listSessions(activeProfile.id, 200),
        workoutService.listSetsByProfile(activeProfile.id),
        nutritionService.listLogsByProfile(activeProfile.id),
        weightService.list(activeProfile.id),
        exerciseService.listByHousehold(activeProfile.householdId),
        workoutService.getTemplatesWithMeta(activeProfile.id, activeProfile.householdId),
        workoutService.listRecords(activeProfile.id),
        dietService.getActivePlan(activeProfile),
      ])
      setSessions(sess)
      setSets(allSets)
      setLogs(food)
      setWeights(w)
      setCatalog(exercises)
      setTemplates(tpl.map((t) => ({ id: t.id, name: t.name })))
      setRecordCount(records.length)
      setMeals(diet.meals)
      if (!exerciseId && exercises[0]) setExerciseId(exercises[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar relatórios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [activeProfile?.id])

  const filter: ReportFilter = { range }
  const general = useMemo(() => {
    if (!activeProfile) return null
    return reportService.general({ profile: activeProfile, sessions, sets, foodLogs: logs, weights, recordCount, filter })
  }, [activeProfile, sessions, sets, logs, weights, recordCount, range])

  const week = activeProfile ? reportService.thisWeekCount(sessions) : 0
  const weekly = activeProfile ? reportService.weeklyFrequency(sessions, activeProfile.weeklyWorkoutGoal) : []
  const missed = activeProfile
    ? reportService.missedTemplates(templates, sessions, activeProfile.weeklyWorkoutGoal)
    : null
  const byTemplate = reportService.byTemplate(templates, sessions, filter)
  const muscles = reportService.byMuscle(catalog, sets, sessions, filter)
  const calorieSeries = activeProfile ? reportService.calorieSeries(logs, activeProfile.calorieGoal, filter) : []
  const calorieSummary = activeProfile ? reportService.calorieSummary(logs, activeProfile, filter) : null
  const adherence = reportService.dietAdherence(logs, meals, range === '7d' ? 7 : 7)
  const weightCal = reportService.weightVsCalories(weights, logs)
  const bulk = reportService.bulking({ weights, logs, sessions, sets })
  const selectedHistory = reportService.exerciseHistory(sets.filter((s) => s.exerciseId === exerciseId))
  const loadProgress = progressService.loadProgression(sets.filter((s) => s.exerciseId === exerciseId))

  if (loading) {
    return (
      <AppShell title="Relatórios">
        <div className="grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Relatórios">
        <ErrorState message={error} onRetry={() => void load()} />
      </AppShell>
    )
  }

  return (
    <AppShell title="Relatórios">
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {REPORT_RANGES.filter((r) => r !== 'custom').map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${range === r ? 'bg-accent text-bg' : 'bg-card2 text-muted'}`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg">Últimos {RANGE_LABELS[range]}</h2>
          {general ? (
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Item label="Treinos" value={`${general.workoutsDone} / ${general.workoutsPlanned}`} />
              <Item label="Aderência" value={formatPercent(general.adherence)} />
              <Item
                label="Peso"
                value={
                  general.weightStart != null && general.weightEnd != null
                    ? `${formatNumber(general.weightStart)} → ${formatNumber(general.weightEnd)} kg`
                    : '—'
                }
              />
              <Item label="Calorias médias" value={general.avgCalories ? formatKcal(general.avgCalories) : '—'} />
              <Item label="Proteína média" value={general.avgProtein ? `${formatNumber(general.avgProtein, 0)} g` : '—'} />
              <Item label="Progressões" value={String(general.progressions)} />
              <Item label="Recordes" value={String(general.records)} />
            </dl>
          ) : null}
        </Card>

        <Card>
          <h2 className="font-display text-lg">Frequência</h2>
          <p className="mt-2 text-3xl font-semibold">
            {week} / {activeProfile?.weeklyWorkoutGoal ?? 4}
          </p>
          <p className="text-sm text-muted">
            {(activeProfile?.weeklyWorkoutGoal ?? 4) - week > 0
              ? `${(activeProfile?.weeklyWorkoutGoal ?? 4) - week} treino(s) restante(s) nesta semana`
              : 'Meta semanal atingida'}
          </p>
          {missed ? (
            <p className="mt-3 text-sm">
              Você realizou {missed.done} dos {missed.planned} treinos planejados.
              {missed.missingNames.length ? ` Ainda não feito: ${missed.missingNames.join(', ')}.` : ''}
            </p>
          ) : null}
        </Card>
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg">Histórico semanal</h2>
      <div className="grid gap-2 md:grid-cols-2">
        {weekly.map((w) => (
          <Card key={w.weekKey} className="flex items-center justify-between">
            <span>{w.label}</span>
            <span>
              {w.status === 'ok' ? '✅' : w.status === 'warn' ? '⚠️' : '❌'} {w.done}/{w.goal}
            </span>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg">Por treino</h2>
      <div className="grid gap-2 md:grid-cols-2">
        {byTemplate.map((t) => (
          <Card key={t.id} className="flex justify-between">
            <span>{t.name}</span>
            <span className="font-semibold">{t.count}</span>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg">Progressão de carga</h2>
      <select
        className="mb-3 min-h-12 w-full rounded-2xl bg-card2 px-4"
        value={exerciseId}
        onChange={(e) => setExerciseId(e.target.value)}
      >
        {catalog.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      {loadProgress && selectedHistory.length >= 2 ? (
        <Card>
          <p className="text-sm text-muted">
            Carga inicial {formatKg(loadProgress.startWeight)} · atual {formatKg(loadProgress.currentWeight)} ·{' '}
            {loadProgress.percent >= 0 ? '+' : ''}
            {formatPercent(loadProgress.percent)}
          </p>
          {loadProgress.stagnant ? (
            <p className="mt-2 text-sm text-warn">Sem progressão nas últimas 3 sessões.</p>
          ) : null}
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <LineChart data={selectedHistory.slice().reverse()}>
                <CartesianGrid stroke="#2A2D33" />
                <XAxis dataKey="date" tickFormatter={(v) => formatDate(Number(v))} stroke="#97999E" />
                <YAxis stroke="#97999E" />
                <Tooltip
                  contentStyle={{ background: '#15171A', border: '1px solid #2A2D33' }}
                  labelFormatter={(v) => formatDate(Number(v))}
                />
                <Line type="monotone" dataKey="weight" stroke="#B8FF3D" dot={false} name="Carga" />
                <Line type="monotone" dataKey="volume" stroke="#97999E" dot={false} name="Volume" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Link to={`/exercicio/${exerciseId}`} className="mt-3 inline-block text-sm text-accent">
            Ver histórico completo
          </Link>
        </Card>
      ) : (
        <EmptyState
          title="Histórico insuficiente"
          description="Você ainda não possui histórico suficiente para gerar este gráfico."
        />
      )}

      <h2 className="mt-8 mb-3 font-display text-lg">Grupo muscular</h2>
      <div className="grid gap-2 md:grid-cols-3">
        {muscles.map((m) => (
          <Card key={m.muscle}>
            <p className="font-medium">{MUSCLE_LABELS[m.muscle]}</p>
            <p className="text-sm text-muted">
              {m.sets} séries · {formatNumber(m.volume, 0)} kg · {m.sessions} treinos
            </p>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg">Calorias</h2>
      {calorieSummary && calorieSeries.some((d) => d.calories > 0) ? (
        <Card>
          <p className="text-sm">
            Meta {formatKcal(calorieSummary.goal)} · média {formatKcal(calorieSummary.avg)} · diferença{' '}
            {calorieSummary.diff >= 0 ? '+' : ''}
            {formatKcal(calorieSummary.diff)}
          </p>
          <p className="mt-1 text-sm text-muted">
            Dias dentro da meta: {calorieSummary.daysWithin} / {calorieSummary.daysTracked}
          </p>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <LineChart data={calorieSeries}>
                <CartesianGrid stroke="#2A2D33" />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} stroke="#97999E" />
                <YAxis stroke="#97999E" />
                <Tooltip contentStyle={{ background: '#15171A', border: '1px solid #2A2D33' }} />
                <Line type="monotone" dataKey="goal" stroke="#97999E" dot={false} name="Meta" />
                <Line type="monotone" dataKey="calories" stroke="#B8FF3D" dot={false} name="Consumido" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <Item label="Proteína" value={`${formatNumber(calorieSummary.protein.avg, 0)} / ${calorieSummary.protein.goal} g`} />
            <Item label="Carbo" value={`${formatNumber(calorieSummary.carbs.avg, 0)} / ${calorieSummary.carbs.goal} g`} />
            <Item label="Gordura" value={`${formatNumber(calorieSummary.fat.avg, 0)} / ${calorieSummary.fat.goal} g`} />
          </div>
        </Card>
      ) : (
        <EmptyState title="Sem dados de calorias" description="Registre refeições para ver meta versus consumo." />
      )}

      <h2 className="mt-8 mb-3 font-display text-lg">Aderência à dieta</h2>
      <div className="grid gap-2 md:grid-cols-2">
        {adherence.map((a) => (
          <Card key={a.category} className="flex justify-between">
            <span>{MEAL_LABELS[a.category]}</span>
            <span>
              {a.done}/{a.total}
            </span>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg">Peso × calorias</h2>
      {weightCal.some((r) => r.weight != null || r.kcal > 0) ? (
        <Card>
          {weightCal.map((row) => (
            <p key={row.week} className="flex justify-between py-1 text-sm">
              <span>{row.week}</span>
              <span>
                {row.kcal ? formatKcal(row.kcal) : '—'} · {row.weight ? formatKg(row.weight) : '—'}
              </span>
            </p>
          ))}
        </Card>
      ) : (
        <EmptyState title="Sem cruzamento ainda" description="Registre peso e calorias por alguns dias." />
      )}

      <h2 className="mt-8 mb-3 font-display text-lg">Bulking</h2>
      <Card>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Item label="Peso inicial" value={bulk.start ? formatKg(bulk.start) : '—'} />
          <Item label="Peso atual" value={bulk.current ? formatKg(bulk.current) : '—'} />
          <Item label="Peso ganho" value={bulk.gained != null ? formatKg(bulk.gained) : '—'} />
          <Item label="Média semanal" value={bulk.weekly != null ? formatKg(bulk.weekly) : '—'} />
          <Item label="Calorias médias" value={bulk.avgCalories ? formatKcal(bulk.avgCalories) : '—'} />
          <Item label="Proteína média" value={bulk.avgProtein ? `${formatNumber(bulk.avgProtein, 0)} g` : '—'} />
          <Item label="Treinos" value={String(bulk.workouts)} />
        </dl>
      </Card>

      <h2 className="mt-8 mb-3 font-display text-lg">Peso corporal</h2>
      <WeightPage embedded />

      <h2 className="mt-8 mb-3 font-display text-lg">Calendário recente</h2>
      <CalendarStrip sessions={sessions} />
      <p className="mt-8 text-xs text-muted">Sessões concluídas: {sessions.filter((s) => s.completed).length} · duração média recente {averageDuration(sessions)}</p>
    </AppShell>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}

function averageDuration(sessions: WorkoutSession[]): string {
  const done = sessions.filter((s) => s.completed && s.durationSeconds > 0)
  if (!done.length) return '—'
  const avg = done.reduce((s, x) => s + x.durationSeconds, 0) / done.length
  return formatDuration(avg)
}

function CalendarStrip({ sessions }: { sessions: WorkoutSession[] }) {
  const days = reportService.calendarDays(
    sessions,
    Array.from({ length: 28 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (27 - i))
      return todayKey(d)
    }),
  )
  const [selected, setSelected] = useState(days[days.length - 1]?.date ?? '')
  const day = days.find((d) => d.date === selected)
  return (
    <div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {days.map((d) => (
          <button
            key={d.date}
            type="button"
            onClick={() => setSelected(d.date)}
            className={`w-12 shrink-0 rounded-2xl py-3 text-center text-xs ${selected === d.date ? 'bg-accent text-bg' : 'bg-card'}`}
          >
            <div>{d.date.slice(8)}</div>
            <div>{d.status === 'done' ? '✅' : d.status === 'rest' ? '—' : '○'}</div>
          </button>
        ))}
      </div>
      {day ? (
        <Card className="mt-3 text-sm">
          {day.sessions.length === 0 ? (
            <p className="text-muted">Nenhum treino neste dia.</p>
          ) : (
            day.sessions.map((s) => (
              <p key={s.id}>
                {s.templateName} · {formatDuration(s.durationSeconds)}
              </p>
            ))
          )}
        </Card>
      ) : null}
    </div>
  )
}
