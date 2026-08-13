import { WorkoutName } from '@/components/workout/WorkoutName'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EditButton } from '@/components/ui/EditButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession } from '@/hooks/useSession'
import { workoutService } from '@/services/workoutService'
import type { TemplateWithMeta, WorkoutSession } from '@/types'
import { formatDateLong, formatDuration } from '@/utils/dates'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function WorkoutsPage() {
  const { user, activeProfile } = useSession()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<TemplateWithMeta[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeProfile) return
    let alive = true
    Promise.all([
      workoutService.getTemplatesWithMeta(activeProfile.id, activeProfile.householdId),
      workoutService.listSessions(activeProfile.id, 40),
    ]).then(([tpl, sess]) => {
      if (!alive) return
      setTemplates(tpl)
      setSessions(sess)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [activeProfile?.id])

  async function start(template: TemplateWithMeta) {
    if (!user || !activeProfile) return
    const { session } = await workoutService.startSession({ user, profile: activeProfile, template })
    navigate(`/treino/${session.id}`)
  }

  return (
    <AppShell title="Treino">
      <h2 className="mb-3 font-display text-lg tracking-wide uppercase">Meus treinos</h2>
      {loading ? (
        <Skeleton className="h-32" />
      ) : templates.length === 0 ? (
        <EmptyState title="Sem treinos" description="Importe ou cadastre treinos no perfil." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl">
                  <WorkoutName name={t.name} />
                </h3>
                <p className="text-sm text-muted">{t.exercises.length} exercícios</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <EditButton to={`/treinos/${t.id}/editar`} />
                <Button onClick={() => void start(t)}>Iniciar</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-8 mb-3 font-display text-lg tracking-wide uppercase">Histórico</h2>
      {sessions.filter((s) => s.completed).length === 0 ? (
        <EmptyState
          title="Sem histórico ainda"
          description="Quando você finalizar um treino, ele aparece aqui."
        />
      ) : (
        <div className="space-y-2">
          {sessions
            .filter((s) => s.completed)
            .map((s) => (
              <Card key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {formatDateLong(s.startedAt)} — {s.templateName}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDuration(s.durationSeconds)} · {s.exercisesCompleted} exercícios
                  </p>
                </div>
                <Link to={`/treino/${s.id}/resumo`} className="text-sm text-accent">
                  Ver
                </Link>
              </Card>
            ))}
        </div>
      )}
    </AppShell>
  )
}
