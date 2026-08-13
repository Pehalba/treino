import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession } from '@/hooks/useSession'
import { workoutService } from '@/services/workoutService'
import type { TemplateWithMeta, WorkoutSession } from '@/types'
import { formatDate, formatDuration } from '@/utils/dates'
import { loadLocalSession } from '@/utils/localSession'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const { user, activeProfile } = useSession()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<TemplateWithMeta[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState<string | null>(null)

  async function load() {
    if (!activeProfile) return
    setLoading(true)
    setError('')
    try {
      const [tpl, sess] = await Promise.all([
        workoutService.getTemplatesWithMeta(activeProfile.id, activeProfile.householdId),
        workoutService.listSessions(activeProfile.id, 40),
      ])
      setTemplates(tpl)
      setSessions(sess)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar treinos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [activeProfile?.id])

  const recommended = workoutService.recommendedTemplate(templates, sessions)
  const local = activeProfile ? loadLocalSession(activeProfile.id) : null
  const active = sessions.find((s) => !s.completed) ?? (local && !local.session.completed ? local.session : null)

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

  return (
    <AppShell>
      <section className="pb-6">
        <p className="text-sm text-muted">Olá</p>
        <h1 className="font-display text-3xl font-semibold">
          Olá, {activeProfile?.name ?? user?.displayName} 👋
        </h1>
        <p className="mt-1 text-muted">Escolha o treino e comece agora.</p>
      </section>

      {active ? (
        <Card className="mb-5 border border-accent/30">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">Treino em andamento</p>
          <h2 className="mt-1 font-display text-2xl">{active.templateName}</h2>
          <Button className="mt-4 w-full" size="xl" onClick={() => navigate(`/treino/${active.id}`)}>
            Continuar
          </Button>
        </Card>
      ) : null}

      {recommended && !active ? (
        <Card className="mb-5">
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">Treino recomendado hoje</p>
          <h2 className="mt-1 font-display text-2xl">{recommended.name}</h2>
          <p className="text-sm text-muted">{recommended.exercises.length} exercícios · sugestão, não obrigação</p>
          <Button className="mt-4 w-full" size="xl" onClick={() => start(recommended)} disabled={starting === recommended.id}>
            Iniciar {recommended.name}
          </Button>
        </Card>
      ) : null}

      <h2 className="mb-3 font-display text-lg tracking-wide uppercase">Seus treinos</h2>
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : templates.length === 0 ? (
        <EmptyState
          title="Nenhum treino ainda"
          description="Os treinos placeholder são criados ao abrir o perfil. Tente recarregar ou importe seus treinos no perfil."
          actionLabel="Recarregar"
          onAction={() => void load()}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl">{template.name}</h3>
                  <p className="mt-1 text-sm text-muted">{template.exercises.length} exercícios</p>
                  <p className="text-sm text-muted">
                    Último treino: {template.lastSessionAt ? formatDate(template.lastSessionAt) : '—'}
                  </p>
                  <p className="text-sm text-muted">
                    Duração média:{' '}
                    {template.averageDurationSeconds ? formatDuration(template.averageDurationSeconds) : '—'}
                  </p>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                size="xl"
                onClick={() => start(template)}
                disabled={Boolean(starting)}
              >
                {starting === template.id ? 'Iniciando…' : 'Iniciar'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
