import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EditButton } from '@/components/ui/EditButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { VideoModal } from '@/features/workout/WorkoutPieces'
import { useSession } from '@/hooks/useSession'
import { dietService } from '@/services/nutritionService'
import { MEAL_LABELS, type DietMeal, type DietMealItem } from '@/types'
import { loadDietCache } from '@/utils/dietCache'
import { cn } from '@/utils/cn'
import { groupMealsByMenuCategory, mealMacroTotals, type DietMenuCategory } from '@/utils/dietMeals'
import { formatGrams, formatKcal } from '@/utils/format'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type MealWithItems = DietMeal & { items: DietMealItem[] }

const SHORT_MEAL_LABELS: Record<DietMenuCategory, string> = {
  breakfast: 'Café da manhã',
  morning_snack: 'Lanche da manhã',
  lunch: 'Almoço',
  afternoon_snack: 'Tarde',
  dinner: 'Jantar',
  supper: 'Ceia',
  other: 'Extra',
}

export function DietPage() {
  const { activeProfile } = useSession()
  const [meals, setMeals] = useState<MealWithItems[]>([])
  const [planName, setPlanName] = useState('Minha dieta')
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<DietMenuCategory>('breakfast')
  const [videoMeal, setVideoMeal] = useState<MealWithItems | null>(null)

  useEffect(() => {
    if (!activeProfile) return
    let alive = true
    const cached = loadDietCache(activeProfile.id)
    if (cached?.plan) {
      setPlanName(cached.plan.name)
      setMeals(cached.meals)
      setLoading(false)
    } else {
      setPlanName('Minha dieta')
      setMeals([])
      setLoading(true)
    }
    dietService.getActivePlan(activeProfile).then((data) => {
      if (!alive) return
      setPlanName(data.plan?.name ?? 'Minha dieta')
      setMeals(data.meals)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [activeProfile?.id])

  const sections = useMemo(() => groupMealsByMenuCategory(meals), [meals])
  const current = sections.find((section) => section.category === category) ?? sections[0]
  const dishes = current?.meals ?? []

  useEffect(() => {
    if (!current || current.meals.length > 0) return
    const first = sections.find((section) => section.meals.length > 0)
    if (first) setCategory(first.category)
  }, [current, sections])

  return (
    <AppShell title="Dietas">
      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl leading-tight">{planName}</h2>
              <p className="mt-1 text-sm text-muted">Escolha a refeição e veja as opções.</p>
            </div>
            <EditButton to="/dietas/editar" />
          </div>

          <div className="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
            {sections.map((section) => {
              const selected = section.category === category
              return (
                <button
                  key={section.category}
                  type="button"
                  onClick={() => setCategory(section.category)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                    selected ? 'bg-accent text-bg' : 'bg-card2 text-muted',
                  )}
                >
                  {SHORT_MEAL_LABELS[section.category]}
                </button>
              )
            })}
          </div>

          <div className="mb-4 flex items-end justify-between gap-3">
            <h3 className="font-display text-xl">{current ? MEAL_LABELS[current.category] : 'Refeição'}</h3>
            <p className="text-sm text-muted">
              {dishes.length === 0
                ? 'Sem opções ainda'
                : `${dishes.length} ${dishes.length === 1 ? 'opção' : 'opções'}`}
            </p>
          </div>

          {dishes.length === 0 ? (
            <Card className="border border-dashed border-line bg-transparent">
              <p className="text-sm text-muted">Nenhum prato nesta refeição ainda.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {dishes.map((meal) => {
                const totals = mealMacroTotals(meal.items)
                return (
                  <article key={meal.id} className="overflow-hidden rounded-3xl bg-card">
                    <div className="flex items-start justify-between gap-3 px-4 pt-4">
                      <h4 className="font-display text-xl leading-tight">{meal.name || current?.label}</h4>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-2xl leading-none text-accent">{Math.round(totals.calories)}</p>
                        <p className="mt-0.5 text-[11px] tracking-wide text-muted uppercase">kcal</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 px-4">
                      <MacroChip label="Prot" value={formatGrams(totals.protein)} />
                      <MacroChip label="Carbo" value={formatGrams(totals.carbs)} />
                      <MacroChip label="Gord" value={formatGrams(totals.fat)} />
                    </div>
                    {meal.items.length === 0 ? (
                      <p className="px-4 pt-3 pb-4 text-sm text-muted">Ainda sem alimentos neste prato.</p>
                    ) : (
                      <ul className="mt-4 divide-y divide-line/80">
                        {meal.items.map((item) => (
                          <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                            <div className="min-w-0">
                              <p className="font-medium">{item.foodName}</p>
                              {item.quantityLabel ? <p className="mt-0.5 text-sm text-muted">{item.quantityLabel}</p> : null}
                            </div>
                            <p className="shrink-0 text-sm text-muted">{formatKcal(item.calories)}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {meal.youtubeUrl ? (
                      <div className="px-4 pt-1 pb-4">
                        <Button className="w-full" variant="secondary" onClick={() => setVideoMeal(meal)}>
                          Como preparar
                        </Button>
                      </div>
                    ) : (
                      <div className="h-2" />
                    )}
                  </article>
                )
              })}
            </div>
          )}

          <Link
            to="/calorias"
            className="mt-6 flex min-h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-semibold text-bg"
          >
            Registrar em Calorias
          </Link>
        </>
      )}
      <VideoModal
        title="Como preparar"
        url={videoMeal?.youtubeUrl ?? ''}
        open={Boolean(videoMeal)}
        onClose={() => setVideoMeal(null)}
      />
    </AppShell>
  )
}

function MacroChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-card2 px-3 py-1 text-xs font-medium text-muted">
      <span className="text-ink">{label}</span> {value}
    </span>
  )
}
