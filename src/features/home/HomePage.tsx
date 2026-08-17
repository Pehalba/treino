import { AppShell } from '@/components/layout/AppShell'
import { WorkoutName } from '@/components/workout/WorkoutName'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EditButton } from '@/components/ui/EditButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { useRestClock } from '@/hooks/useRestTimer'
import { useSession } from '@/hooks/useSession'
import { dashboardService } from '@/services/dashboardService'
import { nutritionService } from '@/services/nutritionService'
import { profileService } from '@/services/profileService'
import { weightService } from '@/services/weightService'
import { workoutService, MAX_WORKOUT_DURATION_MS } from '@/services/workoutService'
import type {
  DashboardWidgetId,
  FoodLog,
  PersonalRecord,
  TemplateWithMeta,
  WeightEntry,
  WorkoutSession,
} from '@/types'
import { PROFILE_GOAL_LABELS } from '@/types'
import { formatDate, formatDuration, formatTimer, todayKey, weekStart } from '@/utils/dates'
import { formatGrams, formatKcal, formatKg, parseLocaleNumber } from '@/utils/format'
import { clearLocalSession, loadLocalSession } from '@/utils/localSession'
import { withTimeout } from '@/utils/withTimeout'
import { cn } from '@/utils/cn'
import {
  Activity,
  CalendarCheck,
  Drumstick,
  Dumbbell,
  Flame,
  Salad,
  Scale,
  Target,
  Trophy,
  TrendingUp,
  Weight,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const WIDGET_ICONS: Record<DashboardWidgetId, LucideIcon> = {
  today_workout: Dumbbell,
  workout_list: Dumbbell,
  week_workouts: CalendarCheck,
  weekly_goal: Target,
  calories_consumed: Flame,
  calories_remaining: Flame,
  protein: Drumstick,
  current_weight: Scale,
  weekly_weight_avg: Scale,
  bulk_progress: Weight,
  last_records: Trophy,
  load_progression: TrendingUp,
  workout_streak: Activity,
  diet_adherence: Salad,
}

function WidgetHeader({ id, label }: { id: DashboardWidgetId; label: string }) {
  const Icon = WIDGET_ICONS[id]
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Icon size={16} strokeWidth={2.2} aria-hidden />
      </span>
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">{label}</p>
    </div>
  )
}

function TapCard({
  onClick,
  hint,
  className,
  children,
}: {
  onClick?: () => void
  hint?: string
  className?: string
  children: ReactNode
}) {
  if (!onClick) {
    return <Card className={className}>{children}</Card>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-3xl bg-card p-4 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        className,
      )}
    >
      {children}
      {hint ? <p className="mt-2 text-xs text-accent">{hint}</p> : null}
    </button>
  )
}

export function HomePage() {
  const { user, activeProfile, patchActiveProfile } = useSession()
  const navigate = useNavigate()
  const { remaining: restRemaining, running: restRunning } = useRestClock()
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
  const [weightOpen, setWeightOpen] = useState(false)
  const [weightValue, setWeightValue] = useState('')
  const [weightSaving, setWeightSaving] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [goalValue, setGoalValue] = useState('')
  const [goalSaving, setGoalSaving] = useState(false)

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
        const [{ templates, sessions }, prefs] = await Promise.all([
          withTimeout(workoutService.getHomeBundle(profileId, householdId), 8000, 'home'),
          withTimeout(dashboardService.get(profileId), 4000, 'painel').catch(() => dashboardService.defaults()),
        ])
        if (!alive) return
        if (user) {
          const closed = await workoutService.expireStaleOpenSessions({ user, profile: activeProfile })
          if (closed.length > 0) {
            const refreshed = await withTimeout(
              workoutService.getHomeBundle(profileId, householdId),
              8000,
              'home',
            ).catch(() => null)
            if (!alive) return
            setTemplates(refreshed?.templates ?? templates)
            setSessions(refreshed?.sessions ?? sessions.map((item) => {
              const done = closed.find((row) => row.id === item.id)
              return done ?? item
            }))
            setWidgets(prefs)
            setLoading(false)
          } else {
            setTemplates(templates)
            setSessions(sessions)
            setWidgets(prefs)
            setLoading(false)
          }
        } else {
          setTemplates(templates)
          setSessions(sessions)
          setWidgets(prefs)
          setLoading(false)
        }

        const [food, w, recs] = await Promise.all([
          withTimeout(nutritionService.listLogsSince(profileId, todayKey(weekStart())), 6000, 'comida').catch(() => []),
          withTimeout(weightService.list(profileId), 6000, 'peso').catch(() => []),
          withTimeout(workoutService.listRecords(profileId), 6000, 'recordes').catch(() => []),
        ])
        if (!alive) return
        setLogs(food)
        setWeights(w)
        setRecords(recs)
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Falha ao carregar treinos.')
        setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [activeProfile?.id, user?.id, reloadToken])

  const local = activeProfile ? loadLocalSession(activeProfile.id) : null
  const activeFromCloud = sessions.find(
    (s) => !s.completed && Date.now() - s.startedAt < MAX_WORKOUT_DURATION_MS,
  )
  const localFresh =
    local &&
    !local.session.completed &&
    Date.now() - local.session.startedAt < MAX_WORKOUT_DURATION_MS
      ? local.session
      : null
  // Enquanto carrega, pode usar o local; depois confia na nuvem (evita “Continuar” fantasma).
  const active = activeFromCloud ?? (loading || error ? localFresh : null)

  useEffect(() => {
    if (loading || error || !activeProfile || !local || local.session.completed) return
    if (activeFromCloud) return
    const match = sessions.find((s) => s.id === local.session.id)
    if (match?.completed || !match) {
      clearLocalSession(activeProfile.id)
    }
  }, [
    loading,
    error,
    activeProfile?.id,
    activeFromCloud?.id,
    local?.session.id,
    local?.session.completed,
    sessions,
  ])
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

  function openWeightModal() {
    setWeightValue(currentWeight != null ? String(currentWeight).replace('.', ',') : '')
    setWeightOpen(true)
  }

  async function saveWeight() {
    if (!user || !activeProfile) return
    const weight = parseLocaleNumber(weightValue)
    if (weight == null || weight <= 0) return
    setWeightSaving(true)
    try {
      const entry = await weightService.logOrUpdateToday({ user, profile: activeProfile, weight })
      setWeights((prev) => {
        const withoutToday = prev.filter((item) => item.date !== entry.date)
        return [entry, ...withoutToday].sort((a, b) => b.date.localeCompare(a.date))
      })
      setWeightOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o peso.')
    } finally {
      setWeightSaving(false)
    }
  }

  function openGoalModal() {
    setGoalValue(String(activeProfile?.weeklyWorkoutGoal ?? 4))
    setGoalOpen(true)
  }

  async function saveWeeklyGoal() {
    if (!user || !activeProfile) return
    const goal = Number(goalValue)
    if (!Number.isFinite(goal) || goal < 0) return
    setGoalSaving(true)
    try {
      await profileService.updateProfile(activeProfile.id, { weeklyWorkoutGoal: goal }, user.id)
      patchActiveProfile({ weeklyWorkoutGoal: goal })
      setGoalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a meta.')
    } finally {
      setGoalSaving(false)
    }
  }

  function renderWidget(id: DashboardWidgetId) {
    switch (id) {
      case 'today_workout':
        if (!active) return null
        return (
          <Card className="border border-accent/30">
            <WidgetHeader id="today_workout" label="Treino em andamento" />
            <h2 className="mt-2 font-display text-2xl">
              <WorkoutName name={active.templateName} />
            </h2>
            <Button className="mt-4 w-full" size="xl" onClick={() => navigate(`/treino/${active.id}`)}>
              {restRunning ? `Continuar · ${formatTimer(restRemaining)}` : 'Continuar'}
            </Button>
          </Card>
        )
      case 'workout_list':
        return (
          <section>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Dumbbell size={16} strokeWidth={2.2} aria-hidden />
              </span>
              <h2 className="font-display text-lg tracking-wide uppercase">Seus treinos</h2>
            </div>
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
          <TapCard onClick={() => navigate('/treino')} hint="Toque para ver treinos">
            <WidgetHeader id="week_workouts" label="Treinos da semana" />
            <p className="mt-2 font-display text-3xl">{weekSessions.length}</p>
            <p className="text-sm text-muted">
              {weekSessions.map((s) => s.templateName).join(' · ') || 'Nenhum treino ainda nesta semana.'}
            </p>
          </TapCard>
        )
      case 'weekly_goal': {
        const goal = activeProfile?.weeklyWorkoutGoal ?? 4
        return (
          <TapCard onClick={openGoalModal} hint="Toque para alterar a meta">
            <WidgetHeader id="weekly_goal" label="Meta semanal" />
            <p className="mt-2 font-display text-3xl">
              {weekSessions.length}/{goal}
            </p>
            <ProgressBar className="mt-3" value={weekSessions.length} max={goal || 1} />
          </TapCard>
        )
      }
      case 'calories_consumed':
        return (
          <TapCard onClick={() => navigate('/calorias')} hint="Toque para registrar comida">
            <WidgetHeader id="calories_consumed" label="Calorias consumidas" />
            <p className="mt-2 font-display text-3xl">{formatKcal(totals.calories)}</p>
            <p className="text-sm text-muted">Meta: {formatKcal(calorieGoal)}</p>
          </TapCard>
        )
      case 'calories_remaining':
        return (
          <TapCard onClick={() => navigate('/calorias')} hint="Toque para registrar comida">
            <WidgetHeader id="calories_remaining" label="Calorias restantes" />
            <p className="mt-2 font-display text-3xl">{formatKcal(remaining)}</p>
          </TapCard>
        )
      case 'protein':
        return (
          <TapCard onClick={() => navigate('/calorias')} hint="Toque para registrar comida">
            <WidgetHeader id="protein" label="Proteína" />
            <p className="mt-2 font-display text-3xl">{formatGrams(totals.protein)}</p>
            <p className="text-sm text-muted">Meta: {formatGrams(activeProfile?.proteinGoal ?? 0)}</p>
          </TapCard>
        )
      case 'current_weight':
        return (
          <TapCard onClick={openWeightModal} hint="Toque para atualizar o peso">
            <WidgetHeader id="current_weight" label="Peso atual" />
            <p className="mt-2 font-display text-3xl">{currentWeight != null ? formatKg(currentWeight) : '—'}</p>
            {weightGoal != null ? (
              <p className="text-sm text-muted">Meta: {formatKg(weightGoal)}</p>
            ) : (
              <p className="text-sm text-muted">Defina a meta em Perfil.</p>
            )}
          </TapCard>
        )
      case 'weekly_weight_avg':
        return (
          <TapCard onClick={openWeightModal} hint="Toque para registrar peso">
            <WidgetHeader id="weekly_weight_avg" label="Média semanal de peso" />
            <p className="mt-2 font-display text-3xl">{avgWeight != null ? formatKg(avgWeight) : '—'}</p>
          </TapCard>
        )
      case 'bulk_progress':
        return (
          <TapCard onClick={openWeightModal} hint="Toque para registrar peso">
            <WidgetHeader id="bulk_progress" label="Progresso do peso" />
            <p className="mt-2 font-display text-3xl">
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
          </TapCard>
        )
      case 'last_records':
        return (
          <TapCard onClick={() => navigate('/relatorios')} hint="Toque para ver relatórios">
            <WidgetHeader id="last_records" label="Últimos recordes" />
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
          </TapCard>
        )
      case 'load_progression':
        return (
          <TapCard onClick={() => navigate('/relatorios')} hint="Toque para ver relatórios">
            <WidgetHeader id="load_progression" label="Progressão de carga" />
            <p className="mt-2 font-display text-2xl">
              {lastVolume != null ? Math.round(lastVolume) : '—'}
              <span className="text-base text-muted"> kg volume</span>
            </p>
            <p className="text-sm text-muted">
              {prevVolume != null && lastVolume != null
                ? `Anterior: ${Math.round(prevVolume)} kg`
                : 'Faça mais um treino para comparar.'}
            </p>
          </TapCard>
        )
      case 'workout_streak':
        return (
          <TapCard onClick={() => navigate('/treino')} hint="Toque para ver treinos">
            <WidgetHeader id="workout_streak" label="Sequência de treinos" />
            <p className="mt-2 font-display text-3xl">{streak} dias</p>
          </TapCard>
        )
      case 'diet_adherence':
        return (
          <TapCard onClick={() => navigate('/dietas')} hint="Toque para ver dietas">
            <WidgetHeader id="diet_adherence" label="Aderência à dieta" />
            <p className="mt-2 font-display text-3xl">{dietDays}</p>
            <p className="text-sm text-muted">dias desta semana com registro de comida</p>
          </TapCard>
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

      <Modal open={weightOpen} onClose={() => setWeightOpen(false)} title="Atualizar peso">
        <p className="mb-3 text-sm text-muted">Registra ou atualiza o peso de hoje.</p>
        <Input
          placeholder="80,5"
          inputMode="decimal"
          value={weightValue}
          onChange={(e) => setWeightValue(e.target.value)}
        />
        <Button className="mt-4 w-full" disabled={weightSaving} onClick={() => void saveWeight()}>
          {weightSaving ? 'Salvando…' : 'Salvar peso'}
        </Button>
      </Modal>

      <Modal open={goalOpen} onClose={() => setGoalOpen(false)} title="Meta semanal de treinos">
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          value={goalValue}
          onChange={(e) => setGoalValue(e.target.value)}
        />
        <Button className="mt-4 w-full" disabled={goalSaving} onClick={() => void saveWeeklyGoal()}>
          {goalSaving ? 'Salvando…' : 'Salvar meta'}
        </Button>
      </Modal>
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
