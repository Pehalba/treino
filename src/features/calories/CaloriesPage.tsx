import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession } from '@/hooks/useSession'
import { nutritionService } from '@/services/nutritionService'
import { MEAL_CATEGORIES, MEAL_LABELS, type FoodLog, type MealCategory } from '@/types'
import { formatGrams, formatKcal, parseLocaleNumber } from '@/utils/format'
import { todayKey } from '@/utils/dates'
import { useEffect, useMemo, useState } from 'react'

export function CaloriesPage() {
  const { user, activeProfile } = useSession()
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<MealCategory>('lunch')
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!activeProfile) return
    setLoading(true)
    const unsub = nutritionService.subscribeLogsByDate(
      activeProfile.id,
      todayKey(),
      (items) => {
        setLogs(items)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [activeProfile?.id])

  const totals = useMemo(() => nutritionService.totals(logs), [logs])
  const goal = activeProfile?.calorieGoal ?? 0
  const remaining = Math.max(0, goal - totals.calories)

  async function save() {
    if (!user || !activeProfile) return
    const kcal = parseLocaleNumber(calories)
    if (!name.trim() || kcal == null) return
    setSaving(true)
    await nutritionService.logFood({
      user,
      profile: activeProfile,
      category,
      name: name.trim(),
      calories: kcal,
      protein: parseLocaleNumber(protein) ?? 0,
      carbs: parseLocaleNumber(carbs) ?? 0,
      fat: parseLocaleNumber(fat) ?? 0,
    })
    setSaving(false)
    setOpen(false)
    setName('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
  }

  return (
    <AppShell title="Calorias">
      <p className="mb-4 text-sm text-muted">O que você realmente comeu hoje. Não é a dieta planejada.</p>
      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <Card className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <ProgressRing value={totals.calories} max={goal || 1}>
            <div className="text-center">
              <p className="text-2xl font-semibold">{Math.round(totals.calories)}</p>
              <p className="text-xs text-muted">kcal</p>
            </div>
          </ProgressRing>
          <div className="w-full space-y-2 text-sm">
            <p>Meta: {formatKcal(goal)}</p>
            <p>Consumido: {formatKcal(totals.calories)}</p>
            <p>Restante: {formatKcal(remaining)}</p>
            <Macro label="Proteína" value={totals.protein} goal={activeProfile?.proteinGoal ?? 0} />
            <Macro label="Carboidrato" value={totals.carbs} goal={activeProfile?.carbGoal ?? 0} />
            <Macro label="Gordura" value={totals.fat} goal={activeProfile?.fatGoal ?? 0} />
          </div>
        </Card>
      )}

      <Button className="mt-5 w-full" size="xl" onClick={() => setOpen(true)}>
        + Registrar refeição
      </Button>

      <div className="mt-6 space-y-2">
        {logs.length === 0 ? (
          <Card className="text-sm text-muted">Nada registrado hoje.</Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{log.name}</p>
                <p className="text-sm text-muted">{MEAL_LABELS[log.category]}</p>
              </div>
              <p className="font-semibold">{Math.round(log.calories)}</p>
            </Card>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registro rápido">
        <div className="grid grid-cols-2 gap-2">
          {MEAL_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`min-h-11 rounded-2xl text-sm ${category === c ? 'bg-accent text-bg' : 'bg-card2'}`}
            >
              {MEAL_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <Input placeholder="Nome (ex.: Pizza)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Calorias" inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} />
          <Input placeholder="Proteína (g)" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
          <Input placeholder="Carboidratos (g)" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          <Input placeholder="Gorduras (g)" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>
        <Button className="mt-4 w-full" size="xl" onClick={() => void save()} disabled={saving}>
          Salvar
        </Button>
      </Modal>
    </AppShell>
  )
}

function Macro({ label, value, goal }: { label: string; value: number; goal: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span>
          {formatGrams(value)} / {formatGrams(goal)}
        </span>
      </div>
      <ProgressBar value={value} max={goal || 1} />
    </div>
  )
}
