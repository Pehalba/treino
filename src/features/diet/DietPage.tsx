import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EditButton } from '@/components/ui/EditButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { VideoModal } from '@/features/workout/WorkoutPieces'
import { useSession } from '@/hooks/useSession'
import { dietService } from '@/services/nutritionService'
import type { DietMeal, DietMealItem } from '@/types'
import { groupMealsByMenuCategory, mealMacroTotals } from '@/utils/dietMeals'
import { formatKcal } from '@/utils/format'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type MealWithItems = DietMeal & { items: DietMealItem[] }

export function DietPage() {
  const { activeProfile } = useSession()
  const [meals, setMeals] = useState<MealWithItems[]>([])
  const [planName, setPlanName] = useState('Minha dieta')
  const [loading, setLoading] = useState(true)
  const [videoMeal, setVideoMeal] = useState<MealWithItems | null>(null)

  useEffect(() => {
    if (!activeProfile) return
    let alive = true
    setLoading(true)
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

  return (
    <AppShell title="Dietas">
      <p className="mb-4 text-sm text-muted">
        Aqui você só vê o plano e como preparar. Para anotar o que comeu, use Calorias.
      </p>
      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">{planName}</h2>
            <EditButton to="/dietas/editar" />
          </div>
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.category}>
                <h3 className="mb-2 text-xs font-semibold tracking-widest text-muted uppercase">{section.label}</h3>
                {section.meals.length === 0 ? (
                  <Card className="border border-dashed border-line bg-transparent">
                    <p className="text-sm text-muted">Nenhum prato ainda.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {section.meals.map((meal) => {
                      const totals = mealMacroTotals(meal.items)
                      return (
                        <Card key={meal.id}>
                          <h4 className="font-display text-lg">{meal.name || section.label}</h4>
                          {meal.items.length === 0 ? (
                            <p className="mt-2 text-sm text-muted">Ainda sem alimentos neste prato.</p>
                          ) : (
                            <>
                              <ul className="mt-2 space-y-1 text-sm text-muted">
                                {meal.items.map((item) => (
                                  <li key={item.id}>
                                    {item.foodName}
                                    {item.quantityLabel ? ` · ${item.quantityLabel}` : ''} · {formatKcal(item.calories)}
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-2 text-sm font-semibold">{formatKcal(totals.calories)}</p>
                            </>
                          )}
                          {meal.youtubeUrl ? (
                            <Button className="mt-4 w-full" variant="secondary" onClick={() => setVideoMeal(meal)}>
                              Como preparar
                            </Button>
                          ) : null}
                        </Card>
                      )
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
          <Link
            to="/calorias"
            className="mt-6 flex min-h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-semibold text-bg"
          >
            Ir para registrar em Calorias
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
