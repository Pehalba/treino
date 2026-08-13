import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession } from '@/hooks/useSession'
import { weightService } from '@/services/weightService'
import type { WeightEntry } from '@/types'
import { formatDateLong } from '@/utils/dates'
import { formatKg, parseLocaleNumber } from '@/utils/format'
import { useEffect, useState } from 'react'

export function WeightPage({ embedded = false }: { embedded?: boolean }) {
  const { user, activeProfile } = useSession()
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (!activeProfile) return
    setEntries([])
    setLoading(true)
    const unsub = weightService.subscribe(
      activeProfile.id,
      (items) => {
        setEntries(items)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [activeProfile?.id])

  const avg = weightService.sevenDayAverage(entries)
  const trend = weightService.trend(entries)
  const trendLabel = trend === 'up' ? 'Tendência de alta' : trend === 'down' ? 'Tendência de baixa' : trend === 'flat' ? 'Estável' : 'Ainda sem tendência'

  async function save() {
    if (!user || !activeProfile) return
    const weight = parseLocaleNumber(value)
    if (weight == null) return
    await weightService.logWeight({ user, profile: activeProfile, weight })
    setOpen(false)
    setValue('')
  }

  const content = (
    <>
      {loading ? (
        <Skeleton className="h-32" />
      ) : (
        <Card>
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">Média de 7 dias</p>
          <p className="mt-1 font-display text-3xl">{avg ? formatKg(avg) : '—'}</p>
          <p className="mt-1 text-sm text-muted">{trendLabel}. O peso diário oscila; a média importa mais.</p>
          {activeProfile?.weightGoalKg != null ? (
            <p className="mt-2 text-sm text-muted">Meta: {formatKg(activeProfile.weightGoalKg)}</p>
          ) : null}
          <Button className="mt-4 w-full" onClick={() => setOpen(true)}>
            Registrar peso
          </Button>
        </Card>
      )}
      <div className="mt-4 space-y-2">
        {entries.length === 0 ? (
          <EmptyState title="Sem registros de peso" description="Registre o peso para acompanhar a evolução semanal." />
        ) : (
          entries.slice(0, 14).map((e) => (
            <Card key={e.id} className="flex justify-between">
              <span className="text-sm text-muted">{formatDateLong(e.date)}</span>
              <span className="font-semibold">{formatKg(e.weight)}</span>
            </Card>
          ))
        )}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar peso">
        <Input placeholder="80,5" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        <Button className="mt-4 w-full" onClick={() => void save()}>
          Salvar
        </Button>
      </Modal>
    </>
  )

  if (embedded) return content
  return <AppShell title="Peso">{content}</AppShell>
}
