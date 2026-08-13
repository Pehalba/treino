import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Toast } from '@/components/ui/Toast'
import { useFeedback } from '@/hooks/useFeedback'
import { useSession } from '@/hooks/useSession'
import { dashboardService } from '@/services/dashboardService'
import { DASHBOARD_WIDGET_LABELS, type DashboardWidgetId } from '@/types'
import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function DashboardCustomizePage() {
  const navigate = useNavigate()
  const { user, activeProfile } = useSession()
  const { message, show } = useFeedback()
  const [widgets, setWidgets] = useState<Array<{ id: DashboardWidgetId; visible: boolean }>>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!activeProfile) return
    dashboardService.get(activeProfile.id).then(setWidgets)
  }, [activeProfile?.id])

  function move(index: number, dir: -1 | 1) {
    const next = index + dir
    if (next < 0 || next >= widgets.length) return
    const copy = [...widgets]
    const current = copy[index]
    const swap = copy[next]
    if (!current || !swap) return
    copy[index] = swap
    copy[next] = current
    setWidgets(copy)
  }

  async function save() {
    if (!user || !activeProfile) return
    setSaving(true)
    await dashboardService.save({ user, profile: activeProfile, widgets })
    setSaving(false)
    show()
  }

  return (
    <AppShell title="Personalizar painel">
      <Toast message={message} />
      <Button variant="ghost" className="mb-4 px-0" onClick={() => navigate(-1)}>
        ← Voltar
      </Button>
      <p className="mb-4 text-sm text-muted">
        Escolha o que {activeProfile?.name} vê na página inicial. Isso não altera o painel dos outros perfis.
      </p>
      <div className="space-y-2">
        {widgets.map((widget, index) => (
          <Card key={widget.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{DASHBOARD_WIDGET_LABELS[widget.id]}</p>
              <p className="text-xs text-muted">{widget.visible ? 'Visível' : 'Oculto'}</p>
            </div>
            <div className="flex gap-1">
              <button type="button" className="rounded-xl bg-card2 p-2" onClick={() => move(index, -1)}>
                <ArrowUp size={16} />
              </button>
              <button type="button" className="rounded-xl bg-card2 p-2" onClick={() => move(index, 1)}>
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                className="rounded-xl bg-card2 p-2"
                onClick={() =>
                  setWidgets((items) =>
                    items.map((item) => (item.id === widget.id ? { ...item, visible: !item.visible } : item)),
                  )
                }
              >
                {widget.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </Card>
        ))}
      </div>
      <Button className="mt-5 w-full" size="xl" disabled={saving} onClick={() => void save()}>
        {saving ? 'Salvando…' : 'Salvar painel'}
      </Button>
    </AppShell>
  )
}
