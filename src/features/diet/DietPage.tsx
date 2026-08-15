import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EditButton } from '@/components/ui/EditButton'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { Skeleton } from '@/components/ui/Skeleton'
import { VideoModal } from '@/features/workout/WorkoutPieces'
import { useSession } from '@/hooks/useSession'
import { dietEditorService } from '@/services/dietEditorService'
import { dietService } from '@/services/nutritionService'
import {
  DIET_SUPPLEMENT_KINDS,
  DIET_SUPPLEMENT_LABELS,
  MEAL_LABELS,
  type DietMeal,
  type DietMealItem,
  type DietSupplement,
  type DietSupplementKind,
} from '@/types'
import { loadDietCache, saveDietCache } from '@/utils/dietCache'
import { loadSupplementCache } from '@/utils/supplementCache'
import { cn } from '@/utils/cn'
import { groupMealsByMenuCategory, mealMacroTotals, type DietMenuCategory } from '@/utils/dietMeals'
import { formatGrams, formatKcal, parseLocaleNumber } from '@/utils/format'
import { scaleMealItemByFactor } from '@/utils/scaleMealItem'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type MealWithItems = DietMeal & { items: DietMealItem[] }
type DietTab = DietMenuCategory | 'supplements'

const SHORT_MEAL_LABELS: Record<DietMenuCategory, string> = {
  breakfast: 'Café da manhã',
  morning_snack: 'Lanche da manhã',
  lunch: 'Almoço',
  afternoon_snack: 'Tarde',
  dinner: 'Jantar',
  supper: 'Ceia',
  other: 'Extra',
}

const DEFAULT_NAMES: Record<DietSupplementKind, string> = {
  protein: 'Whey protein',
  hypercaloric: 'Hipercalórico',
}

export function DietPage() {
  const { user, activeProfile } = useSession()
  const [meals, setMeals] = useState<MealWithItems[]>([])
  const [planName, setPlanName] = useState('Minha dieta')
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<DietTab>('breakfast')
  const [videoMeal, setVideoMeal] = useState<MealWithItems | null>(null)
  const [detailMeal, setDetailMeal] = useState<MealWithItems | null>(null)
  const [supplements, setSupplements] = useState<DietSupplement[]>([])
  const [editingKind, setEditingKind] = useState<DietSupplementKind | null>(null)
  const [savingSupplement, setSavingSupplement] = useState(false)
  const [supplementError, setSupplementError] = useState('')
  const [formName, setFormName] = useState('')
  const [formDoses, setFormDoses] = useState('1')
  const [formCalories, setFormCalories] = useState('')
  const [formProtein, setFormProtein] = useState('')
  const [formCarbs, setFormCarbs] = useState('')
  const [formFat, setFormFat] = useState('')
  const [editMeal, setEditMeal] = useState<MealWithItems | null>(null)
  const [dishMultipliers, setDishMultipliers] = useState<Record<string, number>>({})
  const [savingDish, setSavingDish] = useState(false)
  const [dishError, setDishError] = useState('')
  const [dishName, setDishName] = useState('')

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
    const cachedSupplements = loadSupplementCache(activeProfile.id)
    if (cachedSupplements) setSupplements(cachedSupplements)

    dietService.getActivePlan(activeProfile).then((data) => {
      if (!alive) return
      setPlanName(data.plan?.name ?? 'Minha dieta')
      setMeals(data.meals)
      setLoading(false)
    })
    dietService.listSupplements(activeProfile.id).then((items) => {
      if (!alive) return
      setSupplements(items)
    })
    return () => {
      alive = false
    }
  }, [activeProfile?.id])

  const sections = useMemo(() => groupMealsByMenuCategory(meals), [meals])
  const tabs = useMemo(
    () => [
      ...sections.map((section) => ({
        id: section.category as DietTab,
        label: SHORT_MEAL_LABELS[section.category],
      })),
      { id: 'supplements' as const, label: 'Suplementação' },
    ],
    [sections],
  )
  const isSupplementsTab = category === 'supplements'
  const current = isSupplementsTab
    ? null
    : sections.find((section) => section.category === category) ?? sections[0]
  const dishes = current?.meals ?? []

  const supplementCards = useMemo(() => {
    return DIET_SUPPLEMENT_KINDS.map((kind) => {
      const item = supplements.find((row) => row.kind === kind) ?? null
      return { kind, item }
    })
  }, [supplements])

  const supplementDayTotals = useMemo(() => {
    return supplements.reduce(
      (acc, item) => {
        const doses = item.dosesPerDay || 0
        return {
          calories: acc.calories + doses * (item.caloriesPerDose || 0),
          protein: acc.protein + doses * (item.proteinPerDose || 0),
        }
      },
      { calories: 0, protein: 0 },
    )
  }, [supplements])

  const editedDishTotals = useMemo(() => {
    if (!editMeal) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return editMeal.items.reduce(
      (acc, item) => {
        const factor = dishMultipliers[item.id] ?? 1
        return {
          calories: acc.calories + item.calories * factor,
          protein: acc.protein + item.protein * factor,
          carbs: acc.carbs + item.carbs * factor,
          fat: acc.fat + item.fat * factor,
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }, [editMeal, dishMultipliers])

  useEffect(() => {
    if (isSupplementsTab) return
    if (!current || current.meals.length > 0) return
    const first = sections.find((section) => section.meals.length > 0)
    if (first) setCategory(first.category)
  }, [current, sections, isSupplementsTab])

  function openDishEditor(meal: MealWithItems) {
    const next: Record<string, number> = {}
    for (const item of meal.items) next[item.id] = 1
    setDishMultipliers(next)
    setDishName(meal.name)
    setDishError('')
    setEditMeal(meal)
  }

  async function saveDishEdit() {
    if (!user || !activeProfile || !editMeal) return
    setSavingDish(true)
    setDishError('')
    try {
      const nextItems = editMeal.items.map((item) =>
        scaleMealItemByFactor(item, dishMultipliers[item.id] ?? 1),
      )
      const nameChanged = dishName.trim() && dishName.trim() !== editMeal.name
      if (nameChanged) {
        await dietEditorService.updateMeal(editMeal.id, { name: dishName.trim() }, user.id)
      }
      for (let i = 0; i < editMeal.items.length; i += 1) {
        const before = editMeal.items[i]
        const after = nextItems[i]
        const factor = dishMultipliers[before.id] ?? 1
        if (factor === 1) continue
        await dietEditorService.updateItem(
          before.id,
          {
            calories: after.calories,
            protein: after.protein,
            carbs: after.carbs,
            fat: after.fat,
            quantityLabel: after.quantityLabel,
            manualOverride: true,
          },
          user.id,
        )
      }
      const updatedMeal: MealWithItems = {
        ...editMeal,
        name: nameChanged ? dishName.trim() : editMeal.name,
        items: nextItems,
      }
      const nextMeals = meals.map((meal) => (meal.id === updatedMeal.id ? updatedMeal : meal))
      setMeals(nextMeals)
      setDetailMeal(updatedMeal)
      const cached = loadDietCache(activeProfile.id)
      if (cached?.plan) {
        saveDietCache(activeProfile.id, { plan: cached.plan, meals: nextMeals })
      }
      setEditMeal(null)
    } catch (err) {
      setDishError(err instanceof Error ? err.message : 'Não foi possível salvar o prato.')
    } finally {
      setSavingDish(false)
    }
  }

  function openSupplementEditor(kind: DietSupplementKind) {
    const item = supplements.find((row) => row.kind === kind)
    setEditingKind(kind)
    setSupplementError('')
    setFormName(item?.name || DEFAULT_NAMES[kind])
    setFormDoses(String(item?.dosesPerDay ?? 1))
    setFormCalories(item ? String(item.caloriesPerDose) : '')
    setFormProtein(item ? String(item.proteinPerDose) : '')
    setFormCarbs(item && item.carbsPerDose ? String(item.carbsPerDose) : '')
    setFormFat(item && item.fatPerDose ? String(item.fatPerDose) : '')
  }

  async function saveSupplement() {
    if (!user || !activeProfile || !editingKind) return
    const doses = parseLocaleNumber(formDoses)
    const calories = parseLocaleNumber(formCalories)
    const protein = parseLocaleNumber(formProtein)
    const carbs = parseLocaleNumber(formCarbs) ?? 0
    const fat = parseLocaleNumber(formFat) ?? 0
    if (doses == null || doses < 0) {
      setSupplementError('Informe quantas doses você toma por dia.')
      return
    }
    if (calories == null || calories < 0) {
      setSupplementError('Informe as calorias por dose.')
      return
    }
    if (protein == null || protein < 0) {
      setSupplementError('Informe a proteína por dose.')
      return
    }
    setSavingSupplement(true)
    setSupplementError('')
    try {
      const existing = supplements.find((row) => row.kind === editingKind)
      const saved = await dietService.saveSupplement({
        profile: activeProfile,
        userId: user.id,
        kind: editingKind,
        existingId: existing?.id,
        name: formName,
        dosesPerDay: doses,
        caloriesPerDose: calories,
        proteinPerDose: protein,
        carbsPerDose: carbs,
        fatPerDose: fat,
      })
      setSupplements((prev) => {
        const without = prev.filter((row) => row.kind !== editingKind && row.id !== saved.id)
        return [...without, saved]
      })
      setEditingKind(null)
    } catch (err) {
      setSupplementError(err instanceof Error ? err.message : 'Não foi possível salvar o suplemento.')
    } finally {
      setSavingSupplement(false)
    }
  }

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
            {tabs.map((tab) => {
              const selected = tab.id === category
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                    selected ? 'bg-accent text-bg' : 'bg-card2 text-muted',
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {isSupplementsTab ? (
            <>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl">Suplementação</h3>
                  <p className="mt-1 text-sm text-muted">Doses do dia com calorias e proteína.</p>
                </div>
                {supplementDayTotals.calories > 0 || supplementDayTotals.protein > 0 ? (
                  <p className="shrink-0 text-right text-sm text-muted">
                    Total{' '}
                    <span className="font-semibold text-ink">
                      {formatKcal(supplementDayTotals.calories)} · {formatGrams(supplementDayTotals.protein)}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {supplementCards.map(({ kind, item }) => {
                  const doses = item?.dosesPerDay ?? 0
                  const dayCalories = doses * (item?.caloriesPerDose ?? 0)
                  const dayProtein = doses * (item?.proteinPerDose ?? 0)
                  const configured = Boolean(
                    item && (item.dosesPerDay > 0 || item.caloriesPerDose > 0 || item.proteinPerDose > 0),
                  )
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => openSupplementEditor(kind)}
                      className="w-full rounded-[1.75rem] bg-card p-4 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold tracking-widest text-muted uppercase">
                            {DIET_SUPPLEMENT_LABELS[kind]}
                          </p>
                          <p className="mt-1 font-display text-xl leading-tight">
                            {item?.name || DEFAULT_NAMES[kind]}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-accent">Editar</span>
                      </div>
                      {configured ? (
                        <>
                          <p className="mt-3 text-sm text-muted">
                            {doses} {doses === 1 ? 'dose' : 'doses'}/dia ·{' '}
                            {formatKcal(item?.caloriesPerDose ?? 0)} e{' '}
                            {formatGrams(item?.proteinPerDose ?? 0)} por dose
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <MacroChip label="Dia" value={formatKcal(dayCalories)} />
                            <MacroChip label="Prot/dia" value={formatGrams(dayProtein)} />
                          </div>
                        </>
                      ) : (
                        <p className="mt-3 text-sm text-muted">
                          Toque para informar doses, calorias e proteína.
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h3 className="font-display text-xl">
                  {current ? MEAL_LABELS[current.category] : 'Refeição'}
                </h3>
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
                <div className="grid grid-cols-1 gap-3">
                  {dishes.map((meal) => {
                    const totals = mealMacroTotals(meal.items)
                    const preview = meal.items.map((item) => item.foodName).filter(Boolean).join(' · ')
                    return (
                      <button
                        key={meal.id}
                        type="button"
                        onClick={() => setDetailMeal(meal)}
                        className="w-full rounded-[1.75rem] bg-card p-4 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="min-w-0 font-display text-xl leading-tight">
                            {meal.name || current?.label}
                          </h4>
                          <div className="shrink-0 text-right">
                            <p className="font-display text-2xl leading-none text-accent">
                              {Math.round(totals.calories)}
                            </p>
                            <p className="mt-0.5 text-[10px] tracking-[0.14em] text-muted uppercase">kcal</p>
                          </div>
                        </div>
                        {preview ? (
                          <p className="mt-3 line-clamp-2 text-sm leading-snug text-muted">{preview}</p>
                        ) : (
                          <p className="mt-3 text-sm text-muted">Sem alimentos ainda</p>
                        )}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <p className="text-xs text-muted">
                            {meal.items.length === 0
                              ? 'Vazio'
                              : `${meal.items.length} ${meal.items.length === 1 ? 'item' : 'itens'} · Prot ${formatGrams(totals.protein)}`}
                          </p>
                          <span className="text-xs font-semibold text-accent">Ver prato</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
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
      <Modal
        open={Boolean(detailMeal) && !editMeal}
        onClose={() => setDetailMeal(null)}
        title={detailMeal?.name || 'Prato'}
      >
        {detailMeal ? (
          <DishDetail
            meal={detailMeal}
            onEdit={() => openDishEditor(detailMeal)}
            onVideo={() => setVideoMeal(detailMeal)}
          />
        ) : null}
      </Modal>
      <Modal
        open={Boolean(editMeal)}
        onClose={() => !savingDish && setEditMeal(null)}
        title="Editar prato"
      >
        {editMeal ? (
          <>
            <p className="mb-3 text-sm text-muted">
              1,0 = porção atual. Ex.: ovo de 1 para 1,5 ou 2 recalcula calorias e quantidade na dieta.
            </p>
            <label className="mb-4 block text-sm text-muted">
              Nome do prato
              <Input className="mt-1" value={dishName} onChange={(e) => setDishName(e.target.value)} />
            </label>
            <div className="space-y-4">
              {editMeal.items.map((item) => {
                const factor = dishMultipliers[item.id] ?? 1
                const preview = scaleMealItemByFactor(item, factor)
                return (
                  <div key={item.id} className="rounded-2xl bg-card2 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{item.foodName}</p>
                        <p className="mt-0.5 text-sm text-muted">{preview.quantityLabel || item.quantityLabel}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatKcal(preview.calories)}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted tabular-nums">
                      Prot {formatGrams(preview.protein)} · Carbo {formatGrams(preview.carbs)} · Gord{' '}
                      {formatGrams(preview.fat)}
                    </p>
                    <div className="mt-3">
                      <NumberStepper
                        compact
                        value={factor}
                        step={0.5}
                        min={0}
                        suffix="×"
                        onChange={(value) =>
                          setDishMultipliers((prev) => ({
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
            <div className="mt-5 rounded-2xl bg-card2 p-4">
              <p className="text-xs tracking-wide text-muted uppercase">Total do prato</p>
              <p className="mt-1 font-display text-3xl text-accent">{Math.round(editedDishTotals.calories)}</p>
              <p className="text-sm text-muted">kcal</p>
              <p className="mt-2 text-sm text-muted">
                Prot {formatGrams(editedDishTotals.protein)} · Carbo {formatGrams(editedDishTotals.carbs)} · Gord{' '}
                {formatGrams(editedDishTotals.fat)}
              </p>
            </div>
            {dishError ? <p className="mt-3 text-sm text-danger">{dishError}</p> : null}
            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button size="xl" disabled={savingDish} onClick={() => void saveDishEdit()}>
                {savingDish ? 'Salvando…' : 'Salvar no prato'}
              </Button>
              <Button variant="secondary" disabled={savingDish} onClick={() => setEditMeal(null)}>
                Cancelar
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(editingKind)}
        onClose={() => !savingSupplement && setEditingKind(null)}
        title={editingKind ? `Suplemento · ${DIET_SUPPLEMENT_LABELS[editingKind]}` : 'Suplemento'}
      >
        <div className="space-y-3">
          <label className="block text-sm text-muted">
            Nome
            <Input className="mt-1" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex.: Whey Growth" />
          </label>
          <label className="block text-sm text-muted">
            Doses por dia
            <Input className="mt-1" inputMode="decimal" value={formDoses} onChange={(e) => setFormDoses(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-muted">
              Kcal por dose
              <Input className="mt-1" inputMode="decimal" value={formCalories} onChange={(e) => setFormCalories(e.target.value)} />
            </label>
            <label className="block text-sm text-muted">
              Proteína (g)
              <Input className="mt-1" inputMode="decimal" value={formProtein} onChange={(e) => setFormProtein(e.target.value)} />
            </label>
            <label className="block text-sm text-muted">
              Carbo (g)
              <Input className="mt-1" inputMode="decimal" value={formCarbs} onChange={(e) => setFormCarbs(e.target.value)} />
            </label>
            <label className="block text-sm text-muted">
              Gordura (g)
              <Input className="mt-1" inputMode="decimal" value={formFat} onChange={(e) => setFormFat(e.target.value)} />
            </label>
          </div>
          {supplementError ? <p className="text-sm text-danger">{supplementError}</p> : null}
          <Button className="w-full" size="xl" onClick={() => void saveSupplement()} disabled={savingSupplement}>
            {savingSupplement ? 'Salvando…' : 'Salvar suplemento'}
          </Button>
        </div>
      </Modal>
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

function DishDetail({
  meal,
  onEdit,
  onVideo,
}: {
  meal: MealWithItems
  onEdit: () => void
  onVideo: () => void
}) {
  const totals = mealMacroTotals(meal.items)
  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-4xl leading-none text-accent">{Math.round(totals.calories)}</p>
          <p className="mt-1 text-xs tracking-wide text-muted uppercase">kcal no prato</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <MacroChip label="Prot" value={formatGrams(totals.protein)} />
          <MacroChip label="Carbo" value={formatGrams(totals.carbs)} />
          <MacroChip label="Gord" value={formatGrams(totals.fat)} />
        </div>
      </div>

      {meal.items.length === 0 ? (
        <p className="mt-5 text-sm text-muted">Ainda sem alimentos neste prato.</p>
      ) : (
        <ul className="mt-5 divide-y divide-line/80 overflow-hidden rounded-2xl bg-card2">
          {meal.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium">{item.foodName}</p>
                {item.quantityLabel ? <p className="mt-0.5 text-sm text-muted">{item.quantityLabel}</p> : null}
                <p className="mt-1 text-xs text-muted tabular-nums">
                  Prot {formatGrams(item.protein)} · Carbo {formatGrams(item.carbs)} · Gord{' '}
                  {formatGrams(item.fat)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">{formatKcal(item.calories)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2">
        <Button size="xl" onClick={onEdit}>
          Editar prato
        </Button>
        {meal.youtubeUrl ? (
          <Button variant="secondary" onClick={onVideo}>
            Como preparar
          </Button>
        ) : null}
      </div>
    </>
  )
}
