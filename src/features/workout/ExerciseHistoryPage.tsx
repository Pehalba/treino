import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession } from '@/hooks/useSession'
import { exerciseService } from '@/services/exerciseService'
import { progressService } from '@/services/progressService'
import { reportService } from '@/services/reportService'
import { workoutService } from '@/services/workoutService'
import { EQUIPMENT_LABELS, MUSCLE_LABELS, type Exercise, type ExerciseSet } from '@/types'
import { formatDateLong } from '@/utils/dates'
import { formatKg } from '@/utils/format'
import { youtubeWatchUrl } from '@/utils/ids'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EXERCISE_CHART_RANGES, type ExerciseChartRange } from '@/types'

const RANGE_LABELS: Record<ExerciseChartRange, string> = {
  '30d': '30 dias',
  '3m': '3 meses',
  '6m': '6 meses',
  '1y': '1 ano',
  all: 'Tudo',
}

export function ExerciseHistoryPage() {
  const { exerciseId } = useParams()
  const { activeProfile } = useSession()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [sets, setSets] = useState<ExerciseSet[]>([])
  const [range, setRange] = useState<ExerciseChartRange>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeProfile || !exerciseId) return
    Promise.all([
      exerciseService.listByHousehold(activeProfile.householdId),
      workoutService.listSetsByExercise(activeProfile.id, exerciseId),
    ]).then(([catalog, history]) => {
      setExercise(catalog.find((e) => e.id === exerciseId) ?? null)
      setSets(history)
      setLoading(false)
    })
  }, [activeProfile?.id, exerciseId])

  const fromTs =
    range === 'all'
      ? 0
      : range === '30d'
        ? Date.now() - 30 * 86400000
        : range === '3m'
          ? Date.now() - 90 * 86400000
          : range === '6m'
            ? Date.now() - 180 * 86400000
            : Date.now() - 365 * 86400000
  const filtered = sets.filter((s) => s.createdAt >= fromTs)
  const history = reportService.exerciseHistory(filtered)
  const progression = progressService.loadProgression(filtered)

  if (loading) {
    return (
      <AppShell>
        <Skeleton className="h-64" />
      </AppShell>
    )
  }

  if (!exercise) {
    return (
      <AppShell>
        <EmptyState title="Exercício não encontrado" description="Volte e escolha outro." />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Link to="/relatorios" className="text-sm text-muted">
        ← Relatórios
      </Link>
      <h1 className="mt-3 font-display text-3xl">{exercise.name}</h1>
      <p className="text-muted">
        {MUSCLE_LABELS[exercise.muscleGroup]} · {EQUIPMENT_LABELS[exercise.equipment]}
      </p>
      {exercise.youtubeUrl ? (
        <a className="mt-2 inline-block text-sm text-accent" href={youtubeWatchUrl(exercise.youtubeUrl)} target="_blank" rel="noreferrer">
          Ver execução
        </a>
      ) : null}

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {EXERCISE_CHART_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${range === r ? 'bg-accent text-bg' : 'bg-card2'}`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {history.length < 2 ? (
        <div className="mt-5">
          <EmptyState
            title="Histórico insuficiente"
            description="Você ainda não possui histórico suficiente para gerar este gráfico."
          />
        </div>
      ) : (
        <Card className="mt-5">
          {progression ? (
            <p className="text-sm text-muted">
              {formatKg(progression.startWeight)} → {formatKg(progression.currentWeight)}
            </p>
          ) : null}
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <LineChart data={[...history].reverse()}>
                <CartesianGrid stroke="#2A2D33" />
                <XAxis dataKey="date" tickFormatter={(v) => formatDateLong(Number(v))} stroke="#97999E" />
                <YAxis stroke="#97999E" />
                <Tooltip contentStyle={{ background: '#15171A', border: '1px solid #2A2D33' }} />
                <Line type="monotone" dataKey="weight" stroke="#B8FF3D" name="Carga" />
                <Line type="monotone" dataKey="volume" stroke="#97999E" name="Volume" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="mt-5 space-y-2">
        {history.map((row) => (
          <Card key={row.sessionId}>
            <p className="font-medium">{formatDateLong(row.date)}</p>
            <p className="text-sm text-muted">
              {formatKg(row.weight)} · {row.reps.join(' / ')}
            </p>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
