import { AppShell } from '@/components/layout/AppShell'
import { WorkoutName } from '@/components/workout/WorkoutName'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EditButton } from '@/components/ui/EditButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ProgressBar } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession } from '@/hooks/useSession'
import { dashboardService } from '@/services/dashboardService'
import { nutritionService } from '@/services/nutritionService'
import { weightService } from '@/services/weightService'
import { workoutService } from '@/services/workoutService'
import type {
  DashboardWidgetId,
  FoodLog,
  PersonalRecord,
  TemplateWithMeta,
  WeightEntry,
  WorkoutSession,
} from '@/types'
import { PROFILE_GOAL_LABELS } from '@/types'
import { formatDate, formatDuration, todayKey, weekStart } from '@/utils/dates'
import { formatGrams, formatKcal, formatKg } from '@/utils/format'
import { loadLocalSession } from '@/utils/localSession'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function HomePage() {
  const { user, activeProfile } = useSession()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<TemplateWithMeta[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [widgets, setWidgets] = useState<Array<{ id: DashboardWidgetId; visible: boolean }>>(() =>
    dashboardService.defaults(),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!activeProfile) return
    let alive = true
    setLoading(true)
    setError('')
    setTemplates([])
    setSessions([])
    setLogs([])
    setWeights([])
    setRecords([])

    const profileId = activeProfile.id
    const householdId = activeProfile.householdId

    void (async () => {
      try {
        const { templates, sessions } = await workoutService.getHomeBundle(profileId, householdId)
        if (!alive) return
        setTemplates(templates)
        setSessions(sessions)
        setLoading(false)

        const [food, w, recs, prefs] = await Promise.all([
          nutritionService.listLogsSince(profileId, todayKey(weekStart())),
          weightService.list(profileId),
          workoutService.listRecords(profileId),
          dashboardService.get(profileId),
        ])
        if (!alive) return
        setLogs(food)
        setWeights(w)
        setRecords(recs)
        setWidgets(prefs)
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Falha ao carregar treinos.')
        setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [activeProfile?.id, reloadToken])

  const local = activeProfile ? loadLocalSession(activeProfile.id) : null
  const active = sessions.find((s) => !s.completed) ?? (local && !local.session.completed ? local.session : null)
  const todayLogs = useMemo(() => logs.filter((item) => item.date === todayKey()), [logs])
  const totals = useMemo(() => nutritionService.totals(todayLogs), [todayLogs])
  const weekSessions = sessions.filter((s) => s.completed && s.startedAt >= weekStart().getTime())
  const calorieGoal = activeProfile?.calorieGoal ?? 0
  const remaining = Math.max(0, calorieGoal - totals.calories)
  const currentWeight = weights[0]?.weight ?? null
  const avgWeight = weightService.sevenDayAverage(weights)
  const oldest = [...weights].sort((a, b) => a.date.localeCompare(b.date))[0]
  const weightGoal = activeProfile?.weightGoalKg ?? null
  const bulkDelta = currentWeight != null && oldest ? currentWeight - oldest.weight : null
  const remainingWeight =
    currentWeight != null && weightGoal != null ? weightGoal - currentWeight : null
  const weightProgressMax =
    weightGoal != null && oldest && oldest.weight !== weightGoal
      ? Math.abs(weightGoal - oldest.weight)
      : null
  const weightProgressValue =
    currentWeight != null && oldest && weightProgressMax
      ? Math.abs(currentWeight - oldest.weight)
      : null
  const lastRecords = [...records].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3)
  const lastCompleted = sessions.filter((s) => s.completed)
  const prevVolume = lastCompleted[1]?.totalVolume
  const lastVolume = lastCompleted[0]?.totalVolume
  const streak = workoutStreak(sessions)
  const dietDays = dietAdherence(logs)

  async function start(template: TemplateWithMeta) {
    if (!user || !activeProfile) return
    setStarting(template.id)
    try {
      const { session } = await workoutService.startSession({ user, profile: activeProfile, template })
      navigate(`/treino/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o treino.')
      setStarting(null)
    }
  }

  function renderWidget(id: DashboardWidgetId) {
    switch (id) {
      case 'today_workout':
        if (!active) return null
        return (
          <Card className="border border-accent/30">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">Treino em andamento</p>
            <h2 className="mt-1 font-display text-2xl">
              <WorkoutName name={active.templateName} />
            </h2>
            <Button className="mt-4 w-full" size="xl" onClick={() => navigate(`/treino/${active.id}`)}>
              Continuar
            </Button>
          </Card>
        )
      case 'workout_list':
        return (
          <section>
            <h2 className="mb-3 font-display text-lg tracking-wide uppercase">Seus treinos</h2>
            {templates.length === 0 ? (
              <EmptyState title="Nenhum treino ainda" description="Cadastre ou importe treinos no perfil." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl">
                          <WorkoutName name={template.name} />
                        </h3>
                        <p className="mt-1 text-sm text-muted">{template.exercises.length} exercícios</p>
                        <p className="text-sm text-muted">
                          Último treino: {template.lastSessionAt ? formatDate(template.lastSessionAt) : '—'}
                        </p>
                        <p className="text-sm text-muted">
                          Duração média:{' '}
                          {template.averageDurationSeconds ? formatDuration(template.averageDurationSeconds) : '—'}
                        </p>
                      </div>
                      <EditButton to={`/treinos/${template.id}/editar`} />
                    </div>
                    <Button
                      className="mt-4 w-full"
                      size="xl"
                      onClick={() => start(template)}
                      disabled={Boolean(starting) || Boolean(active)}
                    >
                      {starting === template.id ? 'Iniciando…' : 'Iniciar'}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )
      case 'week_workouts':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Treinos da semana</p>
            <p className="mt-1 font-display text-3xl">{weekSessions.length}</p>
            <p className="text-sm text-muted">
              {weekSessions.map((s) => s.templateName).join(' · ') || 'Nenhum treino ainda nesta semana.'}
            </p>
          </Card>
        )
      case 'weekly_goal': {
        const goal = activeProfile?.weeklyWorkoutGoal ?? 4
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Meta semanal</p>
            <p className="mt-1 font-display text-3xl">
              {weekSessions.length}/{goal}
            </p>
            <ProgressBar className="mt-3" value={weekSessions.length} max={goal || 1} />
          </Card>
        )
      }
      case 'calories_consumed':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Calorias consumidas</p>
            <p className="mt-1 font-display text-3xl">{formatKcal(totals.calories)}</p>
            <p className="text-sm text-muted">Meta: {formatKcal(calorieGoal)}</p>
          </Card>
        )
      case 'calories_remaining':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Calorias restantes</p>
            <p className="mt-1 font-display text-3xl">{formatKcal(remaining)}</p>
          </Card>
        )
      case 'protein':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Proteína</p>
            <p className="mt-1 font-display text-3xl">{formatGrams(totals.protein)}</p>
            <p className="text-sm text-muted">Meta: {formatGrams(activeProfile?.proteinGoal ?? 0)}</p>
          </Card>
        )
      case 'current_weight':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Peso atual</p>
            <p className="mt-1 font-display text-3xl">{currentWeight != null ? formatKg(currentWeight) : '—'}</p>
            {weightGoal != null ? (
              <p className="text-sm text-muted">Meta: {formatKg(weightGoal)}</p>
            ) : (
              <p className="text-sm text-muted">Defina a meta em Perfil.</p>
            )}
          </Card>
        )
      case 'weekly_weight_avg':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Média semanal de peso</p>
            <p className="mt-1 font-display text-3xl">{avgWeight != null ? formatKg(avgWeight) : '—'}</p>
          </Card>
        )
      case 'bulk_progress':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Progresso do peso</p>
            <p className="mt-1 font-display text-3xl">
              {remainingWeight == null
                ? bulkDelta == null
                  ? '—'
                  : `${bulkDelta >= 0 ? '+' : ''}${formatKg(bulkDelta)}`
                : `${remainingWeight >= 0 ? '+' : ''}${formatKg(remainingWeight)}`}
            </p>
            {weightGoal != null ? (
              <p className="text-sm text-muted">
                {remainingWeight == null
                  ? `Meta: ${formatKg(weightGoal)}`
                  : remainingWeight === 0
                    ? 'Você chegou na meta'
                    : remainingWeight > 0
                      ? `Faltam ${formatKg(remainingWeight)} para a meta`
                      : `Faltam ${formatKg(Math.abs(remainingWeight))} para a meta`}
              </p>
            ) : (
              <p className="text-sm text-muted">Objetivo: {PROFILE_GOAL_LABELS[activeProfile?.goal ?? 'bulking']}</p>
            )}
            {weightProgressValue != null && weightProgressMax != null ? (
              <ProgressBar className="mt-3" value={weightProgressValue} max={weightProgressMax} />
            ) : null}
          </Card>
        )
      case 'last_records':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Últimos recordes</p>
            {lastRecords.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Nenhum recorde ainda.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {lastRecords.map((record) => (
                  <li key={record.id}>
                    {formatDate(record.createdAt)} · {record.type.replaceAll('_', ' ')} · {record.value}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )
      case 'load_progression':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Progressão de carga</p>
            <p className="mt-1 font-display text-2xl">
              {lastVolume != null ? Math.round(lastVolume) : '—'}
              <span className="text-base text-muted"> kg volume</span>
            </p>
            <p className="text-sm text-muted">
              {prevVolume != null && lastVolume != null
                ? `Anterior: ${Math.round(prevVolume)} kg`
                : 'Faça mais um treino para comparar.'}
            </p>
          </Card>
        )
      case 'workout_streak':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Sequência de treinos</p>
            <p className="mt-1 font-display text-3xl">{streak} dias</p>
          </Card>
        )
      case 'diet_adherence':
        return (
          <Card>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">Aderência à dieta</p>
            <p className="mt-1 font-display text-3xl">{dietDays}</p>
            <p className="text-sm text-muted">dias desta semana com registro de comida</p>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <AppShell>
      <section className="pb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Olá</p>
            <h1 className="font-display text-3xl font-semibold">Olá, {activeProfile?.name ?? user?.displayName} 👋</h1>
            <p className="mt-1 text-muted">Escolha o treino e comece agora.</p>
          </div>
          <Link to="/painel" className="shrink-0 rounded-full bg-card2 px-3 py-2 text-xs font-semibold text-muted">
            Personalizar painel
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadToken((n) => n + 1)} />
      ) : (
        <div className="space-y-4">
          {widgets
            .filter((item) => item.visible)
            .map((item) => (
              <div key={item.id}>{renderWidget(item.id)}</div>
            ))}
        </div>
      )}
    </AppShell>
  )
}

function workoutStreak(sessions: WorkoutSession[]): number {
  const days = new Set(sessions.filter((s) => s.completed).map((s) => todayKey(new Date(s.startedAt))))
  let streak = 0
  const cursor = new Date()
  for (;;) {
    const key = todayKey(cursor)
    if (!days.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function dietAdherence(logs: FoodLog[]): number {
  const days = new Set(logs.map((item) => item.date))
  const start = weekStart()
  let count = 0
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    if (date > new Date()) break
    if (days.has(todayKey(date))) count += 1
  }
  return count
}
