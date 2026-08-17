import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { NumberStepper } from '@/components/ui/NumberStepper'
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
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type MealWithItems = DietMeal & { items: DietMealItem[] }

type RegisterItem = {
  id: string
  foodName: string
  quantityLabel: string
  calories: number
  protein: number
  carbs: number
  fat: number
  extra: boolean
}

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
  const [adjustMeal, setAdjustMeal] = useState<MealWithItems | null>(null)
  const [registerItems, setRegisterItems] = useState<RegisterItem[]>([])
  const [multipliers, setMultipliers] = useState<Record<string, number>>({})
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addCalories, setAddCalories] = useState('')
  const [addProtein, setAddProtein] = useState('')
  const [addCarbs, setAddCarbs] = useState('')
  const [addFat, setAddFat] = useState('')
  const [addError, setAddError] = useState('')
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

  const adjustedTotals = useMemo(() => {
    return registerItems.reduce(
      (acc, item) => {
        const factor = multipliers[item.id] ?? 1
        if (factor <= 0) return acc
        return {
          calories: acc.calories + item.calories * factor,
          protein: acc.protein + item.protein * factor,
          carbs: acc.carbs + item.carbs * factor,
          fat: acc.fat + item.fat * factor,
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }, [registerItems, multipliers])

  function openAdjust(meal: MealWithItems) {
    const next: Record<string, number> = {}
    const items: RegisterItem[] = meal.items.map((item) => {
      next[item.id] = 1
      return {
        id: item.id,
        foodName: item.foodName,
        quantityLabel: item.quantityLabel,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        extra: false,
      }
    })
    setMultipliers(next)
    setRegisterItems(items)
    setAdjustMeal(meal)
    setAddItemOpen(false)
    setAddError('')
    setAddName('')
    setAddQty('')
    setAddCalories('')
    setAddProtein('')
    setAddCarbs('')
    setAddFat('')
  }

  function removeRegisterItem(id: string) {
    setRegisterItems((items) => items.filter((item) => item.id !== id))
  }

  function addRegisterItem() {
    const kcal = parseLocaleNumber(addCalories)
    const proteinValue = parseLocaleNumber(addProtein) ?? 0
    const carbsValue = parseLocaleNumber(addCarbs) ?? 0
    const fatValue = parseLocaleNumber(addFat) ?? 0
    if (!addName.trim()) {
      setAddError('Informe o nome do alimento.')
      return
    }
    if (kcal == null || kcal < 0) {
      setAddError('Informe as calorias.')
      return
    }
    const id = `extra-${Date.now()}`
    setRegisterItems((items) => [
      ...items,
      {
        id,
        foodName: addName.trim(),
        quantityLabel: addQty.trim(),
        calories: kcal,
        protein: proteinValue,
        carbs: carbsValue,
        fat: fatValue,
        extra: true,
      },
    ])
    setMultipliers((prev) => ({ ...prev, [id]: 1 }))
    setAddName('')
    setAddQty('')
    setAddCalories('')
    setAddProtein('')
    setAddCarbs('')
    setAddFat('')
    setAddError('')
    setAddItemOpen(false)
  }

  async function registerAsIs(meal: MealWithItems) {
    if (!user || !activeProfile || meal.items.length === 0 || saving) return
    setSaving(meal.id)
    try {
      await nutritionService.logPlannedMeal({
        user,
        profile: activeProfile,
        meal,
      })
      setPickerOpen(false)
      setPickerCategory(null)
      show('Refeição registrada ✓')
    } finally {
      setSaving(null)
    }
  }

  async function confirmAdjustedMeal() {
    if (!user || !activeProfile || !adjustMeal || saving) return
    const kept = registerItems.filter((item) => (multipliers[item.id] ?? 1) > 0)
    if (kept.length === 0) return
    setSaving(adjustMeal.id)
    try {
      const originalIds = new Set(adjustMeal.items.map((item) => item.id))
      const adjusted =
        kept.some((item) => item.extra) ||
        kept.length !== adjustMeal.items.length ||
        kept.some((item) => !originalIds.has(item.id))
      await nutritionService.logPlannedMeal({
        user,
        profile: activeProfile,
        meal: {
          ...adjustMeal,
          items: kept.map((item, order) => ({
            id: item.id,
            profileId: activeProfile.id,
            householdId: activeProfile.householdId,
            dietMealId: adjustMeal.id,
            foodName: item.foodName,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            quantityLabel: item.quantityLabel,
            order,
          })),
        },
        itemMultipliers: multipliers,
        adjusted,
      })
      setAdjustMeal(null)
      setRegisterItems([])
      setPickerOpen(false)
      setPickerCategory(null)
      show('Refeição registrada ✓')
    } finally {
      setSaving(null)
    }
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
        Toque em Registrar, escolha o prato e ajuste só esta refeição se comeu diferente.
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
        open={pickerOpen && !adjustMeal}
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
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="secondary"
                            disabled={Boolean(saving)}
                            onClick={() => openAdjust(meal)}
                          >
                            Ajustar
                          </Button>
                          <Button
                            disabled={Boolean(saving)}
                            onClick={() => void registerAsIs(meal)}
                          >
                            {saving === meal.id ? 'Salvando…' : 'Registro rápido'}
                          </Button>
                        </div>
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

      <Modal
        open={Boolean(adjustMeal)}
        onClose={() => !saving && setAdjustMeal(null)}
        title={adjustMeal?.name || 'Ajustar porções'}
      >
        {adjustMeal ? (
          <>
            <p className="mb-4 text-sm text-muted">
              Vale só para este registro. O prato da dieta continua igual.
            </p>
            <div className="space-y-4">
              {registerItems.map((item) => {
                const factor = multipliers[item.id] ?? 1
                return (
                  <div key={item.id} className="rounded-2xl bg-card2 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{item.foodName}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          {item.quantityLabel || (item.extra ? 'Item extra' : 'Porção da dieta')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-start gap-2">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatKcal(item.calories * factor)}
                        </p>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-danger"
                          aria-label={`Excluir ${item.foodName}`}
                          onClick={() => removeRegisterItem(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted tabular-nums">
                      Prot {formatGrams(item.protein * factor)} · Carbo {formatGrams(item.carbs * factor)} · Gord{' '}
                      {formatGrams(item.fat * factor)}
                    </p>
                    <div className="mt-3">
                      <NumberStepper
                        compact
                        value={factor}
                        step={0.5}
                        min={0}
                        suffix="×"
                        onChange={(value) =>
                          setMultipliers((prev) => ({
                            ...prev,
                            [item.id]: Math.round(value * 2) / 2,
                          }))
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {addItemOpen ? (
              <div className="mt-4 space-y-3 rounded-2xl bg-card2 p-3">
                <p className="text-sm font-medium">Alimento extra</p>
                <Input placeholder="Nome (ex.: pão)" value={addName} onChange={(e) => setAddName(e.target.value)} />
                <Input placeholder="Quantidade (opcional)" value={addQty} onChange={(e) => setAddQty(e.target.value)} />
                <Input placeholder="Calorias" inputMode="decimal" value={addCalories} onChange={(e) => setAddCalories(e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Prot" inputMode="decimal" value={addProtein} onChange={(e) => setAddProtein(e.target.value)} />
                  <Input placeholder="Carbo" inputMode="decimal" value={addCarbs} onChange={(e) => setAddCarbs(e.target.value)} />
                  <Input placeholder="Gord" inputMode="decimal" value={addFat} onChange={(e) => setAddFat(e.target.value)} />
                </div>
                {addError ? <p className="text-sm text-danger">{addError}</p> : null}
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={addRegisterItem}>Incluir</Button>
                  <Button variant="secondary" onClick={() => setAddItemOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="mt-4 w-full"
                variant="secondary"
                onClick={() => {
                  setAddError('')
                  setAddItemOpen(true)
                }}
              >
                <Plus size={16} />
                Adicionar item
              </Button>
            )}

            <div className="mt-5 rounded-2xl bg-card2 p-4">
              <p className="text-xs tracking-wide text-muted uppercase">Total a registrar</p>
              <p className="mt-1 font-display text-3xl text-accent">{Math.round(adjustedTotals.calories)}</p>
              <p className="text-sm text-muted">kcal</p>
              <p className="mt-2 text-sm text-muted">
                Prot {formatGrams(adjustedTotals.protein)} · Carbo {formatGrams(adjustedTotals.carbs)} · Gord{' '}
                {formatGrams(adjustedTotals.fat)}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button
                size="xl"
                disabled={Boolean(saving) || registerItems.filter((item) => (multipliers[item.id] ?? 1) > 0).length === 0}
                onClick={() => void confirmAdjustedMeal()}
              >
                {saving === adjustMeal.id ? 'Registrando…' : 'Confirmar registro'}
              </Button>
              <Button variant="secondary" disabled={Boolean(saving)} onClick={() => setAdjustMeal(null)}>
                Voltar
              </Button>
            </div>
          </>
        ) : null}
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
