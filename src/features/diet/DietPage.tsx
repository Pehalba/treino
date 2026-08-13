import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EditButton } from '@/components/ui/EditButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession } from '@/hooks/useSession'
import { dietService, nutritionService } from '@/services/nutritionService'
import type { DietMeal, DietMealItem } from '@/types'
import { MEAL_LABELS } from '@/types'
import { formatKcal } from '@/utils/format'
import { useEffect, useState } from 'react'

type MealWithItems = DietMeal & { items: DietMealItem[] }

export function DietPage() {
  const { user, activeProfile } = useSession()
  const [meals, setMeals] = useState<MealWithItems[]>([])
  const [planName, setPlanName] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MealWithItems | null>(null)
  const [draftItems, setDraftItems] = useState<DietMealItem[]>([])

  async function load() {
    if (!activeProfile) return
    setLoading(true)
    const data = await dietService.getActivePlan(activeProfile.id)
    setPlanName(data.plan?.name ?? 'Minha dieta')
    setMeals(data.meals)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [activeProfile?.id])

  async function eat(meal: MealWithItems, items = meal.items) {
    if (!user || !activeProfile) return
    await nutritionService.logPlannedMeal({
      user,
      profile: activeProfile,
      meal: { ...meal, items },
    })
    setEditing(null)
  }

  return (
    <AppShell title="Dietas">
      <p className="mb-4 text-sm text-muted">O que está planejado para comer. Registrar aqui envia para Calorias.</p>
      {loading ? (
        <Skeleton className="h-64" />
      ) : meals.length === 0 ? (
        <div>
          <EmptyState
            title="Nenhuma dieta cadastrada"
            description="Monte a dieta pelo botão Editar. O que você já comeu em dias anteriores não muda."
          />
          <div className="mt-4 flex justify-center">
            <EditButton to="/dietas/editar" />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">{planName}</h2>
            <EditButton to="/dietas/editar" />
          </div>
          <div className="space-y-3">
            {meals.map((meal) => {
              const kcal = meal.items.reduce((s, i) => s + i.calories, 0)
              return (
                <Card key={meal.id}>
                  <h3 className="font-display text-lg">{meal.name || MEAL_LABELS[meal.category]}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {meal.items.map((item) => (
                      <li key={item.id}>
                        {item.foodName}
                        {item.quantityLabel ? ` · ${item.quantityLabel}` : ''} · {formatKcal(item.calories)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm">{formatKcal(kcal)}</p>
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button onClick={() => void eat(meal)}>✓ Comi esta refeição</Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditing(meal)
                        setDraftItems(meal.items)
                      }}
                    >
                      Editar antes de registrar
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Ajustar antes de registrar">
        <div className="space-y-3">
          {draftItems.map((item, index) => (
            <div key={item.id} className="rounded-2xl bg-card2 p-3">
              <p className="text-sm font-medium">{item.foodName}</p>
              <Input
                className="mt-2"
                inputMode="decimal"
                value={String(item.calories)}
                onChange={(e) => {
                  const next = [...draftItems]
                  next[index] = { ...item, calories: Number(e.target.value) || 0 }
                  setDraftItems(next)
                }}
              />
            </div>
          ))}
        </div>
        <Button
          className="mt-4 w-full"
          onClick={() => editing && void eat(editing, draftItems)}
        >
          Registrar em calorias
        </Button>
      </Modal>
    </AppShell>
  )
}
