import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { Toast } from '@/components/ui/Toast'
import { VideoModal } from '@/features/workout/WorkoutPieces'
import { useFeedback } from '@/hooks/useFeedback'
import { useSession } from '@/hooks/useSession'
import { dietService, nutritionService } from '@/services/nutritionService'
import { MEAL_CATEGORIES, MEAL_LABELS, type DietMeal, type DietMealItem, type FoodLog, type MealCategory } from '@/types'
import { loadDietCache } from '@/utils/dietCache'
import { groupMealsByMenuCategory, mealMacroTotals, type DietMenuCategory } from '@/utils/dietMeals'
import { formatGrams, formatKcal, parseLocaleNumber } from '@/utils/format'
import { todayKey } from '@/utils/dates'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type MealWithItems = DietMeal & { items: DietMealItem[] }

export function CaloriesPage() {
  const navigate = useNavigate()
  const { user, activeProfile } = useSession()
  const { message, show } = useFeedback()
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [meals, setMeals] = useState<MealWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerCategory, setPickerCategory] = useState<DietMenuCategory | null>(null)
  const [category, setCategory] = useState<MealCategory>('lunch')
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [planGoal, setPlanGoal] = useState<number | null>(null)
  const [videoMeal, setVideoMeal] = useState<MealWithItems | null>(null)

  useEffect(() => {
    if (!activeProfile) return
    let alive = true
    const cached = loadDietCache(activeProfile.id)
    setLogs([])
    setMeals(cached?.meals ?? [])
    setPlanGoal(cached?.plan?.calorieGoal ?? null)
    setLoading(true)

    void dietService.getActivePlan(activeProfile).then((data) => {
      if (!alive) return
      setMeals(data.meals)
      setPlanGoal(data.plan?.calorieGoal ?? null)
    })
    const unsub = nutritionService.subscribeLogsByDate(
      activeProfile.id,
      todayKey(),
      (items) => {
        if (!alive) return
        setLogs(items)
        setLoading(false)
      },
      () => {
        if (alive) setLoading(false)
      },
    )
    return () => {
      alive = false
      unsub()
    }
  }, [activeProfile?.id])

  const totals = useMemo(() => nutritionService.totals(logs), [logs])
  const sections = useMemo(() => groupMealsByMenuCategory(meals), [meals])
  const readyMeals = useMemo(() => meals.filter((meal) => meal.items.length > 0), [meals])
  const loggedMealIds = useMemo(
    () => new Set(logs.map((log) => log.fromDietMealId).filter((id): id is string => Boolean(id))),
    [logs],
  )
  const goal = planGoal || activeProfile?.calorieGoal || 0
  const remaining = Math.max(0, goal - totals.calories)

  async function registerMeal(meal: MealWithItems) {
    if (!user || !activeProfile || meal.items.length === 0 || saving) return
    setSaving(meal.id)
    await nutritionService.logPlannedMeal({ user, profile: activeProfile, meal })
    setSaving(null)
    setPickerOpen(false)
    setPickerCategory(null)
    show('Refeição registrada ✓')
  }

  async function saveExtra() {
    if (!user || !activeProfile) return
    const kcal = parseLocaleNumber(calories)
    if (!name.trim() || kcal == null) return
    setSaving('extra')
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
    setSaving(null)
    setOpen(false)
    setName('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    show('Refeição registrada ✓')
  }

  return (
    <AppShell title="Calorias">
      <Toast message={message} />
      <p className="mb-4 text-sm text-muted">
        Toque em Registrar, escolha a refeição e depois o prato. As calorias já vêm da dieta.
      </p>
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

      <Button
        className="mt-6 w-full"
        size="xl"
        onClick={() => {
          setPickerCategory(null)
          setPickerOpen(true)
        }}
        disabled={readyMeals.length === 0}
      >
        Registrar refeição
      </Button>
      {readyMeals.length === 0 && !loading ? (
        <EmptyState
          title="Nenhum prato pronto ainda"
          description="Monte as opções em Dietas. Depois você escolhe a refeição e o prato daqui."
          actionLabel="Abrir dietas"
          onAction={() => navigate('/dietas')}
        />
      ) : null}

      <Button className="mt-3 w-full" size="lg" variant="secondary" onClick={() => setOpen(true)}>
        Outra refeição (fora da dieta)
      </Button>

      <h2 className="mt-8 mb-3 font-display text-lg">Hoje</h2>
      <div className="space-y-2">
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

      <Modal
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false)
          setPickerCategory(null)
        }}
        title={pickerCategory ? MEAL_LABELS[pickerCategory] : 'Qual refeição?'}
      >
        {pickerCategory ? (
          <>
            <Button className="mb-3 px-0" variant="ghost" onClick={() => setPickerCategory(null)}>
              ← Trocar refeição
            </Button>
            <div className="space-y-2">
              {(sections.find((section) => section.category === pickerCategory)?.meals ?? [])
                .filter((meal) => meal.items.length > 0)
                .map((meal) => {
                  const macros = mealMacroTotals(meal.items)
                  const already = loggedMealIds.has(meal.id)
                  return (
                    <div key={meal.id} className="rounded-2xl bg-card2 p-3">
                      <p className="font-display text-lg">{meal.name || MEAL_LABELS[pickerCategory]}</p>
                      <p className="mt-1 text-sm text-muted">{meal.items.map((item) => item.foodName).join(' · ')}</p>
                      <p className="mt-1 text-sm font-semibold">{formatKcal(macros.calories)}</p>
                      {already ? <p className="mt-1 text-xs text-accent">Já registrado hoje</p> : null}
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {meal.youtubeUrl ? (
                          <Button variant="secondary" onClick={() => setVideoMeal(meal)}>
                            Como preparar
                          </Button>
                        ) : null}
                        <Button size="xl" disabled={Boolean(saving)} onClick={() => void registerMeal(meal)}>
                          {saving === meal.id ? 'Registrando…' : 'Registrar este prato'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              {(sections.find((section) => section.category === pickerCategory)?.meals ?? []).filter((meal) => meal.items.length > 0)
                .length === 0 ? (
                <p className="text-sm text-muted">Ainda não há pratos nesta refeição. Eles entram em Dietas.</p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {sections.map((section) => {
              const count = section.meals.filter((meal) => meal.items.length > 0).length
              return (
                <button
                  key={section.category}
                  type="button"
                  disabled={count === 0}
                  onClick={() => setPickerCategory(section.category)}
                  className="flex min-h-14 items-center justify-between rounded-2xl bg-card2 px-4 text-left disabled:opacity-40"
                >
                  <span className="font-semibold">{section.label}</span>
                  <span className="text-sm text-muted">{count === 0 ? 'Vazio' : `${count} ${count === 1 ? 'prato' : 'pratos'}`}</span>
                </button>
              )
            })}
          </div>
        )}
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="Fora da dieta">
        <p className="mb-3 text-sm text-muted">Use só se o que você comeu não está nos pratos da dieta.</p>
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
        <Button className="mt-4 w-full" size="xl" onClick={() => void saveExtra()} disabled={saving === 'extra'}>
          Salvar
        </Button>
      </Modal>
      <VideoModal
        title="Como preparar"
        url={videoMeal?.youtubeUrl ?? ''}
        open={Boolean(videoMeal)}
        onClose={() => setVideoMeal(null)}
      />
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
